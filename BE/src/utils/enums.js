/**
 * Enum definitions for Hospital Management System
 * These enums correspond to database ENUM types and provide
 * constants for use throughout the application
 */

/**
 * Schedule Types
 * Defines the types of schedules in the system
 */
const ScheduleType = {
  DUTY: 'duty',                    // Lịch trực
  WEEKLY_WORK: 'weekly_work'       // Công tác tuần
};

/**
 * Schedule Status
 * Defines the workflow states of a schedule
 */
const ScheduleStatus = {
  DRAFT: 'draft',                  // Nháp - being created/edited
  SUBMITTED: 'submitted',          // Đã gửi - submitted for approval
  APPROVED: 'approved'             // Đã duyệt - approved and active
};

/**
 * Shift Types
 * Defines the types of shifts in a day
 */
const ShiftType = {
  MORNING: 'morning',              // Ca sáng (7:00 - 12:00)
  AFTERNOON: 'afternoon',          // Ca chiều (13:00 - 17:00)
  NIGHT: 'night'                   // Ca tối/đêm (18:00 - 23:00 or overnight)
};

/**
 * Shift Assignment Status
 * Defines the status of a shift assignment
 */
const ShiftAssignmentStatus = {
  ASSIGNED: 'assigned',            // Đã phân công - actively assigned
  SWAPPED: 'swapped',              // Đã đổi ca - shift was swapped
  CANCELED: 'canceled'             // Đã hủy - assignment canceled
};

/**
 * User Status
 * Defines user account status
 */
const UserStatus = {
  ACTIVE: 'active',                // Đang hoạt động
  INACTIVE: 'inactive'             // Không hoạt động
};

/**
 * Department Types
 * Defines types of departments
 */
const DepartmentType = {
  SIMPLE: 'simple',                // Khoa/phòng thông thường
  ADMIN: 'admin',                  // Ban lãnh đạo
  SPECIAL: 'special'               // Phòng chức năng đặc biệt (như KHTH)
};

/**
 * Document Status
 * Defines document approval workflow status
 */
const DocumentStatus = {
  DRAFT: 'draft',                  // Nháp
  PENDING: 'pending',              // Chờ duyệt
  APPROVED: 'approved',            // Đã duyệt
  REJECTED: 'rejected'             // Bị từ chối
};

/**
 * User Role Scope
 * Defines the scope of a user's role
 */
const RoleScope = {
  DEPARTMENT: 'department',        // Phạm vi phòng ban
  HOSPITAL: 'hospital'             // Phạm vi toàn viện
};

/**
 * Gender
 * Defines gender options
 */
const Gender = {
  MALE: 'male',                    // Nam
  FEMALE: 'female',                // Nữ
  OTHER: 'other'                   // Khác
};

/**
 * Default Shift Times
 * Standard shift time configurations
 */
const DefaultShiftTimes = {
  [ShiftType.MORNING]: {
    start: '07:00:00',
    end: '12:00:00'
  },
  [ShiftType.AFTERNOON]: {
    start: '13:00:00',
    end: '17:00:00'
  },
  [ShiftType.NIGHT]: {
    start: '18:00:00',
    end: '23:00:00'
  }
};

/**
 * Validation helpers for enums
 */
const EnumValidators = {
  /**
   * Validate if value is in enum
   * @param {Object} enumObj - Enum object
   * @param {string} value - Value to validate
   * @returns {boolean}
   */
  isValid(enumObj, value) {
    return Object.values(enumObj).includes(value);
  },

  /**
   * Get all values from enum
   * @param {Object} enumObj - Enum object
   * @returns {Array<string>}
   */
  getValues(enumObj) {
    return Object.values(enumObj);
  },

  /**
   * Get all keys from enum
   * @param {Object} enumObj - Enum object
   * @returns {Array<string>}
   */
  getKeys(enumObj) {
    return Object.keys(enumObj);
  },

  /**
   * Validate schedule type
   * @param {string} value - Value to validate
   * @returns {boolean}
   */
  isValidScheduleType(value) {
    return this.isValid(ScheduleType, value);
  },

  /**
   * Validate schedule status
   * @param {string} value - Value to validate
   * @returns {boolean}
   */
  isValidScheduleStatus(value) {
    return this.isValid(ScheduleStatus, value);
  },

  /**
   * Validate shift type
   * @param {string} value - Value to validate
   * @returns {boolean}
   */
  isValidShiftType(value) {
    return this.isValid(ShiftType, value);
  },

  /**
   * Validate shift assignment status
   * @param {string} value - Value to validate
   * @returns {boolean}
   */
  isValidShiftAssignmentStatus(value) {
    return this.isValid(ShiftAssignmentStatus, value);
  }
};

module.exports = {
  ScheduleType,
  ScheduleStatus,
  ShiftType,
  ShiftAssignmentStatus,
  UserStatus,
  DepartmentType,
  DocumentStatus,
  RoleScope,
  Gender,
  DefaultShiftTimes,
  EnumValidators
};
