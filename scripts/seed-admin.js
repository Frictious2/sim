const env = require('../config/env');
const User = require('../models/User');
const { closePool, getPool } = require('../config/database');

async function validateSchema() {
  const [userColumns] = await getPool().query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
  );

  const existingColumns = new Set(userColumns.map((column) => column.COLUMN_NAME));
  const requiredUserColumns = ['status', 'email_verified_at', 'last_login_at', 'updated_at'];
  const missingColumns = requiredUserColumns.filter((column) => !existingColumns.has(column));

  if (missingColumns.length > 0) {
    throw new Error(
      `The users table is missing required Phase 2 columns: ${missingColumns.join(', ')}. Run: node scripts/migrate-phase2.js`
    );
  }

  const [profileTableRows] = await getPool().query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_profiles'`
  );

  const tableCount = profileTableRows[0]
    ? Number(profileTableRows[0].total ?? profileTableRows[0].TOTAL ?? 0)
    : 0;

  if (tableCount === 0) {
    throw new Error('The user_profiles table is missing. Run: node scripts/migrate-phase2.js');
  }
}

(async () => {
  try {
    if (!env.seed.adminEmail || !env.seed.adminPassword) {
      throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env before seeding.');
    }

    await validateSchema();

    const existingUser = await User.findByEmail(env.seed.adminEmail);

    if (existingUser) {
      console.log(`Admin user already exists for ${env.seed.adminEmail}. No duplicate created.`);
      process.exitCode = 0;
      return;
    }

    const adminUser = await User.createUser({
      name: env.seed.adminName,
      email: env.seed.adminEmail,
      phone: null,
      password: env.seed.adminPassword,
      role: 'admin',
      status: 'active'
    });

    console.log(`Admin user created successfully: ${adminUser.email}`);
    process.exitCode = 0;
  } catch (error) {
    console.error('Admin seed failed.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
