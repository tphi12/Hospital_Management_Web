const { pool } = require('../config/database');

class WeeklyWorkItem {
  static schemaModePromise = null;

  static async getSchemaMode() {
    if (!this.schemaModePromise) {
      this.schemaModePromise = (async () => {
        const [assignmentTables] = await pool.query(
          "SHOW TABLES LIKE 'WEEKLY_WORK_ASSIGNMENT'"
        );
        const [participantColumns] = await pool.query(
          "SHOW COLUMNS FROM WEEKLY_WORK_ITEM LIKE 'participants'"
        );

        return {
          hasAssignmentTable: assignmentTables.length > 0,
          hasParticipantsColumn: participantColumns.length > 0,
        };
      })();
    }

    return this.schemaModePromise;
  }

  static normalizeParticipantIds(participantIds = []) {
    if (!Array.isArray(participantIds)) {
      return [];
    }

    return [...new Set(
      participantIds
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0)
    )];
  }

  static parseLegacyParticipants(participants) {
    if (!participants) {
      return [];
    }

    if (Array.isArray(participants)) {
      return this.normalizeParticipantIds(participants);
    }

    const raw = String(participants).trim();
    if (!raw) {
      return [];
    }

    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return this.normalizeParticipantIds(parsed);
        }
      } catch (error) {
        return [];
      }
    }

    return this.normalizeParticipantIds(raw.split(','));
  }

  static mapLegacyRow(row) {
    const participantIds = this.parseLegacyParticipants(row.participants);

    return {
      ...row,
      participantIds,
      participantNames: null,
      participants: row.participants || null,
    };
  }

  static mapAssignmentRow(row) {
    const participantIds = row.participant_ids
      ? row.participant_ids
        .split(',')
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value))
      : [];

    return {
      ...row,
      participantIds,
      participantNames: row.participant_names || null,
      participants: row.participant_names || null,
    };
  }

  static async replaceParticipantsWithAssignments(itemId, participantIds = [], connection = pool) {
    const normalizedParticipantIds = this.normalizeParticipantIds(participantIds);

    await connection.execute(
      'DELETE FROM WEEKLY_WORK_ASSIGNMENT WHERE weekly_work_item_id = ?',
      [itemId]
    );

    if (normalizedParticipantIds.length === 0) {
      return;
    }

    const placeholders = normalizedParticipantIds.map(() => '(?, ?, NOW())').join(', ');
    const values = normalizedParticipantIds.flatMap((userId) => [itemId, userId]);

    await connection.execute(
      `INSERT INTO WEEKLY_WORK_ASSIGNMENT (weekly_work_item_id, user_id, assigned_at)
       VALUES ${placeholders}`,
      values
    );
  }

  static async create(data) {
    const {
      schedule_id,
      work_date,
      time_period = 'Sáng',
      content,
      location = null,
      participantIds = [],
    } = data;

    const schemaMode = await this.getSchemaMode();

    if (schemaMode.hasAssignmentTable) {
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        const [result] = await connection.execute(
          `INSERT INTO WEEKLY_WORK_ITEM
             (schedule_id, work_date, time_period, content, location, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [schedule_id, work_date, time_period, content, location]
        );

        await this.replaceParticipantsWithAssignments(result.insertId, participantIds, connection);

        await connection.commit();
        return result.insertId;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    const normalizedParticipantIds = this.normalizeParticipantIds(participantIds);
    const legacyParticipantsValue = normalizedParticipantIds.length > 0
      ? JSON.stringify(normalizedParticipantIds)
      : null;

    const [result] = await pool.execute(
      `INSERT INTO WEEKLY_WORK_ITEM
         (schedule_id, work_date, time_period, content, location, participants, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [schedule_id, work_date, time_period, content, location, legacyParticipantsValue]
    );

    return result.insertId;
  }

  static async findById(id) {
    const schemaMode = await this.getSchemaMode();

    if (schemaMode.hasAssignmentTable) {
      const [rows] = await pool.execute(
        `SELECT
           wi.*,
           s.week,
           s.year,
           s.status AS schedule_status,
           participant_summary.participant_ids,
           participant_summary.participant_names
         FROM WEEKLY_WORK_ITEM wi
         JOIN SCHEDULE s ON wi.schedule_id = s.schedule_id
         LEFT JOIN (
           SELECT
             wwa.weekly_work_item_id,
             GROUP_CONCAT(DISTINCT wwa.user_id ORDER BY wwa.user_id SEPARATOR ',') AS participant_ids,
             GROUP_CONCAT(DISTINCT u.full_name ORDER BY u.full_name SEPARATOR ', ') AS participant_names
           FROM WEEKLY_WORK_ASSIGNMENT wwa
           JOIN USER u ON u.user_id = wwa.user_id
           GROUP BY wwa.weekly_work_item_id
         ) participant_summary ON participant_summary.weekly_work_item_id = wi.weekly_work_item_id
         WHERE wi.weekly_work_item_id = ?`,
        [id]
      );

      return rows[0] ? this.mapAssignmentRow(rows[0]) : undefined;
    }

    const [rows] = await pool.execute(
      `SELECT wi.*, s.week, s.year, s.status AS schedule_status
       FROM WEEKLY_WORK_ITEM wi
       JOIN SCHEDULE s ON wi.schedule_id = s.schedule_id
       WHERE wi.weekly_work_item_id = ?`,
      [id]
    );

    return rows[0] ? this.mapLegacyRow(rows[0]) : undefined;
  }

  static async findBySchedule(scheduleId) {
    const schemaMode = await this.getSchemaMode();

    if (schemaMode.hasAssignmentTable) {
      const [rows] = await pool.execute(
        `SELECT
           wi.*,
           participant_summary.participant_ids,
           participant_summary.participant_names
         FROM WEEKLY_WORK_ITEM wi
         LEFT JOIN (
           SELECT
             wwa.weekly_work_item_id,
             GROUP_CONCAT(DISTINCT wwa.user_id ORDER BY wwa.user_id SEPARATOR ',') AS participant_ids,
             GROUP_CONCAT(DISTINCT u.full_name ORDER BY u.full_name SEPARATOR ', ') AS participant_names
           FROM WEEKLY_WORK_ASSIGNMENT wwa
           JOIN USER u ON u.user_id = wwa.user_id
           GROUP BY wwa.weekly_work_item_id
         ) participant_summary ON participant_summary.weekly_work_item_id = wi.weekly_work_item_id
         WHERE wi.schedule_id = ?
         ORDER BY wi.work_date ASC, wi.weekly_work_item_id ASC`,
        [scheduleId]
      );

      return rows.map((row) => this.mapAssignmentRow(row));
    }

    const [rows] = await pool.execute(
      `SELECT *
       FROM WEEKLY_WORK_ITEM
       WHERE schedule_id = ?
       ORDER BY work_date ASC, weekly_work_item_id ASC`,
      [scheduleId]
    );

    return rows.map((row) => this.mapLegacyRow(row));
  }

  static async update(id, data) {
    const allowed = ['work_date', 'time_period', 'content', 'location'];
    const fields = [];
    const values = [];

    allowed.forEach((field) => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    const hasParticipantUpdate = data.participantIds !== undefined;
    if (fields.length === 0 && !hasParticipantUpdate) {
      return false;
    }

    const schemaMode = await this.getSchemaMode();

    if (schemaMode.hasAssignmentTable) {
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        let updated = false;

        if (fields.length > 0) {
          fields.push('updated_at = NOW()');
          values.push(id);

          const [result] = await connection.execute(
            `UPDATE WEEKLY_WORK_ITEM SET ${fields.join(', ')} WHERE weekly_work_item_id = ?`,
            values
          );

          updated = result.affectedRows > 0;
        }

        if (hasParticipantUpdate) {
          await this.replaceParticipantsWithAssignments(id, data.participantIds, connection);
          await connection.execute(
            'UPDATE WEEKLY_WORK_ITEM SET updated_at = NOW() WHERE weekly_work_item_id = ?',
            [id]
          );
          updated = true;
        }

        await connection.commit();
        return updated;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    if (hasParticipantUpdate) {
      fields.push('participants = ?');
      values.push(
        this.normalizeParticipantIds(data.participantIds).length > 0
          ? JSON.stringify(this.normalizeParticipantIds(data.participantIds))
          : null
      );
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const [result] = await pool.execute(
      `UPDATE WEEKLY_WORK_ITEM SET ${fields.join(', ')} WHERE weekly_work_item_id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.execute(
      'DELETE FROM WEEKLY_WORK_ITEM WHERE weekly_work_item_id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async deleteBySchedule(scheduleId) {
    const [result] = await pool.execute(
      'DELETE FROM WEEKLY_WORK_ITEM WHERE schedule_id = ?',
      [scheduleId]
    );
    return result.affectedRows > 0;
  }

  static async findByUser(userId, filters = {}) {
    const schemaMode = await this.getSchemaMode();

    if (schemaMode.hasAssignmentTable) {
      let query = `
        SELECT
          wi.*,
          s.schedule_id,
          s.schedule_type,
          s.week,
          s.year,
          s.status AS schedule_status,
          s.description AS schedule_description,
          s.created_by,
          participant_summary.participant_ids,
          participant_summary.participant_names
        FROM WEEKLY_WORK_ITEM wi
        JOIN SCHEDULE s ON wi.schedule_id = s.schedule_id
        JOIN WEEKLY_WORK_ASSIGNMENT my_assignment
          ON my_assignment.weekly_work_item_id = wi.weekly_work_item_id
         AND my_assignment.user_id = ?
        LEFT JOIN (
          SELECT
            wwa.weekly_work_item_id,
            GROUP_CONCAT(DISTINCT wwa.user_id ORDER BY wwa.user_id SEPARATOR ',') AS participant_ids,
            GROUP_CONCAT(DISTINCT u.full_name ORDER BY u.full_name SEPARATOR ', ') AS participant_names
          FROM WEEKLY_WORK_ASSIGNMENT wwa
          JOIN USER u ON u.user_id = wwa.user_id
          GROUP BY wwa.weekly_work_item_id
        ) participant_summary ON participant_summary.weekly_work_item_id = wi.weekly_work_item_id
        WHERE s.status = 'approved'
      `;

      const params = [userId];

      if (filters.from_date) {
        query += ' AND wi.work_date >= ?';
        params.push(filters.from_date);
      }

      if (filters.to_date) {
        query += ' AND wi.work_date <= ?';
        params.push(filters.to_date);
      }

      query += ' ORDER BY wi.work_date ASC, wi.weekly_work_item_id ASC';

      const [rows] = await pool.execute(query, params);
      return rows.map((row) => this.mapAssignmentRow(row));
    }

    let query = `
      SELECT
        wi.*,
        s.schedule_id,
        s.schedule_type,
        s.week,
        s.year,
        s.status AS schedule_status,
        s.description AS schedule_description,
        s.created_by
      FROM WEEKLY_WORK_ITEM wi
      JOIN SCHEDULE s ON wi.schedule_id = s.schedule_id
      WHERE s.status = 'approved'
        AND JSON_CONTAINS(wi.participants, JSON_QUOTE(CAST(? AS CHAR)))
    `;

    const params = [userId.toString()];

    if (filters.from_date) {
      query += ' AND wi.work_date >= ?';
      params.push(filters.from_date);
    }

    if (filters.to_date) {
      query += ' AND wi.work_date <= ?';
      params.push(filters.to_date);
    }

    query += ' ORDER BY wi.work_date ASC, wi.weekly_work_item_id ASC';

    const [rows] = await pool.execute(query, params);
    return rows.map((row) => this.mapLegacyRow(row));
  }
}

module.exports = WeeklyWorkItem;
