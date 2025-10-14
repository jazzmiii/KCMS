// scripts/cleanup-coordinator-memberships.js
// Clean up any coordinator/admin users who have club memberships
// Run: node scripts/cleanup-coordinator-memberships.js

const mongoose = require('mongoose');
const { User } = require('../src/modules/auth/user.model');
const { Membership } = require('../src/modules/club/membership.model');
const { Club } = require('../src/modules/club/club.model');
require('dotenv').config();

async function cleanupCoordinatorMemberships() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all coordinators and admins
    const systemUsers = await User.find({
      'roles.global': { $in: ['coordinator', 'admin'] }
    });

    console.log(`📊 Found ${systemUsers.length} coordinator/admin users\n`);

    let totalRemoved = 0;

    for (const user of systemUsers) {
      const memberships = await Membership.find({ user: user._id }).populate('club', 'name');
      
      if (memberships.length > 0) {
        console.log(`🔧 Processing: ${user.email} (${user.roles.global})`);
        console.log(`   Removing ${memberships.length} club membership(s):`);
        
        for (const membership of memberships) {
          console.log(`   - ${membership.club?.name || 'Unknown Club'} (${membership.role})`);
        }
        
        await Membership.deleteMany({ user: user._id });
        totalRemoved += memberships.length;
        console.log(`   ✅ Memberships removed\n`);
      }
    }

    console.log('─'.repeat(50));
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Total memberships removed: ${totalRemoved}`);
    
    // Verify clubs have coordinators assigned
    console.log('\n📊 Verifying club coordinators...');
    const clubsWithoutCoordinator = await Club.find({ coordinator: { $exists: false } });
    
    if (clubsWithoutCoordinator.length > 0) {
      console.log(`⚠️  WARNING: ${clubsWithoutCoordinator.length} clubs have NO coordinator assigned:`);
      for (const club of clubsWithoutCoordinator) {
        console.log(`   - ${club.name} (ID: ${club._id})`);
      }
      console.log('\n   These clubs need coordinator assignment via Admin Dashboard!');
    } else {
      console.log('✅ All clubs have coordinators assigned');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupCoordinatorMemberships();
