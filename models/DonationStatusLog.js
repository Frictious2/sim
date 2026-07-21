const { getPool } = require('../config/database');

class DonationStatusLog {
  static async create({ donationId, oldStatus = null, newStatus, note = null, changedBy = null }) {
    const [result] = await getPool().query(
      `INSERT INTO donation_status_logs
       (donation_id, old_status, new_status, note, changed_by)
       VALUES (?, ?, ?, ?, ?)`,
      [donationId, oldStatus, newStatus, note, changedBy]
    );

    const [rows] = await getPool().query(
      `SELECT donation_status_logs.*, users.name AS changed_by_name
       FROM donation_status_logs
       LEFT JOIN users ON users.id = donation_status_logs.changed_by
       WHERE donation_status_logs.id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return rows[0] || null;
  }

  static async findForDonation(donationId) {
    const [rows] = await getPool().query(
      `SELECT donation_status_logs.*, users.name AS changed_by_name
       FROM donation_status_logs
       LEFT JOIN users ON users.id = donation_status_logs.changed_by
       WHERE donation_status_logs.donation_id = ?
       ORDER BY donation_status_logs.created_at ASC, donation_status_logs.id ASC`,
      [donationId]
    );

    return rows;
  }
}

module.exports = DonationStatusLog;
