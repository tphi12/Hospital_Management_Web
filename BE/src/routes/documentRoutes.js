const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const { checkDocumentPermission } = require('../middleware/authorize');
const { upload, handleMulterError } = require('../middleware/upload');

// All routes require authentication
router.use(auth);

// Get documents
router.get('/', documentController.getAllDocuments);
router.get('/stats', documentController.getDocumentStats);
router.get('/my', documentController.getMyDocuments);
router.get('/:id', documentController.getDocumentById);

// Upload new document
router.post(
  '/',
  upload.single('file'),
  handleMulterError,
  documentController.uploadDocument
);

// Update document
router.put(
  '/:id',
  checkDocumentPermission('edit'),
  upload.single('file'),
  handleMulterError,
  documentController.updateDocument
);

// Approve/Reject document (Manager only)
router.patch(
  '/:id/approve',
  checkDocumentPermission('approve'),
  documentController.approveDocument
);

router.patch(
  '/:id/reject',
  checkDocumentPermission('approve'),
  documentController.rejectDocument
);

// Delete document
router.delete(
  '/:id',
  checkDocumentPermission('delete'),
  documentController.deleteDocument
);

module.exports = router;
