const express = require('express');
const router = express.Router();
const { getHolidays, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/holidayController');
const { verifyToken, requireCompanyRole } = require('../middleware/authMiddleware');

// All holiday routes require authentication
router.use(verifyToken);

// All authenticated users can view holidays
router.get('/', getHolidays);

// Only COMPANY_ADMIN or HR can manage company holidays
// SUPER_ADMIN is a platform admin — company holidays are managed by Company Admin/HR
router.post('/',     requireCompanyRole('HR'), createHoliday);
router.put('/:id',   requireCompanyRole('HR'), updateHoliday);
router.delete('/:id', requireCompanyRole('HR'), deleteHoliday);

module.exports = router;
