const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  landSize: { type: Number, default: null },
  propertyType: { type: String, default: 'Residential' },
  documents: [{ type: String }],
  description: String,
  images: [String],
  video: String,
  status: { 
    type: String, 
    enum: ['active', 'available', 'sold', 'pending'], 
    default: 'active' 
  },
  soldAt: { type: Date, default: null },   // <-- ADD THIS
  seller: {
    name: String,
    email: String,
    phone: String,
    avatar: String
  },
  date: { type: String, default: () => new Date().toLocaleDateString() },
  views: { type: Number, default: 0 }
});

// TTL index (optional, for auto-delete after 7 days)
PropertySchema.index({ soldAt: 1 }, { expireAfterSeconds: 604800, partialFilterExpression: { soldAt: { $exists: true } } });

module.exports = mongoose.model('Property', PropertySchema);
