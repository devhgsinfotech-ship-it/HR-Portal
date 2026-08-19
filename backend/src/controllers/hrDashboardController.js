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

async function getAdminDashboardSummary(req, res) {
    try {
        const companyId = parseInt(req.user.companyId, 10);

        // 1. Total employees
        const totalEmployees = await prisma.employee.count({
            where: { user: { companyId } }
        });

        // 2. Pending Leave requests count
        const pendingLeavesCount = await prisma.leaveRequest.count({
            where: {
                status: 'PENDING',
                employee: { user: { companyId } }
            }
        });

        // 3. Employee status breakdown
        const allEmployees = await prisma.employee.findMany({
            where: { user: { companyId } },
            select: { employmentType: true }
        });

        let fullTimeCount = 0, contractCount = 0, probationCount = 0, wfhCount = 0;
        allEmployees.forEach(e => {
            const t = (e.employmentType || '').toUpperCase();
            if (t === 'CONTRACT') contractCount++;
            else if (t === 'PART_TIME' || t === 'INTERN') probationCount++;
            else fullTimeCount++; // FULL_TIME
        });

        // Calculate new hires in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newHiresCount = await prisma.employee.count({
            where: {
                user: { companyId },
                dateOfJoining: { gte: thirtyDaysAgo }
            }
        });

        // 4. Attendance Today stats
        let todayStart = new Date();
        if (req.query.date) {
            todayStart = new Date(req.query.date);
        }
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setHours(23, 59, 59, 999);

        const todayRecords = await prisma.attendanceRecord.findMany({
            where: {
                employee: { user: { companyId } },
                date: { gte: todayStart, lte: todayEnd }
            }
        });

        let presentCount = 0, lateCount = 0, absentCount = 0, permissionCount = 0;
        
        // Let's determine office start & grace period
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
        } catch (e) {}

        const lateThresholdToday = new Date(todayStart);
        lateThresholdToday.setHours(officeStartHour, officeStartMin + gracePeriod, 0, 0);

        todayRecords.forEach(record => {
            if (record.status === 'ABSENT') {
                absentCount++;
            } else if (record.status === 'ON_LEAVE') {
                permissionCount++;
            } else {
                if (record.checkIn && new Date(record.checkIn) > lateThresholdToday) {
                    lateCount++;
                } else {
                    presentCount++;
                }
            }
        });

        // Any employee without a record is absent
        const noRecordCount = Math.max(0, totalEmployees - todayRecords.length);
        absentCount += noRecordCount;

        const totalAttendanceToday = todayRecords.filter(r => r.status !== 'ABSENT' && r.status !== 'ON_LEAVE').length;

        // 5. Fetch all company employees to build dynamic list and check if seeding is needed
        const allCompanyEmployees = await prisma.employee.findMany({
            where: { user: { companyId } },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true } },
                designation: { select: { name: true } },
                department: { select: { name: true } }
            }
        });

        let clockedInList = [];
        let lateList = [];
        let firstCheckIn = '—';
        let lastCheckOut = '—';
        let totalProduction = '—';
        let empList = [];

        if (allCompanyEmployees.length === 0) {
            // Seeding/Fallback data for empty DB
            clockedInList = [
                {
                    id: 'seed-1',
                    name: 'Daniel Esbella',
                    designation: 'UI/UX Designer',
                    department: 'UI/UX Design',
                    photo: null,
                    checkIn: '09:15 AM',
                    checkOut: '—',
                    production: '—',
                    isLate: false
                },
                {
                    id: 'seed-2',
                    name: 'Doglas Martini',
                    designation: 'Project Manager',
                    department: 'Management',
                    photo: null,
                    checkIn: '09:36 AM',
                    checkOut: '—',
                    production: '—',
                    isLate: false
                },
                {
                    id: 'seed-3',
                    name: 'Brian Villalobos',
                    designation: 'PHP Developer',
                    department: 'Development',
                    photo: null,
                    checkIn: '09:15 AM',
                    checkOut: '—',
                    production: '—',
                    isLate: false
                }
            ];
            lateList = [
                {
                    id: 'seed-4',
                    name: 'Anthony Lewis',
                    designation: 'Marketing Head',
                    department: 'Marketing',
                    photo: null,
                    checkIn: '08:35 AM',
                    checkOut: '—',
                    production: '—',
                    isLate: true,
                    lateMinutes: '30 Min'
                }
            ];
            firstCheckIn = '10:30 AM';
            lastCheckOut = '09:45 AM';
            totalProduction = '09:21 Hrs';

            empList = [
                { id: 'seed-e1', name: 'Anthony Lewis', designation: 'Finance', department: 'Finance', photo: null },
                { id: 'seed-e2', name: 'Brian Villalobos', designation: 'PHP Developer', department: 'Development', photo: null },
                { id: 'seed-e3', name: 'Stephan Peralt', designation: 'Executive', department: 'Marketing', photo: null },
                { id: 'seed-e4', name: 'Doglas Martini', designation: 'Project Manager', department: 'Manager', photo: null },
                { id: 'seed-e5', name: 'Anthony Lewis', designation: 'UI/UX Designer', department: 'UI/UX Design', photo: null }
            ];
        } else {
            // Map today's attendance records by employeeId
            const attendanceMap = {};
            todayRecords.forEach(att => {
                attendanceMap[att.employeeId] = att;
            });

            allCompanyEmployees.forEach(emp => {
                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.user?.name || 'Employee';
                const photo = emp.profilePhotoUrl || null;
                const designation = emp.designation?.name || 'Staff';
                const department = emp.department?.name || 'General';
                const att = attendanceMap[emp.id];

                if (att && att.status !== 'ABSENT' && att.status !== 'ON_LEAVE') {
                    const checkInTime = att.checkIn ? new Date(att.checkIn) : null;
                    const checkOutTime = att.checkOut ? new Date(att.checkOut) : null;

                    const formattedCheckIn = checkInTime ? checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
                    const formattedCheckOut = checkOutTime ? checkOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

                    let production = '—';
                    if (checkInTime && checkOutTime) {
                        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
                        const diffHrs = Math.floor(diffMs / 3600000);
                        const diffMins = Math.round((diffMs % 3600000) / 60000);
                        production = `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')} Hrs`;
                    }

                    const isLate = checkInTime && checkInTime > lateThresholdToday;
                    const record = {
                        id: emp.id,
                        name,
                        photo,
                        designation,
                        department,
                        checkIn: formattedCheckIn,
                        checkOut: formattedCheckOut,
                        production,
                        isLate
                    };

                    if (isLate) {
                        const delayMs = checkInTime.getTime() - lateThresholdToday.getTime();
                        const delayMinutes = Math.max(1, Math.round(delayMs / 60000));
                        record.lateMinutes = `${delayMinutes} Min`;
                        lateList.push(record);
                    } else {
                        clockedInList.push(record);
                    }
                } else {
                    // Not clocked in today, list in standard clockedInList with "—" times
                    clockedInList.push({
                        id: emp.id,
                        name,
                        photo,
                        designation,
                        department,
                        checkIn: '—',
                        checkOut: '—',
                        production: '—',
                        isLate: false
                    });
                }
            });

            // Calculate overall checkin/checkout metrics
            let minCheckIn = null;
            let maxCheckOut = null;
            let sumMs = 0;

            todayRecords.forEach(att => {
                if (att.checkIn) {
                    const ci = new Date(att.checkIn);
                    if (!minCheckIn || ci < minCheckIn) minCheckIn = ci;
                }
                if (att.checkOut) {
                    const co = new Date(att.checkOut);
                    if (!maxCheckOut || co > maxCheckOut) maxCheckOut = co;
                }
                if (att.checkIn && att.checkOut) {
                    sumMs += (new Date(att.checkOut).getTime() - new Date(att.checkIn).getTime());
                }
            });

            if (minCheckIn) {
                firstCheckIn = minCheckIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
            if (maxCheckOut) {
                lastCheckOut = maxCheckOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
            if (sumMs > 0) {
                const diffHrs = Math.floor(sumMs / 3600000);
                const diffMins = Math.round((sumMs % 3600000) / 60000);
                totalProduction = `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')} Hrs`;
            }

            // Prioritize clocked-in employees, then show others, and slice to 5
            clockedInList = [
                ...clockedInList.filter(item => item.checkIn !== '—'),
                ...clockedInList.filter(item => item.checkIn === '—')
            ].slice(0, 5);

            lateList = lateList.slice(0, 5);

            empList = allCompanyEmployees.slice(0, 5).map(e => ({
                id: e.id,
                name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Employee',
                designation: e.designation?.name || 'Staff',
                department: e.department?.name || 'General',
                photo: e.profilePhotoUrl || null
            }));
        }

        res.json({
            totalEmployees,
            pendingLeavesCount,
            fullTimeCount,
            contractCount,
            probationCount,
            wfhCount,
            presentCount,
            lateCount,
            absentCount,
            permissionCount,
            totalAttendanceToday,
            latestEmployees: empList,
            clockedInList,
            lateList,
            firstCheckIn,
            lastCheckOut,
            totalProduction,
            newHiresCount
        });

    } catch (error) {
        console.error('Error fetching admin dashboard summary:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { 
    getHrDashboardSummary,
    getAdminDashboardSummary
};
