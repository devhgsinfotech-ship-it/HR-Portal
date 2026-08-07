// backend/src/controllers/employeeController.js
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function checkEmailAvailability(req, res) {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'Email query parameter is required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            // suggest an alternative
            const [localPart, domain] = email.split('@');
            let suggestion = `${localPart}1@${domain}`;
            let count = 1;
            while (await prisma.user.findUnique({ where: { email: suggestion } })) {
                count++;
                suggestion = `${localPart}${count}@${domain}`;
            }
            return res.json({ available: false, suggestion });
        }

        return res.json({ available: true });
    } catch (error) {
        console.error('Error checking email availability:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function createEmployee(req, res) {
    try {
        const { firstName, lastName, email, password, phone, departmentId, designationId, dateOfJoining, role, reportingManagerId } = req.body;
        const companyId = req.user.companyId;
        const profilePhotoUrl = req.file ? `/uploads/profiles/${req.file.filename}` : null;

        if (!firstName || !email) {
            return res.status(400).json({ message: 'First name and email are required' });
        }

        // Fetch company to get emailDomain or subdomain
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Enforce Email Domain Restriction based on company emailDomain or subdomain
        const allowedDomain = (company.emailDomain || (company.subdomain ? `${company.subdomain}.com` : null))?.toLowerCase();
        const employeeDomain = email.split('@')[1]?.toLowerCase();

        if (allowedDomain && employeeDomain !== allowedDomain) {
            return res.status(400).json({ 
                message: `Employees must have an email ending with @${allowedDomain}` 
            });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        // Default password for new employees (they can change it later)
        const hashedPassword = await bcrypt.hash('Password@123', 10);
        
        // Use a transaction to create User and Employee
        const newEmployee = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    companyId: companyId,
                    name: `${firstName} ${lastName || ''}`.trim(),
                    email,
                    password: hashedPassword,
                    role: role || 'EMPLOYEE',
                    accountStatus: 'ACTIVE', // Automatically active since HR is adding them
                }
            });

            // 2. Create Employee Profile
            const employee = await tx.employee.create({
                data: {
                    userId: user.id,
                    employeeCode: `EMP-${Date.now().toString().slice(-6)}`,
                    firstName,
                    lastName,
                    phone,
                    departmentId: departmentId && departmentId !== 'undefined' ? parseInt(departmentId, 10) : null,
                    designationId: designationId && designationId !== 'undefined' ? parseInt(designationId, 10) : null,
                    dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
                    reportingManagerId: (reportingManagerId && reportingManagerId !== 'undefined' && reportingManagerId !== 'null') ? parseInt(reportingManagerId, 10) : null,
                    profilePhotoUrl,
                },
                include: {
                    user: {
                        include: {
                            company: true
                        }
                    },
                    department: true,
                    designation: true,
                }
            });

            return employee;
        });

        res.status(201).json(newEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getEmployees(req, res) {
    try {
        const companyId = req.user.companyId;
        const employees = await prisma.employee.findMany({
            where: { user: { companyId } },
            include: {
                user: {
                    include: {
                        company: true
                    }
                },
                department: true,
                designation: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateEmployee(req, res) {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { firstName, lastName, phone, departmentId, designationId, dateOfJoining, email, password, role, reportingManagerId } = req.body;

        // Ensure the employee belongs to this company
        const existing = await prisma.employee.findUnique({
            where: { id: parseInt(id, 10) },
            include: { user: true }
        });

        if (!existing || existing.user.companyId !== companyId) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const dataToUpdate = {
            firstName,
            lastName,
            phone,
            departmentId: departmentId && departmentId !== 'undefined' ? parseInt(departmentId, 10) : existing.departmentId,
            designationId: designationId && designationId !== 'undefined' ? parseInt(designationId, 10) : existing.designationId,
        };

        if (dateOfJoining) {
            dataToUpdate.dateOfJoining = new Date(dateOfJoining);
        }
        if (reportingManagerId !== undefined) {
            dataToUpdate.reportingManagerId = (reportingManagerId && reportingManagerId !== 'undefined' && reportingManagerId !== 'null') ? parseInt(reportingManagerId, 10) : null;
        }

        if (req.file) {
            dataToUpdate.profilePhotoUrl = `/uploads/profiles/${req.file.filename}`;
        }

        // User table updates: email, name, password
        const userUpdateData = {};
        if (firstName || lastName) {
            userUpdateData.name = `${firstName || existing.firstName} ${lastName || existing.lastName}`.trim();
        }
        if (password && password.trim() !== '') {
            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }
            userUpdateData.password = await bcrypt.hash(password, 10);
        }
        if (email && email !== existing.user.email) {
            const company = await prisma.company.findUnique({ where: { id: companyId } });
            const allowedDomain = (company?.emailDomain || (company?.subdomain ? `${company.subdomain}.com` : null))?.toLowerCase();
            const employeeDomain = email.split('@')[1]?.toLowerCase();
            if (allowedDomain && employeeDomain !== allowedDomain) {
                return res.status(400).json({ 
                    message: `Employees must have an email ending with @${allowedDomain}` 
                });
            }
            const emailInUse = await prisma.user.findUnique({ where: { email } });
            if (emailInUse) {
                return res.status(409).json({ message: 'An account with this email already exists' });
            }
            userUpdateData.email = email;
        }
        if (role) {
            userUpdateData.role = role;
        }

        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: existing.userId },
                data: userUpdateData
            });
        }

        const employee = await prisma.employee.update({
            where: { id: parseInt(id, 10) },
            data: dataToUpdate,
            include: {
                user: {
                    include: {
                        company: true
                    }
                },
                department: true,
                designation: true,
            }
        });

        res.json(employee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteEmployee(req, res) {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        // Ensure the employee belongs to this company
        const existing = await prisma.employee.findUnique({
            where: { id: parseInt(id, 10) },
            include: { user: true }
        });

        if (!existing || existing.user.companyId !== companyId) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Deleting the user automatically cascades and deletes the employee profile and all associated data
        await prisma.user.delete({
            where: { id: existing.userId }
        });

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    checkEmailAvailability,
    createEmployee,
    getEmployees,
    updateEmployee,
    deleteEmployee
};
