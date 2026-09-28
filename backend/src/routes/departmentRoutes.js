// backend/src/routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken, requireCompanyRole } = require('../middleware/authMiddleware');

// All department routes require authentication
router.use(verifyToken);

// All authenticated users can VIEW departments (needed for employee forms, dropdowns)
router.get('/', departmentController.getDepartments);

// Only COMPANY_ADMIN or HR can manage company-specific departments
// SUPER_ADMIN is a platform admin — company structure is configured by Company Admin/HR
router.post('/',   requireCompanyRole('HR'), departmentController.createDepartment);
router.put('/:id', requireCompanyRole('HR'), departmentController.updateDepartment);
router.delete('/:id', requireCompanyRole('HR'), departmentController.deleteDepartment);

module.exports = router;
