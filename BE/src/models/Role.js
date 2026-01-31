const { pool } = require('../config/database');

class Role {
  static async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM ROLE ORDER BY role_name'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM ROLE WHERE role_id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await pool.execute(
      'SELECT * FROM ROLE WHERE role_code = ?',
      [code]
    );
    return rows[0];
  }

  static async getUserRoles(userId) {
    const [rows] = await pool.execute(
      `SELECT r.*, ur.scope_type, ur.department_id, d.department_name
       FROM USER_ROLE ur
       JOIN ROLE r ON ur.role_id = r.role_id
       LEFT JOIN DEPARTMENT d ON ur.department_id = d.department_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return rows;
  }

  static async assignRoleToUser(userId, roleId, scopeType, departmentId = null) {
    const [result] = await pool.execute(
      `INSERT INTO USER_ROLE (user_id, role_id, scope_type, department_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, roleId, scopeType, departmentId]
    );
    return result.insertId;
  }

  static async removeUserRole(userRoleId) {
    const [result] = await pool.execute(
      'DELETE FROM USER_ROLE WHERE user_role_id = ?',
      [userRoleId]
    );
    return result.affectedRows > 0;
  }

  static async removeAllUserRoles(userId) {
    const [result] = await pool.execute(
      'DELETE FROM USER_ROLE WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Role;
