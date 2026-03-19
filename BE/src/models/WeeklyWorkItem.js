const { pool } = require('../config/database');

/**
 * WeeklyWorkItem model
 *
 * Represents a single task/activity entry inside a `weekly_work` schedule.
 * There is no ShiftAssignment for weekly_work schedules — attendance and
 * participant information is stored directly on the item.
 */
class WeeklyWorkItem {
  /**
   * Create a new weekly work item
   *
   * @param {Object} data
   * @param {number} data.schedule_id   - FK → SCHEDULE.schedule_id
   * @param {string} data.work_date     - YYYY-MM-DD
   * @param {string} data.time_period   - 'Sáng' hoặc 'Chiều'
   * @param {string} data.content       - Description of the work / activity
   * @param {string} [data.location]    - Where the work takes place (optional)
   * @param {string} [data.participants]- JSON array of user_ids (optional)
   * @returns {Promise<number>} Inserted row ID
   */
  static async create(data) {
    const { schedule_id, work_date, time_period = 'Sáng', content, location = null, participants = null } = data;

    const [result] = await pool.execute(
      `INSERT INTO WEEKLY_WORK_ITEM
         (schedule_id, work_date, time_period, content, location, participants, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [schedule_id, work_date, time_period, content, location, participants]
    );

    return result.insertId;
  }

  /**
   * Find a single item by its primary key
   *
   * @param {number} id
   * @returns {Promise<Object|undefined>}
   */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT wi.*, s.week, s.year, s.status as schedule_status
       FROM WEEKLY_WORK_ITEM wi
       JOIN SCHEDULE s ON wi.schedule_id = s.schedule_id
       WHERE wi.weekly_work_item_id = ?`,
      [id]
    );
    return rows[0];
  }

  /**
   * Find all items belonging to a schedule, ordered by date then insertion order
   *
   * @param {number} scheduleId
   * @returns {Promise<Object[]>}
   */
  static async findBySchedule(scheduleId) {
    const [rows] = await pool.execute(
      `SELECT * FROM WEEKLY_WORK_ITEM
       WHERE schedule_id = ?
       ORDER BY work_date ASC, weekly_work_item_id ASC`,
      [scheduleId]
    );
    return rows;
  }

  /**
   * Update mutable fields of an item
   *
   * @param {number} id
   * @param {Object} data   - Only `content`, `location`, `participants`, `work_date` are allowed
   * @returns {Promise<boolean>}
   */
  static async update(id, data) {
    const allowed = ['work_date', 'content', 'location', 'participants'];
    const fields = [];
    const values = [];

    allowed.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) return false;

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await pool.execute(
      `UPDATE WEEKLY_WORK_ITEM SET ${fields.join(', ')} WHERE weekly_work_item_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  /**
   * Delete a single item
   *
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM WEEKLY_WORK_ITEM WHERE weekly_work_item_id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Delete all items belonging to a schedule (used before deleting the schedule itself)
   *
   * @param {number} scheduleId
   * @returns {Promise<boolean>}
   */
  static async deleteBySchedule(scheduleId) {
    const [result] = await pool.execute(
      'DELETE FROM WEEKLY_WORK_ITEM WHERE schedule_id = ?',
      [scheduleId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get all weekly work items where the user is a participant
   *
   * @param {number} userId - User ID to search for in participants
   * @param {Object} filters - Optional filters (from_date, to_date)
   * @returns {Promise<Array>} - List of weekly work items with schedule details
   */
  static async findByUser(userId, filters = {}) {
    console.log('[WeeklyWorkItem.findByUser] userId:', userId, 'type:', typeof userId);
    console.log('[WeeklyWorkItem.findByUser] filters:', filters);
    
    let query = `
      SELECT wi.*, 
             s.schedule_id, s.schedule_type, s.week, s.year, s.status as schedule_status,
             s.description as schedule_description, s.created_by
      FROM WEEKLY_WORK_ITEM wi
      JOIN SCHEDULE s ON wi.schedule_id = s.schedule_id
      WHERE JSON_CONTAINS(wi.participants, JSON_QUOTE(CAST(? AS CHAR)))
    `;
    
    const params = [userId.toString()];
    
    if (filters.from_date) {
      query += ` AND wi.work_date >= ?`;
      params.push(filters.from_date);
    }
    
    if (filters.to_date) {
      query += ` AND wi.work_date <= ?`;
      params.push(filters.to_date);
    }
    
    query += ` ORDER BY wi.work_date ASC, wi.weekly_work_item_id ASC`;
    
    console.log('[WeeklyWorkItem.findByUser] Query:', query);
    console.log('[WeeklyWorkItem.findByUser] Params:', params);
    const [rows] = await pool.execute(query, params);
    console.log('[WeeklyWorkItem.findByUser] Result count:', rows.length);
    return rows;
  }
}

module.exports = WeeklyWorkItem;
