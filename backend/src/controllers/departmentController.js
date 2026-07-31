// backend/src/controllers/departmentController.js
const prisma = require('../config/prisma');

async function createDepartment(req, res) {
    try {
        const { name, description } = req.body;
        const companyId = req.user.companyId;

        if (!name) {
            return res.status(400).json({ message: 'Department name is required' });
        }

        // Check if department already exists for this company
        const existing = await prisma.department.findUnique({
            where: {
                companyId_name: {
                    companyId: companyId,
                    name: name
                }
            }
        });

        if (existing) {
            return res.status(409).json({ message: 'Department with this name already exists' });
        }

        const department = await prisma.department.create({
            data: {
                name,
                description,
                companyId
            }
        });

        res.status(201).json(department);
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getDepartments(req, res) {
    try {
        const companyId = req.user.companyId;
        const departments = await prisma.department.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });
        res.json(departments);
    } catch (error) {
        console.error('Error getting departments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateDepartment(req, res) {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const companyId = req.user.companyId;

        // Verify the department belongs to this company
        const existing = await prisma.department.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing || existing.companyId !== companyId) {
            return res.status(404).json({ message: 'Department not found' });
        }

        const updated = await prisma.department.update({
            where: { id: parseInt(id) },
            data: { name, description }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating department:', error);
        // Handle unique constraint error if they rename to an existing dept
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Department with this name already exists' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteDepartment(req, res) {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        // Verify the department belongs to this company
        const existing = await prisma.department.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existing || existing.companyId !== companyId) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Check if employees belong to this department before deleting? 
        // Prisma schema might have cascade or restrict. If restrict, we should handle it.
        // Usually, we shouldn't delete if it's in use. We'll let Prisma throw an error or we could explicitly check.
        const employeeCount = await prisma.employee.count({
            where: { departmentId: parseInt(id) }
        });

        if (employeeCount > 0) {
            return res.status(400).json({ message: 'Cannot delete department. There are employees assigned to it.' });
        }

        await prisma.department.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createDepartment,
    getDepartments,
    updateDepartment,
    deleteDepartment
};
