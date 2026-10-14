// backend/src/controllers/seoSettingsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_SEO = {
    metaTitle: 'HR Portal - Modern Cloud HRMS & Payroll Management',
    metaKeywords: 'HR Portal, HRMS, Payroll, Attendance, Employee Management, SaaS',
    metaDescription: 'Complete cloud HRMS and payroll solution for modern enterprises. Manage employees, attendance, leaves, and payroll seamlessly.',
    canonicalUrl: '',
    ogTitle: 'HR Portal - Modern HRMS & Payroll',
    ogDescription: 'Empower your organization with smart HR operations, real-time attendance, and automated payroll.',
    ogImage: null,
};

/**
 * GET /api/seo-settings
 * Authenticated: returns SEO settings for the user's company or system default.
 */
async function getSeoSettings(req, res) {
    try {
        const user = req.user;
        let companyId = user?.companyId || null;

        // Super Admin can optionally inspect a specific company via query
        if (user?.role === 'SUPER_ADMIN' && req.query.companyId) {
            companyId = parseInt(req.query.companyId, 10);
        }

        let seo = null;
        if (companyId) {
            seo = await prisma.seoSetting.findUnique({
                where: { companyId },
            });
        } else {
            seo = await prisma.seoSetting.findFirst({
                where: { companyId: null },
            });
        }

        if (!seo) {
            // Provide sensible initial defaults based on company name if available
            let companyName = 'HR Portal';
            if (companyId) {
                const comp = await prisma.company.findUnique({ where: { id: companyId } });
                if (comp?.name) companyName = comp.name;
            }
            return res.json({
                success: true,
                seo: {
                    ...DEFAULT_SEO,
                    metaTitle: `${companyName} - Modern HRMS & Payroll Management`,
                    ogTitle: `${companyName} - HR Portal`,
                    companyId,
                },
                isDefault: true,
            });
        }

        res.json({
            success: true,
            seo,
            isDefault: false,
        });
    } catch (err) {
        console.error('Error fetching SEO settings:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch SEO settings', error: err.message });
    }
}

/**
 * PUT /api/seo-settings
 * Authenticated: Company Admin or Super Admin updates SEO settings.
 */
async function updateSeoSettings(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        let companyId = user.companyId || null;
        if (user.role === 'SUPER_ADMIN' && req.body.companyId) {
            companyId = parseInt(req.body.companyId, 10);
        }

        const {
            metaTitle,
            metaKeywords,
            metaDescription,
            canonicalUrl,
            ogTitle,
            ogDescription,
            removeOgImage,
        } = req.body;

        const dataToSave = {};
        if (metaTitle !== undefined) dataToSave.metaTitle = (metaTitle || '').trim();
        if (metaKeywords !== undefined) dataToSave.metaKeywords = (metaKeywords || '').trim();
        if (metaDescription !== undefined) dataToSave.metaDescription = (metaDescription || '').trim();
        if (canonicalUrl !== undefined) dataToSave.canonicalUrl = (canonicalUrl || '').trim();
        if (ogTitle !== undefined) dataToSave.ogTitle = (ogTitle || '').trim();
        if (ogDescription !== undefined) dataToSave.ogDescription = (ogDescription || '').trim();

        // Handle uploaded OG Image
        if (req.file) {
            dataToSave.ogImage = `/uploads/seo/${req.file.filename}`;
        } else if (removeOgImage === 'true' || removeOgImage === true) {
            dataToSave.ogImage = null;
        }

        let saved = null;
        if (companyId) {
            saved = await prisma.seoSetting.upsert({
                where: { companyId },
                update: dataToSave,
                create: {
                    companyId,
                    ...dataToSave,
                },
            });
        } else {
            // System-level default SEO setting
            const existing = await prisma.seoSetting.findFirst({
                where: { companyId: null },
            });
            if (existing) {
                saved = await prisma.seoSetting.update({
                    where: { id: existing.id },
                    data: dataToSave,
                });
            } else {
                saved = await prisma.seoSetting.create({
                    data: {
                        companyId: null,
                        ...dataToSave,
                    },
                });
            }
        }

        res.json({
            success: true,
            message: 'SEO settings updated successfully',
            seo: saved,
        });
    } catch (err) {
        console.error('Error updating SEO settings:', err);
        res.status(500).json({ success: false, message: 'Failed to update SEO settings', error: err.message });
    }
}

/**
 * GET /api/seo-settings/public
 * Public: used by guests, landing pages, login pages, and dynamic meta injectors.
 */
async function getPublicSeoSettings(req, res) {
    try {
        let companyId = null;

        if (req.query.companyId) {
            companyId = parseInt(req.query.companyId, 10);
        } else if (req.query.subdomain) {
            const comp = await prisma.company.findUnique({
                where: { subdomain: req.query.subdomain.toLowerCase().trim() },
            });
            if (comp) companyId = comp.id;
        }

        let seo = null;
        if (companyId) {
            seo = await prisma.seoSetting.findUnique({
                where: { companyId },
            });
        }

        if (!seo) {
            seo = await prisma.seoSetting.findFirst({
                where: { companyId: null },
            });
        }

        res.json({
            success: true,
            seo: seo || DEFAULT_SEO,
        });
    } catch (err) {
        console.error('Error fetching public SEO settings:', err);
        res.json({
            success: true,
            seo: DEFAULT_SEO,
        });
    }
}

module.exports = {
    getSeoSettings,
    updateSeoSettings,
    getPublicSeoSettings,
};
