# 🧪 Testing Cron Job 2 - Quick Guide

## ✅ **What You Changed**
- Job 2 now runs **every minute** (instead of every hour at :30)
- This allows immediate testing

---

## 🎯 **How to Test Job 2**

### **Step 1: Prepare the Event**

You need an event with:
- **Status:** `ongoing` ✅ (Job 1 already changed "Photo Walk" to ongoing)
- **DateTime:** More than 24 hours ago ❌ (Your Photo Walk is recent)

**Option A: Update Photo Walk's dateTime to 25+ hours ago**

```javascript
// In MongoDB or via API
db.events.updateOne(
  { title: "Photo Walk" },
  { 
    $set: { 
      dateTime: new Date(Date.now() - 26 * 60 * 60 * 1000) // 26 hours ago
    }
  }
)
```

**Option B: Change Job 2 logic to test with recent events** (easier!)

In `eventStatusCron.js`, temporarily change line 79:

```javascript
// BEFORE (line 79):
const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

// CHANGE TO (for testing):
const oneDayAgo = new Date(now + 24 * 60 * 60 * 1000); // Accept ANY ongoing event
```

This will make Job 2 process ALL `ongoing` events, regardless of date.

---

### **Step 2: Restart Backend**

```bash
# Stop current backend (Ctrl+C)
npm run dev
```

---

### **Step 3: Watch the Console**

Within 1 minute, you should see:

```
🔄 [Cron Job 2] Checking events to move to pending_completion...
   ⏳ Event "Photo Walk" moved to pending_completion
   ✅ [Job 2] Completed - 1 event(s) moved to pending_completion
```

---

### **Step 4: Check Event Status**

**In MongoDB:**
```javascript
db.events.findOne({ title: "Photo Walk" }, { 
  status: 1, 
  completionDeadline: 1, 
  completionChecklist: 1 
})

// Should show:
// status: "pending_completion"
// completionDeadline: [7 days from event date]
// completionChecklist: { photosUploaded: false, ... }
```

**Or refresh your frontend and check the badge:**
- Should show: **⏳ PENDING COMPLETION** (orange)

---

## 🎯 **Expected Results**

### **If Event Has All Materials Already:**
```
🔄 [Cron Job 2] Checking events to move to pending_completion...
   ⏳ Event "Photo Walk" moved to pending_completion
   ✅ Event "Photo Walk" auto-completed (all materials uploaded)
   ✅ [Job 2] Completed - 1 event(s) moved to pending_completion
```
Status: `completed` ✅

### **If Event Missing Materials:**
```
🔄 [Cron Job 2] Checking events to move to pending_completion...
   ⏳ Event "Photo Walk" moved to pending_completion
   ✅ [Job 2] Completed - 1 event(s) moved to pending_completion
```
Status: `pending_completion` ⏳
+ Notification sent to core team with missing items

---

## 📋 **Checklist for Job 2 Test**

- [ ] Job 2 schedule changed to `* * * * *` ✅ (Done!)
- [ ] Event exists with status `ongoing` ✅ (Photo Walk)
- [ ] Event dateTime is 24+ hours old (OR logic changed for testing)
- [ ] Backend restarted
- [ ] Console shows Job 2 running
- [ ] Event status changed to `pending_completion`
- [ ] `completionDeadline` set in database
- [ ] `completionChecklist` populated
- [ ] Frontend shows ⏳ orange badge
- [ ] Notification sent to core team

---

## 🔄 **Quick Test Commands**

### **Change Event Date to 26 Hours Ago (MongoDB):**
```javascript
db.events.updateOne(
  { _id: ObjectId("your_event_id") },
  { $set: { dateTime: new Date(Date.now() - 26 * 60 * 60 * 1000) } }
)
```

### **Or Change Job 2 Logic (Line 79):**
```javascript
// Change this temporarily:
const oneDayAgo = new Date(now + 24 * 60 * 60 * 1000); // Accept all ongoing events
```

---

## ⚠️ **After Testing**

**Don't forget to change back:**

1. **Job 1 & Job 2 schedules:**
```javascript
// Line 14: Job 1
cron.schedule('0 * * * *', async () => { // Back to every hour

// Line 74: Job 2
cron.schedule('30 * * * *', async () => { // Back to every hour at :30
```

2. **Job 2 date logic (if changed):**
```javascript
// Line 79
const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000); // Back to 24 hours ago
```

---

## 🎉 **Success Indicators**

You'll know Job 2 works when:
- ✅ Console logs show Job 2 running
- ✅ Event status changes from `ongoing` → `pending_completion`
- ✅ Database has `completionDeadline` field
- ✅ Database has `completionChecklist` populated
- ✅ Frontend shows orange ⏳ badge
- ✅ Core team receives notification (if materials missing)

---

**Happy Testing!** 🚀
