//src/modules/recruitment/application.model.js
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    recruitment: {
      type: mongoose.Types.ObjectId,
      ref: 'Recruitment',
      required: true
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answers: {
      type: [
        {
          question: String,
          answer: String
        }
      ],
      required: true
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'selected', 'rejected', 'waitlisted'],
      default: 'submitted'
    },
    score: {
      type: Number,
      min: 0
    }
  },
  { timestamps: { createdAt: 'appliedAt', updatedAt: true } }
);

module.exports.Application = mongoose.model(
  'Application',
  ApplicationSchema
);