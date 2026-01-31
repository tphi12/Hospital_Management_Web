const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const auth = require('../middleware/auth');
const { checkAdmin } = require('../middleware/authorize');

// All routes require authentication
router.use(auth);

// Public endpoints (all authenticated users)
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.get('/:id/members', departmentController.getDepartmentMembers);

// Admin only endpoints
router.post('/', checkAdmin, departmentController.createDepartment);
router.put('/:id', checkAdmin, departmentController.updateDepartment);
router.delete('/:id', checkAdmin, departmentController.deleteDepartment);

module.exports = router;
