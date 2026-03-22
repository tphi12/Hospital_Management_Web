-- Migration 004: Create WEEKLY_WORK_ITEM table
-- This table stores individual task/activity entries for weekly_work schedules.
-- weekly_work schedules do NOT use SHIFT / SHIFT_ASSIGNMENT; they use this table instead.

CREATE TABLE IF NOT EXISTS WEEKLY_WORK_ITEM (
    weekly_work_item_id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id         INT          NOT NULL,
    work_date           DATE         NOT NULL,
    time_period         ENUM('Sáng', 'Chiều') NOT NULL DEFAULT 'Sáng',
    content             TEXT         NOT NULL,
    location            VARCHAR(500) DEFAULT NULL,
    participants        TEXT         DEFAULT NULL,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES SCHEDULE(schedule_id) ON DELETE CASCADE,
    INDEX idx_wwi_schedule_id (schedule_id),
    INDEX idx_wwi_work_date   (work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
