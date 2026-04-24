require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Determine the correct MongoDB URI variable
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;
if (!MONGO_URI) {
  console.error('❌ No MongoDB URI found in .env file.');
  console.error('Please add MONGO_URI=... or MONGO_URL=... to your .env file');
  process.exit(1);
}
console.log('✅ Using MongoDB URI:', MONGO_URI.replace(/\/\/.*@/, '//<hidden>@'));

// Define a minimal User schema (must match your actual User model)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  status: String,
  joinedDate: String,
  location: String,
  avatar: String,
  loginCount: Number,
  lastLogin: Date
});
const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);   // No extra options needed
    console.log('Connected successfully');

    let admin = await User.findOne({ email: 'admin@nicechi.com' });
    if (admin) {
      console.log('Admin already exists. Updating password...');
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash('admin123', salt);
      await admin.save();
      console.log('Admin password reset to admin123');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        fullName: 'Admin User',
        email: 'admin@nicechi.com',
        password: hashedPassword,
        role: 'admin',
        status: 'approved',
        joinedDate: new Date().toLocaleDateString(),
        location: 'Lagos, Nigeria',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=ff6a00&color=fff&size=128',
        loginCount: 1,
        lastLogin: new Date()
      });
      await admin.save();
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@nicechi.com');
      console.log('Password: admin123');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdmin();