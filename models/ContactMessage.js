const { getPool } = require('../config/database');

class ContactMessage {
  static async findAll() {
    const [rows] = await getPool().query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return rows;
  }

  static async findForAdmin({ q = '', status = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)');
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM contact_messages ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;
    const [rows] = await getPool().query(
      `SELECT * FROM contact_messages ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total };
  }

  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM contact_messages WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO contact_messages
       (name, email, phone, subject, message, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [payload.name, payload.email, payload.phone, payload.subject, payload.message, payload.status || 'new']
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE contact_messages
       SET name = ?, email = ?, phone = ?, subject = ?, message = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [payload.name, payload.email, payload.phone, payload.subject, payload.message, payload.status, id]
    );
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await getPool().query('UPDATE contact_messages SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM contact_messages WHERE id = ?', [id]);
  }
}

module.exports = ContactMessage;
