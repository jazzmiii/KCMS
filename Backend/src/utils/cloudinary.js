// src/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_URL) {
  // cloudinary.v2 parses CLOUDINARY_URL automatically
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

module.exports = cloudinary;
