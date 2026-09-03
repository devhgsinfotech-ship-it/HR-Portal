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
            firstName, lastName, email, password, phone, departmentId, designationId, dateOfJoining, role, reportingManagerId, companyRoleId,
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
        // const allowedDomain = (company.emailDomain || (company.subdomain ? `${company.subdomain}.com` : null))?.toLowerCase();
        // const employeeDomain = email.split('@')[1]?.toLowerCase();

        // if (allowedDomain && employeeDomain !== allowedDomain) {
        //     return res.status(400).json({ 
        //         message: `Employees must have an email ending with @${allowedDomain}` 
        //     });
        // }

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
                    companyRoleId: companyRoleId && companyRoleId !== 'undefined' && companyRoleId !== 'null' ? parseInt(companyRoleId, 10) : null,
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
                    companyRole: true
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
        const logoUrl = company.logoUrl ? (company.logoUrl.startsWith('http') ? company.logoUrl : `https://api.aaups.com${company.logoUrl}`) : null;
        emailService.sendEmployeeInviteEmail(
            email, 
            inviteToken, 
            company.name, 
            firstName, 
            workspaceUrl,
            logoUrl
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
                companyRole: true,
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

async function getEmployeeById(req, res) {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                user: true,
                department: true,
                designation: true,
                companyRole: true,
                bankDetails: true,
                salaryStructure: true,
                reportingManager: {
                    include: { user: true }
                }
            }
        });
        if (!employee || employee.user.companyId !== companyId) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateEmployee(req, res) {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const { 
            firstName, lastName, phone, departmentId, designationId, dateOfJoining, email, password, role, reportingManagerId, companyRoleId,
            basic, hra, conveyance, medicalAllowance, specialAllowance, pfDeduction, professionalTax, otherDeductions, grossSalary, netSalary,
            // Profile & Bio
            about, education, experience,
            // Personal Information
            passportNo, passportExpiry, nationality, religion, maritalStatus, spouseEmployed, spouseName, numberOfChildren,
            // Emergency Contact
            emergencyContactName, emergencyContactPhone, emergencyContactRelationship,
            // Bank Details
            bankAccountName, bankAccountNumber, bankName, ifscCode, branchName,
            // Additional fields
            address, gender, dateOfBirth
        } = req.body;

        // Ensure the employee belongs to this company
        const existing = await prisma.employee.findUnique({
            where: { id: parseInt(id, 10) },
            include: { user: true }
        });

        if (!existing || existing.user.companyId !== companyId) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const dataToUpdate = {};
        if (firstName !== undefined) dataToUpdate.firstName = firstName;
        if (lastName !== undefined) dataToUpdate.lastName = lastName;
        if (phone !== undefined) dataToUpdate.phone = phone;
        if (address !== undefined) dataToUpdate.address = address;
        if (gender !== undefined) dataToUpdate.gender = gender;
        if (dateOfBirth !== undefined) dataToUpdate.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        dataToUpdate.departmentId = departmentId && departmentId !== 'undefined' ? parseInt(departmentId, 10) : existing.departmentId;
        dataToUpdate.designationId = designationId && designationId !== 'undefined' ? parseInt(designationId, 10) : existing.designationId;
        // Bio fields
        if (about !== undefined) dataToUpdate.about = about;
        if (education !== undefined) dataToUpdate.education = education;
        if (experience !== undefined) dataToUpdate.experience = experience;
        // Personal info
        if (passportNo !== undefined) dataToUpdate.passportNo = passportNo;
        if (passportExpiry !== undefined) dataToUpdate.passportExpiry = passportExpiry ? new Date(passportExpiry) : null;
        if (nationality !== undefined) dataToUpdate.nationality = nationality;
        if (religion !== undefined) dataToUpdate.religion = religion;
        if (maritalStatus !== undefined) dataToUpdate.maritalStatus = maritalStatus;
        if (spouseEmployed !== undefined) dataToUpdate.spouseEmployed = spouseEmployed;
        if (spouseName !== undefined) dataToUpdate.spouseName = spouseName;
        if (numberOfChildren !== undefined) dataToUpdate.numberOfChildren = numberOfChildren ? parseInt(numberOfChildren, 10) : null;
        // Emergency contact
        if (emergencyContactName !== undefined) dataToUpdate.emergencyContactName = emergencyContactName;
        if (emergencyContactPhone !== undefined) dataToUpdate.emergencyContactPhone = emergencyContactPhone;
        if (emergencyContactRelationship !== undefined) dataToUpdate.emergencyContactRelationship = emergencyContactRelationship;

        if (dateOfJoining) {
            dataToUpdate.dateOfJoining = new Date(dateOfJoining);
        }
        if (reportingManagerId !== undefined) {
            dataToUpdate.reportingManagerId = (reportingManagerId && reportingManagerId !== 'undefined' && reportingManagerId !== 'null') ? parseInt(reportingManagerId, 10) : null;
        }
        if (companyRoleId !== undefined) {
            dataToUpdate.companyRoleId = (companyRoleId && companyRoleId !== 'undefined' && companyRoleId !== 'null') ? parseInt(companyRoleId, 10) : null;
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
            // const company = await prisma.company.findUnique({ where: { id: companyId } });
            // const allowedDomain = (company?.emailDomain || (company?.subdomain ? `${company.subdomain}.com` : null))?.toLowerCase();
            // const employeeDomain = email.split('@')[1]?.toLowerCase();
            // if (allowedDomain && employeeDomain !== allowedDomain) {
            //     return res.status(400).json({ 
            //         message: `Employees must have an email ending with @${allowedDomain}` 
            //     });
            // }
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

        // Bank details upsert
        if (bankAccountNumber !== undefined && bankAccountNumber !== '') {
            await prisma.bankDetails.upsert({
                where: { employeeId: existing.id },
                update: {
                    accountName: bankAccountName || '',
                    accountNumber: bankAccountNumber,
                    bankName: bankName || '',
                    ifscCode: ifscCode || '',
                    branchName: branchName || null,
                },
                create: {
                    employeeId: existing.id,
                    accountName: bankAccountName || '',
                    accountNumber: bankAccountNumber,
                    bankName: bankName || '',
                    ifscCode: ifscCode || '',
                    branchName: branchName || null,
                }
            });
        }

        // Return the full updated employee
        const updatedFull = await prisma.employee.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                user: true,
                department: true,
                designation: true,
                bankDetails: true,
                salaryStructure: true,
                reportingManager: { include: { user: true } }
            }
        });

        res.json(updatedFull);
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
                onboardingStatus: (employee.onboardingStatus === 'INVITED' || employee.onboardingStatus === 'CORRECTION_REQUESTED') ? 'PROFILE_SUBMITTED' : employee.onboardingStatus
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

        const dataToUpdate = { onboardingStatus: 'DOCS_SUBMITTED', rejectionReason: null };
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
        const logoUrl = company.logoUrl ? (company.logoUrl.startsWith('http') ? company.logoUrl : `https://api.aaups.com${company.logoUrl}`) : null;
        
        emailService.sendEmployeeInviteEmail(
            employee.user.email,
            inviteToken,
            company.name,
            employee.firstName,
            workspaceUrl,
            logoUrl
        ).catch(err => console.error("Failed to resend invite email:", err));

        res.json({ message: 'Invite resent successfully!' });
    } catch (error) {
        console.error('Error resending invite:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateEmployeeDocuments(req, res) {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(id, 10) },
            include: { user: true }
        });

        if (!employee || employee.user.companyId !== companyId) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const aadhaarFile = req.files && req.files['aadhaar'] ? `/uploads/documents/${req.files['aadhaar'][0].filename}` : null;
        const panFile = req.files && req.files['pan'] ? `/uploads/documents/${req.files['pan'][0].filename}` : null;
        const resumeFile = req.files && req.files['resume'] ? `/uploads/documents/${req.files['resume'][0].filename}` : null;

        const dataToUpdate = {};
        if (aadhaarFile) dataToUpdate.aadhaarPath = aadhaarFile;
        if (panFile) dataToUpdate.panPath = panFile;
        if (resumeFile) dataToUpdate.resumePath = resumeFile;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ message: 'No documents provided for update' });
        }

        const updated = await prisma.employee.update({
            where: { id: parseInt(id, 10) },
            data: dataToUpdate
        });

        res.json({ message: 'Documents updated successfully', employee: updated });
    } catch (error) {
        console.error('Update Employee Documents Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function requestOnboardingCorrection(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Correction reason is required' });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: parseInt(id, 10) }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const updated = await prisma.employee.update({
            where: { id: parseInt(id, 10) },
            data: {
                onboardingStatus: 'CORRECTION_REQUESTED',
                rejectionReason: reason
            }
        });

        res.json({ message: 'Correction request sent successfully!', employee: updated });
    } catch (error) {
        console.error('Request Onboarding Correction Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


async function getCompanyEvents(req, res) {
    try {
        const companyId = req.user.companyId;
        const employees = await prisma.employee.findMany({
            where: { user: { companyId } },
            include: { user: { select: { name: true, email: true } }, designation: true }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();

        const birthdaysToday = [];
        const upcomingBirthdays = [];
        const anniversaries = [];
        const joinees = [];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        for (const emp of employees) {
            if (emp.dateOfBirth) {
                const dob = new Date(emp.dateOfBirth);
                
                // Get birthday in current year
                const bdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
                bdayThisYear.setHours(0, 0, 0, 0);
                
                let nextBday = bdayThisYear;
                if (bdayThisYear.getTime() < today.getTime()) {
                    nextBday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
                }
                
                const diffTime = nextBday.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                const formattedBday = nextBday.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' });
                
                const empBdayInfo = {
                    id: emp.id,
                    name: `${emp.firstName} ${emp.lastName || ''}`.trim(),
                    profilePhotoUrl: emp.profilePhotoUrl,
                    designation: emp.designation?.name || 'N/A',
                    dateStr: formattedBday,
                    diffDays
                };

                if (dob.getDate() === currentDay && dob.getMonth() === currentMonth) {
                    birthdaysToday.push(empBdayInfo);
                } else if (diffDays <= 30) {
                    upcomingBirthdays.push(empBdayInfo);
                }
            }

            if (emp.dateOfJoining) {
                const doj = new Date(emp.dateOfJoining);
                if (doj.getDate() === currentDay && doj.getMonth() === currentMonth) {
                    if (doj.getFullYear() < today.getFullYear()) {
                        const years = today.getFullYear() - doj.getFullYear();
                        anniversaries.push({
                            id: emp.id,
                            name: `${emp.firstName} ${emp.lastName || ''}`.trim(),
                            profilePhotoUrl: emp.profilePhotoUrl,
                            designation: emp.designation?.name || 'N/A',
                            years: `${years} Year${years > 1 ? 's' : ''}`
                        });
                    }
                }

                if (doj >= thirtyDaysAgo && doj <= today) {
                    joinees.push({
                        id: emp.id,
                        name: `${emp.firstName} ${emp.lastName || ''}`.trim(),
                        profilePhotoUrl: emp.profilePhotoUrl,
                        designation: emp.designation?.name || 'N/A',
                        dateOfJoining: doj
                    });
                }
            }
        }

        // Sort upcoming birthdays chronologically
        upcomingBirthdays.sort((a, b) => a.diffDays - b.diffDays);

        res.json({ 
            birthdays: {
                today: birthdaysToday,
                upcoming: upcomingBirthdays
            }, 
            anniversaries, 
            joinees 
        });
    } catch (error) {
        console.error('Get Company Events Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getPosts(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;

        const currentEmployee = await prisma.employee.findUnique({
            where: { userId }
        });
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const posts = await prisma.post.findMany({
            where: { companyId },
            include: {
                employee: {
                    include: {
                        user: { select: { name: true, email: true } },
                        designation: true
                    }
                },
                likes: true,
                comments: {
                    include: {
                        employee: {
                            include: {
                                user: { select: { name: true, email: true } }
                            }
                        },
                        likes: true
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const enrichedPosts = posts.map(post => {
            const likedByMe = post.likes.some(like => like.employeeId === currentEmployee.id);
            
            const allComments = post.comments.map(c => {
                const commentLikedByMe = c.likes.some(like => like.employeeId === currentEmployee.id);
                return {
                    id: c.id,
                    parentId: c.parentId,
                    employeeId: c.employeeId,
                    author: `${c.employee.firstName} ${c.employee.lastName || ''}`.trim(),
                    profilePhotoUrl: c.employee.profilePhotoUrl,
                    timestamp: c.createdAt,
                    content: c.content,
                    likesCount: c.likes.length,
                    liked: commentLikedByMe,
                    replies: []
                };
            });

            const parentComments = allComments.filter(c => !c.parentId);
            const replies = allComments.filter(c => c.parentId);

            for (const reply of replies) {
                const parent = parentComments.find(p => p.id === reply.parentId);
                if (parent) {
                    parent.replies.push(reply);
                }
            }

            return {
                id: post.id,
                employeeId: post.employeeId,
                author: `${post.employee.firstName} ${post.employee.lastName || ''}`.trim(),
                profilePhotoUrl: post.employee.profilePhotoUrl,
                designation: post.employee.designation?.name || 'N/A',
                timestamp: post.createdAt,
                content: post.content,
                image: post.image,
                likes: post.likes.length,
                liked: likedByMe,
                comments: parentComments
            };
        });

        res.json(enrichedPosts);
    } catch (error) {
        console.error('Get Posts Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function createPost(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { content } = req.body;

        const currentEmployee = await prisma.employee.findUnique({
            where: { userId }
        });
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const imagePath = req.file ? `/uploads/posts/${req.file.filename}` : null;

        const newPost = await prisma.post.create({
            data: {
                companyId,
                employeeId: currentEmployee.id,
                content: content || '',
                image: imagePath
            },
            include: {
                employee: {
                    include: {
                        user: { select: { name: true } },
                        designation: true
                    }
                }
            }
        });

        res.status(201).json(newPost);
    } catch (error) {
        console.error('Create Post Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function toggleLikePost(req, res) {
    try {
        const userId = req.user.id;
        const postId = parseInt(req.params.id, 10);

        const currentEmployee = await prisma.employee.findUnique({
            where: { userId }
        });
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const existingLike = await prisma.postLike.findUnique({
            where: {
                postId_employeeId: {
                    postId,
                    employeeId: currentEmployee.id
                }
            }
        });

        if (existingLike) {
            await prisma.postLike.delete({
                where: { id: existingLike.id }
            });
            return res.json({ liked: false });
        } else {
            await prisma.postLike.create({
                data: {
                    postId,
                    employeeId: currentEmployee.id
                }
            });
            return res.json({ liked: true });
        }
    } catch (error) {
        console.error('Toggle Like Post Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function addCommentPost(req, res) {
    try {
        const userId = req.user.id;
        const postId = parseInt(req.params.id, 10);
        const { content, parentId } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const currentEmployee = await prisma.employee.findUnique({
            where: { userId }
        });
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const newComment = await prisma.postComment.create({
            data: {
                postId,
                employeeId: currentEmployee.id,
                content,
                parentId: parentId ? parseInt(parentId, 10) : null
            },
            include: {
                employee: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            }
        });

        res.status(201).json({
            id: newComment.id,
            parentId: newComment.parentId,
            author: `${newComment.employee.firstName} ${newComment.employee.lastName || ''}`.trim(),
            timestamp: newComment.createdAt,
            content: newComment.content
        });
    } catch (error) {
        console.error('Add Comment Post Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


async function editPost(req, res) {
    try {
        const postId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { content, imageRemoved } = req.body;

        const currentEmployee = await prisma.employee.findUnique({
            where: { userId }
        });
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.employeeId !== currentEmployee.id) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to edit this post' });
        }

        const dataToUpdate = { content: content || '' };
        if (req.file) {
            dataToUpdate.image = `/uploads/posts/${req.file.filename}`;
        } else if (imageRemoved === 'true') {
            dataToUpdate.image = null;
        }

        const updated = await prisma.post.update({
            where: { id: postId },
            data: dataToUpdate
        });

        res.json(updated);
    } catch (error) {
        console.error('Edit Post Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deletePost(req, res) {
    try {
        const postId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        const currentEmployee = await prisma.employee.findUnique({
            where: { userId }
        });
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.employeeId !== currentEmployee.id && req.user.role !== 'HR' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this post' });
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete Post Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


async function editComment(req, res) {
    try {
        const commentId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const currentEmployee = await prisma.employee.findUnique({
            where: { userId }
        });
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const comment = await prisma.postComment.findUnique({
            where: { id: commentId }
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.employeeId !== currentEmployee.id) {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to edit this comment' });
        }

        const updated = await prisma.postComment.update({
            where: { id: commentId },
            data: { content }
        });

        res.json(updated);
    } catch (error) {
        console.error('Edit Comment Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteComment(req, res) {
    try {
        const commentId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        const currentEmployee = await prisma.employee.findUnique({
            where: { userId }
        });
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const comment = await prisma.postComment.findUnique({
            where: { id: commentId }
        });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.employeeId !== currentEmployee.id && req.user.role !== 'HR' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this comment' });
        }

        await prisma.postComment.delete({
            where: { id: commentId }
        });

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete Comment Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


async function toggleLikeComment(req, res) {
    try {
        const commentId = parseInt(req.params.id, 10);
        const userId = req.user.id;

        const currentEmployee = await prisma.employee.findUnique({
            where: { userId }
        });
        if (!currentEmployee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const existingLike = await prisma.commentLike.findUnique({
            where: {
                commentId_employeeId: {
                    commentId,
                    employeeId: currentEmployee.id
                }
            }
        });

        if (existingLike) {
            await prisma.commentLike.delete({
                where: { id: existingLike.id }
            });
            return res.json({ liked: false });
        } else {
            await prisma.commentLike.create({
                data: {
                    commentId,
                    employeeId: currentEmployee.id
                }
            });
            return res.json({ liked: true });
        }
    } catch (error) {
        console.error('Toggle Like Comment Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getOnLeaveToday(req, res) {
    try {
        const companyId = req.user.companyId;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const onLeave = await prisma.leaveRequest.findMany({
            where: {
                status: 'APPROVED',
                startDate: { lte: todayEnd },
                endDate: { gte: todayStart },
                employee: {
                    user: { companyId }
                }
            },
            include: {
                employee: {
                    include: {
                        user: { select: { name: true } },
                        designation: { select: { name: true } },
                        department: { select: { name: true } }
                    }
                },
                leaveType: { select: { name: true } }
            }
        });

        const result = onLeave.map(r => ({
            id: r.id,
            employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
            designation: r.employee.designation?.name || null,
            department: r.employee.department?.name || null,
            profilePhotoUrl: r.employee.profilePhotoUrl || null,
            leaveType: r.leaveType?.name || 'Leave',
            startDate: r.startDate,
            endDate: r.endDate
        }));

        res.json(result);
    } catch (error) {
        console.error('Get On Leave Today Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getNextHoliday(req, res) {
    try {
        const companyId = req.user.companyId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextHoliday = await prisma.holiday.findFirst({
            where: {
                companyId,
                holidayDate: { gte: today }
            },
            orderBy: { holidayDate: 'asc' }
        });

        res.json(nextHoliday || null);
    } catch (error) {
        console.error('Get Next Holiday Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    checkEmailAvailability,
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getMe,
    updateMe,
    onboardingPersonal,
    onboardingBank,
    onboardingDocuments,
    approveOnboarding,
    resendInvite,
    updateEmployeeDocuments,
    requestOnboardingCorrection,
    getCompanyEvents,
    getPosts,
    createPost,
    toggleLikePost,
    addCommentPost,
    editPost,
    deletePost,
    editComment,
    deleteComment,
    toggleLikeComment,
    getOnLeaveToday,
    getNextHoliday
};
