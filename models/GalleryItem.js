const { getPool } = require('../config/database');

class GalleryItem {
  static async findAll() {
    const [rows] = await getPool().query('SELECT * FROM gallery_items ORDER BY sort_order ASC, created_at DESC');
    return rows;
  }

  static async findForAdmin({ q = '', status = '', category = '', page = 1, limit = 12 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(title LIKE ? OR caption LIKE ? OR category LIKE ?)');
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern);
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
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM gallery_items ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;
    const [rows] = await getPool().query(
      `SELECT * FROM gallery_items ${whereSql} ORDER BY sort_order ASC, updated_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [categoryRows] = await getPool().query(
      `SELECT DISTINCT category FROM gallery_items WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC`
    );

    return {
      rows,
      total,
      categories: categoryRows.map((item) => item.category)
    };
  }

  static async findPublished(limit = null) {
    const limitSql = limit ? ' LIMIT ?' : '';
    const params = [];
    if (limit) params.push(limit);
    const [rows] = await getPool().query(
      `SELECT * FROM gallery_items WHERE status = 'published' ORDER BY sort_order ASC, created_at DESC${limitSql}`,
      params
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM gallery_items WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findBySlug(id) {
    return this.findById(id);
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO gallery_items
       (title, caption, image_url, category, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [payload.title, payload.caption, payload.imageUrl, payload.category, payload.status, payload.sortOrder]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE gallery_items
       SET title = ?, caption = ?, image_url = ?, category = ?, status = ?, sort_order = ?, updated_at = NOW()
       WHERE id = ?`,
      [payload.title, payload.caption, payload.imageUrl, payload.category, payload.status, payload.sortOrder, id]
    );
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await getPool().query(
      'UPDATE gallery_items SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM gallery_items WHERE id = ?', [id]);
  }
}

module.exports = GalleryItem;
