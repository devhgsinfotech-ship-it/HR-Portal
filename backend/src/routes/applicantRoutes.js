// backend/src/routes/applicantRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const applicantController = require('../controllers/applicantController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const UPLOAD_BASE = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH) 
    : path.resolve('uploads');

const docDir = path.join(UPLOAD_BASE, 'documents');
if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, docDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Public route: Candidates (internal employees or external applicants) can apply for jobs without login barrier
router.post('/apply', upload.single('resume'), applicantController.publicApplyJob);

// Authenticated ATS Management routes
router.use(verifyToken);

router.get('/', applicantController.getApplicants);
router.post('/', requireRole('COMPANY_ADMIN', 'HR'), upload.single('resume'), applicantController.createApplicant);
router.put('/:id/stage', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), applicantController.updateApplicantStage);
router.post('/:id/schedule-interview', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), applicantController.scheduleInterview);
router.put('/interview/:interviewId/scorecard', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), applicantController.submitInterviewScorecard);
router.delete('/:id', requireRole('COMPANY_ADMIN', 'HR'), applicantController.deleteApplicant);

module.exports = router;

