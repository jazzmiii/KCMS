/**
 * Event Seed Data Script
 * 
 * This script seeds events into the database including:
 * - Upcoming Events: Patang Utsav, KMIT Evening
 * - Completed Events: Navaraas
 * 
 * Usage:
 *   node scripts/seed-events.js
 * 
 * Requirements:
 * - Backend server must be running with MongoDB connected
 * - Clubs must already exist in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Event } = require('../src/modules/event/event.model');
const { Club } = require('../src/modules/club/club.model');

// ===========================================
// CONFIGURATION - EDIT THIS SECTION
// ===========================================

const EVENTS_TO_SEED = [
  // ========== UPCOMING EVENTS ==========
  {
    clubName: 'Organising Committee',
    title: 'Patang Utsav',
    description: 'The much-awaited kite flying festival celebrating the spirit of unity, joy, and tradition. Join us for a day filled with colorful kites, cultural performances, food stalls, and exciting competitions. Experience the sky painted with vibrant kites as students come together to celebrate this beautiful festival.',
    objectives: 'To promote cultural heritage, foster team spirit, encourage creativity through kite designing, and provide a platform for students to showcase their kite flying skills.',
    dateTime: new Date('2025-01-14T09:00:00'), // Makar Sankranti 2025 (Adjust as needed)
    duration: 480, // 8 hours (9 AM to 5 PM)
    venue: 'KMIT Playground and Open Grounds',
    capacity: 500,
    expectedAttendees: 450,
    isPublic: true,
    budget: 150000, // ₹1,50,000
    guestSpeakers: [],
    requiresAdminApproval: false,
    status: 'published' // upcoming event
  },
  {
    clubName: 'Organising Committee',
    title: 'KMIT Evening',
    description: 'An enchanting evening of culture, music, dance, and entertainment. KMIT Evening is the flagship cultural fest featuring performances from various clubs including dance, music, drama, fashion show, and much more. A celebration of talent, creativity, and the vibrant spirit of KMIT.',
    objectives: 'To showcase student talent across various domains, promote cultural exchange, provide a platform for artistic expression, and create memorable experiences for the KMIT community.',
    dateTime: new Date('2025-02-28T17:00:00'), // Late February (adjust as needed)
    duration: 300, // 5 hours (5 PM to 10 PM)
    venue: 'KMIT Main Auditorium and College Grounds',
    capacity: 1000,
    expectedAttendees: 900,
    isPublic: true,
    budget: 500000, // ₹5,00,000
    guestSpeakers: ['Celebrity Guest Performer', 'Alumni Speaker'],
    requiresAdminApproval: false,
    status: 'approved' // upcoming event, awaiting final publishing
  },
  
  // ========== PENDING COORDINATOR APPROVAL ==========
  {
    clubName: 'Recurse Coding Club',
    title: 'HackFest 2025 - 24 Hour Hackathon',
    description: 'An intensive 24-hour hackathon where students collaborate to build innovative solutions to real-world problems. Participants will form teams, brainstorm ideas, code their solutions, and present to judges. Prizes for best project, best innovation, and best presentation. Food, mentorship, and resources provided throughout.',
    objectives: 'To foster innovation and problem-solving skills, encourage collaborative coding, provide hands-on experience with modern technologies, and identify talented developers for internships and placement opportunities.',
    dateTime: new Date('2025-03-15T09:00:00'), // Future event
    duration: 1440, // 24 hours
    venue: 'KMIT Computer Labs and Main Hall',
    capacity: 150,
    expectedAttendees: 120,
    isPublic: true,
    budget: 200000, // ₹2,00,000
    guestSpeakers: ['Tech Industry Expert', 'Startup Founder'],
    requiresAdminApproval: true,
    status: 'pending_coordinator' // awaiting coordinator approval
  },
  {
    clubName: 'AALP Music Club',
    title: 'Sangeet Sandhya - Evening of Melodies',
    description: 'A soulful evening of music featuring live performances by students across various genres including classical, semi-classical, fusion, and contemporary. Solo performances, duets, and group renditions creating a magical musical experience for all music lovers.',
    objectives: 'To provide a platform for student musicians, promote appreciation for diverse musical genres, encourage musical talent, and create a vibrant musical culture on campus.',
    dateTime: new Date('2025-03-20T18:00:00'), // Future event  
    duration: 180, // 3 hours
    venue: 'KMIT Auditorium',
    capacity: 400,
    expectedAttendees: 350,
    isPublic: true,
    budget: 100000, // ₹1,00,000
    guestSpeakers: ['Renowned Musician - Padma Sri recipient'],
    requiresAdminApproval: true,
    status: 'pending_coordinator' // awaiting coordinator approval
  },
  
  // ========== COMPLETED EVENTS ==========
  {
    clubName: 'Mudra Dance Club',
    title: 'Navaraas - Nine Emotions',
    description: 'A spectacular dance performance showcasing the nine emotions (Navarasas) of Indian classical dance - Shringara (love), Hasya (laughter), Karuna (sorrow), Raudra (anger), Veera (courage), Bhayanaka (fear), Bibhatsa (disgust), Adbhuta (wonder), and Shanta (peace). The event mesmerized the audience with powerful performances depicting each emotion through various dance forms including Bharatanatyam, Kathak, Contemporary, and Fusion.',
    objectives: 'To educate students about classical Indian dance forms, demonstrate the expression of emotions through dance, promote appreciation for Indian cultural heritage, and showcase the talents of Mudra Dance Club members.',
    dateTime: new Date('2024-10-15T18:00:00'), // Past date - October 2024
    duration: 180, // 3 hours
    venue: 'KMIT Auditorium',
    capacity: 300,
    expectedAttendees: 280,
    isPublic: true,
    budget: 75000, // ₹75,000
    guestSpeakers: ['Renowned Classical Dancer - Guru Smt. Lakshmi Priya'],
    requiresAdminApproval: false,
    status: 'completed', // completed event
    reportSubmittedAt: new Date('2024-10-20T10:00:00')
  }
];

// Option to clear existing events before seeding (be careful!)
const CLEAR_EXISTING_EVENTS = false; // Set to true to delete all events before seeding

// ===========================================
// SCRIPT LOGIC - DO NOT EDIT BELOW
// ===========================================

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

async function clearExistingEvents() {
  if (CLEAR_EXISTING_EVENTS) {
    console.log('⚠️  Clearing existing events...');
    const result = await Event.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} existing events`);
  }
}

async function seedEvents() {
  console.log('\n🔄 Starting event seeding...\n');
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  const seededEvents = [];

  for (const eventData of EVENTS_TO_SEED) {
    try {
      console.log(`\n📅 Processing event: ${eventData.title}`);
      
      // Find the club
      const club = await Club.findOne({ name: eventData.clubName });
      if (!club) {
        throw new Error(`Club not found: ${eventData.clubName}`);
      }
      console.log(`  ✅ Found club: ${club.name}`);

      // Check if event already exists (to avoid duplicates)
      const existingEvent = await Event.findOne({
        club: club._id,
        title: eventData.title
      });

      if (existingEvent) {
        console.log(`  ⚠️  Event already exists. Updating...`);
        
        // Update existing event
        Object.assign(existingEvent, {
          ...eventData,
          club: club._id,
          clubName: undefined // Remove clubName as it's not in schema
        });
        
        await existingEvent.save();
        console.log(`  ✅ Updated event: ${existingEvent.title}`);
        console.log(`     Status: ${existingEvent.status} | Date: ${existingEvent.dateTime.toLocaleDateString()}`);
        seededEvents.push(existingEvent);
      } else {
        // Create new event
        const event = await Event.create({
          ...eventData,
          club: club._id,
          clubName: undefined // Remove clubName as it's not in schema
        });
        
        console.log(`  ✅ Created event: ${event.title}`);
        console.log(`     Status: ${event.status} | Date: ${event.dateTime.toLocaleDateString()}`);
        seededEvents.push(event);
      }

      successCount++;
    } catch (error) {
      const errorMsg = `  ❌ Error for ${eventData.title}: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EVENT SEEDING SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully seeded: ${successCount} events`);
  console.log(`❌ Failed: ${errorCount} events`);
  
  if (seededEvents.length > 0) {
    console.log('\n📋 Seeded Events:');
    const upcoming = seededEvents.filter(e => ['published', 'approved'].includes(e.status));
    const completed = seededEvents.filter(e => e.status === 'completed');
    
    if (upcoming.length > 0) {
      console.log('\n  🔜 Upcoming Events:');
      upcoming.forEach(e => {
        console.log(`     • ${e.title} - ${e.dateTime.toLocaleDateString()} (${e.status})`);
      });
    }
    
    if (completed.length > 0) {
      console.log('\n  ✅ Completed Events:');
      completed.forEach(e => {
        console.log(`     • ${e.title} - ${e.dateTime.toLocaleDateString()}`);
      });
    }
  }
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    errors.forEach(err => console.log(err));
  }
  
  console.log('='.repeat(60) + '\n');
}

async function main() {
  try {
    await connectDatabase();
    await clearExistingEvents();
    await seedEvents();
    
    console.log('✨ Event seeding completed successfully!\n');
    console.log('💡 You can now view these events in:');
    console.log('   - Club dashboards');
    console.log('   - Events listing page');
    console.log('   - Calendar view\n');
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

// Run the script
main();
