const { getPool } = require('../config/database');

async function logAction({
  req = null,
  userId = null,
  action,
  entityType = null,
  entityId = null,
  metadata = null
}) {
  if (!action) {
    return;
  }

  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  try {
    await getPool().query(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, ip_address, user_agent, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || (req && req.session && req.session.user ? req.session.user.id : null),
        action,
        entityType,
        entityId,
        req ? req.ip : null,
        req ? req.get('user-agent') : null,
        metadataJson
      ]
    );
  } catch (error) {
    // Audit logging should never block the main CMS action.
  }
}

async function listRecent({ limit = 50 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const [rows] = await getPool().query(
    `SELECT audit_logs.*, users.name AS user_name
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ORDER BY audit_logs.created_at DESC, audit_logs.id DESC
     LIMIT ?`,
    [safeLimit]
  );
  return rows;
}

module.exports = {
  logAction,
  listRecent
};
