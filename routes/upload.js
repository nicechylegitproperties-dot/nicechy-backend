const express = require('express');
const { uploadImages, uploadVideo, handleMulterError } = require('../middleware/upload');
const auth = require('../middleware/auth');
const router = express.Router();

// Set a longer timeout for this route (10 minutes)
router.post('/images', auth, (req, res) => {
  req.setTimeout(600000);
  
  uploadImages.array('images', 5)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return handleMulterError(err, req, res, () => {});
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No images uploaded' });
    }
    const urls = req.files.map(file => file.path);
    res.json({ urls });
  });
});

router.post('/video', auth, (req, res) => {
  req.setTimeout(600000);
  uploadVideo.single('video')(req, res, (err) => {
    if (err) {
      console.error('Video upload error:', err);
      return res.status(400).json({ msg: err.message });
    }
    if (!req.file) return res.status(400).json({ msg: 'No video uploaded' });
    res.json({ url: req.file.path });
  });
});

module.exports = router;
