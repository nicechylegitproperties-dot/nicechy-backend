const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Basic send email function
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"NICECHI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

// Send email when a property is sold
const sendPropertySoldEmail = async (sellerEmail, propertyTitle, buyerName = '') => {
  const subject = 'Your Property Has Been Sold! 🎉';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #ff6a00;">Congratulations!</h2>
      <p>Your property <strong>${propertyTitle}</strong> has been marked as sold.</p>
      ${buyerName ? `<p>Buyer: ${buyerName}</p>` : ''}
      <p>The property will be automatically deleted after 7 days.</p>
      <hr>
      <small>NICECHI Real Estate Platform</small>
    </div>
  `;
  await sendEmail(sellerEmail, subject, html);
};

// Send email when a new message is received
const sendNewMessageEmail = async (recipientEmail, senderName, propertyTitle) => {
  const subject = 'New Message on NICECHI';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #ff6a00;">New Message</h2>
      <p><strong>${senderName}</strong> sent you a message about <strong>${propertyTitle}</strong>.</p>
      <p>Log in to your dashboard to reply.</p>
      <hr>
      <small>NICECHI Real Estate Platform</small>
    </div>
  `;
  await sendEmail(recipientEmail, subject, html);
};

module.exports = { sendEmail, sendPropertySoldEmail, sendNewMessageEmail };
