const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.get('/:id', shiftController.getShiftById);
router.post('/', shiftController.createShift);
router.put('/:id', shiftController.updateShift);
router.delete('/:id', shiftController.deleteShift);

// Shift assignments
router.post('/:id/assign', shiftController.assignStaff);
router.delete('/assignments/:id', shiftController.removeAssignment);

module.exports = router;
