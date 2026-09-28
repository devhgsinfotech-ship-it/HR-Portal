// backend/src/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { verifyToken, requireRole, requireCompanyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// ── Leave Types ──
// SUPER_ADMIN can VIEW leave types (support/reporting)
router.get('/types',         leaveController.getLeaveTypes);
// Only Company Admin/HR can create, edit, delete leave types
router.post('/types',        requireCompanyRole('HR'),                    leaveController.createLeaveType);
router.put('/types/:id',     requireCompanyRole('HR'),                    leaveController.updateLeaveType);
router.delete('/types/:id',  requireCompanyRole('HR'),                    leaveController.deleteLeaveType);

// ── Leave Requests ──
// SUPER_ADMIN can VIEW leave requests (support visibility)
router.get('/requests',           leaveController.getLeaveRequests);
router.post('/apply',             leaveController.applyLeave);
router.put('/requests/:id',       leaveController.updateLeaveRequest);
// Only Company Admin/HR/Manager can APPROVE or REJECT leave (not a SUPER_ADMIN daily task)
router.put('/requests/:id/status', requireCompanyRole('HR', 'MANAGER'),   leaveController.updateLeaveStatus);

// ── Leave Balances ──
router.get('/balances', leaveController.getLeaveBalances);

// ── Leave Admin Summary ──
// SUPER_ADMIN can view summaries for support purposes
router.get('/admin-summary', requireRole('HR', 'MANAGER', 'SUPER_ADMIN'), leaveController.getLeaveAdminSummary);

// ── Leave Policies ──
router.get('/policies',          leaveController.getLeavePolicies);
// Only Company Admin/HR can manage leave policies
router.post('/policies',         requireCompanyRole('HR'),                leaveController.createLeavePolicy);
router.put('/policies/:id',      requireCompanyRole('HR'),                leaveController.updateLeavePolicy);
router.delete('/policies/:id',   requireCompanyRole('HR'),                leaveController.deleteLeavePolicy);

module.exports = router;
