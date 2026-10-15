// backend/src/controllers/emailTemplateController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getDynamicFrontendUrl } = require('../utils/urlHelper');

function getSamplePreviewData(req) {
    const origin = getDynamicFrontendUrl(req);
    return {
        employeeName: 'Rahul Sharma',
        userName: 'Vikramjeet Singh',
        hrName: 'Priya Verma',
        candidateName: 'Amit Patel',
        candidateEmail: 'amit.patel@example.com',
        candidatePhone: '+91 98765 43210',
        companyName: 'HGS Infotech',
        actionUrl: `${origin}/action-link-demo`,
        verifyUrl: `${origin}/verify-email?token=sample-token-123`,
        resetUrl: `${origin}/reset-password?token=sample-token-123`,
        jobTitle: 'Senior Full Stack Developer',
        roundTitle: 'Technical Architecture Round',
        interviewDate: 'Friday, 18 Oct 2026 at 03:30 PM (IST)',
        locationOrLink: 'https://meet.google.com/xyz-abcd-efg',
        annualCtc: '₹ 18,50,000 / year',
        joiningDate: '01 Nov 2026',
        tempPassword: 'Pass@Secure2026!',
        notes: 'Please upload a clearer copy of your PAN Card and Bank Passbook.',
        logoUrl: `${origin}/assets/img/logo.png`,
    };
}

function renderTemplateString(str, data = {}) {
    if (!str) return '';
    return str.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
    });
}

/**
 * GET /api/system-settings/email-templates
 * Returns all system email templates
 */
async function getEmailTemplates(req, res) {
    try {
        const templates = await prisma.emailTemplate.findMany({
            orderBy: { id: 'asc' },
        });

        res.json({
            success: true,
            data: templates,
            count: templates.length,
        });
    } catch (err) {
        console.error('Error fetching email templates:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch email templates' });
    }
}

/**
 * GET /api/system-settings/email-templates/:idOrSlug
 * Returns a single template with preview
 */
async function getTemplateByIdOrSlug(req, res) {
    try {
        const { idOrSlug } = req.params;
        const id = parseInt(idOrSlug, 10);

        const template = isNaN(id)
            ? await prisma.emailTemplate.findUnique({ where: { slug: idOrSlug } })
            : await prisma.emailTemplate.findUnique({ where: { id } });

        if (!template) {
            return res.status(404).json({ success: false, message: 'Email template not found' });
        }

        const sampleData = getSamplePreviewData(req);
        const previewSubject = renderTemplateString(template.subject, sampleData);
        const previewHtml = renderTemplateString(template.body, sampleData);

        res.json({
            success: true,
            data: {
                ...template,
                previewSubject,
                previewHtml,
            },
        });
    } catch (err) {
        console.error('Error fetching template details:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch email template' });
    }
}

/**
 * PUT /api/system-settings/email-templates/:id
 * Updates subject, body, status of a template
 */
async function updateEmailTemplate(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid template ID' });
        }

        const { subject, body, status } = req.body;

        if (!subject || !subject.trim()) {
            return res.status(400).json({ success: false, message: 'Subject line cannot be empty' });
        }
        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, message: 'Template body cannot be empty' });
        }

        const existing = await prisma.emailTemplate.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Email template not found' });
        }

        const updated = await prisma.emailTemplate.update({
            where: { id },
            data: {
                subject: subject.trim(),
                body: body.trim(),
                status: status || existing.status,
                isCustomized: true,
            },
        });

        res.json({
            success: true,
            message: `Email template "${updated.name}" updated successfully!`,
            data: updated,
        });
    } catch (err) {
        console.error('Error updating email template:', err);
        res.status(500).json({ success: false, message: 'Failed to update email template' });
    }
}

/**
 * POST /api/system-settings/email-templates/:id/reset
 * Restores a template to its factory default subject and body
 */
async function resetEmailTemplate(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid template ID' });
        }

        const existing = await prisma.emailTemplate.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Email template not found' });
        }

        const restored = await prisma.emailTemplate.update({
            where: { id },
            data: {
                subject: existing.defaultSubject,
                body: existing.defaultBody,
                isCustomized: false,
                status: 'Active',
            },
        });

        res.json({
            success: true,
            message: `Template "${restored.name}" has been restored to factory default settings!`,
            data: restored,
        });
    } catch (err) {
        console.error('Error resetting email template:', err);
        res.status(500).json({ success: false, message: 'Failed to reset email template' });
    }
}

/**
 * POST /api/system-settings/email-templates/:id/preview
 * Renders subject and body with custom test data
 */
async function previewEmailTemplate(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const { subject, body, customData } = req.body;

        const defaultData = getSamplePreviewData(req);
        const mergeData = { ...defaultData, ...(customData || {}) };
        let targetSubject = subject;
        let targetBody = body;

        if (!targetSubject || !targetBody) {
            const template = await prisma.emailTemplate.findUnique({ where: { id } });
            if (template) {
                targetSubject = targetSubject || template.subject;
                targetBody = targetBody || template.body;
            }
        }

        const previewSubject = renderTemplateString(targetSubject || '', mergeData);
        const previewHtml = renderTemplateString(targetBody || '', mergeData);

        res.json({
            success: true,
            previewSubject,
            previewHtml,
            sampleData: mergeData,
        });
    } catch (err) {
        console.error('Error generating preview:', err);
        res.status(500).json({ success: false, message: 'Failed to generate preview' });
    }
}

module.exports = {
    getEmailTemplates,
    getTemplateByIdOrSlug,
    updateEmailTemplate,
    resetEmailTemplate,
    previewEmailTemplate,
    renderTemplateString,
};
