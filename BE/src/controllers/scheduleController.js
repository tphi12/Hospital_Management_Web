const Schedule = require('../models/Schedule');
const Shift = require('../models/Shift');
const Department = require('../models/Department');
const { pool } = require('../config/database');

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
    
    res.json({
      success: true,
      data: schedules
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
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { schedule_type, week, year, description, shifts } = req.body;
    
    if (!schedule_type || !week || !year) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }
    
    // Check if schedule already exists
    const existing = await Schedule.checkExists(
      schedule_type,
      req.user.department_id,
      week,
      year
    );
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Lịch này đã tồn tại'
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
            await Shift.assignStaff(shiftId, staffId);
          }
        }
      }
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Tạo lịch thành công',
      data: { scheduleId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo lịch',
      error: error.message
    });
  } finally {
    connection.release();
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
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }
    
    // Check permission based on status
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(r => r.role_code === 'ADMIN');
    
    // IF status = 'draft' → source_department can edit
    // IF status = 'submitted' or 'approved' → owner_department (KHTH) can edit
    
    if (!isAdmin) {
      if (schedule.status === 'draft') {
        if (schedule.source_department_id !== req.user.department_id) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền chỉnh sửa lịch này'
          });
        }
      } else {
        if (schedule.owner_department_id !== req.user.department_id) {
          return res.status(403).json({
            success: false,
            message: 'Chỉ phòng KHTH mới có quyền chỉnh sửa lịch đã gửi'
          });
        }
      }
    }
    
    await Schedule.update(scheduleId, req.body);
    
    res.json({
      success: true,
      message: 'Cập nhật lịch thành công'
    });
  } catch (error) {
    console.error('Update schedule error:', error);
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
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }
    
    if (schedule.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể gửi lịch đang ở trạng thái nháp'
      });
    }
    
    if (schedule.source_department_id !== req.user.department_id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền gửi lịch này'
      });
    }
    
    await Schedule.updateStatus(scheduleId, 'submitted');
    
    res.json({
      success: true,
      message: 'Gửi lịch thành công'
    });
  } catch (error) {
    console.error('Submit schedule error:', error);
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
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }
    
    // Only KHTH can approve
    if (schedule.owner_department_id !== req.user.department_id) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ phòng KHTH mới có quyền duyệt lịch'
      });
    }
    
    await Schedule.updateStatus(scheduleId, 'approved');
    
    res.json({
      success: true,
      message: 'Duyệt lịch thành công. Lịch đã được public cho toàn bộ nhân viên'
    });
  } catch (error) {
    console.error('Approve schedule error:', error);
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
    
    // Check permission
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(r => r.role_code === 'ADMIN');
    const isKHTH = schedule.owner_department_id === req.user.department_id;
    
    if (!isAdmin && !isKHTH) {
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

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  submitSchedule,
  approveSchedule,
  deleteSchedule
};
