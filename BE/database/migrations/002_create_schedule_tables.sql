-- Migration: 002_create_schedule_tables.sql
-- Description: Create schedule, shift, and shift_assignment tables
-- Created: 2024-01-20
-- Phase: Schedule Module Phase 1

-- Create SCHEDULE table
CREATE TABLE IF NOT EXISTS SCHEDULE (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_type ENUM('duty', 'weekly_work') NOT NULL COMMENT 'Type of schedule: duty or weekly_work',
    department_id INT NOT NULL COMMENT 'Department owning this schedule',
    week INT NOT NULL COMMENT 'Week number (1-53)',
    year INT NOT NULL COMMENT 'Year (e.g., 2024)',
    description TEXT COMMENT 'Schedule description or notes',
    created_by INT NOT NULL COMMENT 'User who created this schedule',
    status ENUM('draft', 'submitted', 'approved') NOT NULL DEFAULT 'draft' COMMENT 'Workflow status of schedule',
    source_department_id INT COMMENT 'Source department (if different from owner)',
    owner_department_id INT COMMENT 'Owner department (if different from creator)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (source_department_id) REFERENCES DEPARTMENT(department_id) ON DELETE SET NULL,
    FOREIGN KEY (owner_department_id) REFERENCES DEPARTMENT(department_id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_schedule_type (schedule_type),
    INDEX idx_week_year (week, year),
    INDEX idx_status (status),
    INDEX idx_department_id (department_id),
    INDEX created_by (created_by),
    INDEX source_department_id (source_department_id),
    INDEX owner_department_id (owner_department_id),
    
    -- Constraints
    UNIQUE KEY unique_schedule (schedule_type, department_id, week, year) COMMENT 'Prevent duplicate schedules',
    CONSTRAINT chk_week CHECK (week >= 1 AND week <= 53),
    CONSTRAINT chk_year CHECK (year >= 2000 AND year <= 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores schedule records for duty and weekly work schedules';

-- Create SHIFT table
CREATE TABLE IF NOT EXISTS SHIFT (
    shift_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL COMMENT 'Parent schedule',
    department_id INT NOT NULL COMMENT 'Department for this shift',
    shift_date DATE NOT NULL COMMENT 'Date of the shift',
    shift_type ENUM('morning', 'afternoon', 'night') NOT NULL COMMENT 'Type of shift in the day',
    start_time TIME COMMENT 'Start time of shift',
    end_time TIME COMMENT 'End time of shift',
    max_staff INT DEFAULT 10 COMMENT 'Maximum number of staff for this shift',
    note TEXT COMMENT 'Additional notes for the shift',
    
    -- Foreign Keys
    FOREIGN KEY (schedule_id) REFERENCES SCHEDULE(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_shift_date (shift_date),
    INDEX idx_shift_type (shift_type),
    INDEX department_id (department_id),
    
    -- Constraints
    CONSTRAINT chk_max_staff CHECK (max_staff > 0 AND max_staff <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores individual shift records within schedules';

-- Create SHIFT_ASSIGNMENT table
CREATE TABLE IF NOT EXISTS SHIFT_ASSIGNMENT (
    shift_assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    shift_id INT NOT NULL COMMENT 'Shift being assigned',
    user_id INT NOT NULL COMMENT 'User assigned to the shift',
    status ENUM('assigned', 'swapped', 'canceled') NOT NULL DEFAULT 'assigned' COMMENT 'Status of the assignment',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the assignment was made',
    note TEXT COMMENT 'Additional notes for the assignment',
    
    -- Foreign Keys
    FOREIGN KEY (shift_id) REFERENCES SHIFT(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_shift_id (shift_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),

    -- Constraints
    CHECK (status IN ('assigned', 'swapped', 'canceled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores assignments of users to shifts';
