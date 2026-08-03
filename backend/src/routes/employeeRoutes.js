// backend/src/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/profiles';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `emp-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// All employee routes require authentication
router.use(verifyToken);

// Employees can view employees, but only HR/Admin can modify
router.get('/', employeeController.getEmployees);

// HR only routes
router.use(requireRole('HR', 'SUPER_ADMIN'));
router.get('/check-email', employeeController.checkEmailAvailability);
router.post('/', upload.single('profileImage'), employeeController.createEmployee);
router.put('/:id', upload.single('profileImage'), employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
