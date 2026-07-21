const { getPool } = require('../config/database');

class VolunteerApplication {
  static async findById(id) {
    const [rows] = await getPool().query(
      `SELECT volunteer_applications.*, reviewer.name AS reviewed_by_name
       FROM volunteer_applications
       LEFT JOIN users AS reviewer ON reviewer.id = volunteer_applications.reviewed_by
       WHERE volunteer_applications.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findForAdmin({ q = '', status = '', areaOfInterest = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push('(full_name LIKE ? OR email LIKE ? OR location LIKE ? OR experience LIKE ? OR motivation LIKE ?)');
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (areaOfInterest) {
      where.push('area_of_interest = ?');
      params.push(areaOfInterest);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM volunteer_applications ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `SELECT volunteer_applications.*, reviewer.name AS reviewed_by_name
       FROM volunteer_applications
       LEFT JOIN users AS reviewer ON reviewer.id = volunteer_applications.reviewed_by
       ${whereSql}
       ORDER BY volunteer_applications.created_at DESC, volunteer_applications.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total };
  }

  static async findForUser(userId, { status = '' } = {}) {
    const where = ['user_id = ?'];
    const params = [userId];

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    const [rows] = await getPool().query(
      `SELECT * FROM volunteer_applications
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC, id DESC`,
      params
    );
    return rows;
  }

  static async findOwnedById(id, userId) {
    const [rows] = await getPool().query(
      `SELECT * FROM volunteer_applications
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId]
    );

    return rows[0] || null;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO volunteer_applications
       (user_id, full_name, email, phone, location, area_of_interest, availability, experience, motivation, status, reviewed_by, reviewed_at, admin_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.userId || null,
        payload.fullName,
        payload.email,
        payload.phone || null,
        payload.location || null,
        payload.areaOfInterest,
        payload.availability || null,
        payload.experience || null,
        payload.motivation || null,
        payload.status || 'new',
        payload.reviewedBy || null,
        payload.reviewedAt || null,
        payload.adminNote || null
      ]
    );
    return this.findById(result.insertId);
  }

  static async updateStatus(id, { status, reviewedBy = null, reviewedAt = null, adminNote = null, appendNote = false }) {
    const current = await this.findById(id);
    const noteValue = appendNote && current && current.admin_note && adminNote
      ? `${current.admin_note}\n\n${adminNote}`
      : (adminNote !== null ? adminNote : current ? current.admin_note : null);

    await getPool().query(
      `UPDATE volunteer_applications
       SET status = ?, reviewed_by = ?, reviewed_at = ?, admin_note = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, reviewedBy, reviewedAt, noteValue, id]
    );
    return this.findById(id);
  }

  static async updateNote(id, adminNote, reviewedBy = null) {
    const current = await this.findById(id);
    const nextNote = current && current.admin_note
      ? `${current.admin_note}\n\n${adminNote}`
      : adminNote;
    await getPool().query(
      `UPDATE volunteer_applications
       SET admin_note = ?, reviewed_by = COALESCE(?, reviewed_by), reviewed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [nextNote, reviewedBy, id]
    );
    return this.findById(id);
  }

  static async countsForAdmin() {
    const [rows] = await getPool().query(
      `SELECT
         SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS newCount,
         COUNT(*) AS totalCount
       FROM volunteer_applications`
    );
    return rows[0] || { newCount: 0, totalCount: 0 };
  }

  static async summaryForUser(userId) {
    const [rows] = await getPool().query(
      `SELECT
         COUNT(*) AS totalCount,
         SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS newCount,
         SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) AS reviewingCount,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approvedCount
       FROM volunteer_applications
       WHERE user_id = ?`,
      [userId]
    );

    return rows[0] || {
      totalCount: 0,
      newCount: 0,
      reviewingCount: 0,
      approvedCount: 0
    };
  }
}

module.exports = VolunteerApplication;
