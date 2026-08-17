// backend/src/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Use persistent upload directory configured in env (falls back to local uploads folder)
const UPLOAD_BASE = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH) 
    : path.resolve('uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = path.join(UPLOAD_BASE, 'profiles');
        if (file.fieldname !== 'profileImage') {
            dir = path.join(UPLOAD_BASE, 'documents');
        }
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });


// All employee routes require authentication
router.use(verifyToken);

// Employee Onboarding Endpoints
router.put('/onboarding/personal', employeeController.onboardingPersonal);
router.post('/onboarding/bank', employeeController.onboardingBank);
router.post('/onboarding/documents', upload.fields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), employeeController.onboardingDocuments);

// HR Approves Onboarding
router.post('/:id/approve-onboarding', requireRole('SUPER_ADMIN', 'HR'), employeeController.approveOnboarding);
router.post('/:id/request-correction', requireRole('SUPER_ADMIN', 'HR'), employeeController.requestOnboardingCorrection);
router.post('/:id/resend-invite', requireRole('SUPER_ADMIN', 'HR'), employeeController.resendInvite);
router.put('/:id/documents', requireRole('SUPER_ADMIN', 'HR'), upload.fields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), employeeController.updateEmployeeDocuments);


// Employees can view employees, but only HR/Admin can modify
router.get('/', employeeController.getEmployees);

// My Profile endpoints
router.get('/me', employeeController.getMe);
router.put('/me', upload.single('profileImage'), employeeController.updateMe);

// HR only routes
router.use(requireRole('HR', 'SUPER_ADMIN'));
router.get('/check-email', employeeController.checkEmailAvailability);
router.post('/', upload.single('profileImage'), employeeController.createEmployee);
router.put('/:id', upload.single('profileImage'), employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
