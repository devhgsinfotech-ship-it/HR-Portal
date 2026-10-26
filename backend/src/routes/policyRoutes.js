// backend/src/routes/policyRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/policyController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UPLOAD_BASE = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH) 
    : path.resolve('uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(UPLOAD_BASE, 'policies');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `policy-${Date.now()}-${sanitized}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF documents are allowed for company policies'));
        }
    }
});

router.use(verifyToken);

// Metadata (departments)
router.get('/metadata', controller.getPolicyMetadata);

// Download / View Policy PDF
router.get('/:id/download', controller.downloadPolicyPdf);

// Company Policies CRUD (upload.single('file') enables multipart/form-data PDF upload)
router.get('/', controller.getPolicies);
router.post('/', upload.single('file'), controller.createPolicy);
router.put('/:id', upload.single('file'), controller.updatePolicy);
router.delete('/:id', controller.deletePolicy);

module.exports = router;
