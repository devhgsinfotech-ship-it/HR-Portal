// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
    login, register, verifyEmail, verifyInviteToken, acceptInvite, 
    resendVerification, forgotPassword, resetPassword, getCompanyLogo,
    getCompanySettings, updateCompanySettings, getProfile, updateProfile
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Use persistent upload directory configured in env (falls back to local uploads folder)
const UPLOAD_BASE = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH) 
    : path.resolve('uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = path.join(UPLOAD_BASE, 'logos');
        if (file.fieldname === 'avatar' || file.fieldname === 'profileImage') {
            dir = path.join(UPLOAD_BASE, 'profiles');
        }
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const prefix = file.fieldname === 'avatar' || file.fieldname === 'profileImage' ? 'profile-' : 'logo-';
        cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
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

// Company Settings endpoints
router.get('/company-settings', verifyToken, getCompanySettings);
router.put('/company-settings', verifyToken, upload.single('logo'), updateCompanySettings);

// User Profile endpoints
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, upload.single('avatar'), updateProfile);

// POST /auth/login
router.post('/login', login);
// POST /auth/register — new company registration
router.post('/register', register);
// POST /auth/verify-email — verify email token
router.post('/verify-email', verifyEmail);
// GET /auth/verify-invite-token
router.get('/verify-invite-token', verifyInviteToken);
// POST /auth/accept-invite
router.post('/accept-invite', acceptInvite);
// POST /auth/resend-verification — resend the verification email
router.post('/resend-verification', resendVerification);

// POST /auth/forgot-password
router.post('/forgot-password', forgotPassword);
// POST /auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;
