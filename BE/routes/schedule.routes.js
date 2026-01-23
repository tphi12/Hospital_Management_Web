const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { verifyToken, canManageSchedules, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Schedule management
 */

router.use(verifyToken);

router.get('/my-schedule', scheduleController.getMySchedule);
router.post('/', canManageSchedules, scheduleController.createSchedule);
router.get('/', scheduleController.getAllSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.put('/:id', canManageSchedules, scheduleController.updateSchedule);
router.patch('/:id/submit', checkRole('VAN_THU_PHONG_BAN'), scheduleController.submitSchedule);
router.patch('/:id/approve', checkRole('KHTH', 'ADMIN'), scheduleController.approveSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
