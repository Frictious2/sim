const { getPool } = require('../config/database');

class Media {
  static async findAll() {
    const [rows] = await getPool().query(
      `SELECT media_library.*, users.name AS uploaded_by_name
       FROM media_library
       LEFT JOIN users ON users.id = media_library.uploaded_by
       ORDER BY media_library.created_at DESC, media_library.id DESC`
    );
    return rows;
  }

  static async findForAdmin({ q = '', mimeType = '', usageType = '', page = 1, limit = 12 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      where.push('(media_library.title LIKE ? OR media_library.alt_text LIKE ? OR media_library.original_filename LIKE ? OR media_library.filename LIKE ?)');
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (mimeType) {
      where.push('media_library.mime_type = ?');
      params.push(mimeType);
    }

    if (usageType) {
      where.push('media_library.usage_type = ?');
      params.push(usageType);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(
      `SELECT COUNT(*) AS total FROM media_library ${whereSql}`,
      params
    );
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;
    const [rows] = await getPool().query(
      `SELECT media_library.*, users.name AS uploaded_by_name
       FROM media_library
       LEFT JOIN users ON users.id = media_library.uploaded_by
       ${whereSql}
       ORDER BY media_library.created_at DESC, media_library.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [mimeRows] = await getPool().query(
      `SELECT DISTINCT mime_type FROM media_library WHERE mime_type IS NOT NULL AND mime_type <> '' ORDER BY mime_type ASC`
    );
    const [usageRows] = await getPool().query(
      `SELECT DISTINCT usage_type FROM media_library WHERE usage_type IS NOT NULL AND usage_type <> '' ORDER BY usage_type ASC`
    );

    return {
      rows,
      total,
      mimeTypes: mimeRows.map((item) => item.mime_type),
      usageTypes: usageRows.map((item) => item.usage_type)
    };
  }

  static async findById(id) {
    const [rows] = await getPool().query(
      `SELECT media_library.*, users.name AS uploaded_by_name
       FROM media_library
       LEFT JOIN users ON users.id = media_library.uploaded_by
       WHERE media_library.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO media_library
       (title, alt_text, filename, original_filename, filepath, public_url, mime_type, file_size, uploaded_by, usage_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title,
        payload.altText,
        payload.filename,
        payload.originalFilename,
        payload.filepath,
        payload.publicUrl,
        payload.mimeType,
        payload.fileSize,
        payload.uploadedBy,
        payload.usageType
      ]
    );
    return this.findById(result.insertId);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM media_library WHERE id = ?', [id]);
  }
}

module.exports = Media;
