// backend/src/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/today', attendanceController.getTodayStatus);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.post('/break-in', attendanceController.breakIn);
router.post('/break-out', attendanceController.breakOut);
router.get('/logs', attendanceController.getAttendanceLogs);

// Regularization routes
router.post('/regularize', attendanceController.submitRegularization);
router.get('/regularize/requests', attendanceController.getRegularizationRequests);
router.put('/regularize/:id', attendanceController.reviewRegularization);

// Attendance Policy routes (HR/Admin only)
router.get('/policy', attendanceController.getPolicy);
router.put('/policy', attendanceController.upsertPolicy);

module.exports = router;
