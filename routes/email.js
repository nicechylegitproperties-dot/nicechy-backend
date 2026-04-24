const express = require('express');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const { sendEmail } = require('../config/email'); // Destructure!
const router = express.Router();

// Generate random 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code (for signup)
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Email already registered' });

    const code = generateCode();
    await EmailVerification.findOneAndDelete({ email, type: 'verify' });
    await new EmailVerification({ email, code, type: 'verify' }).save();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #ff6a00;">Welcome to NICECHI!</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 48px; letter-spacing: 5px; color: #0f2b46;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <small>NICECHI Real Estate Platform</small>
      </div>
    `;

    await sendEmail(email, 'Verify Your NICECHI Account', html);
    res.json({ msg: 'Verification code sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Verify code (for signup)
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = await EmailVerification.findOne({ email, code, type: 'verify' });
    if (!record) return res.status(400).json({ msg: 'Invalid or expired code' });
    await EmailVerification.deleteOne({ _id: record._id });
    res.json({ msg: 'Code verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Send password reset code
router.post('/send-reset-code', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Email not found' });

    const code = generateCode();
    await EmailVerification.findOneAndDelete({ email, type: 'reset' });
    await new EmailVerification({ email, code, type: 'reset' }).save();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #ff6a00;">Reset Your Password</h2>
        <p>Your password reset code is:</p>
        <h1 style="font-size: 48px; letter-spacing: 5px; color: #0f2b46;">${code}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <small>NICECHI Real Estate Platform</small>
      </div>
    `;

    await sendEmail(email, 'Reset Your NICECHI Password', html);
    res.json({ msg: 'Reset code sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Verify reset code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = await EmailVerification.findOne({ email, code, type: 'reset' });
    if (!record) return res.status(400).json({ msg: 'Invalid or expired code' });
    res.json({ msg: 'Code verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const record = await EmailVerification.findOne({ email, code, type: 'reset' });
    if (!record) return res.status(400).json({ msg: 'Invalid or expired code' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    user.password = newPassword;
    await user.save();
    await EmailVerification.deleteOne({ _id: record._id });

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
