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

async function ensureColumn(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await getPool().query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function safeAlter(sql) {
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

(async () => {
  try {
    if (!(await tableExists('users'))) {
      const createUsers = getCreateTableStatement('users');
      await getPool().query(createUsers);
    } else {
      await safeAlter('ALTER TABLE users ENGINE=InnoDB');
      await safeAlter('ALTER TABLE users MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT');
      await safeAlter('ALTER TABLE users MODIFY COLUMN name VARCHAR(150) NOT NULL');
      await safeAlter('ALTER TABLE users MODIFY COLUMN email VARCHAR(190) NOT NULL');
      await safeAlter('ALTER TABLE users MODIFY COLUMN phone VARCHAR(50) NULL');
      await safeAlter("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'donor', 'sponsor', 'volunteer', 'partner') NOT NULL DEFAULT 'user'");
      await ensureColumn('users', 'status', "ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active' AFTER role");
      await ensureColumn('users', 'email_verified_at', 'DATETIME NULL AFTER status');
      await ensureColumn('users', 'last_login_at', 'DATETIME NULL AFTER email_verified_at');
      await ensureColumn('users', 'updated_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
    }

    await ensureTable('password_resets');
    await ensureTable('user_profiles');
    await ensureTable('audit_logs');

    console.log('Phase 2 foundation migration completed successfully.');
    process.exitCode = 0;
  } catch (error) {
    console.error('Phase 2 foundation migration failed.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
