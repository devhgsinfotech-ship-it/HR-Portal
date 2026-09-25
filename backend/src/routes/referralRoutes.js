// backend/src/routes/referralRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const referralController = require('../controllers/referralController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const UPLOAD_BASE = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH) 
    : path.resolve('uploads');

const docDir = path.join(UPLOAD_BASE, 'documents');
if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, docDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'referral-resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.use(verifyToken);

router.get('/', referralController.getReferrals);
router.post('/', upload.single('resume'), referralController.createReferral);
router.put('/:id/status', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), referralController.updateReferralStatus);
router.delete('/:id', requireRole('COMPANY_ADMIN', 'HR'), referralController.deleteReferral);

module.exports = router;
