const { getPool } = require('../config/database');

class PageSection {
  static async findByPageSlug(pageSlug, { activeOnly = false } = {}) {
    const params = [pageSlug];
    let sql = 'SELECT * FROM page_sections WHERE page_slug = ?';
    if (activeOnly) {
      sql += ' AND is_active = 1';
    }
    sql += ' ORDER BY sort_order ASC, id ASC';
    const [rows] = await getPool().query(sql, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await getPool().query('SELECT * FROM page_sections WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  static async findByPageAndKey(pageSlug, sectionKey) {
    const [rows] = await getPool().query('SELECT * FROM page_sections WHERE page_slug = ? AND section_key = ? LIMIT 1', [pageSlug, sectionKey]);
    return rows[0] || null;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO page_sections
       (page_slug, section_key, eyebrow, title, subtitle, body, image_url, image_alt, button_label, button_url, secondary_button_label, secondary_button_url, layout, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.pageSlug,
        payload.sectionKey,
        payload.eyebrow,
        payload.title,
        payload.subtitle,
        payload.body,
        payload.imageUrl,
        payload.imageAlt,
        payload.buttonLabel,
        payload.buttonUrl,
        payload.secondaryButtonLabel,
        payload.secondaryButtonUrl,
        payload.layout,
        payload.sortOrder,
        payload.isActive
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE page_sections
       SET section_key = ?, eyebrow = ?, title = ?, subtitle = ?, body = ?, image_url = ?, image_alt = ?, button_label = ?, button_url = ?,
           secondary_button_label = ?, secondary_button_url = ?, layout = ?, sort_order = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.sectionKey,
        payload.eyebrow,
        payload.title,
        payload.subtitle,
        payload.body,
        payload.imageUrl,
        payload.imageAlt,
        payload.buttonLabel,
        payload.buttonUrl,
        payload.secondaryButtonLabel,
        payload.secondaryButtonUrl,
        payload.layout,
        payload.sortOrder,
        payload.isActive,
        id
      ]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await getPool().query('DELETE FROM page_sections WHERE id = ?', [id]);
  }

  static async updatePageSlug(oldSlug, newSlug) {
    await getPool().query('UPDATE page_sections SET page_slug = ?, updated_at = NOW() WHERE page_slug = ?', [newSlug, oldSlug]);
  }
}

module.exports = PageSection;
