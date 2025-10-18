// src/utils/imageProcessor.js
/**
 * Image Processing Utility
 * Handles image compression and thumbnail generation
 * 
 * NOTE: This implementation requires 'sharp' package for optimal image compression
 * Install with: npm install sharp
 * 
 * Workplan Line 406: Compress images if >2MB
 * Workplan Line 407: Generate thumbnail
 */

const fs = require('fs').promises;
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.warn('⚠️  Sharp not installed. Image compression disabled. Install with: npm install sharp');
}

/**
 * Compress image if larger than threshold
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save compressed image
 * @param {Object} options - Compression options
 * @returns {Promise<Object>} Compression results
 */
async function compressImage(inputPath, outputPath, options = {}) {
  const {
    maxSizeMB = 2,
    quality = 85,
    maxWidth = 1920,
    maxHeight = 1080
  } = options;

  if (!sharp) {
    // If sharp not available, copy file as-is
    const stats = await fs.stat(inputPath);
    await fs.copyFile(inputPath, outputPath);
    return {
      compressed: false,
      originalSize: stats.size,
      compressedSize: stats.size,
      message: 'Sharp not installed - compression skipped'
    };
  }

  const stats = await fs.stat(inputPath);
  const originalSize = stats.size;
  const thresholdBytes = maxSizeMB * 1024 * 1024;

  // If file is under threshold, just copy it
  if (originalSize <= thresholdBytes) {
    await fs.copyFile(inputPath, outputPath);
    return {
      compressed: false,
      originalSize,
      compressedSize: originalSize,
      message: 'File under threshold - no compression needed'
    };
  }

  // Compress image
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Determine output format
  const ext = path.extname(outputPath).toLowerCase();
  let outputImage = image.resize(maxWidth, maxHeight, {
    fit: 'inside',
    withoutEnlargement: true
  });

  // Apply format-specific compression
  if (ext === '.jpg' || ext === '.jpeg') {
    outputImage = outputImage.jpeg({ quality, mozjpeg: true });
  } else if (ext === '.png') {
    outputImage = outputImage.png({ quality, compressionLevel: 9 });
  } else if (ext === '.webp') {
    outputImage = outputImage.webp({ quality });
  }

  await outputImage.toFile(outputPath);

  const compressedStats = await fs.stat(outputPath);
  const compressedSize = compressedStats.size;
  const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

  return {
    compressed: true,
    originalSize,
    compressedSize,
    compressionRatio: `${compressionRatio}%`,
    message: 'Image compressed successfully'
  };
}

/**
 * Generate thumbnail from image
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save thumbnail
 * @param {Object} options - Thumbnail options
 * @returns {Promise<Object>} Thumbnail generation results
 */
async function generateThumbnail(inputPath, outputPath, options = {}) {
  const {
    width = 200,
    height = 200,
    fit = 'cover',
    quality = 80
  } = options;

  if (!sharp) {
    return {
      success: false,
      message: 'Sharp not installed - thumbnail generation skipped'
    };
  }

  try {
    await sharp(inputPath)
      .resize(width, height, { fit })
      .jpeg({ quality })
      .toFile(outputPath);

    const stats = await fs.stat(outputPath);
    
    return {
      success: true,
      size: stats.size,
      width,
      height,
      message: 'Thumbnail generated successfully'
    };
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Process uploaded image: compress if needed and generate thumbnail
 * @param {Object} file - Multer file object
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
async function processUploadedImage(file, options = {}) {
  if (!file) {
    throw new Error('No file provided');
  }

  const results = {
    original: file.path,
    compressed: null,
    thumbnail: null,
    compressionInfo: null,
    thumbnailInfo: null
  };

  // Create paths for compressed and thumbnail versions
  const ext = path.extname(file.originalname);
  const basename = path.basename(file.path);
  const dir = path.dirname(file.path);
  
  const compressedPath = path.join(dir, `compressed_${basename}${ext}`);
  const thumbnailPath = path.join(dir, `thumb_${basename}.jpg`);

  // Compress image if needed (Workplan Line 406)
  try {
    results.compressionInfo = await compressImage(
      file.path,
      compressedPath,
      options.compression || {}
    );
    
    if (results.compressionInfo.compressed) {
      results.compressed = compressedPath;
      // Replace original with compressed version if significantly smaller
      if (results.compressionInfo.compressedSize < file.size * 0.8) {
        await fs.unlink(file.path);
        await fs.rename(compressedPath, file.path);
        results.compressed = file.path;
      }
    }
  } catch (error) {
    console.error('Image compression error:', error);
    results.compressionInfo = { error: error.message };
  }

  // Generate thumbnail (Workplan Line 407)
  if (sharp) {
    try {
      results.thumbnailInfo = await generateThumbnail(
        file.path,
        thumbnailPath,
        options.thumbnail || {}
      );
      
      if (results.thumbnailInfo.success) {
        results.thumbnail = thumbnailPath;
      }
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      results.thumbnailInfo = { error: error.message };
    }
  }

  return results;
}

/**
 * Get image metadata
 * @param {string} imagePath - Path to image file
 * @returns {Promise<Object>} Image metadata
 */
async function getImageMetadata(imagePath) {
  if (!sharp) {
    return null;
  }

  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation
    };
  } catch (error) {
    console.error('Error reading image metadata:', error);
    return null;
  }
}

module.exports = {
  compressImage,
  generateThumbnail,
  processUploadedImage,
  getImageMetadata,
  isSharpAvailable: () => !!sharp
};
