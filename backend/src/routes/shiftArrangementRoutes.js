// backend/src/routes/shiftArrangementRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/shiftArrangementController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Common Metadata for Dropdowns
router.get('/metadata', controller.getShiftMetadata);

// 1. Shift Policies
router.get('/policies', controller.getShiftPolicies);
router.post('/policies', controller.createShiftPolicy);
router.put('/policies/:id', controller.updateShiftPolicy);
router.delete('/policies/:id', controller.deleteShiftPolicy);

// 2. Shift Schedules / Timing
router.get('/schedules', controller.getShiftSchedules);
router.post('/schedules', controller.createShiftSchedule);
router.delete('/schedules/:id', controller.deleteShiftSchedule);

// 3. Shift Swap Requests
router.get('/swaps/eligible-peers', controller.getEligibleSwapPeers);
router.get('/swaps', controller.getShiftSwapRequests);
router.post('/swaps', controller.createShiftSwapRequest);
router.put('/swaps/:id/status', controller.updateShiftSwapStatus);
router.delete('/swaps/:id', controller.deleteShiftSwapRequest);

// 4. Overtime Records
router.get('/overtime', controller.getOvertimeRecords);
router.post('/overtime', controller.createOvertimeRecord);
router.put('/overtime/:id', controller.updateOvertimeRecord);
router.delete('/overtime/:id', controller.deleteOvertimeRecord);

// 5. Work From Home (WFH)
router.get('/wfh', controller.getWfhRequests);
router.post('/wfh', controller.createWfhRequest);
router.put('/wfh/:id/status', controller.updateWfhStatus);
router.delete('/wfh/:id', controller.deleteWfhRequest);

module.exports = router;
