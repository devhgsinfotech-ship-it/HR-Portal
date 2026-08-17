// backend/src/controllers/employeeController.js
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

function getCompanyPrefix(companyName) {
    if (!companyName) return 'EMP';
    // Get the first word of the company name
    const firstWord = companyName.trim().split(/\s+/)[0];
    // Keep only letters/numbers and convert to uppercase
    const cleanPrefix = firstWord.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return cleanPrefix || 'EMP';
}


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
        const { 
            firstName, lastName, email, password, phone, departmentId, designationId, dateOfJoining, role, reportingManagerId,
            basic, hra, conveyance, medicalAllowance, specialAllowance, pfDeduction, professionalTax, otherDeductions, grossSalary, netSalary
        } = req.body;
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
        
        // Generate invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

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
                    accountStatus: 'PENDING', // PENDING until they verify
                }
            });

            // 2. Create Employee Profile
            const employee = await tx.employee.create({
                data: {
                    userId: user.id,
                    employeeCode: `${getCompanyPrefix(company.name)}-${Date.now().toString().slice(-6)}`,
                    firstName,
                    lastName,
                    phone,
                    departmentId: departmentId && departmentId !== 'undefined' ? parseInt(departmentId, 10) : null,
                    designationId: designationId && designationId !== 'undefined' ? parseInt(designationId, 10) : null,
                    dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
                    reportingManagerId: (reportingManagerId && reportingManagerId !== 'undefined' && reportingManagerId !== 'null') ? parseInt(reportingManagerId, 10) : null,
                    profilePhotoUrl,
                    onboardingStatus: 'INVITED'
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

            // 3. Create Invite Token
            await tx.inviteToken.create({
                data: {
                    employeeId: employee.id,
                    userId: user.id,
                    token: inviteToken,
                    expiresAt: tokenExpiry
                }
            });

            // 4. Create Salary Structure (Optional during creation)
            if (grossSalary) {
                await tx.salaryStructure.create({
                    data: {
                        employeeId: employee.id,
                        basic: basic ? parseFloat(basic) : 0,
                        hra: hra ? parseFloat(hra) : 0,
                        conveyance: conveyance ? parseFloat(conveyance) : 0,
                        medicalAllowance: medicalAllowance ? parseFloat(medicalAllowance) : 0,
                        specialAllowance: specialAllowance ? parseFloat(specialAllowance) : 0,
                        pfDeduction: pfDeduction ? parseFloat(pfDeduction) : 0,
                        professionalTax: professionalTax ? parseFloat(professionalTax) : 0,
                        otherDeductions: otherDeductions ? parseFloat(otherDeductions) : 0,
                        grossSalary: parseFloat(grossSalary),
                        netSalary: netSalary ? parseFloat(netSalary) : 0
                    }
                });
            }

            return employee;
        });

        // 4. Send Email (non-blocking)
        const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_DOMAIN === 'aaups.com';
        const baseDomain = process.env.FRONTEND_DOMAIN || (isProduction ? 'aaups.com' : 'localhost:3000');
        const protocol = baseDomain.includes('localhost') ? 'http' : 'https';
        const workspaceUrl = company.subdomain ? `${protocol}://${company.subdomain}.${baseDomain}` : `${protocol}://${baseDomain}`;
        emailService.sendEmployeeInviteEmail(
            email, 
            inviteToken, 
            company.name, 
            firstName, 
            workspaceUrl
        ).catch(err => console.error("Failed to send invite email:", err));

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
                bankDetails: true,
                salaryStructure: true
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
        const { 
            firstName, lastName, phone, departmentId, designationId, dateOfJoining, email, password, role, reportingManagerId,
            basic, hra, conveyance, medicalAllowance, specialAllowance, pfDeduction, professionalTax, otherDeductions, grossSalary, netSalary 
        } = req.body;

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

        // Salary update
        if (grossSalary !== undefined && grossSalary !== null && grossSalary !== '') {
            await prisma.salaryStructure.upsert({
                where: { employeeId: existing.id },
                update: {
                    basic: basic ? parseFloat(basic) : 0,
                    hra: hra ? parseFloat(hra) : 0,
                    conveyance: conveyance ? parseFloat(conveyance) : 0,
                    medicalAllowance: medicalAllowance ? parseFloat(medicalAllowance) : 0,
                    specialAllowance: specialAllowance ? parseFloat(specialAllowance) : 0,
                    pfDeduction: pfDeduction ? parseFloat(pfDeduction) : 0,
                    professionalTax: professionalTax ? parseFloat(professionalTax) : 0,
                    otherDeductions: otherDeductions ? parseFloat(otherDeductions) : 0,
                    grossSalary: parseFloat(grossSalary),
                    netSalary: netSalary ? parseFloat(netSalary) : 0
                },
                create: {
                    employeeId: existing.id,
                    basic: basic ? parseFloat(basic) : 0,
                    hra: hra ? parseFloat(hra) : 0,
                    conveyance: conveyance ? parseFloat(conveyance) : 0,
                    medicalAllowance: medicalAllowance ? parseFloat(medicalAllowance) : 0,
                    specialAllowance: specialAllowance ? parseFloat(specialAllowance) : 0,
                    pfDeduction: pfDeduction ? parseFloat(pfDeduction) : 0,
                    professionalTax: professionalTax ? parseFloat(professionalTax) : 0,
                    otherDeductions: otherDeductions ? parseFloat(otherDeductions) : 0,
                    grossSalary: parseFloat(grossSalary),
                    netSalary: netSalary ? parseFloat(netSalary) : 0
                }
            });
        }

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

async function getMe(req, res) {
    try {
        const userId = req.user.id;
        let employee = await prisma.employee.findUnique({
            where: { userId },
            include: {
                user: { select: { id: true, name: true, email: true, role: true, company: true } },
                department: true,
                designation: true,
                bankDetails: true,
                salaryStructure: true
            }
        });

        // If the logged-in user is an HR or SUPER_ADMIN and does not have an employee profile yet,
        // auto-create one so their profile page is editable and displays correctly.
        if (!employee) {
            const user = await prisma.user.findUnique({ 
                where: { id: userId },
                include: { company: true }
            });
            if (user && (user.role === 'HR' || user.role === 'SUPER_ADMIN')) {
                const nameParts = user.name.trim().split(/\s+/);
                const firstName = nameParts[0] || 'Admin';
                const lastName = nameParts.slice(1).join(' ') || 'User';
                const employeeCode = user.company 
                    ? `${getCompanyPrefix(user.company.name)}-HR-${Date.now().toString().slice(-6)}`
                    : `HR-${Date.now().toString().slice(-6)}`;

                employee = await prisma.employee.create({
                    data: {
                        userId,
                        employeeCode,
                        firstName,
                        lastName,
                        phone: user.company?.phone || null,
                        address: user.company?.address || null,
                        onboardingStatus: 'COMPLETED'
                    },
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true, company: true } },
                        department: true,
                        designation: true,
                        bankDetails: true,
                        salaryStructure: true
                    }
                });
            } else {
                return res.status(404).json({ message: 'Employee profile not found' });
            }
        } else if (employee && (employee.user?.role === 'HR' || employee.user?.role === 'SUPER_ADMIN')) {
            // Self-heal: If profile already exists but phone/address are missing, copy them from the company
            const updates = {};
            if (!employee.phone && employee.user.company?.phone) {
                updates.phone = employee.user.company.phone;
            }
            if (!employee.address && employee.user.company?.address) {
                updates.address = employee.user.company.address;
            }
            if (Object.keys(updates).length > 0) {
                employee = await prisma.employee.update({
                    where: { id: employee.id },
                    data: updates,
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true, company: true } },
                        department: true,
                        designation: true,
                        bankDetails: true,
                        salaryStructure: true
                    }
                });
            }
        }

        res.json(employee);
    } catch (error) {
        console.error('Error fetching my profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateMe(req, res) {
    try {
        const userId = req.user.id;
        const { firstName, lastName, phone, password, address, country, state, city, postalCode } = req.body;
        
        const existing = await prisma.employee.findUnique({
            where: { userId },
            include: { user: true }
        });

        if (!existing) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const dataToUpdate = {};
        if (firstName) dataToUpdate.firstName = firstName;
        if (lastName) dataToUpdate.lastName = lastName;
        if (phone) dataToUpdate.phone = phone;
        if (address !== undefined) dataToUpdate.address = address;
        if (country !== undefined) dataToUpdate.country = country;
        if (state !== undefined) dataToUpdate.state = state;
        if (city !== undefined) dataToUpdate.city = city;
        if (postalCode !== undefined) dataToUpdate.postalCode = postalCode;

        if (req.file) {
            dataToUpdate.profilePhotoUrl = `/uploads/profiles/${req.file.filename}`;
        }

        const userUpdateData = {};
        if (firstName || lastName) {
            userUpdateData.name = `${firstName || existing.firstName} ${lastName || existing.lastName}`.trim();
        }
        
        if (password && password.trim() !== '') {
            if (password.length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }
            userUpdateData.password = await require('bcrypt').hash(password, 10);
        }

        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: userUpdateData
            });
        }

        const updatedEmployee = await prisma.employee.update({
            where: { id: existing.id },
            data: dataToUpdate,
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                department: true,
                designation: true
            }
        });

        res.json(updatedEmployee);
    } catch (error) {
        console.error('Error updating my profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ==========================================
// ONBOARDING WIZARD ENDPOINTS
// ==========================================

async function onboardingPersonal(req, res) {
    try {
        const userId = req.user.id;
        const { dateOfBirth, gender, address, emergencyContactName, emergencyContactPhone } = req.body;
        
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        const updated = await prisma.employee.update({
            where: { userId },
            data: {
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender: gender || null,
                address: address || null,
                emergencyContactName: emergencyContactName || null,
                emergencyContactPhone: emergencyContactPhone || null,
                onboardingStatus: employee.onboardingStatus === 'INVITED' ? 'PROFILE_SUBMITTED' : employee.onboardingStatus
            }
        });

        res.json({ message: 'Personal details saved successfully', employee: updated });
    } catch (error) {
        console.error('Onboarding Personal Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function onboardingBank(req, res) {
    try {
        const userId = req.user.id;
        const { bankName, accountName, accountNumber, ifscCode, branchName } = req.body;
        
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        const bankDetails = await prisma.bankDetails.upsert({
            where: { employeeId: employee.id },
            update: { bankName, accountName, accountNumber, ifscCode, branchName },
            create: { employeeId: employee.id, bankName, accountName, accountNumber, ifscCode, branchName }
        });

        res.json({ message: 'Bank details saved successfully', bankDetails });
    } catch (error) {
        console.error('Onboarding Bank Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function onboardingDocuments(req, res) {
    try {
        const userId = req.user.id;
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        const aadhaarFile = req.files && req.files['aadhaar'] ? `/uploads/documents/${req.files['aadhaar'][0].filename}` : null;
        const panFile = req.files && req.files['pan'] ? `/uploads/documents/${req.files['pan'][0].filename}` : null;
        const resumeFile = req.files && req.files['resume'] ? `/uploads/documents/${req.files['resume'][0].filename}` : null;

        const dataToUpdate = { onboardingStatus: 'DOCS_SUBMITTED' };
        if (aadhaarFile) dataToUpdate.aadhaarPath = aadhaarFile;
        if (panFile) dataToUpdate.panPath = panFile;
        if (resumeFile) dataToUpdate.resumePath = resumeFile;

        const updated = await prisma.employee.update({
            where: { userId },
            data: dataToUpdate
        });

        res.json({ message: 'Fill onboarding form successfully Wait for Approval by Managment.', employee: updated });
    } catch (error) {
        console.error('Onboarding Documents Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function approveOnboarding(req, res) {
    try {
        const { id } = req.params; // Employee ID
        
        const employee = await prisma.employee.findUnique({ where: { id: parseInt(id) } });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const updated = await prisma.employee.update({
            where: { id: parseInt(id) },
            data: {
                onboardingStatus: 'COMPLETED'
            }
        });

        res.json({ message: 'Employee onboarding approved successfully!', employee: updated });
    } catch (error) {
        console.error('Approve Onboarding Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function resendInvite(req, res) {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                user: {
                    include: {
                        company: true
                    }
                }
            }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (employee.onboardingStatus !== 'INVITED') {
            return res.status(400).json({ message: 'Employee is not in INVITED status' });
        }

        // Delete any existing invite tokens
        await prisma.inviteToken.deleteMany({
            where: { employeeId: employee.id }
        });

        // Generate new token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        await prisma.inviteToken.create({
            data: {
                employeeId: employee.id,
                userId: employee.user.id,
                token: inviteToken,
                expiresAt: tokenExpiry
            }
        });

        // Send email
        const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_DOMAIN === 'aaups.com';
        const baseDomain = process.env.FRONTEND_DOMAIN || (isProduction ? 'aaups.com' : 'localhost:3000');
        const protocol = baseDomain.includes('localhost') ? 'http' : 'https';
        const company = employee.user.company;
        const workspaceUrl = company.subdomain ? `${protocol}://${company.subdomain}.${baseDomain}` : `${protocol}://${baseDomain}`;
        
        emailService.sendEmployeeInviteEmail(
            employee.user.email,
            inviteToken,
            company.name,
            employee.firstName,
            workspaceUrl
        ).catch(err => console.error("Failed to resend invite email:", err));

        res.json({ message: 'Invite resent successfully!' });
    } catch (error) {
        console.error('Error resending invite:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    checkEmailAvailability,
    createEmployee,
    getEmployees,
    updateEmployee,
    deleteEmployee,
    getMe,
    updateMe,
    onboardingPersonal,
    onboardingBank,
    onboardingDocuments,
    approveOnboarding,
    resendInvite
};
