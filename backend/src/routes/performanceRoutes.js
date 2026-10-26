// backend/src/routes/performanceRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/performanceController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Common Metadata for Dropdowns (employees, departments, designations, goalTypes)
router.get('/metadata', controller.getPerformanceMetadata);

// 1. Goal Types
router.get('/goal-types', controller.getGoalTypes);
router.post('/goal-types', controller.createGoalType);
router.put('/goal-types/:id', controller.updateGoalType);
router.delete('/goal-types/:id', controller.deleteGoalType);

// 2. Performance Goals (Tracking)
router.get('/goals', controller.getPerformanceGoals);
router.post('/goals', controller.createPerformanceGoal);
router.put('/goals/:id', controller.updatePerformanceGoal);
router.delete('/goals/:id', controller.deletePerformanceGoal);

// 3. Performance Indicators
router.get('/indicators', controller.getPerformanceIndicators);
router.post('/indicators', controller.createPerformanceIndicator);
router.put('/indicators/:id', controller.updatePerformanceIndicator);
router.delete('/indicators/:id', controller.deletePerformanceIndicator);

// 4. Performance Appraisals & Reviews
router.get('/appraisals', controller.getPerformanceAppraisals);
router.post('/appraisals', controller.createPerformanceAppraisal);
router.put('/appraisals/:id', controller.updatePerformanceAppraisal);
router.delete('/appraisals/:id', controller.deletePerformanceAppraisal);

module.exports = router;
