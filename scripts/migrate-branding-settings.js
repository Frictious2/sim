const { getPool, closePool } = require('../config/database');

const brandingSettings = [
  { key: 'logo_url', value: '', group: 'branding' },
  { key: 'favicon_url', value: '', group: 'branding' }
];

async function migrate() {
  const pool = getPool();

  for (const setting of brandingSettings) {
    await pool.query(
      `INSERT INTO site_settings (setting_key, setting_value, setting_group, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         setting_group = VALUES(setting_group),
         updated_at = updated_at`,
      [setting.key, setting.value, setting.group]
    );
  }

  console.log('Branding settings migration completed.');
}

migrate()
  .catch((error) => {
    console.error('Branding settings migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool().catch(() => {});
  });
