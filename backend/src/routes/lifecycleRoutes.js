// backend/src/routes/lifecycleRoutes.js
const express = require('express');
const router = express.Router();
const lifecycleController = require('../controllers/lifecycleController');
const { verifyToken } = require('../middleware/authMiddleware');

// All lifecycle routes require authentication
router.use(verifyToken);

// Common Metadata for dropdowns
router.get('/metadata', lifecycleController.getLifecycleMetadata);

// 1. Probation Management
router.get('/probations', lifecycleController.getProbations);
router.post('/probations', lifecycleController.updateProbationStatus);
router.put('/probations/:id/status', lifecycleController.updateProbationStatus);
router.delete('/probations/:id', lifecycleController.removeEmployeeProbation);

// 2. Notice Period Tracker
router.get('/notice-periods', lifecycleController.getNoticePeriods);
router.post('/notice-periods/start', lifecycleController.startNoticePeriod);

// 3. Promotions
router.get('/promotions', lifecycleController.getPromotions);
router.post('/promotions', lifecycleController.createPromotion);
router.put('/promotions/:id', lifecycleController.updatePromotion);
router.delete('/promotions/:id', lifecycleController.deletePromotion);

// 4. Resignations
router.get('/resignations', lifecycleController.getResignations);
router.post('/resignations', lifecycleController.createResignation);
router.put('/resignations/:id', lifecycleController.updateResignation);
router.delete('/resignations/:id', lifecycleController.deleteResignation);

// 5. Terminations
router.get('/terminations', lifecycleController.getTerminations);
router.post('/terminations', lifecycleController.createTermination);
router.put('/terminations/:id', lifecycleController.updateTermination);
router.delete('/terminations/:id', lifecycleController.deleteTermination);

module.exports = router;
