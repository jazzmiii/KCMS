// Script to sync Membership records to User.roles.scoped
// Run this once to fix existing data after the recruitment.service.js fix

const mongoose = require('mongoose');
const config = require('../config');

// Import models
const { User } = require('../src/modules/auth/user.model');
const { Membership } = require('../src/modules/club/membership.model');
const { Club } = require('../src/modules/club/club.model');

async function syncMembershipsToRoles() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected!\n');

    // Get all approved memberships
    const memberships = await Membership.find({ status: 'approved' })
      .populate('user', 'email profile.name roles')
      .populate('club', 'name');

    console.log(`📋 Found ${memberships.length} approved memberships\n`);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const membership of memberships) {
      const user = await User.findById(membership.user._id);
      
      if (!user) {
        console.log(`⚠️  Skipping: User ${membership.user._id} not found`);
        skippedCount++;
        continue;
      }

      // Check if role already exists in user.roles.scoped
      const hasRole = user.roles.scoped.some(
        sr => sr.club.toString() === membership.club._id.toString()
      );

      if (hasRole) {
        console.log(`⏭️  Skipping ${user.email} - Already has role in ${membership.club.name}`);
        skippedCount++;
        continue;
      }

      // Add role to user.roles.scoped
      user.roles.scoped.push({
        club: membership.club._id,
        role: membership.role
      });

      await user.save();
      console.log(`✅ Synced ${user.email} → ${membership.role} in ${membership.club.name}`);
      syncedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Synced: ${syncedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📋 Total: ${memberships.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
syncMembershipsToRoles();
