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

async function ensureColumn(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await getPool().query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function ensureIndex(tableName, indexName, sql) {
  if (await indexExists(tableName, indexName)) {
    return;
  }

  await getPool().query(sql);
}

async function migrateBlogPosts() {
  await ensureColumn('blog_posts', 'meta_title', 'VARCHAR(190) NULL AFTER category');
  await ensureColumn('blog_posts', 'meta_description', 'VARCHAR(255) NULL AFTER meta_title');
  await ensureIndex('blog_posts', 'blog_posts_status_index', 'ALTER TABLE blog_posts ADD KEY blog_posts_status_index (status)');
}

async function migrateProjects() {
  await ensureColumn('projects', 'meta_title', 'VARCHAR(190) NULL AFTER category');
  await ensureColumn('projects', 'meta_description', 'VARCHAR(255) NULL AFTER meta_title');
  await ensureIndex('projects', 'projects_status_index', 'ALTER TABLE projects ADD KEY projects_status_index (status)');
}

async function migrateMediaLibrary() {
  await ensureTable('media_library');
  await ensureIndex('media_library', 'media_library_uploaded_by_index', 'ALTER TABLE media_library ADD KEY media_library_uploaded_by_index (uploaded_by)');
  await ensureIndex('media_library', 'media_library_mime_type_index', 'ALTER TABLE media_library ADD KEY media_library_mime_type_index (mime_type)');
  await ensureIndex('media_library', 'media_library_usage_type_index', 'ALTER TABLE media_library ADD KEY media_library_usage_type_index (usage_type)');
  await ensureIndex('media_library', 'media_library_created_at_index', 'ALTER TABLE media_library ADD KEY media_library_created_at_index (created_at)');
}

async function migrateSiteSettings() {
  await ensureTable('site_settings');
  await ensureIndex('site_settings', 'site_settings_setting_group_index', 'ALTER TABLE site_settings ADD KEY site_settings_setting_group_index (setting_group)');
}

(async () => {
  try {
    await migrateBlogPosts();
    await migrateProjects();
    await migrateMediaLibrary();
    await migrateSiteSettings();

    console.log('Phase 2.2 media/content migration completed successfully.');
    process.exitCode = 0;
  } catch (error) {
    console.error('Phase 2.2 media/content migration failed.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
