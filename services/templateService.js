const EmailTemplate = require('../models/EmailTemplate');
const { sanitizeRichHtml } = require('../utils/sanitizeHtml');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizePlaceholders(placeholders = {}) {
  return Object.entries(placeholders).reduce((accumulator, [key, value]) => {
    accumulator[key] = value === null || value === undefined ? '' : String(value);
    return accumulator;
  }, {});
}

function replacePlaceholders(template = '', placeholders = {}, { html = false } = {}) {
  const map = normalizePlaceholders(placeholders);
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : '';
    return html ? escapeHtml(value) : value;
  });
}

async function renderTemplate(templateKey, placeholders = {}) {
  const template = await EmailTemplate.findByKey(templateKey);
  if (!template) {
    return null;
  }

  return {
    template,
    subject: replacePlaceholders(template.subject, placeholders),
    html: replacePlaceholders(sanitizeRichHtml(template.html_body), placeholders, { html: true }),
    text: replacePlaceholders(template.text_body || '', placeholders)
  };
}

module.exports = {
  renderTemplate,
  replacePlaceholders
};
