const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

/**
 * Database Migration Runner
 * Executes migration files in order to set up or update the database schema
 */

const config = require('../src/config/database');

// Migration tracking table
const MIGRATION_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_migration_name (migration_name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

/**
 * Initialize migration tracking
 */
async function initMigrationTable(connection) {
  await connection.query(MIGRATION_TABLE);
  console.log('✓ Migration tracking table initialized');
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(connection) {
  const [rows] = await connection.query(
    'SELECT migration_name FROM schema_migrations ORDER BY id'
  );
  return rows.map(row => row.migration_name);
}

/**
 * Record migration execution
 */
async function recordMigration(connection, migrationName) {
  await connection.query(
    'INSERT INTO schema_migrations (migration_name) VALUES (?)',
    [migrationName]
  );
}

/**
 * Get all migration files
 */
async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = await fs.readdir(migrationsDir);
  
  return files
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure correct order (001_, 002_, etc.)
}

/**
 * Execute a single migration file
 */
async function executeMigration(connection, migrationFile) {
  const filePath = path.join(__dirname, 'migrations', migrationFile);
  const sql = await fs.readFile(filePath, 'utf8');

  // Remove line comments before splitting into statements.
  const normalizedSql = sql
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*--.*$/, ''))
    .join('\n');

  const statements = normalizedSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  console.log(`  Executing ${statements.length} statements...`);

  for (const statement of statements) {
    await connection.query(statement);
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  let connection;
  
  try {
    console.log('🚀 Starting database migrations...\n');
    
    // Create connection
    connection = await mysql.createConnection({
      host: config.dbConfig.host,
      port: config.dbConfig.port,
      user: config.dbConfig.user,
      password: config.dbConfig.password,
      database: config.dbConfig.database,
      ssl: config.dbConfig.ssl,
      multipleStatements: true
    });
    
    console.log('✓ Connected to database');
    
    // Initialize migration tracking
    await initMigrationTable(connection);
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations(connection);
    console.log(`✓ Found ${executedMigrations.length} executed migrations\n`);
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    console.log(`✓ Found ${migrationFiles.length} migration files\n`);
    
    // Filter pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✓ No pending migrations. Database is up to date!\n');
      return;
    }
    
    console.log(`📝 Executing ${pendingMigrations.length} pending migrations:\n`);
    
    // Execute each pending migration
    for (const migrationFile of pendingMigrations) {
      console.log(`▶ ${migrationFile}`);
      
      try {
        await executeMigration(connection, migrationFile);
        await recordMigration(connection, migrationFile);
        console.log(`  ✓ Success\n`);
      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}\n`);
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed');
    }
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: config.dbConfig.host,
      port: config.dbConfig.port,
      user: config.dbConfig.user,
      password: config.dbConfig.password,
      database: config.dbConfig.database,
      ssl: config.dbConfig.ssl,
    });
    
    await initMigrationTable(connection);
    
    const executedMigrations = await getExecutedMigrations(connection);
    const migrationFiles = await getMigrationFiles();
    
    console.log('\n📊 Migration Status:\n');
    console.log('Migration Files:');
    
    for (const file of migrationFiles) {
      const status = executedMigrations.includes(file) ? '✓' : '○';
      console.log(`  ${status} ${file}`);
    }
    
    const pending = migrationFiles.length - executedMigrations.length;
    console.log(`\nTotal: ${migrationFiles.length} | Executed: ${executedMigrations.length} | Pending: ${pending}\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'up':
  case 'migrate':
    runMigrations();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log(`
Database Migration Tool

Usage:
  node runMigrations.js [command]

Commands:
  up, migrate    Run all pending migrations
  status         Show migration status

Examples:
  node database/runMigrations.js up
  node database/runMigrations.js status
    `);
    process.exit(0);
}
