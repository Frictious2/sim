const { getPool } = require('../config/database');

class Testimony {
  static async findAll() {
    const [rows] = await getPool().query('SELECT * FROM testimonies ORDER BY is_featured DESC, created_at DESC');
    return rows;
  }

  static async findForAdmin({ q = '', status = '', featured = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(name LIKE ? OR location LIKE ? OR quote LIKE ? OR story LIKE ?)');
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (featured === 'featured') {
      where.push('is_featured = 1');
    } else if (featured === 'standard') {
      where.push('is_featured = 0');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(`SELECT COUNT(*) AS total FROM testimonies ${whereSql}`, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;
    const [rows] = await getPool().query(
      `SELECT * FROM testimonies ${whereSql} ORDER BY is_featured DESC, updated_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total };
  }

  static async findPublished(limit = null) {
    const limitSql = limit ? ' LIMIT ?' : '';
    const params = [];
    if (limit) params.push(limit);
    const [rows] = await getPool().query(
      `SELECT * FROM testimonies WHERE status = 'published' ORDER BY is_featured DESC, created_at DESC${limitSql}`,
      params
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM testimonies WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findBySlug(id) {
    return this.findById(id);
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO testimonies
       (name, location, quote, story, image_url, status, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [payload.name, payload.location, payload.quote, payload.story, payload.imageUrl, payload.status, payload.isFeatured]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE testimonies
       SET name = ?, location = ?, quote = ?, story = ?, image_url = ?, status = ?, is_featured = ?, updated_at = NOW()
       WHERE id = ?`,
      [payload.name, payload.location, payload.quote, payload.story, payload.imageUrl, payload.status, payload.isFeatured, id]
    );
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await getPool().query(
      'UPDATE testimonies SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  static async updateFeatured(id, isFeatured) {
    await getPool().query(
      'UPDATE testimonies SET is_featured = ?, updated_at = NOW() WHERE id = ?',
      [isFeatured, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM testimonies WHERE id = ?', [id]);
  }
}

module.exports = Testimony;
