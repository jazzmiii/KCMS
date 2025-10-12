/**
 * Email Templates for KCMS
 * Centralized email template management
 */

const templates = {
  // Welcome email for new users
  welcome: (data) => ({
    subject: 'Welcome to KMIT Clubs Hub!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to KMIT Clubs Hub!</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Hello ${data.name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Welcome to the KMIT Clubs Hub! Your account has been successfully created and verified.
          </p>
          <p style="color: #666; line-height: 1.6;">
            You can now explore all the amazing clubs and activities at KMIT. Here's what you can do:
          </p>
          <ul style="color: #666; line-height: 1.8;">
            <li>Browse and join clubs that interest you</li>
            <li>Apply for recruitment opportunities</li>
            <li>RSVP to events and activities</li>
            <li>Connect with fellow students</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${require('./config').FRONTEND_URL}/clubs" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Explore Clubs
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you have any questions, feel free to contact our support team.
          </p>
        </div>
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          © ${new Date().getFullYear()} KMIT Clubs Hub. All rights reserved.
        </div>
      </div>
    `,
    text: `
Welcome to KMIT Clubs Hub!

Hello ${data.name}!

Your account has been successfully created and verified. You can now explore all the amazing clubs and activities at KMIT.

Visit: ${require('./config').FRONTEND_URL}/clubs

If you have any questions, feel free to contact our support team.

© ${new Date().getFullYear()} KMIT Clubs Hub. All rights reserved.
    `
  }),

  // OTP email for registration
  otp: (data) => ({
    subject: 'Your KMIT Clubs Hub Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Verification Code</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Your verification code is:</h2>
          <div style="background: #e9ecef; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${data.otp}</span>
          </div>
          <p style="color: #666; line-height: 1.6;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            For security reasons, never share this code with anyone.
          </p>
        </div>
      </div>
    `,
    text: `
Your verification code is: ${data.otp}

This code will expire in 10 minutes. If you didn't request this code, please ignore this email.

For security reasons, never share this code with anyone.
    `
  }),

  // Password reset email
  passwordReset: (data) => ({
    subject: 'Reset Your KMIT Clubs Hub Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="color: #666; line-height: 1.6;">
            We received a request to reset your password. Use the code below to verify your identity:
          </p>
          <div style="background: #e9ecef; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <span style="font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px;">${data.otp}</span>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Click the link below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" 
               style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 15 minutes. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </div>
    `,
    text: `
Reset Your Password

We received a request to reset your password. Use the code below to verify your identity:

${data.otp}

Reset your password: ${data.resetLink}

This link will expire in 15 minutes. If you didn't request a password reset, please ignore this email.
    `
  }),

  // Recruitment open notification
  recruitmentOpen: (data) => ({
    subject: `New Recruitment: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Recruitment Open!</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">${data.title}</h2>
          <p style="color: #666; line-height: 1.6;">
            A new recruitment opportunity is now open for ${data.clubName}. Don't miss out!
          </p>
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #155724; margin: 0;"><strong>Application Deadline:</strong> ${new Date(data.endDate).toLocaleDateString()}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            ${data.description}
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${require('./config').FRONTEND_URL}/recruitment/${data.recruitmentId}" 
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Apply Now
            </a>
          </div>
        </div>
      </div>
    `,
    text: `
New Recruitment Open!

${data.title}

A new recruitment opportunity is now open for ${data.clubName}.

Application Deadline: ${new Date(data.endDate).toLocaleDateString()}

${data.description}

Apply now: ${require('./config').FRONTEND_URL}/recruitment/${data.recruitmentId}
    `
  }),

  // Event reminder
  eventReminder: (data) => ({
    subject: `Event Reminder: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Event Reminder</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">${data.title}</h2>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #856404; margin: 0;"><strong>Date & Time:</strong> ${new Date(data.dateTime).toLocaleString()}</p>
            <p style="color: #856404; margin: 5px 0 0 0;"><strong>Venue:</strong> ${data.venue}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            ${data.description}
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${require('./config').FRONTEND_URL}/events/${data.eventId}" 
               style="background: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Event Details
            </a>
          </div>
        </div>
      </div>
    `,
    text: `
Event Reminder: ${data.title}

Date & Time: ${new Date(data.dateTime).toLocaleString()}
Venue: ${data.venue}

${data.description}

View event details: ${require('./config').FRONTEND_URL}/events/${data.eventId}
    `
  }),

  // Application status update
  applicationStatus: (data) => ({
    subject: `Application Update: ${data.recruitmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Application Update</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">${data.recruitmentTitle}</h2>
          <div style="background: ${data.status === 'selected' ? '#d4edda' : data.status === 'rejected' ? '#f8d7da' : '#d1ecf1'}; 
                      border: 1px solid ${data.status === 'selected' ? '#c3e6cb' : data.status === 'rejected' ? '#f5c6cb' : '#bee5eb'}; 
                      padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: ${data.status === 'selected' ? '#155724' : data.status === 'rejected' ? '#721c24' : '#0c5460'}; margin: 0;">
              <strong>Status:</strong> ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </p>
          </div>
          ${data.message ? `<p style="color: #666; line-height: 1.6;">${data.message}</p>` : ''}
          ${data.status === 'selected' ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${require('./config').FRONTEND_URL}/clubs/${data.clubId}" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Club
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `,
    text: `
Application Update: ${data.recruitmentTitle}

Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}

${data.message || ''}

${data.status === 'selected' ? `View club: ${require('./config').FRONTEND_URL}/clubs/${data.clubId}` : ''}
    `
  }),

  // System maintenance notification
  systemMaintenance: (data) => ({
    subject: 'System Maintenance Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">System Maintenance</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">${data.title}</h2>
          <p style="color: #666; line-height: 1.6;">
            ${data.message}
          </p>
          ${data.scheduledTime ? `
            <div style="background: #e2e3e5; border: 1px solid #d6d8db; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #383d41; margin: 0;"><strong>Scheduled Time:</strong> ${new Date(data.scheduledTime).toLocaleString()}</p>
            </div>
          ` : ''}
          <p style="color: #666; font-size: 14px;">
            We apologize for any inconvenience this may cause.
          </p>
        </div>
      </div>
    `,
    text: `
System Maintenance: ${data.title}

${data.message}

${data.scheduledTime ? `Scheduled Time: ${new Date(data.scheduledTime).toLocaleString()}` : ''}

We apologize for any inconvenience this may cause.
    `
  })
};

module.exports = templates;
