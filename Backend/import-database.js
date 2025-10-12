// Import all data from Database folder into MongoDB
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/KCMS';
const DATABASE_DIR = path.join(__dirname, '..', 'Database');

async function importDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Read JSON files
    const clubsData = JSON.parse(fs.readFileSync(path.join(DATABASE_DIR, 'KCMS.clubs.json'), 'utf8'));
    const usersData = JSON.parse(fs.readFileSync(path.join(DATABASE_DIR, 'KCMS.users.json'), 'utf8'));
    const membershipsData = JSON.parse(fs.readFileSync(path.join(DATABASE_DIR, 'KCMS.memberships.json'), 'utf8'));
    const notificationsData = JSON.parse(fs.readFileSync(path.join(DATABASE_DIR, 'KCMS.notifications.json'), 'utf8'));
    const sessionsData = JSON.parse(fs.readFileSync(path.join(DATABASE_DIR, 'KCMS.sessions.json'), 'utf8'));

    console.log('📂 Files loaded:');
    console.log(`   - ${clubsData.length} clubs`);
    console.log(`   - ${usersData.length} users`);
    console.log(`   - ${membershipsData.length} memberships`);
    console.log(`   - ${notificationsData.length} notifications`);
    console.log(`   - ${sessionsData.length} sessions\n`);

    // Define models
    const Club = mongoose.model('Club', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Membership = mongoose.model('Membership', new mongoose.Schema({}, { strict: false }));
    const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));
    const Session = mongoose.model('Session', new mongoose.Schema({}, { strict: false }));

    // Check if data already exists
    const existingClubs = await Club.countDocuments();
    const existingUsers = await User.countDocuments();

    if (existingClubs > 0 || existingUsers > 0) {
      console.log('⚠️  Warning: Database already has data!');
      console.log(`   - ${existingClubs} clubs`);
      console.log(`   - ${existingUsers} users`);
      console.log('\n❓ Do you want to:');
      console.log('   1. Keep existing data (cancel import)');
      console.log('   2. Delete all and import fresh data\n');
      console.log('💡 To proceed, delete existing data first:');
      console.log('   Run: node delete-all-data.js\n');
      process.exit(0);
    }

    // Convert MongoDB extended JSON to plain objects
    const cleanData = (dataArray) => {
      return dataArray.map(item => {
        const cleaned = {};
        for (let key in item) {
          if (key === '_id' && item[key].$oid) {
            cleaned._id = new mongoose.Types.ObjectId(item[key].$oid);
          } else if (key === 'createdAt' || key === 'updatedAt' || key === 'expiresAt' || key === 'revokedAt') {
            if (item[key]?.$date) {
              cleaned[key] = new Date(item[key].$date);
            } else if (item[key]) {
              cleaned[key] = new Date(item[key]);
            }
          } else if (typeof item[key] === 'object' && item[key] !== null && item[key].$oid) {
            cleaned[key] = new mongoose.Types.ObjectId(item[key].$oid);
          } else {
            cleaned[key] = item[key];
          }
        }
        return cleaned;
      });
    };

    // Import data
    console.log('📥 Importing data...\n');

    console.log('1️⃣  Importing users...');
    await User.insertMany(cleanData(usersData));
    console.log('   ✅ Done\n');

    console.log('2️⃣  Importing clubs...');
    await Club.insertMany(cleanData(clubsData));
    console.log('   ✅ Done\n');

    console.log('3️⃣  Importing memberships...');
    await Membership.insertMany(cleanData(membershipsData));
    console.log('   ✅ Done\n');

    console.log('4️⃣  Importing notifications...');
    await Notification.insertMany(cleanData(notificationsData));
    console.log('   ✅ Done\n');

    console.log('5️⃣  Importing sessions...');
    await Session.insertMany(cleanData(sessionsData));
    console.log('   ✅ Done\n');

    // Verify import
    const finalClubs = await Club.countDocuments();
    const finalUsers = await User.countDocuments();
    const activeClubs = await Club.countDocuments({ status: 'active' });

    console.log('═══════════════════════════════════════');
    console.log('🎉 Import Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`✅ ${finalUsers} users imported`);
    console.log(`✅ ${finalClubs} clubs imported (${activeClubs} active)`);
    console.log(`✅ ${membershipsData.length} memberships imported`);
    console.log(`✅ ${notificationsData.length} notifications imported`);
    console.log(`✅ ${sessionsData.length} sessions imported`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('💡 Next steps:');
    console.log('   1. Copy logos to Frontend/public/logos/');
    console.log('   2. Restart your backend server');
    console.log('   3. Refresh your browser\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importDatabase();
