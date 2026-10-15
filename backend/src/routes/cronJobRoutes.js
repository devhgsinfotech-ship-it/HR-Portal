// backend/src/routes/cronJobRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { getCronJobs, runCronJob, toggleCronJobStatus } = require('../controllers/cronJobController');

// All cron job endpoints require admin privileges
router.get('/', verifyToken, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), getCronJobs);
router.post('/:key/run', verifyToken, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), runCronJob);
router.put('/:key/toggle', verifyToken, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'), toggleCronJobStatus);

module.exports = router;
