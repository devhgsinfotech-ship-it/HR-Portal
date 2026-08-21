// backend/src/routes/timesheetRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireProjectAccess, requireFinanceAccess } = require('../middleware/projectPermission');
const {
  logTime,
  getTimeLogs,
  getAllTimeLogs,
  approveTimeLog,
  deleteTimeLog,
} = require('../controllers/timesheetController');

// Finance/Admin only — MUST be before /:id routes
router.get('/all', verifyToken, requireFinanceAccess, getAllTimeLogs);

// All authenticated project users
router.post('/',      verifyToken, requireProjectAccess, logTime);
router.get('/',       verifyToken, requireProjectAccess, getTimeLogs);
router.delete('/:id', verifyToken, requireProjectAccess, deleteTimeLog);
router.patch('/:id/approve', verifyToken, requireFinanceAccess, approveTimeLog);

module.exports = router;
