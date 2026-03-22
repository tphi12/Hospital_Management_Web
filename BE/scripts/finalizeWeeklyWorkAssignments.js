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
    const [participantColumns] = await connection.query("SHOW COLUMNS FROM WEEKLY_WORK_ITEM LIKE 'participants'");
    if (participantColumns.length === 0) {
      console.log('participants column already removed. Nothing to finalize.');
      return;
    }

    const [items] = await connection.query(
      `SELECT wi.weekly_work_item_id, wi.participants, COUNT(wwa.weekly_work_assignment_id) AS assignment_count
       FROM WEEKLY_WORK_ITEM wi
       LEFT JOIN WEEKLY_WORK_ASSIGNMENT wwa
         ON wwa.weekly_work_item_id = wi.weekly_work_item_id
       GROUP BY wi.weekly_work_item_id, wi.participants`
    );

    const mismatches = items.filter((item) => {
      const expectedCount = parseParticipantIds(item.participants).length;
      return expectedCount !== Number(item.assignment_count || 0);
    });

    if (mismatches.length > 0) {
      console.error('Finalize aborted. Some weekly work items are not fully backfilled yet.');
      mismatches.slice(0, 10).forEach((item) => {
        console.error(
          `- weekly_work_item_id=${item.weekly_work_item_id}, expected=${parseParticipantIds(item.participants).length}, actual=${item.assignment_count}`
        );
      });
      process.exitCode = 1;
      return;
    }

    await connection.execute(
      'ALTER TABLE WEEKLY_WORK_ITEM DROP COLUMN participants'
    );

    console.log('Finalize completed. Legacy participants column removed.');
  } catch (error) {
    console.error('Finalize failed:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
