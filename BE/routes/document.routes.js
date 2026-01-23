const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { verifyToken, canManageDocuments } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document management
 */

router.use(verifyToken);

router.post('/', upload.single('document'), documentController.uploadDocument);
router.get('/', documentController.getAllDocuments);
router.get('/:id', documentController.getDocumentById);
router.put('/:id', upload.single('document'), documentController.updateDocument);
router.patch('/:id/approve', canManageDocuments, documentController.approveDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
