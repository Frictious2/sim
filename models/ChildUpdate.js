const { getPool } = require('../config/database');

class ChildUpdate {
  static async findById(id) {
    const [rows] = await getPool().query(
      `SELECT child_updates.*, users.name AS created_by_name
       FROM child_updates
       LEFT JOIN users ON users.id = child_updates.created_by
       WHERE child_updates.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findForChild(childId, { includeArchived = false, limit = 20 } = {}) {
    const [rows] = await getPool().query(
      `SELECT child_updates.*, users.name AS created_by_name
       FROM child_updates
       LEFT JOIN users ON users.id = child_updates.created_by
       WHERE child_updates.child_id = ? ${includeArchived ? '' : 'AND child_updates.is_archived = 0'}
       ORDER BY child_updates.created_at DESC, child_updates.id DESC
       LIMIT ?`,
      [childId, limit]
    );
    return rows;
  }

  static async latestForChild(childId) {
    const rows = await this.findForChild(childId, { includeArchived: false, limit: 1 });
    return rows[0] || null;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO child_updates
       (child_id, title, update_text, image_url, update_type, visibility, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.childId,
        payload.title,
        payload.updateText,
        payload.imageUrl || null,
        payload.updateType,
        payload.visibility,
        payload.createdBy || null
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE child_updates
       SET title = ?, update_text = ?, image_url = ?, update_type = ?, visibility = ?
       WHERE id = ?`,
      [payload.title, payload.updateText, payload.imageUrl || null, payload.updateType, payload.visibility, id]
    );
    return this.findById(id);
  }

  static async archive(id) {
    await getPool().query(
      'UPDATE child_updates SET is_archived = 1 WHERE id = ?',
      [id]
    );
    return this.findById(id);
  }
}

module.exports = ChildUpdate;
