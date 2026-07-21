const { testConnection, closePool } = require('../config/database');

(async () => {
  try {
    await testConnection();
    console.log('Database connection successful.');
    process.exitCode = 0;
  } catch (error) {
    console.error('Database connection failed.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
})();
