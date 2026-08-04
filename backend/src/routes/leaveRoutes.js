// backend/src/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Leave Types
router.get('/types', leaveController.getLeaveTypes);
router.post('/types', requireRole('HR', 'SUPER_ADMIN'), leaveController.createLeaveType);

// Leave Requests
router.get('/requests', leaveController.getLeaveRequests);
router.post('/apply', leaveController.applyLeave);
router.put('/requests/:id/status', requireRole('HR', 'MANAGER', 'SUPER_ADMIN'), leaveController.updateLeaveStatus);

// Leave Balances
router.get('/balances', leaveController.getLeaveBalances);

module.exports = router;
