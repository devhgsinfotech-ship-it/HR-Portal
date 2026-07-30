// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, register, verifyEmail } = require('../controllers/authController');

// POST /auth/login
router.post('/login', login);
// POST /auth/register — new company registration
router.post('/register', register);
// POST /auth/verify-email — verify email token
router.post('/verify-email', verifyEmail);

module.exports = router;
