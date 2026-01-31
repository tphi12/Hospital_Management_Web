const { pool } = require('../config/database');

class Shift {
  static async create(shiftData) {
    const {
      schedule_id, department_id, shift_date, shift_type,
      note, start_time, end_time, max_staff
    } = shiftData;
    
    const [result] = await pool.execute(
      `INSERT INTO SHIFT (schedule_id, department_id, shift_date, shift_type,
                          note, start_time, end_time, max_staff)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [schedule_id, department_id, shift_date, shift_type, note,
       start_time, end_time, max_staff]
    );
    
    return result.insertId;
  }

  static async findBySchedule(scheduleId) {
    const [rows] = await pool.execute(
      `SELECT sh.*, d.department_name, d.department_code,
              COUNT(sa.shift_assignment_id) as assigned_count
       FROM SHIFT sh
       LEFT JOIN DEPARTMENT d ON sh.department_id = d.department_id
       LEFT JOIN SHIFT_ASSIGNMENT sa ON sh.shift_id = sa.shift_id AND sa.status = 'assigned'
       WHERE sh.schedule_id = ?
       GROUP BY sh.shift_id
       ORDER BY sh.shift_date, sh.shift_type`,
      [scheduleId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT sh.*, d.department_name, d.department_code,
              COUNT(sa.shift_assignment_id) as assigned_count
       FROM SHIFT sh
       LEFT JOIN DEPARTMENT d ON sh.department_id = d.department_id
       LEFT JOIN SHIFT_ASSIGNMENT sa ON sh.shift_id = sa.shift_id AND sa.status = 'assigned'
       WHERE sh.shift_id = ?
       GROUP BY sh.shift_id`,
      [id]
    );
    return rows[0];
  }

  static async update(id, shiftData) {
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'shift_date', 'shift_type', 'note', 'start_time', 'end_time', 'max_staff'
    ];
    
    allowedFields.forEach(field => {
      if (shiftData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(shiftData[field]);
      }
    });
    
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE SHIFT SET ${fields.join(', ')} WHERE shift_id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Delete all assignments
      await connection.execute(
        'DELETE FROM SHIFT_ASSIGNMENT WHERE shift_id = ?',
        [id]
      );
      
      // Delete shift
      const [result] = await connection.execute(
        'DELETE FROM SHIFT WHERE shift_id = ?',
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

  static async getAssignments(shiftId) {
    const [rows] = await pool.execute(
      `SELECT sa.*, u.full_name, u.username, u.employee_code, u.phone
       FROM SHIFT_ASSIGNMENT sa
       JOIN USER u ON sa.user_id = u.user_id
       WHERE sa.shift_id = ?
       ORDER BY sa.assigned_at`,
      [shiftId]
    );
    return rows;
  }

  static async assignStaff(shiftId, userId, note = null) {
    const [result] = await pool.execute(
      `INSERT INTO SHIFT_ASSIGNMENT (shift_id, user_id, assigned_at, status, note)
       VALUES (?, ?, NOW(), 'assigned', ?)`,
      [shiftId, userId, note]
    );
    return result.insertId;
  }

  static async removeAssignment(assignmentId) {
    const [result] = await pool.execute(
      'DELETE FROM SHIFT_ASSIGNMENT WHERE shift_assignment_id = ?',
      [assignmentId]
    );
    return result.affectedRows > 0;
  }

  static async updateAssignmentStatus(assignmentId, status, note = null) {
    const [result] = await pool.execute(
      'UPDATE SHIFT_ASSIGNMENT SET status = ?, note = ? WHERE shift_assignment_id = ?',
      [status, note, assignmentId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Shift;
