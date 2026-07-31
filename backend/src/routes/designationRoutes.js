// backend/src/routes/designationRoutes.js
const express = require('express');
const router = express.Router();
const designationController = require('../controllers/designationController');
const { verifyToken } = require('../middleware/authMiddleware');

// All designation routes require authentication
router.use(verifyToken);

router.post('/', designationController.createDesignation);
router.get('/', designationController.getDesignations);
router.put('/:id', designationController.updateDesignation);
router.delete('/:id', designationController.deleteDesignation);

module.exports = router;
