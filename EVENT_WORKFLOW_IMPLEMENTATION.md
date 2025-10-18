# 🚀 Event Management Implementation Plan

**Priority Focus:** Event Status Workflow + Registration System

---

## 📦 PHASE 1: Event Status Workflow (Week 1)

### **Task 1.1: Update Event Model**

**File:** `Backend/src/modules/event/event.model.js`

```javascript
// ADD these fields to EventSchema

status: {
  type: String,
  enum: [
    'draft', 'pending_coordinator', 'pending_admin', 
    'rejected', 'approved', 'published', 
    'ongoing',              // ✅ Day of event
    'pending_completion',   // ✅ NEW: 7-day grace period
    'completed',
    'incomplete',           // ✅ NEW: Failed completion
    'archived'
  ],
  default: 'draft'
},

// Completion tracking
completionDeadline: { type: Date },
completionReminderSent: {
  day3: { type: Boolean, default: false },
  day5: { type: Boolean, default: false }
},
completionChecklist: {
  photosUploaded: { type: Boolean, default: false },
  reportUploaded: { type: Boolean, default: false },
  attendanceUploaded: { type: Boolean, default: false },
  billsUploaded: { type: Boolean, default: false }
},
completedAt: { type: Date },
markedIncompleteAt: { type: Date },
incompleteReason: { type: String }
```

---

### **Task 1.2: Create Cron Jobs**

**File:** `Backend/src/jobs/eventStatusCron.js` (NEW FILE)

```javascript
const cron = require('node-cron');
const { Event } = require('../modules/event/event.model');
const notificationService = require('../modules/notification/notification.service');

// Job 1: Start ongoing events (runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('🔄 [Cron] Checking for events to mark as ongoing...');
  
  const now = new Date();
  const events = await Event.find({
    status: 'published',
    dateTime: { 
      $lte: now,
      $gte: new Date(now - 24 * 60 * 60 * 1000)
    }
  }).populate('club');
  
  for (const event of events) {
    event.status = 'ongoing';
    await event.save();
    console.log(`✅ Event "${event.title}" marked as ongoing`);
    
    // Notify organizers
    await notificationService.create({
      user: event.createdBy,
      type: 'event_reminder',
      payload: { 
        eventId: event._id, 
        eventName: event.title,
        message: 'Your event is now live! QR code is active for attendance.'
      },
      priority: 'HIGH'
    });
  }
});

// Job 2: Move to pending_completion (runs every hour at :30)
cron.schedule('30 * * * *', async () => {
  console.log('🔄 [Cron] Checking events to move to pending_completion...');
  
  const now = new Date();
  const events = await Event.find({
    status: 'ongoing',
    dateTime: { $lt: new Date(now - 24 * 60 * 60 * 1000) }
  }).populate('club');
  
  for (const event of events) {
    event.status = 'pending_completion';
    event.completionDeadline = new Date(event.dateTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Check current completion status
    event.completionChecklist = {
      photosUploaded: (event.photos && event.photos.length >= 5),
      reportUploaded: !!event.reportUrl,
      attendanceUploaded: !!event.attendanceUrl,
      billsUploaded: event.budget > 0 ? (event.billsUrls && event.billsUrls.length > 0) : true
    };
    
    await event.save();
    console.log(`⏳ Event "${event.title}" moved to pending_completion`);
    
    // If already complete, mark as completed
    const isComplete = Object.values(event.completionChecklist).every(v => v === true);
    if (isComplete) {
      event.status = 'completed';
      event.completedAt = new Date();
      await event.save();
      console.log(`✅ Event "${event.title}" auto-completed (all materials uploaded)`);
    } else {
      // Send initial reminder
      const missing = [];
      if (!event.completionChecklist.photosUploaded) missing.push('photos (min 5)');
      if (!event.completionChecklist.reportUploaded) missing.push('event report');
      if (!event.completionChecklist.attendanceUploaded) missing.push('attendance sheet');
      if (!event.completionChecklist.billsUploaded) missing.push('bills/receipts');
      
      await notificationService.create({
        user: event.createdBy,
        type: 'approval_required',
        payload: {
          eventId: event._id,
          eventName: event.title,
          message: `Please upload: ${missing.join(', ')} within 7 days.`
        },
        priority: 'HIGH'
      });
    }
  }
});

// Job 3: Send reminders (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  console.log('🔄 [Cron] Sending completion reminders...');
  
  const now = new Date();
  
  // Day 3 reminders
  const day3Events = await Event.find({
    status: 'pending_completion',
    completionDeadline: {
      $lte: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      $gte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    },
    'completionReminderSent.day3': false
  }).populate('club');
  
  for (const event of day3Events) {
    const missing = [];
    if (!event.completionChecklist.photosUploaded) missing.push('photos');
    if (!event.completionChecklist.reportUploaded) missing.push('report');
    if (!event.completionChecklist.attendanceUploaded) missing.push('attendance');
    if (!event.completionChecklist.billsUploaded) missing.push('bills');
    
    await notificationService.create({
      user: event.createdBy,
      type: 'event_reminder',
      payload: {
        eventId: event._id,
        eventName: event.title,
        message: `⏰ 4 days left! Still need: ${missing.join(', ')}`
      },
      priority: 'HIGH'
    });
    
    event.completionReminderSent.day3 = true;
    await event.save();
    console.log(`📧 Day 3 reminder sent for "${event.title}"`);
  }
  
  // Day 5 reminders (URGENT)
  const day5Events = await Event.find({
    status: 'pending_completion',
    completionDeadline: {
      $lte: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      $gte: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
    },
    'completionReminderSent.day5': false
  }).populate('club');
  
  for (const event of day5Events) {
    const missing = [];
    if (!event.completionChecklist.photosUploaded) missing.push('photos');
    if (!event.completionChecklist.reportUploaded) missing.push('report');
    if (!event.completionChecklist.attendanceUploaded) missing.push('attendance');
    if (!event.completionChecklist.billsUploaded) missing.push('bills');
    
    await notificationService.create({
      user: event.createdBy,
      type: 'event_reminder',
      payload: {
        eventId: event._id,
        eventName: event.title,
        message: `🚨 URGENT: 2 days left! Upload: ${missing.join(', ')} or event will be marked incomplete.`
      },
      priority: 'URGENT'
    });
    
    // Also notify coordinator
    await notificationService.create({
      user: event.club.coordinator,
      type: 'approval_required',
      payload: {
        eventId: event._id,
        eventName: event.title,
        clubName: event.club.name,
        message: `Event completion deadline approaching. Missing: ${missing.join(', ')}`
      },
      priority: 'HIGH'
    });
    
    event.completionReminderSent.day5 = true;
    await event.save();
    console.log(`🚨 Day 5 URGENT reminder sent for "${event.title}"`);
  }
});

// Job 4: Mark incomplete events (runs daily at 10 AM)
cron.schedule('0 10 * * *', async () => {
  console.log('🔄 [Cron] Checking for incomplete events...');
  
  const now = new Date();
  const events = await Event.find({
    status: 'pending_completion',
    completionDeadline: { $lt: now }
  }).populate('club');
  
  for (const event of events) {
    event.status = 'incomplete';
    event.markedIncompleteAt = now;
    
    const missing = [];
    if (!event.completionChecklist.photosUploaded) missing.push('Photos (min 5)');
    if (!event.completionChecklist.reportUploaded) missing.push('Event report');
    if (!event.completionChecklist.attendanceUploaded) missing.push('Attendance sheet');
    if (!event.completionChecklist.billsUploaded) missing.push('Bills/receipts');
    
    event.incompleteReason = `7-day deadline passed. Missing: ${missing.join(', ')}`;
    await event.save();
    
    console.log(`❌ Event "${event.title}" marked as incomplete`);
    
    // Notify organizer
    await notificationService.create({
      user: event.createdBy,
      type: 'request_rejected',
      payload: {
        eventId: event._id,
        eventName: event.title,
        message: `Event marked incomplete due to missing materials: ${missing.join(', ')}`
      },
      priority: 'URGENT'
    });
    
    // Notify coordinator
    await notificationService.create({
      user: event.club.coordinator,
      type: 'approval_required',
      payload: {
        eventId: event._id,
        eventName: event.title,
        clubName: event.club.name,
        message: `Event marked incomplete. Missing: ${missing.join(', ')}`
      },
      priority: 'HIGH'
    });
  }
});

console.log('✅ Event status cron jobs initialized');
```

**Register in:** `Backend/src/server.js`

```javascript
// Add after database connection
require('./jobs/eventStatusCron');
```

---

## 📦 PHASE 2: Enhanced Registration (Week 2)

### **Task 2.1: Update EventRegistration Model**

**File:** `Backend/src/modules/event/eventRegistration.model.js`

```javascript
const EventRegistrationSchema = new mongoose.Schema({
  event: { type: ObjectId, ref: 'Event', required: true, index: true },
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  
  registrationType: {
    type: String,
    enum: ['rsvp', 'performer'],  // Changed 'audience' to 'rsvp'
    required: true,
    default: 'rsvp'
  },
  
  // NEW: For multi-club collaboration
  selectedClub: { 
    type: ObjectId, 
    ref: 'Club'
    // Required when event has multiple participatingClubs
  },
  
  performanceType: String,
  performanceDescription: String,
  
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'approved', 'rejected', 'cancelled'],
    default: function() {
      return this.registrationType === 'rsvp' ? 'confirmed' : 'pending';
    }
  },
  
  // Attendance tracking
  attended: { type: Boolean, default: false },
  checkInTime: Date,
  checkInMethod: { type: String, enum: ['qr', 'manual'], default: 'qr' },
  
  approvedBy: { type: ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: String,
  notes: String,
  
  // Cancellation
  cancelledAt: Date,
  cancellationReason: String
}, { timestamps: true });

// CRITICAL: No duplicate registrations
EventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

// Validation: selectedClub must be in participatingClubs
EventRegistrationSchema.pre('save', async function(next) {
  if (this.isNew && this.selectedClub) {
    const event = await mongoose.model('Event').findById(this.event);
    const clubIds = event.participatingClubs.map(c => c.toString());
    
    if (!clubIds.includes(this.selectedClub.toString())) {
      return next(new Error('Selected club is not participating in this event'));
    }
  }
  next();
});
```

---

### **Task 2.2: Registration API Endpoints**

**File:** `Backend/src/modules/event/eventRegistration.controller.js`

```javascript
// RSVP to event
exports.rsvp = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { selectedClub, notes } = req.body;
    const userId = req.user.id;
    
    // Check event exists and is open
    const event = await Event.findById(eventId);
    if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
    
    if (event.status !== 'published') {
      throw Object.assign(new Error('Event is not open for registration'), { statusCode: 400 });
    }
    
    // Check capacity
    const currentRSVPs = await EventRegistration.countDocuments({ 
      event: eventId, 
      status: { $in: ['confirmed', 'approved'] }
    });
    
    if (event.capacity && currentRSVPs >= event.capacity) {
      throw Object.assign(new Error('Event is full'), { statusCode: 400 });
    }
    
    // Create registration
    const registration = await EventRegistration.create({
      event: eventId,
      user: userId,
      registrationType: 'rsvp',
      selectedClub: selectedClub || event.club,
      status: 'confirmed',
      notes
    });
    
    successResponse(res, { registration }, 'RSVP confirmed successfully');
  } catch (err) {
    if (err.code === 11000) {
      return next(Object.assign(
        new Error('You have already registered for this event'), 
        { statusCode: 400 }
      ));
    }
    next(err);
  }
};

// Cancel RSVP
exports.cancelRSVP = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    const registration = await EventRegistration.findOne({ 
      event: eventId, 
      user: userId 
    });
    
    if (!registration) {
      throw Object.assign(new Error('Registration not found'), { statusCode: 404 });
    }
    
    if (registration.attended) {
      throw Object.assign(
        new Error('Cannot cancel - you have already attended the event'), 
        { statusCode: 400 }
      );
    }
    
    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    registration.cancellationReason = reason;
    await registration.save();
    
    successResponse(res, { registration }, 'RSVP cancelled successfully');
  } catch (err) {
    next(err);
  }
};

// Get my registrations
exports.myRegistrations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, upcoming } = req.query;
    
    const query = { user: userId };
    if (status) query.status = status;
    
    let registrations = await EventRegistration.find(query)
      .populate('event')
      .populate('selectedClub', 'name logoUrl')
      .sort('-createdAt');
    
    if (upcoming === 'true') {
      registrations = registrations.filter(r => 
        r.event && new Date(r.event.dateTime) > new Date()
      );
    }
    
    successResponse(res, { registrations }, 'Registrations fetched successfully');
  } catch (err) {
    next(err);
  }
};
```

---

### **Task 2.3: Frontend RSVP Component**

**File:** `Frontend/src/components/event/RSVPButton.jsx` (NEW)

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import eventService from '../../services/eventService';

export const RSVPButton = ({ event, onUpdate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [showClubSelector, setShowClubSelector] = useState(false);
  
  useEffect(() => {
    checkRegistration();
  }, [event._id]);
  
  const checkRegistration = async () => {
    try {
      const res = await eventService.getMyRegistration(event._id);
      setRegistration(res.data?.registration);
    } catch (err) {
      setRegistration(null);
    }
  };
  
  const handleRSVP = async () => {
    // Check if multi-club event
    if (event.participatingClubs && event.participatingClubs.length > 1) {
      setShowClubSelector(true);
      return;
    }
    
    await confirmRSVP();
  };
  
  const confirmRSVP = async () => {
    setLoading(true);
    try {
      await eventService.rsvp(event._id, { 
        selectedClub: selectedClub || event.club._id 
      });
      alert('✅ RSVP confirmed! See you at the event.');
      await checkRegistration();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to RSVP');
    } finally {
      setLoading(false);
      setShowClubSelector(false);
    }
  };
  
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your RSVP?')) return;
    
    const reason = prompt('Reason for cancellation (optional):');
    setLoading(true);
    try {
      await eventService.cancelRSVP(event._id, { reason });
      alert('RSVP cancelled');
      await checkRegistration();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };
  
  // Not registered
  if (!registration || registration.status === 'cancelled') {
    return (
      <>
        <button 
          onClick={handleRSVP} 
          disabled={loading}
          className="btn btn-primary"
        >
          📝 RSVP Now
        </button>
        
        {/* Club Selector Modal */}
        {showClubSelector && (
          <div className="modal">
            <div className="modal-content">
              <h3>Select Club</h3>
              <p>This event is organized by multiple clubs. Please select which club you're registering with:</p>
              
              <div className="club-grid">
                {event.participatingClubs.map(club => (
                  <div 
                    key={club._id}
                    className={`club-card ${selectedClub === club._id ? 'selected' : ''}`}
                    onClick={() => setSelectedClub(club._id)}
                  >
                    <img src={club.logoUrl} alt={club.name} />
                    <h4>{club.name}</h4>
                  </div>
                ))}
              </div>
              
              <div className="modal-actions">
                <button onClick={() => setShowClubSelector(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button 
                  onClick={confirmRSVP} 
                  disabled={!selectedClub || loading}
                  className="btn btn-primary"
                >
                  Confirm RSVP
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  
  // Already registered
  return (
    <div className="rsvp-status">
      <div className="status-badge success">
        ✅ You're registered!
        {registration.selectedClub && (
          <span className="club-name">via {registration.selectedClub.name}</span>
        )}
      </div>
      <button 
        onClick={handleCancel}
        disabled={loading}
        className="btn btn-sm btn-outline"
      >
        Cancel RSVP
      </button>
    </div>
  );
};
```

---

## 📊 SUMMARY

### **Phase 1 Deliverables (Week 1)**
- ✅ Auto-change events to `ongoing` on event day
- ✅ 7-day grace period with `pending_completion` status
- ✅ Auto-mark `incomplete` after 7 days
- ✅ Reminder emails on Day 3 and Day 5
- ✅ Completion checklist tracking

### **Phase 2 Deliverables (Week 2)**
- ✅ RSVP system with no duplicates
- ✅ Multi-club event support
- ✅ Club selection for registrations
- ✅ Cancel RSVP functionality
- ✅ Registration status tracking

---

**Next Steps:** Phase 3 (QR Attendance) & Phase 4 (Budget/Documents)
