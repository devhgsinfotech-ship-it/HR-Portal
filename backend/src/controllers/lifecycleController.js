// backend/src/controllers/lifecycleController.js
const prisma = require('../config/prisma');
const {
    notifyPromotion,
    notifyTermination,
    notifyResignation,
    notifyProbationStatus
} = require('../utils/lifecycleNotifier');

/**
 * Helper to extract companyId from authenticated user
 */
function getCompanyId(req) {
    return req.user?.companyId;
}

/**
 * Helper to return clean photo path (relative paths are dynamically resolved by frontend's universal APP_CONFIG)
 */
function formatPhotoUrl(photoPath) {
    if (!photoPath) return null;
    return photoPath;
}

// Common non-admin filter so SUPER_ADMIN and COMPANY_ADMIN are never treated as employees
const NON_ADMIN_USER_FILTER = {
    role: { notIn: ['SUPER_ADMIN', 'COMPANY_ADMIN'] }
};

// ========================================================
// 0. METADATA FOR DROPDOWNS (Employees, Depts, Designations)
// ========================================================
async function getLifecycleMetadata(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const empWhere = {
            user: {
                companyId,
                ...NON_ADMIN_USER_FILTER
            }
        };

        // If regular employee, only show their own employee record
        if (req.user?.role === 'EMPLOYEE') {
            empWhere.userId = req.user.id;
        }

        const [employees, departments, designations] = await Promise.all([
            prisma.employee.findMany({
                where: empWhere,
                select: {
                    id: true,
                    employeeCode: true,
                    firstName: true,
                    lastName: true,
                    profilePhotoUrl: true,
                    dateOfJoining: true,
                    departmentId: true,
                    designationId: true,
                    probationStatus: true,
                    probationEndDate: true,
                    probationDurationMonths: true,
                    noticeStartDate: true,
                    noticeEndDate: true,
                    noticePeriodDays: true,
                    noticeStatus: true,
                    department: { select: { id: true, name: true } },
                    designation: { select: { id: true, name: true } },
                    reportingManager: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profilePhotoUrl: true,
                        }
                    },
                    salaryStructure: {
                        select: { basic: true, grossSalary: true }
                    }
                },
                orderBy: { firstName: 'asc' }
            }),
            prisma.department.findMany({
                where: { companyId },
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            }),
            prisma.designation.findMany({
                where: { companyId },
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            })
        ]);

        return res.json({
            employees: employees.map(emp => ({
                id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`.trim(),
                employeeCode: emp.employeeCode,
                profilePhotoUrl: formatPhotoUrl(emp.profilePhotoUrl),
                dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.toISOString().split('T')[0] : null,
                departmentId: emp.departmentId,
                departmentName: emp.department?.name || '',
                designationId: emp.designationId,
                designationName: emp.designation?.name || '',
                managerName: emp.reportingManager ? `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`.trim() : '',
                probationStatus: emp.probationStatus,
                probationEndDate: emp.probationEndDate ? emp.probationEndDate.toISOString().split('T')[0] : null,
                probationDurationMonths: emp.probationDurationMonths || 3,
                currentSalary: Number(emp.salaryStructure?.grossSalary || emp.salaryStructure?.basic || 0)
            })),
            departments,
            designations
        });
    } catch (error) {
        console.error('Error fetching lifecycle metadata:', error);
        return res.status(500).json({ message: 'Failed to fetch metadata', error: error.message });
    }
}

// ========================================================
// 1. PROBATION MANAGEMENT
// ========================================================
async function getProbations(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const { search, status } = req.query;

        // Only employees who have probationStatus set and are NOT company admin / super admin
        const where = {
            user: {
                companyId,
                ...NON_ADMIN_USER_FILTER
            },
            probationStatus: { not: null }
        };

        // If employee, only see own probation record
        if (req.user?.role === 'EMPLOYEE') {
            where.userId = req.user.id;
        }

        if (status && status !== 'All') {
            where.probationStatus = status.toUpperCase();
        }

        if (search) {
            where.AND = [
                {
                    OR: [
                        { firstName: { contains: search } },
                        { lastName: { contains: search } },
                        { employeeCode: { contains: search } }
                    ]
                }
            ];
        }

        const employees = await prisma.employee.findMany({
            where,
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, name: true } },
                reportingManager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true
                    }
                }
            },
            orderBy: { dateOfJoining: 'desc' }
        });

        const today = new Date();
        const records = employees.map(emp => {
            let joiningDate = emp.dateOfJoining ? new Date(emp.dateOfJoining) : null;
            let probationMonths = emp.probationDurationMonths || 3;
            let probationEndDate = emp.probationEndDate ? new Date(emp.probationEndDate) : null;

            if (!probationEndDate && joiningDate) {
                probationEndDate = new Date(joiningDate);
                probationEndDate.setMonth(probationEndDate.getMonth() + probationMonths);
            }

            let daysRemaining = null;
            if (probationEndDate) {
                const diffTime = probationEndDate.getTime() - today.getTime();
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return {
                id: emp.id,
                employeeCode: emp.employeeCode,
                name: `${emp.firstName} ${emp.lastName}`.trim(),
                profilePhotoUrl: formatPhotoUrl(emp.profilePhotoUrl),
                department: emp.department?.name || 'General',
                departmentId: emp.departmentId,
                designation: emp.designation?.name || 'Employee',
                designationId: emp.designationId,
                joiningDate: joiningDate ? joiningDate.toISOString().split('T')[0] : null,
                probationEndDate: probationEndDate ? probationEndDate.toISOString().split('T')[0] : null,
                probationDurationMonths: probationMonths,
                probationStatus: emp.probationStatus || 'ON_PROBATION',
                reviewer: emp.reportingManager
                    ? `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`.trim()
                    : 'HR Admin',
                reviewerPhoto: formatPhotoUrl(emp.reportingManager?.profilePhotoUrl),
                reviewerId: emp.reportingManagerId,
                daysRemaining
            };
        });

        return res.json(records);
    } catch (error) {
        console.error('Error in getProbations:', error);
        return res.status(500).json({ message: 'Failed to fetch probation list', error: error.message });
    }
}

async function updateProbationStatus(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot modify probation records.' });
        }

        const companyId = getCompanyId(req);
        const employeeId = parseInt(req.params.id || req.body.employeeId, 10);
        const {
            status,
            extensionMonths,
            probationDurationMonths,
            probationEndDate,
            joiningDate,
            reviewerId
        } = req.body;

        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                user: {
                    companyId,
                    ...NON_ADMIN_USER_FILTER
                }
            }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const updateData = { probationStatus: status || 'ON_PROBATION' };

        if (joiningDate) {
            updateData.dateOfJoining = new Date(joiningDate);
        }

        if (reviewerId) {
            updateData.reportingManagerId = parseInt(reviewerId, 10);
        }

        if (status === 'EXTENDED' && extensionMonths) {
            const currentEndDate = employee.probationEndDate
                ? new Date(employee.probationEndDate)
                : (employee.dateOfJoining ? new Date(employee.dateOfJoining) : new Date());
            currentEndDate.setMonth(currentEndDate.getMonth() + parseInt(extensionMonths, 10));
            updateData.probationEndDate = currentEndDate;
            updateData.probationDurationMonths = (employee.probationDurationMonths || 3) + parseInt(extensionMonths, 10);
        } else if (probationEndDate) {
            updateData.probationEndDate = new Date(probationEndDate);
            if (probationDurationMonths) {
                updateData.probationDurationMonths = parseInt(probationDurationMonths, 10);
            }
        } else if (probationDurationMonths) {
            updateData.probationDurationMonths = parseInt(probationDurationMonths, 10);
            const baseDate = joiningDate ? new Date(joiningDate) : (employee.dateOfJoining ? new Date(employee.dateOfJoining) : new Date());
            const end = new Date(baseDate);
            end.setMonth(end.getMonth() + parseInt(probationDurationMonths, 10));
            updateData.probationEndDate = end;
        }

        const updated = await prisma.employee.update({
            where: { id: employeeId },
            data: updateData,
            include: {
                department: true,
                designation: true,
                reportingManager: true
            }
        });

        notifyProbationStatus({
            companyId,
            senderUserId: req.user?.id,
            employeeId: updated.id,
            status: updated.probationStatus,
            probationEndDate: updated.probationEndDate,
            extensionMonths
        }).catch(e => console.warn('[lifecycleController] Probation notification error:', e.message));

        return res.json({ message: 'Probation updated successfully', employee: updated });
    } catch (error) {
        console.error('Error updating probation status:', error);
        return res.status(500).json({ message: 'Failed to update probation', error: error.message });
    }
}

async function removeEmployeeProbation(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot remove probation records.' });
        }

        const companyId = getCompanyId(req);
        const employeeId = parseInt(req.params.id, 10);

        const employee = await prisma.employee.findFirst({
            where: {
                id: employeeId,
                user: { companyId, ...NON_ADMIN_USER_FILTER }
            }
        });

        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                probationStatus: null,
                probationEndDate: null,
                probationDurationMonths: null
            }
        });

        return res.json({ message: 'Employee removed from probation tracker' });
    } catch (error) {
        console.error('Error removing employee probation:', error);
        return res.status(500).json({ message: 'Failed to remove probation', error: error.message });
    }
}

// ========================================================
// 2. NOTICE PERIOD TRACKER
// ========================================================
async function getNoticePeriods(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const { search, status } = req.query;

        const where = {
            user: {
                companyId,
                ...NON_ADMIN_USER_FILTER
            },
            OR: [
                { noticeStartDate: { not: null } },
                { noticeStatus: { not: null } },
                { resignations: { some: {} } },
                { terminations: { some: {} } }
            ]
        };

        // If employee, only see own notice period record
        if (req.user?.role === 'EMPLOYEE') {
            where.userId = req.user.id;
        }

        if (search) {
            where.AND = [
                {
                    OR: [
                        { firstName: { contains: search } },
                        { lastName: { contains: search } },
                        { employeeCode: { contains: search } }
                    ]
                }
            ];
        }

        const employees = await prisma.employee.findMany({
            where,
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, name: true } },
                resignations: { orderBy: { createdAt: 'desc' }, take: 1 },
                terminations: { orderBy: { createdAt: 'desc' }, take: 1 }
            },
            orderBy: { noticeStartDate: 'desc' }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const records = employees.map(emp => {
            const resignation = emp.resignations[0];
            const termination = emp.terminations[0];

            let startDate = emp.noticeStartDate
                ? new Date(emp.noticeStartDate)
                : (resignation?.noticeDate ? new Date(resignation.noticeDate) : (termination?.noticeDate ? new Date(termination.noticeDate) : null));

            let endDate = emp.noticeEndDate
                ? new Date(emp.noticeEndDate)
                : (resignation?.resignationDate ? new Date(resignation.resignationDate) : (termination?.terminationDate ? new Date(termination.terminationDate) : null));

            let totalDays = emp.noticePeriodDays || 30;
            if (startDate && endDate) {
                const diffTime = endDate.getTime() - startDate.getTime();
                const calcDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (calcDays > 0) totalDays = calcDays;
            }

            let completedDays = 0;
            let remainingDays = totalDays;
            if (startDate) {
                const diffCompleted = today.getTime() - startDate.getTime();
                completedDays = Math.max(0, Math.ceil(diffCompleted / (1000 * 60 * 60 * 24)));
                if (completedDays > totalDays) completedDays = totalDays;
                remainingDays = Math.max(0, totalDays - completedDays);
            }

            let computedStatus = emp.noticeStatus || 'Active';
            if (emp.noticeStatus === 'COMPLETED' || remainingDays === 0) {
                computedStatus = 'Completed';
            } else if (remainingDays <= 7 && remainingDays > 0) {
                computedStatus = 'Closing Soon';
            } else if (emp.noticeStatus === 'WAIVED') {
                computedStatus = 'Waived';
            } else {
                computedStatus = 'Active';
            }

            return {
                id: emp.id,
                employeeCode: emp.employeeCode,
                name: `${emp.firstName} ${emp.lastName}`.trim(),
                profilePhotoUrl: formatPhotoUrl(emp.profilePhotoUrl),
                department: emp.department?.name || 'General',
                designation: emp.designation?.name || 'Employee',
                startDate: startDate ? startDate.toISOString().split('T')[0] : null,
                endDate: endDate ? endDate.toISOString().split('T')[0] : null,
                totalDays,
                completedDays,
                remainingDays,
                status: computedStatus,
                exitType: emp.exitType || (resignation ? 'Resignation' : (termination ? 'Termination' : 'Notice'))
            };
        });

        const filtered = (status && status !== 'All')
            ? records.filter(r => r.status.toLowerCase() === status.toLowerCase())
            : records;

        return res.json(filtered);
    } catch (error) {
        console.error('Error in getNoticePeriods:', error);
        return res.status(500).json({ message: 'Failed to fetch notice period list', error: error.message });
    }
}

async function startNoticePeriod(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot start notice periods directly. Please submit a resignation instead.' });
        }

        const companyId = getCompanyId(req);
        const { employeeId, noticeStartDate, noticeEndDate, noticePeriodDays, exitType } = req.body;

        const employee = await prisma.employee.findFirst({
            where: {
                id: parseInt(employeeId, 10),
                user: { companyId, ...NON_ADMIN_USER_FILTER }
            }
        });

        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const start = new Date(noticeStartDate);
        let end = noticeEndDate ? new Date(noticeEndDate) : null;
        const days = parseInt(noticePeriodDays, 10) || 30;

        if (!end) {
            end = new Date(start);
            end.setDate(end.getDate() + days);
        }

        const updated = await prisma.employee.update({
            where: { id: employee.id },
            data: {
                noticeStartDate: start,
                noticeEndDate: end,
                noticePeriodDays: days,
                noticeStatus: 'SERVING',
                exitType: exitType || 'RESIGNATION'
            }
        });

        return res.json({ message: 'Notice period initiated successfully', employee: updated });
    } catch (error) {
        console.error('Error starting notice period:', error);
        return res.status(500).json({ message: 'Failed to start notice period', error: error.message });
    }
}

// ========================================================
// 3. PROMOTIONS
// ========================================================
async function getPromotions(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const where = {
            companyId,
            employee: { user: { ...NON_ADMIN_USER_FILTER } }
        };

        // If employee, only see own promotions
        if (req.user?.role === 'EMPLOYEE') {
            where.employee.userId = req.user.id;
        }

        const promotions = await prisma.promotion.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true
                    }
                },
                department: { select: { id: true, name: true } },
                previousDesignation: { select: { id: true, name: true } },
                newDesignation: { select: { id: true, name: true } }
            },
            orderBy: { promotionDate: 'desc' }
        });

        const formatted = promotions.map(p => ({
            id: p.id,
            employeeId: p.employeeId,
            employeeName: p.employee ? `${p.employee.firstName} ${p.employee.lastName}`.trim() : 'Unknown',
            employeeCode: p.employee?.employeeCode || '',
            profilePhotoUrl: formatPhotoUrl(p.employee?.profilePhotoUrl),
            departmentId: p.departmentId,
            department: p.department?.name || 'General',
            previousDesignationId: p.previousDesignationId,
            designationFrom: p.previousDesignation?.name || 'Previous Role',
            newDesignationId: p.newDesignationId,
            designationTo: p.newDesignation?.name || 'New Role',
            promotionDate: p.promotionDate ? p.promotionDate.toISOString().split('T')[0] : null,
            previousSalary: p.previousSalary,
            newSalary: p.newSalary,
            description: p.description
        }));

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getPromotions:', error);
        return res.status(500).json({ message: 'Failed to fetch promotions', error: error.message });
    }
}

async function createPromotion(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot record promotions.' });
        }

        const companyId = getCompanyId(req);
        const {
            employeeId,
            departmentId,
            previousDesignationId,
            newDesignationId,
            promotionDate,
            previousSalary,
            newSalary,
            description
        } = req.body;

        if (!employeeId || !newDesignationId || !promotionDate) {
            return res.status(400).json({ message: 'Employee, new designation, and promotion date are required' });
        }

        const employee = await prisma.employee.findFirst({
            where: {
                id: parseInt(employeeId, 10),
                user: { companyId, ...NON_ADMIN_USER_FILTER }
            },
            include: { salaryStructure: true }
        });

        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const prevDesigId = previousDesignationId ? parseInt(previousDesignationId, 10) : employee.designationId;
        const prevSal = previousSalary !== undefined ? parseFloat(previousSalary) : (Number(employee.salaryStructure?.grossSalary || employee.salaryStructure?.basic || 0));

        const result = await prisma.$transaction(async (tx) => {
            const promo = await tx.promotion.create({
                data: {
                    companyId,
                    employeeId: employee.id,
                    departmentId: departmentId ? parseInt(departmentId, 10) : employee.departmentId,
                    previousDesignationId: prevDesigId,
                    newDesignationId: parseInt(newDesignationId, 10),
                    promotionDate: new Date(promotionDate),
                    previousSalary: prevSal,
                    newSalary: newSalary ? parseFloat(newSalary) : null,
                    description: description || null
                },
                include: {
                    employee: true,
                    department: true,
                    previousDesignation: true,
                    newDesignation: true
                }
            });

            const employeeUpdate = {
                designationId: parseInt(newDesignationId, 10)
            };
            if (departmentId) {
                employeeUpdate.departmentId = parseInt(departmentId, 10);
            }
            await tx.employee.update({
                where: { id: employee.id },
                data: employeeUpdate
            });

            if (newSalary && employee.salaryStructure) {
                await tx.salaryStructure.update({
                    where: { id: employee.salaryStructure.id },
                    data: { basic: parseFloat(newSalary), grossSalary: parseFloat(newSalary) }
                });
            }

            return promo;
        });

        notifyPromotion({
            companyId,
            senderUserId: req.user?.id,
            promotionRecord: result
        }).catch(e => console.warn('[lifecycleController] Promotion notification error:', e.message));

        return res.status(201).json({ message: 'Promotion created successfully', promotion: result });
    } catch (error) {
        console.error('Error creating promotion:', error);
        return res.status(500).json({ message: 'Failed to create promotion', error: error.message });
    }
}

async function updatePromotion(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot update promotions.' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const { departmentId, newDesignationId, promotionDate, newSalary, description } = req.body;

        const existing = await prisma.promotion.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(404).json({ message: 'Promotion record not found' });

        const updateData = {};
        if (departmentId) updateData.departmentId = parseInt(departmentId, 10);
        if (newDesignationId) updateData.newDesignationId = parseInt(newDesignationId, 10);
        if (promotionDate) updateData.promotionDate = new Date(promotionDate);
        if (newSalary !== undefined) updateData.newSalary = parseFloat(newSalary);
        if (description !== undefined) updateData.description = description;

        const updated = await prisma.promotion.update({
            where: { id },
            data: updateData,
            include: {
                employee: true,
                department: true,
                previousDesignation: true,
                newDesignation: true
            }
        });

        if (newDesignationId) {
            await prisma.employee.update({
                where: { id: existing.employeeId },
                data: { designationId: parseInt(newDesignationId, 10) }
            });
        }

        return res.json({ message: 'Promotion updated successfully', promotion: updated });
    } catch (error) {
        console.error('Error updating promotion:', error);
        return res.status(500).json({ message: 'Failed to update promotion', error: error.message });
    }
}

async function deletePromotion(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot delete promotions.' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.promotion.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(404).json({ message: 'Promotion record not found' });

        await prisma.promotion.delete({ where: { id } });
        return res.json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        return res.status(500).json({ message: 'Failed to delete promotion', error: error.message });
    }
}

// ========================================================
// 4. RESIGNATIONS
// ========================================================
async function getResignations(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const where = {
            companyId,
            employee: { user: { ...NON_ADMIN_USER_FILTER } }
        };

        // If employee, only see own resignations
        if (req.user?.role === 'EMPLOYEE') {
            where.employee.userId = req.user.id;
        }

        const resignations = await prisma.resignation.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true
                    }
                },
                department: { select: { id: true, name: true } }
            },
            orderBy: { noticeDate: 'desc' }
        });

        const formatted = resignations.map(r => ({
            id: r.id,
            employeeId: r.employeeId,
            employeeName: r.employee ? `${r.employee.firstName} ${r.employee.lastName}`.trim() : 'Unknown',
            employeeCode: r.employee?.employeeCode || '',
            profilePhotoUrl: formatPhotoUrl(r.employee?.profilePhotoUrl),
            departmentId: r.departmentId,
            department: r.department?.name || 'General',
            reason: r.reason || 'Personal reasons',
            noticeDate: r.noticeDate ? r.noticeDate.toISOString().split('T')[0] : null,
            resignationDate: r.resignationDate ? r.resignationDate.toISOString().split('T')[0] : null,
            status: r.status || 'PENDING'
        }));

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getResignations:', error);
        return res.status(500).json({ message: 'Failed to fetch resignations', error: error.message });
    }
}

async function createResignation(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { employeeId, departmentId, noticeDate, resignationDate, reason } = req.body;

        let targetEmpId = parseInt(employeeId, 10);
        if (req.user?.role === 'EMPLOYEE') {
            const currentEmp = await prisma.employee.findUnique({
                where: { userId: req.user.id }
            });
            if (!currentEmp) {
                return res.status(404).json({ message: 'No employee record linked to your user account.' });
            }
            targetEmpId = currentEmp.id;
            if (!departmentId) departmentId = currentEmp.departmentId;
        }

        if (!targetEmpId || !noticeDate || !resignationDate) {
            return res.status(400).json({ message: 'Employee, notice date, and resignation date are required' });
        }

        const employee = await prisma.employee.findFirst({
            where: {
                id: targetEmpId,
                user: { companyId, ...NON_ADMIN_USER_FILTER }
            }
        });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const notice = new Date(noticeDate);
        const resignation = new Date(resignationDate);

        const result = await prisma.$transaction(async (tx) => {
            const resRecord = await tx.resignation.create({
                data: {
                    companyId,
                    employeeId: employee.id,
                    departmentId: departmentId ? parseInt(departmentId, 10) : employee.departmentId,
                    noticeDate: notice,
                    resignationDate: resignation,
                    reason: reason || null,
                    status: 'PENDING'
                },
                include: {
                    employee: true,
                    department: true
                }
            });

            await tx.employee.update({
                where: { id: employee.id },
                data: {
                    noticeStartDate: notice,
                    noticeEndDate: resignation,
                    noticeStatus: 'SERVING',
                    exitType: 'RESIGNATION'
                }
            });

            return resRecord;
        });

        notifyResignation({
            companyId,
            senderUserId: req.user?.id,
            resignationRecord: result
        }).catch(e => console.warn('[lifecycleController] Resignation notification error:', e.message));

        return res.status(201).json({ message: 'Resignation created successfully', resignation: result });
    } catch (error) {
        console.error('Error creating resignation:', error);
        return res.status(500).json({ message: 'Failed to create resignation', error: error.message });
    }
}

async function updateResignation(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot update resignation records.' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const { departmentId, noticeDate, resignationDate, reason, status } = req.body;

        const existing = await prisma.resignation.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(404).json({ message: 'Resignation not found' });

        const updateData = {};
        if (departmentId) updateData.departmentId = parseInt(departmentId, 10);
        if (noticeDate) updateData.noticeDate = new Date(noticeDate);
        if (resignationDate) updateData.resignationDate = new Date(resignationDate);
        if (reason !== undefined) updateData.reason = reason;
        if (status) {
            updateData.status = status;
            if (status === 'APPROVED') {
                updateData.approvedById = req.user?.id || null;
                updateData.approvedAt = new Date();
            }
        }

        const updated = await prisma.resignation.update({
            where: { id },
            data: updateData,
            include: {
                employee: true,
                department: true
            }
        });

        if (resignationDate || status) {
            const empUpdate = {};
            if (resignationDate) empUpdate.noticeEndDate = new Date(resignationDate);
            if (status === 'APPROVED') {
                empUpdate.noticeStatus = 'COMPLETED';
                empUpdate.exitDate = updated.resignationDate;
            }
            await prisma.employee.update({
                where: { id: existing.employeeId },
                data: empUpdate
            });
        }

        return res.json({ message: 'Resignation updated successfully', resignation: updated });
    } catch (error) {
        console.error('Error updating resignation:', error);
        return res.status(500).json({ message: 'Failed to update resignation', error: error.message });
    }
}

async function deleteResignation(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot delete resignation records.' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.resignation.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(404).json({ message: 'Resignation not found' });

        await prisma.resignation.delete({ where: { id } });
        return res.json({ message: 'Resignation deleted successfully' });
    } catch (error) {
        console.error('Error deleting resignation:', error);
        return res.status(500).json({ message: 'Failed to delete resignation', error: error.message });
    }
}

// ========================================================
// 5. TERMINATIONS
// ========================================================
async function getTerminations(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const where = {
            companyId,
            employee: { user: { ...NON_ADMIN_USER_FILTER } }
        };

        // If employee, only see own terminations
        if (req.user?.role === 'EMPLOYEE') {
            where.employee.userId = req.user.id;
        }

        const terminations = await prisma.termination.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true
                    }
                },
                department: { select: { id: true, name: true } }
            },
            orderBy: { noticeDate: 'desc' }
        });

        const formatted = terminations.map(t => ({
            id: t.id,
            employeeId: t.employeeId,
            employeeName: t.employee ? `${t.employee.firstName} ${t.employee.lastName}`.trim() : 'Unknown',
            employeeCode: t.employee?.employeeCode || '',
            profilePhotoUrl: formatPhotoUrl(t.employee?.profilePhotoUrl),
            departmentId: t.departmentId,
            department: t.department?.name || 'General',
            terminationType: t.terminationType || 'Other',
            noticeDate: t.noticeDate ? t.noticeDate.toISOString().split('T')[0] : null,
            terminationDate: t.terminationDate ? t.terminationDate.toISOString().split('T')[0] : null,
            reason: t.reason || '',
            status: t.status || 'PENDING'
        }));

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getTerminations:', error);
        return res.status(500).json({ message: 'Failed to fetch terminations', error: error.message });
    }
}

async function createTermination(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot create termination records.' });
        }

        const companyId = getCompanyId(req);
        const { employeeId, departmentId, terminationType, noticeDate, terminationDate, reason } = req.body;

        if (!employeeId || !terminationType || !noticeDate || !terminationDate) {
            return res.status(400).json({ message: 'Employee, termination type, notice date, and termination date are required' });
        }

        const employee = await prisma.employee.findFirst({
            where: {
                id: parseInt(employeeId, 10),
                user: { companyId, ...NON_ADMIN_USER_FILTER }
            }
        });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const notice = new Date(noticeDate);
        const term = new Date(terminationDate);

        const result = await prisma.$transaction(async (tx) => {
            const termRecord = await tx.termination.create({
                data: {
                    companyId,
                    employeeId: employee.id,
                    departmentId: departmentId ? parseInt(departmentId, 10) : employee.departmentId,
                    terminationType,
                    noticeDate: notice,
                    terminationDate: term,
                    reason: reason || null,
                    status: 'PENDING'
                },
                include: {
                    employee: true,
                    department: true
                }
            });

            await tx.employee.update({
                where: { id: employee.id },
                data: {
                    noticeStartDate: notice,
                    noticeEndDate: term,
                    noticeStatus: 'SERVING',
                    exitType: 'TERMINATION'
                }
            });

            return termRecord;
        });

        notifyTermination({
            companyId,
            senderUserId: req.user?.id,
            terminationRecord: result
        }).catch(e => console.warn('[lifecycleController] Termination notification error:', e.message));

        return res.status(201).json({ message: 'Termination created successfully', termination: result });
    } catch (error) {
        console.error('Error creating termination:', error);
        return res.status(500).json({ message: 'Failed to create termination', error: error.message });
    }
}

async function updateTermination(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot update termination records.' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const { departmentId, terminationType, noticeDate, terminationDate, reason, status } = req.body;

        const existing = await prisma.termination.findFirst({
            where: { id, companyId },
            include: { employee: true }
        });
        if (!existing) return res.status(404).json({ message: 'Termination not found' });

        const updateData = {};
        if (departmentId) updateData.departmentId = parseInt(departmentId, 10);
        if (terminationType) updateData.terminationType = terminationType;
        if (noticeDate) updateData.noticeDate = new Date(noticeDate);
        if (terminationDate) updateData.terminationDate = new Date(terminationDate);
        if (reason !== undefined) updateData.reason = reason;
        if (status) {
            updateData.status = status;
            if (status === 'APPROVED') {
                updateData.approvedById = req.user?.id || null;
                updateData.approvedAt = new Date();
            }
        }

        const updated = await prisma.termination.update({
            where: { id },
            data: updateData,
            include: {
                employee: true,
                department: true
            }
        });

        if (status === 'APPROVED') {
            await prisma.employee.update({
                where: { id: existing.employeeId },
                data: {
                    exitDate: updated.terminationDate,
                    exitType: 'TERMINATION',
                    noticeStatus: 'COMPLETED'
                }
            });

            if (existing.employee?.userId) {
                await prisma.user.update({
                    where: { id: existing.employee.userId },
                    data: { accountStatus: 'DEACTIVATED' }
                });
            }
        }

        return res.json({ message: 'Termination updated successfully', termination: updated });
    } catch (error) {
        console.error('Error updating termination:', error);
        return res.status(500).json({ message: 'Failed to update termination', error: error.message });
    }
}

async function deleteTermination(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot delete termination records.' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.termination.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(404).json({ message: 'Termination not found' });

        await prisma.termination.delete({ where: { id } });
        return res.json({ message: 'Termination deleted successfully' });
    } catch (error) {
        console.error('Error deleting termination:', error);
        return res.status(500).json({ message: 'Failed to delete termination', error: error.message });
    }
}

module.exports = {
    getLifecycleMetadata,
    // Probation
    getProbations,
    updateProbationStatus,
    removeEmployeeProbation,
    // Notice Period
    getNoticePeriods,
    startNoticePeriod,
    // Promotion
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    // Resignation
    getResignations,
    createResignation,
    updateResignation,
    deleteResignation,
    // Termination
    getTerminations,
    createTermination,
    updateTermination,
    deleteTermination
};
