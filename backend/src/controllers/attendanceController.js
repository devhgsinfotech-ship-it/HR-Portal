// backend/src/controllers/attendanceController.js
const prisma = require('../config/prisma');

// ── GET TODAY'S ATTENDANCE STATUS FOR LOGGED-IN EMPLOYEE ───
async function getTodayStatus(req, res) {
    try {
        const userId = req.user.id;
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const record = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId: employee.id,
                date: today
            }
        });

        res.json({
            isCheckedIn: !!(record && record.checkIn && !record.checkOut),
            record
        });
    } catch (error) {
        console.error('Error fetching today attendance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── CHECK-IN (Employee) ────────────────────────────────────
async function checkIn(req, res) {
    try {
        const userId = req.user.id;
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let record = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId: employee.id,
                date: today
            }
        });

        if (record && record.checkIn) {
            return res.status(400).json({ message: 'Already checked in today' });
        }

        const now = new Date();

        if (record) {
            record = await prisma.attendanceRecord.update({
                where: { id: record.id },
                data: {
                    checkIn: now,
                    status: 'PRESENT'
                }
            });
        } else {
            record = await prisma.attendanceRecord.create({
                data: {
                    employeeId: employee.id,
                    date: today,
                    checkIn: now,
                    status: 'PRESENT'
                }
            });
        }

        res.json({ message: 'Checked in successfully', record });
    } catch (error) {
        console.error('Error in check-in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── CHECK-OUT (Employee) ───────────────────────────────────
async function checkOut(req, res) {
    try {
        const userId = req.user.id;
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const record = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId: employee.id,
                date: today
            }
        });

        if (!record || !record.checkIn) {
            return res.status(400).json({ message: 'You have not checked in today' });
        }
        if (record.checkOut) {
            return res.status(400).json({ message: 'Already checked out today' });
        }

        const now = new Date();
        const diffMs = now - new Date(record.checkIn);
        const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

        const updatedRecord = await prisma.attendanceRecord.update({
            where: { id: record.id },
            data: {
                checkOut: now,
                workingHours: workingHours
            }
        });

        res.json({ message: 'Checked out successfully', record: updatedRecord });
    } catch (error) {
        console.error('Error in check-out:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── GET ATTENDANCE LOGS (HR vs Employee) ────────────────────
async function getAttendanceLogs(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const role = req.user.role;

        let whereClause = {
            employee: {
                user: { companyId }
            }
        };

        if (role === 'EMPLOYEE') {
            const employee = await prisma.employee.findUnique({ where: { userId } });
            if (!employee) {
                return res.status(404).json({ message: 'Employee profile not found' });
            }
            whereClause.employeeId = employee.id;
        }

        const records = await prisma.attendanceRecord.findMany({
            where: whereClause,
            include: {
                employee: {
                    include: {
                        user: true,
                        department: true,
                        designation: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        res.json(records);
    } catch (error) {
        console.error('Error fetching attendance logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getTodayStatus,
    checkIn,
    checkOut,
    getAttendanceLogs
};
