const { getPool } = require('../config/database');

class EmailTemplate {
  static async findAll() {
    const [rows] = await getPool().query(
      'SELECT * FROM email_templates ORDER BY name ASC, template_key ASC'
    );
    return rows;
  }

  static async findForAdmin() {
    return this.findAll();
  }

  static async findById(id) {
    const [rows] = await getPool().query(
      'SELECT * FROM email_templates WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async findByKey(templateKey) {
    const [rows] = await getPool().query(
      'SELECT * FROM email_templates WHERE template_key = ? LIMIT 1',
      [templateKey]
    );
    return rows[0] || null;
  }

  static async upsert(payload) {
    await getPool().query(
      `INSERT INTO email_templates
       (template_key, name, subject, html_body, text_body, is_active)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         subject = VALUES(subject),
         html_body = VALUES(html_body),
         text_body = VALUES(text_body),
         is_active = VALUES(is_active),
         updated_at = CURRENT_TIMESTAMP`,
      [
        payload.templateKey,
        payload.name,
        payload.subject,
        payload.htmlBody,
        payload.textBody || null,
        payload.isActive ? 1 : 0
      ]
    );

    return this.findByKey(payload.templateKey);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE email_templates
       SET subject = ?, html_body = ?, text_body = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        payload.subject,
        payload.htmlBody,
        payload.textBody || null,
        payload.isActive ? 1 : 0,
        id
      ]
    );

    return this.findById(id);
  }
}

module.exports = EmailTemplate;
