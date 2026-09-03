const express = require('express');
const router = express.Router();
const celebrationController = require('../controllers/celebrationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, celebrationController.getCelebrations);

module.exports = router;
