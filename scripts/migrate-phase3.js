const fs = require('fs');
const path = require('path');

const { getPool, closePool } = require('../config/database');

async function tableExists(tableName) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  return rows[0] && Number(rows[0].total) > 0;
}

async function indexExists(tableName, indexName) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [tableName, indexName]
  );

  return rows[0] && Number(rows[0].total) > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await getPool().query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return rows[0] && Number(rows[0].total) > 0;
}

function getCreateTableStatement(tableName) {
  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'database', 'schema.sql'), 'utf8');
  const statements = schemaSql
    .split(/;\s*\n/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  return statements.find((statement) => statement.startsWith(`CREATE TABLE IF NOT EXISTS ${tableName}`));
}

async function ensureTable(tableName) {
  if (await tableExists(tableName)) {
    return;
  }

  const statement = getCreateTableStatement(tableName);
  if (!statement) {
    throw new Error(`No CREATE TABLE statement found for ${tableName}.`);
  }

  await getPool().query(statement);
}

async function ensureIndex(tableName, indexName, sql) {
  if (await indexExists(tableName, indexName)) {
    return;
  }

  await getPool().query(sql);
}

async function ensureColumn(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await getPool().query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function migrateLegacyDonationsTable() {
  await ensureTable('donations');

  if (await columnExists('donations', 'frequency')) {
    await ensureColumn('donations', 'donor_phone', 'VARCHAR(50) NULL AFTER donor_email');
    await ensureColumn('donations', 'donation_type', "ENUM('one_time', 'monthly', 'quarterly', 'annual') NOT NULL DEFAULT 'one_time' AFTER currency");
    await ensureColumn('donations', 'designation', "ENUM('general_mission', 'child_sponsorship', 'outreach', 'church_planting', 'community_support', 'other') NOT NULL DEFAULT 'general_mission' AFTER donation_type");
    await ensureColumn('donations', 'payment_method', "ENUM('mobile_money', 'bank_transfer', 'cash', 'other') NOT NULL DEFAULT 'other' AFTER designation");
    await ensureColumn('donations', 'payment_reference', 'VARCHAR(190) NULL AFTER payment_method');
    await ensureColumn('donations', 'proof_file_url', 'VARCHAR(255) NULL AFTER payment_reference');
    await ensureColumn('donations', 'message', 'TEXT NULL AFTER proof_file_url');
    await ensureColumn('donations', 'status', "ENUM('pending', 'verified', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending' AFTER message");
    await ensureColumn('donations', 'verified_by', 'BIGINT UNSIGNED NULL AFTER status');
    await ensureColumn('donations', 'verified_at', 'DATETIME NULL AFTER verified_by');
    await ensureColumn('donations', 'rejection_reason', 'TEXT NULL AFTER verified_at');
    await ensureColumn('donations', 'created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER rejection_reason');
    await ensureColumn('donations', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

    await getPool().query(
      `UPDATE donations
       SET donation_type = CASE frequency
         WHEN 'monthly' THEN 'monthly'
         WHEN 'quarterly' THEN 'quarterly'
         WHEN 'yearly' THEN 'annual'
         ELSE 'one_time'
       END
       WHERE donation_type IS NULL OR donation_type = '' OR donation_type = 'one_time'`
    );
    await getPool().query(
      `UPDATE donations
       SET designation = CASE
         WHEN LOWER(COALESCE(campaign, '')) LIKE '%child%' THEN 'child_sponsorship'
         WHEN LOWER(COALESCE(campaign, '')) LIKE '%outreach%' THEN 'outreach'
         WHEN LOWER(COALESCE(campaign, '')) LIKE '%church%' THEN 'church_planting'
         WHEN LOWER(COALESCE(campaign, '')) LIKE '%community%' THEN 'community_support'
         WHEN LOWER(COALESCE(campaign, '')) IN ('', 'general mission fund', 'general mission support') THEN 'general_mission'
         ELSE 'other'
       END
       WHERE designation IS NULL OR designation = '' OR designation = 'general_mission'`
    );
    await getPool().query(
      `UPDATE donations
       SET payment_reference = COALESCE(payment_reference, transaction_reference),
           status = CASE payment_status
             WHEN 'completed' THEN 'verified'
             WHEN 'failed' THEN 'rejected'
             ELSE 'pending'
           END,
           created_at = COALESCE(created_at, donated_at, NOW()),
           updated_at = COALESCE(updated_at, donated_at, NOW())`
    );
    await getPool().query(`ALTER TABLE donations MODIFY transaction_reference VARCHAR(80) NULL`).catch(() => {});
    await getPool().query(`ALTER TABLE donations MODIFY donated_at DATETIME NULL`).catch(() => {});
    await getPool().query(`ALTER TABLE donations MODIFY campaign VARCHAR(120) NULL`).catch(() => {});
    await getPool().query(`ALTER TABLE donations MODIFY frequency ENUM('one-time', 'monthly', 'quarterly', 'yearly') NULL`).catch(() => {});
    await getPool().query(`ALTER TABLE donations MODIFY payment_status ENUM('pending', 'completed', 'failed') NULL`).catch(() => {});
  }
}

async function migrateLegacyVolunteerApplicationsTable() {
  await ensureTable('volunteer_applications');

  if (!(await columnExists('volunteer_applications', 'user_id'))) {
    await ensureColumn('volunteer_applications', 'user_id', 'BIGINT UNSIGNED NULL AFTER id');
  }

  await ensureColumn('volunteer_applications', 'location', 'VARCHAR(190) NULL AFTER phone');
  await ensureColumn('volunteer_applications', 'experience', 'TEXT NULL AFTER availability');
  await ensureColumn('volunteer_applications', 'reviewed_by', 'BIGINT UNSIGNED NULL AFTER status');
  await ensureColumn('volunteer_applications', 'reviewed_at', 'DATETIME NULL AFTER reviewed_by');
  await ensureColumn('volunteer_applications', 'admin_note', 'TEXT NULL AFTER reviewed_at');
  await ensureColumn('volunteer_applications', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

  await getPool().query(
    `ALTER TABLE volunteer_applications
     MODIFY COLUMN area_of_interest ENUM('field_outreach', 'children_ministry', 'media', 'administration', 'prayer', 'training', 'other') NOT NULL DEFAULT 'other'`
  ).catch(() => {});

  await getPool().query(
    `ALTER TABLE volunteer_applications
     MODIFY COLUMN phone VARCHAR(50) NULL`
  ).catch(() => {});

  await getPool().query(
    `ALTER TABLE volunteer_applications
     MODIFY COLUMN motivation TEXT NULL`
  ).catch(() => {});

  await getPool().query(
    `ALTER TABLE volunteer_applications
     MODIFY COLUMN status ENUM('new', 'reviewing', 'approved', 'rejected', 'archived') NOT NULL DEFAULT 'new'`
  ).catch(() => {});

  await getPool().query(
    `UPDATE volunteer_applications
     SET status = CASE status
       WHEN 'declined' THEN 'rejected'
       ELSE status
     END`
  ).catch(() => {});
}

async function createPrayerTablesIfMissing() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS prayer_partners (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NULL,
      name VARCHAR(190) NOT NULL,
      email VARCHAR(190) NOT NULL,
      phone VARCHAR(50) NULL,
      prayer_focus ENUM('general', 'mission_fields', 'children', 'volunteers', 'church_planting', 'community_support') NOT NULL DEFAULT 'general',
      frequency ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'weekly',
      status ENUM('active', 'inactive', 'unsubscribed') NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY prayer_partners_user_id_index (user_id),
      KEY prayer_partners_email_index (email),
      KEY prayer_partners_focus_index (prayer_focus),
      KEY prayer_partners_status_index (status),
      KEY prayer_partners_created_at_index (created_at),
      CONSTRAINT prayer_partners_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS prayer_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(190) NULL,
      email VARCHAR(190) NULL,
      request_text TEXT NOT NULL,
      is_public TINYINT(1) NOT NULL DEFAULT 0,
      status ENUM('new', 'reviewed', 'prayed', 'archived') NOT NULL DEFAULT 'new',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY prayer_requests_email_index (email),
      KEY prayer_requests_status_index (status),
      KEY prayer_requests_public_index (is_public),
      KEY prayer_requests_created_at_index (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function migrateEngagementTables() {
  const tableIndexSql = {
    donations: [
      ['donations_user_id_index', 'ALTER TABLE donations ADD KEY donations_user_id_index (user_id)'],
      ['donations_email_index', 'ALTER TABLE donations ADD KEY donations_email_index (donor_email)'],
      ['donations_status_index', 'ALTER TABLE donations ADD KEY donations_status_index (status)'],
      ['donations_designation_index', 'ALTER TABLE donations ADD KEY donations_designation_index (designation)'],
      ['donations_payment_method_index', 'ALTER TABLE donations ADD KEY donations_payment_method_index (payment_method)'],
      ['donations_verified_by_index', 'ALTER TABLE donations ADD KEY donations_verified_by_index (verified_by)'],
      ['donations_created_at_index', 'ALTER TABLE donations ADD KEY donations_created_at_index (created_at)']
    ],
    sponsorship_interests: [
      ['sponsorship_interests_user_id_index', 'ALTER TABLE sponsorship_interests ADD KEY sponsorship_interests_user_id_index (user_id)'],
      ['sponsorship_interests_email_index', 'ALTER TABLE sponsorship_interests ADD KEY sponsorship_interests_email_index (sponsor_email)'],
      ['sponsorship_interests_status_index', 'ALTER TABLE sponsorship_interests ADD KEY sponsorship_interests_status_index (status)'],
      ['sponsorship_interests_type_index', 'ALTER TABLE sponsorship_interests ADD KEY sponsorship_interests_type_index (sponsorship_type)'],
      ['sponsorship_interests_plan_index', 'ALTER TABLE sponsorship_interests ADD KEY sponsorship_interests_plan_index (preferred_plan)'],
      ['sponsorship_interests_reviewed_by_index', 'ALTER TABLE sponsorship_interests ADD KEY sponsorship_interests_reviewed_by_index (reviewed_by)'],
      ['sponsorship_interests_created_at_index', 'ALTER TABLE sponsorship_interests ADD KEY sponsorship_interests_created_at_index (created_at)']
    ],
    volunteer_applications: [
      ['volunteer_applications_user_id_index', 'ALTER TABLE volunteer_applications ADD KEY volunteer_applications_user_id_index (user_id)'],
      ['volunteer_applications_email_index', 'ALTER TABLE volunteer_applications ADD KEY volunteer_applications_email_index (email)'],
      ['volunteer_applications_status_index', 'ALTER TABLE volunteer_applications ADD KEY volunteer_applications_status_index (status)'],
      ['volunteer_applications_interest_index', 'ALTER TABLE volunteer_applications ADD KEY volunteer_applications_interest_index (area_of_interest)'],
      ['volunteer_applications_reviewed_by_index', 'ALTER TABLE volunteer_applications ADD KEY volunteer_applications_reviewed_by_index (reviewed_by)'],
      ['volunteer_applications_created_at_index', 'ALTER TABLE volunteer_applications ADD KEY volunteer_applications_created_at_index (created_at)']
    ],
    prayer_partners: [
      ['prayer_partners_user_id_index', 'ALTER TABLE prayer_partners ADD KEY prayer_partners_user_id_index (user_id)'],
      ['prayer_partners_email_index', 'ALTER TABLE prayer_partners ADD KEY prayer_partners_email_index (email)'],
      ['prayer_partners_focus_index', 'ALTER TABLE prayer_partners ADD KEY prayer_partners_focus_index (prayer_focus)'],
      ['prayer_partners_status_index', 'ALTER TABLE prayer_partners ADD KEY prayer_partners_status_index (status)'],
      ['prayer_partners_created_at_index', 'ALTER TABLE prayer_partners ADD KEY prayer_partners_created_at_index (created_at)']
    ],
    prayer_requests: [
      ['prayer_requests_email_index', 'ALTER TABLE prayer_requests ADD KEY prayer_requests_email_index (email)'],
      ['prayer_requests_status_index', 'ALTER TABLE prayer_requests ADD KEY prayer_requests_status_index (status)'],
      ['prayer_requests_public_index', 'ALTER TABLE prayer_requests ADD KEY prayer_requests_public_index (is_public)'],
      ['prayer_requests_created_at_index', 'ALTER TABLE prayer_requests ADD KEY prayer_requests_created_at_index (created_at)']
    ]
  };

  await migrateLegacyDonationsTable();
  await migrateLegacyVolunteerApplicationsTable();
  await createPrayerTablesIfMissing();

  for (const tableName of Object.keys(tableIndexSql)) {
    await ensureTable(tableName);
    for (const [indexName, sql] of tableIndexSql[tableName]) {
      await ensureIndex(tableName, indexName, sql);
    }
  }
}

(async () => {
  try {
    await migrateEngagementTables();
    console.log('Phase 3 engagement migration completed successfully.');
    process.exitCode = 0;
  } catch (error) {
    console.error('Phase 3 engagement migration failed.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
