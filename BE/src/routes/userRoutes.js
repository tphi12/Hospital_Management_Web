const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { checkAdmin } = require('../middleware/authorize');

// All routes require authentication and admin role
router.use(auth);
router.use(checkAdmin);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/status', userController.updateUserStatus);
router.delete('/:id', userController.deleteUser);
router.post('/:id/roles', userController.assignRole);

module.exports = router;
