/**
 * Fix Aalap Club - Restore to Active Status
 * Run this script to restore the club that disappeared after admin edit
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/KCMS';

async function fixAalapClub() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Club model
    const Club = mongoose.model('Club', new mongoose.Schema({
      name: String,
      status: String,
      pendingSettings: mongoose.Schema.Types.Mixed
    }));

    // Find Aalap club (case insensitive)
    console.log('🔍 Searching for Aalap club...');
    const club = await Club.findOne({ 
      name: { $regex: /aalap/i } 
    });

    if (!club) {
      console.log('❌ Aalap club not found!');
      console.log('   Searching all clubs with pending_approval status...\n');
      
      const pendingClubs = await Club.find({ status: 'pending_approval' });
      
      if (pendingClubs.length === 0) {
        console.log('   No clubs found with pending_approval status');
      } else {
        console.log(`   Found ${pendingClubs.length} club(s) with pending_approval status:`);
        pendingClubs.forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name} (ID: ${c._id})`);
        });
        
        console.log('\n💡 To fix a specific club, update the script with the correct club ID');
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('✅ Found club:');
    console.log(`   Name: ${club.name}`);
    console.log(`   ID: ${club._id}`);
    console.log(`   Current Status: ${club.status}`);
    console.log(`   Pending Settings: ${club.pendingSettings ? JSON.stringify(club.pendingSettings) : 'None'}\n`);

    // Check if status is not active
    if (club.status !== 'active') {
      console.log('🔧 Fixing club status...');
      
      // Apply pending settings if they exist
      if (club.pendingSettings) {
        console.log('   Applying pending settings...');
        Object.assign(club, club.pendingSettings);
        club.pendingSettings = undefined;
      }
      
      // Set status to active
      club.status = 'active';
      
      await club.save();
      
      console.log('✅ Club fixed successfully!');
      console.log(`   New Status: ${club.status}`);
      console.log(`   Pending Settings: None\n`);
    } else {
      console.log('✅ Club status is already active - no fix needed!\n');
    }

    // Verify the club appears in active clubs list
    console.log('🔍 Verifying club appears in active clubs list...');
    const activeClubs = await Club.find({ status: 'active' });
    const isVisible = activeClubs.some(c => c._id.toString() === club._id.toString());
    
    if (isVisible) {
      console.log('✅ Club is now visible in active clubs list!\n');
    } else {
      console.log('⚠️  Warning: Club might still not be visible\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All done! Club should now be visible in the frontend.');
    console.log('   Refresh your clubs page to see it.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the fix
fixAalapClub();
