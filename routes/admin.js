const express = require('express');
const User = require('../models/User');
const Property = require('../models/Property');
const Report = require('../models/Report');
const ContactMessage = require('../models/ContactMessage');
const auth = require('../middleware/auth');
const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin access required' });
  next();
};

// GET all users (admin only)
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT update user status (approve/reject)
router.put('/users/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    user.status = status;
    await user.save();

    // Add notification for the seller
    const Notification = require('../models/Notification');
    let title = '';
    let message = '';
    if (status === 'approved') {
      title = 'Account Approved ✅';
      message = `Your seller account has been approved! You can now list properties.`;
    } else if (status === 'rejected') {
      title = 'Account Rejected ❌';
      message = `Your seller account was rejected. Please contact support for more information.`;
    }
    
    if (title && message) {
      const notification = new Notification({
        user: user._id,
        title: title,
        message: message,
        type: 'system'
      });
      await notification.save();
    }

    res.json({ msg: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE user (admin only)
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ msg: 'Cannot delete admin' });
    await user.deleteOne();
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET all contact messages (admin only)
router.get('/messages', auth, isAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ date: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT mark message as read
router.put('/messages/:id/read', auth, isAdmin, async (req, res) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ msg: 'Message not found' });
    msg.read = true;
    await msg.save();
    res.json({ msg: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE message
router.delete('/messages/:id', auth, isAdmin, async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete any property (admin only)
router.delete('/properties/:id', auth, isAdmin, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ msg: 'Property not found' });
        await property.deleteOne();
        // Optionally delete all reports associated with this property
        await Report.deleteMany({ propertyId: req.params.id });
        res.json({ msg: 'Property deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});


module.exports = router;
