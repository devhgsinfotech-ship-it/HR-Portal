// backend/src/routes/trainingRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/trainingController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Common Metadata for Dropdowns (trainers, trainingTypes, employees)
router.get('/metadata', controller.getTrainingMetadata);

// 1. Training Types
router.get('/types', controller.getTrainingTypes);
router.post('/types', controller.createTrainingType);
router.put('/types/:id', controller.updateTrainingType);
router.delete('/types/:id', controller.deleteTrainingType);

// 2. Trainers
router.get('/trainers', controller.getTrainers);
router.post('/trainers', controller.createTrainer);
router.put('/trainers/:id', controller.updateTrainer);
router.delete('/trainers/:id', controller.deleteTrainer);

// 3. Training Programs (List)
router.get('/programs', controller.getTrainingPrograms);
router.post('/programs', controller.createTrainingProgram);
router.put('/programs/:id', controller.updateTrainingProgram);
router.delete('/programs/:id', controller.deleteTrainingProgram);

module.exports = router;
