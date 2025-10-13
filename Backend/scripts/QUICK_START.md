# Quick Start Guide - KCMS Scripts

## 🎯 What You Need

You asked for scripts to:
1. ✅ **Assign president roles to recruits** in clubs
2. ✅ **Add upcoming events**: Patang Utsav, KMIT Evening
3. ✅ **Add completed events**: Navaraas

All scripts are ready to use!

---

## 🚀 Step 1: Assign President to Recruits

### File: `assign-membership-roles.js`

**Quick Example:**
```javascript
// Edit this section in the script:
const ROLE_ASSIGNMENTS = [
  {
    clubName: 'Recurse Coding Club',
    assignments: [
      {
        userRollNumber: '23bd1a057t',  // Student roll number
        role: 'president',              // Role to assign
        status: 'approved'              // Status
      }
    ]
  }
];
```

**Run:**
```bash
cd Backend
node scripts/assign-membership-roles.js
```

**Add More Members:**
```javascript
const ROLE_ASSIGNMENTS = [
  {
    clubName: 'Recurse Coding Club',
    assignments: [
      { userRollNumber: '23bd1a057t', role: 'president', status: 'approved' },
      { userRollNumber: '23bd1a05b4', role: 'core', status: 'approved' },
      { userRollNumber: '23bd1a057j', role: 'member', status: 'approved' }
    ]
  },
  {
    clubName: 'AALP Music Club',
    assignments: [
      { userRollNumber: '23bd1a057j', role: 'president', status: 'approved' }
    ]
  }
];
```

---

## 🎉 Step 2: Add Events

### File: `seed-events.js`

**Pre-configured Events:**
- ✅ **Patang Utsav** (Jan 14, 2025) - Kite Flying Festival
- ✅ **KMIT Evening** (Feb 28, 2025) - Cultural Fest
- ✅ **Navaraas** (Oct 15, 2024) - Completed Dance Performance

**Just Run:**
```bash
cd Backend
node scripts/seed-events.js
```

**That's it!** All three events will be added to your database.

### Customize Dates (Optional)

If you want different dates, edit the script:

```javascript
// For Patang Utsav
dateTime: new Date('2025-01-14T09:00:00'),  // Change this date

// For KMIT Evening
dateTime: new Date('2025-02-28T17:00:00'),  // Change this date
```

---

## 📋 Available Roles

When assigning memberships:
- `president` - Club President
- `vicePresident` - Vice President
- `secretary` - Secretary
- `treasurer` - Treasurer
- `core` - Core Team Member
- `leadPR` - PR Lead
- `leadTech` - Tech Lead
- `member` - Regular Member

---

## 🎨 Event Statuses

When adding events:
- `published` - Live and visible (for upcoming events)
- `approved` - Approved, awaiting publish
- `completed` - Event finished (for past events)
- `draft` - Still being planned

---

## ✅ Verification

After running scripts:

1. **For Membership:**
   - Go to Club Dashboard → Members tab
   - Check role badges for assigned members
   - Verify member count updated

2. **For Events:**
   - Go to Club Dashboard → Events tab
   - Check upcoming events section
   - Check completed events section
   - Verify dates and details

---

## 💡 Common Scenarios

### Scenario 1: Assign President to New Recruit
```javascript
// In assign-membership-roles.js
const ROLE_ASSIGNMENTS = [
  {
    clubName: 'Your Club Name',
    assignments: [
      {
        userRollNumber: 'STUDENT_ROLL_NO',
        role: 'president',
        status: 'approved'
      }
    ]
  }
];
```

### Scenario 2: Promote Member to Core Team
```javascript
// Same script - just change role
{
  userRollNumber: 'STUDENT_ROLL_NO',
  role: 'core',          // Change from 'member' to 'core'
  status: 'approved'
}
```

### Scenario 3: Add Multiple Club Leaders
```javascript
const ROLE_ASSIGNMENTS = [
  {
    clubName: 'Dance Club',
    assignments: [
      { userRollNumber: '23bd1a057t', role: 'president', status: 'approved' },
      { userRollNumber: '23bd1a05b4', role: 'vicePresident', status: 'approved' },
      { userRollNumber: '23bd1a057j', role: 'secretary', status: 'approved' }
    ]
  }
];
```

---

## 🔍 Finding Roll Numbers

If you need to find student roll numbers:

**Method 1: MongoDB**
```javascript
// In MongoDB shell or Compass
db.users.find({}, { rollNumber: 1, email: 1, 'profile.name': 1 })
```

**Method 2: Check Database File**
```
Look in: Database/KCMS.users.json
```

**Method 3: In Application**
- Go to Members section
- View user profiles
- Roll numbers are displayed

---

## 📌 Important Notes

1. **MongoDB must be running** before executing scripts
2. **Backend dependencies** must be installed (`npm install`)
3. Scripts are **safe to run multiple times** (won't create duplicates)
4. **Existing records are updated**, not duplicated
5. Check script output for **success/error messages**

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Club not found" | Check club name spelling (case-sensitive) |
| "User not found" | Verify roll number exists in database |
| "MongoDB connection error" | Ensure MongoDB is running |
| Changes not visible | Refresh browser, clear cache |
| "Invalid role" | Check role name from available roles list |

---

## 🎯 Next Steps

After running the scripts:

1. ✅ Check the database records
2. ✅ Log in to the application
3. ✅ Navigate to club dashboards
4. ✅ Verify members and events appear correctly
5. ✅ Test role permissions

---

## 📞 Files Location

```
Backend/scripts/
├── assign-membership-roles.js  ← Assign president/roles
├── seed-events.js              ← Add events
├── README.md                   ← Detailed documentation
└── QUICK_START.md             ← This file
```

---

**Ready to go!** 🚀

Run the scripts and your events + memberships will be set up!
