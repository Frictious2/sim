const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });

const appEnv = process.env.APP_ENV || 'development';
const isProduction = appEnv === 'production';
const isTest = appEnv === 'test';
const sessionSecret = String(process.env.SESSION_SECRET || '').trim();

function booleanFromEnv(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function sessionCookieSecure() {
  const configured = String(process.env.SESSION_COOKIE_SECURE || '').trim().toLowerCase();
  if (configured === 'true') {
    return true;
  }
  if (configured === 'false') {
    return false;
  }
  if (configured === 'auto') {
    return 'auto';
  }

  return isProduction;
}

if (!sessionSecret) {
  throw new Error('SESSION_SECRET is required. Add it to your .env file before starting the app.');
}

module.exports = {
  app: {
    name: process.env.APP_NAME || 'Salone Interior Missions Platform',
    env: appEnv,
    url: process.env.APP_URL || 'http://localhost:3000',
    port: Number(process.env.PORT || 3000),
    isProduction,
    isTest
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'salone_interior_missions',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  session: {
    secret: sessionSecret,
    cookieName: 'sim.sid',
    cookieSecure: sessionCookieSecure(),
    trustProxy: booleanFromEnv(process.env.TRUST_PROXY, isProduction),
    maxAgeMs: 1000 * 60 * 60 * 24 * 7
  },
  mail: {
    enabled: String(process.env.MAIL_ENABLED || 'false').toLowerCase() === 'true',
    host: process.env.MAIL_HOST || '',
    port: Number(process.env.MAIL_PORT || 0),
    secure: String(process.env.MAIL_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    fromName: process.env.MAIL_FROM_NAME || 'Salone Interior Missions',
    fromEmail: process.env.MAIL_FROM_EMAIL || 'no-reply@example.com',
    adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || ''
  },
  seed: {
    adminName: process.env.ADMIN_SEED_NAME || 'SIM Administrator',
    adminEmail: process.env.ADMIN_SEED_EMAIL || '',
    adminPassword: process.env.ADMIN_SEED_PASSWORD || ''
  }
};
