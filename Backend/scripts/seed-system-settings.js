/**
 * System Settings Seeder
 * 
 * Creates default system settings if none exist
 * 
 * Usage: node scripts/seed-system-settings.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { SystemSettings } = require('../src/modules/settings/settings.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kcms';

async function seedSettings() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if settings already exist
    const existing = await SystemSettings.findOne();
    
    if (existing) {
      console.log('⚠️  System settings already exist!');
      console.log('📋 Current settings:');
      console.log(JSON.stringify(existing, null, 2));
      console.log('\n✅ No changes made. Use the API to update settings.');
      return;
    }

    // Create default settings
    console.log('📝 Creating default system settings...');
    
    const settings = await SystemSettings.create({
      recruitment: {
        enabled: true,
        maxApplicationsPerStudent: 3,
        allowCrossYearRecruitment: true,
        requireApprovalForMultipleClubs: false,
        autoApproveThreshold: 0
      },
      events: {
        maxEventsPerClubPerMonth: 5,
        budgetLimits: {
          technical: 10000,
          cultural: 8000,
          sports: 12000,
          social: 5000,
          academic: 7000,
          default: 5000
        },
        requireCoordinatorApproval: true,
        autoPublishThreshold: 5000,
        requireAdminApprovalThreshold: 5000,
        guestSpeakerApprovalRequired: true
      },
      fileUploads: {
        maxFileSizes: {
          image: 5242880, // 5MB
          document: 10485760, // 10MB
          video: 104857600 // 100MB
        },
        allowedFormats: {
          image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
          video: ['mp4', 'mov', 'avi', 'mkv']
        },
        requireVirusScan: false
      },
      notifications: {
        email: {
          enabled: true,
          fromName: 'KMIT Clubs',
          fromEmail: 'noreply@kmit.in',
          replyTo: 'support@kmit.in'
        },
        sms: {
          enabled: false,
          provider: 'twilio'
        },
        types: {
          eventReminders: true,
          recruitmentOpening: true,
          roleAssignment: true,
          coordinatorOverride: true,
          budgetApproval: true,
          membershipApproval: true
        },
        reminderTiming: {
          eventReminderDays: 1,
          recruitmentClosingDays: 3
        }
      },
      security: {
        session: {
          timeout: 3600, // 1 hour
          extendOnActivity: true
        },
        login: {
          maxAttempts: 5,
          lockoutDuration: 900 // 15 minutes
        },
        password: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChar: false,
          preventReuse: 3
        },
        twoFactorAuth: {
          enabled: false,
          enforceForAdmins: false
        }
      },
      clubs: {
        maxMembersPerClub: 100,
        minMembersToCreate: 10,
        allowStudentClubCreation: false,
        requireCoordinatorAssignment: true,
        clubCategories: ['technical', 'cultural', 'sports', 'social', 'academic']
      },
      academicYear: {
        current: '2024-2025',
        startMonth: 8, // August
        endMonth: 5 // May
      },
      accreditation: {
        institutionName: 'Keshav Memorial Institute of Technology',
        institutionCode: 'KMIT',
        naacGrade: 'A+',
        nbaAccredited: true,
        criteriaMapping: new Map([
          ['student_participation', '2.5.3'],
          ['co_curricular', '3.3.2'],
          ['student_development', '5.1.3']
        ])
      }
    });

    console.log('\n✅ Default system settings created successfully!');
    console.log('\n📊 Settings Summary:');
    console.log('='.repeat(60));
    console.log(`Institution: ${settings.accreditation.institutionName}`);
    console.log(`Academic Year: ${settings.academicYear.current}`);
    console.log(`Max Applications/Student: ${settings.recruitment.maxApplicationsPerStudent}`);
    console.log(`Budget Limits:`);
    console.log(`  - Technical: ₹${settings.events.budgetLimits.technical}`);
    console.log(`  - Cultural: ₹${settings.events.budgetLimits.cultural}`);
    console.log(`  - Sports: ₹${settings.events.budgetLimits.sports}`);
    console.log(`  - Default: ₹${settings.events.budgetLimits.default}`);
    console.log(`Email Notifications: ${settings.notifications.email.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`Session Timeout: ${settings.security.session.timeout / 60} minutes`);
    console.log('='.repeat(60));

    console.log('\n🎯 Next Steps:');
    console.log('1. Update settings via API: PUT /api/settings');
    console.log('2. Or update specific section: PUT /api/settings/:section');
    console.log('3. View settings: GET /api/settings');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

console.log('🚀 Starting system settings seeder...\n');
seedSettings()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
