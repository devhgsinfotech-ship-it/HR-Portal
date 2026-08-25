// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { login, register, verifyEmail, acceptInvite, resendVerification, forgotPassword, resetPassword, getCompanyLogo } = require('../controllers/authController');

// Use persistent upload directory configured in env (falls back to local uploads folder)
const UPLOAD_BASE = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH) 
    : path.resolve('uploads');

const logoDir = path.join(UPLOAD_BASE, 'logos');
if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, logoDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// GET /auth/company-logo — look up logo by subdomain/email
router.get('/company-logo', getCompanyLogo);

// POST /auth/upload-logo — upload logo during register
router.post('/upload-logo', upload.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No logo file provided.' });
    const fileUrl = `/uploads/logos/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
});

// POST /auth/login
router.post('/login', login);
// POST /auth/register — new company registration
router.post('/register', register);
// POST /auth/verify-email — verify email token
router.post('/verify-email', verifyEmail);
// POST /auth/accept-invite
router.post('/accept-invite', acceptInvite);
// POST /auth/resend-verification — resend the verification email
router.post('/resend-verification', resendVerification);

// POST /auth/forgot-password
router.post('/forgot-password', forgotPassword);
// POST /auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;
