const { pool } = require('../config/database');

class Schedule {
  static async create(scheduleData) {
    const {
      schedule_type, department_id, week, year, description,
      created_by, source_department_id, owner_department_id,
      status = 'draft'
    } = scheduleData;
    
    const [result] = await pool.execute(
      `INSERT INTO SCHEDULE (schedule_type, department_id, week, year, description,
                             created_by, source_department_id, owner_department_id,
                             status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [schedule_type, department_id, week, year, description, created_by,
       source_department_id, owner_department_id, status]
    );
    
    return result.insertId;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT s.*, d.department_name, d.department_code,
             u.full_name as created_by_name,
             source_dep.department_name as source_department_name,
             owner_dep.department_name as owner_department_name
      FROM SCHEDULE s
      LEFT JOIN DEPARTMENT d ON s.department_id = d.department_id
      LEFT JOIN USER u ON s.created_by = u.user_id
      LEFT JOIN DEPARTMENT source_dep ON s.source_department_id = source_dep.department_id
      LEFT JOIN DEPARTMENT owner_dep ON s.owner_department_id = owner_dep.department_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.schedule_type) {
      query += ` AND s.schedule_type = ?`;
      params.push(filters.schedule_type);
    }
    
    if (filters.department_id) {
      query += ` AND s.department_id = ?`;
      params.push(filters.department_id);
    }
    
    if (filters.week) {
      query += ` AND s.week = ?`;
      params.push(filters.week);
    }
    
    if (filters.year) {
      query += ` AND s.year = ?`;
      params.push(filters.year);
    }
    
    if (filters.status) {
      query += ` AND s.status = ?`;
      params.push(filters.status);
    }
    
    if (filters.source_department_id) {
      query += ` AND s.source_department_id = ?`;
      params.push(filters.source_department_id);
    }
    
    query += ` ORDER BY s.year DESC, s.week DESC, s.created_at DESC`;
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT s.*, d.department_name, d.department_code,
              u.full_name as created_by_name,
              source_dep.department_name as source_department_name,
              owner_dep.department_name as owner_department_name
       FROM SCHEDULE s
       LEFT JOIN DEPARTMENT d ON s.department_id = d.department_id
       LEFT JOIN USER u ON s.created_by = u.user_id
       LEFT JOIN DEPARTMENT source_dep ON s.source_department_id = source_dep.department_id
       LEFT JOIN DEPARTMENT owner_dep ON s.owner_department_id = owner_dep.department_id
       WHERE s.schedule_id = ?`,
      [id]
    );
    return rows[0];
  }

  static async update(id, scheduleData) {
    const fields = [];
    const values = [];
    
    const allowedFields = ['description', 'status', 'week', 'year'];
    
    allowedFields.forEach(field => {
      if (scheduleData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(scheduleData[field]);
      }
    });
    
    fields.push('updated_at = NOW()');
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE SCHEDULE SET ${fields.join(', ')} WHERE schedule_id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE SCHEDULE SET status = ?, updated_at = NOW() WHERE schedule_id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Delete all shift assignments for this schedule
      await connection.execute(
        `DELETE FROM SHIFT_ASSIGNMENT 
         WHERE shift_id IN (SELECT shift_id FROM SHIFT WHERE schedule_id = ?)`,
        [id]
      );
      
      // Delete all shifts
      await connection.execute(
        'DELETE FROM SHIFT WHERE schedule_id = ?',
        [id]
      );
      
      // Delete schedule
      const [result] = await connection.execute(
        'DELETE FROM SCHEDULE WHERE schedule_id = ?',
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

  static async checkExists(schedule_type, department_id, week, year) {
    const [rows] = await pool.execute(
      `SELECT schedule_id FROM SCHEDULE 
       WHERE schedule_type = ? AND week = ? AND year = ?
       AND (department_id = ? OR source_department_id = ?)`,
      [schedule_type, week, year, department_id, department_id]
    );
    return rows[0];
  }
}

module.exports = Schedule;
