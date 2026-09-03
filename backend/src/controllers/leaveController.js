// backend/src/controllers/leaveController.js
const prisma = require('../config/prisma');

// ── GET LEAVE TYPES FOR COMPANY ──────────────────────────────
async function getLeaveTypes(req, res) {
    try {
        const companyId = req.user.companyId;
        const leaveTypes = await prisma.leaveType.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });
        res.json(leaveTypes);
    } catch (error) {
        console.error('Error fetching leave types:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── CREATE LEAVE TYPE (HR) ──────────────────────────────────
async function createLeaveType(req, res) {
    try {
        const companyId = req.user.companyId;
        const { name, totalDaysPerYear, isPaid } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Leave type name is required' });
        }

        const leaveType = await prisma.leaveType.create({
            data: {
                companyId,
                name,
                totalDaysPerYear: totalDaysPerYear ? parseFloat(totalDaysPerYear) : 12,
                isPaid: isPaid !== undefined ? Boolean(isPaid) : true
            }
        });

        res.status(201).json(leaveType);
    } catch (error) {
        console.error('Error creating leave type:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── GET LEAVE REQUESTS (Filtered for HR vs Employee) ────────
async function getLeaveRequests(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const role = req.user.role;

        let whereClause = {
            employee: {
                user: { companyId }
            }
        };

        // Employees only see their own requests unless HR/MANAGER/SUPER_ADMIN, 
        // OR if anyone explicitly requests only their own with ?mine=true
        if (role === 'EMPLOYEE' || req.query.mine === 'true') {
            const employee = await prisma.employee.findUnique({ where: { userId } });
            if (!employee) {
                // Return empty list instead of 404 for 'My Leaves' if no profile exists yet
                return res.json([]);
            }
            whereClause.employeeId = employee.id;
        } else if (role === 'MANAGER') {
            const managerEmployee = await prisma.employee.findUnique({ where: { userId } });
            if (!managerEmployee) {
                return res.json([]);
            }
            whereClause.employee.reportingManagerId = managerEmployee.id;
        }

        const leaveRequests = await prisma.leaveRequest.findMany({
            where: whereClause,
            include: {
                employee: {
                    include: {
                        user: true,
                        department: true,
                        designation: true
                    }
                },
                leaveType: true
            },
            orderBy: { appliedAt: 'desc' }
        });

        res.json(leaveRequests);
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── SUBMIT LEAVE REQUEST (Employee) ─────────────────────────
async function applyLeave(req, res) {
    try {
        const userId = req.user.id;
        const { leaveTypeId, startDate, endDate, reason, employeeId, leaveSession } = req.body;

        if (!leaveTypeId || !startDate || !endDate) {
            return res.status(400).json({ message: 'Leave type, start date, and end date are required' });
        }

        let targetEmployeeId;
        if (employeeId) {
            // HR/Admin applying on behalf of employee
            if (req.user.role !== 'HR' && req.user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: 'Only HR or Admins can apply leave for other employees' });
            }
            targetEmployeeId = parseInt(employeeId, 10);
        } else {
            // Employee applying for themselves
            let employee = await prisma.employee.findUnique({ where: { userId } });
            
            // Auto-create employee profile for HR/Admin if it doesn't exist yet
            if (!employee && (req.user.role === 'HR' || req.user.role === 'SUPER_ADMIN')) {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                employee = await prisma.employee.create({
                    data: {
                        userId: user.id,
                        employeeCode: `EMP-${user.id}`,
                        firstName: user.name?.split(' ')[0] || 'Admin',
                        lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
                        dateOfJoining: new Date(),
                        employmentType: 'FULL_TIME'
                    }
                });
            } else if (!employee) {
                return res.status(404).json({ message: 'Employee profile not found' });
            }
            targetEmployeeId = employee.id;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        let totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // For half-day leaves, count as 0.5 days
        const session = leaveSession || 'FULL_DAY';
        if (session === 'FIRST_HALF' || session === 'SECOND_HALF') {
            totalDays = 0.5;
        }

        if (totalDays <= 0) {
            return res.status(400).json({ message: 'End date must be after or equal to start date' });
        }

        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                employeeId: targetEmployeeId,
                leaveTypeId: parseInt(leaveTypeId, 10),
                startDate: start,
                endDate: end,
                totalDays: totalDays,
                leaveSession: session,
                reason,
                status: 'PENDING'
            },
            include: {
                leaveType: true,
                employee: true
            }
        });

        res.status(201).json(leaveRequest);
    } catch (error) {
        console.error('Error applying for leave:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── UPDATE LEAVE REQUEST STATUS (HR/Manager) ────────────────
async function updateLeaveStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body; // status: APPROVED or REJECTED
        const companyId = req.user.companyId;
        const userId = req.user.id;

        if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const existingRequest = await prisma.leaveRequest.findUnique({
            where: { id: parseInt(id, 10) },
            include: { employee: { include: { user: true } }, leaveType: true }
        });

        if (!existingRequest || existingRequest.employee.user.companyId !== companyId) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Manager guard: can only approve/reject leaves for their direct reports
        if (req.user.role === 'MANAGER') {
            const managerEmployee = await prisma.employee.findUnique({ where: { userId } });
            if (!managerEmployee || existingRequest.employee.reportingManagerId !== managerEmployee.id) {
                return res.status(403).json({ message: 'You can only manage leaves of your direct reports' });
            }
        }

        const reviewer = await prisma.employee.findUnique({ where: { userId } });

        const updatedRequest = await prisma.leaveRequest.update({
            where: { id: parseInt(id, 10) },
            data: {
                status,
                remarks,
                reviewedById: reviewer ? reviewer.id : null,
                reviewedAt: new Date()
            },
            include: {
                employee: { include: { user: true } },
                leaveType: true
            }
        });

        // Update Leave Balance if approved
        if (status === 'APPROVED') {
            const currentYear = new Date().getFullYear();
            const existingBalance = await prisma.leaveBalance.findFirst({
                where: {
                    employeeId: existingRequest.employeeId,
                    leaveTypeId: existingRequest.leaveTypeId,
                    year: currentYear
                }
            });

            if (existingBalance) {
                await prisma.leaveBalance.update({
                    where: { id: existingBalance.id },
                    data: {
                        usedDays: { increment: existingRequest.totalDays }
                    }
                });
            } else {
                const policy = await prisma.leavePolicy.findFirst({
                    where: {
                        leaveTypeId: existingRequest.leaveTypeId,
                        employees: {
                            some: { id: existingRequest.employeeId }
                        }
                    }
                });

                await prisma.leaveBalance.create({
                    data: {
                        employeeId: existingRequest.employeeId,
                        leaveTypeId: existingRequest.leaveTypeId,
                        year: currentYear,
                        totalDays: policy ? policy.days : existingRequest.leaveType.totalDaysPerYear,
                        usedDays: existingRequest.totalDays
                    }
                });
            }
        }

        res.json(updatedRequest);
    } catch (error) {
        console.error('Error updating leave status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── GET LEAVE BALANCES FOR EMPLOYEE ─────────────────────────
async function getLeaveBalances(req, res) {
    try {
        const userId = req.user.id;
        const currentYear = new Date().getFullYear();

        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const leaveTypes = await prisma.leaveType.findMany({
            where: { companyId: req.user.companyId }
        });

        const balances = await Promise.all(leaveTypes.map(async (lt) => {
            const bal = await prisma.leaveBalance.findFirst({
                where: {
                    employeeId: employee.id,
                    leaveTypeId: lt.id,
                    year: currentYear
                }
            });

            // Find if there is an active custom policy override for this employee
            const policy = await prisma.leavePolicy.findFirst({
                where: {
                    leaveTypeId: lt.id,
                    employees: {
                        some: { id: employee.id }
                    }
                }
            });

            // Dynamically calculate actual used days from approved leaves this year
            const approvedLeaves = await prisma.leaveRequest.aggregate({
                _sum: { totalDays: true },
                where: {
                    employeeId: employee.id,
                    leaveTypeId: lt.id,
                    status: 'APPROVED',
                    startDate: {
                        gte: new Date(`${currentYear}-01-01T00:00:00Z`),
                        lt: new Date(`${currentYear + 1}-01-01T00:00:00Z`)
                    }
                }
            });

            const total = policy ? Number(policy.days) : Number(lt.totalDaysPerYear);
            const dynamicallyCalculatedUsed = approvedLeaves._sum.totalDays ? Number(approvedLeaves._sum.totalDays) : 0;
            
            // Sync database if it was out of sync
            if (bal && bal.usedDays !== dynamicallyCalculatedUsed) {
                await prisma.leaveBalance.update({
                    where: { id: bal.id },
                    data: { usedDays: dynamicallyCalculatedUsed }
                }).catch(e => console.error("Failed to sync leave balance", e));
            }

            const used = dynamicallyCalculatedUsed;

            return {
                leaveTypeId: lt.id,
                leaveTypeName: lt.name,
                isPaid: lt.isPaid,
                totalDays: total,
                usedDays: used,
                remainingDays: Math.max(0, total - used)
            };
        }));

        res.json(balances);
    } catch (error) {
        console.error('Error fetching leave balances:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── UPDATE LEAVE TYPE (HR) ──────────────────────────────────
async function updateLeaveType(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const { name, totalDaysPerYear, isPaid } = req.body;

        const existing = await prisma.leaveType.findFirst({
            where: { id: parseInt(id, 10), companyId }
        });

        if (!existing) {
            return res.status(404).json({ message: 'Leave type not found' });
        }

        const updated = await prisma.leaveType.update({
            where: { id: existing.id },
            data: {
                name: name !== undefined ? name : existing.name,
                totalDaysPerYear: totalDaysPerYear !== undefined ? parseFloat(totalDaysPerYear) : existing.totalDaysPerYear,
                isPaid: isPaid !== undefined ? Boolean(isPaid) : existing.isPaid
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating leave type:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── DELETE LEAVE TYPE (HR) ──────────────────────────────────
async function deleteLeaveType(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;

        const existing = await prisma.leaveType.findFirst({
            where: { id: parseInt(id, 10), companyId }
        });

        if (!existing) {
            return res.status(404).json({ message: 'Leave type not found' });
        }

        // Check if there are any associated leave requests or balances
        const requestCount = await prisma.leaveRequest.count({ where: { leaveTypeId: existing.id } });
        const balanceCount = await prisma.leaveBalance.count({ where: { leaveTypeId: existing.id } });

        if (requestCount > 0 || balanceCount > 0) {
            return res.status(400).json({ message: 'This leave type is in use by employees and cannot be deleted.' });
        }

        await prisma.leaveType.delete({
            where: { id: existing.id }
        });

        res.json({ message: 'Leave type deleted successfully' });
    } catch (error) {
        console.error('Error deleting leave type:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── GET LEAVE POLICIES (HR) ─────────────────────────────────
async function getLeavePolicies(req, res) {
    try {
        const companyId = req.user.companyId;
        const policies = await prisma.leavePolicy.findMany({
            where: { companyId },
            include: {
                leaveType: true,
                employees: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(policies);
    } catch (error) {
        console.error('Error fetching policies:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── CREATE LEAVE POLICY (HR) ────────────────────────────────
async function createLeavePolicy(req, res) {
    try {
        const companyId = req.user.companyId;
        const { name, leaveTypeId, days, description, employeeIds } = req.body;

        if (!name || !leaveTypeId || days === undefined) {
            return res.status(400).json({ message: 'Name, leaveTypeId, and days are required' });
        }

        const policy = await prisma.leavePolicy.create({
            data: {
                companyId,
                leaveTypeId: parseInt(leaveTypeId, 10),
                name,
                description,
                days: parseFloat(days),
                employees: employeeIds && Array.isArray(employeeIds)
                    ? { connect: employeeIds.map((id) => ({ id: parseInt(id, 10) })) }
                    : undefined
            },
            include: {
                leaveType: true,
                employees: true
            }
        });

        res.status(201).json(policy);
    } catch (error) {
        console.error('Error creating policy:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── UPDATE LEAVE POLICY (HR) ────────────────────────────────
async function updateLeavePolicy(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const { name, days, description, employeeIds } = req.body;

        const existing = await prisma.leavePolicy.findFirst({
            where: { id: parseInt(id, 10), companyId }
        });

        if (!existing) {
            return res.status(404).json({ message: 'Leave policy not found' });
        }

        // Fetch currently linked employees to disconnect them
        const policyWithEmployees = await prisma.leavePolicy.findUnique({
            where: { id: existing.id },
            include: { employees: true }
        });

        const currentEmployeeIds = policyWithEmployees?.employees.map(e => e.id) || [];

        const updated = await prisma.leavePolicy.update({
            where: { id: existing.id },
            data: {
                name: name !== undefined ? name : existing.name,
                days: days !== undefined ? parseFloat(days) : existing.days,
                description: description !== undefined ? description : existing.description,
                employees: employeeIds && Array.isArray(employeeIds)
                    ? {
                        disconnect: currentEmployeeIds.map(id => ({ id })),
                        connect: employeeIds.map((id) => ({ id: parseInt(id, 10) }))
                      }
                    : undefined
            },
            include: {
                leaveType: true,
                employees: true
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating policy:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── DELETE LEAVE POLICY (HR) ────────────────────────────────
async function deleteLeavePolicy(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;

        const existing = await prisma.leavePolicy.findFirst({
            where: { id: parseInt(id, 10), companyId }
        });

        if (!existing) {
            return res.status(404).json({ message: 'Leave policy not found' });
        }

        await prisma.leavePolicy.delete({
            where: { id: existing.id }
        });

        res.json({ message: 'Leave policy deleted successfully' });
    } catch (error) {
        console.error('Error deleting policy:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getLeaveAdminSummary(req, res) {
    try {
        const companyId = parseInt(req.user.companyId, 10);

        // 1. Total active employees in the company
        const totalEmployees = await prisma.employee.count({
            where: { user: { companyId } }
        });

        // 2. Count of employees present today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const presentToday = await prisma.attendanceRecord.count({
            where: {
                employee: { user: { companyId } },
                date: { gte: todayStart, lte: todayEnd }
            }
        });

        // 3. Count of pending requests
        const pendingCount = await prisma.leaveRequest.count({
            where: {
                status: 'PENDING',
                employee: { user: { companyId } }
            }
        });

        // 4. Count of approved leaves active today
        const activeLeavesToday = await prisma.leaveRequest.findMany({
            where: {
                status: 'APPROVED',
                employee: { user: { companyId } },
                startDate: { lte: todayEnd },
                endDate: { gte: todayStart }
            },
            include: {
                leaveType: true
            }
        });

        let plannedToday = 0;
        let unplannedToday = 0;

        activeLeavesToday.forEach(request => {
            const typeName = (request.leaveType?.name || '').toLowerCase();
            if (typeName.includes('sick') || typeName.includes('unplanned') || typeName.includes('emergency')) {
                unplannedToday++;
            } else {
                plannedToday++;
            }
        });

        res.json({
            totalEmployees,
            presentToday,
            pendingCount,
            plannedToday,
            unplannedToday
        });

    } catch (error) {
        console.error('Error fetching admin leave summary:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

<<<<<<< HEAD
async function updateLeaveRequest(req, res) {
    try {
        const userId = req.user.id;
        const requestId = parseInt(req.params.id, 10);
        const { leaveTypeId, startDate, endDate, reason, leaveSession } = req.body;

        // Find the employee
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        // Find the leave request and verify ownership
        const existing = await prisma.leaveRequest.findUnique({ where: { id: requestId } });
        if (!existing) {
            return res.status(404).json({ message: 'Leave request not found' });
        }
        if (existing.employeeId !== employee.id) {
            return res.status(403).json({ message: 'You can only edit your own leave requests' });
        }
        if (existing.status !== 'PENDING') {
            return res.status(400).json({ message: 'Only pending leave requests can be edited' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        let totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // For half-day leaves, count as 0.5 days
        const session = leaveSession || 'FULL_DAY';
        if (session === 'FIRST_HALF' || session === 'SECOND_HALF') {
            totalDays = 0.5;
        }

        const updated = await prisma.leaveRequest.update({
            where: { id: requestId },
            data: {
                leaveTypeId: parseInt(leaveTypeId, 10),
                startDate: start,
                endDate: end,
                totalDays,
                leaveSession: session,
                reason
            },
            include: { leaveType: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update Leave Request Error:', error);
=======
// ── GET ON LEAVE TODAY (For Dashboard) ──────────────────────
async function getOnLeaveToday(req, res) {
    try {
        const companyId = req.user.companyId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        const onLeave = await prisma.leaveRequest.findMany({
            where: {
                employee: { user: { companyId } },
                status: 'APPROVED',
                startDate: { lte: endOfToday },
                endDate: { gte: today }
            },
            include: {
                employee: {
                    include: { user: true }
                },
                leaveType: true
            }
        });

        res.json(onLeave);
    } catch (error) {
        console.error('Error fetching on leave today:', error);
>>>>>>> develop
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getLeaveTypes,
    createLeaveType,
    getLeaveRequests,
    applyLeave,
    updateLeaveRequest,
    updateLeaveStatus,
    getLeaveBalances,
    updateLeaveType,
    deleteLeaveType,
    getLeavePolicies,
    createLeavePolicy,
    updateLeavePolicy,
    deleteLeavePolicy,
    getLeaveAdminSummary,
    getOnLeaveToday
};
