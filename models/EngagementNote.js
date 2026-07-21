const { getPool } = require('../config/database');

const ENTITY_TYPES = ['sponsorship_interest', 'volunteer_application', 'prayer_request'];

class EngagementNote {
  static isSupportedEntityType(entityType) {
    return ENTITY_TYPES.includes(entityType);
  }

  static async create({ entityType, entityId, note, createdBy = null }) {
    if (!this.isSupportedEntityType(entityType)) {
      throw new Error(`Unsupported engagement note entity type: ${entityType}`);
    }

    const [result] = await getPool().query(
      `INSERT INTO engagement_notes
       (entity_type, entity_id, note, created_by)
       VALUES (?, ?, ?, ?)`,
      [entityType, entityId, note, createdBy]
    );

    const [rows] = await getPool().query(
      `SELECT engagement_notes.*, users.name AS created_by_name
       FROM engagement_notes
       LEFT JOIN users ON users.id = engagement_notes.created_by
       WHERE engagement_notes.id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return rows[0] || null;
  }

  static async findForEntity(entityType, entityId) {
    if (!this.isSupportedEntityType(entityType)) {
      return [];
    }

    const [rows] = await getPool().query(
      `SELECT engagement_notes.*, users.name AS created_by_name
       FROM engagement_notes
       LEFT JOIN users ON users.id = engagement_notes.created_by
       WHERE engagement_notes.entity_type = ? AND engagement_notes.entity_id = ?
       ORDER BY engagement_notes.created_at DESC, engagement_notes.id DESC`,
      [entityType, entityId]
    );

    return rows;
  }
}

module.exports = EngagementNote;
