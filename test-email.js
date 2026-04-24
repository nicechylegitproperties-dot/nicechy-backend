require('dotenv').config();
const sendEmail = require('./config/email');

async function test() {
  // IMPORTANT: Put your real email address inside quotes
  const recipientEmail = 'michaeldamon111@gmail.com'; // CHANGE THIS
  
  const result = await sendEmail(recipientEmail, 'Test', '<h1>Hello from NICECHI</h1>');
  console.log(result ? '✅ Email sent!' : '❌ Failed');
  process.exit();
}
test();
