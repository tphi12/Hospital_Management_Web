const { Department, User, Document } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create new department (ADMIN only)
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               managerId:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created successfully
 *       400:
 *         description: Department name already exists
 */
exports.createDepartment = async (req, res) => {
  try {
    const { name, location, managerId, description } = req.body;

    // Check if department name already exists
    const existingDept = await Department.findOne({ where: { name } });
    if (existingDept) {
      return res.status(400).json({ message: 'Tên phòng ban đã tồn tại' });
    }

    const department = await Department.create({
      name,
      location,
      managerId,
      description
    });

    res.status(201).json({ 
      message: 'Tạo phòng ban thành công',
      department 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by department name
 *     responses:
 *       200:
 *         description: List of departments
 */
exports.getAllDepartments = async (req, res) => {
  try {
    const { search } = req.query;
    
    let whereClause = {};
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const departments = await Department.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Document,
          as: 'documents',
          attributes: ['id']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Add count information
    const departmentsWithCount = departments.map(dept => {
      const deptJson = dept.toJSON();
      return {
        ...deptJson,
        memberCount: deptJson.members ? deptJson.members.length : 0,
        documentCount: deptJson.documents ? deptJson.documents.length : 0,
        members: undefined,
        documents: undefined
      };
    });

    res.json({ 
      count: departmentsWithCount.length,
      departments: departmentsWithCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Departments]
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
 *         description: Department details
 *       404:
 *         description: Department not found
 */
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'fullName', 'username', 'email', 'phone', 'role']
        }
      ]
    });

    if (!department) {
      return res.status(404).json({ message: 'Không tìm thấy phòng ban' });
    }

    res.json({ department });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/departments/{id}/members:
 *   get:
 *     summary: Get department members (ADMIN only)
 *     tags: [Departments]
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
 *         description: List of department members
 *       404:
 *         description: Department not found
 */
exports.getDepartmentMembers = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'members',
        attributes: ['id', 'fullName', 'username', 'email', 'phone', 'role']
      }]
    });

    if (!department) {
      return res.status(404).json({ message: 'Không tìm thấy phòng ban' });
    }

    res.json({ 
      departmentName: department.name,
      memberCount: department.members.length,
      members: department.members 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/departments/{id}:
 *   put:
 *     summary: Update department (ADMIN only)
 *     tags: [Departments]
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
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               managerId:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       404:
 *         description: Department not found
 */
exports.updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Không tìm thấy phòng ban' });
    }

    const { name, location, managerId, description } = req.body;

    // Check if new name is taken by another department
    if (name && name !== department.name) {
      const existingDept = await Department.findOne({ where: { name } });
      if (existingDept) {
        return res.status(400).json({ message: 'Tên phòng ban đã tồn tại' });
      }
    }

    await department.update({
      name: name || department.name,
      location: location !== undefined ? location : department.location,
      managerId: managerId !== undefined ? managerId : department.managerId,
      description: description !== undefined ? description : department.description
    });

    res.json({ 
      message: 'Cập nhật phòng ban thành công',
      department 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     summary: Delete department (ADMIN only)
 *     tags: [Departments]
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
 *         description: Department deleted successfully
 *       404:
 *         description: Department not found
 */
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({ message: 'Không tìm thấy phòng ban' });
    }

    // Set departmentId to null for all users in this department
    await User.update(
      { departmentId: null },
      { where: { departmentId: req.params.id } }
    );

    // Set departmentId to null for all documents in this department
    await Document.update(
      { departmentId: null },
      { where: { departmentId: req.params.id } }
    );

    await department.destroy();

    res.json({ message: 'Xoá phòng ban thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
