# Database Migrations

This directory contains database migration files for the Hospital Management System.

## Directory Structure

```
database/
├── migrations/           # Migration SQL files
│   ├── 001_create_base_tables.sql
│   ├── 002_create_schedule_tables.sql
│   └── 003_add_composite_indexes.sql
├── schema.sql           # Complete database schema
├── runMigrations.js     # Migration runner script
└── README.md            # This file
```

## Migration Files

### 001_create_base_tables.sql
Creates the foundation tables for the system:
- DEPARTMENT
- USER
- ROLE
- USER_ROLE

### 002_create_schedule_tables.sql
Creates the Schedule module tables (Phase 1):
- SCHEDULE
- SHIFT
- SHIFT_ASSIGNMENT

Includes:
- All foreign key constraints
- Basic indexes
- ENUM definitions
- Business constraints (CHECK, UNIQUE)

### 003_add_composite_indexes.sql
Adds performance optimization indexes:
- `idx_type_week_year` on SCHEDULE
- `idx_schedule_date` on SHIFT
- `idx_shift_user` on SHIFT_ASSIGNMENT

## Running Migrations

### Option 1: Using Migration Runner (Recommended)

The migration runner tracks which migrations have been executed and only runs pending ones.

```bash
# Run all pending migrations
node database/runMigrations.js up

# Check migration status
node database/runMigrations.js status
```

**Features:**
- ✅ Tracks executed migrations
- ✅ Only runs pending migrations
- ✅ Prevents duplicate execution
- ✅ Shows progress and errors
- ✅ Transaction safety

### Option 2: Using Complete Schema

For initial setup, you can run the complete schema file:

```bash
mysql -u root -p hospital_management < database/schema.sql
```

Or using the setup script:

```bash
node scripts/setupDatabase.js
```

### Option 3: Manual Execution

Run migrations manually in order:

```bash
mysql -u root -p hospital_management < database/migrations/001_create_base_tables.sql
mysql -u root -p hospital_management < database/migrations/002_create_schedule_tables.sql
mysql -u root -p hospital_management < database/migrations/003_add_composite_indexes.sql
```

## Migration Tracking

The migration runner creates a `schema_migrations` table to track executed migrations:

```sql
CREATE TABLE schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Creating New Migrations

### Naming Convention
Format: `NNN_description.sql` where NNN is a sequential number (e.g., `004_add_audit_tables.sql`)

### Template

```sql
-- Migration: NNN_description.sql
-- Description: Brief description of what this migration does
-- Created: YYYY-MM-DD
-- Phase: [Optional phase information]

-- Your SQL statements here
-- Use IF NOT EXISTS to make migrations idempotent when possible

CREATE TABLE IF NOT EXISTS NEW_TABLE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- columns
);

-- Add comments to explain complex changes
ALTER TABLE EXISTING_TABLE 
ADD COLUMN new_column VARCHAR(100) COMMENT 'Description';
```

### Best Practices

1. **Make migrations idempotent** when possible using `IF NOT EXISTS`
2. **One logical change per migration** (easier to track and rollback)
3. **Include comments** explaining the purpose
4. **Test before committing** in a dev environment
5. **Never modify executed migrations** - create a new one instead
6. **Include both up and down** if supporting rollbacks
7. **Use transactions** for data migrations

### Example: Adding a New Table

```sql
-- Migration: 004_add_audit_log.sql
-- Description: Add audit log table for tracking changes
-- Created: 2024-01-30

CREATE TABLE IF NOT EXISTS AUDIT_LOG (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    user_id INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSON,
    new_values JSON,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE SET NULL,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Rollback Strategy

For development/testing, you can rollback by:

1. **Drop and recreate** (loses all data):
   ```bash
   mysql -u root -p -e "DROP DATABASE hospital_management; CREATE DATABASE hospital_management;"
   node database/runMigrations.js up
   ```

2. **Manual rollback** (write reverse migration):
   ```sql
   -- 004_rollback_audit_log.sql
   DROP TABLE IF EXISTS AUDIT_LOG;
   DELETE FROM schema_migrations WHERE migration_name = '004_add_audit_log.sql';
   ```

3. **Use mysql backups** before running migrations in production

## Migration Workflow

### Development
```
1. Write migration file (NNN_description.sql)
2. Test locally: node database/runMigrations.js up
3. Verify changes: node database/runMigrations.js status
4. Commit to version control
```

### Staging/Production
```
1. Pull latest code
2. Backup database
3. Review pending migrations: node database/runMigrations.js status
4. Run migrations: node database/runMigrations.js up
5. Verify application functionality
6. Monitor for errors
```

## Troubleshooting

### Migration Fails Midway

1. Check error message
2. Fix the SQL syntax/logic issue
3. Manually fix database if needed
4. Rerun: `node database/runMigrations.js up`

### Migration Already Executed

The runner prevents duplicate execution. If you need to re-run:

```sql
-- Remove from tracking table
DELETE FROM schema_migrations WHERE migration_name = 'XXX_name.sql';
```

### Connection Errors

Check your database configuration in `src/config/database.js`:
- Host
- Port
- Username
- Password
- Database name

## Database Schema Documentation

For complete schema documentation, see:
- [Schema SQL](./schema.sql) - Complete database schema
- [Setup Guide](../docs/SETUP_DATABASE.md) - Setup instructions
- [Schedule Module Docs](../docs/SCHEDULE_MODULE_PHASE1.md) - Phase 1 documentation

## Additional Resources

- MySQL Documentation: https://dev.mysql.com/doc/
- Database Design Best Practices: https://www.mysqltutorial.org/mysql-database-design/
- Migration Patterns: https://www.martinfowler.com/articles/evodb.html

## Support

For issues or questions:
1. Check the error message
2. Review migration file syntax
3. Check database logs: `SHOW ENGINE INNODB STATUS;`
4. Verify foreign key constraints
5. Contact the development team
