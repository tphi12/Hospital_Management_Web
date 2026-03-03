const Schedule = require('../models/Schedule');
const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');
const Department = require('../models/Department');
const ScheduleService = require('../services/ScheduleService');
const SchedulePdfService = require('../services/SchedulePdfService');
const { pool } = require('../config/database');

const hasRoleCode = (user, roleCode) =>
  (user?.roles || []).some((role) => role?.role_code === roleCode);

const canViewSchedule = (user, schedule) => {
  if (!user || !schedule) return false;
  if (hasRoleCode(user, 'ADMIN')) return true;

  const userDepartmentId = Number(user.department_id);
  const sourceDepartmentId = Number(schedule.source_department_id);
  const ownerDepartmentId = Number(schedule.owner_department_id);

  if (userDepartmentId === sourceDepartmentId) {
    return true;
  }

  if (userDepartmentId === ownerDepartmentId) {
    return schedule.status === 'submitted' || schedule.status === 'approved';
  }

  return schedule.status === 'approved';
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
    const visibleSchedules = schedules.filter((schedule) => canViewSchedule(req.user, schedule));

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

    if (!canViewSchedule(req.user, schedule)) {
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
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }
    
    // Duty schedule flow is handled by service to avoid duplicate business logic
    if (schedule_type === 'duty') {
      const scheduleId = await ScheduleService.createDutySchedule({
        userId: req.user.userId,
        departmentId: req.user.department_id,
        week,
        year,
        description
      });

      if (shifts && shifts.length > 0) {
        for (const shift of shifts) {
          const shiftId = await ScheduleService.addShift({
            scheduleId,
            departmentId: req.user.department_id,
            shiftDate: shift.shift_date,
            shiftType: shift.shift_type,
            startTime: shift.start_time,
            endTime: shift.end_time,
            maxStaff: shift.max_staff,
            note: shift.note
          });

          if (shift.staff_ids && shift.staff_ids.length > 0) {
            for (const staffId of shift.staff_ids) {
              await ScheduleService.assignUserToShift({
                shiftId,
                userId: staffId,
                note: shift.note
              });
            }
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Tạo lịch thành công',
        data: { scheduleId }
      });
    }
    
    // For duty schedule: department clerk creates for their department
    // For weekly_work: only KHTH can create
    let sourceDeptId = req.user.department_id;
    let ownerDeptId = null;
    
    if (schedule_type === 'duty') {
      // Duty schedule: source = user's department, owner = KHTH
      const [khthDept] = await pool.execute(
        "SELECT department_id FROM DEPARTMENT WHERE department_type = 'special' LIMIT 1"
      );
      
      if (khthDept.length > 0) {
        ownerDeptId = khthDept[0].department_id;
      }
    } else {
      // Weekly work: only KHTH can create, both source and owner are KHTH
      const [userDept] = await pool.execute(
        "SELECT department_type FROM DEPARTMENT WHERE department_id = ?",
        [req.user.department_id]
      );
      
      if (!userDept.length || userDept[0].department_type !== 'special') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ phòng KHTH mới có quyền tạo lịch công tác tuần'
        });
      }
      
      ownerDeptId = req.user.department_id;
    }
    
    // Create schedule
    const scheduleId = await Schedule.create({
      schedule_type,
      department_id: req.user.department_id,
      week,
      year,
      description,
      created_by: req.user.userId,
      source_department_id: sourceDeptId,
      owner_department_id: ownerDeptId,
      status: 'draft'
    });
    
    // Create shifts if provided
    if (shifts && shifts.length > 0) {
      for (const shift of shifts) {
        const shiftId = await Shift.create({
          schedule_id: scheduleId,
          department_id: req.user.department_id,
          shift_date: shift.shift_date,
          shift_type: shift.shift_type,
          note: shift.note,
          start_time: shift.start_time,
          end_time: shift.end_time,
          max_staff: shift.max_staff
        });
        
        // Assign staff if provided
        if (shift.staff_ids && shift.staff_ids.length > 0) {
          for (const staffId of shift.staff_ids) {
            await ShiftAssignment.create({
              shift_id: shiftId,
              user_id: staffId,
              status: 'assigned',
              note: null
            });
          }
        }
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Tạo lịch thành công',
      data: { scheduleId }
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo lịch',
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

    // Check permission
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(r => r.role_code === 'ADMIN');
    const isSourceDepartment = Number(schedule.source_department_id) === Number(req.user.department_id);
    const isKHTH = schedule.owner_department_id === req.user.department_id;

    const canDeleteDraft = schedule.status === 'draft' && (isSourceDepartment || isAdmin);
    const canDeleteApproved = schedule.status === 'approved' && (isKHTH || isAdmin);
    
    if (!canDeleteDraft && !canDeleteApproved) {
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

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  submitSchedule,
  approveSchedule,
  deleteSchedule,
  exportSchedulePdf,
  exportMasterDutySchedulePdf
};
