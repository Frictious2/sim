const { getPool } = require('../config/database');

class HomepageSection {
  static async findAll() {
    const [rows] = await getPool().query('SELECT * FROM homepage_sections ORDER BY sort_order ASC, id ASC');
    return rows;
  }

  static async findPublished() {
    const [rows] = await getPool().query('SELECT * FROM homepage_sections WHERE is_active = 1 ORDER BY sort_order ASC, id ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM homepage_sections WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findBySlug(sectionKey) {
    return this.findBySectionKey(sectionKey);
  }

  static async findBySectionKey(sectionKey) {
    const [rows] = await getPool().query('SELECT * FROM homepage_sections WHERE section_key = ? LIMIT 1', [sectionKey]);
    return rows[0] || null;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO homepage_sections
       (section_key, title, subtitle, content, button_label, button_url, image_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [payload.sectionKey, payload.title, payload.subtitle, payload.content, payload.buttonLabel, payload.buttonUrl, payload.imageUrl, payload.sortOrder, payload.isActive]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE homepage_sections
       SET section_key = ?, title = ?, subtitle = ?, content = ?, button_label = ?, button_url = ?, image_url = ?, sort_order = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [payload.sectionKey, payload.title, payload.subtitle, payload.content, payload.buttonLabel, payload.buttonUrl, payload.imageUrl, payload.sortOrder, payload.isActive, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM homepage_sections WHERE id = ?', [id]);
  }
}

module.exports = HomepageSection;
