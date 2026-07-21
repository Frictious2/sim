const { getPool } = require('../config/database');

class MissionWorkerUpdate {
  static async findById(id) {
    const [rows] = await getPool().query(
      `SELECT mission_worker_updates.*, users.name AS created_by_name
       FROM mission_worker_updates
       LEFT JOIN users ON users.id = mission_worker_updates.created_by
       WHERE mission_worker_updates.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findForWorker(missionWorkerId, { includeArchived = false, limit = 20 } = {}) {
    const [rows] = await getPool().query(
      `SELECT mission_worker_updates.*, users.name AS created_by_name
       FROM mission_worker_updates
       LEFT JOIN users ON users.id = mission_worker_updates.created_by
       WHERE mission_worker_updates.mission_worker_id = ? ${includeArchived ? '' : 'AND mission_worker_updates.is_archived = 0'}
       ORDER BY mission_worker_updates.created_at DESC, mission_worker_updates.id DESC
       LIMIT ?`,
      [missionWorkerId, limit]
    );
    return rows;
  }

  static async latestForWorker(missionWorkerId) {
    const rows = await this.findForWorker(missionWorkerId, { includeArchived: false, limit: 1 });
    return rows[0] || null;
  }

  static async create(payload) {
    const [result] = await getPool().query(
      `INSERT INTO mission_worker_updates
       (mission_worker_id, title, update_text, image_url, visibility, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payload.missionWorkerId,
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
      `UPDATE mission_worker_updates
       SET title = ?, update_text = ?, image_url = ?, visibility = ?
       WHERE id = ?`,
      [payload.title, payload.updateText, payload.imageUrl || null, payload.visibility, id]
    );
    return this.findById(id);
  }

  static async archive(id) {
    await getPool().query('UPDATE mission_worker_updates SET is_archived = 1 WHERE id = ?', [id]);
    return this.findById(id);
  }
}

module.exports = MissionWorkerUpdate;
