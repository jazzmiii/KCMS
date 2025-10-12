// src/utils/crypto.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

exports.genRandom = (bytes = 32) =>
  crypto.randomBytes(bytes).toString('hex');

exports.hashSha256 = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

exports.hashBcrypt = (token) =>
  bcrypt.hash(token, 10);

exports.compareBcrypt = (token, hash) =>
  bcrypt.compare(token, hash);