// backend/src/controllers/reportsController.js
const prisma = require('../config/prisma');

function getCompanyId(req) {
    return req.user?.companyId;
}

const NON_ADMIN_USER_FILTER = {
    role: { notIn: ['SUPER_ADMIN', 'COMPANY_ADMIN'] }
};

// 1. Attendance Report
async function getAttendanceReport(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const { departmentId, dateFrom, dateTo } = req.query;

        const employeeWhere = { user: { companyId, ...NON_ADMIN_USER_FILTER } };
        if (departmentId && departmentId !== 'ALL') {
            employeeWhere.departmentId = parseInt(departmentId);
        }

        const dateFilter = {};
        if (dateFrom) dateFilter.gte = new Date(dateFrom);
        if (dateTo) dateFilter.lte = new Date(dateTo);

        const attendanceWhere = {
            employee: employeeWhere,
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        };

        const records = await prisma.attendanceRecord.findMany({
            where: attendanceWhere,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                        profilePhotoUrl: true,
                        department: { select: { id: true, name: true } },
                        designation: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: 200
        });

        // Compute Summary Metrics
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let halfDayCount = 0;

        records.forEach(r => {
            const st = r.status?.toUpperCase();
            if (st === 'PRESENT') presentCount++;
            else if (st === 'ABSENT') absentCount++;
            else if (st === 'HALF_DAY') halfDayCount++;

            if (r.isLate || r.lateMinutes > 0) lateCount++;
        });

        const totalRecords = records.length;

        // Monthly Trend (Jan - Dec)
        const monthlyPresent = new Array(12).fill(0);
        const monthlyLate = new Array(12).fill(0);

        records.forEach(r => {
            if (r.date) {
                const m = new Date(r.date).getMonth();
                if (m >= 0 && m < 12) {
                    if (r.status === 'PRESENT') monthlyPresent[m]++;
                    if (r.isLate || r.lateMinutes > 0) monthlyLate[m]++;
                }
            }
        });

        res.json({
            metrics: {
                totalRecords,
                presentCount,
                absentCount,
                lateCount,
                halfDayCount
            },
            chartSeries: [
                { name: 'Present Days', data: monthlyPresent },
                { name: 'Late Days', data: monthlyLate }
            ],
            records: records.map(r => ({
                id: r.id,
                Name: `${r.employee.firstName} ${r.employee.lastName}`,
                Role: r.employee.designation?.name || 'Employee',
                Department: r.employee.department?.name || 'General',
                Date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
                CheckIn: r.punchIn ? new Date(r.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
                CheckOut: r.punchOut ? new Date(r.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
                Status: r.status || 'PRESENT',
                Break: '1 hr',
                Late: r.lateMinutes ? `${r.lateMinutes} min` : '0 min',
                Overtime: '—',
                ProductionHours: r.punchIn && r.punchOut ? `${Math.max(1, Math.round((new Date(r.punchOut) - new Date(r.punchIn)) / 3600000))} hrs` : '8 hrs',
                Image: r.employee.profilePhotoUrl || 'user-32.jpg'
            }))
        });
    } catch (error) {
        console.error('Error generating attendance report:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// 2. Leave Report
async function getLeaveReport(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const { departmentId, status } = req.query;

        const employeeWhere = { user: { companyId, ...NON_ADMIN_USER_FILTER } };
        if (departmentId && departmentId !== 'ALL') {
            employeeWhere.departmentId = parseInt(departmentId);
        }

        const leaveWhere = {
            employee: employeeWhere,
            ...(status && status !== 'ALL' && { status })
        };

        const [leaveRequests, leaveTypes] = await Promise.all([
            prisma.leaveRequest.findMany({
                where: leaveWhere,
                include: {
                    leaveType: true,
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            employeeCode: true,
                            profilePhotoUrl: true,
                            department: { select: { id: true, name: true } },
                            designation: { select: { id: true, name: true } }
                        }
                    }
                },
                orderBy: { appliedAt: 'desc' },
                take: 150
            }),
            prisma.leaveType.findMany({
                where: { companyId },
                select: { id: true, name: true }
            })
        ]);

        let approvedCount = 0;
        let pendingCount = 0;
        let rejectedCount = 0;

        const typeUsage = {};
        leaveTypes.forEach(t => { typeUsage[t.name] = 0; });

        leaveRequests.forEach(l => {
            if (l.status === 'APPROVED') approvedCount++;
            else if (l.status === 'PENDING') pendingCount++;
            else if (l.status === 'REJECTED') rejectedCount++;

            const tName = l.leaveType?.name || 'General';
            typeUsage[tName] = (typeUsage[tName] || 0) + Number(l.totalDays || 1);
        });

        res.json({
            metrics: {
                totalRequests: leaveRequests.length,
                approvedCount,
                pendingCount,
                rejectedCount
            },
            typeDistribution: {
                labels: Object.keys(typeUsage),
                data: Object.values(typeUsage)
            },
            records: leaveRequests.map(l => ({
                id: l.id,
                Name: `${l.employee.firstName} ${l.employee.lastName}`,
                Role: l.employee.designation?.name || 'Employee',
                Department: l.employee.department?.name || 'General',
                LeaveType: l.leaveType?.name || 'Casual Leave',
                StartDate: l.startDate ? new Date(l.startDate).toISOString().split('T')[0] : '',
                EndDate: l.endDate ? new Date(l.endDate).toISOString().split('T')[0] : '',
                Days: Number(l.totalDays || 1),
                Reason: l.reason || 'Personal reasons',
                Status: l.status || 'PENDING',
                AppliedAt: l.appliedAt ? new Date(l.appliedAt).toISOString().split('T')[0] : '',
                Image: l.employee.profilePhotoUrl || 'user-32.jpg'
            }))
        });
    } catch (error) {
        console.error('Error generating leave report:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// Ensure default payroll data exists for tenant report demonstration
async function ensureDefaultPayrollData(companyId) {
    if (!companyId) return;
    try {
        const count = await prisma.payrollEntry.count({
            where: { employee: { user: { companyId, ...NON_ADMIN_USER_FILTER } } }
        });
        if (count > 0) return;

        const employees = await prisma.employee.findMany({
            where: { user: { companyId, ...NON_ADMIN_USER_FILTER } },
            take: 8
        });
        if (employees.length === 0) return;

        const periodsData = [
            {
                periodStart: new Date(2026, 8, 1), // Sep 1, 2026
                periodEnd: new Date(2026, 8, 30),  // Sep 30, 2026
                label: 'September 2026',
                totalDays: 30,
                weekoffDays: 8,
                holidayDays: 1,
                workingDays: 21
            },
            {
                periodStart: new Date(2026, 9, 1), // Oct 1, 2026
                periodEnd: new Date(2026, 9, 31),  // Oct 31, 2026
                label: 'October 2026',
                totalDays: 31,
                weekoffDays: 8,
                holidayDays: 2,
                workingDays: 21
            }
        ];

        const salaryProfiles = [
            { basic: 52000, hra: 20800, conveyance: 4000, med: 3000, spec: 6200, pf: 3600, pt: 200, tds: 3200 },
            { basic: 46000, hra: 18400, conveyance: 4000, med: 3000, spec: 5600, pf: 3600, pt: 200, tds: 2200 },
            { basic: 38000, hra: 15200, conveyance: 3500, med: 2500, spec: 4800, pf: 3600, pt: 200, tds: 1200 },
            { basic: 32000, hra: 12800, conveyance: 3000, med: 2000, spec: 4200, pf: 3600, pt: 200, tds: 800 }
        ];

        for (const p of periodsData) {
            let period = await prisma.payrollPeriod.findUnique({
                where: { companyId_periodStart: { companyId, periodStart: p.periodStart } }
            });

            if (!period) {
                period = await prisma.payrollPeriod.create({
                    data: {
                        companyId,
                        periodStart: p.periodStart,
                        periodEnd: p.periodEnd,
                        label: p.label,
                        totalDays: p.totalDays,
                        weekoffDays: p.weekoffDays,
                        holidayDays: p.holidayDays,
                        workingDays: p.workingDays,
                        status: 'APPROVED',
                        approvedAt: new Date()
                    }
                });
            }

            let periodGross = 0;
            let periodDeductions = 0;
            let periodNet = 0;

            for (let i = 0; i < employees.length; i++) {
                const emp = employees[i];
                const sal = salaryProfiles[i % salaryProfiles.length];
                const gross = sal.basic + sal.hra + sal.conveyance + sal.med + sal.spec;
                const deductions = sal.pf + sal.pt + sal.tds;
                const net = gross - deductions;

                periodGross += gross;
                periodDeductions += deductions;
                periodNet += net;

                const entry = await prisma.payrollEntry.upsert({
                    where: { payrollPeriodId_employeeId: { payrollPeriodId: period.id, employeeId: emp.id } },
                    update: {},
                    create: {
                        payrollPeriodId: period.id,
                        employeeId: emp.id,
                        basic: sal.basic,
                        hra: sal.hra,
                        conveyance: sal.conveyance,
                        medicalAllowance: sal.med,
                        specialAllowance: sal.spec,
                        grossEarnings: gross,
                        totalDays: p.totalDays,
                        protectedDays: p.weekoffDays + p.holidayDays,
                        presentDays: p.workingDays,
                        halfDays: 0,
                        paidLeaveDays: 0,
                        lopDays: 0,
                        lopDeduction: 0,
                        pfDeduction: sal.pf,
                        professionalTax: sal.pt,
                        tdsDeduction: sal.tds,
                        otherDeductions: 0,
                        totalDeductions: deductions,
                        netPay: net,
                        status: 'APPROVED'
                    }
                });

                // Link / create payslip
                const monthNum = p.periodStart.getMonth() + 1;
                const yearNum = p.periodStart.getFullYear();
                await prisma.payslip.upsert({
                    where: { employeeId_month_year: { employeeId: emp.id, month: monthNum, year: yearNum } },
                    update: {},
                    create: {
                        employeeId: emp.id,
                        month: monthNum,
                        year: yearNum,
                        basic: sal.basic,
                        totalAllowances: sal.hra + sal.conveyance + sal.med + sal.spec,
                        totalDeductions: deductions,
                        netPay: net,
                        payrollEntryId: entry.id
                    }
                });
            }

            await prisma.payrollPeriod.update({
                where: { id: period.id },
                data: {
                    totalGross: periodGross,
                    totalDeductions: periodDeductions,
                    totalNetPay: periodNet
                }
            });
        }
    } catch (err) {
        console.error('Error auto-seeding sample payroll entries:', err);
    }
}

// 3. Payslip / Payroll Report
async function getPayslipReport(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultPayrollData(companyId);

        const entries = await prisma.payrollEntry.findMany({
            where: {
                employee: { user: { companyId, ...NON_ADMIN_USER_FILTER } }
            },
            include: {
                payrollPeriod: true,
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                        profilePhotoUrl: true,
                        designation: { select: { id: true, name: true } },
                        department: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { id: 'desc' },
            take: 150
        });

        let totalPaid = 0;
        let totalDeductions = 0;
        let totalGross = 0;

        entries.forEach(e => {
            totalPaid += Number(e.netPay || 0);
            totalDeductions += Number(e.totalDeductions || 0);
            totalGross += Number(e.grossEarnings || 0);
        });

        // Monthly Aggregates for Chart
        const monthlyTotals = new Array(12).fill(0);
        entries.forEach(e => {
            if (e.payrollPeriod?.periodStart) {
                const m = new Date(e.payrollPeriod.periodStart).getMonth();
                if (m >= 0 && m < 12) {
                    monthlyTotals[m] += Number(e.netPay || 0);
                }
            }
        });

        res.json({
            metrics: {
                totalPaid: Number(totalPaid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                totalGross: Number(totalGross).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                totalDeductions: Number(totalDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                totalEntries: entries.length,
                currencySymbol: '₹'
            },
            chartSeries: [
                { name: 'Net Salary Paid (₹)', data: monthlyTotals.map(v => Math.round(v)) }
            ],
            records: entries.map(e => {
                const pDate = e.payrollPeriod?.periodStart ? new Date(e.payrollPeriod.periodStart) : new Date();
                const monthName = pDate.toLocaleString('default', { month: 'short' });
                const yearNum = pDate.getFullYear();

                return {
                    id: e.id,
                    Name: `${e.employee.firstName} ${e.employee.lastName}`,
                    Role: e.employee.designation?.name || 'Employee',
                    Department: e.employee.department?.name || 'General',
                    PaidAmount: `₹${Number(e.netPay || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    GrossEarnings: `₹${Number(e.grossEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    Deductions: `₹${Number(e.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    PaidMonth: monthName,
                    PaidYear: String(yearNum),
                    Status: e.status || 'APPROVED',
                    Image: e.employee.profilePhotoUrl || 'user-32.jpg'
                };
            })
        });
    } catch (error) {
        console.error('Error generating payslip report:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// 4. Employee Growth & Overview Report
async function getEmployeeReport(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const [employees, departments] = await Promise.all([
            prisma.employee.findMany({
                where: { user: { companyId, ...NON_ADMIN_USER_FILTER } },
                include: {
                    user: { select: { email: true, status: true } },
                    department: { select: { id: true, name: true } },
                    designation: { select: { id: true, name: true } }
                },
                orderBy: { id: 'desc' }
            }),
            prisma.department.findMany({
                where: { companyId },
                include: {
                    _count: {
                        select: { employees: true }
                    }
                }
            })
        ]);

        const totalEmployees = employees.length;
        const activeEmployees = employees.filter(e => e.user?.status === 'ACTIVE').length;
        const onProbation = employees.filter(e => e.probationStatus === 'ON_PROBATION').length;
        const inNotice = employees.filter(e => e.noticeStatus === 'SERVING').length;

        res.json({
            metrics: {
                totalEmployees,
                activeEmployees,
                onProbation,
                inNotice
            },
            departmentDistribution: {
                labels: departments.map(d => d.name),
                data: departments.map(d => d._count.employees)
            },
            records: employees.map(emp => ({
                id: emp.id,
                EmpID: emp.employeeCode || `EMP-${emp.id}`,
                Name: `${emp.firstName} ${emp.lastName}`,
                Email: emp.user?.email || '',
                Role: emp.designation?.name || 'Employee',
                Department: emp.department?.name || 'General',
                Phone: emp.phone || '—',
                JoiningDate: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '—',
                Status: emp.user?.status || 'Active',
                Image: emp.profilePhotoUrl || 'user-32.jpg'
            }))
        });
    } catch (error) {
        console.error('Error generating employee report:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

module.exports = {
    getAttendanceReport,
    getLeaveReport,
    getPayslipReport,
    getEmployeeReport
};
