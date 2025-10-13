/**
 * Assign Coordinators to Clubs
 * 
 * This script updates the Club.coordinator field to assign coordinators.
 * This is DIFFERENT from membership roles - the coordinator field is required
 * for the coordinator dashboard to work properly.
 * 
 * Usage:
 *   node scripts/assign-club-coordinators.js
 * 
 * Requirements:
 *   - MongoDB must be running
 *   - Users must exist in database
 *   - Clubs must exist in database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Club } = require('../src/modules/club/club.model');
const { User } = require('../src/modules/auth/user.model');
const { Membership } = require('../src/modules/club/membership.model');

// ===========================================
// CONFIGURATION - EDIT THIS SECTION
// ===========================================

// Define coordinator assignments
// Format: { clubName, coordinatorRollNumber }
const COORDINATOR_ASSIGNMENTS = [
  {
    clubName: 'Recurse Coding Club',
    coordinatorRollNumber: '23bd1a057j', // Replace with actual coordinator roll number
  },
  {
    clubName: 'AALP Music Club',
    coordinatorRollNumber: '23BD1A056P', // Replace with actual coordinator roll number
  },
  // Add more assignments as needed
];

// ===========================================
// SCRIPT LOGIC - DO NOT EDIT BELOW
// ===========================================

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

async function assignCoordinators() {
  console.log('🔄 Starting coordinator assignments...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const assignment of COORDINATOR_ASSIGNMENTS) {
    const { clubName, coordinatorRollNumber } = assignment;
    
    try {
      console.log(`📋 Processing: ${clubName} → ${coordinatorRollNumber}`);

      // Find the club
      const club = await Club.findOne({ name: clubName });
      if (!club) {
        throw new Error(`Club "${clubName}" not found`);
      }

      // Find the user
      const user = await User.findOne({ rollNumber: coordinatorRollNumber });
      if (!user) {
        throw new Error(`User with roll number "${coordinatorRollNumber}" not found`);
      }

      // Update club coordinator field
      club.coordinator = user._id;
      await club.save();

      // Also create/update membership with coordinator role (optional but recommended)
      await Membership.findOneAndUpdate(
        { club: club._id, user: user._id },
        { 
          role: 'president', // Coordinators are typically presidents
          status: 'approved',
          joinedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`   ✅ Successfully assigned ${user.email} as coordinator`);
      console.log(`   📧 User: ${user.rollNumber} (${user.email})`);
      console.log(`   🏢 Club: ${club.name}\n`);
      
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errors.push({ clubName, coordinatorRollNumber, error: error.message });
      errorCount++;
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 ASSIGNMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful assignments: ${successCount}`);
  console.log(`❌ Failed assignments: ${errorCount}`);
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.log('\n⚠️  ERRORS:\n');
    errors.forEach(({ clubName, coordinatorRollNumber, error }) => {
      console.log(`❌ ${clubName} → ${coordinatorRollNumber}`);
      console.log(`   Error: ${error}\n`);
    });
  }

  console.log('\n💡 Next steps:');
  console.log('   1. Coordinators can now log in');
  console.log('   2. They will see their assigned clubs in the dashboard');
  console.log('   3. They can approve events for their clubs\n');
}

async function main() {
  try {
    await connectDatabase();
    await assignCoordinators();
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

// Run the script
main();
