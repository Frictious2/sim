const { getPool } = require('../config/database');

class Page {
  static async findAll() {
    const [rows] = await getPool().query('SELECT * FROM pages ORDER BY title ASC');
    return rows;
  }

  static async findForAdmin({ q = '', status = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(title LIKE ? OR slug LIKE ? OR subtitle LIKE ? OR body LIKE ?)');
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM pages ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;
    const [rows] = await getPool().query(
      `SELECT * FROM pages ${whereSql} ORDER BY updated_at DESC, title ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total };
  }

  static async findPublished() {
    const [rows] = await getPool().query("SELECT * FROM pages WHERE status = 'published' ORDER BY title ASC");
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM pages WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findBySlug(slug) {
    const [rows] = await getPool().query('SELECT * FROM pages WHERE slug = ? LIMIT 1', [slug]);
    return rows[0] || null;
  }

  static async slugExists(slug, excludeId = null) {
    const params = [slug];
    let sql = 'SELECT id FROM pages WHERE slug = ?';
    if (excludeId) {
      sql += ' AND id <> ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    const [rows] = await getPool().query(sql, params);
    return rows.length > 0;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO pages
       (title, slug, subtitle, body, meta_title, meta_description, status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [payload.title, payload.slug, payload.subtitle, payload.body, payload.metaTitle, payload.metaDescription, payload.status, payload.createdBy, payload.updatedBy]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE pages
       SET title = ?, slug = ?, subtitle = ?, body = ?, meta_title = ?, meta_description = ?, status = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [payload.title, payload.slug, payload.subtitle, payload.body, payload.metaTitle, payload.metaDescription, payload.status, payload.updatedBy, id]
    );
    return this.findById(id);
  }

  static async archive(id, updatedBy = null) {
    await getPool().query(
      'UPDATE pages SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
      ['draft', updatedBy, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM pages WHERE id = ?', [id]);
  }
}

module.exports = Page;
