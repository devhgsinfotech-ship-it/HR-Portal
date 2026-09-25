// backend/src/routes/jobPostingRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jobPostingController = require('../controllers/jobPostingController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const UPLOAD_BASE = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH) 
    : path.resolve('uploads');

const bannerDir = path.join(UPLOAD_BASE, 'banners');
if (!fs.existsSync(bannerDir)) {
    fs.mkdirSync(bannerDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, bannerDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Public unauthenticated route for outside candidates to view job details
router.get('/public/:id', jobPostingController.getJobPostingById);

router.use(verifyToken);

router.get('/', jobPostingController.getJobPostings);
router.get('/:id', jobPostingController.getJobPostingById);
router.post('/', requireRole('COMPANY_ADMIN', 'HR'), upload.single('banner'), jobPostingController.createJobPosting);
router.put('/:id', requireRole('COMPANY_ADMIN', 'HR'), upload.single('banner'), jobPostingController.updateJobPosting);
router.delete('/:id', requireRole('COMPANY_ADMIN', 'HR'), jobPostingController.deleteJobPosting);

module.exports = router;

