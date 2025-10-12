# 🐛 CRITICAL BUGS TO FIX IMMEDIATELY

## Priority: 🔴 URGENT - Fix Today

---

## 1. Variable Name Bug in Password Reset

**File**: `src/modules/auth/auth.service.js` (Line 292)

**Bug**:
```javascript
if (user.forgotPasswordRequestedAt &&
    Date.now() - user.forgotPasswordRequestedAt < RESET_COOLDOWN_MS) {
  // ❌ RESET_COOLDOWN_MS is not defined!
```

**Fix**:
```javascript
if (user.forgotPasswordRequestedAt &&
    Date.now() - user.forgotPasswordRequestedAt < RESET_COOLDOWN) {
  // ✅ Use RESET_COOLDOWN (defined on line 17)
```

**Impact**: Password reset will crash with "ReferenceError: RESET_COOLDOWN_MS is not defined"

---

## 2. Event Approval Status Overwrite

**File**: `src/modules/event/event.service.js` (Lines 110-111)

**Bug**:
```javascript
else if (action === 'approve' && prevStatus === 'pending_coordinator') {
  evt.status = 'approved';
  evt.status = 'published'; // ❌ This overwrites the line above!
```

**Fix**:
```javascript
else if (action === 'approve' && prevStatus === 'pending_coordinator') {
  // Check if admin approval needed
  if (evt.budget > 5000 || evt.guestSpeakers?.length > 0) {
    evt.status = 'pending_admin';
    // Notify admin
    await notificationSvc.create({
      user: adminId, // Get from config or User.findOne({ 'roles.global': 'admin' })
      type: 'approval_required',
      payload: { eventId: id, reason: 'budget/guests' },
      priority: 'HIGH'
    });
  } else {
    evt.status = 'approved';
  }
```

**Impact**: Events skip admin approval even when budget > 5000

---

## 3. Concurrent Session Limit Not Enforced

**File**: `src/modules/auth/auth.service.js` (Lines 205-210)

**Bug**:
```javascript
// issue tokens / complete profile
const result = await this.completeProfile(user._id, user.profile, userContext);

// enforce max 3 sessions
const sessions = await Session.find({ user: user._id, revokedAt: null }).sort({ createdAt: 1 });
if (sessions.length > 3) {
  // ❌ This runs AFTER creating new session, so it's already 4 sessions!
```

**Fix**:
```javascript
// enforce max 3 sessions BEFORE creating new one
const sessions = await Session.find({ user: user._id, revokedAt: null }).sort({ createdAt: 1 });
if (sessions.length >= 3) {
  // Revoke oldest session to make room
  const oldest = sessions[0];
  oldest.revokedAt = new Date();
  await oldest.save();
}

// NOW issue tokens / complete profile
const result = await this.completeProfile(user._id, user.profile, userContext);
```

**Impact**: Users can have 4+ concurrent sessions instead of max 3

---

## 4. OTP Resend Rate Limit Not Checked

**File**: `src/modules/auth/auth.service.js` (Lines 35-38)

**Bug**:
```javascript
await redis.multi()
  .set(key, otp, 'EX', 600)
  .incr(`${key}:count`)
  .expire(`${key}:count`, 3600)
  .exec();
// ❌ Count is incremented but never checked!
```

**Fix**:
```javascript
// Check resend count first
const resendCount = await redis.get(`${key}:resend`) || 0;
if (resendCount >= 3) {
  const err = new Error('Maximum OTP resend attempts (3/hour) exceeded');
  err.statusCode = 429;
  throw err;
}

// Generate and store OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();
await redis.multi()
  .set(key, otp, 'EX', 600)
  .incr(`${key}:resend`)
  .expire(`${key}:resend`, 3600)
  .exec();
```

**Impact**: Users can spam OTP requests unlimited times

---

## 5. Password Validation Missing rollNumber Check

**File**: `src/modules/auth/auth.validators.js` (Lines 9-12)

**Bug**:
```javascript
password: Joi.string().min(8)
  .pattern(/[A-Z]/).pattern(/[a-z]/)
  .pattern(/\d/).pattern(/[^A-Za-z0-9]/)
  .pattern(passwordPattern).required(),
// ❌ Doesn't check if password contains rollNumber
```

**Fix**:
```javascript
password: Joi.string().min(8)
  .pattern(/[A-Z]/, 'uppercase').message('Password must contain at least 1 uppercase letter')
  .pattern(/[a-z]/, 'lowercase').message('Password must contain at least 1 lowercase letter')
  .pattern(/\d/, 'digit').message('Password must contain at least 1 number')
  .pattern(/[^A-Za-z0-9]/, 'special').message('Password must contain at least 1 special character')
  .pattern(passwordPattern, 'common').message('Password is too common')
  .custom((value, helpers) => {
    const rollNumber = helpers.state.ancestors[0].rollNumber;
    if (rollNumber && value.toLowerCase().includes(rollNumber.toLowerCase())) {
      return helpers.error('password.containsRollNumber');
    }
    return value;
  })
  .required()
  .messages({
    'password.containsRollNumber': 'Password cannot contain your roll number'
  }),
```

**Impact**: Users can set password as their rollNumber (security risk)

---

## 6. Progressive Login Delay Capped Too Low

**File**: `src/modules/auth/auth.service.js` (Line 194)

**Bug**:
```javascript
await new Promise(r => setTimeout(r, Math.min(5, user.loginAttempts) * 1000));
// ❌ Max delay is 5 seconds, should be 16 seconds
```

**Fix**:
```javascript
// Exponential backoff: 1s, 2s, 4s, 8s, 16s
const delay = Math.min(Math.pow(2, user.loginAttempts - 1), 16) * 1000;
await new Promise(r => setTimeout(r, delay));
```

**Impact**: Brute force attacks not sufficiently slowed down

---

## 7. Notification Batching Not Implemented

**File**: `src/workers/notification.worker.js` (Lines 28-31)

**Bug**:
```javascript
if (job.name === 'flushBatch') {
  // TODO: fetch non-urgent queued notifications and send in batches
  return;
}
// ❌ Batching is completely stubbed!
```

**Fix**:
```javascript
if (job.name === 'flushBatch') {
  // Fetch all non-urgent unsent notifications
  const notifications = await Notification.find({
    priority: { $ne: 'URGENT' },
    sentAt: null,
    createdAt: { $lte: new Date(Date.now() - 4 * 60 * 60 * 1000) } // 4 hours old
  }).populate('user', 'email').limit(50);

  // Group by user
  const grouped = {};
  for (const notif of notifications) {
    const email = notif.user.email;
    if (!grouped[email]) grouped[email] = [];
    grouped[email].push(notif);
  }

  // Send batch emails
  for (const [email, notifs] of Object.entries(grouped)) {
    const { subject, html, text } = renderBatchEmail(notifs);
    await sendMail({ to: email, subject, html, text });
    
    // Mark as sent
    await Notification.updateMany(
      { _id: { $in: notifs.map(n => n._id) } },
      { sentAt: new Date() }
    );
  }
  return;
}
```

**Impact**: Non-urgent notifications sent individually (email spam)

---

## 8. MongoDB Text Indexes Missing

**Impact**: Search is extremely slow, falls back to regex

**Fix**: Run these commands in MongoDB shell or add to migration script:

```javascript
// Create text indexes for fast search
db.clubs.createIndex({ 
  name: "text", 
  description: "text", 
  vision: "text", 
  mission: "text" 
}, { 
  weights: { name: 10, description: 5, vision: 3, mission: 3 },
  name: "club_text_index" 
});

db.events.createIndex({ 
  title: "text", 
  description: "text", 
  objectives: "text" 
}, { 
  weights: { title: 10, description: 5, objectives: 3 },
  name: "event_text_index" 
});

db.users.createIndex({ 
  "profile.name": "text", 
  email: "text", 
  rollNumber: "text" 
}, { 
  weights: { "profile.name": 10, rollNumber: 8, email: 5 },
  name: "user_text_index" 
});

db.documents.createIndex({ 
  "metadata.filename": "text", 
  album: "text" 
}, { 
  weights: { "metadata.filename": 10, album: 5 },
  name: "document_text_index" 
});
```

**Add to**: `src/config/database.js` or create `src/scripts/createIndexes.js`

---

## 9. Recruitment Auto-Transitions Missing

**Impact**: Recruitments never auto-open or auto-close

**Fix**: Create `src/workers/recruitment.scheduler.js`:

```javascript
const cron = require('node-cron');
const { Recruitment } = require('../modules/recruitment/recruitment.model');
const notificationService = require('../modules/notification/notification.service');
const { User } = require('../modules/auth/user.model');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  
  // 1. Auto-open scheduled recruitments
  const toOpen = await Recruitment.find({
    status: 'scheduled',
    startDate: { $lte: now }
  });
  
  for (const rec of toOpen) {
    rec.status = 'open';
    await rec.save();
    
    // Notify all eligible students
    const students = await User.find({ 
      status: 'profile_complete',
      'roles.global': 'student'
    }).select('_id');
    
    for (const student of students) {
      await notificationService.create({
        user: student._id,
        type: 'recruitment_open',
        payload: { recruitmentId: rec._id, title: rec.title },
        priority: 'MEDIUM'
      });
    }
  }
  
  // 2. Mark as closing_soon (24 hours before end)
  const closingSoonTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const toClosingSoon = await Recruitment.find({
    status: 'open',
    endDate: { $lte: closingSoonTime, $gt: now }
  });
  
  for (const rec of toClosingSoon) {
    rec.status = 'closing_soon';
    await rec.save();
    
    // Notify applicants
    const applications = await mongoose.model('Application')
      .find({ recruitment: rec._id })
      .distinct('user');
    
    for (const userId of applications) {
      await notificationService.create({
        user: userId,
        type: 'recruitment_closing',
        payload: { recruitmentId: rec._id, title: rec.title },
        priority: 'HIGH'
      });
    }
  }
  
  // 3. Auto-close expired recruitments
  const toClose = await Recruitment.find({
    status: { $in: ['open', 'closing_soon'] },
    endDate: { $lte: now }
  });
  
  for (const rec of toClose) {
    rec.status = 'closed';
    await rec.save();
  }
});

console.log('Recruitment scheduler started');
```

**Add to**: `src/server.js` startup:

```javascript
if (config.START_SCHEDULERS) {
  require('./workers/recruitment.scheduler');
}
```

---

## 10. Event Model Missing isOffCampus Field

**File**: `src/modules/event/event.model.js`

**Bug**: Missing field required for admin approval logic

**Fix**: Add to EventSchema:

```javascript
const EventSchema = new mongoose.Schema({
  // ... existing fields ...
  isOffCampus: { type: Boolean, default: false }, // ADD THIS
  requiresSafetyApproval: { type: Boolean, default: false }, // ADD THIS
  // ... rest of fields ...
});
```

---

## 📋 TESTING CHECKLIST

After fixing these bugs, test:

- [ ] Password reset flow (check cooldown works)
- [ ] Event approval with budget > 5000 (should go to admin)
- [ ] Login with 4th session (should revoke oldest)
- [ ] OTP resend 4 times (should fail on 4th)
- [ ] Password with rollNumber (should be rejected)
- [ ] Login with wrong password 10 times (delays should increase exponentially)
- [ ] Non-urgent notifications (should batch after 4 hours)
- [ ] Search clubs/events (should be fast with text indexes)
- [ ] Recruitment auto-open at startDate
- [ ] Recruitment auto-close at endDate
- [ ] Event with isOffCampus=true (should require admin approval)

---

## 🚀 DEPLOYMENT NOTES

1. **Database Migration Required**:
   - Run MongoDB index creation script
   - Add isOffCampus field to existing events (default: false)

2. **Environment Variables**:
   - Verify RESET_COOLDOWN is set (no RESET_COOLDOWN_MS)

3. **Worker Restart**:
   - Restart notification worker after batching fix
   - Start recruitment scheduler

4. **Testing**:
   - Test all 10 fixes in staging before production
   - Monitor error logs for 24 hours after deployment

---

**Estimated Fix Time**: 6-8 hours for all 10 bugs
**Risk Level**: Medium (mostly logic fixes, no schema breaking changes)
**Rollback Plan**: Keep old code in git branch, can revert if issues arise
