const env = require('../config/env');
const NotificationLog = require('../models/NotificationLog');
const { renderTemplate } = require('./templateService');
const { sendEmail } = require('./emailService');

async function logNotificationAttempt(payload) {
  try {
    await NotificationLog.create(payload);
  } catch (error) {
    // Notification logging should never block the main application flow.
  }
}

async function sendTemplatedNotification({
  templateKey,
  to,
  placeholders = {},
  notificationType,
  relatedEntityType = null,
  relatedEntityId = null
}) {
  const rendered = await renderTemplate(templateKey, placeholders).catch(() => null);

  if (!rendered || !rendered.template || !rendered.template.is_active) {
    await logNotificationAttempt({
      recipientEmail: to || '',
      subject: rendered && rendered.subject ? rendered.subject : templateKey,
      notificationType,
      relatedEntityType,
      relatedEntityId,
      status: 'skipped',
      errorMessage: rendered ? 'Template is inactive.' : 'Template was not found.'
    });

    return { sent: false, skipped: true, error: rendered ? 'Template inactive.' : 'Template not found.' };
  }

  const result = await sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text
  });

  await logNotificationAttempt({
    recipientEmail: to || '',
    subject: rendered.subject,
    notificationType,
    relatedEntityType,
    relatedEntityId,
    status: result.sent ? 'sent' : (result.skipped ? 'skipped' : 'failed'),
    errorMessage: result.error || null
  });

  return result;
}

async function sendAdminNotification({
  templateKey,
  placeholders = {},
  notificationType,
  relatedEntityType = null,
  relatedEntityId = null,
  to = null
}) {
  const recipient = to || env.mail.adminNotificationEmail || '';

  if (!recipient) {
    await logNotificationAttempt({
      recipientEmail: '',
      subject: templateKey,
      notificationType,
      relatedEntityType,
      relatedEntityId,
      status: 'skipped',
      errorMessage: 'ADMIN_NOTIFICATION_EMAIL is not configured.'
    });

    return { sent: false, skipped: true, error: 'ADMIN_NOTIFICATION_EMAIL is not configured.' };
  }

  return sendTemplatedNotification({
    templateKey,
    to: recipient,
    placeholders,
    notificationType,
    relatedEntityType,
    relatedEntityId
  });
}

async function sendLoggedEmail({
  to,
  subject,
  html,
  text,
  notificationType,
  relatedEntityType = null,
  relatedEntityId = null
}) {
  const result = await sendEmail({ to, subject, html, text });

  await logNotificationAttempt({
    recipientEmail: to || '',
    subject,
    notificationType,
    relatedEntityType,
    relatedEntityId,
    status: result.sent ? 'sent' : (result.skipped ? 'skipped' : 'failed'),
    errorMessage: result.error || null
  });

  return result;
}

module.exports = {
  sendTemplatedNotification,
  sendAdminNotification,
  sendLoggedEmail
};
