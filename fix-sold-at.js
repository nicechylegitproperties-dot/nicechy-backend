const mongoose = require('mongoose');
require('dotenv').config();

// Try both possible environment variable names
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
if (!MONGO_URI) {
  console.error('MONGO_URI or MONGO_URL not found in .env file');
  process.exit(1);
}
console.log('Using MongoDB URI:', MONGO_URI.replace(/\/\/.*@/, '//<hidden>@'));

// Define minimal schema
const propertySchema = new mongoose.Schema({
  status: String,
  soldAt: Date
});
const Property = mongoose.model('Property', propertySchema);

async function fix() {
  try {
    await mongoose.connect(MONGO_URI);
    const result = await Property.updateMany(
      { status: 'sold', soldAt: null },
      { $set: { soldAt: new Date() } }
    );
    console.log(`✅ Updated ${result.modifiedCount} properties`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}
fix();