const { getPool } = require('../config/database');

class PrayerPartner {
  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM prayer_partners WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findForAdmin({ q = '', status = '', prayerFocus = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      params.push(pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (prayerFocus) {
      where.push('prayer_focus = ?');
      params.push(prayerFocus);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM prayer_partners ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `SELECT * FROM prayer_partners ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total };
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO prayer_partners
       (user_id, name, email, phone, prayer_focus, frequency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.userId || null,
        payload.name,
        String(payload.email || '').trim().toLowerCase(),
        payload.phone || null,
        payload.prayerFocus,
        payload.frequency,
        payload.status || 'active'
      ]
    );
    return this.findById(result.insertId);
  }

  static async findCurrentForUser({ userId = null, email = '' } = {}) {
    const where = [];
    const params = [];

    if (userId) {
      where.push('user_id = ?');
      params.push(userId);
    }

    if (email) {
      where.push('email = ?');
      params.push(String(email).trim().toLowerCase());
    }

    if (!where.length) {
      return null;
    }

    const [rows] = await getPool().query(
      `SELECT *
       FROM prayer_partners
       WHERE ${where.join(' OR ')}
       ORDER BY
         CASE status WHEN 'active' THEN 0 WHEN 'inactive' THEN 1 ELSE 2 END,
         created_at DESC,
         id DESC
       LIMIT 1`,
      params
    );

    return rows[0] || null;
  }

  static async updateOwnPreferences(id, { prayerFocus, frequency }, { userId = null, email = '' } = {}) {
    const where = ['id = ?'];
    const params = [id];

    if (userId) {
      where.push('(user_id = ? OR email = ?)');
      params.push(userId, String(email || '').trim().toLowerCase());
    } else if (email) {
      where.push('email = ?');
      params.push(String(email).trim().toLowerCase());
    }

    await getPool().query(
      `UPDATE prayer_partners
       SET prayer_focus = ?, frequency = ?, updated_at = NOW()
       WHERE ${where.join(' AND ')}`,
      [prayerFocus, frequency, ...params]
    );

    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await getPool().query(
      'UPDATE prayer_partners SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  static async countsForAdmin() {
    const [rows] = await getPool().query(
      `SELECT
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeCount,
         COUNT(*) AS totalCount
       FROM prayer_partners`
    );
    return rows[0] || { activeCount: 0, totalCount: 0 };
  }
}

module.exports = PrayerPartner;
