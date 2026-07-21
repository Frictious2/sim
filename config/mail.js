const nodemailer = require('nodemailer');
const env = require('./env');

let transporter = null;

function isMailConfigured() {
  return Boolean(
    env.mail.enabled &&
    env.mail.host &&
    env.mail.port &&
    env.mail.fromEmail
  );
}

function getTransporter() {
  if (!isMailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: env.mail.user
        ? {
            user: env.mail.user,
            pass: env.mail.password
          }
        : undefined
    });
  }

  return transporter;
}

module.exports = {
  isMailConfigured,
  getTransporter
};
