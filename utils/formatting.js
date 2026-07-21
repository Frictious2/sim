function formatDate(dateValue, options = {}) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  }).format(date);
}

function formatDateTime(dateValue) {
  return formatDate(dateValue, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function truncateText(value = '', maxLength = 140) {
  const text = String(value || '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 1).trimEnd() + '…';
}

function stripHtml(value = '') {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/s+/g, ' ')
    .trim();
}

function parseJsonContent(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

module.exports = {
  formatDate,
  formatDateTime,
  truncateText,
  parseJsonContent,
  stripHtml
};
