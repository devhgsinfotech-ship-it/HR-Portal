// backend/src/routes/emailTemplateRoutes.js
const express = require('express');
const router = express.Router();
const {
    getEmailTemplates,
    getTemplateByIdOrSlug,
    updateEmailTemplate,
    resetEmailTemplate,
    previewEmailTemplate,
} = require('../controllers/emailTemplateController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Get all email templates
router.get('/', verifyToken, getEmailTemplates);

// Get single template details + preview
router.get('/:idOrSlug', verifyToken, getTemplateByIdOrSlug);

// Update template content (Subject, Body, Status)
router.put('/:id', verifyToken, updateEmailTemplate);

// Restore template to original system default
router.post('/:id/reset', verifyToken, resetEmailTemplate);

// Preview template with merge tags
router.post('/:id/preview', verifyToken, previewEmailTemplate);

module.exports = router;
