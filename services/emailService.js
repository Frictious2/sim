const env = require('../config/env');
const { getTransporter, isMailConfigured } = require('../config/mail');

async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    return {
      sent: false,
      skipped: true,
      error: 'No recipient email address was provided.'
    };
  }

  if (!env.mail.enabled) {
    return {
      sent: false,
      skipped: true,
      error: null
    };
  }

  if (!isMailConfigured()) {
    return {
      sent: false,
      skipped: true,
      error: 'MAIL_ENABLED is true but SMTP is not fully configured.'
    };
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"${env.mail.fromName}" <${env.mail.fromEmail}>`,
      to,
      subject,
      html,
      text: text || undefined
    });

    return {
      sent: true,
      skipped: false,
      error: null
    };
  } catch (error) {
    return {
      sent: false,
      skipped: false,
      error: error.message || 'Email send failed.'
    };
  }
}

module.exports = {
  sendEmail
};
