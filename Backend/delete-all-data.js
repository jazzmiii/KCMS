// Delete ALL data from MongoDB (use before importing)
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/KCMS';

async function deleteAllData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    console.log('📊 Current database contents:');
    for (let collection of collections) {
      const count = await collection.countDocuments();
      console.log(`   - ${collection.collectionName}: ${count} documents`);
    }

    console.log('\n⚠️  WARNING: This will delete ALL data from ALL collections!');
    console.log('This includes:');
    console.log('   - All clubs');
    console.log('   - All users');
    console.log('   - All memberships');
    console.log('   - All sessions');
    console.log('   - All notifications');
    console.log('   - All events');
    console.log('   - All recruitments');
    console.log('   - Everything else\n');

    console.log('🗑️  Deleting all data...\n');

    let totalDeleted = 0;
    for (let collection of collections) {
      const result = await collection.deleteMany({});
      console.log(`   ✅ Deleted ${result.deletedCount} documents from ${collection.collectionName}`);
      totalDeleted += result.deletedCount;
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`🎯 Total deleted: ${totalDeleted} documents`);
    console.log('═══════════════════════════════════════\n');
    console.log('💡 Database is now empty and ready for import.');
    console.log('   Run: node import-database.js\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Delete failed:', error);
    process.exit(1);
  }
}

deleteAllData();
