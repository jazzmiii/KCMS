const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    club: { type: mongoose.Types.ObjectId, ref: 'Club', required: true },
    event: { type: mongoose.Types.ObjectId, ref: 'Event' }, // Link photos/documents to specific events
    album: { type: String, default: 'default' },
    type: {
      type: String,
      enum: ['photo', 'document', 'video', 'album'],
      required: true
    },
    storageType: {
      type: String,
      enum: ['cloudinary', 'drive', 'external'],
      default: 'cloudinary',
      required: true
    },
    url: { 
      type: String, 
      required: function() {
        return this.type !== 'album'; // URL not required for albums
      }
    },
    thumbUrl: { type: String },      // for images
    driveMetadata: {
      folderId: String,        // Google Drive folder ID
      folderName: String,      // Folder name for display
      photoCount: Number,      // Number of photos in drive folder
      description: String      // Optional description
    },
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