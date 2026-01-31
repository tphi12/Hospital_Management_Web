const Role = require('../models/Role');

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: Lấy danh sách tất cả các role trong hệ thống
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role_id:
 *                         type: integer
 *                       role_code:
 *                         type: string
 *                       role_name:
 *                         type: string
 *                       description:
 *                         type: string
 */
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách role',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Lấy thông tin chi tiết role
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
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy role'
      });
    }
    
    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin role',
      error: error.message
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById
};
