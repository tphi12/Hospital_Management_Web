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
   * @param {string} data.content       - Description of the work / activity
   * @param {string} [data.location]    - Where the work takes place (optional)
   * @param {string} [data.participants]- Free-text or JSON list of participants (optional)
   * @returns {Promise<number>} Inserted row ID
   */
  static async create(data) {
    const { schedule_id, work_date, content, location = null, participants = null } = data;

    const [result] = await pool.execute(
      `INSERT INTO WEEKLY_WORK_ITEM
         (schedule_id, work_date, content, location, participants, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [schedule_id, work_date, content, location, participants]
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
}

module.exports = WeeklyWorkItem;
