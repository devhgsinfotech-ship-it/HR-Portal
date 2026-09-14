// backend/src/controllers/payrollController.js
// Keka-style Payroll Engine for HGS HR Portal
// ─────────────────────────────────────────────────────────────────────────────
// Payroll Flow:
//  1. HR configures payroll cycle start day (per company)
//  2. HR starts a new PayrollPeriod for a given month
//  3. System reconciles attendance/leaves per employee
//  4. HR calculates payroll batch (engine runs the math)
//  5. HR reviews & optionally overrides individual entries
//  6. HR approves → PayrollPeriod is LOCKED, Payslips generated
//  7. Employees can view their payslips
// ─────────────────────────────────────────────────────────────────────────────

const prisma = require('../config/prisma');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computePeriodDates(cycleStartDay, month, year) {
    const startDay = Math.min(Math.max(cycleStartDay, 1), 28);
    let periodStart, periodEnd;

    if (startDay === 1) {
        periodStart = new Date(year, month - 1, 1);
        periodEnd   = new Date(year, month, 0);
    } else {
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear  = month === 1 ? year - 1 : year;
        periodStart = new Date(prevYear, prevMonth - 1, startDay);
        periodEnd   = new Date(year, month - 1, startDay - 1);
    }

    const msPerDay  = 24 * 60 * 60 * 1000;
    const totalDays = Math.round((periodEnd - periodStart) / msPerDay) + 1;
    return { periodStart, periodEnd, totalDays };
}

function getDatesInRange(start, end) {
    const dates = [];
    const cur = new Date(start);
    while (cur <= end) {
        dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

function dayName(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function toDateStr(d) {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ─── Attendance reconciliation helper ────────────────────────────────────────
async function reconcileEmployee(emp, period, weekOffDayNames, holidayDateStrings, allDates) {
    const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
            employeeId: emp.id,
            date: { gte: period.periodStart, lte: period.periodEnd }
        }
    });

    const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
            employeeId: emp.id,
            status: 'APPROVED',
            startDate: { lte: period.periodEnd },
            endDate:   { gte: period.periodStart }
        },
        include: { leaveType: { select: { isPaid: true } } }
    });

    const attMap = {};
    for (const rec of attendanceRecords) {
        attMap[toDateStr(new Date(rec.date))] = rec;
    }

    const paidLeaveDates   = new Set();
    const unpaidLeaveDates = new Set();

    for (const leave of approvedLeaves) {
        const lStart = new Date(Math.max(new Date(leave.startDate), new Date(period.periodStart)));
        const lEnd   = new Date(Math.min(new Date(leave.endDate),   new Date(period.periodEnd)));
        const lDates = getDatesInRange(lStart, lEnd);
        for (const ld of lDates) {
            const ds = toDateStr(ld);
            if (leave.leaveType.isPaid) paidLeaveDates.add(ds);
            else unpaidLeaveDates.add(ds);
        }
    }

    let presentDays  = 0;
    let halfDays     = 0;
    let lopDays      = 0;
    let paidLeaveCnt = 0;
    let protectedDays = 0;

    for (const d of allDates) {
        const ds = toDateStr(d);
        const dn = dayName(d);

        if (weekOffDayNames.includes(dn) || holidayDateStrings.has(ds)) {
            protectedDays++;
            continue;
        }
        if (paidLeaveDates.has(ds)) { paidLeaveCnt++; continue; }

        const rec    = attMap[ds];
        const status = rec ? rec.status : null;

        if (!status || status === 'ABSENT') {
            lopDays++;
        } else if (status === 'PRESENT' || status === 'IRREGULAR' || status === 'FLAGGED') {
            presentDays++;
        } else if (status === 'HALF_DAY' || status === 'MISSING_PUNCH') {
            halfDays    += 0.5;
            presentDays += 0.5;
        } else if (status === 'ON_LEAVE') {
            if (paidLeaveDates.has(ds)) paidLeaveCnt++;
            else lopDays++;
        }
    }

    return { presentDays, halfDays, lopDays, paidLeaveCnt, protectedDays };
}

// ─── 1. GET / SET PAYROLL POLICY ─────────────────────────────────────────────

async function getPayrollPolicy(req, res) {
    try {
        const companyId = req.user.companyId;
        const settings  = await prisma.companySetting.findUnique({ where: { companyId } });
        res.json({
            payrollCycleStartDay: settings?.payrollCycleStartDay ?? 1,
            currency:  settings?.currency  ?? 'INR',
            timezone:  settings?.timezone  ?? 'Asia/Kolkata'
        });
    } catch (err) {
        console.error('[payroll] getPayrollPolicy:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updatePayrollPolicy(req, res) {
    try {
        const companyId = req.user.companyId;
        const day = parseInt(req.body.payrollCycleStartDay, 10);
        if (isNaN(day) || day < 1 || day > 28) {
            return res.status(400).json({ message: 'payrollCycleStartDay must be 1-28' });
        }
        const settings = await prisma.companySetting.upsert({
            where:  { companyId },
            update: { payrollCycleStartDay: day },
            create: { companyId, payrollCycleStartDay: day }
        });
        res.json({ message: 'Payroll policy updated', settings });
    } catch (err) {
        console.error('[payroll] updatePayrollPolicy:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 2. LIST PAYROLL PERIODS ──────────────────────────────────────────────────

async function listPayrollPeriods(req, res) {
    try {
        const companyId = req.user.companyId;
        const periods   = await prisma.payrollPeriod.findMany({
            where:   { companyId },
            orderBy: { periodStart: 'desc' },
            include: { _count: { select: { entries: true } } }
        });
        res.json(periods);
    } catch (err) {
        console.error('[payroll] listPayrollPeriods:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 3. START A NEW PAYROLL PERIOD ───────────────────────────────────────────

async function startPayrollPeriod(req, res) {
    try {
        const companyId = req.user.companyId;
        const m = parseInt(req.body.month, 10);
        const y = parseInt(req.body.year,  10);
        if (!m || !y || m < 1 || m > 12 || y < 2000) {
            return res.status(400).json({ message: 'Valid month (1-12) and year are required' });
        }

        const settings = await prisma.companySetting.findUnique({ where: { companyId } });
        const cycleStartDay = settings?.payrollCycleStartDay ?? 1;

        const policy = await prisma.attendancePolicy.findUnique({ where: { companyId } });
        const weekOffDayNames = (policy?.weekOffDays ?? 'Saturday,Sunday')
            .split(',').map(d => d.trim().substring(0, 3));

        const { periodStart, periodEnd, totalDays } = computePeriodDates(cycleStartDay, m, y);

        const existing = await prisma.payrollPeriod.findUnique({
            where: { companyId_periodStart: { companyId, periodStart } }
        });
        if (existing) {
            return res.status(409).json({ message: 'Period already exists', period: existing });
        }

        const holidays = await prisma.holiday.findMany({
            where: { companyId, holidayDate: { gte: periodStart, lte: periodEnd } }
        });
        const holidayDateStrings = new Set(holidays.map(h => toDateStr(new Date(h.holidayDate))));
        const allDates = getDatesInRange(periodStart, periodEnd);

        let weekoffCount = 0, holidayCount = 0;
        for (const d of allDates) {
            const dn = dayName(d);
            const ds = toDateStr(d);
            if (weekOffDayNames.includes(dn)) weekoffCount++;
            else if (holidayDateStrings.has(ds)) holidayCount++;
        }

        const workingDays = totalDays - weekoffCount - holidayCount;
        const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const period = await prisma.payrollPeriod.create({
            data: { companyId, periodStart, periodEnd, label, totalDays, weekoffDays: weekoffCount, holidayDays: holidayCount, workingDays, status: 'DRAFT' }
        });

        res.status(201).json({ message: 'Payroll period created', period });
    } catch (err) {
        console.error('[payroll] startPayrollPeriod:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 4. GET ATTENDANCE INPUTS (reconciliation view) ──────────────────────────

async function getPayrollInputs(req, res) {
    try {
        const companyId = req.user.companyId;
        const period    = await prisma.payrollPeriod.findUnique({ where: { id: parseInt(req.params.periodId) } });
        if (!period || period.companyId !== companyId) {
            return res.status(404).json({ message: 'Payroll period not found' });
        }

        const policy = await prisma.attendancePolicy.findUnique({ where: { companyId } });
        const weekOffDayNames = (policy?.weekOffDays ?? 'Saturday,Sunday')
            .split(',').map(d => d.trim().substring(0, 3));

        const holidays = await prisma.holiday.findMany({
            where: { companyId, holidayDate: { gte: period.periodStart, lte: period.periodEnd } }
        });
        const holidayDateStrings = new Set(holidays.map(h => toDateStr(new Date(h.holidayDate))));
        const allDates = getDatesInRange(new Date(period.periodStart), new Date(period.periodEnd));

        const employees = await prisma.employee.findMany({
            where: { user: { companyId } },
            include: {
                user:           { select: { accountStatus: true } },
                salaryStructure: true,
                department:     { select: { name: true } },
                designation:    { select: { name: true } }
            }
        });

        const inputs = [];
        for (const emp of employees) {
            const { presentDays, halfDays, lopDays, paidLeaveCnt, protectedDays } =
                await reconcileEmployee(emp, period, weekOffDayNames, holidayDateStrings, allDates);

            inputs.push({
                employeeId:   emp.id,
                employeeCode: emp.employeeCode,
                name: `${emp.firstName} ${emp.lastName}`,
                department:   emp.department?.name,
                designation:  emp.designation?.name,
                hasSalaryConfig: !!emp.salaryStructure,
                salary: { grossSalary: emp.salaryStructure?.grossSalary ?? 0, basic: emp.salaryStructure?.basic ?? 0 },
                attendance: {
                    totalDays:    period.totalDays,
                    presentDays,
                    halfDays,
                    paidLeaveDays: paidLeaveCnt,
                    lopDays,
                    weekoffDays:  period.weekoffDays,
                    holidayDays:  period.holidayDays,
                    workingDays:  period.workingDays
                }
            });
        }

        await prisma.payrollPeriod.update({ where: { id: period.id }, data: { status: 'INPUTS_REVIEWED' } });
        res.json({ period, inputs });
    } catch (err) {
        console.error('[payroll] getPayrollInputs:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 5. CALCULATE PAYROLL BATCH ───────────────────────────────────────────────

async function calculatePayrollBatch(req, res) {
    try {
        const companyId = req.user.companyId;
        const period    = await prisma.payrollPeriod.findUnique({ where: { id: parseInt(req.params.periodId) } });
        if (!period || period.companyId !== companyId) return res.status(404).json({ message: 'Period not found' });
        if (period.status === 'LOCKED' || period.status === 'APPROVED') {
            return res.status(400).json({ message: 'Cannot recalculate a locked/approved payroll' });
        }

        const policy = await prisma.attendancePolicy.findUnique({ where: { companyId } });
        const weekOffDayNames = (policy?.weekOffDays ?? 'Saturday,Sunday')
            .split(',').map(d => d.trim().substring(0, 3));

        const holidays = await prisma.holiday.findMany({
            where: { companyId, holidayDate: { gte: period.periodStart, lte: period.periodEnd } }
        });
        const holidayDateStrings = new Set(holidays.map(h => toDateStr(new Date(h.holidayDate))));
        const allDates = getDatesInRange(new Date(period.periodStart), new Date(period.periodEnd));

        const employees = await prisma.employee.findMany({
            where:   { user: { companyId } },
            include: { salaryStructure: true }
        });

        let aggGross = 0, aggDeductions = 0, aggNet = 0, count = 0;

        for (const emp of employees) {
            if (!emp.salaryStructure) continue;
            const sal = emp.salaryStructure;

            const { presentDays, halfDays, lopDays, paidLeaveCnt, protectedDays } =
                await reconcileEmployee(emp, period, weekOffDayNames, holidayDateStrings, allDates);

            const parse = v => parseFloat(v ?? 0);
            const basicVal     = parse(sal.basic);
            const hraVal       = parse(sal.hra);
            const conveyVal    = parse(sal.conveyance);
            const medVal       = parse(sal.medicalAllowance);
            const specVal      = parse(sal.specialAllowance);
            const bonusVal     = parse(sal.bonus);
            const grossEarnings = parseFloat((basicVal + hraVal + conveyVal + medVal + specVal + bonusVal).toFixed(2));

            const dailyRate    = grossEarnings / period.totalDays;
            const lopDeduction = parseFloat((dailyRate * lopDays).toFixed(2));

            const pfDed      = parse(sal.pfDeduction);
            const profTax    = parse(sal.professionalTax);
            const tdsDed     = parse(sal.tdsDeduction);
            const otherDed   = parse(sal.otherDeductions);
            const totalDeductions = parseFloat((lopDeduction + pfDed + profTax + tdsDed + otherDed).toFixed(2));
            const netPay     = parseFloat(Math.max(0, grossEarnings - totalDeductions).toFixed(2));

            aggGross      += grossEarnings;
            aggDeductions += totalDeductions;
            aggNet        += netPay;
            count++;

            await prisma.payrollEntry.upsert({
                where:  { payrollPeriodId_employeeId: { payrollPeriodId: period.id, employeeId: emp.id } },
                update: {
                    basic: basicVal, hra: hraVal, conveyance: conveyVal,
                    medicalAllowance: medVal, specialAllowance: specVal, bonus: bonusVal,
                    grossEarnings, totalDays: period.totalDays, protectedDays,
                    paidLeaveDays: paidLeaveCnt, presentDays, halfDays, lopDays,
                    lopDeduction, pfDeduction: pfDed, professionalTax: profTax,
                    tdsDeduction: tdsDed, otherDeductions: otherDed, totalDeductions, netPay, status: 'DRAFT'
                },
                create: {
                    payrollPeriodId: period.id, employeeId: emp.id,
                    basic: basicVal, hra: hraVal, conveyance: conveyVal,
                    medicalAllowance: medVal, specialAllowance: specVal, bonus: bonusVal,
                    grossEarnings, totalDays: period.totalDays, protectedDays,
                    paidLeaveDays: paidLeaveCnt, presentDays, halfDays, lopDays,
                    lopDeduction, pfDeduction: pfDed, professionalTax: profTax,
                    tdsDeduction: tdsDed, otherDeductions: otherDed, totalDeductions, netPay, status: 'DRAFT'
                }
            });
        }

        await prisma.payrollPeriod.update({
            where: { id: period.id },
            data: {
                status:          'CALCULATED',
                totalGross:      parseFloat(aggGross.toFixed(2)),
                totalDeductions: parseFloat(aggDeductions.toFixed(2)),
                totalNetPay:     parseFloat(aggNet.toFixed(2))
            }
        });

        res.json({
            message: `Payroll calculated for ${count} employees`,
            periodId: period.id,
            totalGross: parseFloat(aggGross.toFixed(2)),
            totalDeductions: parseFloat(aggDeductions.toFixed(2)),
            totalNetPay: parseFloat(aggNet.toFixed(2)),
            employeeCount: count
        });
    } catch (err) {
        console.error('[payroll] calculatePayrollBatch:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 6. GET PAYROLL ENTRIES ───────────────────────────────────────────────────

async function getPayrollEntries(req, res) {
    try {
        const companyId = req.user.companyId;
        const period    = await prisma.payrollPeriod.findUnique({ where: { id: parseInt(req.params.periodId) } });
        if (!period || period.companyId !== companyId) return res.status(404).json({ message: 'Period not found' });

        const entries = await prisma.payrollEntry.findMany({
            where:   { payrollPeriodId: period.id },
            include: {
                employee: {
                    include: {
                        user:        { select: { email: true } },
                        department:  { select: { name: true } },
                        designation: { select: { name: true } }
                    }
                }
            },
            orderBy: { employee: { firstName: 'asc' } }
        });

        res.json({ period, entries });
    } catch (err) {
        console.error('[payroll] getPayrollEntries:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 7. HR OVERRIDE ───────────────────────────────────────────────────────────

async function overridePayrollEntry(req, res) {
    try {
        const companyId = req.user.companyId;
        const entry     = await prisma.payrollEntry.findUnique({
            where:   { id: parseInt(req.params.entryId) },
            include: { payrollPeriod: true }
        });
        if (!entry || entry.payrollPeriod.companyId !== companyId) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        if (['LOCKED', 'APPROVED'].includes(entry.payrollPeriod.status)) {
            return res.status(400).json({ message: 'Cannot override locked/approved entry' });
        }

        const parse = (v, fallback) => v !== undefined ? parseFloat(v) : parseFloat(fallback);
        const newLopDays         = parse(req.body.lopDays,         entry.lopDays);
        const newBonus           = parse(req.body.bonus,           entry.bonus);
        const newOtherDeductions = parse(req.body.otherDeductions, entry.otherDeductions);

        const grossEarnings = parseFloat(entry.basic) + parseFloat(entry.hra) + parseFloat(entry.conveyance) +
            parseFloat(entry.medicalAllowance) + parseFloat(entry.specialAllowance) + newBonus;

        const dailyRate    = grossEarnings / entry.payrollPeriod.totalDays;
        const lopDeduction = parseFloat((dailyRate * newLopDays).toFixed(2));

        const totalDeductions = parseFloat((
            lopDeduction + parseFloat(entry.pfDeduction) + parseFloat(entry.professionalTax) +
            parseFloat(entry.tdsDeduction) + newOtherDeductions
        ).toFixed(2));

        const netPay = parseFloat(Math.max(0, grossEarnings - totalDeductions).toFixed(2));

        const updated = await prisma.payrollEntry.update({
            where: { id: entry.id },
            data: {
                bonus: newBonus, grossEarnings, lopDays: newLopDays, lopDeduction,
                otherDeductions: newOtherDeductions, totalDeductions, netPay,
                hrRemarks: req.body.hrRemarks ?? entry.hrRemarks,
                status: 'OVERRIDDEN'
            }
        });

        res.json({ message: 'Entry overridden', entry: updated });
    } catch (err) {
        console.error('[payroll] overridePayrollEntry:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 8. APPROVE PAYROLL & GENERATE PAYSLIPS ──────────────────────────────────

async function approvePayrollPeriod(req, res) {
    try {
        const companyId = req.user.companyId;
        const period    = await prisma.payrollPeriod.findUnique({
            where:   { id: parseInt(req.params.periodId) },
            include: { entries: true }
        });
        if (!period || period.companyId !== companyId) return res.status(404).json({ message: 'Period not found' });
        if (period.status === 'LOCKED') return res.status(400).json({ message: 'Already locked' });
        if (period.status !== 'CALCULATED') {
            return res.status(400).json({ message: `Cannot approve in '${period.status}' status. Run calculate first.` });
        }

        await prisma.payrollEntry.updateMany({ where: { payrollPeriodId: period.id }, data: { status: 'APPROVED' } });

        const periodDate = new Date(period.periodEnd);
        const slipMonth  = periodDate.getMonth() + 1;
        const slipYear   = periodDate.getFullYear();

        let created = 0;
        for (const entry of period.entries) {
            const totalAllowances = parseFloat(entry.hra) + parseFloat(entry.conveyance) +
                parseFloat(entry.medicalAllowance) + parseFloat(entry.specialAllowance) + parseFloat(entry.bonus);

            await prisma.payslip.upsert({
                where:  { employeeId_month_year: { employeeId: entry.employeeId, month: slipMonth, year: slipYear } },
                update: {
                    basic: parseFloat(entry.basic),
                    totalAllowances: parseFloat(totalAllowances.toFixed(2)),
                    totalDeductions: parseFloat(entry.totalDeductions),
                    netPay: parseFloat(entry.netPay),
                    generatedAt: new Date(),
                    payrollEntryId: entry.id
                },
                create: {
                    employeeId: entry.employeeId, month: slipMonth, year: slipYear,
                    basic: parseFloat(entry.basic),
                    totalAllowances: parseFloat(totalAllowances.toFixed(2)),
                    totalDeductions: parseFloat(entry.totalDeductions),
                    netPay: parseFloat(entry.netPay),
                    payrollEntryId: entry.id
                }
            });
            created++;
        }

        await prisma.payrollPeriod.update({
            where: { id: period.id },
            data: { status: 'LOCKED', approvedAt: new Date(), approvedById: req.user.id }
        });

        res.json({ message: `Approved. ${created} payslips generated.`, payslipsCreated: created, periodId: period.id });
    } catch (err) {
        console.error('[payroll] approvePayrollPeriod:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 9. GET PAYSLIPS ──────────────────────────────────────────────────────────

async function getPayslips(req, res) {
    try {
        const { companyId, id: userId, role } = req.user;
        const { employeeId, month, year, ownOnly } = req.query;
        let where = {};

        if (role === 'EMPLOYEE' || ownOnly === 'true') {
            const emp = await prisma.employee.findUnique({ where: { userId } });
            if (!emp) return res.json([]);
            where.employeeId = emp.id;
        } else if (employeeId) {
            where.employeeId = parseInt(employeeId);
        } else {
            where.employee = { user: { companyId } };
        }
        if (month) where.month = parseInt(month);
        if (year)  where.year  = parseInt(year);

        const payslips = await prisma.payslip.findMany({
            where,
            include: {
                employee: {
                    include: {
                        user:        { select: { email: true } },
                        department:  { select: { name: true } },
                        designation: { select: { name: true } }
                    }
                },
                payrollEntry: true
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });

        res.json(payslips);
    } catch (err) {
        console.error('[payroll] getPayslips:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 10. GET SINGLE PAYSLIP DETAIL ───────────────────────────────────────────

async function getPayslipDetail(req, res) {
    try {
        const { companyId, id: userId, role } = req.user;
        const payslip = await prisma.payslip.findUnique({
            where: { id: parseInt(req.params.payslipId) },
            include: {
                employee: {
                    include: {
                        user:        { select: { email: true, companyId: true } },
                        department:  { select: { name: true } },
                        designation: { select: { name: true } },
                        bankDetails: true
                    }
                },
                payrollEntry: { include: { payrollPeriod: true } }
            }
        });
        if (!payslip) return res.status(404).json({ message: 'Payslip not found' });

        if (role === 'EMPLOYEE') {
            const emp = await prisma.employee.findUnique({ where: { userId } });
            if (!emp || emp.id !== payslip.employeeId) return res.status(403).json({ message: 'Access denied' });
        } else if (payslip.employee?.user?.companyId !== companyId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(payslip);
    } catch (err) {
        console.error('[payroll] getPayslipDetail:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ─── 11. SALARY STRUCTURES ────────────────────────────────────────────────────

async function listSalaryStructures(req, res) {
    try {
        const companyId = req.user.companyId;
        const structures = await prisma.salaryStructure.findMany({
            where: { employee: { user: { companyId } } },
            include: {
                employee: {
                    include: {
                        user:        { select: { email: true } },
                        department:  { select: { name: true } },
                        designation: { select: { name: true } }
                    }
                }
            }
        });
        res.json(structures);
    } catch (err) {
        console.error('[payroll] listSalaryStructures:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function upsertSalaryStructure(req, res) {
    try {
        const companyId  = req.user.companyId;
        const employeeId = parseInt(req.params.employeeId);
        const emp = await prisma.employee.findFirst({ where: { id: employeeId, user: { companyId } } });
        if (!emp) return res.status(404).json({ message: 'Employee not found' });

        const parse = (v, def = 0) => parseFloat(v ?? def);
        const basicVal     = parse(req.body.basic);
        const hraVal       = parse(req.body.hra);
        const conveyVal    = parse(req.body.conveyance);
        const medVal       = parse(req.body.medicalAllowance);
        const specVal      = parse(req.body.specialAllowance);
        const bonusVal     = parse(req.body.bonus);
        const pfDedVal     = parse(req.body.pfDeduction);
        const pfEmpVal     = parse(req.body.pfEmployer);
        const profTaxVal   = parse(req.body.professionalTax);
        const tdsVal       = parse(req.body.tdsDeduction);
        const otherDedVal  = parse(req.body.otherDeductions);

        const grossSalary = parseFloat((basicVal + hraVal + conveyVal + medVal + specVal + bonusVal).toFixed(2));
        const netSalary   = parseFloat(Math.max(0, grossSalary - pfDedVal - profTaxVal - tdsVal - otherDedVal).toFixed(2));

        const structure = await prisma.salaryStructure.upsert({
            where:  { employeeId },
            update: {
                basic: basicVal, hra: hraVal, conveyance: conveyVal,
                medicalAllowance: medVal, specialAllowance: specVal,
                bonus: bonusVal, pfDeduction: pfDedVal, pfEmployer: pfEmpVal,
                professionalTax: profTaxVal, tdsDeduction: tdsVal,
                otherDeductions: otherDedVal, grossSalary, netSalary, effectiveFrom: new Date()
            },
            create: {
                employeeId, basic: basicVal, hra: hraVal, conveyance: conveyVal,
                medicalAllowance: medVal, specialAllowance: specVal,
                bonus: bonusVal, pfDeduction: pfDedVal, pfEmployer: pfEmpVal,
                professionalTax: profTaxVal, tdsDeduction: tdsVal,
                otherDeductions: otherDedVal, grossSalary, netSalary
            }
        });

        res.json({ message: 'Salary structure saved', structure });
    } catch (err) {
        console.error('[payroll] upsertSalaryStructure:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getPayrollPolicy, updatePayrollPolicy,
    listPayrollPeriods, startPayrollPeriod,
    getPayrollInputs, calculatePayrollBatch,
    getPayrollEntries, overridePayrollEntry,
    approvePayrollPeriod,
    getPayslips, getPayslipDetail,
    listSalaryStructures, upsertSalaryStructure
};
