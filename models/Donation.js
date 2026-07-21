const { getPool } = require('../config/database');

class Donation {
  static async findById(id) {
    const [rows] = await getPool().query(
      `SELECT donations.*,
              users.name AS user_name,
              verifier.name AS verified_by_name
       FROM donations
       LEFT JOIN users ON users.id = donations.user_id
       LEFT JOIN users AS verifier ON verifier.id = donations.verified_by
       WHERE donations.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findOwnedById(id, userId) {
    const [rows] = await getPool().query(
      `SELECT *
       FROM donations
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId]
    );

    return rows[0] || null;
  }

  static async findForAdmin({
    q = '',
    status = '',
    designation = '',
    paymentMethod = '',
    page = 1,
    limit = 10
  } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push('(donor_name LIKE ? OR donor_email LIKE ? OR payment_reference LIKE ? OR message LIKE ?)');
      params.push(pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (designation) {
      where.push('designation = ?');
      params.push(designation);
    }

    if (paymentMethod) {
      where.push('payment_method = ?');
      params.push(paymentMethod);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM donations ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `SELECT donations.*, verifier.name AS verified_by_name
       FROM donations
       LEFT JOIN users AS verifier ON verifier.id = donations.verified_by
       ${whereSql}
       ORDER BY donations.created_at DESC, donations.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total };
  }

  static async findForUser(userId, { status = '', designation = '' } = {}) {
    const where = ['user_id = ?'];
    const params = [userId];

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (designation) {
      where.push('designation = ?');
      params.push(designation);
    }

    const [rows] = await getPool().query(
      `SELECT * FROM donations
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC, id DESC`,
      params
    );
    return rows;
  }

  static async nextReceiptNumber(year = new Date().getFullYear()) {
    const prefix = `SIM-RCP-${year}-`;
    const [rows] = await getPool().query(
      `SELECT receipt_number
       FROM donations
       WHERE receipt_number LIKE ?
       ORDER BY receipt_number DESC
       LIMIT 1`,
      [`${prefix}%`]
    );

    const lastReceipt = rows[0] ? String(rows[0].receipt_number || '') : '';
    const lastSequence = lastReceipt ? Number(lastReceipt.slice(prefix.length)) || 0 : 0;
    const nextSequence = lastSequence + 1;
    return `${prefix}${String(nextSequence).padStart(6, '0')}`;
  }

  static async assignReceiptNumberIfMissing(id, generatedAt = new Date()) {
    const donation = await this.findById(id);
    if (!donation) {
      return null;
    }

    if (donation.receipt_number) {
      return donation;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const receiptNumber = await this.nextReceiptNumber(generatedAt.getFullYear());
      try {
        const [result] = await getPool().query(
          `UPDATE donations
           SET receipt_number = ?, receipt_generated_at = ?, updated_at = NOW()
           WHERE id = ? AND receipt_number IS NULL`,
          [receiptNumber, generatedAt, id]
        );

        if (result.affectedRows > 0) {
          return this.findById(id);
        }

        return this.findById(id);
      } catch (error) {
        if (error && error.code === 'ER_DUP_ENTRY') {
          continue;
        }
        throw error;
      }
    }

    return this.findById(id);
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO donations
       (user_id, donor_name, donor_email, donor_phone, amount, currency, donation_type, designation, payment_method, payment_reference, proof_file_url, message, status, verified_by, verified_at, rejection_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.userId || null,
        payload.donorName,
        payload.donorEmail,
        payload.donorPhone || null,
        payload.amount,
        payload.currency || 'NLe',
        payload.donationType,
        payload.designation,
        payload.paymentMethod,
        payload.paymentReference || null,
        payload.proofFileUrl || null,
        payload.message || null,
        payload.status || 'pending',
        payload.verifiedBy || null,
        payload.verifiedAt || null,
        payload.rejectionReason || null
      ]
    );
    return this.findById(result.insertId);
  }

  static async updateStatus(id, { status, verifiedBy = null, verifiedAt = null, rejectionReason = null }) {
    await getPool().query(
      `UPDATE donations
       SET status = ?, verified_by = ?, verified_at = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, verifiedBy, verifiedAt, rejectionReason, id]
    );
    return this.findById(id);
  }

  static async countsForAdmin() {
    const [rows] = await getPool().query(
      `SELECT
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingCount,
         COUNT(*) AS totalCount
       FROM donations`
    );
    return rows[0] || { pendingCount: 0, totalCount: 0 };
  }

  static async summaryForUser(userId) {
    const [rows] = await getPool().query(
      `SELECT
         COUNT(*) AS totalCount,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingCount,
         SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verifiedCount,
         SUM(COALESCE(amount, 0)) AS totalAmount
       FROM donations
       WHERE user_id = ?`,
      [userId]
    );

    return rows[0] || {
      totalCount: 0,
      pendingCount: 0,
      verifiedCount: 0,
      totalAmount: 0
    };
  }
}

module.exports = Donation;
