const { pool } = require('../config/database');

class Shift {
  static async create(shiftData) {
    const {
      schedule_id, department_id, shift_date, shift_type,
      note, start_time, end_time, max_staff
    } = shiftData;

    const params = [
      schedule_id,
      department_id,
      shift_date,
      shift_type,
      note,
      start_time,
      end_time,
      max_staff,
    ].map((value) => (value === undefined ? null : value));
    
    const [result] = await pool.execute(
      `INSERT INTO SHIFT (schedule_id, department_id, shift_date, shift_type,
                          note, start_time, end_time, max_staff)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );
    
    return result.insertId;
  }

  static async findBySchedule(scheduleId) {
    const [rows] = await pool.execute(
      `SELECT sh.*, DATE_FORMAT(sh.shift_date, '%Y-%m-%d') AS shift_date, d.department_name, d.department_code,
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
      `SELECT sh.*, DATE_FORMAT(sh.shift_date, '%Y-%m-%d') AS shift_date, d.department_name, d.department_code,
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

  /**
   * Get shift with detailed information including assignments
   * @param {number} shiftId - Shift ID
   * @returns {Promise<Object|undefined>} - Shift details with assignment count
   */
  static async getWithDetails(shiftId) {
    const [rows] = await pool.execute(
      `SELECT sh.*, DATE_FORMAT(sh.shift_date, '%Y-%m-%d') AS shift_date, d.department_name, d.department_code,
              sc.schedule_type, sc.week, sc.year, sc.status as schedule_status,
              COUNT(CASE WHEN sa.status != 'canceled' THEN sa.shift_assignment_id END) as assigned_count
       FROM SHIFT sh
       LEFT JOIN DEPARTMENT d ON sh.department_id = d.department_id
       LEFT JOIN SCHEDULE sc ON sh.schedule_id = sc.schedule_id
       LEFT JOIN SHIFT_ASSIGNMENT sa ON sh.shift_id = sa.shift_id
       WHERE sh.shift_id = ?
       GROUP BY sh.shift_id`,
      [shiftId]
    );
    return rows[0];
  }

  /**
   * Find shifts by date range
   * @param {number} departmentId - Department ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} - List of shifts
   */
  static async findByDateRange(departmentId, startDate, endDate) {
    const [rows] = await pool.execute(
      `SELECT sh.*, DATE_FORMAT(sh.shift_date, '%Y-%m-%d') AS shift_date, sc.schedule_type, sc.week, sc.year,
              COUNT(CASE WHEN sa.status != 'canceled' THEN sa.shift_assignment_id END) as assigned_count
       FROM SHIFT sh
       JOIN SCHEDULE sc ON sh.schedule_id = sc.schedule_id
       LEFT JOIN SHIFT_ASSIGNMENT sa ON sh.shift_id = sa.shift_id
       WHERE sh.department_id = ? 
         AND sh.shift_date >= ? 
         AND sh.shift_date <= ?
       GROUP BY sh.shift_id
       ORDER BY sh.shift_date, sh.shift_type`,
      [departmentId, startDate, endDate]
    );
    return rows;
  }
}

module.exports = Shift;
