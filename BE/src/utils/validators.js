const { body, param, query } = require('express-validator');

// User validation
const userCreateValidation = [
  body('full_name').trim().notEmpty().withMessage('Họ tên không được để trống'),
  body('username').trim().isLength({ min: 4 }).withMessage('Username phải có ít nhất 4 ký tự'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('phone').optional().matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
  body('department_id').isInt().withMessage('Department ID phải là số nguyên')
];

const userUpdateValidation = [
  param('id').isInt().withMessage('User ID không hợp lệ'),
  body('email').optional().isEmail().withMessage('Email không hợp lệ'),
  body('phone').optional().matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ')
];

// Department validation
const departmentValidation = [
  body('department_code').trim().notEmpty().withMessage('Mã phòng ban không được để trống'),
  body('department_name').trim().notEmpty().withMessage('Tên phòng ban không được để trống'),
  body('department_type').isIn(['simple', 'admin', 'special']).withMessage('Loại phòng ban không hợp lệ')
];

// Document validation
const documentValidation = [
  body('title').trim().notEmpty().withMessage('Tiêu đề không được để trống'),
  body('category_id').isInt().withMessage('Category ID phải là số nguyên')
];

// Schedule validation
const scheduleValidation = [
  body('schedule_type').isIn(['duty', 'weekly_work']).withMessage('Loại lịch không hợp lệ'),
  body('week').isInt({ min: 1, max: 53 }).withMessage('Tuần phải từ 1-53'),
  body('year').isInt({ min: 2020, max: 2100 }).withMessage('Năm không hợp lệ')
];

// Shift validation
const shiftValidation = [
  body('schedule_id').isInt().withMessage('Schedule ID không hợp lệ'),
  body('shift_date').isISO8601().withMessage('Ngày không hợp lệ (định dạng: YYYY-MM-DD)'),
  body('shift_type').isIn(['morning', 'afternoon', 'night']).withMessage('Loại ca trực không hợp lệ'),
  body('max_staff').optional().isInt({ min: 1 }).withMessage('Số lượng nhân viên phải >= 1')
];

// Login validation
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username không được để trống'),
  body('password').notEmpty().withMessage('Password không được để trống')
];

// Change password validation
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
];

// Category validation
const categoryValidation = [
  body('category_name').trim().notEmpty().withMessage('Tên danh mục không được để trống')
];

module.exports = {
  userCreateValidation,
  userUpdateValidation,
  departmentValidation,
  documentValidation,
  scheduleValidation,
  shiftValidation,
  loginValidation,
  changePasswordValidation,
  categoryValidation
};
