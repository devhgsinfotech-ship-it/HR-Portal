const express = require('express');
const router = express.Router();
const { getHolidays, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/holidayController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All holiday routes require authentication
router.use(verifyToken);

// Employees and Managers can view holidays
router.get('/', getHolidays);

// Only HR and SUPER_ADMIN can modify holidays
router.post('/', requireRole('HR', 'SUPER_ADMIN'), createHoliday);
router.put('/:id', requireRole('HR', 'SUPER_ADMIN'), updateHoliday);
router.delete('/:id', requireRole('HR', 'SUPER_ADMIN'), deleteHoliday);

module.exports = router;
