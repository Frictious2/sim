const { getPool } = require('../config/database');

class SponsorshipAssignment {
  static baseSelect() {
    return `SELECT sponsorship_assignments.*,
              sponsor.name AS sponsor_name,
              sponsor.email AS sponsor_email,
              assigner.name AS assigned_by_name,
              children_profiles.child_code,
              children_profiles.first_name AS child_first_name,
              children_profiles.last_name AS child_last_name,
              children_profiles.community AS child_community,
              children_profiles.profile_image_url AS child_image_url,
              sponsorship_projects.title AS project_title,
              sponsorship_projects.category AS project_category,
              sponsorship_projects.image_url AS project_image_url,
              mission_workers.worker_code,
              mission_workers.first_name AS worker_first_name,
              mission_workers.last_name AS worker_last_name,
              mission_workers.location AS worker_location,
              mission_workers.profile_image_url AS worker_image_url
       FROM sponsorship_assignments
       LEFT JOIN users AS sponsor ON sponsor.id = sponsorship_assignments.sponsor_user_id
       LEFT JOIN users AS assigner ON assigner.id = sponsorship_assignments.assigned_by
       LEFT JOIN children_profiles ON children_profiles.id = sponsorship_assignments.child_id
       LEFT JOIN sponsorship_projects ON sponsorship_projects.id = sponsorship_assignments.project_id
       LEFT JOIN mission_workers ON mission_workers.id = sponsorship_assignments.mission_worker_id`;
  }

  static async findById(id) {
    const [rows] = await getPool().query(
      `${this.baseSelect()} WHERE sponsorship_assignments.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async findForAdmin({ q = '', status = '', assignmentType = '', sponsorUserId = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push(`(
        sponsor.name LIKE ? OR sponsor.email LIKE ? OR
        children_profiles.first_name LIKE ? OR children_profiles.last_name LIKE ? OR
        sponsorship_projects.title LIKE ? OR
        mission_workers.first_name LIKE ? OR mission_workers.last_name LIKE ?
      )`);
      params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('sponsorship_assignments.status = ?');
      params.push(status);
    }

    if (assignmentType) {
      where.push('sponsorship_assignments.assignment_type = ?');
      params.push(assignmentType);
    }

    if (sponsorUserId) {
      where.push('sponsorship_assignments.sponsor_user_id = ?');
      params.push(sponsorUserId);
    }

    const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(
      `SELECT COUNT(*) AS total
       FROM sponsorship_assignments
       LEFT JOIN users AS sponsor ON sponsor.id = sponsorship_assignments.sponsor_user_id
       LEFT JOIN children_profiles ON children_profiles.id = sponsorship_assignments.child_id
       LEFT JOIN sponsorship_projects ON sponsorship_projects.id = sponsorship_assignments.project_id
       LEFT JOIN mission_workers ON mission_workers.id = sponsorship_assignments.mission_worker_id
       ${whereSql}`,
      params
    );
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `${this.baseSelect()}${whereSql}
       ORDER BY sponsorship_assignments.assigned_at DESC, sponsorship_assignments.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total };
  }

  static async findForUser(userId) {
    const [rows] = await getPool().query(
      `${this.baseSelect()}
       WHERE sponsorship_assignments.sponsor_user_id = ?
       ORDER BY sponsorship_assignments.assigned_at DESC, sponsorship_assignments.id DESC`,
      [userId]
    );
    return rows;
  }

  static async findOwnedById(id, userId) {
    const [rows] = await getPool().query(
      `${this.baseSelect()}
       WHERE sponsorship_assignments.id = ? AND sponsorship_assignments.sponsor_user_id = ?
       LIMIT 1`,
      [id, userId]
    );
    return rows[0] || null;
  }

  static async create(payload) {
    const targets = [payload.childId, payload.projectId, payload.missionWorkerId].filter(Boolean);
    if (targets.length !== 1) {
      throw new Error('Exactly one sponsorship target must be selected.');
    }

    const [result] = await getPool().query(
      `INSERT INTO sponsorship_assignments
       (sponsor_user_id, sponsorship_interest_id, assignment_type, child_id, project_id, mission_worker_id, assigned_by, assigned_at, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.sponsorUserId || null,
        payload.sponsorshipInterestId || null,
        payload.assignmentType,
        payload.childId || null,
        payload.projectId || null,
        payload.missionWorkerId || null,
        payload.assignedBy || null,
        payload.assignedAt || new Date(),
        payload.status || 'active',
        payload.notes || null
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    const targets = [payload.childId, payload.projectId, payload.missionWorkerId].filter(Boolean);
    if (targets.length !== 1) {
      throw new Error('Exactly one sponsorship target must be selected.');
    }

    await getPool().query(
      `UPDATE sponsorship_assignments
       SET sponsor_user_id = ?, sponsorship_interest_id = ?, assignment_type = ?, child_id = ?, project_id = ?, mission_worker_id = ?, status = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.sponsorUserId || null,
        payload.sponsorshipInterestId || null,
        payload.assignmentType,
        payload.childId || null,
        payload.projectId || null,
        payload.missionWorkerId || null,
        payload.status,
        payload.notes || null,
        id
      ]
    );
    return this.findById(id);
  }

  static async updateStatus(id, { status, notes = null }) {
    await getPool().query(
      `UPDATE sponsorship_assignments
       SET status = ?, notes = COALESCE(?, notes), updated_at = NOW()
       WHERE id = ?`,
      [status, notes, id]
    );
    return this.findById(id);
  }
}

module.exports = SponsorshipAssignment;
