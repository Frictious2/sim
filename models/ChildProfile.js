const { getPool } = require('../config/database');

class ChildProfile {
  static async findById(id) {
    const [rows] = await getPool().query(
      'SELECT * FROM children_profiles WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async findForAdmin({ q = '', status = '', community = '', page = 1, limit = 10 } = {}) {
    const where = [];
    const params = [];

    if (q) {
      const pattern = `%${q}%`;
      where.push('(child_code LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR community LIKE ? OR district LIKE ?)');
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (community) {
      where.push('community = ?');
      params.push(community);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [countRows] = await getPool().query(
      `SELECT COUNT(*) AS total FROM children_profiles ${whereSql}`,
      params
    );
    const total = countRows[0] ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await getPool().query(
      `SELECT * FROM children_profiles ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [communityRows] = await getPool().query(
      `SELECT DISTINCT community FROM children_profiles WHERE community IS NOT NULL AND community <> '' ORDER BY community ASC`
    );

    return {
      rows,
      total,
      communities: communityRows.map((item) => item.community)
    };
  }

  static async findAvailable(limit = 12) {
    const [rows] = await getPool().query(
      `SELECT id, child_code, first_name, last_name, age, community, district, biography, profile_image_url, status
       FROM children_profiles
       WHERE status = 'available'
       ORDER BY created_at ASC, id ASC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  static async nextChildCode() {
    const prefix = 'SIM-CH-';
    const [rows] = await getPool().query(
      `SELECT child_code
       FROM children_profiles
       WHERE child_code LIKE ?
       ORDER BY child_code DESC
       LIMIT 1`,
      [`${prefix}%`]
    );
    const lastCode = rows[0] ? String(rows[0].child_code || '') : '';
    const lastNumber = lastCode ? Number(lastCode.slice(prefix.length)) || 0 : 0;
    return `${prefix}${String(lastNumber + 1).padStart(6, '0')}`;
  }

  static async create(payload) {
    const childCode = payload.childCode || await this.nextChildCode();
    const [result] = await getPool().query(
      `INSERT INTO children_profiles
       (child_code, first_name, last_name, gender, date_of_birth, age, community, district, school_name, class_level, guardian_name, guardian_contact, biography, profile_image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        childCode,
        payload.firstName,
        payload.lastName || null,
        payload.gender,
        payload.dateOfBirth || null,
        payload.age || null,
        payload.community,
        payload.district || null,
        payload.schoolName || null,
        payload.classLevel || null,
        payload.guardianName || null,
        payload.guardianContact || null,
        payload.biography || null,
        payload.profileImageUrl || null,
        payload.status || 'available'
      ]
    );
    return this.findById(result.insertId);
  }

  static async update(id, payload) {
    await getPool().query(
      `UPDATE children_profiles
       SET first_name = ?, last_name = ?, gender = ?, date_of_birth = ?, age = ?, community = ?, district = ?, school_name = ?, class_level = ?, guardian_name = ?, guardian_contact = ?, biography = ?, profile_image_url = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.firstName,
        payload.lastName || null,
        payload.gender,
        payload.dateOfBirth || null,
        payload.age || null,
        payload.community,
        payload.district || null,
        payload.schoolName || null,
        payload.classLevel || null,
        payload.guardianName || null,
        payload.guardianContact || null,
        payload.biography || null,
        payload.profileImageUrl || null,
        payload.status,
        id
      ]
    );
    return this.findById(id);
  }

  static async updateStatus(id, status) {
    await getPool().query(
      'UPDATE children_profiles SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }
}

module.exports = ChildProfile;
