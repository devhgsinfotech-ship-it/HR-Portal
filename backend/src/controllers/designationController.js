// backend/src/controllers/designationController.js
const prisma = require('../config/prisma');

async function createDesignation(req, res) {
    try {
        const { name, description } = req.body;
        const companyId = req.user.companyId;

        if (!name) {
            return res.status(400).json({ message: 'Designation name is required' });
        }

        // Check if designation already exists for this company
        const existing = await prisma.designation.findUnique({
            where: {
                companyId_name: {
                    companyId: companyId,
                    name: name
                }
            }
        });

        if (existing) {
            return res.status(409).json({ message: 'Designation with this name already exists' });
        }

        const designation = await prisma.designation.create({
            data: {
                name,
                description,
                companyId
            }
        });

        res.status(201).json(designation);
    } catch (error) {
        console.error('Error creating designation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getDesignations(req, res) {
    try {
        const companyId = req.user.companyId;
        const designations = await prisma.designation.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });
        res.json(designations);
    } catch (error) {
        console.error('Error getting designations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateDesignation(req, res) {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const companyId = req.user.companyId;

        // Verify the designation belongs to this company
        const existing = await prisma.designation.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing || existing.companyId !== companyId) {
            return res.status(404).json({ message: 'Designation not found' });
        }

        const updated = await prisma.designation.update({
            where: { id: parseInt(id) },
            data: { name, description }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating designation:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Designation with this name already exists' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteDesignation(req, res) {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        // Verify the designation belongs to this company
        const existing = await prisma.designation.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing || existing.companyId !== companyId) {
            return res.status(404).json({ message: 'Designation not found' });
        }

        // Check if employees belong to this designation before deleting
        const employeeCount = await prisma.employee.count({
            where: { designationId: parseInt(id) }
        });

        if (employeeCount > 0) {
            return res.status(400).json({ message: 'Cannot delete designation. There are employees assigned to it.' });
        }

        await prisma.designation.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Designation deleted successfully' });
    } catch (error) {
        console.error('Error deleting designation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createDesignation,
    getDesignations,
    updateDesignation,
    deleteDesignation
};
