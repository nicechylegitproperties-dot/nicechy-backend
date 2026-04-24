const express = require('express');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const router = express.Router();

// Admin check middleware
const isAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin access required' });
  next();
};

// Submit a report (any logged-in user)
router.post('/', auth, async (req, res) => {
  try {
    const { propertyId, reason, details } = req.body;
    if (!propertyId || !reason) {
      return res.status(400).json({ msg: 'Property ID and reason are required' });
    }
    const report = new Report({
      propertyId,
      reportedBy: req.user.id,
      reason,
      details: details || ''
    });
    await report.save();
    res.json({ msg: 'Report submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all reports (admin only)
router.get('/admin', auth, isAdmin, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('propertyId', 'title price location images')
      .populate('reportedBy', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get a single report (admin only) – optional
router.get('/:id', auth, isAdmin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('propertyId', 'title price location images')
      .populate('reportedBy', 'fullName email');
    if (!report) return res.status(404).json({ msg: 'Report not found' });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update report status (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }   // fixes Mongoose warning
    );
    if (!report) return res.status(404).json({ msg: 'Report not found' });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE a report (admin only) – THIS WAS MISSING
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ msg: 'Report not found' });
    res.json({ msg: 'Report deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;


