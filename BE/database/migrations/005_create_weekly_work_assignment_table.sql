-- Migration 005: Create WEEKLY_WORK_ASSIGNMENT table
-- Compatible with MySQL 5.7+ and 8.x because it only performs DDL.
-- Data backfill and legacy column removal are handled by Node rollout scripts.

CREATE TABLE IF NOT EXISTS WEEKLY_WORK_ASSIGNMENT (
    weekly_work_assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    weekly_work_item_id       INT       NOT NULL,
    user_id                   INT       NOT NULL,
    assigned_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (weekly_work_item_id) REFERENCES WEEKLY_WORK_ITEM(weekly_work_item_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    UNIQUE KEY uk_wwa_item_user (weekly_work_item_id, user_id),
    INDEX idx_wwa_item_id (weekly_work_item_id),
    INDEX idx_wwa_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
