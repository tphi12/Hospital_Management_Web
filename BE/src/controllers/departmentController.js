const Department = require('../models/Department');

/**
 * @swagger
 * /departments:
 *   get:
 *     tags: [Departments]
 *     summary: Lấy danh sách phòng ban
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
const getAllDepartments = async (req, res) => {
  try {
    const { search } = req.query;
    const departments = await Department.findAll(search);
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách phòng ban',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Lấy thông tin chi tiết phòng ban
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
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng ban'
      });
    }
    
    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin phòng ban',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /departments:
 *   post:
 *     tags: [Departments]
 *     summary: Tạo phòng ban mới (ADMIN only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department_code
 *               - department_name
 *               - department_type
 *             properties:
 *               department_code:
 *                 type: string
 *               department_name:
 *                 type: string
 *               department_type:
 *                 type: string
 *                 enum: [simple, admin, special]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo phòng ban thành công
 */
const createDepartment = async (req, res) => {
  try {
    const { department_code, department_name, department_type, description } = req.body;
    
    if (!department_code || !department_name || !department_type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }
    
    // Check if code exists
    const existing = await Department.findByCode(department_code);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Mã phòng ban đã tồn tại'
      });
    }
    
    const departmentId = await Department.create({
      department_code,
      department_name,
      department_type,
      description
    });
    
    const { head_id } = req.body;
    if (head_id) {
      await Department.setManager(departmentId, head_id);
    }
    
    res.status(201).json({
      success: true,
      message: 'Tạo phòng ban thành công',
      data: { departmentId }
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo phòng ban',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /departments/{id}:
 *   put:
 *     tags: [Departments]
 *     summary: Cập nhật thông tin phòng ban (ADMIN only)
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
 *             properties:
 *               department_code:
 *                 type: string
 *               department_name:
 *                 type: string
 *               department_type:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    const existing = await Department.findById(departmentId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng ban'
      });
    }
    
    await Department.update(departmentId, req.body);
    
    const { head_id } = req.body;
    if (head_id !== undefined) {
      await Department.setManager(departmentId, head_id || null);
    }
    
    res.json({
      success: true,
      message: 'Cập nhật phòng ban thành công'
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật phòng ban',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /departments/{id}:
 *   delete:
 *     tags: [Departments]
 *     summary: Xóa phòng ban (ADMIN only)
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
const deleteDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    const existing = await Department.findById(departmentId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng ban'
      });
    }
    
    await Department.delete(departmentId);
    
    res.json({
      success: true,
      message: 'Xóa phòng ban thành công'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa phòng ban',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /departments/{id}/members:
 *   get:
 *     tags: [Departments]
 *     summary: Xem danh sách thành viên phòng ban
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
const getDepartmentMembers = async (req, res) => {
  try {
    const members = await Department.getMembers(req.params.id);
    
    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Get department members error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách thành viên',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /departments/{id}/members:
 *   post:
 *     tags: [Departments]
 *     summary: Thêm thành viên vào phòng ban (ADMIN only)
 */
const addMember = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn người dùng' });
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng ban' });
    }

    const { pool } = require('../config/database');
    await pool.execute('UPDATE USER SET department_id = ? WHERE user_id = ?', [departmentId, user_id]);

    res.json({ success: true, message: 'Thêm thành viên thành công' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Lỗi thêm thành viên', error: error.message });
  }
};

/**
 * @swagger
 * /departments/{id}/members/{userId}:
 *   delete:
 *     tags: [Departments]
 *     summary: Xóa thành viên khỏi phòng ban (ADMIN only)
 */
const removeMember = async (req, res) => {
  try {
    const { id: departmentId, userId } = req.params;

    const { pool } = require('../config/database');
    await pool.execute(
      'UPDATE USER SET department_id = NULL WHERE user_id = ? AND department_id = ?',
      [userId, departmentId]
    );

    res.json({ success: true, message: 'Xoá thành viên thành công' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Lỗi xoá thành viên', error: error.message });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentMembers,
  addMember,
  removeMember
};
