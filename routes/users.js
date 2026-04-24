const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const router = express.Router();

router.get('/sellers', auth, async (req, res) => {
    try {
        const sellers = await User.find({ role: 'seller', status: 'approved' })
            .select('_id fullName firstName lastName email avatar');
        res.json(sellers);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, fullName, email, phone, location } = req.body;
        const updates = {};
        if (firstName !== undefined) updates.firstName = firstName;
        if (lastName !== undefined) updates.lastName = lastName;
        if (fullName !== undefined) updates.fullName = fullName;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (location !== undefined) updates.location = location;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        // Create notification for profile update
        const notification = new Notification({
            user: req.user.id,
            title: 'Profile Updated',
            message: 'Your profile information has been updated successfully.',
            type: 'profile'
        });
        await notification.save();

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
        const avatarUrl = req.file.path;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: avatarUrl },
            { returnDocument: 'after' }
        ).select('-password');

        // Create notification for avatar update
        const notification = new Notification({
            user: req.user.id,
            title: 'Profile Picture Updated',
            message: 'Your profile picture has been changed.',
            type: 'profile'
        });
        await notification.save();

        res.json({ avatarUrl: user.avatar });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
