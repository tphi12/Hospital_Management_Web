jest.mock('../../src/models/Schedule', () => ({
  findById: jest.fn(),
}));

jest.mock('../../src/models/Shift', () => ({
  findBySchedule: jest.fn(),
}));

jest.mock('../../src/models/ShiftAssignment', () => ({
  findByShift: jest.fn(),
  findByUser: jest.fn(),
}));

jest.mock('../../src/models/WeeklyWorkItem', () => ({
  findBySchedule: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../src/models/Department', () => ({}));
jest.mock('../../src/services/ScheduleService', () => ({}));
jest.mock('../../src/services/SchedulePdfService', () => ({
  exportDutySchedule: jest.fn(),
  exportWeeklyWorkSchedule: jest.fn(),
}));
jest.mock('../../src/services/SchedulePermissionService', () => ({
  canView: jest.fn(),
  canExport: jest.fn(),
}));

const Schedule = require('../../src/models/Schedule');
const ShiftAssignment = require('../../src/models/ShiftAssignment');
const WeeklyWorkItem = require('../../src/models/WeeklyWorkItem');
const SchedulePdfService = require('../../src/services/SchedulePdfService');
const SchedulePermissionService = require('../../src/services/SchedulePermissionService');
const scheduleController = require('../../src/controllers/scheduleController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    send: jest.fn(),
  };
}

describe('scheduleController permission guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWeeklyWorkItems', () => {
    it('returns 403 when requester cannot view the weekly schedule', async () => {
      Schedule.findById.mockResolvedValue({
        schedule_id: 10,
        schedule_type: 'weekly_work',
        status: 'draft',
      });
      SchedulePermissionService.canView.mockReturnValue(false);

      const req = { params: { id: '10' }, user: { userId: 99 } };
      const res = createRes();

      await scheduleController.getWeeklyWorkItems(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(WeeklyWorkItem.findBySchedule).not.toHaveBeenCalled();
    });
  });

  describe('getUserDutySchedules', () => {
    it('returns approved duty assignments for the current user', async () => {
      ShiftAssignment.findByUser.mockResolvedValue([
        {
          shift_assignment_id: 5,
          shift_id: 12,
          user_id: 99,
          shift_date: '2026-03-21',
          shift_type: 'morning',
          start_time: '07:00:00',
          end_time: '11:00:00',
          schedule_id: 7,
          schedule_status: 'approved',
          week: 12,
          year: 2026,
          department_name: 'Khoa Noi',
          department_code: 'KNOI',
          status: 'assigned',
          note: 'Assigned',
          assigned_at: '2026-03-20 07:00:00',
        },
      ]);

      const req = { query: {}, user: { userId: 99 } };
      const res = createRes();

      await scheduleController.getUserDutySchedules(req, res);

      expect(ShiftAssignment.findByUser).toHaveBeenCalledWith(99, {
        status: undefined,
        from_date: undefined,
        to_date: undefined,
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({
            schedule_id: 7,
            schedule_status: 'approved',
            department_code: 'KNOI',
          }),
        ],
      });
    });
  });

  describe('getWeeklyWorkItemById', () => {
    it('returns 403 when requester cannot view the parent weekly schedule', async () => {
      WeeklyWorkItem.findById.mockResolvedValue({
        weekly_work_item_id: 7,
        schedule_id: 10,
        participantIds: [1, 2],
        participants: 'User A, User B',
      });
      Schedule.findById.mockResolvedValue({
        schedule_id: 10,
        schedule_type: 'weekly_work',
        status: 'draft',
      });
      SchedulePermissionService.canView.mockReturnValue(false);

      const req = { params: { id: '10', itemId: '7' }, user: { userId: 99 } };
      const res = createRes();

      await scheduleController.getWeeklyWorkItemById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('exportSchedulePdf', () => {
    it('returns 403 when requester cannot export the schedule', async () => {
      Schedule.findById.mockResolvedValue({
        schedule_id: 15,
        schedule_type: 'duty',
        week: 12,
        year: 2025,
        status: 'draft',
      });
      SchedulePermissionService.canExport.mockReturnValue(false);

      const req = { params: { id: '15' }, user: { userId: 99 } };
      const res = createRes();

      await scheduleController.exportSchedulePdf(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(SchedulePdfService.exportDutySchedule).not.toHaveBeenCalled();
      expect(SchedulePdfService.exportWeeklyWorkSchedule).not.toHaveBeenCalled();
    });
  });
});
