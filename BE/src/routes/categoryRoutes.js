const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const { checkAdmin } = require('../middleware/authorize');

router.use(auth);

router.get('/', categoryController.getAllCategories);
router.post('/', checkAdmin, categoryController.createCategory);

module.exports = router;
