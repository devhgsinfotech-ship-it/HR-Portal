// backend/src/controllers/systemSettingsController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
                currency: settings.currency,
                currencySymbol: settings.currencySymbol,
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
        const { systemName, currency, currencySymbol, logoUrl } = req.body;

        let newLogoUrl = logoUrl;
        if (req.file) {
            newLogoUrl = `/uploads/logos/${req.file.filename}`;
        }

        const updateData = {};
        if (systemName !== undefined) updateData.systemName = systemName;
        if (newLogoUrl !== undefined) updateData.logoUrl = newLogoUrl;
        if (currency !== undefined) updateData.currency = currency.toUpperCase();
        if (currencySymbol !== undefined) updateData.currencySymbol = currencySymbol;

        const updated = await prisma.systemSetting.update({
            where: { id: current.id },
            data: updateData,
        });

        // If currency changed, also sync Currency model default flag and update all subscription plans
        if (currency) {
            const cleanCode = currency.toUpperCase();
            const cleanSymbol = updateData.currencySymbol || current.currencySymbol;
            await prisma.currency.updateMany({
                data: { isDefault: false }
            });
            await prisma.currency.upsert({
                where: { code: cleanCode },
                update: {
                    isDefault: true,
                    symbol: cleanSymbol,
                    status: 'Active'
                },
                create: {
                    name: cleanCode,
                    code: cleanCode,
                    symbol: cleanSymbol,
                    symbolPosition: 'Front',
                    isDefault: true,
                    status: 'Active'
                }
            });

            // Update all subscription plans so membership plans display the selected currency
            await prisma.subscriptionPlan.updateMany({
                data: {
                    currency: cleanCode,
                    currencySymbol: cleanSymbol,
                }
            });
        }

        res.json({
            success: true,
            message: 'System settings updated successfully',
            settings: updated,
        });
    } catch (err) {
        console.error('Error updating system settings:', err);
        res.status(500).json({ success: false, message: 'Failed to update system settings' });
    }
}

// GET /api/system-settings/currencies
async function getCurrencies(req, res) {
    try {
        const currencies = await prisma.currency.findMany({
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

        const { name, code, symbol, symbolPosition, isDefault, status } = req.body;
        if (!name || !code || !symbol) {
            return res.status(400).json({ success: false, message: 'Name, code, and symbol are required' });
        }

        const cleanCode = code.toUpperCase().trim();
        const existing = await prisma.currency.findUnique({ where: { code: cleanCode } });
        if (existing) {
            return res.status(400).json({ success: false, message: `Currency ${cleanCode} already exists` });
        }

        if (isDefault) {
            await prisma.currency.updateMany({ data: { isDefault: false } });
            const currentSetting = await getOrCreateSystemSetting();
            await prisma.systemSetting.update({
                where: { id: currentSetting.id },
                data: { currency: cleanCode, currencySymbol: symbol }
            });
        }

        const currency = await prisma.currency.create({
            data: {
                name,
                code: cleanCode,
                symbol,
                symbolPosition: symbolPosition || 'Front',
                isDefault: Boolean(isDefault),
                status: status || 'Active',
            }
        });

        res.json({ success: true, message: 'Currency created successfully', currency });
    } catch (err) {
        console.error('Error creating currency:', err);
        res.status(500).json({ success: false, message: 'Failed to create currency' });
    }
}

// PUT /api/system-settings/currencies/:id - Super Admin only
async function updateCurrency(req, res) {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const id = parseInt(req.params.id, 10);
        const { name, code, symbol, symbolPosition, isDefault, status } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code.toUpperCase().trim();
        if (symbol !== undefined) updateData.symbol = symbol;
        if (symbolPosition !== undefined) updateData.symbolPosition = symbolPosition;
        if (status !== undefined) updateData.status = status;

        if (isDefault) {
            updateData.isDefault = true;
            await prisma.currency.updateMany({ data: { isDefault: false } });
            const currentSetting = await getOrCreateSystemSetting();
            await prisma.systemSetting.update({
                where: { id: currentSetting.id },
                data: {
                    currency: updateData.code || undefined,
                    currencySymbol: updateData.symbol || undefined,
                }
            });
        }

        const updated = await prisma.currency.update({
            where: { id },
            data: updateData,
        });

        res.json({ success: true, message: 'Currency updated successfully', currency: updated });
    } catch (err) {
        console.error('Error updating currency:', err);
        res.status(500).json({ success: false, message: 'Failed to update currency' });
    }
}

// DELETE /api/system-settings/currencies/:id - Super Admin only
async function deleteCurrency(req, res) {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const id = parseInt(req.params.id, 10);
        const existing = await prisma.currency.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Currency not found' });
        }

        if (existing.isDefault) {
            return res.status(400).json({ success: false, message: 'Cannot delete the default active currency' });
        }

        await prisma.currency.delete({ where: { id } });
        res.json({ success: true, message: 'Currency deleted successfully' });
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
        let target = null;
        if (currencyId) {
            target = await prisma.currency.findUnique({ where: { id: parseInt(currencyId, 10) } });
        } else if (code) {
            target = await prisma.currency.findUnique({ where: { code: code.toUpperCase() } });
        }

        if (!target) {
            return res.status(404).json({ success: false, message: 'Currency not found' });
        }

        // Make all non-default
        await prisma.currency.updateMany({ data: { isDefault: false } });
        // Set target as default and active
        const updatedTarget = await prisma.currency.update({
            where: { id: target.id },
            data: { isDefault: true, status: 'Active' }
        });

        // Update SystemSetting
        const currentSetting = await getOrCreateSystemSetting();
        const updatedSetting = await prisma.systemSetting.update({
            where: { id: currentSetting.id },
            data: {
                currency: target.code,
                currencySymbol: target.symbol,
            }
        });

        // Update all subscription plans so membership plans display the selected currency
        await prisma.subscriptionPlan.updateMany({
            data: {
                currency: target.code,
                currencySymbol: target.symbol,
            }
        });

        res.json({
            success: true,
            message: `Default currency successfully changed to ${target.name} (${target.symbol} ${target.code})`,
            currency: updatedTarget,
            settings: updatedSetting,
        });
    } catch (err) {
        console.error('Error setting default currency:', err);
        res.status(500).json({ success: false, message: 'Failed to set default currency' });
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
};
