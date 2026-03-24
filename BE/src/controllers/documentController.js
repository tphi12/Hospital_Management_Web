const Document = require('../models/Document');
const Category = require('../models/Category');
const { uploadFileToBlob, deleteFileFromBlob } = require('../config/azureStorage');
const { generateFileName } = require('../middleware/upload');
const https = require('https');

/**
 * @swagger
 * /documents:
 *   get:
 *     tags: [Documents]
 *     summary: Lấy danh sách tài liệu
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, approved, rejected]
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
const getAllDocuments = async (req, res) => {
  try {
    console.log(req.query);
    const filters = {
      search: req.query.search,
      status: req.query.status,
      category_id: req.query.category_id,
      department_id: req.query.department_id,
      limit: req.query.limit,
      offset: req.query.offset,
    };

    // Check user roles
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(r => r.role_code === 'ADMIN');
    const isHospitalClerk = userRoles.some(r =>
      r.role_code === 'HOSPITAL_CLERK' ||
      (r.role_code === 'CLERK' && r.scope_type === 'hospital')
    );

    // Admin and Hospital Clerk can see all documents
    if (isAdmin || isHospitalClerk) {
      const documents = await Document.findAll(filters);
      return res.json({
        success: true,
        data: documents
      });
    }

    // Regular users: see approved documents of all departments
    // OR all documents (pending/draft) of their own department/uploaded by them
    const documents = await Document.findAll(filters);

    // Filter based on permission
    const filteredDocuments = documents.filter(doc => {
      // Approved documents: everyone can see
      if (doc.status === 'approved') return true;

      // Non-approved: only if from same department or uploaded by user
      return doc.department_id === req.user.department_id ||
        doc.uploaded_by === req.user.userId;
    });

    res.json({
      success: true,
      data: filteredDocuments
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Lấy thông tin chi tiết tài liệu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài liệu'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents:
 *   post:
 *     tags: [Documents]
 *     summary: Upload tài liệu mới
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category_id
 *               - file
 *             properties:
 *               title:
 *                 type: string
 *               category_id:
 *                 type: integer
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Upload thành công
 */
const uploadDocument = async (req, res) => {
  const io = req.app.get('io');
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file để upload'
      });
    }

    const { title, category_id, description } = req.body;

    if (!title || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    // Generate unique filename
    const fileName = generateFileName(req.file.originalname);

    // Upload to Azure Blob
    const fileUrl = await uploadFileToBlob(
      fileName,
      req.file.buffer,
      req.file.mimetype
    );

    // Create document record
    const documentId = await Document.create({
      title,
      file_name: req.file.originalname,
      file_path: fileUrl,
      file_type: req.file.mimetype,
      file_size: req.file.size,
      category_id,
      department_id: req.user.department_id,
      uploaded_by: req.user.userId,
      status: 'pending'
    });

    io.emit('notification', {
      type: 'NEW_DOCUMENT',
      message: 'Tài liệu mới đã được upload',
      data: {
        documentId,
        title,
        category_id,
        file_name: req.file.originalname,
        file_path: fileUrl,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        department_id: req.user.department_id,
        uploaded_by: req.user.userId,
        status: 'pending'
      }
    })

    res.status(201).json({
      success: true,
      message: 'Upload tài liệu thành công',
      data: { documentId, fileUrl }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi upload tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents/{id}:
 *   put:
 *     tags: [Documents]
 *     summary: Cập nhật tài liệu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category_id:
 *                 type: integer
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài liệu'
      });
    }

    // Check permission
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(r => r.role_code === 'ADMIN');
    const isHospitalClerk = userRoles.some(r =>
      r.role_code === 'HOSPITAL_CLERK' ||
      (r.role_code === 'CLERK' && r.scope_type === 'hospital')
    );
    const isOwner = document.uploaded_by === req.user.userId;

    // Only owner can edit if status is draft or pending
    if (!isAdmin && !isHospitalClerk) {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền chỉnh sửa tài liệu này'
        });
      }

      if (document.status === 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Không thể chỉnh sửa tài liệu đã được duyệt'
        });
      }
    }

    const updateData = {
      title: req.body.title,
      category_id: req.body.category_id
    };

    // If new file is uploaded
    if (req.file) {
      // Delete old file from Azure
      try {
        const oldFileName = document.file_path.split('/').pop();
        await deleteFileFromBlob(oldFileName);
      } catch (error) {
        console.error('Error deleting old file:', error);
      }

      // Upload new file
      const fileName = generateFileName(req.file.originalname);
      const fileUrl = await uploadFileToBlob(
        fileName,
        req.file.buffer,
        req.file.mimetype
      );

      updateData.file_name = req.file.originalname;
      updateData.file_path = fileUrl;
      updateData.file_type = req.file.mimetype;
      updateData.file_size = req.file.size;
    }

    await Document.update(documentId, updateData, req.user.userId);

    res.json({
      success: true,
      message: 'Cập nhật tài liệu thành công'
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents/{id}/approve:
 *   patch:
 *     tags: [Documents]
 *     summary: Duyệt tài liệu (Trưởng phòng)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Duyệt tài liệu thành công
 */
const approveDocument = async (req, res) => {
  const io = req.app.get('io');
  console.log(req.user);
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài liệu'
      });
    }

    if (document.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể duyệt tài liệu đang ở trạng thái chờ duyệt'
      });
    }

    // Check if manager of the same department
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(r => r.role_code === 'ADMIN');
    const isHospitalClerk = userRoles.some(r =>
      r.role_code === 'HOSPITAL_CLERK' ||
      (r.role_code === 'CLERK' && r.scope_type === 'hospital')
    );
    const isManagerInDept = userRoles.some(r =>
      r.role_code === 'MANAGER' &&
      (r.scope_type === 'hospital' || r.department_id === document.department_id)
    );

    if (!isAdmin && !isHospitalClerk && !isManagerInDept) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền duyệt tài liệu này'
      });
    }

    await Document.approve(documentId, req.user.userId);

    io.emit('notification', {
      type: 'APPROVE_DOCUMENT',
      message: `Tài liệu "${document.title}" đã được duyệt`,
      data: {
        documentId,
        title: document.title,
        category_id: document.category_id,
        file_name: document.file_name,
        file_path: document.file_path,
        file_type: document.file_type,
        file_size: document.file_size,
        department_id: document.department_id,
        uploaded_by: document.uploaded_by,
        status: 'approved'
      }
    })

    res.json({
      success: true,
      message: 'Duyệt tài liệu thành công'
    });
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi duyệt tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents/{id}/reject:
 *   patch:
 *     tags: [Documents]
 *     summary: Từ chối tài liệu (Trưởng phòng)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Từ chối tài liệu thành công
 */
const rejectDocument = async (req, res) => {
  const io = req.app.get('io');
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài liệu'
      });
    }

    await Document.reject(documentId, req.user.userId);

    io.emit('notification', {
      type: 'REJECT_DOCUMENT',
      message: `Tài liệu "${document.title}" đã bị từ chối`,
      data: {
        documentId,
        title: document.title,
        category_id: document.category_id,
        file_name: document.file_name,
        file_path: document.file_path,
        file_type: document.file_type,
        file_size: document.file_size,
        department_id: document.department_id,
        uploaded_by: document.uploaded_by,
        status: 'rejected'
      }
    })

    res.json({
      success: true,
      message: 'Từ chối tài liệu thành công'
    });
  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi từ chối tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Xóa tài liệu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài liệu'
      });
    }

    // Check permission
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.some(r => r.role_code === 'ADMIN');
    const isHospitalClerk = userRoles.some(r =>
      r.role_code === 'HOSPITAL_CLERK' ||
      (r.role_code === 'CLERK' && r.scope_type === 'hospital')
    );

    // Hospital clerk and Admin can delete any document
    if (isAdmin || isHospitalClerk) {
      await Document.softDelete(documentId);
      return res.json({
        success: true,
        message: 'Xóa tài liệu thành công'
      });
    }

    // Owner can only delete draft/pending documents
    const isOwner = document.uploaded_by === req.user.userId;
    if (isOwner && ['draft', 'pending'].includes(document.status)) {
      await Document.softDelete(documentId);
      return res.json({
        success: true,
        message: 'Xóa tài liệu thành công'
      });
    }

    res.status(403).json({
      success: false,
      message: 'Bạn không có quyền xóa tài liệu này'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents/stats:
 *   get:
 *     tags: [Documents]
 *     summary: Lấy thống kê tài liệu
 *     parameters:
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
const getDocumentStats = async (req, res) => {
  try {
    const { department_id } = req.query;
    const stats = await Document.getStats(department_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents/my:
 *   get:
 *     tags: [Documents]
 *     summary: Lấy danh sách tài liệu của tôi
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
const getMyDocuments = async (req, res) => {
  try {
    console.log("user", req.user)
    console.log("query", req.query);
    const filters = {
      uploaded_by: req.user.userId,
      status: req.query.status,
      search: req.query.search
    };

    const documents = await Document.findAll(filters);

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get my documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents/{id}/download:
 *   get:
 *     tags: [Documents]
 *     summary: Tải xuống tài liệu
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tải file thành công
 */
const downloadDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài liệu'
      });
    }

    // Fetch file from Azure Blob and stream to client
    // This avoids CORS issues by proxying through our backend
    try {
      // Set appropriate headers for file download
      res.setHeader('Content-Type', document.file_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.file_name)}"`);

      // Stream file from Azure Blob to client
      https.get(document.file_path, (fileStream) => {
        fileStream.pipe(res);
      }).on('error', (fetchError) => {
        console.error('Error fetching file from Azure:', fetchError);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Lỗi tải file từ storage'
          });
        }
      });

    } catch (fetchError) {
      console.error('Error fetching file from Azure:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Lỗi tải file từ storage'
      });
    }

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tải tài liệu',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /documents/unapproved:
 *   get:
 *     tags: [Documents]
 *     summary: Lấy danh sách tài liệu chưa được duyệt
 *     responses:
 *       200:
 *         description: Tải file thành công
 */
const getPendingDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      status: 'pending'
    });
    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get pending documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách tài liệu chờ duyệt',
      error: error.message
    });
  }
}

module.exports = {
  getAllDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  approveDocument,
  rejectDocument,
  deleteDocument,
  getDocumentStats,
  getMyDocuments,
  downloadDocument,
  getPendingDocuments,
};
