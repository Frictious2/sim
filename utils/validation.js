function isValidEmail(value = '') {
  return /^\S+@\S+\.\S+$/.test(String(value).trim());
}

function isValidPhone(value = '') {
  if (!String(value).trim()) {
    return true;
  }

  return /^[+()\-\s\d]{7,20}$/.test(String(value).trim());
}

function normalizeNullable(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed ? trimmed : null;
}

function normalizeBoolean(value) {
  return ['1', 'true', 'on', 'yes'].includes(String(value).toLowerCase());
}

function pickAllowedValue(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

function isPositiveAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function normalizeAmount(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

function normalizeEnum(value, allowedValues, fallback = null) {
  const normalized = String(value || '').trim();
  if (allowedValues.includes(normalized)) {
    return normalized;
  }

  return fallback;
}

module.exports = {
  isValidEmail,
  isValidPhone,
  normalizeNullable,
  normalizeBoolean,
  pickAllowedValue,
  isPositiveAmount,
  normalizeAmount,
  normalizeEnum
};
