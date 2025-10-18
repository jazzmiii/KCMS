# 🐛 EVENT WORKFLOW - DEBUG GUIDE

**Date:** October 16, 2025, 12:30 PM  
**Status:** ✅ **DEBUGGING ENABLED + ROLE NAMES ADDED**  
**Purpose:** Help diagnose why Start Event button might not show  

---

## 🔧 CHANGES MADE

### **1. Added ROLE_DISPLAY_NAMES** ✅
Added constant to show "Sr Club Head" and "Jr Club Head":
```javascript
const ROLE_DISPLAY_NAMES = {
  president: 'Sr Club Head',
  vicePresident: 'Jr Club Head',
  core: 'Core Team',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  leadPR: 'Lead - PR',
  leadTech: 'Lead - Tech',
  member: 'Member'
};
```

### **2. Added Debug Logging** ✅
Console logs now show:
- Event ID
- Event Status
- canManage permission
- User Role
- Is Coordinator for Club
- Club Name

Open browser console (F12) to see these logs!

### **3. Added Debug Info Card** ✅
Yellow card shows event managers:
- Current event status
- Can Manage permission
- User's role
- Button visibility logic

### **4. Improved Status Display** ✅
Status badge now shows:
- DRAFT (gray)
- PENDING COORDINATOR (yellow)
- PENDING ADMIN (yellow)
- APPROVED (blue)
- PUBLISHED (green)
- ONGOING (blue)
- COMPLETED (gray)
- CANCELLED (red)

### **5. Added "Organized by" Label** ✅
Shows which club is organizing the event

---

## 📋 EVENT WORKFLOW - COMPLETE

### **Status Flow:**
```
DRAFT
  ↓ (Club member clicks "Submit for Approval")
PENDING_COORDINATOR
  ↓ (Coordinator clicks "Approve Event")
PENDING_ADMIN (if requiresAdminApproval = true)
  ↓ (Admin clicks "Approve as Admin")
PUBLISHED
  ↓ (Event creator clicks "Start Event")
ONGOING
  ↓ (Event creator clicks "Complete Event")
COMPLETED
```

---

## 🔘 BUTTON VISIBILITY RULES

### **Draft Status:**
```javascript
{canManage && event?.status === 'draft' && (
  <>
    <button>✏️ Edit Event</button>
    <button>🗑️ Delete Event</button>
    <button>Submit for Approval</button>
  </>
)}
```
**Who sees:** Club members with canManage = true  
**When:** Event status is "draft"

---

### **Pending Coordinator:**
```javascript
{isCoordinatorForClub && event?.status === 'pending_coordinator' && (
  <button>✓ Approve Event</button>
)}
```
**Who sees:** Coordinator assigned to the club  
**When:** Event status is "pending_coordinator"

---

### **Pending Admin:**
```javascript
{user?.roles?.global === 'admin' && event?.status === 'pending_admin' && (
  <button>✓ Approve as Admin</button>
)}
```
**Who sees:** Admins only  
**When:** Event status is "pending_admin"

---

### **Published Status - START EVENT BUTTON:**
```javascript
{canManage && event?.status === 'published' && (
  <button>Start Event</button>
)}
```
**Who sees:** Club members with canManage = true  
**When:** Event status is "published"  
**Action:** Changes status to "ongoing"

---

### **Ongoing Status:**
```javascript
{canManage && event?.status === 'ongoing' && (
  <button>Complete Event</button>
)}
```
**Who sees:** Club members with canManage = true  
**When:** Event status is "ongoing"  
**Action:** Changes status to "completed"

---

## 🐛 TROUBLESHOOTING

### **Issue: "Start Event" button not showing**

**Possible causes:**

1. **Status is not "published"**
   - Check debug card: What status does it show?
   - Event might still be "draft", "pending_coordinator", "pending_admin", or "approved"
   - Solution: Complete the approval workflow first

2. **canManage is false**
   - Check debug card: Does it say "Can Manage: YES ✅"?
   - User might not be a club member
   - User might not have core/leadership role
   - Solution: Check user's club membership and role

3. **Event already started**
   - Status might already be "ongoing" or "completed"
   - Check status badge at top
   - Solution: If ongoing, you'll see "Complete Event" instead

4. **Cached data**
   - Browser might have old data
   - Solution: Hard refresh (Ctrl+Shift+R) or clear cache

---

## 📊 HOW TO DEBUG

### **Step 1: Open Browser Console**
```
Press F12 → Console tab
```

### **Step 2: Look for Debug Log**
```
🔍 Event Detail Debug: {
  eventId: "...",
  eventStatus: "draft",  ← CHECK THIS!
  canManage: true,       ← CHECK THIS!
  isPublished: false,
  userId: "...",
  userRole: "student",
  isCoordinatorForClub: false,
  clubName: "..."
}
```

### **Step 3: Check Debug Card (Yellow Card)**
Scroll down on event detail page to see:
- Event Status
- Can Manage permission
- Your Role
- Button visibility logic

### **Step 4: Verify Status**
The status badge at the top should match what you expect:
- DRAFT → Gray
- PENDING COORDINATOR → Yellow
- PENDING ADMIN → Yellow
- PUBLISHED → Green ← Need this for "Start Event"
- ONGOING → Blue
- COMPLETED → Gray

---

## ✅ EXPECTED BEHAVIOR

### **Scenario 1: Draft Event**
```
Status: DRAFT (gray badge)
Buttons visible (if canManage = true):
  ✏️ Edit Event
  🗑️ Delete Event
  Submit for Approval
```

### **Scenario 2: Pending Coordinator**
```
Status: PENDING COORDINATOR (yellow badge)
Buttons visible (if coordinator):
  ✓ Approve Event
```

### **Scenario 3: Published Event**
```
Status: PUBLISHED (green badge)
Buttons visible (if canManage = true):
  Start Event ← THIS IS WHAT YOU WANT
```

### **Scenario 4: Ongoing Event**
```
Status: ONGOING (blue badge)
Buttons visible (if canManage = true):
  Complete Event
```

---

## 🔍 PERMISSION CHECK

### **Who can manage events?**

Backend sets `canManage` flag based on:
- ✅ Club President (Sr Club Head)
- ✅ Club Vice President (Jr Club Head)
- ✅ Club Core Team members
- ✅ Club Secretary, Treasurer, Leads
- ✅ Admins (global role)
- ✅ Assigned Coordinators (for their clubs)

### **How to verify your permission:**

1. Go to event detail page
2. Scroll down to yellow debug card
3. Check "Can Manage" line
4. If it says "NO ❌", you don't have permission

---

## 🚀 QUICK FIXES

### **Fix #1: Status stuck in draft**
**Problem:** Event status is "draft", buttons don't work  
**Solution:** Click "Submit for Approval" button

### **Fix #2: Status stuck in pending**
**Problem:** Event status is "pending_coordinator" or "pending_admin"  
**Solution:** Wait for coordinator/admin to approve OR login as coordinator/admin

### **Fix #3: Can't see any buttons**
**Problem:** No buttons visible at all  
**Solution:** Check if canManage = true in debug card. If false, you're not a club member/manager

### **Fix #4: Event already started**
**Problem:** Status is "ongoing", no "Start Event" button  
**Solution:** Event is already started! You should see "Complete Event" instead

---

## 📁 FILES MODIFIED

1. **EventDetailPage.jsx**
   - Added ROLE_DISPLAY_NAMES constant
   - Added debug console logging
   - Added debug info card
   - Improved status badge display
   - Added "Organized by" label

---

## 🧪 TESTING STEPS

### **Test 1: Create New Event**
1. Login as club member (core/leadership)
2. Create new event
3. Event should be in DRAFT status
4. Should see: Edit, Delete, Submit buttons

### **Test 2: Submit for Approval**
1. Click "Submit for Approval"
2. Status changes to PENDING COORDINATOR
3. Buttons disappear (no longer draft)

### **Test 3: Coordinator Approval**
1. Login as coordinator (assigned to club)
2. Open event
3. Should see "✓ Approve Event" button
4. Click to approve
5. Status changes to PUBLISHED (or PENDING ADMIN if required)

### **Test 4: Start Event**
1. Login as event creator
2. Open event
3. Status should be PUBLISHED (green)
4. Should see "Start Event" button ← THIS IS KEY
5. Click to start
6. Status changes to ONGOING

### **Test 5: Complete Event**
1. Event must be ONGOING
2. Should see "Complete Event" button
3. Click to complete
4. Status changes to COMPLETED

---

## 📝 NOTES

### **Why "Start Event" might not show:**

1. **Most Common:** Event status is not "published"
   - Still in draft/pending/approved
   - Need to complete approval workflow first

2. **Permission Issue:** canManage is false
   - User is not club member
   - User doesn't have management role

3. **Already Started:** Event status is "ongoing"
   - Event was already started
   - Should see "Complete Event" instead

4. **Backend Issue:** Event data not loaded
   - Check if event object exists
   - Check console for API errors

---

## 🎯 SUMMARY

**What we added:**
✅ ROLE_DISPLAY_NAMES for "Sr Club Head" / "Jr Club Head"  
✅ Debug console logging  
✅ Debug info card (yellow) for managers  
✅ Improved status badge display  
✅ "Organized by" club name  

**How to debug:**
1. Open browser console (F12)
2. Check debug logs
3. Look at yellow debug card on page
4. Verify event status (badge at top)
5. Check canManage permission

**Most likely issue:**
- Event status is NOT "published"
- Need to complete approval workflow first
- Submit for approval → Coordinator approve → (Admin approve if needed) → PUBLISHED → Start Event button appears

---

**Open browser console and check debug info to see exactly what's happening!** 🔍
