// backend/src/routes/designationRoutes.js
const express = require('express');
const router = express.Router();
const designationController = require('../controllers/designationController');
const { verifyToken, requireCompanyRole } = require('../middleware/authMiddleware');

// All designation routes require authentication
router.use(verifyToken);

// All authenticated users can VIEW designations (needed for employee forms, dropdowns)
router.get('/', designationController.getDesignations);

// Only COMPANY_ADMIN or HR can manage company-specific designations
// SUPER_ADMIN is a platform admin — company structure is configured by Company Admin/HR
router.post('/',   requireCompanyRole('HR'), designationController.createDesignation);
router.put('/:id', requireCompanyRole('HR'), designationController.updateDesignation);
router.delete('/:id', requireCompanyRole('HR'), designationController.deleteDesignation);

module.exports = router;
