const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.use(auth);

// Get Dashboard Stats
router.get('/', dashboardController.getDashboardStats);

module.exports = router;
