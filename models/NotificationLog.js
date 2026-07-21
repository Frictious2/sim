const { getPool } = require('../config/database');

class NotificationLog {
  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO notification_logs
       (recipient_email, subject, notification_type, related_entity_type, related_entity_id, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.recipientEmail,
        payload.subject,
        payload.notificationType,
        payload.relatedEntityType || null,
        payload.relatedEntityId || null,
        payload.status,
        payload.errorMessage || null
      ]
    );

    return this.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await getPool().query(
      'SELECT * FROM notification_logs WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async findForAdmin({ q = '', status = '', type = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push('(recipient_email LIKE ? OR subject LIKE ? OR notification_type LIKE ? OR error_message LIKE ?)');
      params.push(pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (type) {
      where.push('notification_type = ?');
      params.push(type);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(
      `SELECT COUNT(*) AS total FROM notification_logs ${whereSql}`,
      params
    );
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `SELECT * FROM notification_logs ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [typeRows] = await getPool().query(
      `SELECT DISTINCT notification_type
       FROM notification_logs
       WHERE notification_type IS NOT NULL AND notification_type <> ''
       ORDER BY notification_type ASC`
    );

    return {
      rows,
      total,
      notificationTypes: typeRows.map((item) => item.notification_type)
    };
  }
}

module.exports = NotificationLog;
