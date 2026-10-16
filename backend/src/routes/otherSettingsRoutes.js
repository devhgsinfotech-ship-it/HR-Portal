// backend/src/routes/otherSettingsRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const {
    getBannedIps,
    addBannedIp,
    updateBannedIp,
    deleteBannedIp,
    getBackups,
    generateBackup,
    downloadBackup,
    deleteBackup,
    restoreBackupById,
    restoreBackupFromFile,
    restoreBackupByDate,
    clearCache
} = require('../controllers/otherSettingsController');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB max backup file upload
});

// All endpoints require SUPER_ADMIN or COMPANY_ADMIN
router.use(verifyToken, requireRole('SUPER_ADMIN', 'COMPANY_ADMIN'));

// ==========================================
// Banned IP Routes
// ==========================================
router.get('/banned-ips', getBannedIps);
router.post('/banned-ips', addBannedIp);
router.put('/banned-ips/:id', updateBannedIp);
router.delete('/banned-ips/:id', deleteBannedIp);

// ==========================================
// Backup Routes
// ==========================================
router.get('/backups', getBackups);
router.post('/backups/generate', generateBackup);
router.get('/backups/:id/download', downloadBackup);
router.delete('/backups/:id', deleteBackup);
router.post('/backups/:id/restore', restoreBackupById);
router.post('/backups/restore-upload', upload.single('file'), restoreBackupFromFile);
router.post('/backups/restore-by-date', restoreBackupByDate);

// ==========================================
// Clear Cache Route
// ==========================================
router.post('/cache/clear', clearCache);

module.exports = router;
