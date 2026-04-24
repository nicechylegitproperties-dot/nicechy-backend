
const express = require('express');
const Wishlist = require('../models/Wishlist');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user.id }).populate('property');
    res.json(wishlist.map(w => w.property));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/:propertyId', auth, async (req, res) => {
  try {
    const existing = await Wishlist.findOne({ user: req.user.id, property: req.params.propertyId });
    if (existing) return res.status(400).json({ msg: 'Already in wishlist' });

    const wishlistItem = new Wishlist({
      user: req.user.id,
      property: req.params.propertyId
    });
    await wishlistItem.save();
    res.json({ msg: 'Added to wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/:propertyId', auth, async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.user.id, property: req.params.propertyId });
    res.json({ msg: 'Removed from wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
