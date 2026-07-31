// backend/src/routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken } = require('../middleware/authMiddleware');

// All department routes require authentication
router.use(verifyToken);

router.post('/', departmentController.createDepartment);
router.get('/', departmentController.getDepartments);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;
