const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Types.ObjectId, ref: 'Event', required: true },
    user:  { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    status:{ type: String, enum: ['rsvp','present','absent'], required: true },
    type: { 
      type: String, 
      enum: ['audience', 'performer', 'volunteer', 'organizer'], 
      default: 'audience' 
    },
    club: { type: mongoose.Types.ObjectId, ref: 'Club' }, // If performer, which club
    checkInTime: Date,
    checkOutTime: Date,
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

// Compound index to prevent duplicate attendance records
AttendanceSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports.Attendance = mongoose.model('Attendance', AttendanceSchema);