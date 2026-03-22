const { pool } = require('../src/config/database');

function parseParticipantIds(rawValue) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(String(rawValue));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return [...new Set(
      parsed
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0)
    )];
  } catch (error) {
    return [];
  }
}

async function main() {
  const connection = await pool.getConnection();

  try {
    const [assignmentTables] = await connection.query("SHOW TABLES LIKE 'WEEKLY_WORK_ASSIGNMENT'");
    if (assignmentTables.length === 0) {
      throw new Error('WEEKLY_WORK_ASSIGNMENT table does not exist. Run migration 005 first.');
    }

    const [participantColumns] = await connection.query("SHOW COLUMNS FROM WEEKLY_WORK_ITEM LIKE 'participants'");
    if (participantColumns.length === 0) {
      console.log('Legacy participants column already removed. Nothing to backfill.');
      return;
    }

    const [items] = await connection.query(
      `SELECT weekly_work_item_id, participants
       FROM WEEKLY_WORK_ITEM
       WHERE participants IS NOT NULL
         AND TRIM(participants) <> ''`
    );

    let insertedCount = 0;
    let skippedRows = 0;

    await connection.beginTransaction();

    for (const item of items) {
      const participantIds = parseParticipantIds(item.participants);

      if (participantIds.length === 0) {
        skippedRows += 1;
        continue;
      }

      for (const userId of participantIds) {
        const [result] = await connection.execute(
          `INSERT IGNORE INTO WEEKLY_WORK_ASSIGNMENT (weekly_work_item_id, user_id, assigned_at)
           VALUES (?, ?, NOW())`,
          [item.weekly_work_item_id, userId]
        );

        insertedCount += result.affectedRows;
      }
    }

    await connection.commit();

    console.log(`Backfill completed. Inserted assignments: ${insertedCount}. Skipped rows: ${skippedRows}.`);
  } catch (error) {
    await connection.rollback();
    console.error('Backfill failed:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
