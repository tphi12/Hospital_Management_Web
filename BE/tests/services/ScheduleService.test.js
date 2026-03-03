const ScheduleService = require('../../src/services/ScheduleService');
const Schedule = require('../../src/models/Schedule');
const Shift = require('../../src/models/Shift');
const ShiftAssignment = require('../../src/models/ShiftAssignment');
const WeeklyWorkItem = require('../../src/models/WeeklyWorkItem');
const Role = require('../../src/models/Role');
const Department = require('../../src/models/Department');
const { ScheduleType, ScheduleStatus } = require('../../src/utils/enums');

// Mock all model dependencies
jest.mock('../../src/models/Schedule');
jest.mock('../../src/models/Shift');
jest.mock('../../src/models/ShiftAssignment');
jest.mock('../../src/models/WeeklyWorkItem');
jest.mock('../../src/models/Role');
jest.mock('../../src/models/Department');

describe('ScheduleService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createDutySchedule', () => {
    const validScheduleData = {
      userId: 1,
      departmentId: 3,
      week: 10,
      year: 2024,
      description: 'Test duty schedule'
    };

    const mockUserRoles = [
      {
        role_code: 'CLERK',
        scope_type: 'department',
        department_id: 3
      }
    ];

    const mockKhthDepartment = {
      department_id: 2,
      department_code: 'KHTH',
      department_name: 'Phòng Kế Hoạch Tổng Hợp'
    };

    it('should successfully create a duty schedule with valid data', async () => {
      // Arrange
      Role.getUserRoles.mockResolvedValue(mockUserRoles);
      Schedule.checkExists.mockResolvedValue(null);
      Department.findByCode.mockResolvedValue(mockKhthDepartment);
      Schedule.create.mockResolvedValue(100);

      // Act
      const scheduleId = await ScheduleService.createDutySchedule(validScheduleData);

      // Assert
      expect(scheduleId).toBe(100);
      expect(Role.getUserRoles).toHaveBeenCalledWith(validScheduleData.userId);
      expect(Schedule.checkExists).toHaveBeenCalledWith(
        ScheduleType.DUTY,
        validScheduleData.departmentId,
        validScheduleData.week,
        validScheduleData.year
      );
      expect(Department.findByCode).toHaveBeenCalledWith('KHTH');
      expect(Schedule.create).toHaveBeenCalledWith({
        schedule_type: ScheduleType.DUTY,
        department_id: validScheduleData.departmentId,
        week: validScheduleData.week,
        year: validScheduleData.year,
        description: validScheduleData.description,
        created_by: validScheduleData.userId,
        status: ScheduleStatus.DRAFT,
        source_department_id: validScheduleData.departmentId,
        owner_department_id: mockKhthDepartment.department_id
      });
    });

    it('should fail when user does not have CLERK role', async () => {
      // Arrange - User has different role
      Role.getUserRoles.mockResolvedValue([
        {
          role_code: 'STAFF',
          scope_type: 'department',
          department_id: 3
        }
      ]);

      // Act & Assert
      await expect(ScheduleService.createDutySchedule(validScheduleData))
        .rejects
        .toThrow('Only CLERK with department scope can create duty schedules');

      expect(Schedule.create).not.toHaveBeenCalled();
    });

    it('should fail when user has CLERK but wrong scope', async () => {
      // Arrange - User has hospital scope instead of department
      Role.getUserRoles.mockResolvedValue([
        {
          role_code: 'CLERK',
          scope_type: 'hospital',
          department_id: null
        }
      ]);

      // Act & Assert
      await expect(ScheduleService.createDutySchedule(validScheduleData))
        .rejects
        .toThrow('Only CLERK with department scope can create duty schedules');

      expect(Schedule.create).not.toHaveBeenCalled();
    });

    it('should fail when user has CLERK but for different department', async () => {
      // Arrange - User has CLERK role but for department 5, not 3
      Role.getUserRoles.mockResolvedValue([
        {
          role_code: 'CLERK',
          scope_type: 'department',
          department_id: 5
        }
      ]);

      // Act & Assert
      await expect(ScheduleService.createDutySchedule(validScheduleData))
        .rejects
        .toThrow('Only CLERK with department scope can create duty schedules');

      expect(Schedule.create).not.toHaveBeenCalled();
    });

    it('should fail when duplicate schedule exists for same week/year/department', async () => {
      // Arrange
      Role.getUserRoles.mockResolvedValue(mockUserRoles);
      Schedule.checkExists.mockResolvedValue({ schedule_id: 50 }); // Existing schedule

      // Act & Assert
      await expect(ScheduleService.createDutySchedule(validScheduleData))
        .rejects
        .toThrow('Duty schedule already exists for week 10/2024 in this department');

      expect(Department.findByCode).not.toHaveBeenCalled();
      expect(Schedule.create).not.toHaveBeenCalled();
    });

    it('should fail when week is invalid', async () => {
      // Arrange
      const invalidData = { ...validScheduleData, week: 54 };

      // Act & Assert
      await expect(ScheduleService.createDutySchedule(invalidData))
        .rejects
        .toThrow('Week must be between 1 and 53');

      expect(Schedule.create).not.toHaveBeenCalled();
    });

    it('should fail when year is invalid', async () => {
      // Arrange
      const invalidData = { ...validScheduleData, year: 1999 };

      // Act & Assert
      await expect(ScheduleService.createDutySchedule(invalidData))
        .rejects
        .toThrow('Year must be between 2000 and 2100');

      expect(Schedule.create).not.toHaveBeenCalled();
    });

    it('should fail when userId is missing', async () => {
      // Arrange
      const invalidData = { ...validScheduleData, userId: null };

      // Act & Assert
      await expect(ScheduleService.createDutySchedule(invalidData))
        .rejects
        .toThrow('User ID is required');
    });

    it('should fail when departmentId is missing', async () => {
      // Arrange
      const invalidData = { ...validScheduleData, departmentId: null };

      // Act & Assert
      await expect(ScheduleService.createDutySchedule(invalidData))
        .rejects
        .toThrow('Department ID is required');
    });

    it('should fail when KHTH department is not found', async () => {
      // Arrange
      Role.getUserRoles.mockResolvedValue(mockUserRoles);
      Schedule.checkExists.mockResolvedValue(null);
      Department.findByCode.mockResolvedValue(null); // KHTH not found

      // Act & Assert
      await expect(ScheduleService.createDutySchedule(validScheduleData))
        .rejects
        .toThrow('KHTH department not found in system');

      expect(Schedule.create).not.toHaveBeenCalled();
    });
  });

  describe('addShift', () => {
    const validShiftData = {
      scheduleId: 100,
      departmentId: 3,
      shiftDate: '2024-03-04',
      shiftType: 'morning',
      startTime: '07:00:00',
      endTime: '12:00:00',
      maxStaff: 5,
      note: 'Test shift'
    };

    const mockSchedule = {
      schedule_id: 100,
      schedule_type: 'duty',
      status: 'draft'
    };

    it('should successfully add a shift with valid data', async () => {
      // Arrange
      Schedule.findById.mockResolvedValue(mockSchedule);
      Shift.create.mockResolvedValue(200);

      // Act
      const shiftId = await ScheduleService.addShift(validShiftData);

      // Assert
      expect(shiftId).toBe(200);
      expect(Schedule.findById).toHaveBeenCalledWith(validShiftData.scheduleId);
      expect(Shift.create).toHaveBeenCalledWith({
        schedule_id: validShiftData.scheduleId,
        department_id: validShiftData.departmentId,
        shift_date: validShiftData.shiftDate,
        shift_type: validShiftData.shiftType,
        start_time: validShiftData.startTime,
        end_time: validShiftData.endTime,
        max_staff: validShiftData.maxStaff,
        note: validShiftData.note
      });
    });

    it('should fail when schedule does not exist', async () => {
      // Arrange
      Schedule.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(ScheduleService.addShift(validShiftData))
        .rejects
        .toThrow('Schedule not found');

      expect(Shift.create).not.toHaveBeenCalled();
    });

    it('should fail when shift type is invalid', async () => {
      // Arrange
      const invalidData = { ...validShiftData, shiftType: 'invalid_type' };
      Schedule.findById.mockResolvedValue(mockSchedule);

      // Act & Assert
      await expect(ScheduleService.addShift(invalidData))
        .rejects
        .toThrow('Shift type must be one of: morning, afternoon, night');

      expect(Shift.create).not.toHaveBeenCalled();
    });

    it('should fail when shift date format is invalid', async () => {
      // Arrange
      const invalidData = { ...validShiftData, shiftDate: '04/03/2024' };
      Schedule.findById.mockResolvedValue(mockSchedule);

      // Act & Assert
      await expect(ScheduleService.addShift(invalidData))
        .rejects
        .toThrow('Shift date must be in YYYY-MM-DD format');

      expect(Shift.create).not.toHaveBeenCalled();
    });

    it('should fail when maxStaff is too high', async () => {
      // Arrange
      const invalidData = { ...validShiftData, maxStaff: 101 };
      Schedule.findById.mockResolvedValue(mockSchedule);

      // Act & Assert
      await expect(ScheduleService.addShift(invalidData))
        .rejects
        .toThrow('Max staff must be between 1 and 100');

      expect(Shift.create).not.toHaveBeenCalled();
    });

    it('should use default maxStaff value when not provided', async () => {
      // Arrange
      const dataWithoutMaxStaff = { ...validShiftData };
      delete dataWithoutMaxStaff.maxStaff;
      Schedule.findById.mockResolvedValue(mockSchedule);
      Shift.create.mockResolvedValue(200);

      // Act
      await ScheduleService.addShift(dataWithoutMaxStaff);

      // Assert
      expect(Shift.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_staff: 10 // Default value
        })
      );
    });
  });

  describe('assignUserToShift', () => {
    const validAssignmentData = {
      shiftId: 200,
      userId: 10,
      note: 'Regular assignment'
    };

    const mockShift = {
      shift_id: 200,
      max_staff: 5,
      assigned_count: 2
    };

    it('should successfully assign user to shift', async () => {
      // Arrange
      Shift.findById.mockResolvedValue(mockShift);
      ShiftAssignment.checkExistingAssignment.mockResolvedValue(null);
      ShiftAssignment.getAssignmentCount.mockResolvedValue(2);
      ShiftAssignment.create.mockResolvedValue(300);

      // Act
      const assignmentId = await ScheduleService.assignUserToShift(validAssignmentData);

      // Assert
      expect(assignmentId).toBe(300);
      expect(Shift.findById).toHaveBeenCalledWith(validAssignmentData.shiftId);
      expect(ShiftAssignment.checkExistingAssignment).toHaveBeenCalledWith(
        validAssignmentData.shiftId,
        validAssignmentData.userId
      );
      expect(ShiftAssignment.getAssignmentCount).toHaveBeenCalledWith(validAssignmentData.shiftId);
      expect(ShiftAssignment.create).toHaveBeenCalledWith({
        shift_id: validAssignmentData.shiftId,
        user_id: validAssignmentData.userId,
        status: 'assigned',
        note: validAssignmentData.note
      });
    });

    it('should fail when shift does not exist', async () => {
      // Arrange
      Shift.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(ScheduleService.assignUserToShift(validAssignmentData))
        .rejects
        .toThrow('Shift not found');

      expect(ShiftAssignment.create).not.toHaveBeenCalled();
    });

    it('should fail when user is already assigned to shift', async () => {
      // Arrange
      Shift.findById.mockResolvedValue(mockShift);
      ShiftAssignment.checkExistingAssignment.mockResolvedValue({
        shift_assignment_id: 250
      });

      // Act & Assert
      await expect(ScheduleService.assignUserToShift(validAssignmentData))
        .rejects
        .toThrow('User is already assigned to this shift');

      expect(ShiftAssignment.create).not.toHaveBeenCalled();
    });

    it('should fail when shift is at maximum capacity', async () => {
      // Arrange
      Shift.findById.mockResolvedValue(mockShift);
      ShiftAssignment.checkExistingAssignment.mockResolvedValue(null);
      ShiftAssignment.getAssignmentCount.mockResolvedValue(5); // At max capacity

      // Act & Assert
      await expect(ScheduleService.assignUserToShift(validAssignmentData))
        .rejects
        .toThrow('Shift is at maximum capacity (5 staff)');

      expect(ShiftAssignment.create).not.toHaveBeenCalled();
    });

    it('should fail when shiftId is missing', async () => {
      // Arrange
      const invalidData = { ...validAssignmentData, shiftId: null };

      // Act & Assert
      await expect(ScheduleService.assignUserToShift(invalidData))
        .rejects
        .toThrow('Shift ID is required');
    });

    it('should fail when userId is missing', async () => {
      // Arrange
      const invalidData = { ...validAssignmentData, userId: null };

      // Act & Assert
      await expect(ScheduleService.assignUserToShift(invalidData))
        .rejects
        .toThrow('User ID is required');
    });
  });

  describe('getScheduleDetails', () => {
    it('should return schedule with shifts and assignments', async () => {
      // Arrange
      const mockSchedule = { schedule_id: 100, week: 10, year: 2024 };
      const mockShifts = [
        { shift_id: 200, shift_type: 'morning' },
        { shift_id: 201, shift_type: 'afternoon' }
      ];
      const mockAssignments = [
        { shift_assignment_id: 300, user_id: 10 }
      ];

      Schedule.findById.mockResolvedValue(mockSchedule);
      Shift.findBySchedule.mockResolvedValue(mockShifts);
      ShiftAssignment.findByShift.mockResolvedValue(mockAssignments);

      // Act
      const result = await ScheduleService.getScheduleDetails(100);

      // Assert
      expect(result).toEqual({
        ...mockSchedule,
        shifts: mockShifts.map(shift => ({
          ...shift,
          assignments: mockAssignments
        }))
      });
    });

    it('should fail when schedule does not exist', async () => {
      // Arrange
      Schedule.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(ScheduleService.getScheduleDetails(100))
        .rejects
        .toThrow('Schedule not found');
    });
  });

  describe('submitSchedule', () => {
    const mockScheduleDraft = {
      schedule_id: 100,
      status: 'draft',
      source_department_id: 3
    };

    it('clerk can submit own draft when department matches source_department_id', async () => {
      // Arrange
      const user = { user_id: 5, department_id: 3 };
      Schedule.findById.mockResolvedValue(mockScheduleDraft);
      Schedule.updateStatus.mockResolvedValue(true);

      // Act
      const result = await ScheduleService.submitSchedule(100, user);

      // Assert
      expect(result).toBe(true);
      expect(Schedule.updateStatus).toHaveBeenCalledWith(100, ScheduleStatus.SUBMITTED);
    });

    it('cannot submit another department schedule (wrong department)', async () => {
      // Arrange — user belongs to department 5, schedule owned by department 3
      const user = { user_id: 5, department_id: 5 };
      Schedule.findById.mockResolvedValue(mockScheduleDraft);

      // Act & Assert
      await expect(ScheduleService.submitSchedule(100, user))
        .rejects
        .toThrow('You do not have permission to submit this schedule');

      expect(Schedule.updateStatus).not.toHaveBeenCalled();
    });

    it('cannot resubmit a schedule that is no longer in draft', async () => {
      // Arrange — schedule is already submitted
      const user = { user_id: 5, department_id: 3 };
      Schedule.findById.mockResolvedValue({
        ...mockScheduleDraft,
        status: 'submitted'
      });

      // Act & Assert
      await expect(ScheduleService.submitSchedule(100, user))
        .rejects
        .toThrow('Only draft schedules can be submitted');

      expect(Schedule.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('approveSchedule', () => {
    const mockScheduleSubmitted = {
      schedule_id: 100,
      status: 'submitted',
      owner_department_id: 2
    };

    it('KHTH staff can approve a submitted schedule', async () => {
      // Arrange — user belongs to KHTH (department_id=2), schedule owner_department_id=2
      const user = { user_id: 10, department_id: 2 };
      Schedule.findById.mockResolvedValue(mockScheduleSubmitted);
      Schedule.updateStatus.mockResolvedValue(true);

      // Act
      const result = await ScheduleService.approveSchedule(100, user);

      // Assert
      expect(result).toBe(true);
      expect(Schedule.updateStatus).toHaveBeenCalledWith(100, ScheduleStatus.APPROVED);
    });

    it('non-KHTH staff cannot approve (wrong owner_department)', async () => {
      // Arrange — user belongs to department 5, not the owner department 2
      const user = { user_id: 10, department_id: 5 };
      Schedule.findById.mockResolvedValue(mockScheduleSubmitted);

      // Act & Assert
      await expect(ScheduleService.approveSchedule(100, user))
        .rejects
        .toThrow('You do not have permission to approve this schedule');

      expect(Schedule.updateStatus).not.toHaveBeenCalled();
    });

    it('cannot approve a schedule that is not submitted (e.g. draft)', async () => {
      // Arrange — schedule is still in draft state
      const user = { user_id: 10, department_id: 2 };
      Schedule.findById.mockResolvedValue({
        ...mockScheduleSubmitted,
        status: 'draft'
      });

      // Act & Assert
      await expect(ScheduleService.approveSchedule(100, user))
        .rejects
        .toThrow('Only submitted schedules can be approved');

      expect(Schedule.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('updateSchedule', () => {
    const updateData = { description: 'Updated description' };

    it('source_department can update a draft schedule', async () => {
      // Arrange — user is in department 3 (same as source_department_id)
      const user = { user_id: 5, department_id: 3 };
      const mockSchedule = {
        schedule_id: 100,
        status: 'draft',
        source_department_id: 3,
        owner_department_id: 2
      };
      Schedule.findById.mockResolvedValue(mockSchedule);
      Schedule.update.mockResolvedValue(true);

      // Act
      const result = await ScheduleService.updateSchedule(100, user, updateData);

      // Assert
      expect(result).toBe(true);
      expect(Schedule.update).toHaveBeenCalledWith(100, updateData);
    });

    it('wrong department cannot update a draft schedule', async () => {
      // Arrange — user is in department 5, source is department 3
      const user = { user_id: 5, department_id: 5 };
      const mockSchedule = {
        schedule_id: 100,
        status: 'draft',
        source_department_id: 3,
        owner_department_id: 2
      };
      Schedule.findById.mockResolvedValue(mockSchedule);

      // Act & Assert
      await expect(ScheduleService.updateSchedule(100, user, updateData))
        .rejects
        .toThrow('Only source department can update draft schedules');

      expect(Schedule.update).not.toHaveBeenCalled();
    });

    it('submitted schedule cannot be updated (even by owner_department)', async () => {
      // Arrange — user is in KHTH (department_id=2), schedule is submitted
      const user = { user_id: 10, department_id: 2 };
      const mockSchedule = {
        schedule_id: 100,
        status: 'submitted',
        source_department_id: 3,
        owner_department_id: 2
      };
      Schedule.findById.mockResolvedValue(mockSchedule);

      // Act & Assert
      await expect(ScheduleService.updateSchedule(100, user, updateData))
        .rejects
        .toThrow('Submitted schedules cannot be updated');

      expect(Schedule.update).not.toHaveBeenCalled();
    });

    it('wrong department cannot update a submitted schedule (same submitted lock)', async () => {
      // Arrange — source department 3 tries to update after submission
      const user = { user_id: 5, department_id: 3 };
      const mockSchedule = {
        schedule_id: 100,
        status: 'submitted',
        source_department_id: 3,
        owner_department_id: 2
      };
      Schedule.findById.mockResolvedValue(mockSchedule);

      // Act & Assert
      await expect(ScheduleService.updateSchedule(100, user, updateData))
        .rejects
        .toThrow('Submitted schedules cannot be updated');

      expect(Schedule.update).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // weekly_work schedule methods
  // ─────────────────────────────────────────────────────────────────────────

  describe('createWeeklySchedule', () => {
    const mockKhth = { department_id: 2, department_code: 'KHTH' };
    const mockManagerRoles = [
      { role_code: 'MANAGER', scope_type: 'department', department_id: 2 }
    ];

    it('KHTH MANAGER can create a weekly work schedule', async () => {
      // Arrange
      Department.findByCode.mockResolvedValue(mockKhth);
      Role.getUserRoles.mockResolvedValue(mockManagerRoles);
      Schedule.checkExists.mockResolvedValue(null);
      Schedule.create.mockResolvedValue(200);

      // Act
      const id = await ScheduleService.createWeeklySchedule({
        userId: 10,
        week: 5,
        year: 2025,
        description: 'Week 5 work plan'
      });

      // Assert
      expect(id).toBe(200);
      expect(Department.findByCode).toHaveBeenCalledWith('KHTH');
      expect(Schedule.checkExists).toHaveBeenCalledWith(
        ScheduleType.WEEKLY_WORK, mockKhth.department_id, 5, 2025
      );
      expect(Schedule.create).toHaveBeenCalledWith(expect.objectContaining({
        schedule_type: ScheduleType.WEEKLY_WORK,
        status: ScheduleStatus.DRAFT,
        source_department_id: mockKhth.department_id,
        owner_department_id: mockKhth.department_id
      }));
    });

    it('non-MANAGER cannot create a weekly work schedule', async () => {
      // Arrange — user has CLERK role, not MANAGER
      Department.findByCode.mockResolvedValue(mockKhth);
      Role.getUserRoles.mockResolvedValue([
        { role_code: 'CLERK', scope_type: 'department', department_id: 2 }
      ]);

      await expect(
        ScheduleService.createWeeklySchedule({ userId: 10, week: 5, year: 2025 })
      ).rejects.toThrow('Only KHTH MANAGER can create weekly work schedules');

      expect(Schedule.create).not.toHaveBeenCalled();
    });

    it('MANAGER from a non-KHTH department cannot create weekly work schedule', async () => {
      // Arrange — user is MANAGER but scoped to dept 3, not KHTH (dept 2)
      Department.findByCode.mockResolvedValue(mockKhth);
      Role.getUserRoles.mockResolvedValue([
        { role_code: 'MANAGER', scope_type: 'department', department_id: 3 }
      ]);

      await expect(
        ScheduleService.createWeeklySchedule({ userId: 10, week: 5, year: 2025 })
      ).rejects.toThrow('Only KHTH MANAGER can create weekly work schedules');

      expect(Schedule.create).not.toHaveBeenCalled();
    });

    it('duplicate week/year is rejected', async () => {
      // Arrange — a weekly_work schedule already exists for this week/year
      Department.findByCode.mockResolvedValue(mockKhth);
      Role.getUserRoles.mockResolvedValue(mockManagerRoles);
      Schedule.checkExists.mockResolvedValue({ schedule_id: 99 });

      await expect(
        ScheduleService.createWeeklySchedule({ userId: 10, week: 5, year: 2025 })
      ).rejects.toThrow('Weekly work schedule already exists for week 5/2025');

      expect(Schedule.create).not.toHaveBeenCalled();
    });

    it('invalid week number is rejected', async () => {
      await expect(
        ScheduleService.createWeeklySchedule({ userId: 10, week: 54, year: 2025 })
      ).rejects.toThrow('Week must be between 1 and 53');
    });
  });

  describe('addWeeklyWorkItem', () => {
    const mockWeeklySchedule = {
      schedule_id: 200,
      schedule_type: 'weekly_work',
      status: 'draft'
    };

    it('adds a work item with all fields to a weekly_work schedule', async () => {
      // Arrange
      Schedule.findById.mockResolvedValue(mockWeeklySchedule);
      WeeklyWorkItem.create.mockResolvedValue(500);

      // Act
      const itemId = await ScheduleService.addWeeklyWorkItem({
        scheduleId:   200,
        workDate:     '2025-02-03',
        content:      'Hospital quality review meeting',
        location:     'Conference Room A',
        participants: 'Dr. Anh, Nurse Thu, Admin Hoa'
      });

      // Assert
      expect(itemId).toBe(500);
      expect(WeeklyWorkItem.create).toHaveBeenCalledWith({
        schedule_id:  200,
        work_date:    '2025-02-03',
        content:      'Hospital quality review meeting',
        location:     'Conference Room A',
        participants: 'Dr. Anh, Nurse Thu, Admin Hoa'
      });
    });

    it('adds a work item with only required fields (location/participants are null)', async () => {
      Schedule.findById.mockResolvedValue(mockWeeklySchedule);
      WeeklyWorkItem.create.mockResolvedValue(501);

      const itemId = await ScheduleService.addWeeklyWorkItem({
        scheduleId: 200,
        workDate:   '2025-02-04',
        content:    'Budget planning'
      });

      expect(itemId).toBe(501);
      expect(WeeklyWorkItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ location: null, participants: null })
      );
    });

    it('rejects when schedule does not exist', async () => {
      Schedule.findById.mockResolvedValue(null);

      await expect(
        ScheduleService.addWeeklyWorkItem({ scheduleId: 999, workDate: '2025-02-03', content: 'x' })
      ).rejects.toThrow('Schedule not found');

      expect(WeeklyWorkItem.create).not.toHaveBeenCalled();
    });

    it('rejects when schedule is a duty schedule (wrong type)', async () => {
      Schedule.findById.mockResolvedValue({
        schedule_id: 200,
        schedule_type: 'duty',
        status: 'draft'
      });

      await expect(
        ScheduleService.addWeeklyWorkItem({ scheduleId: 200, workDate: '2025-02-03', content: 'x' })
      ).rejects.toThrow('Work items can only be added to weekly_work schedules');

      expect(WeeklyWorkItem.create).not.toHaveBeenCalled();
    });

    it('rejects an invalid date format', async () => {
      await expect(
        ScheduleService.addWeeklyWorkItem({ scheduleId: 200, workDate: '03/02/2025', content: 'x' })
      ).rejects.toThrow('Work date must be in YYYY-MM-DD format');
    });

    it('rejects when content is missing', async () => {
      await expect(
        ScheduleService.addWeeklyWorkItem({ scheduleId: 200, workDate: '2025-02-03', content: '' })
      ).rejects.toThrow('Content is required');
    });
  });

  describe('approveWeeklySchedule', () => {
    const KHTH_DEPT = 2;

    const mockWeeklySubmitted = {
      schedule_id:          200,
      schedule_type:        'weekly_work',
      status:               'submitted',
      owner_department_id:  KHTH_DEPT
    };

    it('KHTH user can approve a submitted weekly_work schedule', async () => {
      // Arrange
      const user = { userId: 10, department_id: KHTH_DEPT };
      Schedule.findById.mockResolvedValue(mockWeeklySubmitted);
      Schedule.updateStatus.mockResolvedValue(true);

      // Act
      const result = await ScheduleService.approveWeeklySchedule(200, user);

      // Assert
      expect(result).toBe(true);
      expect(Schedule.updateStatus).toHaveBeenCalledWith(200, ScheduleStatus.APPROVED);
    });

    it('non-KHTH user cannot approve (wrong department)', async () => {
      const user = { userId: 10, department_id: 3 };
      Schedule.findById.mockResolvedValue(mockWeeklySubmitted);

      await expect(ScheduleService.approveWeeklySchedule(200, user))
        .rejects.toThrow('You do not have permission to approve this schedule');

      expect(Schedule.updateStatus).not.toHaveBeenCalled();
    });

    it('cannot approve a draft weekly_work schedule (must be submitted first)', async () => {
      const user = { userId: 10, department_id: KHTH_DEPT };
      Schedule.findById.mockResolvedValue({ ...mockWeeklySubmitted, status: 'draft' });

      await expect(ScheduleService.approveWeeklySchedule(200, user))
        .rejects.toThrow('Only submitted schedules can be approved');

      expect(Schedule.updateStatus).not.toHaveBeenCalled();
    });

    it('cannot use approveWeeklySchedule on a duty schedule (wrong type)', async () => {
      const user = { userId: 10, department_id: KHTH_DEPT };
      Schedule.findById.mockResolvedValue({
        ...mockWeeklySubmitted,
        schedule_type: 'duty'
      });

      await expect(ScheduleService.approveWeeklySchedule(200, user))
        .rejects.toThrow('This action is only valid for weekly_work schedules');

      expect(Schedule.updateStatus).not.toHaveBeenCalled();
    });

    it('returns schedule not found for a missing schedule', async () => {
      Schedule.findById.mockResolvedValue(null);

      await expect(ScheduleService.approveWeeklySchedule(999, { userId: 10, department_id: KHTH_DEPT }))
        .rejects.toThrow('Schedule not found');
    });
  });
});
