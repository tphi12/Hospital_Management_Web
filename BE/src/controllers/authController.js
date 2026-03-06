const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập vào hệ thống
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng nhập thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Thông tin đăng nhập không chính xác
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ username và password'
      });
    }

    // Find user by username or email
    let user;
    // Check if input is email format
    if (username.includes('@')) {
      user = await User.findByEmail(username);
    } else {
      user = await User.findByUsername(username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email/Username hoặc password không chính xác'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Vui lòng liên hệ Admin để được hỗ trợ'
      });
    }

    // Check password
    const isPasswordValid = await User.comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email/Username hoặc password không chính xác'
      });
    }

    // Update last login
    await User.updateLastLogin(user.user_id);

    // Get user roles
    const userRoles = await Role.getUserRoles(user.user_id);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    const loginResponse = {
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          ...userWithoutPassword,
          roles: userRoles
        }
      }
    };

    console.log('[AUTH_LOGIN_RESPONSE]', {
      username,
      user_id: loginResponse.data.user.user_id,
      department_id: loginResponse.data.user.department_id,
      roles_count: Array.isArray(loginResponse.data.user.roles) ? loginResponse.data.user.roles.length : 0,
      roles: loginResponse.data.user.roles,
      token_present: Boolean(loginResponse.data.token)
    });

    res.json(loginResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Lấy thông tin user hiện tại
 *     responses:
 *       200:
 *         description: Thành công
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const userRoles = await Role.getUserRoles(req.user.userId);

    res.json({
      success: true,
      data: {
        ...user,
        roles: userRoles
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin người dùng',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Đổi mật khẩu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Get user with password
    const user = await User.findByUsername(req.user.username);

    // Verify current password
    const isPasswordValid = await User.comparePassword(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    // Update password
    await User.update(req.user.userId, { password: newPassword });

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi đổi mật khẩu',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getMe,
  changePassword
};
