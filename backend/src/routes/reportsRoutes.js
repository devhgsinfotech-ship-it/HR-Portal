// backend/src/routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Reports Endpoints
router.get('/attendance', controller.getAttendanceReport);
router.get('/leave', controller.getLeaveReport);
router.get('/payslip', controller.getPayslipReport);
router.get('/employee', controller.getEmployeeReport);

module.exports = router;
