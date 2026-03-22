const Schedule = require('../models/Schedule');
const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');
const WeeklyWorkItem = require('../models/WeeklyWorkItem');
const Role = require('../models/Role');
const Department = require('../models/Department');
const { ScheduleType, ScheduleStatus } = require('../utils/enums');
const SchedulePermissionService = require('./SchedulePermissionService');

/**
 * ScheduleService
 * Business logic for schedule operations
 */
class ScheduleService {
  /**
   * Check if user has required role with specific scope
   * @param {number} userId - User ID
   * @param {string} roleCode - Role code (e.g., 'CLERK')
   * @param {string} scopeType - Scope type ('department' or 'hospital')
   * @param {number} departmentId - Department ID (for department scope)
   * @returns {Promise<boolean>}
   */
  static async hasRole(userId, roleCode, scopeType = 'department', departmentId = null) {
    const userRoles = await Role.getUserRoles(userId);
    
    return userRoles.some(role => {
      const matchesRole = role.role_code === roleCode;
      const matchesScope = role.scope_type === scopeType;
      const matchesDepartment = scopeType === 'hospital' || role.department_id === departmentId;
      
      return matchesRole && matchesScope && matchesDepartment;
    });
  }

  /**
   * Create a duty schedule
   * Rules:
   * - Only CLERK with scope=department can create
   * - schedule_type = duty
   * - status = draft
   * - source_department_id = user.department
   * - owner_department_id = KHTH department
   * 
   * @param {Object} scheduleData - Schedule data
   * @param {number} scheduleData.userId - User creating the schedule
   * @param {number} scheduleData.departmentId - Department ID
   * @param {number} scheduleData.week - Week number (1-53)
   * @param {number} scheduleData.year - Year
   * @param {string} scheduleData.description - Description
   * @returns {Promise<number>} - Schedule ID
   * @throws {Error} - If validation fails
   */
  static async createDutySchedule(scheduleData) {
    const { userId, departmentId, week, year, description } = scheduleData;

    // Validate required fields
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!departmentId) {
      throw new Error('Department ID is required');
    }
    if (!week || week < 1 || week > 53) {
      throw new Error('Week must be between 1 and 53');
    }
    if (!year || year < 2000 || year > 2100) {
      throw new Error('Year must be between 2000 and 2100');
    }

    // Check if user has CLERK role with department scope
    const hasPermission = await this.hasRole(userId, 'CLERK', 'department', departmentId);
    
    if (!hasPermission) {
      throw new Error('Only CLERK with department scope can create duty schedules');
    }

    // Check for duplicate schedule
    const existingSchedule = await Schedule.checkExists(
      ScheduleType.DUTY,
      departmentId,
      week,
      year
    );

    if (existingSchedule) {
      throw new Error(`Duty schedule already exists for week ${week}/${year} in this department`);
    }

    // Get KHTH department as owner
    const khthDepartment = await Department.findByCode('KHTH');
    if (!khthDepartment) {
      throw new Error('KHTH department not found in system');
    }

    // Create the schedule
    const scheduleId = await Schedule.create({
      schedule_type: ScheduleType.DUTY,
      department_id: departmentId,
      week,
      year,
      description: description || `Duty schedule for week ${week}/${year}`,
      created_by: userId,
      status: ScheduleStatus.DRAFT,
      source_department_id: departmentId,
      owner_department_id: khthDepartment.department_id
    });

    return scheduleId;
  }

  /**
   * Add a shift to a schedule
   * @param {Object} shiftData - Shift data
   * @param {number} shiftData.scheduleId - Schedule ID
   * @param {number} shiftData.departmentId - Department ID
   * @param {string} shiftData.shiftDate - Shift date (YYYY-MM-DD)
   * @param {string} shiftData.shiftType - Shift type (morning|afternoon|night)
   * @param {string} shiftData.startTime - Start time (HH:MM:SS)
   * @param {string} shiftData.endTime - End time (HH:MM:SS)
   * @param {number} shiftData.maxStaff - Maximum staff (default: 10)
   * @param {string} shiftData.note - Optional note
   * @returns {Promise<number>} - Shift ID
   * @throws {Error} - If validation fails
   */
  static async addShift(shiftData) {
    const {
      scheduleId,
      departmentId,
      shiftDate,
      shiftType,
      startTime,
      endTime,
      maxStaff = 10,
      note
    } = shiftData;

    // Validate required fields
    if (!scheduleId) {
      throw new Error('Schedule ID is required');
    }
    if (!departmentId) {
      throw new Error('Department ID is required');
    }
    if (!shiftDate) {
      throw new Error('Shift date is required');
    }
    if (!shiftType) {
      throw new Error('Shift type is required');
    }

    // Validate shift type
    const validShiftTypes = ['morning', 'afternoon', 'night'];
    if (!validShiftTypes.includes(shiftType)) {
      throw new Error(`Shift type must be one of: ${validShiftTypes.join(', ')}`);
    }

    // Verify schedule exists
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Validate date format (basic check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(shiftDate)) {
      throw new Error('Shift date must be in YYYY-MM-DD format');
    }

    // Validate max_staff
    if (maxStaff < 1 || maxStaff > 100) {
      throw new Error('Max staff must be between 1 and 100');
    }

    // Create the shift
    const shiftId = await Shift.create({
      schedule_id: scheduleId,
      department_id: departmentId,
      shift_date: shiftDate,
      shift_type: shiftType,
      start_time: startTime,
      end_time: endTime,
      max_staff: maxStaff,
      note
    });

    return shiftId;
  }

  /**
   * Assign a user to a shift
   * @param {Object} assignmentData - Assignment data
   * @param {number} assignmentData.shiftId - Shift ID
   * @param {number} assignmentData.userId - User ID to assign
   * @param {string} assignmentData.note - Optional note
   * @returns {Promise<number>} - Assignment ID
   * @throws {Error} - If validation fails
   */
  static async assignUserToShift(assignmentData) {
    const { shiftId, userId, note } = assignmentData;

    // Validate required fields
    if (!shiftId) {
      throw new Error('Shift ID is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verify shift exists
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    // Check if user is already assigned to this shift
    const existingAssignment = await ShiftAssignment.checkExistingAssignment(shiftId, userId);
    if (existingAssignment) {
      throw new Error('User is already assigned to this shift');
    }

    // Check if shift is at capacity
    const currentCount = await ShiftAssignment.getAssignmentCount(shiftId);
    if (currentCount >= shift.max_staff) {
      throw new Error(`Shift is at maximum capacity (${shift.max_staff} staff)`);
    }

    // Create the assignment
    const assignmentId = await ShiftAssignment.create({
      shift_id: shiftId,
      user_id: userId,
      status: 'assigned',
      note
    });

    return assignmentId;
  }

  /**
   * Get schedule with all shifts and assignments
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<Object>} - Schedule with shifts and assignments
   */
  static async getScheduleDetails(scheduleId) {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const shifts = await Shift.findBySchedule(scheduleId);
    
    // Get assignments for each shift
    for (const shift of shifts) {
      shift.assignments = await ShiftAssignment.findByShift(shift.shift_id);
    }

    return {
      ...schedule,
      shifts
    };
  }

  /**
   * Submit schedule for approval
   *
   * Rules:
   * - schedule.status must be 'draft'
   * - user.department_id must match schedule.source_department_id
   *
   * @param {number} scheduleId - Schedule ID
   * @param {{ user_id: number, department_id: number }} user - Requesting user
   * @returns {Promise<boolean>}
   * @throws {Error} If status is not draft or department does not match
   */
  static async submitSchedule(scheduleId, user) {
    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (schedule.status !== ScheduleStatus.DRAFT) {
      throw new Error('Only draft schedules can be submitted');
    }

    if (!SchedulePermissionService.canSubmit(user, schedule)) {
      throw new Error('You do not have permission to submit this schedule');
    }

    return await Schedule.updateStatus(scheduleId, ScheduleStatus.SUBMITTED);
  }

  /**
   * Approve schedule
   *
   * Rules:
   * - user.department_id must match schedule.owner_department_id (KHTH)
   * - schedule.status must be 'submitted'
   *
   * @param {number} scheduleId - Schedule ID
   * @param {{ user_id: number, department_id: number }} user - Requesting user
   * @returns {Promise<boolean>}
   * @throws {Error} If status is not submitted or user is not from owner department
   */
  static async approveSchedule(scheduleId, user) {
    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const canApproveWeeklyDraft = (
      schedule.schedule_type === ScheduleType.WEEKLY_WORK &&
      schedule.status === ScheduleStatus.DRAFT
    );

    if (schedule.status !== ScheduleStatus.SUBMITTED && !canApproveWeeklyDraft) {
      throw new Error('Only submitted schedules can be approved');
    }

    if (!SchedulePermissionService.canApprove(user, schedule)) {
      throw new Error('You do not have permission to approve this schedule');
    }

    return await Schedule.updateStatus(scheduleId, ScheduleStatus.APPROVED);
  }

  /**
   * Update schedule fields
   *
   * Rules:
   * - IF status = 'draft'              → only source_department can update
   * - IF status = 'submitted'/'approved' → only owner_department can update
   *
   * @param {number} scheduleId - Schedule ID
   * @param {{ user_id: number, department_id: number }} user - Requesting user
   * @param {Object} updateData - Fields to update (description, week, year, etc.)
   * @returns {Promise<boolean>}
   * @throws {Error} If not found or user lacks permission
   */
  static async updateSchedule(scheduleId, user, updateData) {
    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (!SchedulePermissionService.canUpdate(user, schedule)) {
      if (schedule.status === ScheduleStatus.DRAFT) {
        throw new Error('Only source department can update draft schedules');
      }

      if (schedule.status === ScheduleStatus.SUBMITTED) {
        throw new Error('Only owner department can update submitted schedules');
      }

      if (schedule.status === ScheduleStatus.APPROVED) {
        throw new Error('Only owner department can update approved schedules');
      }
    }

    return await Schedule.update(scheduleId, updateData);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // weekly_work schedule methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a weekly_work schedule.
   *
   * Rules:
   * - Only a MANAGER scoped to the KHTH department may create.
   * - schedule_type = weekly_work
   * - source_department_id = owner_department_id = KHTH
   * - status = draft
   * - Duplicate (same week/year) is rejected.
   *
   * @param {Object}  data
   * @param {number}  data.userId       - Creator (must be KHTH MANAGER)
   * @param {number}  data.week         - ISO week number (1-53)
   * @param {number}  data.year         - 4-digit year
   * @param {string}  [data.description]
   * @returns {Promise<number>} New schedule ID
   */
  static async createWeeklySchedule(data) {
    const { userId, week, year, description } = data;

    if (!userId) throw new Error('User ID is required');
    if (!week || week < 1 || week > 53) throw new Error('Week must be between 1 and 53');
    if (!year || year < 2000 || year > 2100) throw new Error('Year must be between 2000 and 2100');

    // Resolve KHTH as both source and owner
    const khth = await Department.findByCode('KHTH');
    if (!khth) throw new Error('KHTH department not found in system');

    const hasManagerRole = await this.hasRole(userId, 'MANAGER', 'department', khth.department_id);
    const hasStaffRole = await this.hasRole(userId, 'STAFF', 'department', khth.department_id);

    if (!hasManagerRole && !hasStaffRole) {
      throw new Error('Only KHTH STAFF or MANAGER can create weekly work schedules');
    }

    // Duplicate check (same week/year for weekly_work)
    const existing = await Schedule.checkExists(
      ScheduleType.WEEKLY_WORK,
      khth.department_id,
      week,
      year
    );
    if (existing) {
      throw new Error(`Weekly work schedule already exists for week ${week}/${year}`);
    }

    const scheduleId = await Schedule.create({
      schedule_type: ScheduleType.WEEKLY_WORK,
      department_id: khth.department_id,
      week,
      year,
      description: description || `Weekly work schedule for week ${week}/${year}`,
      created_by: userId,
      status: ScheduleStatus.DRAFT,
      source_department_id: khth.department_id,
      owner_department_id: khth.department_id
    });

    return scheduleId;
  }

  /**
   * Add a work item to a weekly_work schedule.
   *
   * Rules:
   * - Schedule must exist and be of type weekly_work.
   * - work_date must be in YYYY-MM-DD format.
   * - content is required.
   *
   * @param {Object}  data
   * @param {number}  data.scheduleId   - Target schedule
   * @param {string}  data.workDate     - YYYY-MM-DD
   * @param {string}  data.content      - Work description
   * @param {string}  [data.location]   - Optional venue
   * @param {string}  [data.participants] - Optional participant list
   * @returns {Promise<number>} New WeeklyWorkItem ID
   */
  static async addWeeklyWorkItem(data) {
    const {
      scheduleId,
      workDate,
      timePeriod = 'Sáng',
      content,
      location,
      participantIds,
      participants,
    } = data;

    if (!scheduleId) throw new Error('Schedule ID is required');
    if (!workDate)   throw new Error('Work date is required');
    if (!content)    throw new Error('Content is required');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(workDate)) {
      throw new Error('Work date must be in YYYY-MM-DD format');
    }

    const validTimePeriods = ['Sáng', 'Chiều'];
    if (!validTimePeriods.includes(timePeriod)) {
      throw new Error('Time period must be "Sáng" or "Chiều"');
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) throw new Error('Schedule not found');

    if (schedule.schedule_type !== ScheduleType.WEEKLY_WORK) {
      throw new Error('Work items can only be added to weekly_work schedules');
    }

    let normalizedParticipantIds = [];

    if (Array.isArray(participantIds)) {
      normalizedParticipantIds = participantIds;
    } else if (typeof participants === 'string' && participants.trim()) {
      const rawValue = participants.trim();

      if (rawValue.startsWith('[')) {
        try {
          const parsed = JSON.parse(rawValue);
          if (Array.isArray(parsed)) {
            normalizedParticipantIds = parsed;
          }
        } catch (error) {
          normalizedParticipantIds = [];
        }
      } else {
        normalizedParticipantIds = rawValue
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
      }
    }

    const itemId = await WeeklyWorkItem.create({
      schedule_id:  scheduleId,
      work_date:    workDate,
      time_period:  timePeriod,
      content,
      location:     location || null,
      participantIds: normalizedParticipantIds
    });

    return itemId;
  }

  /**
   * Import weekly work items from parsed rows.
   * Strategy: import valid rows, skip invalid rows, and return per-row errors.
   *
   * @param {Object} data
   * @param {number} data.scheduleId
   * @param {Array<Object>} data.items
   * @returns {Promise<{totalRows:number,successCount:number,failedCount:number,errors:Array}>}
   */
  static async importWeeklyWorkItems(data) {
    const { scheduleId, items } = data;

    if (!scheduleId) throw new Error('Schedule ID is required');
    if (!Array.isArray(items)) throw new Error('Items must be an array');

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) throw new Error('Schedule not found');

    if (schedule.schedule_type !== ScheduleType.WEEKLY_WORK) {
      throw new Error('Work items can only be imported to weekly_work schedules');
    }

    const errors = [];
    let successCount = 0;

    for (let index = 0; index < items.length; index += 1) {
      const row = items[index] || {};
      const rowNumber = row.rowNumber || index + 2;

      const workDate = String(row.work_date || '').trim();
      const timePeriod = String(row.time_period || 'Sáng').trim();
      const content = String(row.content || '').trim();
      const location = row.location ? String(row.location).trim() : null;
      const participants = row.participants ? String(row.participants).trim() : null;
      let parsedParticipantIds = [];

      if (participants) {
        if (participants.startsWith('[')) {
          try {
            const parsed = JSON.parse(participants);
            if (Array.isArray(parsed)) {
              parsedParticipantIds = parsed;
            }
          } catch (error) {
            parsedParticipantIds = [];
          }
        } else {
          parsedParticipantIds = participants
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
        }
      }

      if (!workDate) {
        errors.push({ row: rowNumber, field: 'work_date', message: 'Thiếu ngày công tác' });
        continue;
      }

      if (!content) {
        errors.push({ row: rowNumber, field: 'content', message: 'Thiếu nội dung công tác' });
        continue;
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(workDate)) {
        errors.push({
          row: rowNumber,
          field: 'work_date',
          message: 'Ngày công tác phải theo định dạng YYYY-MM-DD'
        });
        continue;
      }

      const validTimePeriods = ['Sáng', 'Chiều'];
      if (!validTimePeriods.includes(timePeriod)) {
        errors.push({
          row: rowNumber,
          field: 'time_period',
          message: 'Giờ công tác phải là "Sáng" hoặc "Chiều"'
        });
        continue;
      }

      try {
        await WeeklyWorkItem.create({
          schedule_id: scheduleId,
          work_date: workDate,
          time_period: timePeriod,
          content,
          location,
          participantIds: parsedParticipantIds
        });
        successCount += 1;
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'database',
          message: error.message || 'Lỗi lưu dữ liệu vào hệ thống'
        });
      }
    }

    return {
      totalRows: items.length,
      successCount,
      failedCount: errors.length,
      errors
    };
  }

  /**
   * Approve a weekly_work schedule.
   *
   * Rules:
   * - Schedule must be of type weekly_work.
   * - Status must be 'submitted'.
   * - user.department_id must match schedule.owner_department_id (KHTH).
   *
   * @param {number}  scheduleId
   * @param {{ userId: number, department_id: number }} user
   * @returns {Promise<boolean>}
   */
  static async approveWeeklySchedule(scheduleId, user) {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) throw new Error('Schedule not found');

    if (schedule.schedule_type !== ScheduleType.WEEKLY_WORK) {
      throw new Error('This action is only valid for weekly_work schedules');
    }

    if (schedule.status !== ScheduleStatus.SUBMITTED) {
      throw new Error('Only submitted schedules can be approved');
    }

    if (!SchedulePermissionService.canApprove(user, schedule)) {
      throw new Error('You do not have permission to approve this schedule');
    }

    return await Schedule.updateStatus(scheduleId, ScheduleStatus.APPROVED);
  }
}

module.exports = ScheduleService;
