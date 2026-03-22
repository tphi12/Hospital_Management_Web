const { pool } = require('../src/config/database');

async function main() {
  try {
    const [rows] = await pool.query('SELECT VERSION() AS version');
    const version = rows[0]?.version || 'unknown';
    const major = Number.parseInt(String(version).split('.')[0], 10);

    console.log(`MySQL version: ${version}`);

    if (Number.isInteger(major) && major >= 8) {
      console.log('Compatibility: OK for rollout scripts and migration 005.');
    } else if (Number.isInteger(major) && major >= 5) {
      console.log('Compatibility: OK for rollout scripts and migration 005 (5.7+/8.x safe path).');
    } else {
      console.log('Compatibility: Unknown. Please verify manually before rollout.');
    }
  } catch (error) {
    console.error('Failed to detect MySQL version:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
