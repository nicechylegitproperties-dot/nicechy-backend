const express = require('express');
const Property = require('../models/Property');
const auth = require('../middleware/auth');
const { uploadImages } = require('../middleware/upload');
const router = express.Router();
const { sendPropertySoldEmail } = require('../config/email');


// GET all properties (public, with optional filters)
router.get('/', async (req, res) => {
  try {
    const { search, location, sort } = req.query;
    let filter = {};
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    if (location) filter.location = location;

    let sortOption = {};
    if (sort === 'priceLow') sortOption.price = 1;
    else if (sort === 'priceHigh') sortOption.price = -1;
    else if (sort === 'mostViewed') sortOption.views = -1;
    else sortOption.date = -1;

    const properties = await Property.find(filter).sort(sortOption);
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// CREATE property (seller only, must be approved)
router.post('/', auth, uploadImages.array('images', 5), async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ msg: 'Only sellers can list properties' });
    }
    if (req.user.status !== 'approved') {
      return res.status(403).json({ msg: 'Your seller account is pending admin approval' });
    }

    const { title, location, price, landSize, propertyType, documents, description, images, video } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ msg: 'At least one image is required' });
    }

    const property = new Property({
      title,
      location,
      price: Number(price),
      landSize: landSize || null,
      propertyType: propertyType || 'Residential',
      documents: documents || [],
      description,
      images,
      video,
      seller: {
        name: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        avatar: req.user.avatar
      }
    });

    await property.save();
    res.json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET single property (public, increments view count)
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    
    property.views = (property.views || 0) + 1;
    await property.save();

    // Add notification for seller every 10 views (optional)
    const Notification = require('../models/Notification');
    if (property.views % 10 === 0 && property.seller && property.seller.email) {
      // Find the seller user ID by email
      const User = require('../models/User');
      const seller = await User.findOne({ email: property.seller.email });
      if (seller) {
        const notification = new Notification({
          user: seller._id,
          title: 'Property Views',
          message: `Your property "${property.title}" has reached ${property.views} views.`,
          type: 'property'
        });
        await notification.save();
      }
    }

    res.json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// UPDATE property (seller only, own property only)
router.put('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    if (property.seller.email !== req.user.email) {
      return res.status(403).json({ msg: 'You can only edit your own properties' });
    }

    const allowedUpdates = [
      'title', 'location', 'price', 'landSize', 'propertyType',
      'documents', 'description', 'images', 'video', 'status'
    ];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        property[field] = req.body[field];
      }
    });
    if (req.body.price) property.price = Number(req.body.price);
    if (req.body.landSize) property.landSize = Number(req.body.landSize);

    // Handle soldAt timestamp
    if (req.body.status === 'sold' && property.status !== 'sold') {
      // Property just became sold – set soldAt to now
      property.soldAt = new Date();
    } else if (req.body.status !== 'sold' && property.status === 'sold') {
      // Property was sold but is no longer sold – clear soldAt
      property.soldAt = null;
    }
    
    // After saving the property
if (req.body.status === 'sold' && property.status !== 'sold') {
  await sendPropertySoldEmail(property.seller.email, property.title);
}
 
    const { sendPropertySoldEmail } = require('../config/email');
const io = req.app.get('io');

// After setting soldAt and saving
io.emit('property_sold', {
  propertyId: property._id,
  title: property.title,
  sellerEmail: property.seller.email
});

// Send email to seller
if (property.seller.email) {
  await sendPropertySoldEmail(property.seller.email, property.title);
}


    await property.save();
    res.json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// DELETE property (seller only, own property only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    if (property.seller.email !== req.user.email) {
      return res.status(403).json({ msg: 'You can only delete your own properties' });
    }
    await property.deleteOne();
    res.json({ msg: 'Property removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
