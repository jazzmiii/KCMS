//src/modules/document/document.service.js
const mongoose = require('mongoose');
const { Document } = require('./document.model');
const cloudinary   = require('../../utils/cloudinary');
const auditService = require('../audit/audit.service');
const notificationService = require('../notification/notification.service');
const { Membership } = require('../club/membership.model');

class DocumentService {
  /**
   * Upload one or more files for a club.
   * @param {string} clubId
   * @param {object} userContext { id, ip, userAgent }
   * @param {Array<File>} files
   * @param {object} opts { album, tags }
   */
  async uploadFiles(clubId, userContext, files, { album, tags }) {
    const docs = [];

    for (const file of files) {
      const ext = file.mimetype.split('/')[1].toLowerCase();
      let type, url, thumbUrl;

      // Image upload & thumbnail
      if (['jpeg','jpg','png','webp'].includes(ext)) {
        type = 'photo';
        const img = await cloudinary.uploadImage(file.path, {
          folder: `clubs/${clubId}/photos`,
          transformation: [{ width: 1024, crop: 'limit' }]
        });
        url = img.secure_url;
        const thumb = await cloudinary.uploadImage(file.path, {
          folder: `clubs/${clubId}/photos/thumbs`,
          transformation: [{ width: 300, crop: 'limit' }]
        });
        thumbUrl = thumb.secure_url;
      }
      // Document upload
      else if (['pdf','msword','vnd.openxmlformats-officedocument.wordprocessingml.document']
               .includes(file.mimetype)) {
        type = 'document';
        const docRes = await cloudinary.uploadFile(file.path, {
          folder: `clubs/${clubId}/docs`
        });
        url = docRes.secure_url;
      }
      else {
        const err = new Error('Unsupported file type');
        err.statusCode = 400;
        throw err;
      }

      // Persist metadata
      const doc = await Document.create({
        club: clubId,
        album,
        type,
        url,
        thumbUrl,
        metadata: {
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        },
        uploadedBy: userContext.id,
        tags
      });
      docs.push(doc);

      // Audit log
      await auditService.log({
        user: userContext.id,
        action: 'DOCUMENT_UPLOAD',
        target: `Document:${doc._id}`,
        newValue: doc.toObject(),
        ip: userContext.ip,
        userAgent: userContext.userAgent
      });

      // Notify club core team
      const cores = await Membership.find({
        club: clubId,
        status: 'approved'
      }).distinct('user');
      await Promise.all(
        cores.map(uid =>
          notificationService.create({
            user: uid,
            type: 'approval_required',  // or define 'media_uploaded'
            payload: { documentId: doc._id, clubId },
            priority: 'MEDIUM'
          })
        )
      );
    }

    return docs;
  }

  /**
   * List documents with optional filters.
   */
  async listDocuments(clubId, userContext, filters) {
    const { type, album, year, page = 1, limit = 20 } = filters;
    const query = { club: clubId };
    if (type)  query.type = type;
    if (album) query.album = album;
    if (year)  query.createdAt = {
      $gte: new Date(`${year}-01-01`),
      $lt:  new Date(`${year+1}-01-01`)
    };
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      Document.countDocuments(query),
      Document.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);
    return { total, page, limit, items };
  }

  /**
   * Get a single document to download or view.
   */
  async getDocument(docId, clubId) {
    const doc = await Document.findOne({ _id: docId, club: clubId });
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }
    return doc;
  }

  /**
   * Delete a document (soft-delete in DB & Cloudinary if desired).
   */
  async deleteDocument(docId, clubId, userContext) {
    const doc = await Document.findOneAndDelete({ _id: docId, club: clubId });
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    // Audit log
    await auditService.log({
      user: userContext.id,
      action: 'DOCUMENT_DELETE',
      target: `Document:${docId}`,
      oldValue: doc.toObject(),
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    // Notify core team
    const cores = await Membership.find({
      club: clubId,
      status: 'approved'
    }).distinct('user');
    await Promise.all(
      cores.map(uid =>
        notificationService.create({
          user: uid,
          type: 'system_maintenance', // or 'media_deleted'
          payload: { documentId: docId, clubId },
          priority: 'HIGH'
        })
      )
    );

    return;
  }

  /**
   * Create a new album
   */
  async createAlbum(clubId, albumName, description, userContext) {
    // Check if album already exists
    const existingAlbum = await Document.findOne({ 
      club: clubId, 
      album: albumName 
    });
    
    if (existingAlbum) {
      const err = new Error('Album already exists');
      err.statusCode = 409;
      throw err;
    }

    // Create a placeholder document to represent the album
    const albumDoc = await Document.create({
      club: clubId,
      album: albumName,
      type: 'album',
      url: '', // No URL for album
      metadata: {
        filename: `${albumName} Album`,
        size: 0,
        mimeType: 'album/folder',
        description
      },
      uploadedBy: userContext.id
    });

    await auditService.log({
      user: userContext.id,
      action: 'ALBUM_CREATE',
      target: `Album:${albumName}`,
      newValue: { albumName, description },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return albumDoc;
  }

  /**
   * Get albums for a club
   */
  async getAlbums(clubId) {
    const albums = await Document.aggregate([
      { $match: { club: mongoose.Types.ObjectId(clubId) } },
      {
        $group: {
          _id: '$album',
          count: { $sum: 1 },
          lastUpload: { $max: '$createdAt' },
          type: { $first: '$type' }
        }
      },
      { $sort: { lastUpload: -1 } }
    ]);

    return albums.map(album => ({
      name: album._id,
      count: album.count,
      lastUpload: album.lastUpload,
      type: album.type
    }));
  }

  /**
   * Bulk upload files
   */
  async bulkUpload(clubId, userContext, files, { album, tags }) {
    if (files.length > 10) {
      const err = new Error('Maximum 10 files allowed per upload');
      err.statusCode = 400;
      throw err;
    }

    const docs = await this.uploadFiles(clubId, userContext, files, { album, tags });
    
    // Notify about bulk upload
    await notificationService.create({
      user: userContext.id,
      type: 'system_maintenance',
      payload: { 
        action: 'bulk_upload',
        clubId, 
        count: docs.length,
        album 
      },
      priority: 'MEDIUM'
    });

    return docs;
  }

  /**
   * Tag members in photos
   */
  async tagMembers(docId, memberIds, userContext) {
    const doc = await Document.findById(docId);
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    if (doc.type !== 'photo') {
      const err = new Error('Only photos can be tagged');
      err.statusCode = 400;
      throw err;
    }

    // Validate member IDs
    const validMembers = await Membership.find({
      _id: { $in: memberIds },
      club: doc.club,
      status: 'approved'
    });

    doc.tags = validMembers.map(m => m.user);
    await doc.save();

    await auditService.log({
      user: userContext.id,
      action: 'DOCUMENT_TAG',
      target: `Document:${docId}`,
      newValue: { taggedMembers: memberIds },
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    return doc;
  }

  /**
   * Get document analytics
   */
  async getAnalytics(clubId, period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [
      totalDocuments,
      documentsByType,
      documentsByAlbum,
      uploadTrend,
      totalSize
    ] = await Promise.all([
      Document.countDocuments({ club: clubId }),
      
      Document.aggregate([
        { $match: { club: mongoose.Types.ObjectId(clubId) } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      
      Document.aggregate([
        { $match: { club: mongoose.Types.ObjectId(clubId) } },
        { $group: { _id: '$album', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      Document.aggregate([
        { $match: { 
          club: mongoose.Types.ObjectId(clubId),
          createdAt: { $gte: startDate }
        }},
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      Document.aggregate([
        { $match: { club: mongoose.Types.ObjectId(clubId) } },
        { $group: { _id: null, totalSize: { $sum: '$metadata.size' } } }
      ])
    ]);

    return {
      totalDocuments,
      documentsByType: documentsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topAlbums: documentsByAlbum,
      uploadTrend,
      totalSize: totalSize[0]?.totalSize || 0
    };
  }

  /**
   * Search documents within a club
   */
  async searchDocuments(clubId, query, filters = {}) {
    const searchQuery = { club: clubId };
    
    if (query) {
      const regex = new RegExp(query, 'i');
      searchQuery.$or = [
        { 'metadata.filename': regex },
        { album: regex }
      ];
    }

    // Apply filters
    if (filters.type) searchQuery.type = filters.type;
    if (filters.album) searchQuery.album = filters.album;
    if (filters.uploadedBy) searchQuery.uploadedBy = filters.uploadedBy;

    return Document.find(searchQuery)
      .populate('uploadedBy', 'profile.name')
      .populate('tags', 'profile.name')
      .sort({ createdAt: -1 });
  }

  /**
   * Download document (generate secure URL)
   */
  async getDownloadUrl(docId, clubId, userContext) {
    const doc = await Document.findOne({ _id: docId, club: clubId });
    if (!doc) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    // Log download
    await auditService.log({
      user: userContext.id,
      action: 'DOCUMENT_DOWNLOAD',
      target: `Document:${docId}`,
      ip: userContext.ip,
      userAgent: userContext.userAgent
    });

    // For Cloudinary, generate signed URL for download
    const signedUrl = cloudinary.url(doc.url, {
      sign_url: true,
      resource_type: 'auto',
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    });

    return {
      downloadUrl: signedUrl,
      filename: doc.metadata.filename,
      size: doc.metadata.size
    };
  }
}

module.exports = new DocumentService();