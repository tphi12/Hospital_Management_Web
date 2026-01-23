const { Schedule, ScheduleDetail, User, Department } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Create new schedule (VAN_THU_PHONG_BAN only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weekStart
 *               - weekEnd
 *               - departmentId
 *             properties:
 *               weekStart:
 *                 type: string
 *                 format: date
 *               weekEnd:
 *                 type: string
 *                 format: date
 *               departmentId:
 *                 type: integer
 *               notes:
 *                 type: string
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     date:
 *                       type: string
 *                       format: date
 *                     shift:
 *                       type: string
 *                       enum: [SANG, CHIEU, TOI, DEM]
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Schedule created successfully
 */
exports.createSchedule = async (req, res) => {
  try {
    const { weekStart, weekEnd, departmentId, notes, details } = req.body;

    const schedule = await Schedule.create({
      weekStart,
      weekEnd,
      departmentId,
      createdBy: req.user.id,
      status: 'DRAFT',
      notes
    });

    // Create schedule details if provided
    if (details && details.length > 0) {
      const scheduleDetails = details.map(detail => ({
        scheduleId: schedule.id,
        userId: detail.userId,
        date: detail.date,
        shift: detail.shift,
        notes: detail.notes
      }));
      
      await ScheduleDetail.bulkCreate(scheduleDetails);
    }

    const scheduleWithDetails = await Schedule.findByPk(schedule.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName']
        },
        {
          model: ScheduleDetail,
          as: 'details',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName']
          }]
        }
      ]
    });

    res.status(201).json({ 
      message: 'Tạo lịch trực thành công',
      schedule: scheduleWithDetails 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SUBMITTED, APPROVED]
 *       - in: query
 *         name: weekStart
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of schedules
 */
exports.getAllSchedules = async (req, res) => {
  try {
    const { departmentId, status, weekStart } = req.query;
    
    let whereClause = {};

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (weekStart) {
      whereClause.weekStart = weekStart;
    }

    // Role-based filtering
    const userRole = req.user.role;
    
    // Regular employees can only see approved schedules
    if (userRole === 'NHAN_VIEN') {
      whereClause.status = 'APPROVED';
      if (!departmentId) {
        whereClause.departmentId = req.user.departmentId;
      }
    }
    // Department staff can see their department's schedules
    else if (userRole === 'VAN_THU_PHONG_BAN' || userRole === 'TRUONG_PHONG') {
      if (!departmentId) {
        whereClause.departmentId = req.user.departmentId;
      }
    }
    // KHTH, ADMIN can see all

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'fullName']
        },
        {
          model: ScheduleDetail,
          as: 'details',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName']
          }]
        }
      ],
      order: [['weekStart', 'DESC']]
    });

    res.json({ 
      count: schedules.length,
      schedules 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule details
 *       404:
 *         description: Schedule not found
 */
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'fullName']
        },
        {
          model: ScheduleDetail,
          as: 'details',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'role']
          }]
        }
      ]
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch trực' });
    }

    res.json({ schedule });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/schedules/{id}:
 *   put:
 *     summary: Update schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weekStart:
 *                 type: string
 *                 format: date
 *               weekEnd:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     date:
 *                       type: string
 *                       format: date
 *                     shift:
 *                       type: string
 *                       enum: [SANG, CHIEU, TOI, DEM]
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       404:
 *         description: Schedule not found
 */
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch trực' });
    }

    // Check permissions
    const userRole = req.user.role;
    if (userRole === 'VAN_THU_PHONG_BAN' && schedule.departmentId !== req.user.departmentId) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa lịch trực này' });
    }

    if (schedule.status === 'APPROVED' && userRole !== 'KHTH' && userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Không thể chỉnh sửa lịch trực đã được duyệt' });
    }

    const { weekStart, weekEnd, notes, details } = req.body;

    await schedule.update({
      weekStart: weekStart || schedule.weekStart,
      weekEnd: weekEnd || schedule.weekEnd,
      notes: notes !== undefined ? notes : schedule.notes
    });

    // Update schedule details if provided
    if (details) {
      // Delete old details
      await ScheduleDetail.destroy({ where: { scheduleId: schedule.id } });
      
      // Create new details
      if (details.length > 0) {
        const scheduleDetails = details.map(detail => ({
          scheduleId: schedule.id,
          userId: detail.userId,
          date: detail.date,
          shift: detail.shift,
          notes: detail.notes
        }));
        
        await ScheduleDetail.bulkCreate(scheduleDetails);
      }
    }

    const updatedSchedule = await Schedule.findByPk(schedule.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: ScheduleDetail,
          as: 'details',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'fullName']
          }]
        }
      ]
    });

    res.json({ 
      message: 'Cập nhật lịch trực thành công',
      schedule: updatedSchedule 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/schedules/{id}/submit:
 *   patch:
 *     summary: Submit schedule to KHTH (VAN_THU_PHONG_BAN only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule submitted successfully
 *       404:
 *         description: Schedule not found
 */
exports.submitSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch trực' });
    }

    if (schedule.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Chỉ có thể gửi lịch trực ở trạng thái nháp' });
    }

    await schedule.update({ status: 'SUBMITTED' });

    res.json({ 
      message: 'Gửi lịch trực thành công',
      schedule 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/schedules/{id}/approve:
 *   patch:
 *     summary: Approve schedule (KHTH only)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule approved successfully
 *       404:
 *         description: Schedule not found
 */
exports.approveSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch trực' });
    }

    await schedule.update({
      status: 'APPROVED',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    res.json({ 
      message: 'Duyệt lịch trực thành công',
      schedule 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Delete schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       404:
 *         description: Schedule not found
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch trực' });
    }

    // Check permissions
    const userRole = req.user.role;
    if (userRole !== 'KHTH' && userRole !== 'ADMIN') {
      if (schedule.createdBy !== req.user.id || schedule.status !== 'DRAFT') {
        return res.status(403).json({ message: 'Bạn không có quyền xoá lịch trực này' });
      }
    }

    // Delete schedule details
    await ScheduleDetail.destroy({ where: { scheduleId: schedule.id } });

    // Delete schedule
    await schedule.destroy();

    res.json({ message: 'Xoá lịch trực thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/schedules/my-schedule:
 *   get:
 *     summary: Get current user's schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: User's schedule
 */
exports.getMySchedule = async (req, res) => {
  try {
    const { weekStart } = req.query;
    
    let whereClause = {
      status: 'APPROVED'
    };

    if (weekStart) {
      whereClause.weekStart = weekStart;
    }

    const schedules = await ScheduleDetail.findAll({
      where: {
        userId: req.user.id
      },
      include: [{
        model: Schedule,
        as: 'schedule',
        where: whereClause,
        include: [{
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }]
      }],
      order: [['date', 'ASC']]
    });

    res.json({ 
      count: schedules.length,
      schedules 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
