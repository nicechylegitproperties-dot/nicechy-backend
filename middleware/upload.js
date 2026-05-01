const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Storage for property images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nicechi/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    quality: 'auto',        // auto-compress on Cloudinary side
    fetch_format: 'auto',   // serve WebP/AVIF where supported
  }
});

// Storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nicechi/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv']
  }
});

// Storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nicechi/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    quality: 'auto',
  }
});

const uploadImages = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB per file, max 10
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'), false);
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'), false);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'), false);
  }
});

// ── Centralised Multer/Cloudinary error handler ───────────────────────────
// This was missing from the exports — caused "handleMulterError is not a function"
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: 'File too large. Maximum size is 5MB per image.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ msg: 'Too many files. Maximum is 10 images at once.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ msg: 'Unexpected file field.' });
    }
    return res.status(400).json({ msg: err.message });
  }

  if (err) {
    // Cloudinary timeout
    if (
      err.http_code === 499 ||
      (err.message && err.message.toLowerCase().includes('timeout'))
    ) {
      return res.status(408).json({
        msg: 'Upload timed out. Please use smaller images (under 5MB) and try again.'
      });
    }
    return res.status(400).json({ msg: err.message || 'Upload failed. Please try again.' });
  }

  next();
}

module.exports = { uploadImages, uploadVideo, uploadAvatar, handleMulterError };
