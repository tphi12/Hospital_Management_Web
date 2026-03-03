-- Migration: 003_add_composite_indexes.sql
-- Description: Add additional composite indexes for performance optimization
-- Created: 2024-01-25
-- Phase: Schedule Module Phase 1 - Index Optimization

-- Add composite index on SCHEDULE for commonly filtered columns
-- This supports queries filtering by schedule_type, week, and year together
ALTER TABLE SCHEDULE 
ADD INDEX IF NOT EXISTS idx_type_week_year (schedule_type, week, year)
COMMENT 'Optimized index for filtering schedules by type, week, and year';

-- Add composite index on SHIFT for date range queries
ALTER TABLE SHIFT 
ADD INDEX IF NOT EXISTS idx_schedule_date (schedule_id, shift_date)
COMMENT 'Optimized for querying shifts within a schedule by date';

-- Add composite index on SHIFT_ASSIGNMENT for user schedule queries
ALTER TABLE SHIFT_ASSIGNMENT 
ADD INDEX IF NOT EXISTS idx_shift_user (shift_id, user_id)
COMMENT 'Optimized for checking if user is assigned to a shift';

-- Analyze tables to update statistics
ANALYZE TABLE SCHEDULE;
ANALYZE TABLE SHIFT;
ANALYZE TABLE SHIFT_ASSIGNMENT;
