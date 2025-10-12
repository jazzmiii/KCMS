const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Types.ObjectId, ref: 'Event', required: true },
    user:  { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    status:{ type: String, enum: ['rsvp','present'], required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

module.exports.Attendance = mongoose.model('Attendance', AttendanceSchema);