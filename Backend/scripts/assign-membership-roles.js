/**
 * Membership Role Assignment Script
 * 
 * This script allows you to assign roles (president, core, member, etc.) to users in a club.
 * Useful for:
 * - Promoting recruits to president or core team positions
 * - Batch role assignments
 * - Initial club setup
 * 
 * Usage:
 *   node scripts/assign-membership-roles.js
 * 
 * Requirements:
 * - Backend server must be running with MongoDB connected
 * - Users must already exist in the database
 * - Club must already exist in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Membership } = require('../src/modules/club/membership.model');
const { Club } = require('../src/modules/club/club.model');
const { User } = require('../src/modules/auth/user.model');

// ===========================================
// CONFIGURATION - EDIT THIS SECTION
// ===========================================

// Define the role assignments you want to make
const ROLE_ASSIGNMENTS = [
  {
    clubName: 'Recurse Coding Club', // Name of the club
    assignments: [
      {
        userRollNumber: '23bd1a057t', // Student roll number
        role: 'president', // Role: 'president', 'vicePresident', 'secretary', 'treasurer', 'core', 'member', 'leadPR', 'leadTech'
        status: 'approved' // Status: 'approved', 'applied', 'rejected'
      },
      // Add more assignments here
      // {
      //   userRollNumber: '23bd1a05b4',
      //   role: 'core',
      //   status: 'approved'
      // },
    ]
  },
  // Add more clubs here
  // {
  //   clubName: 'AALP Music Club',
  //   assignments: [
  //     {
  //       userRollNumber: '23bd1a057j',
  //       role: 'president',
  //       status: 'approved'
  //     }
  //   ]
  // }
];

// ===========================================
// SCRIPT LOGIC - DO NOT EDIT BELOW
// ===========================================

const VALID_ROLES = ['member', 'core', 'president', 'vicePresident', 'secretary', 'treasurer', 'leadPR', 'leadTech'];
const VALID_STATUSES = ['applied', 'approved', 'rejected'];

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/KCMS', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function validateAndAssignRoles() {
  console.log('\n🔄 Starting membership role assignment...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const clubConfig of ROLE_ASSIGNMENTS) {
    console.log(`\n📋 Processing club: ${clubConfig.clubName}`);
    
    // Find club
    const club = await Club.findOne({ name: clubConfig.clubName });
    if (!club) {
      const error = `❌ Club not found: ${clubConfig.clubName}`;
      console.error(error);
      errors.push(error);
      errorCount++;
      continue;
    }
    console.log(`✅ Found club: ${club.name} (ID: ${club._id})`);

    // Process each assignment
    for (const assignment of clubConfig.assignments) {
      try {
        // Validate role
        if (!VALID_ROLES.includes(assignment.role)) {
          throw new Error(`Invalid role: ${assignment.role}. Valid roles: ${VALID_ROLES.join(', ')}`);
        }

        // Validate status
        if (!VALID_STATUSES.includes(assignment.status)) {
          throw new Error(`Invalid status: ${assignment.status}. Valid statuses: ${VALID_STATUSES.join(', ')}`);
        }

        // Find user
        const user = await User.findOne({ rollNumber: assignment.userRollNumber });
        if (!user) {
          throw new Error(`User not found with roll number: ${assignment.userRollNumber}`);
        }

        // Check if membership already exists
        const existingMembership = await Membership.findOne({
          club: club._id,
          user: user._id
        });

        if (existingMembership) {
          // Update existing membership
          existingMembership.role = assignment.role;
          existingMembership.status = assignment.status;
          await existingMembership.save();
          
          console.log(`  ✅ Updated: ${user.profile?.name || user.email} (${assignment.userRollNumber})`);
          console.log(`     Role: ${existingMembership.role} | Status: ${existingMembership.status}`);
        } else {
          // Create new membership
          const membership = await Membership.create({
            club: club._id,
            user: user._id,
            role: assignment.role,
            status: assignment.status
          });
          
          console.log(`  ✅ Created: ${user.profile?.name || user.email} (${assignment.userRollNumber})`);
          console.log(`     Role: ${membership.role} | Status: ${membership.status}`);
        }

        successCount++;
      } catch (error) {
        const errorMsg = `  ❌ Error for ${assignment.userRollNumber}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    // Update club member count
    const memberCount = await Membership.countDocuments({ 
      club: club._id, 
      status: 'approved' 
    });
    club.memberCount = memberCount;
    await club.save();
    console.log(`✅ Updated club member count: ${memberCount}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ASSIGNMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful assignments: ${successCount}`);
  console.log(`❌ Failed assignments: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    errors.forEach(err => console.log(err));
  }
  
  console.log('='.repeat(60) + '\n');
}

async function main() {
  try {
    await connectDatabase();
    await validateAndAssignRoles();
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

// Run the script
main();
