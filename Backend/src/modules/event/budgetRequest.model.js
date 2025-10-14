const mongoose = require('mongoose');

const BudgetRequestSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Types.ObjectId, ref: 'Event', required: true },
    amount: { type: Number, required: true, min: 0 },
    breakdown: { type: String, maxlength: 1000 },
    quotations: [String],   // URLs
    status: {
      type: String,
      enum: ['pending','recommended','approved','rejected','settled'],
      default: 'pending'
    },
    approvedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    coordinatorOverride: {
      overridden: { type: Boolean, default: false },
      action: String, // 'reject', 'reduce_amount'
      reason: String,
      originalAmount: Number,
      adjustedAmount: Number,
      overriddenBy: { type: mongoose.Types.ObjectId, ref: 'User' },
      overriddenAt: Date
    }
  },
  { timestamps: true }
);

module.exports.BudgetRequest = mongoose.model('BudgetRequest', BudgetRequestSchema);