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

async function findForAdmin({
  q = '',
  action = '',
  entityType = '',
  userId = '',
  page = 1,
  limit = 20
} = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const requestedPage = Math.max(1, Number(page) || 1);
  const where = [];
  const params = [];

  if (q) {
    const pattern = `%${q}%`;
    where.push(`(
      audit_logs.action LIKE ? OR
      audit_logs.entity_type LIKE ? OR
      audit_logs.metadata_json LIKE ? OR
      users.name LIKE ? OR
      users.email LIKE ?
    )`);
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  if (action) {
    where.push('audit_logs.action = ?');
    params.push(action);
  }

  if (entityType) {
    where.push('audit_logs.entity_type = ?');
    params.push(entityType);
  }

  if (userId) {
    where.push('audit_logs.user_id = ?');
    params.push(userId);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [countRows] = await getPool().query(
    `SELECT COUNT(*) AS total
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ${whereSql}`,
    params
  );

  const total = countRows[0] ? Number(countRows[0].total) : 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * safeLimit;

  const [rows] = await getPool().query(
    `SELECT audit_logs.*, users.name AS user_name, users.email AS user_email
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ${whereSql}
     ORDER BY audit_logs.created_at DESC, audit_logs.id DESC
     LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset]
  );

  const [actionRows] = await getPool().query(
    `SELECT DISTINCT action
     FROM audit_logs
     ORDER BY action ASC`
  );

  const [entityRows] = await getPool().query(
    `SELECT DISTINCT entity_type
     FROM audit_logs
     WHERE entity_type IS NOT NULL AND entity_type <> ''
     ORDER BY entity_type ASC`
  );

  return {
    rows,
    total,
    actions: actionRows.map((item) => item.action).filter(Boolean),
    entityTypes: entityRows.map((item) => item.entity_type).filter(Boolean)
  };
}

async function findById(id) {
  const [rows] = await getPool().query(
    `SELECT audit_logs.*, users.name AS user_name, users.email AS user_email
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     WHERE audit_logs.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  logAction,
  listRecent,
  findForAdmin,
  findById
};
