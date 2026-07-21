const mysql = require('mysql2/promise');
const env = require('./env');

let pool;

function createPool() {
  return mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    namedPlaceholders: true
  });
}

function getPool() {
  if (!pool) {
    pool = createPool();
  }

  return pool;
}

async function testConnection() {
  const connection = await getPool().getConnection();

  try {
    await connection.query('SELECT 1 AS ok');
  } finally {
    connection.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  testConnection,
  closePool
};
