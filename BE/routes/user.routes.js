const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (ADMIN only)
 */

// All user routes require authentication and ADMIN role
router.use(verifyToken, isAdmin);

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id/lock', userController.lockUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
