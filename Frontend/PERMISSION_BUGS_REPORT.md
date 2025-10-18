# 🐛 PERMISSION & VISIBILITY BUGS REPORT

**Date:** October 16, 2025, 11:10 AM  
**Scope:** Club Management & Event Management  
**Analysis:** Code review of permissions and visibility logic  

---

## 🚨 CRITICAL BUGS

### **BUG #1: EventDetailPage - Coordinator Check Fails**
**File:** `src/pages/events/EventDetailPage.jsx` (Lines 122-123)

**Issue:**
```javascript
const isCoordinatorForClub = user?.roles?.global === 'coordinator' && 
                              event?.club?.coordinator === user._id;
```

**Problem:**
- `event?.club?.coordinator` is likely an ObjectId reference (string)
- Comparing with `user._id` which might be an object
- **Result:** Coordinator approval button NEVER shows, even for assigned coordinators

**Expected:**
```javascript
const isCoordinatorForClub = user?.roles?.global === 'coordinator' && 
                              event?.club?.coordinator?._id === user._id;
// OR if backend sends just ID:
const isCoordinatorForClub = user?.roles?.global === 'coordinator' && 
                              event?.club?.coordinator === user._id?.toString();
```

**Impact:** 🔴 HIGH - Coordinators can't approve events!

---

### **BUG #2: ClubDashboard - Coordinator Permission Check**
**File:** `src/pages/clubs/ClubDashboard.jsx` (Lines 105-106)

**Issue:**
```javascript
const isAssignedCoordinator = user?.roles?.global === 'coordinator' && 
                               clubData?.coordinator?._id === user._id;
```

**Problem:**
- Same as Bug #1 - ObjectId comparison might fail
- Needs verification of backend data structure

**Impact:** 🔴 HIGH - Coordinators might not be able to manage assigned clubs

---

## 🟠 MAJOR BUGS

### **BUG #3: EventsPage - Missing Filter Buttons**
**File:** `src/pages/events/EventsPage.jsx` (Lines 67-94)

**Issue:**
- UI only shows: All, Upcoming, Ongoing, Completed
- Code supports `draft`, `pending_coordinator`, `pending_admin` filters (line 31-32)
- **But NO buttons for these filters!**

**Missing Buttons:**
```javascript
// Should have:
<button onClick={() => setFilter('draft')}>My Drafts</button>       // For club members
<button onClick={() => setFilter('pending_coordinator')}>Pending Approval</button>  // For coordinators
<button onClick={() => setFilter('pending_admin')}>Admin Review</button>  // For admins
```

**Impact:** 🟠 MEDIUM - Coordinators/admins can't see pending events easily, must view all events

---

### **BUG #4: EventDetailPage - Missing Edit/Delete Buttons**
**File:** `src/pages/events/EventDetailPage.jsx`

**Issue:**
- Has Submit, Approve, Start, Complete buttons
- **NO Edit or Delete buttons** even for club managers with `canManage = true`

**Missing:**
```javascript
{canManage && event?.status === 'draft' && (
  <>
    <button onClick={handleEdit}>✏️ Edit Event</button>
    <button onClick={handleDelete}>🗑️ Delete Event</button>
  </>
)}
```

**Impact:** 🟠 MEDIUM - Club members can't edit or delete their draft events

---

### **BUG #5: ClubDashboard - Archive Button Restricted**
**File:** `src/pages/clubs/ClubDashboard.jsx` (Line 256)

**Issue:**
```javascript
{(user?.roles?.global === 'admin' || userRole === 'president') && (
  <button onClick={handleArchiveClub}>🗑️ Archive Club</button>
)}
```

**Problem:**
- Only President (Sr Club Head) can archive
- Vice President (Jr Club Head) should probably also have this permission
- Or at least assigned coordinators

**Expected:**
```javascript
{(user?.roles?.global === 'admin' || 
  userRole === 'president' || 
  userRole === 'vicePresident' ||
  (user?.roles?.global === 'coordinator' && isAssignedCoordinator)) && (
  <button onClick={handleArchiveClub}>🗑️ Archive Club</button>
)}
```

**Impact:** 🟠 MEDIUM - Vice Presidents can't archive clubs even though they're leadership

---

## 🟡 MINOR BUGS

### **BUG #6: RecruitmentDetailPage - 3-Club Limit UI**
**File:** `src/pages/recruitments/RecruitmentDetailPage.jsx` (Lines 179-187)

**Issue:**
- Shows warning when user has 3 clubs
- **But still shows the entire application form below it!**

**Problem:**
```javascript
{myClubsCount >= 3 && (
  <div className="alert">You've reached the limit</div>
)}

<form onSubmit={handleSubmit}>  {/* ❌ STILL VISIBLE! */}
```

**Expected:**
```javascript
{myClubsCount >= 3 ? (
  <div className="alert">You've reached the limit</div>
) : (
  <form onSubmit={handleSubmit}>  {/* ✅ HIDDEN when limit reached */}
)}
```

**Impact:** 🟡 LOW - Confusing UX, user can fill form but can't submit

---

### **BUG #7: ClubDashboard - No Pending Member Approval**
**File:** `src/pages/clubs/ClubDashboard.jsx` (Lines 578-580)

**Issue:**
- Shows member status badges: "approved" or "pending"
- Has Edit/Remove buttons for members
- **But NO "Approve" button for pending members!**

**Missing:**
```javascript
{member.status === 'pending' && canManage && (
  <button onClick={() => handleApproveMember(member._id)}>
    ✓ Approve Member
  </button>
)}
```

**Impact:** 🟡 LOW - Can't approve pending members from dashboard (might need backend check too)

---

### **BUG #8: EventsPage - Status Badge Incomplete**
**File:** `src/pages/events/EventsPage.jsx` (Lines 46-53)

**Issue:**
```javascript
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'published': return 'badge-success';
    case 'ongoing': return 'badge-info';
    case 'completed': return 'badge-secondary';
    case 'pending_coordinator': return 'badge-warning';  // ✅ Has this
    default: return 'badge-info';
  }
};
```

**Missing:**
- `draft` → should be `badge-secondary`
- `pending_admin` → should be `badge-warning`
- `cancelled` → should be `badge-danger`
- `approved` → should be `badge-success`

**Impact:** 🟡 LOW - Wrong badge colors for some statuses

---

## 📋 PERMISSION LOGIC ISSUES

### **ISSUE #1: ClubDetailPage - No Permission Checks**
**File:** `src/pages/clubs/ClubDetailPage.jsx`

**Observation:**
- This is a PUBLIC page - shows club info to everyone
- No "Edit" or "Manage" buttons
- **This is actually CORRECT behavior** for a public detail page
- Club management is in `ClubDashboard.jsx` instead

**Status:** ✅ NOT A BUG - Working as intended

---

### **ISSUE #2: Event Visibility Logic**
**Current Logic:**
- EventsPage shows ALL events with selected filter
- No automatic filtering by role

**Question:**
- Should students ONLY see `published`, `ongoing`, `completed`?
- Should `draft` events be hidden from students?
- Currently backend probably handles this, but frontend doesn't enforce it

**Recommendation:**
```javascript
// Add role-based filter restrictions
const getAvailableFilters = () => {
  if (user?.roles?.global === 'admin') {
    return ['all', 'upcoming', 'ongoing', 'completed', 'draft', 'pending_coordinator', 'pending_admin'];
  } else if (user?.roles?.global === 'coordinator') {
    return ['all', 'upcoming', 'ongoing', 'completed', 'pending_coordinator'];
  } else {
    return ['all', 'upcoming', 'ongoing', 'completed'];  // Students
  }
};
```

---

## 📊 SUMMARY

### **Critical Bugs (Fix Immediately):**
1. ✅ EventDetailPage - Coordinator check comparison bug
2. ✅ ClubDashboard - Coordinator permission check bug

### **Major Bugs (Fix Soon):**
3. ✅ EventsPage - Add missing filter buttons for draft/pending events
4. ✅ EventDetailPage - Add Edit/Delete buttons
5. ✅ ClubDashboard - Allow VP to archive clubs

### **Minor Bugs (Nice to Fix):**
6. ✅ RecruitmentDetailPage - Hide form when 3-club limit reached
7. ✅ ClubDashboard - Add approve pending member button
8. ✅ EventsPage - Complete status badge colors

### **Questions to Verify:**
- Is coordinator sent as populated object or just ID?
- Should VP be able to archive clubs?
- Should pending members be approvable from dashboard?
- What's the exact event visibility logic by role?

---

## 🎯 PRIORITY ORDER TO FIX

**Priority 1 (Critical):**
1. Fix coordinator comparison in EventDetailPage
2. Fix coordinator comparison in ClubDashboard

**Priority 2 (Major UX):**
3. Add draft/pending filter buttons in EventsPage
4. Add Edit/Delete buttons in EventDetailPage

**Priority 3 (Enhancement):**
5. Complete event status badge colors
6. Hide recruitment form when club limit reached
7. Add VP archive permission
8. Add pending member approval button

---

**Analysis Complete!** Ready to fix bugs when you confirm. 🚀
