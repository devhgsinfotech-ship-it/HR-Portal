// backend/src/routes/announcementRoutes.js
const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UPLOAD_BASE = process.env.UPLOAD_PATH
    ? path.resolve(process.env.UPLOAD_PATH)
    : path.resolve('uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(UPLOAD_BASE, 'announcements');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `announcement-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.use(verifyToken);

// All authenticated employees can read announcements
router.get('/', getAnnouncements);

// Only HR and SUPER_ADMIN can create, edit, delete
router.post('/',        requireRole('HR', 'SUPER_ADMIN'), upload.single('image'), createAnnouncement);
router.put('/:id',      requireRole('HR', 'SUPER_ADMIN'), upload.single('image'), updateAnnouncement);
router.delete('/:id',   requireRole('HR', 'SUPER_ADMIN'), deleteAnnouncement);

module.exports = router;
