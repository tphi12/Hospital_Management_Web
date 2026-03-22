const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { checkAdmin } = require('../middleware/authorize');

// All routes require authentication
router.use(auth);

router.get('/', userController.getAllUsers);
router.get('/picker/users', userController.getUsersForPicker);
router.get('/picker/departments', userController.getDepartmentsForFilter);
router.get('/picker/by-ids', userController.getUsersByIds);
router.get('/:id', checkAdmin, userController.getUserById);
router.post('/', checkAdmin, userController.createUser);
router.put('/:id', checkAdmin, userController.updateUser);
router.patch('/:id/status', checkAdmin, userController.updateUserStatus);
router.delete('/:id', checkAdmin, userController.deleteUser);
router.post('/:id/roles', checkAdmin, userController.assignRole);

module.exports = router;
