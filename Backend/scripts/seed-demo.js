// scripts/seed-demo.js - Create demo data for presentation
const mongoose = require('mongoose');
const config = require('../src/config');
const { User } = require('../src/modules/auth/user.model');
const { Club } = require('../src/modules/club/club.model');
const { Membership } = require('../src/modules/club/membership.model');

async function seedDemoData() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ MongoDB connected for demo seeding\n');

    // 1. Create Admin User
    console.log('📋 Creating users...');
    const adminRoll = '01BdADMIN1';
    let admin = await User.findOne({ rollNumber: adminRoll });
    if (!admin) {
      admin = new User({
        rollNumber: adminRoll,
        email: 'admin@kmit.in',
        status: 'profile_complete',
        roles: { global: 'admin' },
        profile: { 
          name: 'Admin User', 
          department: 'CSE', 
          year: 4,
          batch: '2021-2025'
        }
      });
      await admin.setPassword('Admin@123');
      await admin.save();
      console.log('   ✅ Admin user created (admin@kmit.in / Admin@123)');
    }

    // 2. Create Coordinator
    const coordRoll = '99BdCOORD1';
    let coordinator = await User.findOne({ rollNumber: coordRoll });
    if (!coordinator) {
      coordinator = new User({
        rollNumber: coordRoll,
        email: 'coordinator@kmit.in',
        status: 'profile_complete',
        roles: { global: 'coordinator' },
        profile: { 
          name: 'Dr. Coordinator', 
          department: 'CSE', 
          year: 0,
          batch: 'Faculty'
        }
      });
      await coordinator.setPassword('Coord@123');
      await coordinator.save();
      console.log('   ✅ Coordinator created (coordinator@kmit.in / Coord@123)');
    }

    // 3. Create Sample Students
    const studentRolls = ['22Bd1A0501', '22Bd1A0502', '22Bd1A0503'];
    const students = [];
    
    for (let i = 0; i < studentRolls.length; i++) {
      let student = await User.findOne({ rollNumber: studentRolls[i] });
      if (!student) {
        student = new User({
          rollNumber: studentRolls[i],
          email: `student${i + 1}@kmit.in`,
          status: 'profile_complete',
          roles: { global: 'student' },
          profile: { 
            name: `Student ${i + 1}`, 
            department: 'CSE', 
            year: 3,
            batch: '2022-2026'
          }
        });
        await student.setPassword('Student@123');
        await student.save();
        students.push(student);
        console.log(`   ✅ Student ${i + 1} created (student${i + 1}@kmit.in / Student@123)`);
      } else {
        students.push(student);
      }
    }

    // 4. Create Sample Clubs
    console.log('\n📋 Creating clubs...');
    const clubsData = [
      {
        name: 'Code Club',
        category: 'technical',
        description: 'A club for coding enthusiasts',
        vision: 'To promote coding culture in campus',
        mission: 'Organize hackathons and coding competitions',
        status: 'active'
      },
      {
        name: 'Dance Club',
        category: 'cultural',
        description: 'Express yourself through dance',
        vision: 'Promote dance as an art form',
        mission: 'Organize dance events and workshops',
        status: 'active'
      },
      {
        name: 'Cricket Club',
        category: 'sports',
        description: 'For cricket lovers',
        vision: 'Build a strong cricket team',
        mission: 'Regular practice and tournaments',
        status: 'active'
      }
    ];

    const clubs = [];
    for (const clubData of clubsData) {
      let club = await Club.findOne({ name: clubData.name });
      if (!club) {
        club = new Club({
          ...clubData,
          coordinator: coordinator._id,
          createdBy: admin._id
        });
        await club.save();
        clubs.push(club);
        console.log(`   ✅ ${clubData.name} created`);

        // Add president membership
        const membership = new Membership({
          club: club._id,
          user: students[0]._id,
          role: 'president',
          status: 'active'
        });
        await membership.save();

        // Update student roles
        students[0].roles.scoped = students[0].roles.scoped || [];
        students[0].roles.scoped.push(`president:${club._id}`);
        await students[0].save();
      } else {
        clubs.push(club);
      }
    }

    console.log('\n✅ Demo data seeding completed!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 DEMO CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('Admin:       admin@kmit.in / Admin@123');
    console.log('Coordinator: coordinator@kmit.in / Coord@123');
    console.log('Student 1:   student1@kmit.in / Student@123');
    console.log('Student 2:   student2@kmit.in / Student@123');
    console.log('Student 3:   student3@kmit.in / Student@123');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Demo seeding failed:', err);
    process.exit(1);
  }
}

seedDemoData();
