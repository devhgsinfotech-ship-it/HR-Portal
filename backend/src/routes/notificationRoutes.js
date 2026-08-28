const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getMyNotifications, markAllAsRead } = require('../controllers/notificationController');

// All notification routes should be protected
router.use(verifyToken);

router.get('/', getMyNotifications);
router.put('/mark-read', markAllAsRead);

module.exports = router;
