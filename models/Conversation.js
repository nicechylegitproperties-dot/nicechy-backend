const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  propertyTitle: String,
  messages: [MessageSchema],
  unreadCount: { type: Map, of: Number, default: () => new Map() }
});

module.exports = mongoose.model('Conversation', ConversationSchema);
