const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: [
        'member',         // Regular member
        'core',           // Core team: generic core member
        'vicePresident',  // Core: Vice President
        'secretary',      // Core: Secretary
        'treasurer',      // Core: Treasurer
        'leadPR',         // Core: Lead PR
        'leadTech',       // Core: Lead Tech
        'president'       // President (highest level, only one per club)
      ],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['applied', 'approved', 'rejected'],
      default: 'approved'
    }
  },
  { timestamps: true }
);

module.exports.Membership = mongoose.model('Membership', MembershipSchema);