// Fix clubs in database - Set all clubs to active status
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/KCMS';

async function fixClubs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Club = mongoose.model('Club', new mongoose.Schema({}, { strict: false }));

    // Check current clubs
    const allClubs = await Club.find({});
    console.log(`\n📊 Found ${allClubs.length} clubs in database`);

    if (allClubs.length === 0) {
      console.log('❌ No clubs found in database!');
      console.log('💡 You need to import clubs first.');
      process.exit(0);
    }

    // Show current status
    console.log('\n📋 Current clubs:');
    allClubs.forEach((club, i) => {
      console.log(`${i + 1}. ${club.name} - Status: ${club.status || 'NOT SET'} - Category: ${club.category || 'NOT SET'}`);
    });

    // Update all clubs to active status
    const result = await Club.updateMany(
      {},
      { 
        $set: { 
          status: 'active',
          // Ensure category exists (set to 'cultural' if missing)
          $setOnInsert: { category: 'cultural' }
        } 
      }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} clubs to status: 'active'`);

    // Fix missing categories
    const clubsWithoutCategory = await Club.find({ category: { $exists: false } });
    if (clubsWithoutCategory.length > 0) {
      console.log(`\n⚠️  Found ${clubsWithoutCategory.length} clubs without category`);
      await Club.updateMany(
        { category: { $exists: false } },
        { $set: { category: 'cultural' } }
      );
      console.log('✅ Set default category to "cultural"');
    }

    // Show updated clubs
    const updatedClubs = await Club.find({});
    console.log('\n✅ Updated clubs:');
    updatedClubs.forEach((club, i) => {
      console.log(`${i + 1}. ${club.name} - Status: ${club.status} - Category: ${club.category}`);
    });

    console.log('\n🎉 All clubs are now active and should appear on the website!');
    console.log('\n💡 Refresh your browser to see the clubs.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixClubs();
