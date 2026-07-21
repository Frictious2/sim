const { getPool } = require('../config/database');

class ProjectUpdate {
  static async findById(id) {
    const [rows] = await getPool().query(
      `SELECT project_updates.*, users.name AS created_by_name
       FROM project_updates
       LEFT JOIN users ON users.id = project_updates.created_by
       WHERE project_updates.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findForProject(projectId, { includeArchived = false, limit = 20 } = {}) {
    const [rows] = await getPool().query(
      `SELECT project_updates.*, users.name AS created_by_name
       FROM project_updates
       LEFT JOIN users ON users.id = project_updates.created_by
       WHERE project_updates.project_id = ? ${includeArchived ? '' : 'AND project_updates.is_archived = 0'}
       ORDER BY project_updates.created_at DESC, project_updates.id DESC
       LIMIT ?`,
      [projectId, limit]
    );
    return rows;
  }

  static async latestForProject(projectId) {
    const rows = await this.findForProject(projectId, { includeArchived: false, limit: 1 });
    return rows[0] || null;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO project_updates
       (project_id, title, update_text, image_url, visibility, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payload.projectId,
        payload.title,
        payload.updateText,
        payload.imageUrl || null,
        payload.visibility,
        payload.createdBy || null
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE project_updates
       SET title = ?, update_text = ?, image_url = ?, visibility = ?
       WHERE id = ?`,
      [payload.title, payload.updateText, payload.imageUrl || null, payload.visibility, id]
    );
    return this.findById(id);
  }

  static async archive(id) {
    await getPool().query('UPDATE project_updates SET is_archived = 1 WHERE id = ?', [id]);
    return this.findById(id);
  }
}

module.exports = ProjectUpdate;
