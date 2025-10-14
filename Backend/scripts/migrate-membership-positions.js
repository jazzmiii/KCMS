/**
 * Migration Script: Verify Membership Roles
 * 
 * This script verifies existing membership data structure:
 * - role = 'member' | 'core' | 'vicePresident' | 'secretary' | 'treasurer' | 'leadPR' | 'leadTech' | 'president'
 * 
 * All roles are already in the correct format. This script just verifies the data.
 * 
 * Usage: node scripts/migrate-membership-positions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Membership } = require('../src/modules/club/membership.model');
const { User } = require('../src/modules/auth/user.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kcms';

// Valid roles
const VALID_ROLES = [
  'member',         // Regular member
  'core',           // Generic core member
  'vicePresident',  // Core: VP
  'secretary',      // Core: Secretary
  'treasurer',      // Core: Treasurer
  'leadPR',         // Core: Lead PR
  'leadTech',       // Core: Lead Tech
  'president'       // President (highest)
];

async function verifyMemberships() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all memberships
    const memberships = await Membership.find({});
    console.log(`📊 Found ${memberships.length} memberships\n`);

    let validRoles = 0;
    let invalidRoles = 0;
    const roleCount = {};

    for (const membership of memberships) {
      const role = membership.role;
      
      // Count roles
      roleCount[role] = (roleCount[role] || 0) + 1;

      if (VALID_ROLES.includes(role)) {
        validRoles++;
      } else {
        console.log(`⚠️  Invalid role: ${role} for membership ${membership._id}`);
        invalidRoles++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Verification Summary:');
    console.log('='.repeat(60));
    console.log(`Total memberships: ${memberships.length}`);
    console.log(`✅ Valid roles: ${validRoles}`);
    console.log(`❌ Invalid roles: ${invalidRoles}`);
    console.log('\n📈 Role Distribution:');
    console.log('='.repeat(60));
    
    Object.entries(roleCount).sort((a, b) => b[1] - a[1]).forEach(([role, count]) => {
      const isValid = VALID_ROLES.includes(role);
      const icon = isValid ? '✅' : '❌';
      console.log(`${icon} ${role.padEnd(20)} : ${count}`);
    });
    
    console.log('='.repeat(60));

    if (invalidRoles === 0) {
      console.log('\n✅ All memberships have valid roles!');
      console.log('✅ No migration needed. Structure is correct.');
    } else {
      console.log('\n⚠️  Found invalid roles. Please review the data.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run verification
console.log('🚀 Starting membership role verification...\n');
verifyMemberships()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
