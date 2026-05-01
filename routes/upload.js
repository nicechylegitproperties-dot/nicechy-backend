const express = require('express');
const { uploadImages, uploadVideo, uploadAvatar, handleMulterError } = require('../middleware/upload');
const protect = require('../middleware/auth');
const router = express.Router();

// POST /api/upload/images
router.post('/images', protect, (req, res) => {
  req.setTimeout(300000); // 5 minutes

  uploadImages.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('Image upload error:', err);
      return handleMulterError(err, req, res, () => {});
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No images uploaded.' });
    }

    const urls = req.files.map(file => file.path);
    return res.status(200).json({ urls });
  });
});

// POST /api/upload/video
router.post('/video', protect, (req, res) => {
  req.setTimeout(600000); // 10 minutes for video

  uploadVideo.single('video')(req, res, (err) => {
    if (err) {
      console.error('Video upload error:', err);
      return handleMulterError(err, req, res, () => {});
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'No video uploaded.' });
    }

    return res.status(200).json({ url: req.file.path });
  });
});

// POST /api/upload/avatar
router.post('/avatar', protect, (req, res) => {
  req.setTimeout(120000); // 2 minutes

  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('Avatar upload error:', err);
      return handleMulterError(err, req, res, () => {});
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'No avatar uploaded.' });
    }

    return res.status(200).json({ url: req.file.path });
  });
});

module.exports = router;
