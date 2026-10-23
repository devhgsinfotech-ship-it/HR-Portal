// backend/src/controllers/shiftArrangementController.js
const prisma = require('../config/prisma');
const {
    notifyWfhApplied,
    notifyWfhStatusChanged,
    notifyShiftSwapRequested,
    notifyShiftSwapStatusChanged,
    notifyOvertimeSubmitted,
    notifyOvertimeStatusChanged,
    notifyShiftScheduleAssigned
} = require('../utils/workArrangementNotifier');

function getCompanyId(req) {
    return req.user?.companyId;
}

function formatPhotoUrl(photoPath) {
    if (!photoPath) return null;
    return photoPath;
}

const NON_ADMIN_USER_FILTER = {
    role: { notIn: ['SUPER_ADMIN', 'COMPANY_ADMIN'] }
};

// Default shifts to auto-seed if company has no shift policies
const DEFAULT_SHIFTS = [
    { name: 'General Shift', startTime: '09:00', endTime: '18:00', gracePeriod: 15 },
    { name: 'Morning Shift', startTime: '06:00', endTime: '15:00', gracePeriod: 15 },
    { name: 'Evening Shift', startTime: '14:00', endTime: '23:00', gracePeriod: 15 },
    { name: 'Night Shift', startTime: '22:00', endTime: '07:00', gracePeriod: 15 }
];

async function ensureDefaultShifts(companyId) {
    if (!companyId) return;
    const count = await prisma.shiftPolicy.count({ where: { companyId } });
    if (count === 0) {
        try {
            await prisma.shiftPolicy.createMany({
                data: DEFAULT_SHIFTS.map(s => ({ ...s, companyId })),
                skipDuplicates: true
            });
        } catch (e) {
            // Handled gracefully in case concurrent requests try to seed simultaneously
        }
    }
}

// ========================================================
// 0. METADATA
// ========================================================
async function getShiftMetadata(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultShifts(companyId);

        const empWhere = {
            user: { companyId, ...NON_ADMIN_USER_FILTER }
        };

        if (req.user?.role === 'EMPLOYEE') {
            empWhere.userId = req.user.id;
        }

        const [employees, allEmployeesForSwap, departments, designations, shiftPolicies] = await Promise.all([
            prisma.employee.findMany({
                where: empWhere,
                select: {
                    id: true,
                    userId: true,
                    employeeCode: true,
                    firstName: true,
                    lastName: true,
                    profilePhotoUrl: true,
                    departmentId: true,
                    designationId: true,
                    shiftPolicyId: true,
                    department: { select: { name: true } },
                    designation: { select: { name: true } },
                    shiftPolicy: { select: { id: true, name: true, startTime: true, endTime: true } }
                },
                orderBy: { firstName: 'asc' }
            }),
            prisma.employee.findMany({
                where: { user: { companyId, ...NON_ADMIN_USER_FILTER } },
                select: {
                    id: true,
                    userId: true,
                    employeeCode: true,
                    firstName: true,
                    lastName: true,
                    departmentId: true,
                    shiftPolicyId: true,
                    shiftPolicy: { select: { id: true, name: true } },
                    shiftSchedules: {
                        select: {
                            id: true,
                            shiftPolicyId: true,
                            startDate: true,
                            endDate: true,
                            shiftPolicy: { select: { id: true, name: true, startTime: true, endTime: true } }
                        }
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
            }),
            prisma.shiftPolicy.findMany({
                where: { companyId },
                select: { id: true, name: true, startTime: true, endTime: true, gracePeriod: true },
                orderBy: { name: 'asc' }
            })
        ]);

        const formattedEmps = employees.map(e => ({
            id: e.id,
            userId: e.userId,
            employeeCode: e.employeeCode,
            name: `${e.firstName} ${e.lastName}`.trim(),
            profilePhotoUrl: formatPhotoUrl(e.profilePhotoUrl),
            departmentId: e.departmentId,
            departmentName: e.department?.name || 'General',
            designationId: e.designationId,
            designationName: e.designation?.name || 'Employee',
            shiftPolicyId: e.shiftPolicyId,
            currentShift: e.shiftPolicy?.name || 'General Shift'
        }));

        const swapCandidates = allEmployeesForSwap.map(e => ({
            id: e.id,
            userId: e.userId,
            employeeCode: e.employeeCode,
            name: `${e.firstName} ${e.lastName}`.trim(),
            departmentId: e.departmentId,
            currentShiftId: e.shiftPolicyId,
            currentShiftName: e.shiftPolicy?.name || 'General Shift',
            shiftSchedules: (e.shiftSchedules || []).map(s => ({
                id: s.id,
                shiftPolicyId: s.shiftPolicyId,
                shiftName: s.shiftPolicy?.name || 'General Shift',
                startDate: s.startDate ? s.startDate.toISOString().split('T')[0] : null,
                endDate: s.endDate ? s.endDate.toISOString().split('T')[0] : null
            }))
        }));

        return res.json({
            employees: formattedEmps,
            allEmployees: swapCandidates,
            departments,
            designations,
            shiftPolicies
        });
    } catch (error) {
        console.error('Error in getShiftMetadata:', error);
        return res.status(500).json({ message: 'Failed to fetch shift metadata', error: error.message });
    }
}

// ========================================================
// 1. SHIFT POLICIES CRUD
// ========================================================
async function getShiftPolicies(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultShifts(companyId);

        const policies = await prisma.shiftPolicy.findMany({
            where: { companyId },
            include: {
                _count: { select: { employees: true, shiftSchedules: true } }
            },
            orderBy: { name: 'asc' }
        });

        return res.json(policies);
    } catch (error) {
        console.error('Error in getShiftPolicies:', error);
        return res.status(500).json({ message: 'Failed to fetch shift policies', error: error.message });
    }
}

async function createShiftPolicy(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const companyId = getCompanyId(req);
        const { name, startTime, endTime, gracePeriod } = req.body;

        if (!name || !startTime || !endTime) {
            return res.status(400).json({ message: 'Name, start time, and end time are required' });
        }

        const policy = await prisma.shiftPolicy.create({
            data: {
                companyId,
                name: name.trim(),
                startTime,
                endTime,
                gracePeriod: gracePeriod ? parseInt(gracePeriod, 10) : 15
            }
        });

        return res.status(201).json({ message: 'Shift policy created', policy });
    } catch (error) {
        console.error('Error creating shift policy:', error);
        return res.status(500).json({ message: 'Failed to create shift policy', error: error.message });
    }
}

async function updateShiftPolicy(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const { name, startTime, endTime, gracePeriod } = req.body;

        const existing = await prisma.shiftPolicy.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ message: 'Shift policy not found' });

        const updated = await prisma.shiftPolicy.update({
            where: { id },
            data: {
                name: name ? name.trim() : existing.name,
                startTime: startTime || existing.startTime,
                endTime: endTime || existing.endTime,
                gracePeriod: gracePeriod !== undefined ? parseInt(gracePeriod, 10) : existing.gracePeriod
            }
        });

        return res.json({ message: 'Shift policy updated', policy: updated });
    } catch (error) {
        console.error('Error updating shift policy:', error);
        return res.status(500).json({ message: 'Failed to update shift policy', error: error.message });
    }
}

async function deleteShiftPolicy(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.shiftPolicy.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ message: 'Shift policy not found' });

        await prisma.shiftPolicy.delete({ where: { id } });
        return res.json({ message: 'Shift policy deleted' });
    } catch (error) {
        console.error('Error deleting shift policy:', error);
        return res.status(500).json({ message: 'Failed to delete shift policy', error: error.message });
    }
}

// ========================================================
// 2. SHIFT SCHEDULE / TIMING
// ========================================================
async function getShiftSchedules(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultShifts(companyId);

        const defaultShift = await prisma.shiftPolicy.findFirst({
            where: { companyId },
            orderBy: { id: 'asc' }
        });

        const empWhere = {
            user: { companyId, ...NON_ADMIN_USER_FILTER }
        };

        if (req.user?.role === 'EMPLOYEE') {
            empWhere.userId = req.user.id;
        }

        const employees = await prisma.employee.findMany({
            where: empWhere,
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, name: true } },
                shiftPolicy: true,
                shiftSchedules: {
                    include: { shiftPolicy: true },
                    orderBy: { startDate: 'desc' },
                    take: 5
                }
            },
            orderBy: { firstName: 'asc' }
        });

        const records = employees.map(emp => {
            const activeSchedule = emp.shiftSchedules?.[0];
            const activePolicy = activeSchedule?.shiftPolicy || emp.shiftPolicy || defaultShift;

            return {
                id: activeSchedule?.id || emp.id,
                scheduleId: activeSchedule?.id || null,
                employeeId: emp.id,
                employeeCode: emp.employeeCode,
                name: `${emp.firstName} ${emp.lastName}`.trim(),
                profilePhotoUrl: formatPhotoUrl(emp.profilePhotoUrl),
                departmentId: emp.departmentId,
                department: emp.department?.name || 'General',
                designation: emp.designation?.name || 'Employee',
                shiftPolicyId: activePolicy?.id || null,
                shiftName: activePolicy?.name || 'General Shift',
                startTime: activePolicy?.startTime || '09:00',
                endTime: activePolicy?.endTime || '18:00',
                gracePeriod: activePolicy?.gracePeriod || 15,
                startDate: activeSchedule?.startDate ? activeSchedule.startDate.toISOString().split('T')[0] : null,
                endDate: activeSchedule?.endDate ? activeSchedule.endDate.toISOString().split('T')[0] : null,
                notes: activeSchedule?.notes || null,
                isAssignedSchedule: !!activeSchedule
            };
        });

        return res.json(records);
    } catch (error) {
        console.error('Error in getShiftSchedules:', error);
        return res.status(500).json({ message: 'Failed to fetch shift schedules', error: error.message });
    }
}

async function createShiftSchedule(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot assign shift schedules.' });
        }

        const companyId = getCompanyId(req);
        const { employeeId, departmentId, shiftPolicyId, startDate, endDate, notes } = req.body;

        if (!shiftPolicyId || !startDate) {
            return res.status(400).json({ message: 'Shift policy and start date are required' });
        }

        const policy = await prisma.shiftPolicy.findFirst({
            where: { id: parseInt(shiftPolicyId, 10), companyId }
        });
        if (!policy) return res.status(404).json({ message: 'Shift policy not found' });

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;

        // Assign to all employees in department or single employee
        let targetEmpIds = [];
        if (departmentId) {
            const empsInDept = await prisma.employee.findMany({
                where: {
                    departmentId: parseInt(departmentId, 10),
                    user: { companyId, ...NON_ADMIN_USER_FILTER }
                },
                select: { id: true }
            });
            targetEmpIds = empsInDept.map(e => e.id);
        } else if (employeeId) {
            targetEmpIds = [parseInt(employeeId, 10)];
        } else {
            return res.status(400).json({ message: 'Either an employee or department must be selected' });
        }

        if (targetEmpIds.length === 0) {
            return res.status(404).json({ message: 'No eligible employees found for this assignment' });
        }

        await prisma.$transaction(async (tx) => {
            for (const empId of targetEmpIds) {
                await tx.shiftSchedule.create({
                    data: {
                        companyId,
                        employeeId: empId,
                        shiftPolicyId: policy.id,
                        startDate: start,
                        endDate: end,
                        notes: notes || null
                    }
                });

                // Also update employee's default shiftPolicyId
                await tx.employee.update({
                    where: { id: empId },
                    data: { shiftPolicyId: policy.id }
                });
            }
        });

        // Notify affected employee(s) of their shift assignment
        for (const empId of targetEmpIds) {
            notifyShiftScheduleAssigned({
                companyId,
                senderUserId: req.user?.id,
                employeeId: empId,
                shiftPolicy: policy,
                startDate: start,
                endDate: end,
                req
            }).catch(e => console.warn('[createShiftSchedule] Notification notice:', e.message));
        }

        return res.status(201).json({ message: `Shift scheduled successfully for ${targetEmpIds.length} employee(s)` });
    } catch (error) {
        console.error('Error creating shift schedule:', error);
        return res.status(500).json({ message: 'Failed to create shift schedule', error: error.message });
    }
}

async function deleteShiftSchedule(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot delete shift schedules.' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.shiftSchedule.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(404).json({ message: 'Shift schedule not found' });

        await prisma.shiftSchedule.delete({ where: { id } });
        return res.json({ message: 'Shift schedule deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift schedule:', error);
        return res.status(500).json({ message: 'Failed to delete shift schedule', error: error.message });
    }
}

// ========================================================
// 3. SHIFT SWAP REQUESTS
// ========================================================
async function getShiftSwapRequests(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const where = { companyId };

        if (req.user?.role === 'EMPLOYEE') {
            where.OR = [
                { requester: { userId: req.user.id } },
                { targetEmployee: { userId: req.user.id } }
            ];
        }

        const swaps = await prisma.shiftSwapRequest.findMany({
            where,
            include: {
                requester: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true,
                        designation: { select: { name: true } },
                        department: { select: { name: true } }
                    }
                },
                targetEmployee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true
                    }
                },
                currentShift: true,
                requestedShift: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = swaps.map(s => ({
            id: s.id,
            requesterId: s.requesterId,
            name: `${s.requester.firstName} ${s.requester.lastName}`.trim(),
            employeeCode: s.requester.employeeCode,
            profilePhotoUrl: formatPhotoUrl(s.requester.profilePhotoUrl),
            designation: s.requester.designation?.name || 'Employee',
            department: s.requester.department?.name || 'General',
            targetEmployeeId: s.targetEmployeeId,
            targetEmployeeName: s.targetEmployee ? `${s.targetEmployee.firstName} ${s.targetEmployee.lastName}`.trim() : 'Open Swap',
            shiftDate: s.shiftDate ? s.shiftDate.toISOString().split('T')[0] : null,
            currentShiftId: s.currentShiftId,
            currentShift: s.currentShift ? `${s.currentShift.name} (${s.currentShift.startTime} - ${s.currentShift.endTime})` : 'General Shift',
            requestedShiftId: s.requestedShiftId,
            requestedShift: s.requestedShift ? `${s.requestedShift.name} (${s.requestedShift.startTime} - ${s.requestedShift.endTime})` : 'Morning Shift',
            reason: s.reason || '',
            status: s.status || 'PENDING',
            createdAt: s.createdAt ? s.createdAt.toISOString().split('T')[0] : null
        }));

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getShiftSwapRequests:', error);
        return res.status(500).json({ message: 'Failed to fetch shift swap requests', error: error.message });
    }
}

/**
 * Helper to resolve an employee's effective shift policy on a specific date.
 * Prioritizes active date-bounded ShiftSchedule overrides, then baseline Employee.shiftPolicyId,
 * and finally falls back to company's default shift policy.
 */
async function getEmployeeShiftOnDate(employeeId, shiftDate, companyId) {
    const dateObj = new Date(shiftDate);
    dateObj.setHours(0, 0, 0, 0);

    // 1. Specific ShiftSchedule for this date
    const schedule = await prisma.shiftSchedule.findFirst({
        where: {
            companyId,
            employeeId,
            startDate: { lte: dateObj },
            OR: [
                { endDate: null },
                { endDate: { gte: dateObj } }
            ]
        },
        include: { shiftPolicy: true },
        orderBy: { startDate: 'desc' }
    });

    if (schedule && schedule.shiftPolicy) {
        return {
            shiftId: schedule.shiftPolicy.id,
            shiftName: schedule.shiftPolicy.name,
            startTime: schedule.shiftPolicy.startTime,
            endTime: schedule.shiftPolicy.endTime,
            source: 'SCHEDULE'
        };
    }

    // 2. Baseline shift policy on Employee record
    const emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { shiftPolicy: true }
    });

    if (emp && emp.shiftPolicy) {
        return {
            shiftId: emp.shiftPolicy.id,
            shiftName: emp.shiftPolicy.name,
            startTime: emp.shiftPolicy.startTime,
            endTime: emp.shiftPolicy.endTime,
            source: 'EMPLOYEE_BASELINE'
        };
    }

    // 3. Company default shift
    const defaultShift = await prisma.shiftPolicy.findFirst({
        where: { companyId },
        orderBy: { id: 'asc' }
    });

    return {
        shiftId: defaultShift?.id || null,
        shiftName: defaultShift?.name || 'General Shift',
        startTime: defaultShift?.startTime || '09:00',
        endTime: defaultShift?.endTime || '18:00',
        source: 'DEFAULT'
    };
}

/**
 * GET /api/shifts/swaps/eligible-peers
 * Returns all active colleagues in company and filters to those currently doing the desired shift on that date.
 */
async function getEligibleSwapPeers(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { shiftDate, requestedShiftId, requesterId } = req.query;

        if (!shiftDate) {
            return res.status(400).json({ message: 'shiftDate query param is required' });
        }

        let excludeEmpId = null;
        if (req.user?.role === 'EMPLOYEE') {
            const currentEmp = await prisma.employee.findUnique({
                where: { userId: req.user.id }
            });
            excludeEmpId = currentEmp?.id;
        } else if (requesterId) {
            excludeEmpId = parseInt(requesterId, 10);
        }

        let requesterShift = null;
        if (excludeEmpId) {
            requesterShift = await getEmployeeShiftOnDate(excludeEmpId, shiftDate, companyId);
        }

        const peers = await prisma.employee.findMany({
            where: {
                user: { companyId, ...NON_ADMIN_USER_FILTER },
                ...(excludeEmpId ? { id: { not: excludeEmpId } } : {})
            },
            select: {
                id: true,
                userId: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                department: { select: { name: true } },
                designation: { select: { name: true } },
                shiftPolicyId: true
            },
            orderBy: { firstName: 'asc' }
        });

        const targetShiftId = requestedShiftId ? parseInt(requestedShiftId, 10) : null;
        const peersWithShift = await Promise.all(peers.map(async (p) => {
            const shiftInfo = await getEmployeeShiftOnDate(p.id, shiftDate, companyId);
            return {
                id: p.id,
                name: `${p.firstName} ${p.lastName}`.trim(),
                employeeCode: p.employeeCode,
                department: p.department?.name || 'General',
                designation: p.designation?.name || 'Staff',
                shiftId: shiftInfo.shiftId,
                shiftName: shiftInfo.shiftName,
                startTime: shiftInfo.startTime,
                endTime: shiftInfo.endTime,
                isMatch: targetShiftId ? shiftInfo.shiftId === targetShiftId : true
            };
        }));

        const eligiblePeers = targetShiftId 
            ? peersWithShift.filter(p => p.shiftId === targetShiftId)
            : peersWithShift;

        return res.json({
            shiftDate,
            requesterShift,
            eligiblePeers,
            allPeersOnDate: peersWithShift
        });
    } catch (error) {
        console.error('Error in getEligibleSwapPeers:', error);
        return res.status(500).json({ message: 'Failed to fetch eligible swap peers', error: error.message });
    }
}

async function createShiftSwapRequest(req, res) {
    try {
        const companyId = getCompanyId(req);
        let { requesterId, targetEmployeeId, shiftDate, requestedShiftId, reason } = req.body;

        if (req.user?.role === 'EMPLOYEE') {
            const currentEmp = await prisma.employee.findUnique({
                where: { userId: req.user.id }
            });
            if (!currentEmp) return res.status(404).json({ message: 'Employee record not found' });
            requesterId = currentEmp.id;
        }

        if (!requesterId || !shiftDate || !requestedShiftId) {
            return res.status(400).json({ message: 'Requesting employee, shift date, and desired shift are required.' });
        }

        const parsedReqId = parseInt(requesterId, 10);
        const parsedShiftId = parseInt(requestedShiftId, 10);
        const parsedTargetId = targetEmployeeId ? parseInt(targetEmployeeId, 10) : null;

        // 1. Require target colleague for shift swap
        if (!parsedTargetId) {
            return res.status(400).json({
                message: 'A colleague must be selected for the shift swap. Shift swap requires another employee who is currently working the desired shift.'
            });
        }

        // 2. Cannot swap with oneself
        if (parsedReqId === parsedTargetId) {
            return res.status(400).json({ message: 'You cannot swap shifts with yourself. Please select another colleague.' });
        }

        // 3. Validate target employee exists and belongs to company
        const targetEmp = await prisma.employee.findFirst({
            where: { id: parsedTargetId, user: { companyId } },
            include: { shiftPolicy: true }
        });
        if (!targetEmp) {
            return res.status(404).json({ message: 'Target colleague not found in your company.' });
        }

        // 4. Validate requested shift policy exists
        const desiredPolicy = await prisma.shiftPolicy.findFirst({
            where: { id: parsedShiftId, companyId }
        });
        if (!desiredPolicy) {
            return res.status(404).json({ message: 'Desired shift policy not found.' });
        }

        // 5. Resolve requester's shift on shiftDate
        const reqShift = await getEmployeeShiftOnDate(parsedReqId, shiftDate, companyId);
        if (reqShift.shiftId === parsedShiftId) {
            return res.status(400).json({
                message: `You are already assigned to "${desiredPolicy.name}" on ${shiftDate}. Please choose a different shift to swap into.`
            });
        }

        // 6. RESOLVE TARGET EMPLOYEE'S SHIFT ON shiftDate & VALIDATE THEY ARE DOING DESIRED SHIFT
        const targetShift = await getEmployeeShiftOnDate(parsedTargetId, shiftDate, companyId);
        if (targetShift.shiftId !== parsedShiftId) {
            return res.status(400).json({
                message: `Validation Failed: ${targetEmp.firstName} ${targetEmp.lastName} is assigned to "${targetShift.shiftName}" on ${shiftDate}, not the desired shift ("${desiredPolicy.name}"). Shift swap can only be requested with an employee who is currently working the desired shift.`
            });
        }

        // 7. Prevent swapping if both employees are already on identical shifts
        if (reqShift.shiftId === targetShift.shiftId) {
            return res.status(400).json({
                message: `Validation Failed: Both employees are already scheduled for "${reqShift.shiftName}". There is no different shift to swap.`
            });
        }

        // 8. Prevent duplicate pending requests for the same date
        const existingPending = await prisma.shiftSwapRequest.findFirst({
            where: {
                companyId,
                requesterId: parsedReqId,
                shiftDate: new Date(shiftDate),
                status: 'PENDING'
            }
        });
        if (existingPending) {
            return res.status(400).json({
                message: 'You already have a pending shift swap request for this date. Please await approval or cancel the previous request.'
            });
        }

        // 9. Create the shift swap request with validated currentShiftId and targetEmployeeId
        const swap = await prisma.shiftSwapRequest.create({
            data: {
                companyId,
                requesterId: parsedReqId,
                targetEmployeeId: parsedTargetId,
                shiftDate: new Date(shiftDate),
                currentShiftId: reqShift.shiftId || parsedShiftId,
                requestedShiftId: parsedShiftId,
                reason: reason || null,
                status: 'PENDING'
            },
            include: {
                requester: true,
                targetEmployee: true,
                currentShift: true,
                requestedShift: true
            }
        });

        // Notify Target Colleague, HR Managers, Reporting Managers, and Team Leads
        notifyShiftSwapRequested({
            companyId,
            senderUserId: req.user?.id,
            swapRecord: swap,
            req
        }).catch(e => console.warn('[createShiftSwapRequest] Notification notice:', e.message));

        return res.status(201).json({ message: 'Shift swap request submitted successfully', swap });
    } catch (error) {
        console.error('Error creating shift swap request:', error);
        return res.status(500).json({ message: 'Failed to submit shift swap request', error: error.message });
    }
}

async function updateShiftSwapStatus(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot approve/reject shift swap requests.' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const { status, rejectionReason } = req.body;

        const existing = await prisma.shiftSwapRequest.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(404).json({ message: 'Shift swap request not found' });

        const updated = await prisma.$transaction(async (tx) => {
            const rec = await tx.shiftSwapRequest.update({
                where: { id },
                data: {
                    status: status || existing.status,
                    approvedById: status === 'APPROVED' ? req.user?.id : null,
                    approvedAt: status === 'APPROVED' ? new Date() : null,
                    rejectionReason: rejectionReason || null
                }
            });

            // If approved, create a temporary shift schedule for the requester
            if (status === 'APPROVED') {
                await tx.shiftSchedule.create({
                    data: {
                        companyId,
                        employeeId: existing.requesterId,
                        shiftPolicyId: existing.requestedShiftId,
                        startDate: existing.shiftDate,
                        endDate: existing.shiftDate,
                        notes: `Shift Swap approved (ID #${existing.id})`
                    }
                });

                // If a peer target was specified, assign the peer to the requester's current shift
                if (existing.targetEmployeeId) {
                    await tx.shiftSchedule.create({
                        data: {
                            companyId,
                            employeeId: existing.targetEmployeeId,
                            shiftPolicyId: existing.currentShiftId,
                            startDate: existing.shiftDate,
                            endDate: existing.shiftDate,
                            notes: `Shift Swap peer exchange (ID #${existing.id})`
                        }
                    });
                }
            }

            return rec;
        });

        // Notify Requester Employee & Target Colleague about the status decision
        notifyShiftSwapStatusChanged({
            companyId,
            senderUserId: req.user?.id,
            swapRecord: updated,
            status,
            rejectionReason,
            req
        }).catch(e => console.warn('[updateShiftSwapStatus] Notification notice:', e.message));

        return res.json({ message: `Shift swap marked as ${status}`, swap: updated });
    } catch (error) {
        console.error('Error updating shift swap status:', error);
        return res.status(500).json({ message: 'Failed to update shift swap status', error: error.message });
    }
}

async function deleteShiftSwapRequest(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.shiftSwapRequest.findFirst({
            where: { id, companyId },
            include: { requester: true }
        });
        if (!existing) return res.status(404).json({ message: 'Shift swap request not found' });

        if (req.user?.role === 'EMPLOYEE' && existing.requester.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied: You can only cancel your own swap requests.' });
        }

        await prisma.shiftSwapRequest.delete({ where: { id } });
        return res.json({ message: 'Shift swap request cancelled successfully' });
    } catch (error) {
        console.error('Error deleting shift swap request:', error);
        return res.status(500).json({ message: 'Failed to delete shift swap request', error: error.message });
    }
}

// ========================================================
// 4. OVERTIME MANAGEMENT
// ========================================================
async function getOvertimeRecords(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const where = { companyId };

        if (req.user?.role === 'EMPLOYEE') {
            where.employee = { userId: req.user.id };
        } else {
            where.employee = { user: NON_ADMIN_USER_FILTER };
        }

        const records = await prisma.overtimeRecord.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true,
                        department: { select: { name: true } },
                        designation: { select: { name: true } }
                    }
                }
            },
            orderBy: { overtimeDate: 'desc' }
        });

        const formatted = records.map(r => ({
            id: r.id,
            employeeId: r.employeeId,
            employeeName: `${r.employee.firstName} ${r.employee.lastName}`.trim(),
            employeeCode: r.employee.employeeCode,
            profilePhotoUrl: formatPhotoUrl(r.employee.profilePhotoUrl),
            department: r.employee.department?.name || 'General',
            designation: r.employee.designation?.name || 'Employee',
            overtimeDate: r.overtimeDate ? r.overtimeDate.toISOString().split('T')[0] : null,
            hours: Number(r.hours),
            project: r.project || 'General Project',
            description: r.description || '',
            overtimeRate: r.overtimeRate ? Number(r.overtimeRate) : null,
            status: r.status || 'PENDING',
            approvedById: r.approvedById,
            approvedAt: r.approvedAt ? r.approvedAt.toISOString().split('T')[0] : null
        }));

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getOvertimeRecords:', error);
        return res.status(500).json({ message: 'Failed to fetch overtime records', error: error.message });
    }
}

async function createOvertimeRecord(req, res) {
    try {
        const companyId = getCompanyId(req);
        let { employeeId, overtimeDate, hours, project, description, overtimeRate } = req.body;

        if (req.user?.role === 'EMPLOYEE') {
            const currentEmp = await prisma.employee.findUnique({
                where: { userId: req.user.id }
            });
            if (!currentEmp) return res.status(404).json({ message: 'Employee record not found' });
            employeeId = currentEmp.id;
        }

        if (!employeeId || !overtimeDate || !hours) {
            return res.status(400).json({ message: 'Employee, date, and hours are required' });
        }

        const record = await prisma.overtimeRecord.create({
            data: {
                companyId,
                employeeId: parseInt(employeeId, 10),
                overtimeDate: new Date(overtimeDate),
                hours: parseFloat(hours),
                project: project || null,
                description: description || null,
                overtimeRate: overtimeRate ? parseFloat(overtimeRate) : null,
                status: 'PENDING'
            },
            include: { employee: true }
        });

        // Notify HR Managers, Reporting Managers, and Team Leads
        notifyOvertimeSubmitted({
            companyId,
            senderUserId: req.user?.id,
            overtimeRecord: record,
            req
        }).catch(e => console.warn('[createOvertimeRecord] Notification notice:', e.message));

        return res.status(201).json({ message: 'Overtime claim submitted successfully', record });
    } catch (error) {
        console.error('Error creating overtime record:', error);
        return res.status(500).json({ message: 'Failed to create overtime record', error: error.message });
    }
}

async function updateOvertimeRecord(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const { hours, project, description, status } = req.body;

        const existing = await prisma.overtimeRecord.findFirst({
            where: { id, companyId },
            include: { employee: true }
        });
        if (!existing) return res.status(404).json({ message: 'Overtime record not found' });

        if (req.user?.role === 'EMPLOYEE') {
            if (status && status !== existing.status) {
                return res.status(403).json({ message: 'Access denied: Employees cannot approve/reject overtime claims.' });
            }
            if (existing.employee.userId !== req.user.id) {
                return res.status(403).json({ message: 'Access denied: You can only edit your own overtime claim.' });
            }
        }

        const updateData = {};
        if (hours !== undefined) updateData.hours = parseFloat(hours);
        if (project !== undefined) updateData.project = project;
        if (description !== undefined) updateData.description = description;
        if (status) {
            updateData.status = status;
            if (status === 'APPROVED') {
                updateData.approvedById = req.user?.id;
                updateData.approvedAt = new Date();
            }
        }

        const updated = await prisma.overtimeRecord.update({
            where: { id },
            data: updateData
        });

        // Notify employee if status was changed (approved or rejected)
        if (status && status !== existing.status) {
            notifyOvertimeStatusChanged({
                companyId,
                senderUserId: req.user?.id,
                overtimeRecord: updated,
                status,
                req
            }).catch(e => console.warn('[updateOvertimeRecord] Notification notice:', e.message));
        }

        return res.json({ message: 'Overtime record updated successfully', record: updated });
    } catch (error) {
        console.error('Error updating overtime record:', error);
        return res.status(500).json({ message: 'Failed to update overtime record', error: error.message });
    }
}

async function deleteOvertimeRecord(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.overtimeRecord.findFirst({
            where: { id, companyId },
            include: { employee: true }
        });
        if (!existing) return res.status(404).json({ message: 'Overtime record not found' });

        if (req.user?.role === 'EMPLOYEE' && existing.employee.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied: You can only delete your own overtime claim.' });
        }

        await prisma.overtimeRecord.delete({ where: { id } });
        return res.json({ message: 'Overtime record deleted successfully' });
    } catch (error) {
        console.error('Error deleting overtime record:', error);
        return res.status(500).json({ message: 'Failed to delete overtime record', error: error.message });
    }
}

// ========================================================
// 5. WORK FROM HOME (WFH) MANAGEMENT
// ========================================================
async function getWfhRequests(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const where = { companyId };

        if (req.user?.role === 'EMPLOYEE') {
            where.employee = { userId: req.user.id };
        } else {
            where.employee = { user: NON_ADMIN_USER_FILTER };
        }

        const requests = await prisma.wfhRequest.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true,
                        department: { select: { name: true } },
                        designation: { select: { name: true } },
                        shiftPolicy: { select: { name: true } }
                    }
                }
            },
            orderBy: { startDate: 'desc' }
        });

        const formatted = requests.map(w => ({
            id: w.id,
            employeeId: w.employeeId,
            employeeName: `${w.employee.firstName} ${w.employee.lastName}`.trim(),
            employeeCode: w.employee.employeeCode,
            profilePhotoUrl: formatPhotoUrl(w.employee.profilePhotoUrl),
            department: w.employee.department?.name || 'General',
            designation: w.employee.designation?.name || 'Employee',
            shift: w.employee.shiftPolicy?.name || 'General Shift',
            startDate: w.startDate ? w.startDate.toISOString().split('T')[0] : null,
            endDate: w.endDate ? w.endDate.toISOString().split('T')[0] : null,
            reason: w.reason || '',
            status: w.status || 'PENDING',
            createdAt: w.createdAt ? w.createdAt.toISOString().split('T')[0] : null
        }));

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getWfhRequests:', error);
        return res.status(500).json({ message: 'Failed to fetch WFH requests', error: error.message });
    }
}

async function createWfhRequest(req, res) {
    try {
        const companyId = getCompanyId(req);
        let { employeeId, startDate, endDate, reason } = req.body;

        if (req.user?.role === 'EMPLOYEE') {
            const currentEmp = await prisma.employee.findUnique({
                where: { userId: req.user.id }
            });
            if (!currentEmp) return res.status(404).json({ message: 'Employee record not found' });
            employeeId = currentEmp.id;
        }

        if (!employeeId || !startDate || !endDate) {
            return res.status(400).json({ message: 'Employee, start date, and end date are required' });
        }

        const request = await prisma.wfhRequest.create({
            data: {
                companyId,
                employeeId: parseInt(employeeId, 10),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason: reason || null,
                status: 'PENDING'
            },
            include: { employee: true }
        });

        // Notify HR Managers, Reporting Managers, and Team Leads
        notifyWfhApplied({
            companyId,
            senderUserId: req.user?.id,
            wfhRecord: request,
            req
        }).catch(e => console.warn('[createWfhRequest] Notification notice:', e.message));

        return res.status(201).json({ message: 'WFH request submitted successfully', request });
    } catch (error) {
        console.error('Error creating WFH request:', error);
        return res.status(500).json({ message: 'Failed to submit WFH request', error: error.message });
    }
}

async function updateWfhStatus(req, res) {
    try {
        if (req.user?.role === 'EMPLOYEE') {
            return res.status(403).json({ message: 'Access denied: Employees cannot approve/reject WFH requests.' });
        }

        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const { status } = req.body;

        const existing = await prisma.wfhRequest.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(404).json({ message: 'WFH request not found' });

        const updated = await prisma.wfhRequest.update({
            where: { id },
            data: {
                status: status || existing.status,
                approvedById: status === 'APPROVED' ? req.user?.id : null,
                approvedAt: status === 'APPROVED' ? new Date() : null
            }
        });

        // Notify employee of approval or rejection
        notifyWfhStatusChanged({
            companyId,
            senderUserId: req.user?.id,
            wfhRecord: updated,
            status,
            req
        }).catch(e => console.warn('[updateWfhStatus] Notification notice:', e.message));

        return res.json({ message: `WFH request marked as ${status}`, request: updated });
    } catch (error) {
        console.error('Error updating WFH status:', error);
        return res.status(500).json({ message: 'Failed to update WFH status', error: error.message });
    }
}

async function deleteWfhRequest(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.wfhRequest.findFirst({
            where: { id, companyId },
            include: { employee: true }
        });
        if (!existing) return res.status(404).json({ message: 'WFH request not found' });

        if (req.user?.role === 'EMPLOYEE' && existing.employee.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied: You can only cancel your own WFH request.' });
        }

        await prisma.wfhRequest.delete({ where: { id } });
        return res.json({ message: 'WFH request cancelled successfully' });
    } catch (error) {
        console.error('Error deleting WFH request:', error);
        return res.status(500).json({ message: 'Failed to delete WFH request', error: error.message });
    }
}

module.exports = {
    getShiftMetadata,
    getShiftPolicies,
    createShiftPolicy,
    updateShiftPolicy,
    deleteShiftPolicy,
    getShiftSchedules,
    createShiftSchedule,
    deleteShiftSchedule,
    getShiftSwapRequests,
    getEligibleSwapPeers,
    createShiftSwapRequest,
    updateShiftSwapStatus,
    deleteShiftSwapRequest,
    getOvertimeRecords,
    createOvertimeRecord,
    updateOvertimeRecord,
    deleteOvertimeRecord,
    getWfhRequests,
    createWfhRequest,
    updateWfhStatus,
    deleteWfhRequest
};
