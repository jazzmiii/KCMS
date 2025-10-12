/**
 * Automated Backup Worker
 * Handles daily, weekly, and monthly database backups
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

const execAsync = promisify(exec);

// Backup configuration
const BACKUP_CONFIG = {
  daily: {
    enabled: true,
    retention: 7, // Keep last 7 daily backups
    schedule: '0 2 * * *', // 2 AM daily
  },
  weekly: {
    enabled: true,
    retention: 4, // Keep last 4 weekly backups
    schedule: '0 3 * * 0', // 3 AM every Sunday
  },
  monthly: {
    enabled: true,
    retention: 12, // Keep last 12 monthly backups
    schedule: '0 4 1 * *', // 4 AM on 1st of each month
  }
};

/**
 * Get MongoDB connection details from URI
 */
function parseMongoUri(uri) {
  const url = new URL(uri);
  return {
    host: url.hostname,
    port: url.port || '27017',
    database: url.pathname.substring(1),
    username: url.username,
    password: url.password
  };
}

/**
 * Create backup directory if it doesn't exist
 */
async function ensureBackupDir(backupDir) {
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
  }
}

/**
 * Perform MongoDB backup using mongodump
 * @param {string} type - Backup type: 'daily', 'weekly', or 'monthly'
 */
async function performBackup(type = 'daily') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupName = `${type}-backup-${timestamp}`;
  const backupDir = path.join(process.cwd(), 'backups', type, backupName);

  try {
    console.log(`📦 Starting ${type} backup: ${backupName}`);
    
    await ensureBackupDir(backupDir);
    
    const mongoUri = config.MONGODB_URI;
    const { database, username, password, host, port } = parseMongoUri(mongoUri);
    
    // Build mongodump command
    let cmd = `mongodump --host=${host} --port=${port} --db=${database} --out="${backupDir}"`;
    
    if (username && password) {
      cmd += ` --username="${username}" --password="${password}" --authenticationDatabase=admin`;
    }
    
    // Execute backup
    const { stdout, stderr } = await execAsync(cmd);
    
    if (stderr && !stderr.includes('done dumping')) {
      console.error('Backup stderr:', stderr);
    }
    
    console.log(`✅ ${type} backup completed: ${backupName}`);
    console.log(stdout);
    
    // Compress backup (optional)
    await compressBackup(backupDir);
    
    // Clean old backups
    await cleanOldBackups(type, BACKUP_CONFIG[type].retention);
    
    return {
      success: true,
      type,
      name: backupName,
      path: backupDir,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`❌ ${type} backup failed:`, error.message);
    throw error;
  }
}

/**
 * Compress backup directory to tar.gz
 */
async function compressBackup(backupDir) {
  try {
    const tarFile = `${backupDir}.tar.gz`;
    await execAsync(`tar -czf "${tarFile}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`);
    
    // Remove uncompressed directory
    await fs.rm(backupDir, { recursive: true, force: true });
    
    console.log(`🗜️  Backup compressed: ${tarFile}`);
    return tarFile;
  } catch (error) {
    console.error('Compression failed:', error.message);
    // Continue even if compression fails
  }
}

/**
 * Clean old backups beyond retention period
 */
async function cleanOldBackups(type, retention) {
  try {
    const backupsDir = path.join(process.cwd(), 'backups', type);
    const files = await fs.readdir(backupsDir);
    
    // Filter backup files/dirs
    const backups = files
      .filter(f => f.startsWith(`${type}-backup-`))
      .map(f => ({
        name: f,
        path: path.join(backupsDir, f),
        timestamp: f.split('-').slice(-3).join('-')
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    // Remove old backups
    if (backups.length > retention) {
      const toDelete = backups.slice(retention);
      
      for (const backup of toDelete) {
        try {
          const stats = await fs.stat(backup.path);
          if (stats.isDirectory()) {
            await fs.rm(backup.path, { recursive: true, force: true });
          } else {
            await fs.unlink(backup.path);
          }
          console.log(`🗑️  Deleted old backup: ${backup.name}`);
        } catch (err) {
          console.error(`Failed to delete ${backup.name}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error('Cleanup failed:', error.message);
  }
}

/**
 * Get backup statistics
 */
async function getBackupStats() {
  const stats = {};
  
  for (const type of ['daily', 'weekly', 'monthly']) {
    try {
      const backupsDir = path.join(process.cwd(), 'backups', type);
      const files = await fs.readdir(backupsDir);
      const backups = files.filter(f => f.startsWith(`${type}-backup-`));
      
      let totalSize = 0;
      for (const file of backups) {
        const filePath = path.join(backupsDir, file);
        const stat = await fs.stat(filePath);
        totalSize += stat.size;
      }
      
      stats[type] = {
        count: backups.length,
        totalSize,
        latestBackup: backups.length > 0 ? backups.sort().pop() : null
      };
    } catch {
      stats[type] = { count: 0, totalSize: 0, latestBackup: null };
    }
  }
  
  return stats;
}

/**
 * Restore from backup
 * @param {string} backupPath - Path to backup directory or tar.gz
 */
async function restoreBackup(backupPath) {
  try {
    console.log(`🔄 Restoring backup from: ${backupPath}`);
    
    let restoreDir = backupPath;
    
    // Extract if compressed
    if (backupPath.endsWith('.tar.gz')) {
      const extractDir = backupPath.replace('.tar.gz', '');
      await execAsync(`tar -xzf "${backupPath}" -C "${path.dirname(backupPath)}"`);
      restoreDir = extractDir;
    }
    
    const mongoUri = config.MONGODB_URI;
    const { database, username, password, host, port } = parseMongoUri(mongoUri);
    
    // Build mongorestore command
    let cmd = `mongorestore --host=${host} --port=${port} --db=${database} --drop "${path.join(restoreDir, database)}"`;
    
    if (username && password) {
      cmd += ` --username="${username}" --password="${password}" --authenticationDatabase=admin`;
    }
    
    const { stdout, stderr } = await execAsync(cmd);
    
    console.log(`✅ Backup restored successfully`);
    console.log(stdout);
    
    return { success: true, stdout };
  } catch (error) {
    console.error(`❌ Restore failed:`, error.message);
    throw error;
  }
}

/**
 * Start backup scheduler
 */
function startBackupScheduler() {
  const cron = require('node-cron');
  
  console.log('🚀 Backup scheduler started');
  
  // Daily backups
  if (BACKUP_CONFIG.daily.enabled) {
    cron.schedule(BACKUP_CONFIG.daily.schedule, () => {
      performBackup('daily').catch(console.error);
    });
    console.log(`   Daily backups: ${BACKUP_CONFIG.daily.schedule}`);
  }
  
  // Weekly backups
  if (BACKUP_CONFIG.weekly.enabled) {
    cron.schedule(BACKUP_CONFIG.weekly.schedule, () => {
      performBackup('weekly').catch(console.error);
    });
    console.log(`   Weekly backups: ${BACKUP_CONFIG.weekly.schedule}`);
  }
  
  // Monthly backups
  if (BACKUP_CONFIG.monthly.enabled) {
    cron.schedule(BACKUP_CONFIG.monthly.schedule, () => {
      performBackup('monthly').catch(console.error);
    });
    console.log(`   Monthly backups: ${BACKUP_CONFIG.monthly.schedule}`);
  }
}

module.exports = {
  performBackup,
  cleanOldBackups,
  getBackupStats,
  restoreBackup,
  startBackupScheduler
};
