// backend/src/routes/systemSettingsRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getSystemSettings,
    updateSystemSettings,
    getCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    setDefaultCurrency,
    getEmailStatus,
    sendTestEmailHandler,
} = require('../controllers/systemSettingsController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const UPLOAD_BASE = process.env.UPLOAD_PATH
    ? path.resolve(process.env.UPLOAD_PATH)
    : path.resolve('uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(UPLOAD_BASE, 'logos');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'system-logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// System Settings endpoints
router.get('/', getSystemSettings);
router.put('/', verifyToken, upload.single('logo'), updateSystemSettings);

// Email Server Status & Testing endpoints
router.get('/email-status', verifyToken, getEmailStatus);
router.post('/send-test-email', verifyToken, sendTestEmailHandler);

// Currency Management endpoints
router.get('/currencies', getCurrencies);
router.post('/currencies', verifyToken, createCurrency);
router.put('/currencies/:id', verifyToken, updateCurrency);
router.delete('/currencies/:id', verifyToken, deleteCurrency);
router.post('/set-default-currency', verifyToken, setDefaultCurrency);

module.exports = router;
