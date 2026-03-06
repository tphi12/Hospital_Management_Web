const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const {
      full_name, email, password, phone, username, employee_code,
      department_id, gender, date_of_birth
    } = userData;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO USER (full_name, email, password_hash, phone, username, 
                         employee_code, department_id, gender, date_of_birth, 
                         status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [full_name, email, hashedPassword, phone, username, employee_code,
        department_id, gender, date_of_birth]
    );

    return result.insertId;
  }

  static async findAll(search = '', departmentId = null, status = null) {
    let query = `
      SELECT u.*, d.department_name, d.department_code,
             GROUP_CONCAT(DISTINCT r.role_name SEPARATOR ', ') as roles,
             GROUP_CONCAT(DISTINCT r.role_id) as role_ids
      FROM USER u
      LEFT JOIN DEPARTMENT d ON u.department_id = d.department_id
      LEFT JOIN USER_ROLE ur ON u.user_id = ur.user_id
      LEFT JOIN ROLE r ON ur.role_id = r.role_id
      WHERE 1=1
    `;


    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.employee_code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (departmentId) {
      query += ` AND u.department_id = ?`;
      params.push(departmentId);
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY u.user_id ORDER BY u.created_at DESC`;

    const [rows] = await pool.execute(query, params);
    // console.log(rows);

    // Remove password_hash from results
    return rows.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT u.*, d.department_name, d.department_code,
              GROUP_CONCAT(DISTINCT r.role_name SEPARATOR ', ') as roles
       FROM USER u
       LEFT JOIN DEPARTMENT d ON u.department_id = d.department_id
       LEFT JOIN USER_ROLE ur ON u.user_id = ur.user_id
       LEFT JOIN ROLE r ON ur.role_id = r.role_id
       WHERE u.user_id = ?
       GROUP BY u.user_id`,
      [id]
    );

    if (rows[0]) {
      const { password_hash, ...userWithoutPassword } = rows[0];
      return userWithoutPassword;
    }

    return null;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM USER WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM USER WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  static async update(id, userData) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'full_name', 'email', 'phone', 'username', 'employee_code',
      'department_id', 'gender', 'date_of_birth', 'avatar_path'
    ];

    allowedFields.forEach(field => {
      if (userData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(userData[field]);
      }
    });

    if (userData.new_password) {
      const hashedPassword = await bcrypt.hash(userData.new_password, 10);
      fields.push('password_hash = ?');
      values.push(hashedPassword);
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await pool.execute(
      `UPDATE USER SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE USER SET status = ?, updated_at = NOW() WHERE user_id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async updateLastLogin(id) {
    await pool.execute(
      'UPDATE USER SET last_login_at = NOW() WHERE user_id = ?',
      [id]
    );
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM USER WHERE user_id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async checkPermission(userId, requiredRole, departmentId = null) {
    const query = `
      SELECT r.role_code, ur.scope_type, ur.department_id
      FROM USER_ROLE ur
      JOIN ROLE r ON ur.role_id = r.role_id
      WHERE ur.user_id = ?
    `;

    const [roles] = await pool.execute(query, [userId]);

    // Check if user has ADMIN role (full access)
    if (roles.some(role => role.role_code === 'ADMIN')) {
      return true;
    }

    // Check specific role
    if (requiredRole) {
      const hasRole = roles.some(role => {
        if (role.role_code !== requiredRole) return false;

        // If department check is required
        if (departmentId) {
          return role.scope_type === 'hospital' || role.department_id === departmentId;
        }

        return true;
      });

      return hasRole;
    }

    return false;
  }

  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'UPDATE USER SET password_hash = ?, updated_at = NOW() WHERE user_id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;
