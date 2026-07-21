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

async function columnExists(tableName, columnName) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
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

async function ensureColumn(tableName, columnName, definition) {
  if (!(await columnExists(tableName, columnName))) {
    await getPool().query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureIndex(tableName, indexName, sql) {
  if (!(await indexExists(tableName, indexName))) {
    await getPool().query(sql);
  }
}

async function ensureDonationReceiptColumns() {
  await ensureColumn('donations', 'receipt_number', 'VARCHAR(32) NULL AFTER rejection_reason');
  await ensureColumn('donations', 'receipt_generated_at', 'DATETIME NULL AFTER receipt_number');

  await ensureIndex('donations', 'donations_receipt_number_unique', 'ALTER TABLE donations ADD UNIQUE KEY donations_receipt_number_unique (receipt_number)');
}

async function ensureDonationStatusLogs() {
  if (!(await tableExists('donation_status_logs'))) {
    await getPool().query(`
      CREATE TABLE donation_status_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL,
        old_status VARCHAR(40) NULL,
        new_status VARCHAR(40) NOT NULL,
        note TEXT NULL,
        changed_by BIGINT UNSIGNED NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY donation_status_logs_donation_id_index (donation_id),
        KEY donation_status_logs_changed_by_index (changed_by),
        KEY donation_status_logs_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
}

async function ensureEngagementNotes() {
  if (!(await tableExists('engagement_notes'))) {
    await getPool().query(`
      CREATE TABLE engagement_notes (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        entity_type ENUM('sponsorship_interest','volunteer_application','prayer_request') NOT NULL,
        entity_id BIGINT UNSIGNED NOT NULL,
        note TEXT NOT NULL,
        created_by BIGINT UNSIGNED NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY engagement_notes_entity_lookup_index (entity_type, entity_id),
        KEY engagement_notes_created_by_index (created_by),
        KEY engagement_notes_created_at_index (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
}

async function main() {
  await ensureDonationReceiptColumns();
  await ensureDonationStatusLogs();
  await ensureEngagementNotes();
  console.log('Phase 3.1 workflow migration completed successfully.');
}

main()
  .then(async () => {
    await getPool().end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Phase 3.1 workflow migration failed.');
    console.error(error.message);
    await getPool().end().catch(() => {});
    process.exit(1);
  });
