// backend/src/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireCompanyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// ── Employee self-service: clock in/out, breaks, own status ──
// SUPER_ADMIN does not clock in (not an employee), but routes are accessible for support review
router.get('/today',      attendanceController.getTodayStatus);
router.post('/check-in',  attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.post('/break-in',  attendanceController.breakIn);
router.post('/break-out', attendanceController.breakOut);

// ── Attendance Logs — SUPER_ADMIN has VIEW/support access, not edit ──
router.get('/logs', attendanceController.getAttendanceLogs);

// Admin direct edit: Company Admin/HR only — not daily SUPER_ADMIN task
router.put('/logs/:id', requireCompanyRole('HR'), attendanceController.updateAttendanceLog);

// ── Regularization routes ──
router.post('/regularize',              attendanceController.submitRegularization);
router.get('/regularize/requests',      attendanceController.getRegularizationRequests);
// Only Company Admin/HR can review regularization requests
router.put('/regularize/:id',           requireCompanyRole('HR'), attendanceController.reviewRegularization);

// ── Attendance Policy — Company Admin/HR only (not SUPER_ADMIN daily task) ──
router.get('/policy', attendanceController.getPolicy);
router.put('/policy', requireCompanyRole('HR'), attendanceController.upsertPolicy);

module.exports = router;
