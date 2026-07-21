const { getPool } = require('../config/database');

class MissionWorker {
  static async findById(id) {
    const [rows] = await getPool().query(
      'SELECT * FROM mission_workers WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async nextWorkerCode() {
    const prefix = 'SIM-MW-';
    const [rows] = await getPool().query(
      `SELECT worker_code
       FROM mission_workers
       WHERE worker_code LIKE ?
       ORDER BY worker_code DESC
       LIMIT 1`,
      [`${prefix}%`]
    );
    const lastCode = rows[0] ? String(rows[0].worker_code || '') : '';
    const lastNumber = lastCode ? Number(lastCode.slice(prefix.length)) || 0 : 0;
    return `${prefix}${String(lastNumber + 1).padStart(6, '0')}`;
  }

  static async findForAdmin({ q = '', status = '', location = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push('(worker_code LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR location LIKE ? OR ministry_focus LIKE ?)');
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (location) {
      where.push('location = ?');
      params.push(location);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(
      `SELECT COUNT(*) AS total FROM mission_workers ${whereSql}`,
      params
    );
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `SELECT * FROM mission_workers ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [locationRows] = await getPool().query(
      `SELECT DISTINCT location FROM mission_workers WHERE location IS NOT NULL AND location <> '' ORDER BY location ASC`
    );

    return {
      rows,
      total,
      locations: locationRows.map((item) => item.location)
    };
  }

  static async findAvailable(limit = 12) {
    const [rows] = await getPool().query(
      `SELECT id, worker_code, first_name, last_name, location, ministry_focus, biography, profile_image_url, support_target, status
       FROM mission_workers
       WHERE status = 'active'
       ORDER BY created_at ASC, id ASC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  static async create(payload) {
    const workerCode = payload.workerCode || await this.nextWorkerCode();
    const [result] = await getPool().query(
      `INSERT INTO mission_workers
       (worker_code, first_name, last_name, location, ministry_focus, biography, profile_image_url, support_target, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workerCode,
        payload.firstName,
        payload.lastName,
        payload.location,
        payload.ministryFocus,
        payload.biography || null,
        payload.profileImageUrl || null,
        payload.supportTarget || null,
        payload.status || 'active'
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE mission_workers
       SET first_name = ?, last_name = ?, location = ?, ministry_focus = ?, biography = ?, profile_image_url = ?, support_target = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.firstName,
        payload.lastName,
        payload.location,
        payload.ministryFocus,
        payload.biography || null,
        payload.profileImageUrl || null,
        payload.supportTarget || null,
        payload.status,
        id
      ]
    );
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await getPool().query(
      'UPDATE mission_workers SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }
}

module.exports = MissionWorker;
