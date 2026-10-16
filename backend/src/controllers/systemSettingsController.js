// backend/src/controllers/systemSettingsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getUsdToInrRate, convertInrToUsd, convertUsdToInr } = require('../utils/currencyRate');
const emailService = require('../utils/emailService');

// Helper to ensure at least one default system setting exists
async function getOrCreateSystemSetting() {
    let setting = await prisma.systemSetting.findFirst();
    if (!setting) {
        setting = await prisma.systemSetting.create({
            data: {
                systemName: 'HR Portal',
                currency: 'INR',
                currencySymbol: '₹',
                logoUrl: null,
            }
        });
    }
    return setting;
}

// Convert all subscription plans and sync currency table
async function applyCurrencyChange(targetCode) {
    const cleanCode = (targetCode || 'INR').toUpperCase();
    if (cleanCode !== 'INR' && cleanCode !== 'USD') {
        throw new Error('Only INR (₹) and USD ($) currencies are supported.');
    }

    const isUSD = cleanCode === 'USD';
    const cleanSymbol = isUSD ? '$' : '₹';

    // 1. Fetch live exchange rate from free Currency API
    let usdRate = 84.0;
    if (isUSD) {
        usdRate = await getUsdToInrRate();
    }

    // 2. Mark active currency in Currency table
    await prisma.currency.updateMany({
        data: { isDefault: false }
    });

    await prisma.currency.upsert({
        where: { code: cleanCode },
        update: {
            isDefault: true,
            symbol: cleanSymbol,
            exchangeRate: isUSD ? usdRate : 1.0,
            status: 'Active'
        },
        create: {
            name: isUSD ? 'US Dollar' : 'Indian Rupee',
            code: cleanCode,
            symbol: cleanSymbol,
            symbolPosition: 'Front',
            exchangeRate: isUSD ? usdRate : 1.0,
            isDefault: true,
            status: 'Active'
        }
    });

    // 3. Convert all subscription plans
    const plans = await prisma.subscriptionPlan.findMany();
    for (const p of plans) {
        // Base Rupee price is the single source of truth
        let baseMonthly = p.basePriceMonthly;
        let baseYearly = p.basePriceYearly;

        if (!baseMonthly || isNaN(baseMonthly)) {
            baseMonthly = (p.currency === 'USD') ? convertUsdToInr(p.priceMonthly, usdRate) : p.priceMonthly;
        }
        if (!baseYearly || isNaN(baseYearly)) {
            baseYearly = (p.currency === 'USD') ? convertUsdToInr(p.priceYearly, usdRate) : p.priceYearly;
        }

        const newMonthly = isUSD ? convertInrToUsd(baseMonthly, usdRate) : baseMonthly;
        const newYearly = isUSD ? convertInrToUsd(baseYearly, usdRate) : baseYearly;

        await prisma.subscriptionPlan.update({
            where: { id: p.id },
            data: {
                priceMonthly: newMonthly,
                priceYearly: newYearly,
                basePriceMonthly: baseMonthly,
                basePriceYearly: baseYearly,
                currency: cleanCode,
                currencySymbol: cleanSymbol
            }
        });
    }

    console.log(`[Currency] Applied ${cleanCode} (${cleanSymbol}) with live USD->INR rate ${usdRate}. Converted ${plans.length} plans.`);
    return { cleanCode, cleanSymbol, usdRate };
}

// GET /api/system-settings - public or authenticated
async function getSystemSettings(req, res) {
    try {
        const settings = await getOrCreateSystemSetting();
        res.json({
            success: true,
            settings: {
                id: settings.id,
                systemName: settings.systemName,
                logoUrl: settings.logoUrl,
                currency: settings.currency || 'INR',
                currencySymbol: settings.currencySymbol || (settings.currency === 'USD' ? '$' : '₹'),
                timezone: settings.timezone || 'Asia/Kolkata',
                language: settings.language || 'English',
                languageSwitcher: settings.languageSwitcher || false,
                dateFormat: settings.dateFormat || 'DD/MM/YYYY',
                timeFormat: settings.timeFormat || '12 Hours',
                financialYear: settings.financialYear || '2026-2027',
                startingMonth: settings.startingMonth || 'April',
                currencyPosition: settings.currencyPosition || 'Front',
                decimalSeparator: settings.decimalSeparator || '.',
                thousandSeparator: settings.thousandSeparator || ',',
                countriesRestriction: settings.countriesRestriction || 'Allow All Countries',
            }
        });
    } catch (err) {
        console.error('Error fetching system settings:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch system settings' });
    }
}

// PUT /api/system-settings - Super Admin only
async function updateSystemSettings(req, res) {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized: Only Super Admin can modify system settings' });
        }

        const current = await getOrCreateSystemSetting();
        const {
            systemName, currency, logoUrl,
            timezone, language, languageSwitcher,
            dateFormat, timeFormat, financialYear, startingMonth,
            currencyPosition, decimalSeparator, thousandSeparator, countriesRestriction
        } = req.body;

        let newLogoUrl = logoUrl;
        if (req.file) {
            newLogoUrl = `/uploads/logos/${req.file.filename}`;
        }

        const updateData = {};
        if (systemName !== undefined) updateData.systemName = systemName;
        if (newLogoUrl !== undefined) updateData.logoUrl = newLogoUrl;

        if (currency) {
            const cleanCode = currency.toUpperCase();
            if (cleanCode !== 'INR' && cleanCode !== 'USD') {
                return res.status(400).json({ success: false, message: 'Only INR (₹) and USD ($) currencies are supported.' });
            }
            const { cleanSymbol } = await applyCurrencyChange(cleanCode);
            updateData.currency = cleanCode;
            updateData.currencySymbol = cleanSymbol;
        }

        if (timezone !== undefined) updateData.timezone = timezone;
        if (language !== undefined) updateData.language = language;
        if (languageSwitcher !== undefined) updateData.languageSwitcher = Boolean(languageSwitcher);
        if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
        if (timeFormat !== undefined) updateData.timeFormat = timeFormat;
        if (financialYear !== undefined) updateData.financialYear = financialYear;
        if (startingMonth !== undefined) updateData.startingMonth = startingMonth;
        if (currencyPosition !== undefined) updateData.currencyPosition = currencyPosition;
        if (decimalSeparator !== undefined) updateData.decimalSeparator = decimalSeparator;
        if (thousandSeparator !== undefined) updateData.thousandSeparator = thousandSeparator;
        if (countriesRestriction !== undefined) updateData.countriesRestriction = countriesRestriction;

        const updated = await prisma.systemSetting.update({
            where: { id: current.id },
            data: updateData,
        });

        res.json({
            success: true,
            message: 'System settings updated successfully',
            settings: updated,
        });
    } catch (err) {
        console.error('Error updating system settings:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to update system settings' });
    }
}

// GET /api/system-settings/currencies
async function getCurrencies(req, res) {
    try {
        const currencies = await prisma.currency.findMany({
            where: { code: { in: ['INR', 'USD'] } },
            orderBy: [
                { isDefault: 'desc' },
                { name: 'asc' }
            ]
        });
        res.json({ success: true, currencies });
    } catch (err) {
        console.error('Error fetching currencies:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch currencies' });
    }
}

// POST /api/system-settings/currencies - Super Admin only
async function createCurrency(req, res) {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { name, code, symbol, isDefault } = req.body;
        const cleanCode = (code || '').toUpperCase().trim();

        if (cleanCode !== 'INR' && cleanCode !== 'USD') {
            return res.status(400).json({ success: false, message: 'Only INR (₹) and USD ($) currencies are supported.' });
        }

        if (isDefault) {
            await applyCurrencyChange(cleanCode);
        }

        const currency = await prisma.currency.findUnique({ where: { code: cleanCode } });
        res.json({ success: true, message: 'Currency updated successfully', currency });
    } catch (err) {
        console.error('Error creating currency:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to create currency' });
    }
}

// PUT /api/system-settings/currencies/:id - Super Admin only
async function updateCurrency(req, res) {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const id = parseInt(req.params.id, 10);
        const { isDefault, exchangeRate } = req.body;

        const current = await prisma.currency.findUnique({ where: { id } });
        if (!current) {
            return res.status(404).json({ success: false, message: 'Currency not found' });
        }

        if (isDefault) {
            await applyCurrencyChange(current.code);
            const currentSetting = await getOrCreateSystemSetting();
            await prisma.systemSetting.update({
                where: { id: currentSetting.id },
                data: {
                    currency: current.code,
                    currencySymbol: current.code === 'USD' ? '$' : '₹'
                }
            });
        } else if (exchangeRate !== undefined) {
            await prisma.currency.update({
                where: { id },
                data: { exchangeRate: parseFloat(exchangeRate) }
            });
        }

        const updated = await prisma.currency.findUnique({ where: { id } });
        res.json({ success: true, message: 'Currency updated successfully', currency: updated });
    } catch (err) {
        console.error('Error updating currency:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to update currency' });
    }
}

// DELETE /api/system-settings/currencies/:id - Super Admin only
async function deleteCurrency(req, res) {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        return res.status(400).json({ success: false, message: 'Default INR and USD currencies cannot be deleted.' });
    } catch (err) {
        console.error('Error deleting currency:', err);
        res.status(500).json({ success: false, message: 'Failed to delete currency' });
    }
}

// POST /api/system-settings/set-default-currency - Super Admin only
async function setDefaultCurrency(req, res) {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized: Only Super Admin can change default currency' });
        }

        const { currencyId, code } = req.body;
        let cleanCode = 'INR';

        if (currencyId) {
            const target = await prisma.currency.findUnique({ where: { id: parseInt(currencyId, 10) } });
            if (target) cleanCode = target.code;
        } else if (code) {
            cleanCode = code.toUpperCase().trim();
        }

        if (cleanCode !== 'INR' && cleanCode !== 'USD') {
            return res.status(400).json({ success: false, message: 'Only INR (₹) and USD ($) currencies are supported.' });
        }

        // Apply conversion across all membership plans using the currency API rate
        const { cleanSymbol } = await applyCurrencyChange(cleanCode);

        // Update SystemSetting
        const currentSetting = await getOrCreateSystemSetting();
        const updatedSetting = await prisma.systemSetting.update({
            where: { id: currentSetting.id },
            data: {
                currency: cleanCode,
                currencySymbol: cleanSymbol,
            }
        });

        const updatedCurrency = await prisma.currency.findUnique({ where: { code: cleanCode } });

        res.json({
            success: true,
            message: `Default currency changed to ${cleanCode} (${cleanSymbol}). Plan prices converted successfully!`,
            currency: updatedCurrency,
            settings: updatedSetting,
        });
    } catch (err) {
        console.error('Error setting default currency:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to set default currency' });
    }
}

/**
 * GET /system-settings/email-status
 * Returns current email driver status without exposing passwords
 */
async function getEmailStatus(req, res) {
    try {
        const isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
        let maskedUser = null;
        if (process.env.SMTP_USER) {
            const parts = process.env.SMTP_USER.split('@');
            if (parts.length === 2) {
                const name = parts[0];
                const domain = parts[1];
                const visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1);
                maskedUser = `${visible}***@${domain}`;
            } else {
                maskedUser = `${process.env.SMTP_USER.slice(0, 3)}***`;
            }
        }

        res.json({
            success: true,
            isConfigured,
            mode: isConfigured ? 'PRODUCTION_SMTP' : 'ETHEREAL_SANDBOX',
            host: process.env.SMTP_HOST || 'smtp.ethereal.email (Local Development Sandbox)',
            port: process.env.SMTP_PORT || '587',
            secure: process.env.SMTP_SECURE === 'true',
            senderEmail: maskedUser || 'Auto-generated sandbox user',
            managedVia: 'Server Environment Variables (Hostinger hPanel / .env)'
        });
    } catch (err) {
        console.error('Error getting email status:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve email status' });
    }
}

/**
 * POST /system-settings/send-test-email
 * Sends a test email to the requested address
 */
async function sendTestEmailHandler(req, res) {
    try {
        const { targetEmail } = req.body;
        if (!targetEmail || !targetEmail.includes('@')) {
            return res.status(400).json({ success: false, message: 'Valid target email is required' });
        }

        const result = await emailService.sendTestEmail(targetEmail);
        res.json({
            success: true,
            message: `Test email sent successfully to ${targetEmail}!`,
            previewUrl: result.testUrl || null
        });
    } catch (err) {
        console.error('Error sending test email:', err);
        res.status(500).json({ success: false, message: err.message || 'Failed to send test email' });
    }
}

module.exports = {
    getSystemSettings,
    updateSystemSettings,
    getCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    setDefaultCurrency,
    getEmailStatus,
    sendTestEmailHandler,
};
