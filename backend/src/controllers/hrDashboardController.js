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
            const parts = req.query.startDate.split('-');
            if (parts.length === 3) {
                rangeStart = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
            } else {
                rangeStart = new Date(req.query.startDate);
                rangeStart.setHours(0, 0, 0, 0);
            }
        }
        if (req.query.endDate) {
            const parts = req.query.endDate.split('-');
            if (parts.length === 3) {
                rangeEnd = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59, 999);
            } else {
                rangeEnd = new Date(req.query.endDate);
                rangeEnd.setHours(23, 59, 59, 999);
            }
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

        // ── 4. Today's / Date Range attendance summary ───────────────
        const todayStart = rangeStart;
        const todayEnd = rangeEnd;

        // Get attendance policy for late threshold & timezone
        let officeStartHour = 9, officeStartMin = 0, gracePeriod = 15;
        let companyTimezone = 'Asia/Kolkata';
        try {
            const policy = await prisma.attendancePolicy.findUnique({ where: { companyId } });
            if (policy) gracePeriod = policy.lateGracePeriod || 15;
            const setting = await prisma.companySetting.findUnique({ where: { companyId } });
            if (setting) {
                if (setting.timezone) companyTimezone = setting.timezone;
                if (setting.officeStartTime) {
                    const parts = setting.officeStartTime.split(':');
                    officeStartHour = parseInt(parts[0], 10);
                    officeStartMin = parseInt(parts[1], 10);
                }
            }
        } catch (e) {
            // Use defaults if settings not found
        }

        // Late threshold helper function (timezone aware)
        const isLateRecord = (record) => {
            if (record && record.status === 'LATE') return true;
            if (!record || !record.checkIn) return false;
            const cIn = new Date(record.checkIn);
            let cInHours, cInMins;
            try {
                const timeStr = cIn.toLocaleTimeString('en-US', { timeZone: companyTimezone, hour12: false });
                const parts = timeStr.split(':');
                cInHours = parseInt(parts[0], 10);
                cInMins = parseInt(parts[1], 10);
                if (cInHours === 24) cInHours = 0;
            } catch (tzErr) {
                cInHours = cIn.getHours();
                cInMins = cIn.getMinutes();
            }

            const thresholdMins = officeStartMin + gracePeriod;
            const thresholdHour = officeStartHour + Math.floor(thresholdMins / 60);
            const finalThresholdMin = thresholdMins % 60;

            if (cInHours > thresholdHour) return true;
            if (cInHours === thresholdHour && cInMins > finalThresholdMin) return true;
            return false;
        };

        const lateThresholdToday = new Date();
        lateThresholdToday.setHours(officeStartHour, officeStartMin + gracePeriod, 0, 0);

        const todayRecords = await prisma.attendanceRecord.findMany({
            where: {
                employee: { user: { companyId } },
                OR: [
                    { date: { gte: todayStart, lte: todayEnd } },
                    { checkIn: { gte: todayStart, lte: todayEnd } }
                ]
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
            if (isLateRecord(record)) {
                lateCount++;
                const delayMs = checkIn.getTime() - lateThresholdToday.getTime();
                const delayMinutes = Math.max(1, Math.round(delayMs / 60000));
                lateArrivalsList.push({
                    id: record.id,
                    name: `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim()
                        || record.employee?.user?.name || 'Employee',
                    department: record.employee?.department?.name || record.employee?.designation?.name || '—',
                    photo: record.employee?.profilePhotoUrl || null,
                    checkIn: checkIn.toLocaleTimeString('en-US', { timeZone: companyTimezone, hour: '2-digit', minute: '2-digit', hour12: true }),
                    delayMinutes
                });
            } else {
                onTimeCount++;
            }
        });

        // Absent = employees with no attendance record today
        const absentCount = Math.max(0, (totalEmployees || 11) - (onTimeCount + lateCount));

        // ── 4b. Dynamic Attendance Trend (Week / Month / Year) ─────────
        const isSameDay = (d1, d2) => {
            if (!d1 || !d2) return false;
            const date1 = new Date(d1);
            const date2 = new Date(d2);
            return date1.getFullYear() === date2.getFullYear() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getDate() === date2.getDate();
        };

        // Calculate current week range (Monday to Sunday)
        const currentWeekStart = new Date(now);
        const currentDayOfWeek = currentWeekStart.getDay(); // 0 is Sun, 1 is Mon...
        const distToMon = (currentDayOfWeek + 6) % 7;
        currentWeekStart.setDate(currentWeekStart.getDate() - distToMon);
        currentWeekStart.setHours(0, 0, 0, 0);

        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
        currentWeekEnd.setHours(23, 59, 59, 999);

        const weekRecords = await prisma.attendanceRecord.findMany({
            where: {
                employee: { user: { companyId } },
                OR: [
                    { date: { gte: new Date(currentWeekStart.getTime() - 86400000), lte: new Date(currentWeekEnd.getTime() + 86400000) } },
                    { checkIn: { gte: new Date(currentWeekStart.getTime() - 86400000), lte: new Date(currentWeekEnd.getTime() + 86400000) } }
                ]
            }
        });

        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekPresent = [0, 0, 0, 0, 0, 0, 0];
        const weekLate = [0, 0, 0, 0, 0, 0, 0];
        const weekAbsent = [0, 0, 0, 0, 0, 0, 0];

        const todayIndexInWeek = distToMon;

        for (let i = 0; i <= 6; i++) {
            const targetDay = new Date(currentWeekStart);
            targetDay.setDate(currentWeekStart.getDate() + i);

            const dayRecs = weekRecords.filter(r => 
                isSameDay(r.date, targetDay) || isSameDay(r.checkIn, targetDay)
            );

            let dayOnTime = 0;
            let dayLate = 0;
            dayRecs.forEach(r => {
                if (r.checkIn) {
                    if (isLateRecord(r)) {
                        dayLate++;
                    } else {
                        dayOnTime++;
                    }
                } else {
                    dayOnTime++;
                }
            });

            weekPresent[i] = dayOnTime;
            weekLate[i] = dayLate;

            if (i <= todayIndexInWeek) {
                const checkedInTotal = dayOnTime + dayLate;
                weekAbsent[i] = Math.max(0, (totalEmployees || 11) - checkedInTotal);
            } else {
                weekAbsent[i] = 0;
            }
        }

        // Calculate Month Attendance (Weeks 1 to 4 of current month)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthRecords = await prisma.attendanceRecord.findMany({
            where: {
                employee: { user: { companyId } },
                date: { gte: monthStart, lte: monthEnd }
            }
        });

        const monthWeeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const monthPresent = [0, 0, 0, 0];
        const monthLate = [0, 0, 0, 0];
        const monthAbsent = [0, 0, 0, 0];

        const currentWeekNumInMonth = Math.min(3, Math.floor((now.getDate() - 1) / 7));

        monthRecords.forEach(r => {
            const rDate = new Date(r.checkIn || r.date);
            const dayNum = rDate.getDate();
            const weekIdx = Math.min(3, Math.floor((dayNum - 1) / 7));
            const dayLateThreshold = new Date(rDate);
            dayLateThreshold.setHours(officeStartHour, officeStartMin + gracePeriod, 0, 0);

            if (r.checkIn && new Date(r.checkIn) > dayLateThreshold) {
                monthLate[weekIdx]++;
            } else {
                monthPresent[weekIdx]++;
            }
        });

        for (let w = 0; w <= currentWeekNumInMonth; w++) {
            const recordedTotal = monthPresent[w] + monthLate[w];
            const weekMaxPossible = (totalEmployees || 11) * 5;
            monthAbsent[w] = Math.max(0, weekMaxPossible - recordedTotal);
        }

        // Calculate Year Attendance (Months Jan - Dec)
        const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

        const yearRecords = await prisma.attendanceRecord.findMany({
            where: {
                employee: { user: { companyId } },
                date: { gte: yearStart, lte: yearEnd }
            }
        });

        const yearMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const yearPresent = new Array(12).fill(0);
        const yearLate = new Array(12).fill(0);
        const yearAbsent = new Array(12).fill(0);
        const currentMonthIdx = now.getMonth();

        yearRecords.forEach(r => {
            const rDate = new Date(r.checkIn || r.date);
            const mIdx = rDate.getMonth();
            const dayLateThreshold = new Date(rDate);
            dayLateThreshold.setHours(officeStartHour, officeStartMin + gracePeriod, 0, 0);

            if (r.checkIn && new Date(r.checkIn) > dayLateThreshold) {
                yearLate[mIdx]++;
            } else {
                yearPresent[mIdx]++;
            }
        });

        for (let m = 0; m <= currentMonthIdx; m++) {
            const recordedTotal = yearPresent[m] + yearLate[m];
            const monthMaxPossible = (totalEmployees || 11) * 22;
            yearAbsent[m] = Math.max(0, monthMaxPossible - recordedTotal);
        }

        const attendanceTrend = {
            week: {
                categories: weekDays,
                present: weekPresent,
                late: weekLate,
                absent: weekAbsent,
                maxScale: Math.max((totalEmployees || 11) + 2, 12)
            },
            month: {
                categories: monthWeeks,
                present: monthPresent,
                late: monthLate,
                absent: monthAbsent,
                maxScale: Math.max((totalEmployees || 11) * 5 + 5, 50)
            },
            year: {
                categories: yearMonths,
                present: yearPresent,
                late: yearLate,
                absent: yearAbsent,
                maxScale: Math.max((totalEmployees || 11) * 22 + 20, 250)
            }
        };

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

        // ── 7. Upcoming Leaves ─────────────────────────────────────────
        const upcomingLeaves = await prisma.leaveRequest.findMany({
            where: {
                status: 'APPROVED',
                startDate: { gte: todayStart },
                employee: { user: { companyId } }
            },
            orderBy: { startDate: 'asc' },
            take: 3,
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

        const upcomingLeavesList = upcomingLeaves.length > 0 ? upcomingLeaves.map(r => ({
            id: r.id,
            employeeName: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim() || 'Employee',
            photo: r.employee?.profilePhotoUrl || null,
            leaveType: r.leaveType?.name || 'Leave',
            startDate: r.startDate,
            endDate: r.endDate,
            totalDays: Number(r.totalDays || 1)
        })) : [
            { id: 1, employeeName: 'Rohan Sharma', photo: null, leaveType: 'Sick Leave', startDate: '2026-09-12', endDate: '2026-09-13', totalDays: 2 },
            { id: 2, employeeName: 'Priya Singh', photo: null, leaveType: 'Casual Leave', startDate: '2026-09-14', endDate: '2026-09-14', totalDays: 1 },
            { id: 3, employeeName: 'Amit Verma', photo: null, leaveType: 'Earned Leave', startDate: '2026-09-18', endDate: '2026-09-20', totalDays: 3 }
        ];

        // ── 8. Recruitment & Benefits/Payroll stats ───────────────────
        const recruitmentStats = {
            applicants: 12,
            hired: 3,
            avgTimeDays: 8,
            interviewPositions: 2
        };

        const benefitsDeductions = {
            amount: 45000,
            formattedAmount: '₹ 45,000',
            subtitle: 'Insurance + 401(k)'
        };

        // Calculate total salary expense / distributed salary for current month:
        let thisMonthSalaryTotal = 0;
        try {
            const currentMonthInt = now.getMonth() + 1;
            const currentYearInt = now.getFullYear();

            let monthPayslips = await prisma.payslip.findMany({
                where: {
                    employee: { user: { companyId } },
                    month: currentMonthInt,
                    year: currentYearInt
                },
                select: { netPay: true }
            });

            if (monthPayslips.length === 0) {
                // If no payslips for current month, fetch latest generated payslips for the company
                const latestPayslip = await prisma.payslip.findFirst({
                    where: { employee: { user: { companyId } } },
                    orderBy: [{ year: 'desc' }, { month: 'desc' }]
                });
                if (latestPayslip) {
                    monthPayslips = await prisma.payslip.findMany({
                        where: {
                            employee: { user: { companyId } },
                            month: latestPayslip.month,
                            year: latestPayslip.year
                        },
                        select: { netPay: true }
                    });
                }
            }

            if (monthPayslips.length > 0) {
                thisMonthSalaryTotal = monthPayslips.reduce((sum, p) => sum + (parseFloat(p.netPay) || 0), 0);
            } else {
                const salaryStructures = await prisma.salaryStructure.findMany({
                    where: { employee: { user: { companyId } } },
                    select: { netSalary: true, grossSalary: true }
                });
                if (salaryStructures.length > 0) {
                    thisMonthSalaryTotal = salaryStructures.reduce((sum, s) => sum + (parseFloat(s.netSalary) || parseFloat(s.grossSalary) || 0), 0);
                }
            }
        } catch (sErr) {
            console.error('Error calculating monthly salary total:', sErr);
        }

        const displaySalaryAmount = thisMonthSalaryTotal;
        const formattedSalaryAmount = `₹ ${Number(displaySalaryAmount.toFixed(2)).toLocaleString('en-IN', { minimumFractionDigits: displaySalaryAmount % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`;

        const payrollStats = {
            amount: displaySalaryAmount,
            formattedAmount: formattedSalaryAmount,
            subtitle: 'Total Distributed Salary (This Month)'
        };

        const topEmployees = [
            { name: 'Rohan', score: 95, avatar: null },
            { name: 'Priya', score: 88, avatar: null },
            { name: 'Amit', score: 82, avatar: null },
            { name: 'Neha', score: 78, avatar: null },
            { name: 'Sahil', score: 70, avatar: null }
        ];

        // Default leave type stats if empty
        const finalLeaveTypeStats = leaveTypeStats.length > 0 ? leaveTypeStats : [
            { name: 'Casual Leave', count: 5 },
            { name: 'Sick Leave', count: 3 },
            { name: 'Earned Leave', count: 2 },
            { name: 'Maternity Leave', count: 1 },
            { name: 'Other', count: 1 }
        ];

        // Default pending list if empty
        const finalPendingList = pendingList.length > 0 ? pendingList : [
            { id: 101, employeeName: 'Kanika Rajput', designation: 'Web Designer', photo: null, leaveType: 'Casual Leave', startDate: '2026-08-19', endDate: '2026-08-19', totalDays: 1, appliedAt: 'Aug 19' },
            { id: 102, employeeName: 'Uday sharma', designation: 'PHP developer', photo: null, leaveType: 'Sick Leave', startDate: '2026-08-25', endDate: '2026-08-25', totalDays: 1, appliedAt: 'Aug 25' },
            { id: 103, employeeName: 'Aman Kumar', designation: 'Web Designer', photo: null, leaveType: 'Casual Leave', startDate: '2026-08-10', endDate: '2026-08-10', totalDays: 1, appliedAt: 'Aug 10' }
        ];

        // ── 9. Dynamic Employee Designation / Role Distribution ─────────
        const employeesWithDesignation = await prisma.employee.findMany({
            where: { user: { companyId } },
            select: {
                designation: { select: { name: true } },
                department: { select: { name: true } }
            }
        });

        const desigCounts = {};
        employeesWithDesignation.forEach(emp => {
            const label = emp.designation?.name || emp.department?.name || 'General';
            desigCounts[label] = (desigCounts[label] || 0) + 1;
        });

        const totalEmpCountForDist = employeesWithDesignation.length || totalEmployees || 1;
        
        const sortedDesigs = Object.entries(desigCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const employeeDistribution = sortedDesigs.map(([name, count]) => ({
            label: name,
            count: count,
            percentage: Math.round((count / totalEmpCountForDist) * 100)
        }));

        const finalEmployeeDistribution = employeeDistribution.length > 0 ? employeeDistribution : [
            { label: 'Web Developer', count: 4, percentage: 36 },
            { label: 'SEO', count: 2, percentage: 18 },
            { label: 'IT', count: 2, percentage: 18 },
            { label: 'Web Designer', count: 2, percentage: 18 },
            { label: 'PHP Developer', count: 1, percentage: 10 }
        ];

        const dbHasEmployees = totalEmployees > 0;
        res.json({
            totalEmployees: dbHasEmployees ? totalEmployees : 11,
            newJoinees: newJoinees || 0,
            fullTimeCount: dbHasEmployees ? fullTimeCount : 11,
            contractCount: dbHasEmployees ? contractCount : 0,
            probationCount: dbHasEmployees ? probationCount : 0,
            onTimeCount: onTimeCount || 0,
            lateCount: lateCount || 0,
            absentCount: dbHasEmployees ? Math.max(0, totalEmployees - onTimeCount - lateCount) : 11,
            lateArrivalsList,
            attendanceTrend,
            employeeDistribution: finalEmployeeDistribution,
            leaveTypeStats: finalLeaveTypeStats,
            pendingLeaves: finalPendingList,
            upcomingLeaves: upcomingLeavesList,
            recruitmentStats,
            benefitsDeductions,
            payrollStats,
            topEmployees
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

        // Fetch live counts for projects, clients, and tasks in the company
        const [totalProjects, totalClients, totalTasks] = await Promise.all([
            prisma.project.count({ where: { companyId } }),
            prisma.client.count({ where: { companyId } }),
            prisma.task.count({ where: { companyId } })
        ]);

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
            newHiresCount,
            totalProjects,
            totalClients,
            totalTasks
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
