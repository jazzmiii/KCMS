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

module.exports = { 
  transporter, 
  verifyTransport, 
  sendMail, 
  sendTemplatedEmail,
  sendBulkTemplatedEmail,
  templates 
};
