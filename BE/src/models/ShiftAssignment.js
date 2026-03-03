const { pool } = require('../config/database');

/**
 * ShiftAssignment Model
 * Manages assignments of users to specific shifts
 */
class ShiftAssignment {
  /**
   * Create a new shift assignment
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise<number>} - The ID of the created assignment
   */
  static async create(assignmentData) {
    const {
      shift_id,
      user_id,
      status = 'assigned',
      note
    } = assignmentData;

    const params = [shift_id, user_id, status, note].map((value) =>
      value === undefined ? null : value
    );
    
    const [result] = await pool.execute(
      `INSERT INTO SHIFT_ASSIGNMENT (shift_id, user_id, status, assigned_at, note)
       VALUES (?, ?, ?, NOW(), ?)`,
      params
    );
    
    return result.insertId;
  }

  /**
   * Find assignment by ID
   * @param {number} id - Assignment ID
   * @returns {Promise<Object|undefined>} - Assignment details with user and shift info
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT sa.*, 
              u.full_name, u.username, u.employee_code, u.phone, u.email,
              sh.shift_date, sh.shift_type, sh.start_time, sh.end_time,
              d.department_name, d.department_code
       FROM SHIFT_ASSIGNMENT sa
       JOIN USER u ON sa.user_id = u.user_id
       JOIN SHIFT sh ON sa.shift_id = sh.shift_id
       LEFT JOIN DEPARTMENT d ON sh.department_id = d.department_id
       WHERE sa.shift_assignment_id = ?`,
      [id]
    );
    return rows[0];
  }

  /**
   * Get all assignments for a specific shift
   * @param {number} shiftId - Shift ID
   * @returns {Promise<Array>} - List of assignments
   */
  static async findByShift(shiftId) {
    const [rows] = await pool.execute(
      `SELECT sa.*, 
              u.full_name, u.username, u.employee_code, u.phone, u.email
       FROM SHIFT_ASSIGNMENT sa
       JOIN USER u ON sa.user_id = u.user_id
       WHERE sa.shift_id = ?
       ORDER BY sa.assigned_at`,
      [shiftId]
    );
    return rows;
  }

  /**
   * Get all assignments for a specific user
   * @param {number} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - List of assignments
   */
  static async findByUser(userId, filters = {}) {
    let query = `
      SELECT sa.*, 
             sh.shift_date, sh.shift_type, sh.start_time, sh.end_time,
             d.department_name, d.department_code,
             sc.schedule_type, sc.week, sc.year
      FROM SHIFT_ASSIGNMENT sa
      JOIN SHIFT sh ON sa.shift_id = sh.shift_id
      JOIN SCHEDULE sc ON sh.schedule_id = sc.schedule_id
      LEFT JOIN DEPARTMENT d ON sh.department_id = d.department_id
      WHERE sa.user_id = ?
    `;
    
    const params = [userId];
    
    if (filters.status) {
      query += ` AND sa.status = ?`;
      params.push(filters.status);
    }
    
    if (filters.from_date) {
      query += ` AND sh.shift_date >= ?`;
      params.push(filters.from_date);
    }
    
    if (filters.to_date) {
      query += ` AND sh.shift_date <= ?`;
      params.push(filters.to_date);
    }
    
    query += ` ORDER BY sh.shift_date DESC, sh.shift_type`;
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  /**
   * Get all assignments for a schedule
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<Array>} - List of assignments
   */
  static async findBySchedule(scheduleId) {
    const [rows] = await pool.execute(
      `SELECT sa.*, 
              u.full_name, u.username, u.employee_code,
              sh.shift_date, sh.shift_type, sh.start_time, sh.end_time
       FROM SHIFT_ASSIGNMENT sa
       JOIN USER u ON sa.user_id = u.user_id
       JOIN SHIFT sh ON sa.shift_id = sh.shift_id
       WHERE sh.schedule_id = ?
       ORDER BY sh.shift_date, sh.shift_type, sa.assigned_at`,
      [scheduleId]
    );
    return rows;
  }

  /**
   * Update assignment status
   * @param {number} id - Assignment ID
   * @param {string} status - New status (assigned | swapped | canceled)
   * @param {string} note - Optional note
   * @returns {Promise<boolean>} - Success status
   */
  static async updateStatus(id, status, note = null) {
    const fields = ['status = ?'];
    const values = [status];
    
    if (note !== null) {
      fields.push('note = ?');
      values.push(note);
    }
    
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE SHIFT_ASSIGNMENT SET ${fields.join(', ')} 
       WHERE shift_assignment_id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  /**
   * Update assignment note
   * @param {number} id - Assignment ID
   * @param {string} note - Note
   * @returns {Promise<boolean>} - Success status
   */
  static async updateNote(id, note) {
    const [result] = await pool.execute(
      'UPDATE SHIFT_ASSIGNMENT SET note = ? WHERE shift_assignment_id = ?',
      [note, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Delete an assignment
   * @param {number} id - Assignment ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM SHIFT_ASSIGNMENT WHERE shift_assignment_id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Delete all assignments for a shift
   * @param {number} shiftId - Shift ID
   * @returns {Promise<number>} - Number of deleted assignments
   */
  static async deleteByShift(shiftId) {
    const [result] = await pool.execute(
      'DELETE FROM SHIFT_ASSIGNMENT WHERE shift_id = ?',
      [shiftId]
    );
    return result.affectedRows;
  }

  /**
   * Check if user is already assigned to a shift
   * @param {number} shiftId - Shift ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|undefined>} - Existing assignment if found
   */
  static async checkExistingAssignment(shiftId, userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM SHIFT_ASSIGNMENT 
       WHERE shift_id = ? AND user_id = ? AND status != 'canceled'`,
      [shiftId, userId]
    );
    return rows[0];
  }

  /**
   * Get assignment count for a shift (excluding canceled)
   * @param {number} shiftId - Shift ID
   * @returns {Promise<number>} - Number of active assignments
   */
  static async getAssignmentCount(shiftId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM SHIFT_ASSIGNMENT 
       WHERE shift_id = ? AND status != 'canceled'`,
      [shiftId]
    );
    return rows[0].count;
  }

  /**
   * Swap assignment between two users
   * @param {number} assignment1Id - First assignment ID
   * @param {number} assignment2Id - Second assignment ID
   * @returns {Promise<boolean>} - Success status
   */
  static async swap(assignment1Id, assignment2Id) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get both assignments
      const [assignment1] = await connection.execute(
        'SELECT * FROM SHIFT_ASSIGNMENT WHERE shift_assignment_id = ?',
        [assignment1Id]
      );
      const [assignment2] = await connection.execute(
        'SELECT * FROM SHIFT_ASSIGNMENT WHERE shift_assignment_id = ?',
        [assignment2Id]
      );
      
      if (!assignment1[0] || !assignment2[0]) {
        throw new Error('One or both assignments not found');
      }
      
      // Swap user_ids
      await connection.execute(
        'UPDATE SHIFT_ASSIGNMENT SET user_id = ?, status = ?, note = ? WHERE shift_assignment_id = ?',
        [assignment2[0].user_id, 'swapped', 'Swapped shift', assignment1Id]
      );
      
      await connection.execute(
        'UPDATE SHIFT_ASSIGNMENT SET user_id = ?, status = ?, note = ? WHERE shift_assignment_id = ?',
        [assignment1[0].user_id, 'swapped', 'Swapped shift', assignment2Id]
      );
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get user assignments for a specific week
   * @param {number} userId - User ID
   * @param {number} week - Week number
   * @param {number} year - Year
   * @returns {Promise<Array>} - List of assignments
   */
  static async findByUserWeek(userId, week, year) {
    const [rows] = await pool.execute(
      `SELECT sa.*, 
              sh.shift_date, sh.shift_type, sh.start_time, sh.end_time,
              d.department_name, d.department_code,
              sc.schedule_type
       FROM SHIFT_ASSIGNMENT sa
       JOIN SHIFT sh ON sa.shift_id = sh.shift_id
       JOIN SCHEDULE sc ON sh.schedule_id = sc.schedule_id
       LEFT JOIN DEPARTMENT d ON sh.department_id = d.department_id
       WHERE sa.user_id = ? AND sc.week = ? AND sc.year = ?
       ORDER BY sh.shift_date, sh.shift_type`,
      [userId, week, year]
    );
    return rows;
  }
}

module.exports = ShiftAssignment;
