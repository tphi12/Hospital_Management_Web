const { pool } = require('../config/database');

class Department {
  static async create(departmentData) {
    const { department_code, department_name, department_type, description } = departmentData;
    
    const [result] = await pool.execute(
      `INSERT INTO DEPARTMENT (department_code, department_name, department_type, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [department_code, department_name, department_type, description]
    );
    
    return result.insertId;
  }

  static async findAll(search = '') {
    let query = `
      SELECT d.*,
             COUNT(DISTINCT u.user_id) as member_count,
             COUNT(DISTINCT doc.document_id) as document_count,
             MAX(manager.full_name) as manager_name,
             MAX(manager.user_id) as head_id,
             MAX(manager.email) as manager_email
      FROM DEPARTMENT d
      LEFT JOIN USER u ON d.department_id = u.department_id AND u.status = 'active'
      LEFT JOIN DOCUMENT doc ON d.department_id = doc.department_id AND doc.deleted_at IS NULL
      LEFT JOIN USER_ROLE ur ON d.department_id = ur.department_id 
        AND ur.scope_type = 'department' 
        AND ur.role_id = (SELECT role_id FROM ROLE WHERE role_code = 'MANAGER')
      LEFT JOIN USER manager ON ur.user_id = manager.user_id
    `;
    
    const params = [];
    
    if (search) {
      query += ` WHERE d.department_name LIKE ? OR d.department_code LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` GROUP BY d.department_id ORDER BY d.created_at DESC`;
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT d.*,
              COUNT(DISTINCT u.user_id) as member_count,
              COUNT(DISTINCT doc.document_id) as document_count,
              MAX(manager.full_name) as manager_name,
              MAX(manager.user_id) as head_id,
              MAX(manager.email) as manager_email
       FROM DEPARTMENT d
       LEFT JOIN USER u ON d.department_id = u.department_id AND u.status = 'active'
       LEFT JOIN DOCUMENT doc ON d.department_id = doc.department_id AND doc.deleted_at IS NULL
       LEFT JOIN USER_ROLE ur ON d.department_id = ur.department_id 
         AND ur.scope_type = 'department' 
         AND ur.role_id = (SELECT role_id FROM ROLE WHERE role_code = 'MANAGER')
       LEFT JOIN USER manager ON ur.user_id = manager.user_id
       WHERE d.department_id = ?
       GROUP BY d.department_id`,
      [id]
    );
    
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await pool.execute(
      'SELECT * FROM DEPARTMENT WHERE department_code = ?',
      [code]
    );
    return rows[0];
  }

  static async update(id, departmentData) {
    const { department_code, department_name, department_type, description } = departmentData;
    
    const [result] = await pool.execute(
      `UPDATE DEPARTMENT 
       SET department_code = ?, department_name = ?, department_type = ?, 
           description = ?, updated_at = NOW()
       WHERE department_id = ?`,
      [department_code, department_name, department_type, description, id]
    );
    
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update users to remove department reference
      await connection.execute(
        'UPDATE USER SET department_id = NULL WHERE department_id = ?',
        [id]
      );
      
      // Update documents to remove department reference
      await connection.execute(
        'UPDATE DOCUMENT SET department_id = NULL WHERE department_id = ?',
        [id]
      );
      
      // Delete department
      const [result] = await connection.execute(
        'DELETE FROM DEPARTMENT WHERE department_id = ?',
        [id]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getMembers(departmentId) {
    const [rows] = await pool.execute(
      `SELECT u.user_id, u.full_name, u.username, u.email, u.phone, 
              u.employee_code, u.status, r.role_name
       FROM USER u
       LEFT JOIN USER_ROLE ur ON u.user_id = ur.user_id
       LEFT JOIN ROLE r ON ur.role_id = r.role_id
       WHERE u.department_id = ? AND u.status = 'active'
       ORDER BY u.full_name`,
      [departmentId]
    );
    
    return rows;
  }
  static async setManager(departmentId, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get MANAGER role_id
      const [roleRows] = await connection.execute(
        "SELECT role_id FROM ROLE WHERE role_code = 'MANAGER'"
      );
      
      if (roleRows.length > 0) {
        const roleId = roleRows[0].role_id;
        
        // Remove existing manager for this department
        await connection.execute(
          "DELETE FROM USER_ROLE WHERE scope_type = 'department' AND department_id = ? AND role_id = ?",
          [departmentId, roleId]
        );
        
        // Insert new manager if userId is provided
        if (userId) {
          await connection.execute(
            `INSERT INTO USER_ROLE (user_id, role_id, scope_type, department_id, created_at)
             VALUES (?, ?, 'department', ?, NOW())`,
            [userId, roleId, departmentId]
          );
          
          // Also update the user's department_id in the USER table if needed
          await connection.execute(
            'UPDATE USER SET department_id = ? WHERE user_id = ?',
            [departmentId, userId]
          );
        }
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Department;
