# KCMS Scripts Documentation

This directory contains utility scripts for managing the KMIT Club Management System (KCMS).

## 📁 Available Scripts

### 1. `assign-membership-roles.js` - Membership Role Assignment

**Purpose:** Assign or update roles for club members (president, core, member, etc.)

**Use Cases:**
- Promote recruits to president or leadership positions
- Assign core team members to clubs
- Batch role updates for multiple users
- Initial club member setup

**How to Use:**

1. **Edit the Configuration Section** in the script:
   ```javascript
   const ROLE_ASSIGNMENTS = [
     {
       clubName: 'Recurse Coding Club',
       assignments: [
         {
           userRollNumber: '23bd1a057t',
           role: 'president',
           status: 'approved'
         }
       ]
     }
   ];
   ```

2. **Available Roles:**
   - `president` - Club President
   - `vicePresident` - Vice President
   - `secretary` - Secretary
   - `treasurer` - Treasurer
   - `core` - Core Team Member
   - `leadPR` - PR Lead
   - `leadTech` - Tech Lead
   - `member` - Regular Member

3. **Available Statuses:**
   - `approved` - Approved member
   - `applied` - Application pending
   - `rejected` - Application rejected

4. **Run the Script:**
   ```bash
   cd Backend
   node scripts/assign-membership-roles.js
   ```

**Example Output:**
```
✅ Connected to MongoDB

📋 Processing club: Recurse Coding Club
✅ Found club: Recurse Coding Club (ID: 68ea61b322570c47ad51fe74)
  ✅ Created: Y Ram (23bd1a057t)
     Role: president | Status: approved
✅ Updated club member count: 1

============================================================
📊 ASSIGNMENT SUMMARY
============================================================
✅ Successful assignments: 1
❌ Failed assignments: 0
============================================================
```

---

### 2. `seed-events.js` - Event Data Seeding

**Purpose:** Seed events into the database including upcoming and completed events

**Pre-configured Events:**
- ✅ **Patang Utsav** - Upcoming kite flying festival
- ✅ **KMIT Evening** - Flagship cultural fest
- ✅ **Navaraas** - Completed dance performance

**How to Use:**

1. **Review the Events Configuration** in the script:
   ```javascript
   const EVENTS_TO_SEED = [
     {
       clubName: 'Organising Committee',
       title: 'Patang Utsav',
       description: 'The much-awaited kite flying festival...',
       dateTime: new Date('2025-01-14T09:00:00'),
       status: 'published'
       // ... more fields
     }
   ];
   ```

2. **Customize Events** (Optional):
   - Change dates, descriptions, budgets
   - Add more events to the array
   - Modify event statuses

3. **Event Statuses:**
   - `draft` - Draft event
   - `pending_coordinator` - Awaiting coordinator approval
   - `pending_admin` - Awaiting admin approval
   - `approved` - Approved, not yet published
   - `published` - Published and visible
   - `ongoing` - Currently happening
   - `completed` - Event completed
   - `archived` - Archived event

4. **Run the Script:**
   ```bash
   cd Backend
   node scripts/seed-events.js
   ```

**Example Output:**
```
✅ Connected to MongoDB

🔄 Starting event seeding...

📅 Processing event: Patang Utsav
  ✅ Found club: Organising Committee
  ✅ Created event: Patang Utsav
     Status: published | Date: 1/14/2025

============================================================
📊 EVENT SEEDING SUMMARY
============================================================
✅ Successfully seeded: 3 events
❌ Failed: 0 events

📋 Seeded Events:

  🔜 Upcoming Events:
     • Patang Utsav - 1/14/2025 (published)
     • KMIT Evening - 2/28/2025 (approved)

  ✅ Completed Events:
     • Navaraas - Nine Emotions - 10/15/2024
============================================================
```

---

### 3. `seed-demo.js` - Demo Data Seeding

**Purpose:** Seed comprehensive demo data for testing

**What it Seeds:**
- Users with different roles
- Clubs
- Events
- Recruitments
- Applications

**Run:**
```bash
cd Backend
node scripts/seed-demo.js
```

---

### 4. `seed.js` - Basic Seeding

**Purpose:** Basic seed script for initial setup

**Run:**
```bash
cd Backend
node scripts/seed.js
```

---

### 5. `backup.js` - Database Backup

**Purpose:** Create backups of the database

**Run:**
```bash
cd Backend
node scripts/backup.js
```

---

### 6. `generate-keys.js` - Generate Keys

**Purpose:** Generate encryption keys and secrets

**Run:**
```bash
cd Backend
node scripts/generate-keys.js
```

---

### 7. `export-database.js` - Export Database ⭐

**Purpose:** Export all collections to JSON files for sharing with teammates

**Use Cases:**
- Share your database state with teammates
- Create database snapshots
- Backup before major changes
- Version control database state

**How it Works:**
- Exports clubs, users, memberships, events, etc.
- Saves to `Database/*.json` files
- Uses MongoDB Extended JSON format
- Compatible with `import-database.js`

**Run:**
```bash
cd Backend
node scripts/export-database.js
```

**Example Output:**
```
✅ Connected to MongoDB

🔄 Starting database export...

📤 Exporting clubs...
   ✅ Exported 13 clubs to KCMS.clubs.json

📤 Exporting users...
   ✅ Exported 4 users to KCMS.users.json

📤 Exporting memberships...
   ✅ Exported 5 memberships to KCMS.memberships.json

============================================================
📊 EXPORT SUMMARY
============================================================
✅ Clubs exported: 13
✅ Users exported: 4
✅ Memberships exported: 5
✅ Events exported: 3
============================================================

💡 Next steps:
   git add Database/*.json
   git commit -m "Update database snapshot"
   git push
```

**Workflow for Sharing Data:**
```bash
# 1. Make changes in your local database
# 2. Export the database
node scripts/export-database.js

# 3. Commit and push
git add Database/*.json
git commit -m "Update database with new memberships and events"
git push

# Teammates pull and import
git pull
node import-database.js
```

---

## 🚀 Quick Start Guide

### Prerequisites
1. MongoDB must be running
2. Backend dependencies installed (`npm install`)
3. `.env` file configured with `MONGODB_URI`

### Step-by-Step: Assign President Role to a Recruit

Let's say you want to assign **Y Ram (23bd1a057t)** as **President** of **Recurse Coding Club**:

1. **Open** `Backend/scripts/assign-membership-roles.js`

2. **Edit** the configuration:
   ```javascript
   const ROLE_ASSIGNMENTS = [
     {
       clubName: 'Recurse Coding Club',
       assignments: [
         {
           userRollNumber: '23bd1a057t',
           role: 'president',
           status: 'approved'
         }
       ]
     }
   ];
   ```

3. **Run** the script:
   ```bash
   cd Backend
   node scripts/assign-membership-roles.js
   ```

4. **Verify** in the application:
   - Log in as the user
   - Navigate to the club
   - Check the member's role badge shows "President"

### Step-by-Step: Add Events to Your System

1. **Open** `Backend/scripts/seed-events.js`

2. **Review** the pre-configured events (Patang Utsav, KMIT Evening, Navaraas)

3. **(Optional) Customize** dates or add more events

4. **Run** the script:
   ```bash
   cd Backend
   node scripts/seed-events.js
   ```

5. **Verify** in the application:
   - Navigate to club dashboards
   - Check the Events tab
   - Verify upcoming and completed events appear correctly

---

## 🔧 Troubleshooting

### Common Issues

**1. "MongoDB connection error"**
- Ensure MongoDB is running: `mongod` or check Docker container
- Verify `MONGODB_URI` in `.env` file
- Check network connectivity

**2. "Club not found"**
- Verify club name exactly matches database (case-sensitive)
- Run: `db.clubs.find({}, {name: 1})` in MongoDB to list all clubs

**3. "User not found with roll number"**
- Verify roll number exists in database
- Run: `db.users.find({}, {rollNumber: 1, email: 1})` to list all users
- Check for typos or case sensitivity

**4. "Invalid role"**
- Ensure role is one of the valid roles listed above
- Check spelling and casing (e.g., `vicePresident` not `vice_president`)

**5. Script runs but changes not reflected**
- Clear browser cache
- Refresh the page
- Check MongoDB directly to confirm changes
- Restart backend server

---

## 📊 Database Collections

### Memberships Collection
```javascript
{
  club: ObjectId("..."),      // Reference to club
  user: ObjectId("..."),      // Reference to user
  role: "president",          // User's role in club
  status: "approved",         // Membership status
  createdAt: Date,
  updatedAt: Date
}
```

### Events Collection
```javascript
{
  club: ObjectId("..."),      // Reference to club
  title: "Event Name",
  description: "...",
  dateTime: Date,
  duration: 180,              // minutes
  venue: "Location",
  capacity: 300,
  status: "published",
  budget: 50000,
  // ... more fields
}
```

---

## 💡 Best Practices

1. **Backup Before Running Scripts**
   - Always backup your database before running bulk operations
   - Use the `backup.js` script

2. **Test in Development First**
   - Run scripts in a development environment
   - Verify results before running in production

3. **Use Version Control**
   - Commit your script configurations
   - Document changes in git commit messages

4. **Verify After Running**
   - Check the database directly
   - Test in the application UI
   - Review script output logs

5. **Keep Scripts Updated**
   - Update event dates periodically
   - Adjust configurations as needed
   - Add comments for future reference

---

## 🆘 Need Help?

- Check the script output for detailed error messages
- Review MongoDB logs for database issues
- Verify data in MongoDB Compass or CLI
- Check backend server logs for API errors

---

## 📝 Notes

- All dates in scripts use ISO 8601 format
- Times are in 24-hour format
- Scripts are idempotent (safe to run multiple times)
- Existing records are updated, not duplicated

---

**Last Updated:** October 2024  
**KCMS Version:** 1.0  
**Maintainer:** KMIT Development Team
