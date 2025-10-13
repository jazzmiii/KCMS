# Team Database Setup Guide

## 🎯 Problem
Team members can't access data created on local MongoDB instances.

## ✅ Solution: MongoDB Atlas (Cloud Database)

All team members will connect to the same cloud database.

---

## 📝 Setup Steps

### Step 1: Create MongoDB Atlas Account (One person does this)

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for free account
3. Choose "Build a Database" → **M0 Free Tier**
4. Select a cloud provider and region (choose nearest to your location)
5. Cluster Name: `KCMS-Cluster` (or any name)

### Step 2: Configure Database Access

1. **Create Database User:**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `kcms-team`
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. **Configure Network Access:**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (`0.0.0.0/0`)
   - ⚠️ For production: Add specific IP addresses
   - Click "Confirm"

### Step 3: Get Connection String

1. Go to "Database" in left sidebar
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Copy the connection string:
   ```
   mongodb+srv://kcms-team:<password>@kcms-cluster.xxxxx.mongodb.net/
   ```
5. Replace `<password>` with actual password
6. Add database name at the end: `/KCMS`

**Final connection string:**
```
mongodb+srv://kcms-team:YourPassword123@kcms-cluster.xxxxx.mongodb.net/KCMS
```

### Step 4: Update Backend `.env` File

**Everyone on the team updates their `.env` file:**

```env
# MongoDB Atlas - Shared Cloud Database
MONGODB_URI=mongodb+srv://kcms-team:YourPassword123@kcms-cluster.xxxxx.mongodb.net/KCMS

# Other environment variables...
PORT=5000
JWT_SECRET=your-secret-key
```

**Important:** 
- Share the connection string securely with team (Slack, Discord, etc.)
- **DO NOT** commit `.env` to Git (already in `.gitignore`)
- Each team member updates their local `.env` file

### Step 5: Import Initial Data

**One person runs this to populate the shared database:**

```bash
cd Backend

# Import the existing database
node import-database.js

# Add membership roles
node scripts/assign-membership-roles.js

# Add events
node scripts/seed-events.js
```

### Step 6: Team Members Connect

**Everyone else just needs to:**

1. Update their `.env` file with the Atlas connection string
2. Restart the backend server
3. Test the connection

```bash
cd Backend
npm start
```

You should see: `✅ Connected to MongoDB`

---

## 🎉 Benefits

- ✅ **Everyone sees the same data** instantly
- ✅ **No manual syncing** required
- ✅ **Free tier** includes 512MB storage
- ✅ **Automatic backups**
- ✅ **Secure** access with authentication

---

## 🔒 Security Tips

1. **Use strong passwords** for database users
2. **Share credentials securely** (not in public channels)
3. **Rotate passwords** periodically
4. **Use IP whitelisting** in production
5. **Never commit** `.env` to Git

---

## 🛠️ Alternative: Local Development with Sync

If you prefer local MongoDB, use this workflow:

### Export Data (After making changes)
```bash
cd Backend

# Export all collections
mongodump --db KCMS --out backup/

# Or use mongoexport for JSON
mongoexport --db KCMS --collection clubs --out ../Database/KCMS.clubs.json --jsonArray --pretty
mongoexport --db KCMS --collection users --out ../Database/KCMS.users.json --jsonArray --pretty
mongoexport --db KCMS --collection memberships --out ../Database/KCMS.memberships.json --jsonArray --pretty
```

### Import Data (Teammates)
```bash
cd Backend

# Import the database
node import-database.js
```

### Commit & Share
```bash
git add Database/*.json
git commit -m "Update database snapshot"
git push
```

**Team members:**
```bash
git pull
cd Backend
node import-database.js
```

---

## 📊 Which Approach to Use?

| Use Case | Recommended Solution |
|----------|---------------------|
| **Active development** | MongoDB Atlas (cloud) |
| **Individual testing** | Local MongoDB + import scripts |
| **Demo/Presentation** | Local MongoDB with seed scripts |
| **Production** | MongoDB Atlas with IP restrictions |

---

## 🆘 Troubleshooting

### "Connection timeout" or "Network error"
- Check if IP is whitelisted in Atlas
- Verify internet connection
- Check if connection string is correct

### "Authentication failed"
- Verify username and password
- Check if user has correct permissions
- Ensure no special characters in password breaking the URL

### "Database not found"
- Add `/KCMS` at the end of connection string
- Database will be created automatically on first connection

### "Too many connections"
- Free tier has connection limits
- Close unused connections
- Restart backend server

---

## 💡 Pro Tips

1. **Use MongoDB Compass** to view data visually:
   - Download: [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
   - Connect using the same connection string
   - Great for debugging

2. **Monitor Usage** in Atlas dashboard:
   - Check storage used
   - Monitor connection count
   - View operation metrics

3. **Setup Alerts** in Atlas:
   - Get notified when storage is full
   - Track connection spikes
   - Monitor performance

---

## 🎓 Next Steps

1. ✅ Create MongoDB Atlas cluster
2. ✅ Share connection string with team
3. ✅ Everyone updates `.env` file
4. ✅ Import initial data
5. ✅ Start developing together!

---

**Questions?** Check MongoDB Atlas documentation: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com/)

**KCMS Development Team** 🚀
