const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { checkSchedulePermission } = require('../middleware/authorize');

// All routes require authentication
router.use(auth);

// Get schedules (all authenticated users can view approved schedules)
router.get('/', scheduleController.getAllSchedules);
router.get('/master/export/pdf', scheduleController.exportMasterDutySchedulePdf);

// Get current user's schedule data
router.get('/me/duty-schedules', scheduleController.getUserDutySchedules);
router.get('/me/weekly-work-items', scheduleController.getUserWeeklyWorkItems);

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

// Weekly Work Items CRUD endpoints
// Get all weekly work items for a schedule
router.get('/:id/weekly-items', scheduleController.getWeeklyWorkItems);

// Get single weekly work item
router.get('/:id/weekly-items/:itemId', scheduleController.getWeeklyWorkItemById);

// Create weekly work item
router.post('/:id/weekly-items', scheduleController.addWeeklyWorkItem);

// Import weekly work items from file (xlsx/csv)
router.post('/:id/weekly-items/import', upload.single('file'), scheduleController.importWeeklyWorkItems);

// Update weekly work item
router.put('/:id/weekly-items/:itemId', scheduleController.updateWeeklyWorkItem);

// Delete weekly work item
router.delete('/:id/weekly-items/:itemId', scheduleController.deleteWeeklyWorkItem);

module.exports = router;
