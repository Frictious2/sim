const { getPool } = require('../config/database');

async function tableExists(tableName) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  return Number(rows[0] ? rows[0].count : 0) > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );

  return Number(rows[0] ? rows[0].count : 0) > 0;
}

async function ensureNotificationLogs() {
  if (!(await tableExists('notification_logs'))) {
    await getPool().query(`
      CREATE TABLE notification_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        notification_type VARCHAR(150) NOT NULL,
        related_entity_type VARCHAR(100) NULL,
        related_entity_id BIGINT UNSIGNED NULL,
        status ENUM('skipped', 'sent', 'failed') NOT NULL DEFAULT 'skipped',
        error_message TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY notification_logs_status_index (status),
        KEY notification_logs_type_index (notification_type),
        KEY notification_logs_related_lookup_index (related_entity_type, related_entity_id),
        KEY notification_logs_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
}

async function ensureEmailTemplates() {
  if (!(await tableExists('email_templates'))) {
    await getPool().query(`
      CREATE TABLE email_templates (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        template_key VARCHAR(150) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        html_body LONGTEXT NOT NULL,
        text_body LONGTEXT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY email_templates_template_key_unique (template_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } else if (!(await indexExists('email_templates', 'email_templates_template_key_unique'))) {
    await getPool().query(
      'ALTER TABLE email_templates ADD UNIQUE KEY email_templates_template_key_unique (template_key)'
    );
  }
}

async function main() {
  await ensureNotificationLogs();
  await ensureEmailTemplates();
  console.log('Phase 3.2 communication migration completed successfully.');
}

main()
  .then(async () => {
    await getPool().end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Phase 3.2 communication migration failed.');
    console.error(error.message);
    await getPool().end().catch(() => {});
    process.exit(1);
  });
