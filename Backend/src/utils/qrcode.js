// src/utils/qrcode.js
const QRCode = require('qrcode');
const cloudinary = require('./cloudinary');

/**
 * Generate QR code for event attendance
 * @param {string} eventId - Event ID
 * @param {string} eventTitle - Event title for display
 * @returns {Promise<Object>} QR code data and URL
 */
async function generateEventQR(eventId, eventTitle = 'Event Attendance') {
  try {
    // Create attendance URL
    const config = require('../config');
    const attendanceUrl = `${config.FRONTEND_URL}/events/${eventId}/attend`;
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(attendanceUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    // Generate QR code as buffer for uploading
    const qrBuffer = await QRCode.toBuffer(attendanceUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    // Upload QR code to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `events/${eventId}/qr`,
          public_id: `attendance-qr`,
          resource_type: 'image',
          format: 'png'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(qrBuffer);
    });

    return {
      dataUrl: qrDataUrl,
      url: uploadResult.secure_url,
      attendanceUrl,
      eventId,
      eventTitle
    };
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Generate QR code for general use
 * @param {string} data - Data to encode
 * @param {Object} options - QR code options
 * @returns {Promise<string>} QR code data URL
 */
async function generateQR(data, options = {}) {
  try {
    const defaultOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    const qrOptions = { ...defaultOptions, ...options };
    return await QRCode.toDataURL(data, qrOptions);
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Generate QR code and upload to Cloudinary
 * @param {string} data - Data to encode
 * @param {string} folder - Cloudinary folder path
 * @param {Object} options - QR code and upload options
 * @returns {Promise<Object>} Upload result with QR code info
 */
async function generateAndUploadQR(data, folder, options = {}) {
  try {
    const { qrOptions = {}, uploadOptions = {} } = options;
    
    // Generate QR code buffer
    const qrBuffer = await QRCode.toBuffer(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      ...qrOptions
    });

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'png',
          ...uploadOptions
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(qrBuffer);
    });

    return {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      data,
      folder
    };
  } catch (error) {
    throw new Error(`Failed to generate and upload QR code: ${error.message}`);
  }
}

/**
 * Validate QR code data
 * @param {string} data - QR code data to validate
 * @returns {boolean} Whether the data is valid
 */
function validateQRData(data) {
  if (!data || typeof data !== 'string') {
    return false;
  }
  
  // Basic URL validation for attendance URLs
  if (data.includes('/events/') && data.includes('/attend')) {
    const urlPattern = /^https?:\/\/.+\/events\/[a-f0-9]{24}\/attend$/;
    return urlPattern.test(data);
  }
  
  return data.length > 0 && data.length < 1000; // Basic length validation
}

module.exports = {
  generateEventQR,
  generateQR,
  generateAndUploadQR,
  validateQRData
};
