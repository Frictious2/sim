const { getPool } = require('../config/database');

class PrayerRequest {
  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM prayer_requests WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findForAdmin({ q = '', status = '', isPublic = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push('(name LIKE ? OR email LIKE ? OR request_text LIKE ?)');
      params.push(pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (isPublic === 'public') {
      where.push('is_public = 1');
    } else if (isPublic === 'private') {
      where.push('is_public = 0');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM prayer_requests ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `SELECT * FROM prayer_requests ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total };
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO prayer_requests
       (name, email, request_text, is_public, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        payload.name || null,
        payload.email ? String(payload.email).trim().toLowerCase() : null,
        payload.requestText,
        payload.isPublic ? 1 : 0,
        payload.status || 'new'
      ]
    );
    return this.findById(result.insertId);
  }

  static async findForUserEmail(email) {
    if (!email) {
      return [];
    }

    const [rows] = await getPool().query(
      `SELECT *
       FROM prayer_requests
       WHERE email = ?
       ORDER BY created_at DESC, id DESC`,
      [String(email).trim().toLowerCase()]
    );

    return rows;
  }

  static async updateStatus(id, status) {
    await getPool().query(
      'UPDATE prayer_requests SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  static async countsForAdmin() {
    const [rows] = await getPool().query(
      `SELECT
         SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS newCount,
         COUNT(*) AS totalCount
       FROM prayer_requests`
    );
    return rows[0] || { newCount: 0, totalCount: 0 };
  }
}

module.exports = PrayerRequest;
