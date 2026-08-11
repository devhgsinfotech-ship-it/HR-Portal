// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, register, verifyEmail, acceptInvite } = require('../controllers/authController');

// POST /auth/login
router.post('/login', login);
// POST /auth/register — new company registration
router.post('/register', register);
// POST /auth/verify-email — verify email token
router.post('/verify-email', verifyEmail);
// POST /auth/accept-invite
router.post('/accept-invite', acceptInvite);

module.exports = router;
