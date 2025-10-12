const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    club: { type: mongoose.Types.ObjectId, ref: 'Club', required: true },
    album: { type: String, default: 'default' },
    type: {
      type: String,
      enum: ['photo', 'document', 'video'],
      required: true
    },
    url: { type: String, required: true },
    thumbUrl: { type: String },      // for images
    metadata: {
      filename: String,
      size: Number,   // bytes
      mimeType: String
    },
    uploadedBy: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: mongoose.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

module.exports.Document = mongoose.model('Document', DocumentSchema);