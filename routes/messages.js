const express = require('express');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const User = require('../models/User'); // <-- ADD THIS LINE
const auth = require('../middleware/auth');
const { sendNewMessageEmail } = require('../config/email');
const router = express.Router();

// Get all conversations for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'fullName avatar email')
      .populate('propertyId', 'title seller')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get a single conversation by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id)
      .populate('participants', 'fullName avatar email')
      .populate('propertyId', 'title seller');
    if (!conv) return res.status(404).json({ msg: 'Conversation not found' });
    if (!conv.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Mark messages as read for the current user
    if (conv.unreadCount && conv.unreadCount.get(req.user.id) > 0) {
      conv.unreadCount.set(req.user.id, 0);
      await conv.save();
    }
    res.json(conv);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Send a message (creates conversation if needed)
router.post('/', auth, async (req, res) => {
  try {
    let { conversationId, text, recipientId, propertyId, propertyTitle } = req.body;

    if (!text) return res.status(400).json({ msg: 'Message text is required' });
    if (!conversationId && !recipientId) {
      return res.status(400).json({ msg: 'Either conversationId or recipientId is required' });
    }

    let conv;
    const io = req.app.get('io');

    if (conversationId) {
      conv = await Conversation.findById(conversationId);
      if (!conv) return res.status(404).json({ msg: 'Conversation not found' });
      if (!conv.participants.includes(req.user.id)) {
        return res.status(403).json({ msg: 'Not authorized' });
      }
    } else {
      if (!recipientId) {
        return res.status(400).json({ msg: 'recipientId required for new conversation' });
      }
      const recipientExists = await User.findById(recipientId);
      if (!recipientExists) {
        return res.status(404).json({ msg: 'Recipient not found' });
      }
      conv = new Conversation({
        participants: [req.user.id, recipientId],
        propertyId: propertyId || null,
        propertyTitle: propertyTitle || 'General Chat',
        messages: [],
        unreadCount: new Map()
      });
      conv.unreadCount.set(req.user.id, 0);
      conv.unreadCount.set(recipientId, 0);
    }

    const newMessage = {
      from: req.user.id,
      text: text,
      timestamp: new Date(),
      read: false
    };
    conv.messages.push(newMessage);

    const recipient = conv.participants.find(p => p.toString() !== req.user.id);
    if (!recipient) {
      return res.status(400).json({ msg: 'No other participant in conversation' });
    }

    const currentUnread = conv.unreadCount.get(recipient) || 0;
    conv.unreadCount.set(recipient, currentUnread + 1);
    await conv.save();

    // Create notification
    const notification = new Notification({
      user: recipient,
      title: 'New Message',
      message: `${req.user.fullName} sent a message about "${conv.propertyTitle || 'a property'}"`,
      type: 'message'
    });
    await notification.save();

    // Send email to recipient
    const recipientUser = await User.findById(recipient);
    if (recipientUser && recipientUser.email) {
      await sendNewMessageEmail(recipientUser.email, req.user.fullName, conv.propertyTitle);
    }

    // Emit socket event for real-time update
    if (io) {
      io.emit('new_message', {
        conversationId: conv._id,
        from: req.user.id,
        to: recipient,
        message: text,
        propertyTitle: conv.propertyTitle
      });
    }

    await conv.populate('participants', 'fullName avatar email');
    await conv.populate('propertyId', 'title seller');
    res.json(conv);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
