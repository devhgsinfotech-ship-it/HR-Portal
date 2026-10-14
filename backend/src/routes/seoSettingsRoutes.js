// backend/src/routes/seoSettingsRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getSeoSettings,
    updateSeoSettings,
    getPublicSeoSettings,
} = require('../controllers/seoSettingsController');
const { verifyToken } = require('../middleware/authMiddleware');

const UPLOAD_BASE = process.env.UPLOAD_PATH
    ? path.resolve(process.env.UPLOAD_PATH)
    : path.resolve('uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(UPLOAD_BASE, 'seo');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'og-image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|gif|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed'));
    }
});

// Public endpoint for crawlers / frontend bootstrap
router.get('/public', getPublicSeoSettings);

// Authenticated endpoints for company admin / super admin
router.get('/', verifyToken, getSeoSettings);
router.put('/', verifyToken, upload.single('ogImage'), updateSeoSettings);

module.exports = router;
