const { getPool } = require('../config/database');

class NewsletterSubscriber {
  static async findAll() {
    const [rows] = await getPool().query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const [rows] = await getPool().query('SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1', [String(email).trim().toLowerCase()]);
    return rows[0] || null;
  }

  static async findPublished() {
    const [rows] = await getPool().query("SELECT * FROM newsletter_subscribers WHERE status = 'active' ORDER BY created_at DESC");
    return rows;
  }

  static async findBySlug(email) {
    return this.findByEmail(email);
  }

  static async create(payload) {
    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const [result] = await getPool().query(
      `INSERT INTO newsletter_subscribers
       (email, name, status, source)
       VALUES (?, ?, ?, ?)`,
      [normalizedEmail, payload.name, payload.status || 'active', payload.source]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE newsletter_subscribers
       SET email = ?, name = ?, status = ?, source = ?, updated_at = NOW()
       WHERE id = ?`,
      [String(payload.email).trim().toLowerCase(), payload.name, payload.status, payload.source, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
  }
}

module.exports = NewsletterSubscriber;
