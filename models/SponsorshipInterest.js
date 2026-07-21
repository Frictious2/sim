const { getPool } = require('../config/database');

class SponsorshipInterest {
  static async findById(id) {
    const [rows] = await getPool().query(
      `SELECT sponsorship_interests.*, reviewer.name AS reviewed_by_name
       FROM sponsorship_interests
       LEFT JOIN users AS reviewer ON reviewer.id = sponsorship_interests.reviewed_by
       WHERE sponsorship_interests.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findForAdmin({ q = '', status = '', sponsorshipType = '', preferredPlan = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push('(sponsor_name LIKE ? OR sponsor_email LIKE ? OR message LIKE ?)');
      params.push(pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (sponsorshipType) {
      where.push('sponsorship_type = ?');
      params.push(sponsorshipType);
    }

    if (preferredPlan) {
      where.push('preferred_plan = ?');
      params.push(preferredPlan);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM sponsorship_interests ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `SELECT sponsorship_interests.*, reviewer.name AS reviewed_by_name
       FROM sponsorship_interests
       LEFT JOIN users AS reviewer ON reviewer.id = sponsorship_interests.reviewed_by
       ${whereSql}
       ORDER BY sponsorship_interests.created_at DESC, sponsorship_interests.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total };
  }

  static async findForUser(userId, { status = '', sponsorshipType = '' } = {}) {
    const where = ['user_id = ?'];
    const params = [userId];

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (sponsorshipType) {
      where.push('sponsorship_type = ?');
      params.push(sponsorshipType);
    }

    const [rows] = await getPool().query(
      `SELECT * FROM sponsorship_interests
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC, id DESC`,
      params
    );
    return rows;
  }

  static async findOwnedById(id, userId) {
    const [rows] = await getPool().query(
      `SELECT * FROM sponsorship_interests
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId]
    );

    return rows[0] || null;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO sponsorship_interests
       (user_id, sponsor_name, sponsor_email, sponsor_phone, sponsorship_type, preferred_plan, amount, currency, preferred_contact_method, message, status, reviewed_by, reviewed_at, admin_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.userId || null,
        payload.sponsorName,
        payload.sponsorEmail,
        payload.sponsorPhone || null,
        payload.sponsorshipType,
        payload.preferredPlan,
        payload.amount || null,
        payload.currency || 'NLe',
        payload.preferredContactMethod || null,
        payload.message || null,
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
      `UPDATE sponsorship_interests
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
      `UPDATE sponsorship_interests
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
       FROM sponsorship_interests`
    );
    return rows[0] || { newCount: 0, totalCount: 0 };
  }

  static async summaryForUser(userId) {
    const [rows] = await getPool().query(
      `SELECT
         COUNT(*) AS totalCount,
         SUM(CASE WHEN status IN ('new', 'contacted', 'approved') THEN 1 ELSE 0 END) AS activeCount
       FROM sponsorship_interests
       WHERE user_id = ?`,
      [userId]
    );

    return rows[0] || {
      totalCount: 0,
      activeCount: 0
    };
  }
}

module.exports = SponsorshipInterest;
