/**
 * schedule/constants.js
 *
 * FE-side mirror of BE src/utils/enums.js — restricted to schedule-relevant
 * values only. Keep these in sync with the backend enum definitions.
 */

/** @enum {string} */
export const ScheduleStatus = {
  DRAFT:     'draft',
  SUBMITTED: 'submitted',
  APPROVED:  'approved',
};

/** @enum {string} */
export const ScheduleType = {
  DUTY:        'duty',
  WEEKLY_WORK: 'weekly_work',
};

/** @enum {string} */
export const RoleScope = {
  DEPARTMENT: 'department',
  HOSPITAL:   'hospital',
};

/**
 * Role codes used in permission checks.
 * These mirror the ROLE.role_code values stored in the database.
 *
 * CLERK   — Văn thư phòng ban: creates and submits duty schedules.
 * MANAGER — Phòng KHTH manager: reviews, edits and approves schedules.
 */
export const RoleCode = {
  CLERK:   'CLERK',
  MANAGER: 'MANAGER',
};
