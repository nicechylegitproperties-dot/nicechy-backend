const express = require('express');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');
const { sendEmail } = require('../config/email');
const router = express.Router();

// Subscribe a user (public – can be used from footer or profile)
router.post('/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });
    let sub = await Subscription.findOne({ email });
    if (sub) {
      if (!sub.isActive) {
        sub.isActive = true;
        await sub.save();
        return res.json({ msg: 'Subscription renewed' });
      }
      return res.status(400).json({ msg: 'Email already subscribed' });
    }
    sub = new Subscription({ email, name });
    await sub.save();
    res.json({ msg: 'Subscribed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Unsubscribe (via link or form)
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    await Subscription.findOneAndUpdate({ email }, { isActive: false });
    res.json({ msg: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all active subscribers (admin only)
router.get('/subscribers', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin only' });
  const subscribers = await Subscription.find({ isActive: true }).select('email name subscribedAt');
  res.json(subscribers);
});

// Send a campaign email to all active subscribers (admin only)
router.post('/send-campaign', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin only' });
  const { subject, htmlContent } = req.body;
  if (!subject || !htmlContent) {
    return res.status(400).json({ msg: 'Subject and content are required' });
  }
  const subscribers = await Subscription.find({ isActive: true });
  if (subscribers.length === 0) {
    return res.status(400).json({ msg: 'No active subscribers' });
  }
  let successCount = 0;
  let failCount = 0;
  for (const sub of subscribers) {
    const sent = await sendEmail(sub.email, subject, htmlContent);
    if (sent) successCount++;
    else failCount++;
    // Optional: add a small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  res.json({ msg: `Campaign sent: ${successCount} succeeded, ${failCount} failed` });
});

module.exports = router;
