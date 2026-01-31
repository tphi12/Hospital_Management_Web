const Category = require('../models/Category');

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Lấy danh sách danh mục tài liệu
 *     responses:
 *       200:
 *         description: Thành công
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách danh mục',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Tạo danh mục mới (ADMIN only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category_name
 *             properties:
 *               category_name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 */
const createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    
    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên danh mục'
      });
    }
    
    const categoryId = await Category.create({ category_name, description });
    
    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: { categoryId }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo danh mục',
      error: error.message
    });
  }
};

module.exports = {
  getAllCategories,
  createCategory
};
