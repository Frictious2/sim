const { getPool } = require('../config/database');

class Project {
  static async findAll() {
    const [rows] = await getPool().query('SELECT * FROM projects ORDER BY is_featured DESC, updated_at DESC');
    return rows;
  }

  static async findForAdmin({ q = '', status = '', category = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(title LIKE ? OR summary LIKE ? OR description LIKE ? OR slug LIKE ? OR location LIKE ?)');
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern, pattern);
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
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM projects ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;
    const [rows] = await getPool().query(
      `SELECT * FROM projects ${whereSql} ORDER BY is_featured DESC, updated_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [categoryRows] = await getPool().query(
      `SELECT DISTINCT category FROM projects WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC`
    );

    return {
      rows,
      total,
      categories: categoryRows.map((item) => item.category)
    };
  }

  static async findPublished() {
    const [rows] = await getPool().query(
      "SELECT * FROM projects WHERE status IN ('active', 'completed') ORDER BY is_featured DESC, updated_at DESC"
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM projects WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findBySlug(slug) {
    const [rows] = await getPool().query('SELECT * FROM projects WHERE slug = ? LIMIT 1', [slug]);
    return rows[0] || null;
  }

  static async slugExists(slug, excludeId = null) {
    const params = [slug];
    let sql = 'SELECT id FROM projects WHERE slug = ?';
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
      `INSERT INTO projects
       (title, slug, summary, description, location, category, meta_title, meta_description, status, featured_image, progress_label, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [payload.title, payload.slug, payload.summary || '', payload.description, payload.location || '', payload.category || '', payload.metaTitle || null, payload.metaDescription || null, payload.status, payload.featuredImage, payload.progressLabel, payload.isFeatured]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE projects
       SET title = ?, slug = ?, summary = ?, description = ?, location = ?, category = ?, meta_title = ?, meta_description = ?, status = ?, featured_image = ?, progress_label = ?, is_featured = ?, updated_at = NOW()
       WHERE id = ?`,
      [payload.title, payload.slug, payload.summary || '', payload.description, payload.location || '', payload.category || '', payload.metaTitle || null, payload.metaDescription || null, payload.status, payload.featuredImage, payload.progressLabel, payload.isFeatured, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM projects WHERE id = ?', [id]);
  }
}

module.exports = Project;
