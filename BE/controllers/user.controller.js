const { User, Department } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new user (ADMIN only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, VAN_THU, TRUONG_PHONG, VAN_THU_PHONG_BAN, NHAN_VIEN, KHTH]
 *               departmentId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
exports.createUser = async (req, res) => {
  try {
    const { fullName, username, email, phone, password, role, departmentId } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username 
          ? 'Username đã tồn tại' 
          : 'Email đã tồn tại' 
      });
    }

    const user = await User.create({
      fullName,
      username,
      email,
      phone,
      password,
      role,
      departmentId
    });

    res.status(201).json({ 
      message: 'Tạo người dùng thành công',
      user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (ADMIN only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, username, or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: List of users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, departmentId } = req.query;
    
    let whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    const users = await User.findAll({
      where: whereClause,
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'location']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ 
      count: users.length,
      users 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'location']
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (ADMIN only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *               fullName:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               departmentId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const { fullName, username, email, phone, password, role, departmentId } = req.body;

    // Check if username or email is taken by another user
    if (username || email) {
      const existingUser = await User.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
          [Op.or]: [
            username ? { username } : {},
            email ? { email } : {}
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: existingUser.username === username 
            ? 'Username đã tồn tại' 
            : 'Email đã tồn tại' 
        });
      }
    }

    await user.update({
      fullName: fullName || user.fullName,
      username: username || user.username,
      email: email || user.email,
      phone: phone !== undefined ? phone : user.phone,
      password: password || user.password,
      role: role || user.role,
      departmentId: departmentId !== undefined ? departmentId : user.departmentId
    });

    res.json({ 
      message: 'Cập nhật người dùng thành công',
      user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/users/{id}/lock:
 *   patch:
 *     summary: Lock/Unlock user (ADMIN only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *               isLocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User lock status updated
 *       404:
 *         description: User not found
 */
exports.lockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const { isLocked } = req.body;
    await user.update({ isLocked });

    res.json({ 
      message: isLocked ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản',
      user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (ADMIN only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    await user.destroy();

    res.json({ message: 'Xoá người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
