// backend/src/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Leave Types
router.get('/types', leaveController.getLeaveTypes);
router.post('/types', requireRole('HR', 'SUPER_ADMIN'), leaveController.createLeaveType);
router.put('/types/:id', requireRole('HR', 'SUPER_ADMIN'), leaveController.updateLeaveType);
router.delete('/types/:id', requireRole('HR', 'SUPER_ADMIN'), leaveController.deleteLeaveType);

// Leave Requests
router.get('/on-leave-today', leaveController.getOnLeaveToday);
router.get('/requests', leaveController.getLeaveRequests);
router.post('/apply', leaveController.applyLeave);
router.put('/requests/:id', leaveController.updateLeaveRequest);
router.put('/requests/:id/status', requireRole('HR', 'MANAGER', 'SUPER_ADMIN'), leaveController.updateLeaveStatus);

// Leave Balances
router.get('/balances', leaveController.getLeaveBalances);

// Leave Admin Summary
router.get('/admin-summary', requireRole('HR', 'MANAGER', 'SUPER_ADMIN'), leaveController.getLeaveAdminSummary);

// Leave Policies
router.get('/policies', leaveController.getLeavePolicies);
router.post('/policies', requireRole('HR', 'SUPER_ADMIN'), leaveController.createLeavePolicy);
router.put('/policies/:id', requireRole('HR', 'SUPER_ADMIN'), leaveController.updateLeavePolicy);
router.delete('/policies/:id', requireRole('HR', 'SUPER_ADMIN'), leaveController.deleteLeavePolicy);

module.exports = router;
