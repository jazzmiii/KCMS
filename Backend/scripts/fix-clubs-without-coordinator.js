// scripts/fix-clubs-without-coordinator.js
// Fix clubs that don't have a coordinator assigned
// Run: node scripts/fix-clubs-without-coordinator.js

const mongoose = require('mongoose');
const { Club } = require('../src/modules/club/club.model');
const { User } = require('../src/modules/auth/user.model');
require('dotenv').config();

async function fixClubsWithoutCoordinator() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find clubs without coordinator
    const clubsWithoutCoordinator = await Club.find({
      $or: [
        { coordinator: { $exists: false } },
        { coordinator: null }
      ]
    });

    console.log(`📊 Clubs without coordinator field: ${clubsWithoutCoordinator.length}`);

    // ✅ NEW: Check for orphaned coordinator references (coordinator ID exists but user doesn't)
    const allClubs = await Club.find({ status: 'active' });
    const orphanedClubs = [];

    console.log(`\n🔍 Checking ${allClubs.length} clubs for orphaned coordinator references...\n`);

    for (const club of allClubs) {
      if (club.coordinator) {
        const coordinatorExists = await User.findById(club.coordinator);
        if (!coordinatorExists) {
          orphanedClubs.push({
            club: club,
            orphanedCoordinatorId: club.coordinator
          });
          console.log(`⚠️  ${club.name} → coordinator ID exists (${club.coordinator}) but user NOT FOUND in database`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total clubs: ${allClubs.length}`);
    console.log(`   Clubs without coordinator field: ${clubsWithoutCoordinator.length}`);
    console.log(`   Clubs with orphaned coordinator: ${orphanedClubs.length}`);
    console.log(`   Healthy clubs: ${allClubs.length - clubsWithoutCoordinator.length - orphanedClubs.length}\n`);

    if (clubsWithoutCoordinator.length === 0 && orphanedClubs.length === 0) {
      console.log('✅ All clubs have valid coordinators assigned!');
      process.exit(0);
    }

    // Get list of available coordinators
    const coordinators = await User.find({ 
      'roles.global': 'coordinator' 
    }).select('email profile.name');

    const admins = await User.find({ 
      'roles.global': 'admin' 
    }).select('email profile.name');

    console.log(`📋 Available Coordinators (${coordinators.length}):`);
    coordinators.forEach((coord, idx) => {
      console.log(`   ${idx + 1}. ${coord.email} - ${coord.profile?.name || 'No Name'} (ID: ${coord._id})`);
    });

    console.log(`\n📋 Available Admins (${admins.length}) - Can also be assigned:`);
    admins.forEach((admin, idx) => {
      console.log(`   ${idx + 1}. ${admin.email} - ${admin.profile?.name || 'No Name'} (ID: ${admin._id})`);
    });

    // Show clubs without coordinator field
    if (clubsWithoutCoordinator.length > 0) {
      console.log('\n⚠️  CLUBS WITHOUT COORDINATOR FIELD:\n');
      
      for (const club of clubsWithoutCoordinator) {
        console.log(`❌ ${club.name} (ID: ${club._id})`);
        console.log(`   Category: ${club.category}`);
        console.log(`   Status: ${club.status}`);
        console.log(`   Created: ${club.createdAt}`);
        console.log(`   → Needs coordinator assignment via Admin Dashboard\n`);
      }
    }

    // Show clubs with orphaned coordinators
    if (orphanedClubs.length > 0) {
      console.log('\n🔴 CLUBS WITH ORPHANED COORDINATOR REFERENCES:\n');
      
      for (const item of orphanedClubs) {
        const club = item.club;
        console.log(`❌ ${club.name} (ID: ${club._id})`);
        console.log(`   Category: ${club.category}`);
        console.log(`   Status: ${club.status}`);
        console.log(`   ⚠️  Orphaned Coordinator ID: ${item.orphanedCoordinatorId}`);
        console.log(`   ❌ This user does NOT exist in the database`);
        console.log(`   → Must reassign to a valid coordinator\n`);
      }
    }

    console.log('─'.repeat(60));
    console.log('\n📝 TO FIX THESE CLUBS:\n');
    console.log('Option 1 - Via Admin Dashboard (Recommended):');
    console.log('  1. Login as Admin');
    console.log('  2. Go to Clubs page');
    console.log('  3. Click "Edit" on each club');
    console.log('  4. Select a Faculty Coordinator');
    console.log('  5. Save changes\n');

    console.log('Option 2 - Via Database (Quick):');
    console.log('  Run this MongoDB command for each club:\n');
    console.log('  db.clubs.updateOne(');
    console.log('    { _id: ObjectId("<club-id>") },');
    console.log('    { $set: { coordinator: ObjectId("<coordinator-id>") } }');
    console.log('  )\n');

    console.log('Option 3 - Automated Assignment (Default Coordinator):');
    console.log('  Set AUTO_FIX=true environment variable to auto-assign\n');
    console.log('  Example: AUTO_FIX=true node scripts/fix-clubs-without-coordinator.js\n');

    // ✅ AUTO-FIX: Assign first available coordinator to all broken clubs
    // For PowerShell: $env:AUTO_FIX="true"; node scripts/fix-clubs-without-coordinator.js
    const AUTO_FIX = process.env.AUTO_FIX === 'true';
    
    if (AUTO_FIX) {
      if (coordinators.length === 0 && admins.length === 0) {
        console.log('❌ Cannot auto-fix: No coordinators or admins found!');
        console.log('   Create coordinator users first.');
        process.exit(1);
      }

      const defaultCoordinator = coordinators.length > 0 ? coordinators[0] : admins[0];
      const clubsToFix = [...clubsWithoutCoordinator, ...orphanedClubs.map(o => o.club)];
      
      console.log('─'.repeat(60));
      console.log(`\n🔧 AUTO-FIX MODE ENABLED`);
      console.log(`   Assigning coordinator: ${defaultCoordinator.email} (${defaultCoordinator.profile?.name || 'No Name'})`);
      console.log(`   Clubs to fix: ${clubsToFix.length}\n`);
      
      for (const club of clubsToFix) {
        await Club.findByIdAndUpdate(club._id, {
          $set: { coordinator: defaultCoordinator._id }
        });
        console.log(`✅ Fixed: ${club.name} → ${defaultCoordinator.email}`);
      }
      
      console.log(`\n✅ Successfully fixed ${clubsToFix.length} clubs!`);
      console.log(`   All clubs assigned to: ${defaultCoordinator.email}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixClubsWithoutCoordinator();
