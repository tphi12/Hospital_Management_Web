const User = require('../models/User');
const Role = require('../models/Role');
const { pool } = require('../config/database');


/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Lấy danh sách người dùng (ADMIN only)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, username, email, mã nhân viên
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *         description: Lọc theo phòng ban
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Thành công
 */
const getAllUsers = async (req, res) => {
  try {
    const { search, department_id, status } = req.query;

    const userRoles = req.user?.roles || [];
    const isAdmin = userRoles.some((role) => role.role_code === 'ADMIN');

    const effectiveDepartmentId = isAdmin
      ? department_id
      : (req.user?.department_id || department_id);

    const effectiveStatus = isAdmin ? status : (status || 'active');

    const users = await User.findAll(search, effectiveDepartmentId, effectiveStatus);
    
    res.json({
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách người dùng',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Lấy thông tin chi tiết người dùng
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy người dùng
 */
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    const userRoles = await Role.getUserRoles(userId);
    
    res.json({
      success: true,
      data: {
        ...user,
        roles: userRoles
      }
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin người dùng',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Tạo người dùng mới (ADMIN only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - username
 *               - email
 *               - password
 *               - phone
 *               - department_id
 *             properties:
 *               full_name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               employee_code:
 *                 type: string
 *               department_id:
 *                 type: integer
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               role_id:
 *                 type: integer
 *               scope_type:
 *                 type: string
 *                 enum: [department, hospital]
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 */
const createUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      full_name, username, email, password, phone, employee_code,
      department_id, gender, date_of_birth, role_id, scope_type
    } = req.body;
    
    // Validate required fields
    if (!full_name || !username || !email || !password || !phone || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin bắt buộc'
      });
    }
    
    // Check if username exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username đã tồn tại'
      });
    }
    
    // Check if email exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email đã tồn tại'
      });
    }
    
    // Create user
    const userId = await User.create({
      full_name,
      username,
      email,
      password,
      phone,
      employee_code,
      department_id,
      gender,
      date_of_birth
    }, connection);
    
    // Assign role if provided
    if (role_id) {
      const roleScope = scope_type || 'department';
      const roleDeptId = roleScope === 'department' ? department_id : null;
      
      await Role.assignRoleToUser(userId, role_id, roleScope, roleDeptId, connection);
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: { userId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo người dùng',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật thông tin người dùng (ADMIN only)
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
 *               full_name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               employee_code:
 *                 type: string
 *               department_id:
 *                 type: integer
 *               gender:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Check username uniqueness if changed
    if (updateData.username && updateData.username !== existingUser.username) {
      const usernameExists = await User.findByUsername(updateData.username);
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username đã tồn tại'
        });
      }
    }
    
    // Check email uniqueness if changed
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await User.findByEmail(updateData.email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email đã tồn tại'
        });
      }
    }
    
    // Update user
    await User.update(userId, updateData);
    
    res.json({
      success: true,
      message: 'Cập nhật người dùng thành công'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật người dùng',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Khóa/Mở khóa tài khoản (ADMIN only)
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */
const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Update status
    await User.updateStatus(userId, status);
    
    const message = status === 'active' ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công';
    
    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái người dùng',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Xóa người dùng (ADMIN only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa người dùng thành công
 */
const deleteUser = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Remove all user roles
    await Role.removeAllUserRoles(userId);
    
    // Delete user
    await User.delete(userId);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa người dùng',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * @swagger
 * /users/{id}/roles:
 *   post:
 *     tags: [Users]
 *     summary: Phân quyền cho người dùng (ADMIN only)
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
 *               - role_id
 *               - scope_type
 *             properties:
 *               role_id:
 *                 type: integer
 *               scope_type:
 *                 type: string
 *                 enum: [department, hospital]
 *               department_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Phân quyền thành công
 */
const assignRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role_id, scope_type, department_id } = req.body;
    
    if (!role_id || !scope_type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Check if role exists
    const role = await Role.findById(role_id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vai trò'
      });
    }
    
    const roleDeptId = scope_type === 'department' ? (department_id || user.department_id) : null;
    
    // Đảm bảo mỗi user chỉ có 1 vai trò: xóa hết rồi gán lại
    await Role.removeAllUserRoles(userId);
    await Role.assignRoleToUser(userId, role_id, scope_type, roleDeptId);
    
    res.status(201).json({
      success: true,
      message: 'Phân quyền thành công'
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi phân quyền',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /users/{id}/password:
 *   patch:
 *     tags: [Users]
 *     summary: Đặc quyền đổi mật khẩu người dùng (ADMIN only)
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
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
const resetPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Update password
    await User.update(userId, { password: newPassword });
    
    res.json({
      success: true,
      message: 'Đổi mật khẩu người dùng thành công'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đổi mật khẩu',
      error: error.message
    });
  }
};


const getUsersForPicker = async (req, res) => {
  try {
    const { department_id, search } = req.query;
    const userRoles = req.user?.roles || [];
    const isAdmin = userRoles.some((role) => role.role_code === 'ADMIN');
    const isKHTH = userRoles.some((role) => role.role_code === 'STAFF' && req.user?.department_type === 'special');

    // Filter by department
    let effectiveDeptId = department_id ? parseInt(department_id, 10) : null;
    
    if (!isAdmin && !isKHTH) {
      // Regular staff: can only see their own department
      effectiveDeptId = req.user?.department_id;
    }

    // Get users with department info
    const [users] = await pool.execute(
      `SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.department_id,
        d.department_name,
        d.department_code
       FROM USER u
       LEFT JOIN DEPARTMENT d ON u.department_id = d.department_id
       WHERE u.status = 'active'
       ${effectiveDeptId ? `AND u.department_id = ?` : ''}
       ${search ? `AND (LOWER(u.full_name) LIKE LOWER(?) OR LOWER(u.username) LIKE LOWER(?))` : ''}
       ORDER BY u.full_name ASC
       LIMIT 100`,
      [
        ...(effectiveDeptId ? [effectiveDeptId] : []),
        ...(search ? [`%${search}%`, `%${search}%`] : [])
      ]
    );

    res.json({
      success: true,
      data: users.map(u => ({
        user_id: u.user_id,
        username: u.username,
        full_name: u.full_name,
        email: u.email,
        department_id: u.department_id,
        department_name: u.department_name,
        department_code: u.department_code
      }))
    });
  } catch (error) {
    console.error('Get users for picker error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách người dùng',
      error: error.message
    });
  }
};

/**
 * Get users by their IDs (for displaying existing participant names)
 */
const getUsersByIds = async (req, res) => {
  try {
    const { userIds } = req.query;
    
    if (!userIds) {
      return res.json({
        success: true,
        data: []
      });
    }

    let ids = [];
    try {
      // userIds could be comma-separated string or JSON array string
      if (typeof userIds === 'string') {
        if (userIds.startsWith('[')) {
          ids = JSON.parse(userIds);
        } else {
          ids = userIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
        }
      } else if (Array.isArray(userIds)) {
        ids = userIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      }
    } catch (e) {
      console.warn('Error parsing userIds:', userIds, e);
      return res.json({
        success: true,
        data: []
      });
    }

    if (ids.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Build placeholders for IN clause
    const placeholders = ids.map(() => '?').join(',');
    
    const [users] = await pool.execute(
      `SELECT 
        u.user_id,
        u.username,
        u.full_name,
        u.email,
        u.department_id,
        d.department_name,
        d.department_code
       FROM USER u
       LEFT JOIN DEPARTMENT d ON u.department_id = d.department_id
       WHERE u.user_id IN (${placeholders})
       ORDER BY u.full_name ASC`,
      ids
    );

    res.json({
      success: true,
      data: users.map(u => ({
        user_id: u.user_id,
        username: u.username,
        full_name: u.full_name,
        email: u.email,
        department_id: u.department_id,
        department_name: u.department_name,
        department_code: u.department_code
      }))
    });
  } catch (error) {
    console.error('Get users by IDs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin người dùng',
      error: error.message
    });
  }
};

/**
 * Get all departments for filter
 */
const getDepartmentsForFilter = async (req, res) => {
  try {
    const [departments] = await pool.execute(
      `SELECT department_id, department_name, department_code
       FROM DEPARTMENT
       ORDER BY department_name ASC`
    );

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

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  assignRole,
  resetPassword,
  getUsersForPicker,
  getUsersByIds,
  getDepartmentsForFilter
};
