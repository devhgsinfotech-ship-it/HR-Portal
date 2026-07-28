// backend/src/routes/employeeRoutes.js

const express = require('express');
const router = express.Router();

const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const checkTabAccess = require('../middleware/checkTabAccess');
const { getAllEmployees, getMySalary } = require('../controllers/employeeController');

// HR-only: list all employees
router.get('/', authMiddleware, checkRole('hr'), getAllEmployees);

// Employee-only: view own salary, gated by HR-controlled tab access
router.get('/me/salary', authMiddleware, checkTabAccess('salary'), getMySalary);

module.exports = router;
