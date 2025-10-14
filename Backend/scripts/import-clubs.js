// Import clubs from JSON file into MongoDB
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kmit-clubs')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Define Club schema (same as in your model)
const clubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: { type: String },
  vision: { type: String },
  mission: { type: String },
  logoUrl: { type: String },
  bannerUrl: { type: String },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
    website: String
  },
  coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['active', 'pending_approval', 'archived'], 
    default: 'active' 
  },
  memberCount: { type: Number, default: 0 },
  pendingSettings: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Club = mongoose.model('Club', clubSchema);

async function importClubs() {
  try {
    console.log('🔄 Starting club import...\n');

    // Read the clubs JSON file
    const clubsFilePath = path.join(__dirname, '..', '..', 'Database', 'KCMS.clubs.json');
    const clubsData = JSON.parse(fs.readFileSync(clubsFilePath, 'utf8'));

    console.log(`📁 Found ${clubsData.length} clubs in JSON file\n`);

    // Check current database
    const existingCount = await Club.countDocuments();
    console.log(`📊 Current clubs in database: ${existingCount}\n`);

    if (existingCount > 0) {
      console.log('⚠️  Database already has clubs. Options:');
      console.log('   1. Delete all and re-import (uncomment code below)');
      console.log('   2. Skip import');
      console.log('\n❌ Skipping import to prevent duplicates.');
      console.log('💡 To re-import, uncomment the deleteMany line in the script.\n');
      
      // Uncomment this line if you want to delete all clubs and re-import:
      // await Club.deleteMany({});
      // console.log('🗑️  Deleted all existing clubs\n');
    }

    // Import clubs
    let imported = 0;
    let skipped = 0;

    for (const clubData of clubsData) {
      try {
        // Convert MongoDB extended JSON format
        const club = {
          _id: clubData._id?.$oid,
          name: clubData.name,
          category: clubData.category,
          description: clubData.description,
          vision: clubData.vision,
          mission: clubData.mission,
          logoUrl: clubData.logoUrl,
          bannerUrl: clubData.bannerUrl,
          socialLinks: clubData.socialLinks,
          coordinator: clubData.coordinator?.$oid,
          status: clubData.status || 'active',
          memberCount: clubData.memberCount || 0,
          createdAt: clubData.createdAt?.$date ? new Date(clubData.createdAt.$date) : new Date(),
          updatedAt: clubData.updatedAt?.$date ? new Date(clubData.updatedAt.$date) : new Date()
        };

        // Check if club already exists
        const existing = await Club.findOne({ name: club.name });
        if (existing) {
          console.log(`⏭️  Skipped: ${club.name} (already exists)`);
          skipped++;
          continue;
        }

        // Insert club
        await Club.create(club);
        console.log(`✅ Imported: ${club.name}`);
        imported++;

      } catch (err) {
        console.error(`❌ Failed to import ${clubData.name}:`, err.message);
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📁 Total in file: ${clubsData.length}`);

    // Verify
    const finalCount = await Club.countDocuments();
    console.log(`   💾 Total in database: ${finalCount}\n`);

    console.log('🎉 Club import completed!\n');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run import
importClubs();
