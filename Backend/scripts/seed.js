// scripts/seed.js
const mongoose = require('mongoose');
const config = require('../config');
const { User } = require('../src/modules/auth/user.model');

(async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('MongoDB connected for seeding');

    // Create Admin user if not exists
    const adminRoll = '01BdABC123'; // example
    let admin = await User.findOne({ rollNumber: adminRoll });
    if (!admin) {
      admin = new User({
        rollNumber: adminRoll,
        email: 'admin@gmail.com',
        status: 'profile_complete',
        roles: { global: 'admin' },
        profile: { name: 'Super Admin', department: 'IT', year: 0 }
      });
      await admin.setPassword('StrongP@ssw0rd!');
      await admin.save();
      console.log('✅ Admin user created');
    } else {
      console.log('⚠️  Admin already exists');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();