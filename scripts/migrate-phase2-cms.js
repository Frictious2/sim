const { getPool, closePool } = require('../config/database');
const fs = require('fs');
const path = require('path');

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

async function migrateBlogPosts() {
  await ensureTable('blog_posts');
  await ensureColumn('blog_posts', 'body', 'LONGTEXT NULL AFTER excerpt');
  await ensureColumn('blog_posts', 'featured_image', 'VARCHAR(255) NULL AFTER body');
  await ensureColumn('blog_posts', 'status', "ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published' AFTER category");
  await ensureColumn('blog_posts', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

  if (await columnExists('blog_posts', 'content')) {
    await getPool().query("UPDATE blog_posts SET body = COALESCE(body, content, '') WHERE body IS NULL OR body = ''");
  }

  await getPool().query("UPDATE blog_posts SET status = COALESCE(status, 'published')");
  await ensureIndex('blog_posts', 'blog_posts_slug_unique', 'ALTER TABLE blog_posts ADD UNIQUE KEY blog_posts_slug_unique (slug)');
  await ensureIndex('blog_posts', 'blog_posts_status_index', 'ALTER TABLE blog_posts ADD KEY blog_posts_status_index (status)');
  await ensureIndex('blog_posts', 'blog_posts_category_index', 'ALTER TABLE blog_posts ADD KEY blog_posts_category_index (category)');
  await ensureIndex('blog_posts', 'blog_posts_published_at_index', 'ALTER TABLE blog_posts ADD KEY blog_posts_published_at_index (published_at)');
}

async function migrateProjects() {
  await ensureTable('projects');
  await ensureColumn('projects', 'slug', 'VARCHAR(190) NULL AFTER title');
  await ensureColumn('projects', 'category', 'VARCHAR(120) NULL AFTER location');
  await ensureColumn('projects', 'featured_image', 'VARCHAR(255) NULL AFTER status');
  await ensureColumn('projects', 'progress_label', 'VARCHAR(120) NULL AFTER featured_image');
  await ensureColumn('projects', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

  const [rows] = await getPool().query('SELECT id, title, slug FROM projects ORDER BY id ASC');
  for (const row of rows) {
    if (!row.slug) {
      const baseSlug = String(row.title || 'project')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `project-${row.id}`;
      await getPool().query('UPDATE projects SET slug = ? WHERE id = ?', [`${baseSlug}-${row.id}`, row.id]);
    }
  }

  await getPool().query('ALTER TABLE projects MODIFY COLUMN slug VARCHAR(190) NOT NULL');
  await ensureIndex('projects', 'projects_slug_unique', 'ALTER TABLE projects ADD UNIQUE KEY projects_slug_unique (slug)');
  await ensureIndex('projects', 'projects_status_index', 'ALTER TABLE projects ADD KEY projects_status_index (status)');
  await ensureIndex('projects', 'projects_category_index', 'ALTER TABLE projects ADD KEY projects_category_index (category)');
  await ensureIndex('projects', 'projects_is_featured_index', 'ALTER TABLE projects ADD KEY projects_is_featured_index (is_featured)');
}

async function migrateContactMessages() {
  await ensureTable('contact_messages');
  await ensureColumn('contact_messages', 'phone', 'VARCHAR(50) NULL AFTER email');
  await ensureColumn('contact_messages', 'status', "ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new' AFTER message");
  await ensureColumn('contact_messages', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
  await ensureIndex('contact_messages', 'contact_messages_email_index', 'ALTER TABLE contact_messages ADD KEY contact_messages_email_index (email)');
  await ensureIndex('contact_messages', 'contact_messages_status_index', 'ALTER TABLE contact_messages ADD KEY contact_messages_status_index (status)');
  await ensureIndex('contact_messages', 'contact_messages_created_at_index', 'ALTER TABLE contact_messages ADD KEY contact_messages_created_at_index (created_at)');
}

async function migrateNewsletterSubscribers() {
  await ensureTable('newsletter_subscribers');
  await ensureColumn('newsletter_subscribers', 'name', 'VARCHAR(190) NULL AFTER email');
  await ensureColumn('newsletter_subscribers', 'status', "ENUM('active', 'unsubscribed') NOT NULL DEFAULT 'active' AFTER name");
  await ensureColumn('newsletter_subscribers', 'source', 'VARCHAR(120) NULL AFTER status');
  await ensureColumn('newsletter_subscribers', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
  await ensureIndex('newsletter_subscribers', 'newsletter_subscribers_email_unique', 'ALTER TABLE newsletter_subscribers ADD UNIQUE KEY newsletter_subscribers_email_unique (email)');
  await ensureIndex('newsletter_subscribers', 'newsletter_subscribers_status_index', 'ALTER TABLE newsletter_subscribers ADD KEY newsletter_subscribers_status_index (status)');
  await ensureIndex('newsletter_subscribers', 'newsletter_subscribers_created_at_index', 'ALTER TABLE newsletter_subscribers ADD KEY newsletter_subscribers_created_at_index (created_at)');
}

(async () => {
  try {
    await ensureTable('pages');
    await ensureTable('homepage_sections');
    await migrateBlogPosts();
    await migrateProjects();
    await ensureTable('testimonies');
    await ensureTable('gallery_items');
    await migrateContactMessages();
    await migrateNewsletterSubscribers();

    console.log('Phase 2.1 CMS migration completed successfully.');
    process.exitCode = 0;
  } catch (error) {
    console.error('Phase 2.1 CMS migration failed.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
