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
        'member',
        'core',
        'president',
        'vicePresident',
        'secretary',
        'treasurer',
        'leadPR',
        'leadTech'
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