//src/modules/recruitment/recruitment.model.js
const mongoose = require('mongoose');

const RecruitmentSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    eligibility: {
      type: String,
      maxlength: 500
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    positions: {
      type: [String],
      default: []
    },
    customQuestions: {
      type: [String],
      validate: [arr => arr.length <= 5, 'Max 5 questions']
    },
    status: {
      type: String,
      enum: [
        'draft',
        'scheduled',
        'open',
        'closing_soon',
        'closed',
        'selection_done'
      ],
      default: 'draft'
    }
  },
  { timestamps: true }
);

module.exports.Recruitment = mongoose.model(
  'Recruitment',
  RecruitmentSchema
);