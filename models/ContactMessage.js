const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  subject: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: String, default: () => new Date().toLocaleString() },
  read: { type: Boolean, default: false }
});

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
