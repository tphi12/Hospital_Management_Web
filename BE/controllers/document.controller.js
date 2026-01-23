const { Document, User, Department } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Upload new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - departmentId
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               departmentId:
 *                 type: integer
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { title, content, departmentId } = req.body;
    const file = req.file;

    const document = await Document.create({
      title,
      content,
      filePath: file ? file.path : null,
      fileType: file ? file.mimetype : null,
      departmentId,
      uploadedBy: req.user.id,
      status: 'PENDING'
    });

    const documentWithDetails = await Document.findByPk(document.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({ 
      message: 'Upload tài liệu thành công',
      document: documentWithDetails 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of documents
 */
exports.getAllDocuments = async (req, res) => {
  try {
    const { search, status, departmentId } = req.query;
    
    let whereClause = {};

    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    if (status) {
      whereClause.status = status;
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    // Role-based filtering
    const userRole = req.user.role;
    
    // Regular employees can only see approved documents or their own
    if (userRole === 'NHAN_VIEN') {
      whereClause[Op.or] = [
        { status: 'APPROVED' },
        { uploadedBy: req.user.id }
      ];
    }
    // Department managers can see their department's documents
    else if (userRole === 'TRUONG_PHONG' || userRole === 'VAN_THU_PHONG_BAN') {
      if (!departmentId) {
        whereClause.departmentId = req.user.departmentId;
      }
    }
    // ADMIN, VAN_THU can see all

    const documents = await Document.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'fullName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ 
      count: documents.length,
      documents 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
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
 *         description: Document details
 *       404:
 *         description: Document not found
 */
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'fullName']
        }
      ]
    });

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    // Check permissions
    const userRole = req.user.role;
    if (userRole === 'NHAN_VIEN') {
      if (document.status !== 'APPROVED' && document.uploadedBy !== req.user.id) {
        return res.status(403).json({ message: 'Bạn không có quyền xem tài liệu này' });
      }
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Update document
 *     tags: [Documents]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       403:
 *         description: Not allowed to edit approved documents
 *       404:
 *         description: Document not found
 */
exports.updateDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    // Check permissions
    const userRole = req.user.role;
    
    // VAN_THU can edit all documents
    if (userRole === 'VAN_THU') {
      // Allow
    }
    // ADMIN can edit all documents
    else if (userRole === 'ADMIN') {
      // Allow
    }
    // Regular users can only edit their own PENDING documents
    else if (document.uploadedBy !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa tài liệu này' });
    } else if (document.status === 'APPROVED' && userRole !== 'TRUONG_PHONG') {
      return res.status(403).json({ message: 'Không thể chỉnh sửa tài liệu đã được duyệt' });
    }

    const { title, content } = req.body;
    const file = req.file;

    // Delete old file if new file uploaded
    if (file && document.filePath) {
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
    }

    await document.update({
      title: title || document.title,
      content: content !== undefined ? content : document.content,
      filePath: file ? file.path : document.filePath,
      fileType: file ? file.mimetype : document.fileType
    });

    res.json({ 
      message: 'Cập nhật tài liệu thành công',
      document 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/documents/{id}/approve:
 *   patch:
 *     summary: Approve/Reject document (Manager or VAN_THU only)
 *     tags: [Documents]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document status updated
 *       404:
 *         description: Document not found
 */
exports.approveDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const { status, rejectionReason } = req.body;

    await document.update({
      status,
      approvedBy: req.user.id,
      approvedAt: new Date(),
      rejectionReason: status === 'REJECTED' ? rejectionReason : null
    });

    res.json({ 
      message: status === 'APPROVED' ? 'Duyệt tài liệu thành công' : 'Từ chối tài liệu',
      document 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
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
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 */
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    // Check permissions
    const userRole = req.user.role;
    
    // VAN_THU and ADMIN can delete all documents
    if (userRole !== 'VAN_THU' && userRole !== 'ADMIN') {
      // Regular users can only delete their own PENDING documents
      if (document.uploadedBy !== req.user.id || document.status !== 'PENDING') {
        return res.status(403).json({ message: 'Bạn không có quyền xoá tài liệu này' });
      }
    }

    // Delete file if exists
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await document.destroy();

    res.json({ message: 'Xoá tài liệu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
