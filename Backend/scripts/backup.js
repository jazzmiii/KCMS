#!/usr/bin/env node
/**
 * Automated Database Backup Script
 * Run manually: node scripts/backup.js
 * Or schedule with cron: 0 2 * * * /usr/bin/node /path/to/scripts/backup.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
require('dotenv').config();

const execAsync = util.promisify(exec);

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;

/**
 * Extract database name from MongoDB URI
 */
function getDatabaseName(uri) {
  const match = uri.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'KCMS';
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Generate backup filename with timestamp
 */
function getBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  return `kcms-backup-${timestamp}-${time}`;
}

/**
 * Perform MongoDB backup using mongodump
 */
async function performBackup() {
  const dbName = getDatabaseName(MONGODB_URI);
  const backupName = getBackupFileName();
  const backupPath = path.join(BACKUP_DIR, backupName);

  console.log('🔄 Starting database backup...');
  console.log(`   Database: ${dbName}`);
  console.log(`   Destination: ${backupPath}`);

  try {
    // Using mongodump command
    const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('done dumping')) {
      console.error('Backup warnings:', stderr);
    }

    console.log('✅ Backup completed successfully!');
    console.log(`   Location: ${backupPath}`);
    
    // Compress backup
    await compressBackup(backupPath);
    
    return backupPath;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

/**
 * Compress backup using tar
 */
async function compressBackup(backupPath) {
  try {
    const tarFile = `${backupPath}.tar.gz`;
    const command = `tar -czf "${tarFile}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`;
    
    await execAsync(command);
    
    // Remove uncompressed directory
    fs.rmSync(backupPath, { recursive: true, force: true });
    
    const stats = fs.statSync(tarFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Backup compressed: ${tarFile} (${sizeMB} MB)`);
  } catch (error) {
    console.warn('⚠️  Compression failed (backup still available uncompressed):', error.message);
  }
}

/**
 * Clean up old backups based on retention policy
 */
function cleanOldBackups() {
  console.log('🔄 Cleaning old backups...');
  
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  
  let deletedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;
    
    if (age > retentionMs) {
      fs.rmSync(filePath, { recursive: true, force: true });
      deletedCount++;
      console.log(`   Deleted old backup: ${file}`);
    }
  });
  
  if (deletedCount === 0) {
    console.log('   No old backups to delete');
  } else {
    console.log(`✅ Cleaned ${deletedCount} old backup(s)`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   KMIT CLUBS HUB - DATABASE BACKUP');
  console.log('═══════════════════════════════════════\n');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }
  
  try {
    ensureBackupDir();
    await performBackup();
    cleanOldBackups();
    
    console.log('\n✅ Backup process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Backup process failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { performBackup, cleanOldBackups };
