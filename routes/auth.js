const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const fullName = `${firstName} ${lastName}`;
    const avatar = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=ff6a00&color=fff&size=128`;

    user = new User({
      firstName,
      lastName,
      fullName,
      email,
      password,
      phone,
      role: role || 'buyer',
      avatar,
      loginCount: 1,
      status: role === 'seller' ? 'pending' : 'approved'
    });

    await user.save();

const Notification = require('../models/Notification');

const notification = new Notification({
    user: user.id,
    title: 'Welcome to NICECHI! 🎉',
    message: `Welcome ${user.fullName}! Start exploring properties today.`,
    type: 'system'
});
await notification.save();


    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userData } = user.toObject();
    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    if (user.role === 'seller' && user.status !== 'approved')
      return res.status(403).json({ msg: 'Account pending approval' });

    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLogin = new Date();
    await user.save();

    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userData } = user.toObject();
    res.json({ token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get logged-in user
router.get('/me', auth, async (req, res) => {
  const { password, ...userData } = req.user.toObject();
  res.json(userData);
});


// Change password
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });
        user.password = newPassword;
        await user.save();

        // Create notification for password change
        const Notification = require('../models/Notification');
        const notification = new Notification({
            user: req.user.id,
            title: 'Password Changed',
            message: 'Your password was changed successfully.',
            type: 'profile'
        });
        await notification.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});


module.exports = router;
