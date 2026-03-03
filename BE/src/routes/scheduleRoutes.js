const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/auth');
const { checkSchedulePermission } = require('../middleware/authorize');

// All routes require authentication
router.use(auth);

// Get schedules (all authenticated users can view approved schedules)
router.get('/', scheduleController.getAllSchedules);
router.get('/master/export/pdf', scheduleController.exportMasterDutySchedulePdf);
router.get('/:id/export/pdf', scheduleController.exportSchedulePdf);
router.get('/:id', scheduleController.getScheduleById);

// Create schedule (Department clerk or KHTH)
router.post(
  '/',
  checkSchedulePermission('create'),
  scheduleController.createSchedule
);

// Update schedule
router.put(
  '/:id',
  checkSchedulePermission('edit'),
  scheduleController.updateSchedule
);

// Submit schedule to KHTH (Department clerk)
router.patch('/:id/submit', scheduleController.submitSchedule);

// Approve schedule (KHTH only)
router.patch('/:id/approve', scheduleController.approveSchedule);

// Delete schedule (KHTH or Admin)
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
