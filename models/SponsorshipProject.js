const { getPool } = require('../config/database');

class SponsorshipProject {
  static async findById(id) {
    const [rows] = await getPool().query(
      'SELECT * FROM sponsorship_projects WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async slugExists(slug, excludeId = null) {
    const params = [slug];
    let sql = 'SELECT id FROM sponsorship_projects WHERE slug = ?';
    if (excludeId) {
      sql += ' AND id <> ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    const [rows] = await getPool().query(sql, params);
    return rows.length > 0;
  }

  static async findForAdmin({ q = '', status = '', category = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push('(title LIKE ? OR summary LIKE ? OR description LIKE ? OR slug LIKE ?)');
      params.push(pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (category) {
      where.push('category = ?');
      params.push(category);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(
      `SELECT COUNT(*) AS total FROM sponsorship_projects ${whereSql}`,
      params
    );
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `SELECT * FROM sponsorship_projects ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [categoryRows] = await getPool().query(
      `SELECT DISTINCT category FROM sponsorship_projects WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC`
    );

    return {
      rows,
      total,
      categories: categoryRows.map((item) => item.category)
    };
  }

  static async findAvailable(limit = 12) {
    const [rows] = await getPool().query(
      `SELECT id, title, slug, category, summary, description, image_url, status
       FROM sponsorship_projects
       WHERE status = 'active'
       ORDER BY created_at ASC, id ASC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO sponsorship_projects
       (title, slug, category, summary, description, target_amount, current_amount, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title,
        payload.slug,
        payload.category,
        payload.summary,
        payload.description,
        payload.targetAmount || null,
        payload.currentAmount || null,
        payload.imageUrl || null,
        payload.status || 'active'
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE sponsorship_projects
       SET title = ?, slug = ?, category = ?, summary = ?, description = ?, target_amount = ?, current_amount = ?, image_url = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.title,
        payload.slug,
        payload.category,
        payload.summary,
        payload.description,
        payload.targetAmount || null,
        payload.currentAmount || null,
        payload.imageUrl || null,
        payload.status,
        id
      ]
    );
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await getPool().query(
      'UPDATE sponsorship_projects SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }
}

module.exports = SponsorshipProject;
