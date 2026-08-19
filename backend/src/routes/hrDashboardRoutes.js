// backend/src/routes/hrDashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getHrDashboardSummary } = require('../controllers/hrDashboardController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// HR Dashboard summary — HR, Manager, Super Admin only
router.get('/hr-summary', requireRole('HR', 'MANAGER', 'SUPER_ADMIN'), getHrDashboardSummary);

module.exports = router;
