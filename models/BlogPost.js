const { getPool } = require('../config/database');

class BlogPost {
  static columnCache = null;

  static async getColumns() {
    if (!this.columnCache) {
      const [rows] = await getPool().query('SHOW COLUMNS FROM blog_posts');
      this.columnCache = rows.map((row) => row.Field);
    }

    return this.columnCache;
  }

  static async findAll() {
    const [rows] = await getPool().query(
      `SELECT blog_posts.*, COALESCE(users.name, blog_posts.author_name) AS resolved_author_name
       FROM blog_posts
       LEFT JOIN users ON users.id = blog_posts.author_id
       ORDER BY blog_posts.updated_at DESC`
    );
    return rows;
  }

  static async findForAdmin({ q = '', status = '', category = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(blog_posts.title LIKE ? OR blog_posts.excerpt LIKE ? OR blog_posts.body LIKE ? OR blog_posts.slug LIKE ?)');
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('blog_posts.status = ?');
      params.push(status);
    }

    if (category) {
      where.push('blog_posts.category = ?');
      params.push(category);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countSql = `SELECT COUNT(*) AS total FROM blog_posts ${whereSql}`;
    const [countRows] = await getPool().query(countSql, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;
    const [rows] = await getPool().query(
      `SELECT blog_posts.*, COALESCE(users.name, blog_posts.author_name) AS resolved_author_name
       FROM blog_posts
       LEFT JOIN users ON users.id = blog_posts.author_id
       ${whereSql}
       ORDER BY blog_posts.updated_at DESC, blog_posts.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [categoryRows] = await getPool().query(
      `SELECT DISTINCT category FROM blog_posts WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC`
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
      `SELECT blog_posts.*, COALESCE(users.name, blog_posts.author_name) AS resolved_author_name
       FROM blog_posts
       LEFT JOIN users ON users.id = blog_posts.author_id
       WHERE blog_posts.status = 'published'
       ORDER BY COALESCE(blog_posts.published_at, blog_posts.updated_at) DESC${limitSql}`,
      params
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query(
      `SELECT blog_posts.*, COALESCE(users.name, blog_posts.author_name) AS resolved_author_name
       FROM blog_posts
       LEFT JOIN users ON users.id = blog_posts.author_id
       WHERE blog_posts.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findBySlug(slug) {
    const [rows] = await getPool().query(
      `SELECT blog_posts.*, COALESCE(users.name, blog_posts.author_name) AS resolved_author_name
       FROM blog_posts
       LEFT JOIN users ON users.id = blog_posts.author_id
       WHERE blog_posts.slug = ? LIMIT 1`,
      [slug]
    );
    return rows[0] || null;
  }

  static async slugExists(slug, excludeId = null) {
    const params = [slug];
    let sql = 'SELECT id FROM blog_posts WHERE slug = ?';
    if (excludeId) {
      sql += ' AND id <> ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';
    const [rows] = await getPool().query(sql, params);
    return rows.length > 0;
  }

  static async create(payload) {
    const columns = await this.getColumns();
    const fieldMap = {
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt || '',
      body: payload.body,
      content: payload.body,
      featured_image: payload.featuredImage,
      category: payload.category || 'Updates',
      meta_title: payload.metaTitle || null,
      meta_description: payload.metaDescription || null,
      status: payload.status,
      published_at: payload.publishedAt,
      author_id: payload.authorId,
      author_name: payload.authorName || 'SIM Communications',
      is_featured: payload.isFeatured ? 1 : 0
    };
    const insertColumns = Object.keys(fieldMap).filter((column) => columns.includes(column));
    const placeholders = insertColumns.map(() => '?').join(', ');
    const values = insertColumns.map((column) => fieldMap[column]);
    const [result] = await getPool().query(
      `INSERT INTO blog_posts (${insertColumns.join(', ')}) VALUES (${placeholders})`,
      values
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    const columns = await this.getColumns();
    const fieldMap = {
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt || '',
      body: payload.body,
      content: payload.body,
      featured_image: payload.featuredImage,
      category: payload.category || 'Updates',
      meta_title: payload.metaTitle || null,
      meta_description: payload.metaDescription || null,
      status: payload.status,
      published_at: payload.publishedAt,
      author_id: payload.authorId,
      author_name: payload.authorName || 'SIM Communications',
      is_featured: payload.isFeatured ? 1 : 0
    };
    const updateColumns = Object.keys(fieldMap).filter((column) => columns.includes(column));
    const assignments = updateColumns.map((column) => `${column} = ?`);
    const values = updateColumns.map((column) => fieldMap[column]);
    if (columns.includes('updated_at')) {
      assignments.push('updated_at = NOW()');
    }
    values.push(id);
    await getPool().query(
      `UPDATE blog_posts SET ${assignments.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM blog_posts WHERE id = ?', [id]);
  }
}

module.exports = BlogPost;
