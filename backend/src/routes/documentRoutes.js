// backend/src/routes/documentRoutes.js
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UPLOAD_BASE = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH) 
    : path.resolve('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_BASE, 'documents');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `doc-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.use(verifyToken);

router.get('/employee/:employeeId', documentController.getEmployeeDocuments);
router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.put('/:id/verify', requireRole('COMPANY_ADMIN', 'HR'), documentController.verifyDocument);
router.delete('/:id', requireRole('COMPANY_ADMIN', 'HR'), documentController.deleteDocument);

module.exports = router;
