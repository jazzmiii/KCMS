# Coordinator Assignment Guide

## 🔍 Understanding the Issue

You have **TWO different things** related to coordinators:

### 1. **Club.coordinator Field** (Required for Dashboard)
- This is a field in the Club model
- It stores the User ObjectId of the assigned coordinator
- **Required for the coordinator dashboard to work**
- Query: `Club.find({ coordinator: user._id })`

### 2. **Membership Role** (Optional)
- This is a role in the Membership model
- Creates a membership record with role "coordinator" or "president"
- Used for access control and permissions

## ❌ The Problem

When you use `assign-membership-roles.js`, it only updates:
- ✅ **Membership table** → Creates membership with role
- ❌ **Club.coordinator field** → NOT updated

Result: Coordinator dashboard shows **0 assigned clubs** because it queries the Club.coordinator field.

## ✅ The Solution

Use **BOTH scripts**:

1. **`assign-club-coordinators.js`** - Sets Club.coordinator field (Required)
2. **`assign-membership-roles.js`** - Creates membership record (Optional)

---

## 📋 Step-by-Step Instructions

### Step 1: Configure Coordinator Assignments

Edit `Backend/scripts/assign-club-coordinators.js`:

```javascript
const COORDINATOR_ASSIGNMENTS = [
  {
    clubName: 'Recurse Coding Club',
    coordinatorRollNumber: '23BD1A1201',
  },
  {
    clubName: 'AALP Music Club',
    coordinatorRollNumber: '23bd1a056Q',
  },
  // Add more...
];
```

### Step 2: Run the Script

```bash
cd Backend
node scripts/assign-club-coordinators.js
```

### Step 3: Verify

1. Log in as the coordinator
2. Navigate to `/coordinator/dashboard`
3. You should now see:
   - ✅ Assigned Clubs count updated
   - ✅ Clubs listed under "My Clubs"

---

## 🎯 What Each Script Does

### `assign-club-coordinators.js` ⭐ **USE THIS FOR COORDINATORS**

**Updates:**
- ✅ `Club.coordinator` field → Points to user
- ✅ Creates membership with role "president"

**Result:**
- ✅ Coordinator dashboard shows assigned clubs
- ✅ User can approve events for their clubs
- ✅ Proper coordinator-club relationship

### `assign-membership-roles.js`

**Updates:**
- ✅ Membership records only
- ✅ Assigns roles: president, core, member, etc.

**Result:**
- ✅ User shows as club member
- ✅ Role-based permissions
- ❌ Does NOT make them a coordinator for dashboard

---

## 📊 Data Structure Comparison

### Club Model
```javascript
{
  name: "Recurse Coding Club",
  coordinator: ObjectId("user123"), // ← THIS IS WHAT COORDINATOR DASHBOARD USES
  category: "technical",
  status: "active"
}
```

### Membership Model
```javascript
{
  club: ObjectId("club123"),
  user: ObjectId("user123"),
  role: "president", // ← This is just a membership role
  status: "approved"
}
```

---

## 🔄 Events and Coordinator Approval

For events to show in "Pending Approvals":

### Event Status Flow:
1. **draft** → Event created by club
2. **pending_coordinator** → Waiting for coordinator approval ⚠️
3. **approved** → Coordinator approved
4. **published** → Event is live

### How to Create Events Needing Approval:

Events must have:
- ✅ Status: `pending_coordinator`
- ✅ Club: Must be one of the coordinator's assigned clubs

The dashboard queries:
```javascript
eventService.list({ status: 'pending_coordinator' })
```

---

## 🧪 Testing Checklist

### After Running the Script:

- [ ] Log in as coordinator user
- [ ] Navigate to `/coordinator/dashboard`
- [ ] Check "Assigned Clubs" count is correct
- [ ] Click "My Clubs" - verify clubs are listed
- [ ] Create an event with status "pending_coordinator"
- [ ] Verify it appears in "Pending Approvals"

---

## 🛠️ Troubleshooting

### Problem: Dashboard still shows 0 clubs

**Check:**
1. ✅ Script ran successfully
2. ✅ User roll number matches exactly (case-sensitive)
3. ✅ Club name matches exactly
4. ✅ User is logged in as the correct user
5. ✅ Clear browser cache and refresh

**Debug:**
```javascript
// In MongoDB shell or Compass
db.clubs.find({ name: "Recurse Coding Club" })
// Check if coordinator field is set
```

### Problem: No events showing in "Pending Approvals"

**Reasons:**
1. No events exist with status `pending_coordinator`
2. Events belong to clubs not assigned to this coordinator
3. Events have different status (draft, approved, published)

**Solution:**
- Use `seed-events.js` to create sample events
- Or create events via the UI
- Ensure event status is `pending_coordinator`

---

## 💡 Best Practices

1. **Always use `assign-club-coordinators.js` for coordinators**
2. **Use `assign-membership-roles.js` for regular members**
3. **One coordinator per club** (Club.coordinator is a single reference)
4. **Multiple core members per club** (via Membership roles)

---

## 📝 Quick Reference

| Task | Script to Use | Updates |
|------|--------------|---------|
| **Assign coordinator** | `assign-club-coordinators.js` | Club.coordinator + Membership |
| **Assign president/core** | `assign-membership-roles.js` | Membership only |
| **Create events** | `seed-events.js` | Events collection |

---

## 🚀 Example Workflow

```bash
# 1. Assign coordinator to clubs
node scripts/assign-club-coordinators.js

# 2. Assign other club members (president, core, etc.)
node scripts/assign-membership-roles.js

# 3. Seed some events for testing
node scripts/seed-events.js

# 4. Log in as coordinator and test dashboard
```

---

**Status:** ✅ Ready to use!

Now run `assign-club-coordinators.js` to fix your coordinator dashboard.
