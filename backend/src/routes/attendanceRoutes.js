// backend/src/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/today', attendanceController.getTodayStatus);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/logs', attendanceController.getAttendanceLogs);

module.exports = router;
