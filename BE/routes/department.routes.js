const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Department management
 */

router.use(verifyToken);

// Public routes (authenticated users)
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);

// ADMIN only routes
router.post('/', isAdmin, departmentController.createDepartment);
router.get('/:id/members', isAdmin, departmentController.getDepartmentMembers);
router.put('/:id', isAdmin, departmentController.updateDepartment);
router.delete('/:id', isAdmin, departmentController.deleteDepartment);

module.exports = router;
