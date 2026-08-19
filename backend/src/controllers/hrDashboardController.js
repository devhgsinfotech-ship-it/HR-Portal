// backend/src/controllers/hrDashboardController.js
const prisma = require('../config/prisma');

async function getHrDashboardSummary(req, res) {
    try {
        const companyId = parseInt(req.user.companyId, 10);

        // ── Date range from query params (defaults to today) ──────────
        const now = new Date();
        let rangeStart = new Date(now);
        rangeStart.setHours(0, 0, 0, 0);
        let rangeEnd = new Date(now);
        rangeEnd.setHours(23, 59, 59, 999);

        if (req.query.startDate) {
            rangeStart = new Date(req.query.startDate);
            rangeStart.setHours(0, 0, 0, 0);
        }
        if (req.query.endDate) {
            rangeEnd = new Date(req.query.endDate);
            rangeEnd.setHours(23, 59, 59, 999);
        }

        // ── 1. Total employees ────────────────────────────────────────
        const totalEmployees = await prisma.employee.count({
            where: { user: { companyId } }
        });

        // ── 2. New joinees in the date range ─────────────────────────
        const newJoinees = await prisma.employee.count({
            where: {
                user: { companyId },
                dateOfJoining: { gte: rangeStart, lte: rangeEnd }
            }
        });

        // ── 3. Employee type breakdown ────────────────────────────────
        const allEmployees = await prisma.employee.findMany({
            where: { user: { companyId } },
            select: { employmentType: true }
        });

        let fullTimeCount = 0, contractCount = 0, probationCount = 0;
        allEmployees.forEach(e => {
            const t = (e.employmentType || '').toUpperCase();
            if (t === 'CONTRACT') contractCount++;
            else if (t === 'PART_TIME' || t === 'INTERN') probationCount++;
            else fullTimeCount++; // FULL_TIME or default
        });

        // ── 4. Today's attendance summary ────────────────────────────
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Get attendance policy for late threshold
        let officeStartHour = 9, officeStartMin = 0, gracePeriod = 15;
        try {
            const policy = await prisma.attendancePolicy.findUnique({ where: { companyId } });
            if (policy) gracePeriod = policy.lateGracePeriod || 15;
            const setting = await prisma.companySetting.findUnique({ where: { companyId } });
            if (setting && setting.officeStartTime) {
                const parts = setting.officeStartTime.split(':');
                officeStartHour = parseInt(parts[0], 10);
                officeStartMin = parseInt(parts[1], 10);
            }
        } catch (e) {
            // Use defaults if settings not found
        }

        // Late threshold = officeStartTime + gracePeriod minutes
        const lateThresholdToday = new Date();
        lateThresholdToday.setHours(officeStartHour, officeStartMin + gracePeriod, 0, 0);

        const todayRecords = await prisma.attendanceRecord.findMany({
            where: {
                employee: { user: { companyId } },
                date: { gte: todayStart, lte: todayEnd }
            },
            include: {
                employee: {
                    include: {
                        user: { select: { name: true } },
                        designation: { select: { name: true } },
                        department: { select: { name: true } }
                    }
                }
            }
        });

        let onTimeCount = 0, lateCount = 0;
        const lateArrivalsList = [];

        todayRecords.forEach(record => {
            if (!record.checkIn) return;
            const checkIn = new Date(record.checkIn);
            if (checkIn > lateThresholdToday) {
                lateCount++;
                const delayMs = checkIn.getTime() - lateThresholdToday.getTime();
                const delayMinutes = Math.max(1, Math.round(delayMs / 60000));
                lateArrivalsList.push({
                    id: record.id,
                    name: `${record.employee.firstName || ''} ${record.employee.lastName || ''}`.trim()
                        || record.employee.user?.name || 'Employee',
                    department: record.employee.department?.name || record.employee.designation?.name || '—',
                    photo: record.employee.profilePhotoUrl || null,
                    checkIn: checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    delayMinutes
                });
            } else {
                onTimeCount++;
            }
        });

        // Absent = employees with no attendance record today
        const absentCount = Math.max(0, totalEmployees - todayRecords.length);

        // ── 5. Leave type distribution (in date range) ────────────────
        const leaveRequests = await prisma.leaveRequest.findMany({
            where: {
                employee: { user: { companyId } },
                status: 'APPROVED',
                startDate: { lte: rangeEnd },
                endDate: { gte: rangeStart }
            },
            include: { leaveType: { select: { name: true } } }
        });

        const leaveTypeMap = {};
        leaveRequests.forEach(r => {
            const name = r.leaveType?.name || 'Other';
            leaveTypeMap[name] = (leaveTypeMap[name] || 0) + 1;
        });
        const leaveTypeStats = Object.entries(leaveTypeMap).map(([name, count]) => ({ name, count }));

        // ── 6. Pending leave approvals ────────────────────────────────
        const pendingLeaves = await prisma.leaveRequest.findMany({
            where: {
                status: 'PENDING',
                employee: { user: { companyId } }
            },
            orderBy: { appliedAt: 'desc' },
            take: 5,
            include: {
                employee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true,
                        designation: { select: { name: true } }
                    }
                },
                leaveType: { select: { name: true } }
            }
        });

        const pendingList = pendingLeaves.map(r => ({
            id: r.id,
            employeeName: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim(),
            designation: r.employee?.designation?.name || '',
            photo: r.employee?.profilePhotoUrl || null,
            leaveType: r.leaveType?.name || 'Leave',
            startDate: r.startDate,
            endDate: r.endDate,
            totalDays: Number(r.totalDays),
            reason: r.reason || ''
        }));

        res.json({
            totalEmployees,
            newJoinees,
            fullTimeCount,
            contractCount,
            probationCount,
            onTimeCount,
            lateCount,
            absentCount,
            lateArrivalsList,
            leaveTypeStats,
            pendingLeaves: pendingList
        });

    } catch (error) {
        console.error('Error fetching HR dashboard summary:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { getHrDashboardSummary };
