const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);

module.exports = router;
