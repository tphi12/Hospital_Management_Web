const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Health check endpoints
router.get('/', healthController.getHealth);
router.get('/db', healthController.getDbHealth);
router.get('/storage', healthController.getStorageHealth);
router.get('/live', healthController.getLiveness);
router.get('/ready', healthController.getReadiness);

module.exports = router;
