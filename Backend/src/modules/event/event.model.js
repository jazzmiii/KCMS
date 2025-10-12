const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    club:         { type: mongoose.Types.ObjectId, ref: 'Club', required: true },
    title:        { type: String, required: true, maxlength: 100 },
    description:  { type: String, maxlength: 1000 },
    objectives:   { type: String, maxlength: 500 },
    dateTime:     { type: Date, required: true },
    duration:     { type: Number, min: 0 }, // minutes
    venue:        { type: String, maxlength: 200 },
    capacity:     { type: Number, min: 0 },
    expectedAttendees: { type: Number, min: 0 },
    isPublic:     { type: Boolean, default: true },
    budget:       { type: Number, min: 0, default: 0 },
    guestSpeakers:[String],
    attachments: {
      proposalUrl:        String,
      budgetBreakdownUrl: String,
      venuePermissionUrl: String
    },
    qrCodeUrl: String,
    attendanceUrl: String,
    status: {
      type: String,
      enum: [
        'draft',
        'pending_coordinator',
        'pending_admin',
        'approved',
        'published',
        'ongoing',
        'completed',
        'archived'
      ],
      default: 'draft'
    }
  },
  { timestamps: true }
);

module.exports.Event = mongoose.model('Event', EventSchema);