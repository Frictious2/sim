const { getPool, closePool } = require('../config/database');

async function ensureTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS page_sections (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      page_slug VARCHAR(160) NOT NULL,
      section_key VARCHAR(160) NOT NULL,
      eyebrow VARCHAR(190) NULL,
      title VARCHAR(255) NULL,
      subtitle TEXT NULL,
      body LONGTEXT NULL,
      image_url VARCHAR(500) NULL,
      image_alt VARCHAR(255) NULL,
      button_label VARCHAR(120) NULL,
      button_url VARCHAR(255) NULL,
      secondary_button_label VARCHAR(120) NULL,
      secondary_button_url VARCHAR(255) NULL,
      layout VARCHAR(80) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY page_sections_slug_key_unique (page_slug, section_key),
      KEY page_sections_page_slug_index (page_slug),
      KEY page_sections_active_order_index (is_active, sort_order)
    )
  `);
}

ensureTable()
  .then(() => {
    console.log('Page sections migration completed.');
  })
  .catch((error) => {
    console.error('Page sections migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool().catch(() => {});
  });
