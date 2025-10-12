// src/modules/document/document.controller.js
const svc = require('./document.service');
const { successResponse } = require('../../utils/response');

exports.upload = async (req, res, next) => {
  try {
    const docs = await svc.uploadFiles(
      req.params.clubId,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] },
      req.files || [],
      req.body  // album & tags
    );
    successResponse(res, { documents: docs }, 'Files uploaded');
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const data = await svc.listDocuments(
      req.params.clubId,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] },
      req.query
    );
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

exports.download = async (req, res, next) => {
  try {
    const doc = await svc.getDocument(req.params.docId, req.params.clubId);
    res.redirect(doc.url);
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await svc.deleteDocument(
      req.params.docId,
      req.params.clubId,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, null, 'Document deleted');
  } catch (err) {
    next(err);
  }
};

// Create Album
exports.createAlbum = async (req, res, next) => {
  try {
    const album = await svc.createAlbum(
      req.params.clubId,
      req.body.name,
      req.body.description,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { album }, 'Album created successfully');
  } catch (err) {
    next(err);
  }
};

// Get Albums
exports.getAlbums = async (req, res, next) => {
  try {
    const albums = await svc.getAlbums(req.params.clubId);
    successResponse(res, { albums }, 'Albums retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// Bulk Upload
exports.bulkUpload = async (req, res, next) => {
  try {
    const documents = await svc.bulkUpload(
      req.params.clubId,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] },
      req.files,
      { album: req.body.album, tags: req.body.tags }
    );
    successResponse(res, { documents }, 'Files uploaded successfully');
  } catch (err) {
    next(err);
  }
};

// Tag Members in Photo
exports.tagMembers = async (req, res, next) => {
  try {
    const document = await svc.tagMembers(
      req.params.docId,
      req.body.memberIds,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, { document }, 'Members tagged successfully');
  } catch (err) {
    next(err);
  }
};

// Get Document Analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await svc.getAnalytics(
      req.params.clubId,
      req.query.period
    );
    successResponse(res, { analytics }, 'Document analytics retrieved');
  } catch (err) {
    next(err);
  }
};

// Search Documents
exports.searchDocuments = async (req, res, next) => {
  try {
    const documents = await svc.searchDocuments(
      req.params.clubId,
      req.query.q,
      req.query
    );
    successResponse(res, { documents }, 'Document search completed');
  } catch (err) {
    next(err);
  }
};

// Get Download URL
exports.getDownloadUrl = async (req, res, next) => {
  try {
    const downloadData = await svc.getDownloadUrl(
      req.params.docId,
      req.params.clubId,
      { id: req.user.id, ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    successResponse(res, downloadData, 'Download URL generated');
  } catch (err) {
    next(err);
  }
};