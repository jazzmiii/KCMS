const nodemailer = require('nodemailer');
const templates = require('./emailTemplates');

const config = require('../config');
const port = config.SMTP_PORT;
const secure = config.SMTP_SECURE;

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port,
  secure,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
});

async function verifyTransport() {
  try {
    await transporter.verify();
    console.log('SMTP verified successfully');
  } catch (err) {
    console.error('SMTP verification failed:', err.message);
    throw err;
  }
}

function sendMail(opts) {
  const fromName = config.EMAIL_FROM_NAME;
  const fromAddr = config.EMAIL_FROM;
  return transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    ...opts,
  });
}

/**
 * Send templated email
 * @param {string} templateName - Name of the template to use
 * @param {string} to - Recipient email
 * @param {Object} data - Data to populate template
 * @param {Object} options - Additional email options
 */
async function sendTemplatedEmail(templateName, to, data, options = {}) {
  if (!templates[templateName]) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const template = templates[templateName](data);
  
  const mailOptions = {
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    ...options
  };

  return sendMail(mailOptions);
}

/**
 * Send bulk emails with templates
 * @param {string} templateName - Name of the template to use
 * @param {Array} recipients - Array of {email, data} objects
 * @param {Object} options - Additional email options
 */
async function sendBulkTemplatedEmail(templateName, recipients, options = {}) {
  const promises = recipients.map(recipient => 
    sendTemplatedEmail(templateName, recipient.email, recipient.data, options)
  );
  
  return Promise.all(promises);
}

/**
 * Add unsubscribe link to email HTML
 * Workplan Line 368: Unsubscribe link (except URGENT)
 * @param {string} html - Original HTML content
 * @param {string} unsubscribeToken - Token for unsubscribe link
 * @param {string} notificationType - Type of notification
 * @returns {string} HTML with unsubscribe link
 */
function addUnsubscribeLink(html, unsubscribeToken, notificationType) {
  const unsubscribeUrl = `${config.FRONTEND_URL}/unsubscribe/${unsubscribeToken}?type=${notificationType}`;
  
  const unsubscribeFooter = `
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #e0e0e0;">
    <p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
      You're receiving this email because you're a member of KMIT Clubs Hub.<br>
      <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Unsubscribe from these emails</a>
    </p>
  `;
  
  return html + unsubscribeFooter;
}

/**
 * Send notification email with unsubscribe support
 * Workplan Line 368: Unsubscribe link (except URGENT)
 * @param {Object} user - User object with _id and email
 * @param {string} notificationType - Type of notification
 * @param {string} priority - Priority level (URGENT, HIGH, MEDIUM, LOW)
 * @param {Object} mailOptions - Mail options (subject, html, text)
 */
async function sendNotificationEmail(user, notificationType, priority, mailOptions) {
  // Check unsubscribe preferences (except for URGENT priority)
  if (priority !== 'URGENT') {
    const { Unsubscribe } = require('../modules/notification/unsubscribe.model');
    const prefs = await Unsubscribe.getOrCreatePreferences(user._id, user.email);
    
    // Check if user has unsubscribed from this type
    if (prefs.hasUnsubscribed(notificationType)) {
      console.log(`User ${user.email} has unsubscribed from ${notificationType}, skipping email`);
      return null;
    }
    
    // Add unsubscribe link to email
    if (mailOptions.html) {
      mailOptions.html = addUnsubscribeLink(mailOptions.html, prefs.unsubscribeToken, notificationType);
    }
  }
  
  // Send email
  return sendMail({
    to: user.email,
    ...mailOptions
  });
}

module.exports = { 
  transporter, 
  verifyTransport, 
  sendMail, 
  sendTemplatedEmail,
  sendBulkTemplatedEmail,
  addUnsubscribeLink,
  sendNotificationEmail,
  templates 
};
