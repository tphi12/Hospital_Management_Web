const Shift = require('../models/Shift');
const Schedule = require('../models/Schedule');

/**
 * @swagger
 * /shifts/{id}:
 *   get:
 *     tags: [Shifts]
 *     summary: Lấy thông tin ca trực và danh sách nhân viên
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
const getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca trực'
      });
    }
    
    const assignments = await Shift.getAssignments(req.params.id);
    
    res.json({
      success: true,
      data: {
        ...shift,
        staff: assignments
      }
    });
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin ca trực',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /shifts:
 *   post:
 *     tags: [Shifts]
 *     summary: Tạo ca trực mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schedule_id
 *               - shift_date
 *               - shift_type
 *             properties:
 *               schedule_id:
 *                 type: integer
 *               shift_date:
 *                 type: string
 *                 format: date
 *               shift_type:
 *                 type: string
 *                 enum: [morning, afternoon, night]
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *               max_staff:
 *                 type: integer
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo ca trực thành công
 */
const createShift = async (req, res) => {
  try {
    const {
      schedule_id, shift_date, shift_type, note,
      start_time, end_time, max_staff
    } = req.body;
    
    if (!schedule_id || !shift_date || !shift_type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }
    
    // Check if schedule exists
    const schedule = await Schedule.findById(schedule_id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch'
      });
    }
    
    const shiftId = await Shift.create({
      schedule_id,
      department_id: req.user.department_id,
      shift_date,
      shift_type,
      note,
      start_time,
      end_time,
      max_staff
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo ca trực thành công',
      data: { shiftId }
    });
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo ca trực',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /shifts/{id}:
 *   put:
 *     tags: [Shifts]
 *     summary: Cập nhật ca trực
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
 *               shift_date:
 *                 type: string
 *               shift_type:
 *                 type: string
 *               start_time:
 *                 type: string
 *               end_time:
 *                 type: string
 *               max_staff:
 *                 type: integer
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateShift = async (req, res) => {
  try {
    const shiftId = req.params.id;
    const shift = await Shift.findById(shiftId);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca trực'
      });
    }
    
    await Shift.update(shiftId, req.body);
    
    res.json({
      success: true,
      message: 'Cập nhật ca trực thành công'
    });
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật ca trực',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /shifts/{id}:
 *   delete:
 *     tags: [Shifts]
 *     summary: Xóa ca trực
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
const deleteShift = async (req, res) => {
  try {
    const shiftId = req.params.id;
    const shift = await Shift.findById(shiftId);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca trực'
      });
    }
    
    await Shift.delete(shiftId);
    
    res.json({
      success: true,
      message: 'Xóa ca trực thành công'
    });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa ca trực',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /shifts/{id}/assign:
 *   post:
 *     tags: [Shifts]
 *     summary: Phân công nhân viên vào ca trực
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
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Phân công thành công
 */
const assignStaff = async (req, res) => {
  try {
    const shiftId = req.params.id;
    const { user_id, note } = req.body;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn nhân viên'
      });
    }
    
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca trực'
      });
    }
    
    // Check max_staff limit
    if (shift.max_staff && shift.assigned_count >= shift.max_staff) {
      return res.status(400).json({
        success: false,
        message: 'Ca trực đã đủ số lượng nhân viên'
      });
    }
    
    const assignmentId = await Shift.assignStaff(shiftId, user_id, note);
    
    res.status(201).json({
      success: true,
      message: 'Phân công nhân viên thành công',
      data: { assignmentId }
    });
  } catch (error) {
    console.error('Assign staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi phân công nhân viên',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /shifts/assignments/{id}:
 *   delete:
 *     tags: [Shifts]
 *     summary: Xóa phân công nhân viên khỏi ca trực
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa phân công thành công
 */
const removeAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    await Shift.removeAssignment(assignmentId);
    
    res.json({
      success: true,
      message: 'Xóa phân công thành công'
    });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa phân công',
      error: error.message
    });
  }
};

module.exports = {
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
  assignStaff,
  removeAssignment
};
