/**
 * Export Database to JSON Files
 * 
 * This script exports all collections to JSON files in the Database/ folder.
 * Useful for sharing database state with teammates.
 * 
 * Usage:
 *   node scripts/export-database.js
 * 
 * Requirements:
 *   - MongoDB must be running and connected
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATABASE_DIR = path.join(__dirname, '..', '..', 'Database');

// Import models
const { Club } = require('../src/modules/club/club.model');
const { Membership } = require('../src/modules/club/membership.model');
const { User } = require('../src/modules/auth/user.model');
const { Event } = require('../src/modules/event/event.model');

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/KCMS', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Convert MongoDB documents to JSON format with $oid and $date
function convertToMongoExtendedJSON(doc) {
  const converted = {};
  
  for (let key in doc) {
    const value = doc[key];
    
    if (key === '_id' || (value && value.constructor && value.constructor.name === 'ObjectId')) {
      converted[key] = { $oid: value.toString() };
    } else if (value instanceof Date) {
      converted[key] = { $date: value.toISOString() };
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Handle nested ObjectIds
      const nested = {};
      for (let nestedKey in value) {
        if (value[nestedKey] && value[nestedKey].constructor && value[nestedKey].constructor.name === 'ObjectId') {
          nested[nestedKey] = { $oid: value[nestedKey].toString() };
        } else {
          nested[nestedKey] = value[nestedKey];
        }
      }
      converted[key] = nested;
    } else {
      converted[key] = value;
    }
  }
  
  return converted;
}

async function exportCollection(Model, filename, label) {
  try {
    console.log(`📤 Exporting ${label}...`);
    
    const docs = await Model.find({}).lean();
    const converted = docs.map(doc => convertToMongoExtendedJSON(doc));
    
    const filepath = path.join(DATABASE_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(converted, null, 2));
    
    console.log(`   ✅ Exported ${docs.length} ${label} to ${filename}\n`);
    return docs.length;
  } catch (error) {
    console.error(`   ❌ Error exporting ${label}:`, error.message);
    return 0;
  }
}

async function exportDatabase() {
  console.log('🔄 Starting database export...\n');
  
  // Ensure Database directory exists
  if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
    console.log('📁 Created Database directory\n');
  }

  const stats = {
    clubs: 0,
    users: 0,
    memberships: 0,
    events: 0
  };

  // Export collections
  stats.clubs = await exportCollection(Club, 'KCMS.clubs.json', 'clubs');
  stats.users = await exportCollection(User, 'KCMS.users.json', 'users');
  stats.memberships = await exportCollection(Membership, 'KCMS.memberships.json', 'memberships');
  
  // Try to export events if model exists
  try {
    stats.events = await exportCollection(Event, 'KCMS.events.json', 'events');
  } catch (error) {
    console.log('   ℹ️  Events collection not available\n');
  }

  // Export notifications and sessions if needed
  try {
    const Notification = mongoose.model('Notification');
    await exportCollection(Notification, 'KCMS.notifications.json', 'notifications');
  } catch (error) {
    console.log('   ℹ️  Notifications collection not available\n');
  }

  try {
    const Session = mongoose.model('Session');
    await exportCollection(Session, 'KCMS.sessions.json', 'sessions');
  } catch (error) {
    console.log('   ℹ️  Sessions collection not available\n');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 EXPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Clubs exported: ${stats.clubs}`);
  console.log(`✅ Users exported: ${stats.users}`);
  console.log(`✅ Memberships exported: ${stats.memberships}`);
  console.log(`✅ Events exported: ${stats.events}`);
  console.log('='.repeat(60));
  console.log(`\n📁 Files saved to: ${DATABASE_DIR}\n`);
  
  console.log('💡 Next steps:');
  console.log('   1. Commit the exported JSON files to Git');
  console.log('   2. Push to remote repository');
  console.log('   3. Teammates can pull and run: node import-database.js\n');
  
  console.log('📝 Example Git commands:');
  console.log('   git add Database/*.json');
  console.log('   git commit -m "Update database snapshot"');
  console.log('   git push\n');
}

async function main() {
  try {
    await connectDatabase();
    await exportDatabase();
  } catch (error) {
    console.error('❌ Export error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

// Run the script
main();
