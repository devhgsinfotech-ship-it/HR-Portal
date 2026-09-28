// backend/src/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { verifyToken, requireRole, requireCompanyRole } = require('../middleware/authMiddleware');
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
        if (file.fieldname === 'postImage') {
            dir = path.join(UPLOAD_BASE, 'posts');
        } else if (file.fieldname !== 'profileImage') {
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

// My Profile endpoints
router.get('/me', employeeController.getMe);
router.put('/me', upload.single('profileImage'), employeeController.updateMe);

// Dynamic Social Feed and Event routes for dashboard
router.get('/dashboard/summary', employeeController.getDashboardSummary);
router.get('/dashboard/events', employeeController.getCompanyEvents);
router.get('/dashboard/posts', employeeController.getPosts);
router.post('/dashboard/posts', upload.single('postImage'), employeeController.createPost);
router.post('/dashboard/posts/:id/like', employeeController.toggleLikePost);
router.post('/dashboard/posts/:id/comment', employeeController.addCommentPost);
router.put('/dashboard/posts/:id', upload.single('postImage'), employeeController.editPost);
router.delete('/dashboard/posts/:id', employeeController.deletePost);
router.put('/dashboard/comments/:id', employeeController.editComment);
router.delete('/dashboard/comments/:id', employeeController.deleteComment);
router.post('/dashboard/comments/:id/like', employeeController.toggleLikeComment);
router.get('/dashboard/on-leave-today', employeeController.getOnLeaveToday);
router.get('/dashboard/next-holiday', employeeController.getNextHoliday);

// HR and Company Admin management routes (specific paths)
// SUPER_ADMIN has view/support access; employee CRUD is Company Admin/HR domain
router.get('/check-email', requireCompanyRole('HR'),                                          employeeController.checkEmailAvailability);
router.post('/',           requireCompanyRole('HR'), upload.single('profileImage'),           employeeController.createEmployee);
router.get('/', employeeController.getEmployees);

// Parametric /:id routes (MUST come after all specific endpoints)
router.get('/:id', employeeController.getEmployeeById);
// SUPER_ADMIN can VIEW any employee for support, but not edit or delete
router.put('/:id',    requireCompanyRole('HR'), upload.single('profileImage'), employeeController.updateEmployee);
router.delete('/:id', requireCompanyRole('HR'),                                employeeController.deleteEmployee);

// HR & Company Admin Approves Onboarding & Document Management
// SUPER_ADMIN does not perform daily onboarding tasks (company HR operations)
router.post('/:id/approve-onboarding', requireCompanyRole('HR'), employeeController.approveOnboarding);
router.post('/:id/request-correction', requireCompanyRole('HR'), employeeController.requestOnboardingCorrection);
router.post('/:id/resend-invite',      requireCompanyRole('HR'), employeeController.resendInvite);
router.put('/:id/documents', requireCompanyRole('HR'), upload.fields([
    { name: 'aadhaar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), employeeController.updateEmployeeDocuments);

module.exports = router;
