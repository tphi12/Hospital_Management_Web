const Schedule = require('../models/Schedule');
const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');
const WeeklyWorkItem = require('../models/WeeklyWorkItem');
const Department = require('../models/Department');
const ScheduleService = require('../services/ScheduleService');
const SchedulePdfService = require('../services/SchedulePdfService');
const SchedulePermissionService = require('../services/SchedulePermissionService');
const { pool } = require('../config/database');
const XLSX = require('xlsx');

const hasRoleCode = (user, roleCode) =>
  (user?.roles || []).some((role) => role?.role_code === roleCode);

const createScheduleShifts = async (scheduleId, departmentId, shifts = []) => {
  for (const shift of shifts) {
    const shiftId = await ScheduleService.addShift({
      scheduleId,
      departmentId,
      shiftDate: shift.shift_date,
      shiftType: shift.shift_type,
      startTime: shift.start_time,
      endTime: shift.end_time,
      maxStaff: shift.max_staff,
      note: shift.note
    });

    for (const staffId of shift.staff_ids || []) {
      await ScheduleService.assignUserToShift({
        shiftId,
        userId: staffId,
        note: shift.note
      });
    }
  }
};

/**
 * @swagger
 * /schedules:
 *   get:
 *     tags: [Schedules]
 *     summary: Lấy danh sách lịch
 *     parameters:
 *       - in: query
 *         name: schedule_type
 *         schema:
 *           type: string
 *           enum: [duty, weekly_work]
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved]
 *     responses:
 *       200:
 *         description: Thành công
 */
const getAllSchedules = async (req, res) => {
  try {
    const filters = {
      schedule_type: req.query.schedule_type,
      department_id: req.query.department_id,
      week: req.query.week,
      year: req.query.year,
      status: req.query.status,
      source_department_id: req.query.source_department_id
    };
    
    const schedules = await Schedule.findAll(filters);
    const visibleSchedules = schedules.filter((schedule) => SchedulePermissionService.canView(req.user, schedule));

    const schedulesWithDetails = await Promise.all(
      visibleSchedules.map(async (schedule) => {
        const shifts = await Shift.findBySchedule(schedule.schedule_id);
        const shiftsWithAssignments = await Promise.all(
          shifts.map(async (shift) => ({
            ...shift,
            assignments: await ShiftAssignment.findByShift(shift.shift_id),
          })),
        );

        return {
          ...schedule,
          shifts: shiftsWithAssignments,
        };
      }),
    );
    
    res.json({
      success: true,
      data: schedulesWithDetails
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách lịch',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     tags: [Schedules]
 *     summary: Lấy thông tin chi tiết lịch và các ca trực
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    if (!SchedulePermissionService.canView(req.user, schedule)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lịch này'
      });
    }
    
    // Get all shifts for this schedule
    const shifts = await Shift.findBySchedule(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...schedule,
        shifts
      }
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin lịch',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules:
 *   post:
 *     tags: [Schedules]
 *     summary: Tạo lịch mới (Văn thư phòng ban hoặc KHTH)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schedule_type
 *               - week
 *               - year
 *             properties:
 *               schedule_type:
 *                 type: string
 *                 enum: [duty, weekly_work]
 *               week:
 *                 type: integer
 *               year:
 *                 type: integer
 *               description:
 *                 type: string
 *               shifts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     shift_date:
 *                       type: string
 *                       format: date
 *                     shift_type:
 *                       type: string
 *                       enum: [morning, afternoon, night]
 *                     start_time:
 *                       type: string
 *                     end_time:
 *                       type: string
 *                     max_staff:
 *                       type: integer
 *                     note:
 *                       type: string
 *                     staff_ids:
 *                       type: array
 *                       items:
 *                         type: integer
 *     responses:
 *       201:
 *         description: Tạo lịch thành công
 */
const createSchedule = async (req, res) => {
  try {
    const { schedule_type, week, year, description, shifts } = req.body;

    if (!schedule_type || !week || !year) {
      return res.status(400).json({
        success: false,
        message: 'Vui l??ng nh???p ?????y ????? th??ng tin'
      });
    }

    let scheduleId;
    if (schedule_type === 'duty') {
      scheduleId = await ScheduleService.createDutySchedule({
        userId: req.user.userId,
        departmentId: req.user.department_id,
        week,
        year,
        description
      });
    } else if (schedule_type === 'weekly_work') {
      scheduleId = await ScheduleService.createWeeklySchedule({
        userId: req.user.userId,
        week,
        year,
        description
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Lo???i l???ch kh??ng h???p l???'
      });
    }

    await createScheduleShifts(scheduleId, req.user.department_id, shifts || []);

    res.status(201).json({
      success: true,
      message: 'T???o l???ch th??nh c??ng',
      data: { scheduleId }
    });
  } catch (error) {
    console.error('Create schedule error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'L???ch c??ng t??c cho tu???n n??y ???? t???n t???i. Vui l??ng ch???n t??? danh s??ch l???ch hi???n c??.'
      });
    }

    if (error.message === 'Only KHTH STAFF or MANAGER can create weekly work schedules') {
      return res.status(403).json({
        success: false,
        message: 'Chi nhan vien hoac truong phong KHTH moi co quyen tao lich cong tac tuan'
      });
    }

    res.status(500).json({
      success: false,
      message: 'L???i t???o l???ch',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     tags: [Schedules]
 *     summary: Cập nhật lịch
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               week:
 *                 type: integer
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateSchedule = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);
    await ScheduleService.updateSchedule(scheduleId, req.user, req.body);
    res.json({
      success: true,
      message: 'Cập nhật lịch thành công'
    });
  } catch (error) {
    console.error('Update schedule error:', error);

    if (error.message === 'Schedule not found') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch' });
    }
    if (
      error.message === 'Only source department can update draft schedules' ||
      error.message === 'Only owner department can update approved schedules'
    ) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa lịch này' });
    }
    if (error.message === 'Submitted schedules cannot be updated') {
      return res.status(400).json({ success: false, message: 'Lịch đã gửi KHTH nên không thể chỉnh sửa' });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật lịch',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{id}/submit:
 *   patch:
 *     tags: [Schedules]
 *     summary: Gửi lịch trực cho KHTH (Văn thư phòng ban)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gửi lịch thành công
 */
const submitSchedule = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);

    await ScheduleService.submitSchedule(scheduleId, req.user);

    res.json({
      success: true,
      message: 'Gửi lịch thành công'
    });
  } catch (error) {
    console.error('Submit schedule error:', error);

    if (error.message === 'Schedule not found') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch' });
    }
    if (error.message === 'Only draft schedules can be submitted') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể gửi lịch đang ở trạng thái nháp' });
    }
    if (error.message === 'You do not have permission to submit this schedule') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền gửi lịch này' });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi gửi lịch',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{id}/approve:
 *   patch:
 *     tags: [Schedules]
 *     summary: Duyệt và public lịch (KHTH)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Duyệt lịch thành công
 */
const approveSchedule = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);
    await ScheduleService.approveSchedule(scheduleId, req.user);
    res.json({
      success: true,
      message: 'Duyệt lịch thành công. Lịch đã được public cho toàn bộ nhân viên'
    });
  } catch (error) {
    console.error('Approve schedule error:', error);

    if (error.message === 'Schedule not found') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch' });
    }
    if (error.message === 'Only submitted schedules can be approved') {
      return res.status(400).json({ success: false, message: 'Chỉ có thể duyệt lịch đã được gửi' });
    }
    if (error.message === 'You do not have permission to approve this schedule') {
      return res.status(403).json({ success: false, message: 'Chỉ phòng KHTH mới có quyền duyệt lịch' });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi duyệt lịch',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     tags: [Schedules]
 *     summary: Xóa lịch
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
const deleteSchedule = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }
    
    if (schedule.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Lịch đã gửi KHTH nên không thể xóa'
      });
    }

    if (!SchedulePermissionService.canDelete(req.user, schedule)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa lịch này'
      });
    }
    
    await Schedule.delete(scheduleId);
    
    res.json({
      success: true,
      message: 'Xóa lịch thành công'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa lịch',
      error: error.message
    });
  }
};

/**
 * Export consolidated hospital duty schedule PDF by week/year.
 * GET /schedules/master/export/pdf?week=&year=
 */
const exportMasterDutySchedulePdf = async (req, res) => {
  try {
    const week = Number(req.query.week);
    const year = Number(req.query.year);

    if (!Number.isInteger(week) || !Number.isInteger(year)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu hoặc sai định dạng week/year'
      });
    }

    const schedules = await Schedule.findAll({
      schedule_type: 'duty',
      week,
      year,
      status: 'approved'
    });

    const allShifts = [];
    for (const schedule of schedules) {
      const shifts = await Shift.findBySchedule(schedule.schedule_id);
      for (const shift of shifts) {
        shift.assignments = await ShiftAssignment.findByShift(shift.shift_id);
      }
      allShifts.push(...shifts);
    }

    const departmentMap = new Map();
    for (const shift of allShifts) {
      const departmentId = shift.department_id;
      const dateKey = String(shift.shift_date).slice(0, 10);

      if (!departmentMap.has(departmentId)) {
        departmentMap.set(departmentId, {
          department_id: departmentId,
          department_name: shift.department_name ?? `Phong ${departmentId}`,
          department_code: shift.department_code ?? '',
          dateMap: new Map(),
        });
      }

      const department = departmentMap.get(departmentId);
      if (!department.dateMap.has(dateKey)) {
        department.dateMap.set(dateKey, []);
      }
      department.dateMap.get(dateKey).push(shift);
    }

    const departments = [...departmentMap.values()].map((department) => ({
      department_id: department.department_id,
      department_name: department.department_name,
      department_code: department.department_code,
      dates: [...department.dateMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, shifts]) => ({ date, shifts })),
    }));

    const pdfBuffer = await SchedulePdfService.buildDutyPdf({
      schedule_type: 'duty',
      week,
      year,
      status: 'approved',
      source_department_name: 'Toàn viện',
      owner_department_name: 'KHTH',
      departments,
    });

    const filename = `Master_Duty_Schedule_Week_${week}_${year}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Export master duty schedule pdf error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xuất PDF lịch tổng hợp toàn viện',
      error: error.message
    });
  }
};

/**
 * Export schedule as PDF
 * GET /schedules/:id/export/pdf
 */
const exportSchedulePdf = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);

    if (Number.isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch không hợp lệ'
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    if (!SchedulePermissionService.canExport(req.user, schedule)) {
      return res.status(403).json({
        success: false,
        message: 'Ban khong co quyen xuat PDF lich nay'
      });
    }

    let pdfBuffer;
    if (schedule.schedule_type === 'duty') {
      pdfBuffer = await SchedulePdfService.exportDutySchedule(scheduleId);
    } else if (schedule.schedule_type === 'weekly_work') {
      pdfBuffer = await SchedulePdfService.exportWeeklyWorkSchedule(scheduleId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Loại lịch không hỗ trợ xuất PDF'
      });
    }

    const filenamePrefix = schedule.schedule_type === 'duty'
      ? 'Duty_Schedule'
      : 'Weekly_Work_Schedule';
    const filename = `${filenamePrefix}_Week_${schedule.week}_${schedule.year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Export schedule pdf error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xuất PDF lịch',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{id}/weekly-items:
 *   get:
 *     tags: [Weekly Work Items]
 *     summary: Lấy danh sách công tác tuần
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
const getWeeklyWorkItems = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);

    if (Number.isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch không hợp lệ'
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    if (schedule.schedule_type !== 'weekly_work') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ lịch công tác tuần mới có công tác chi tiết'
      });
    }

    if (!SchedulePermissionService.canView(req.user, schedule)) {
      return res.status(403).json({
        success: false,
        message: 'Ban khong co quyen xem lich nay'
      });
    }

    const items = await WeeklyWorkItem.findBySchedule(scheduleId);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get weekly work items error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách công tác',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{scheduleId}/weekly-items/{itemId}:
 *   get:
 *     tags: [Weekly Work Items]
 *     summary: Lấy chi tiết công tác
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
const getWeeklyWorkItemById = async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const scheduleId = parseInt(req.params.id, 10);

    if (Number.isNaN(itemId) || Number.isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    const item = await WeeklyWorkItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công tác'
      });
    }

    // Verify item belongs to the schedule
    if (item.schedule_id !== scheduleId) {
      return res.status(403).json({
        success: false,
        message: 'Công tác không thuộc lịch này'
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay lich'
      });
    }

    if (!SchedulePermissionService.canView(req.user, schedule)) {
      return res.status(403).json({
        success: false,
        message: 'Ban khong co quyen xem lich nay'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get weekly work item error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết công tác',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{id}/weekly-items:
 *   post:
 *     tags: [Weekly Work Items]
 *     summary: Thêm công tác vào lịch tuần
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - work_date
 *               - content
 *             properties:
 *               work_date:
 *                 type: string
 *                 format: date
 *               content:
 *                 type: string
 *               location:
 *                 type: string
 *               participants:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
const addWeeklyWorkItem = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);
    const { work_date, time_period = 'Sáng', content, location, participantIds } = req.body;

    if (Number.isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch không hợp lệ'
      });
    }

    // Validate required fields
    if (!work_date || !content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin (ngày và nội dung)'
      });
    }

    const validTimePeriods = ['Sáng', 'Chiều'];
    if (!validTimePeriods.includes(time_period)) {
      return res.status(400).json({
        success: false,
        message: 'Giờ công tác phải là "Sáng" hoặc "Chiều"'
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    if (schedule.schedule_type !== 'weekly_work') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể thêm công tác vào lịch công tác tuần'
      });
    }

    if (!SchedulePermissionService.canManageWeeklyWork(req.user, schedule)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ phòng KHTH mới có quyền thêm công tác'
      });
    }

    const itemId = await ScheduleService.addWeeklyWorkItem({
      scheduleId,
      workDate: work_date,
      timePeriod: time_period,
      content,
      location: location || null,
      participantIds: participantIds || null
    });

    res.status(201).json({
      success: true,
      message: 'Thêm công tác thành công',
      data: { itemId }
    });
  } catch (error) {
    console.error('Add weekly work item error:', error);
    
    if (error.message.includes('Week must be')) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin lịch không hợp lệ'
      });
    }
    if (error.message === 'Schedule not found') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }
    if (error.message.includes('weekly_work')) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể thêm công tác vào lịch công tác tuần'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi thêm công tác',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{scheduleId}/weekly-items/{itemId}:
 *   put:
 *     tags: [Weekly Work Items]
 *     summary: Cập nhật công tác
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               work_date:
 *                 type: string
 *                 format: date
 *               content:
 *                 type: string
 *               location:
 *                 type: string
 *               participants:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateWeeklyWorkItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const scheduleId = parseInt(req.params.id, 10);
    const { work_date, time_period, content, location, participantIds } = req.body;

    if (Number.isNaN(itemId) || Number.isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    const item = await WeeklyWorkItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công tác'
      });
    }

    if (item.schedule_id !== scheduleId) {
      return res.status(403).json({
        success: false,
        message: 'Công tác không thuộc lịch này'
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    if (!SchedulePermissionService.canManageWeeklyWork(req.user, schedule)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ phòng KHTH mới có quyền cập nhật công tác'
      });
    }

    // Validate time_period if provided
    if (time_period !== undefined) {
      const validTimePeriods = ['Sáng', 'Chiều'];
      if (!validTimePeriods.includes(time_period)) {
        return res.status(400).json({
          success: false,
          message: 'Giờ công tác phải là "Sáng" hoặc "Chiều"'
        });
      }
    }

    const updateData = {};
    if (work_date !== undefined) updateData.work_date = work_date;
    if (time_period !== undefined) updateData.time_period = time_period;
    if (content !== undefined) updateData.content = content;
    if (location !== undefined) updateData.location = location;
    
    if (participantIds !== undefined) {
      updateData.participantIds = Array.isArray(participantIds) ? participantIds : [];
    }

    const updated = await WeeklyWorkItem.update(itemId, updateData);
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu thay đổi'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật công tác thành công'
    });
  } catch (error) {
    console.error('Update weekly work item error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật công tác',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/{scheduleId}/weekly-items/{itemId}:
 *   delete:
 *     tags: [Weekly Work Items]
 *     summary: Xóa công tác
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
const deleteWeeklyWorkItem = async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId, 10);
    const scheduleId = parseInt(req.params.id, 10);

    if (Number.isNaN(itemId) || Number.isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }

    const item = await WeeklyWorkItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công tác'
      });
    }

    if (item.schedule_id !== scheduleId) {
      return res.status(403).json({
        success: false,
        message: 'Công tác không thuộc lịch này'
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    if (!SchedulePermissionService.canManageWeeklyWork(req.user, schedule)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ phòng KHTH mới có quyền xóa công tác'
      });
    }

    await WeeklyWorkItem.delete(itemId);
    
    res.json({
      success: true,
      message: 'Xóa công tác thành công'
    });
  } catch (error) {
    console.error('Delete weekly work item error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa công tác',
      error: error.message
    });
  }
};

const normalizeColumnName = (column = '') => {
  return String(column)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
};

const mapImportRow = (row) => {
  const mapped = {
    work_date: '',
    time_period: 'Sáng',
    content: '',
    location: '',
    participants: ''
  };

  Object.entries(row || {}).forEach(([key, value]) => {
    const normalizedKey = normalizeColumnName(key);

    if (['work_date', 'ngay', 'ngay_cong_tac', 'date'].includes(normalizedKey)) {
      mapped.work_date = value;
      return;
    }
    if (['time_period', 'gio', 'gio_lam_viec', 'sang_chieu'].includes(normalizedKey)) {
      mapped.time_period = value;
      return;
    }
    if (['content', 'noi_dung', 'cong_tac', 'task'].includes(normalizedKey)) {
      mapped.content = value;
      return;
    }
    if (['location', 'dia_diem', 'noi_lam_viec'].includes(normalizedKey)) {
      mapped.location = value;
      return;
    }
    if (['participants', 'nguoi_tham_du', 'thanh_phan', 'user_ids'].includes(normalizedKey)) {
      mapped.participants = value;
    }
  });

  return mapped;
};

const parseWeeklyItemsFile = (file) => {
  const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    blankrows: false
  });

  return rows.map((row, index) => ({
    ...mapImportRow(row),
    rowNumber: index + 2
  }));
};


const importWeeklyWorkItems = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id, 10);

    if (Number.isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch không hợp lệ'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file để import (.xlsx, .xls hoặc .csv)'
      });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }

    if (schedule.schedule_type !== 'weekly_work') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể import vào lịch công tác tuần'
      });
    }

    const isKHTH = Number(schedule.owner_department_id) === Number(req.user.department_id);
    const isAdmin = hasRoleCode(req.user, 'ADMIN');

    if (!isKHTH && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ phòng KHTH mới có quyền import công tác'
      });
    }

    const items = parseWeeklyItemsFile(req.file);
    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File không có dữ liệu để import'
      });
    }

    const result = await ScheduleService.importWeeklyWorkItems({
      scheduleId,
      items
    });

    return res.json({
      success: true,
      message: `Import hoàn tất: ${result.successCount}/${result.totalRows} dòng thành công`,
      data: result
    });
  } catch (error) {
    console.error('Import weekly work items error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi import công tác tuần',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/me/duty-schedules:
 *   get:
 *     tags: [Schedules]
 *     summary: Lấy danh sách ca trực của người dùng hiện tại
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thành công
 */
const getUserDutySchedules = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };
    const shifts = await ShiftAssignment.findByUser(req.user.userId, filters);
    
    res.json({
      success: true,
      data: shifts.map(shift => ({
        shift_assignment_id: shift.shift_assignment_id,
        shift_id: shift.shift_id,
        user_id: shift.user_id,
        shift_date: shift.shift_date,
          shift_type: shift.shift_type,
          start_time: shift.start_time,
          end_time: shift.end_time,
          schedule_id: shift.schedule_id,
          schedule_status: shift.schedule_status,
          week: shift.week,
          year: shift.year,
          department_name: shift.department_name,
          department_code: shift.department_code,
          status: shift.status,
        note: shift.note,
        assigned_at: shift.assigned_at
      }))
    });
  } catch (error) {
    console.error('Get user duty schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách ca trực',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /schedules/me/weekly-work-items:
 *   get:
 *     tags: [Schedules]
 *     summary: Lấy danh sách công tác tuần của người dùng hiện tại
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thành công
 */
const getUserWeeklyWorkItems = async (req, res) => {
  try {
    const filters = {
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };
    const items = await WeeklyWorkItem.findByUser(req.user.userId, filters);
    
    const processedItems = items.map(item => ({
      weekly_work_item_id: item.weekly_work_item_id,
      schedule_id: item.schedule_id,
      work_date: item.work_date,
      time_period: item.time_period,
      content: item.content,
      location: item.location,
      participantNames: item.participantNames || null,
      participantIds: Array.isArray(item.participantIds) ? item.participantIds : [],
      week: item.week,
      year: item.year,
      schedule_status: item.schedule_status,
      schedule_description: item.schedule_description,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    res.json({
      success: true,
      data: processedItems
    });
  } catch (error) {
    console.error('Get user weekly work items error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách công tác tuần',
      error: error.message
    });
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  submitSchedule,
  approveSchedule,
  deleteSchedule,
  exportSchedulePdf,
  exportMasterDutySchedulePdf,
  getWeeklyWorkItems,
  getWeeklyWorkItemById,
  addWeeklyWorkItem,
  importWeeklyWorkItems,
  updateWeeklyWorkItem,
  deleteWeeklyWorkItem,
  getUserDutySchedules,
  getUserWeeklyWorkItems
};
