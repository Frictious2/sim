const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');

class User {
  static async findForAdmin({ q = '', role = '', status = '', page = 1, limit = 10 } = {}) {
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const offset = (safePage - 1) * safeLimit;
    const where = [];
    const params = [];

    if (q) {
      where.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (role) {
      where.push('role = ?');
      params.push(role);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await getPool().query(
      `SELECT id, name, email, phone, role, status, last_login_at, created_at, updated_at
       FROM users
       ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [countRows] = await getPool().query(
      `SELECT COUNT(*) AS total FROM users ${whereSql}`,
      params
    );

    return {
      rows,
      total: countRows[0] ? Number(countRows[0].total) : 0
    };
  }

  static async findByEmail(email) {
    const [rows] = await getPool().query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [String(email).trim().toLowerCase()]
    );

    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await getPool().query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    return rows[0] || null;
  }

  static async findProfileById(id) {
    const [rows] = await getPool().query(
      `SELECT users.*,
              user_profiles.address,
              user_profiles.city,
              user_profiles.country,
              user_profiles.organization_name,
              user_profiles.preferred_contact_method
       FROM users
       LEFT JOIN user_profiles ON user_profiles.user_id = users.id
       WHERE users.id = ?
       LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  static async emailExists(email) {
    return Boolean(await this.findByEmail(email));
  }

  static async createUser({ name, email, phone = null, password, role = 'user', status = 'active' }) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const normalizedEmail = String(email).trim().toLowerCase();
      const passwordHash = await bcrypt.hash(password, 12);
      const [result] = await connection.query(
        `INSERT INTO users (name, email, phone, password_hash, role, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name.trim(), normalizedEmail, phone ? phone.trim() : null, passwordHash, role, status]
      );

      await connection.query(
        `INSERT INTO user_profiles (user_id, preferred_contact_method)
         VALUES (?, ?)`,
        [result.insertId, 'email']
      );

      await connection.commit();
      return this.findById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateLastLogin(userId) {
    await getPool().query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [userId]
    );
  }

  static async updateProfile(userId, payload) {
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE users
         SET name = ?, phone = ?, updated_at = NOW()
         WHERE id = ?`,
        [payload.name.trim(), payload.phone || null, userId]
      );

      await connection.query(
        `INSERT INTO user_profiles (user_id, address, city, country, organization_name, preferred_contact_method, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           address = VALUES(address),
           city = VALUES(city),
           country = VALUES(country),
           organization_name = VALUES(organization_name),
           preferred_contact_method = VALUES(preferred_contact_method),
           updated_at = NOW()`,
        [
          userId,
          payload.address || null,
          payload.city || null,
          payload.country || null,
          payload.organizationName || null,
          payload.preferredContactMethod || null
        ]
      );

      await connection.commit();
      return this.findProfileById(userId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updatePassword(userId, plainPassword) {
    const passwordHash = await bcrypt.hash(plainPassword, 12);
    await getPool().query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId]
    );
    return this.findById(userId);
  }

  static async verifyPassword(user, plainPassword) {
    if (!user || !user.password_hash) {
      return false;
    }

    return bcrypt.compare(plainPassword, user.password_hash);
  }

  static async countAdmins() {
    const [rows] = await getPool().query(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'admin'"
    );

    return rows[0] ? Number(rows[0].total) : 0;
  }

  static async findFirstAdmin() {
    const [rows] = await getPool().query(
      "SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"
    );

    return rows[0] || null;
  }
}

module.exports = User;
