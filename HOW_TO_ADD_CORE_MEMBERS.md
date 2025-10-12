# How to Add Core Members to Clubs

## Quick Method: Using Script

### **Step 1: Edit the Script**

Open `Backend/scripts/addCoreMember.js` and configure:

```javascript
const studentEmail = 'student@kmit.in';     // Student's email
const clubName = 'Recurse Coding Club';     // Exact club name
const role = 'core';                        // Desired role
```

### **Step 2: Run the Script**

```bash
cd Backend
npm run add:core
```

### **Expected Output:**
```
✅ MongoDB connected
✅ Found student: Vemula Akshitha (vemulaakshithareddy@gmail.com)
✅ Found club: Recurse Coding Club
✅ Created new membership with role: core

📋 Summary:
   Student: Vemula Akshitha
   Club: Recurse Coding Club
   Role: core
   Status: approved

🎉 Done! Student is now a core member of Recurse Coding Club
```

---

## Available Roles

| Role | Description |
|------|-------------|
| `member` | Regular member |
| `core` | Core team member (can manage club) |
| `president` | Club president (full access) |
| `vicePresident` | Vice president |
| `secretary` | Secretary |
| `treasurer` | Treasurer |
| `leadPR` | PR Lead |
| `leadTech` | Tech Lead |

---

## Method 2: Direct MongoDB Commands

### **Using MongoDB Compass or Shell:**

```javascript
// 1. Find student ID
db.users.findOne({ email: "student@kmit.in" })
// Copy the _id

// 2. Find club ID
db.clubs.findOne({ name: "Recurse Coding Club" })
// Copy the _id

// 3. Create membership
db.memberships.insertOne({
  user: ObjectId("STUDENT_ID_HERE"),
  club: ObjectId("CLUB_ID_HERE"),
  role: "core",
  status: "approved",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## Method 3: Via API (Requires Admin Access)

### **Create Membership Endpoint**

If you want to add this via API, you'll need to create an endpoint:

**Route:** `POST /api/clubs/:clubId/members`

**Body:**
```json
{
  "userId": "USER_ID",
  "role": "core"
}
```

---

## Verification

### **Check if membership was created:**

```bash
# In MongoDB shell or Compass
db.memberships.find({ 
  user: ObjectId("USER_ID"),
  club: ObjectId("CLUB_ID")
})
```

### **Test in Frontend:**

1. Login as the student
2. Look for "My Clubs" button in navigation
3. Should show the club
4. Click to open club dashboard
5. Should have access to manage the club

---

## Bulk Add Multiple Students

Create a modified script for bulk operations:

```javascript
const students = [
  { email: 'student1@kmit.in', role: 'core' },
  { email: 'student2@kmit.in', role: 'core' },
  { email: 'student3@kmit.in', role: 'president' }
];

const clubName = 'Recurse Coding Club';

for (const studentData of students) {
  const student = await User.findOne({ email: studentData.email });
  const club = await Club.findOne({ name: clubName });
  
  await Membership.create({
    user: student._id,
    club: club._id,
    role: studentData.role,
    status: 'approved'
  });
  
  console.log(`✅ Added ${student.profile.name} as ${studentData.role}`);
}
```

---

## Common Issues

### **Issue 1: "Student not found"**
- Check email is correct
- Ensure student has completed profile
- Verify student exists in database

### **Issue 2: "Club not found"**
- Check club name matches exactly (case-sensitive)
- Ensure club was created via seed script
- Verify club exists in database

### **Issue 3: "Membership already exists"**
- Script will update existing membership
- Check current role in output
- New role will be applied

### **Issue 4: Student doesn't see club in switcher**
- Ensure role is `core` or higher (not just `member`)
- Refresh browser
- Check membership status is `approved`

---

## Database Schema

### **Membership Document:**
```javascript
{
  _id: ObjectId("..."),
  user: ObjectId("USER_ID"),      // Reference to User
  club: ObjectId("CLUB_ID"),      // Reference to Club
  role: "core",                   // Role in club
  status: "approved",             // Status
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## Examples

### **Example 1: Add student as core member**
```javascript
// Edit addCoreMember.js
const studentEmail = 'akshitha@kmit.in';
const clubName = 'Recurse Coding Club';
const role = 'core';

// Run
npm run add:core
```

### **Example 2: Make student president**
```javascript
const studentEmail = 'akshitha@kmit.in';
const clubName = 'Mudra Dance Club';
const role = 'president';

npm run add:core
```

### **Example 3: Add multiple roles to same student**
```javascript
// Run script multiple times with different clubs
// Script 1: Recurse Coding Club - core
// Script 2: Mudra Dance Club - core
// Script 3: Aakarshan Art Club - president
```

---

## Security Notes

⚠️ **Important:**
- Only admins should run these scripts
- Verify student email before adding
- Don't add random students as core members
- Keep track of who has access to which clubs
- Regular members should apply through recruitment

---

## Next Steps After Adding Core Member

1. **Notify the student** - They now have access
2. **Test access** - Login as student and verify
3. **Grant permissions** - Ensure they can manage club
4. **Onboard** - Explain their responsibilities

---

**Created:** October 11, 2025  
**Last Updated:** October 11, 2025
