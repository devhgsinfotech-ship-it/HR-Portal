// backend/src/controllers/attendanceController.js
const prisma = require('../config/prisma');

// ── GET TODAY'S ATTENDANCE STATUS FOR LOGGED-IN EMPLOYEE ───
async function getTodayStatus(req, res) {
    try {
        const userId = req.user.id;
        let employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) {
            return res.json({ isCheckedIn: false, record: null });
        }

        // Use date range to handle UTC/timezone offset reliably
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const record = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId: employee.id,
                date: { gte: todayStart, lte: todayEnd }
            }
        });

        // ── DETECT INCOMPLETE SESSION FROM A PREVIOUS DAY ───────────
        // Find the most recent record that has a punch-in but NO punch-out
        // and is NOT today (i.e., a forgotten session from a previous day)
        const incompleteYesterday = await prisma.attendanceRecord.findFirst({
            where: {
                employeeId: employee.id,
                checkIn: { not: null },
                checkOut: null,
                date: { lt: todayStart }  // strictly before today
            },
            orderBy: { date: 'desc' }  // get the most recent one
        });

        res.json({
            isCheckedIn: !!(record && record.checkIn && !record.checkOut),
            record,
            employee,
            incompleteYesterday: incompleteYesterday || null
        });
    } catch (error) {
        console.error('Error fetching today attendance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── CHECK-IN (Employee / HR / Admin) ─────────────────────────
async function checkIn(req, res) {
    try {
        const userId = req.user.id;
        let employee = await prisma.employee.findUnique({ where: { userId } });
        
        // Auto-create employee profile for HR/Admin if it doesn't exist yet
        if (!employee && (req.user.role === 'HR' || req.user.role === 'SUPER_ADMIN' || req.user.role === 'MANAGER')) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ message: 'User not found' });

            // Generate a unique employee code
            const code = `EMP-${user.companyId || 0}-${user.id}`;
            const existing = await prisma.employee.findUnique({ where: { employeeCode: code } });
            
            employee = await prisma.employee.create({
                data: {
                    userId: user.id,
                    employeeCode: existing ? `${code}-${Date.now()}` : code,
                    firstName: user.name?.split(' ')[0] || 'Admin',
                    lastName: user.name?.split(' ').slice(1).join(' ') || '',
                    dateOfJoining: new Date(),
                    employmentType: 'FULL_TIME'
                }
            });
        } else if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found. Please contact HR to set up your employee profile.' });
        }

        // Use date range to handle UTC/timezone offset reliably
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let record = await prisma.attendanceRecord.findFirst({
            where: { employeeId: employee.id, date: { gte: todayStart, lte: todayEnd } }
        });

        if (record && record.checkIn) {
            return res.status(400).json({ message: 'Already checked in today' });
        }

        const now = new Date();

        if (record) {
            record = await prisma.attendanceRecord.update({
                where: { id: record.id },
                data: { checkIn: now, status: 'PRESENT' }
            });
        } else {
            record = await prisma.attendanceRecord.create({
                data: {
                    employeeId: employee.id,
                    date: todayStart,
                    checkIn: now,
                    status: 'PRESENT'
                }
            });
        }

        res.json({ message: 'Checked in successfully', record });
    } catch (error) {
        console.error('Error in check-in:', error);
        res.status(500).json({ message: 'Server error during check-in: ' + error.message });
    }
}

// ── CHECK-OUT (Employee) ───────────────────────────────────
// ── CHECK-OUT (Employee / HR / Admin) ─────────────────────────
async function checkOut(req, res) {
    try {
        const userId = req.user.id;
        let employee = await prisma.employee.findUnique({ where: { userId } });
        
        // Auto-create employee profile for HR/Admin if missing (edge case)
        if (!employee && (req.user.role === 'HR' || req.user.role === 'SUPER_ADMIN' || req.user.role === 'MANAGER')) {
            return res.status(400).json({ message: 'You have not checked in today' });
        } else if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        // Use date range to handle UTC/timezone offset reliably
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const record = await prisma.attendanceRecord.findFirst({
            where: { employeeId: employee.id, date: { gte: todayStart, lte: todayEnd } }
        });

        if (!record || !record.checkIn) {
            return res.status(400).json({ message: 'You have not checked in today' });
        }
        if (record.checkOut) {
            return res.status(400).json({ message: 'Already checked out today' });
        }

        const now = new Date();
        // Net working hours = total time on shift MINUS break time
        const totalDiffMs = now - new Date(record.checkIn);
        
        // Auto-close break if they punch out while on a break
        let finalBreakOut = record.breakOut;
        if (record.breakIn && !record.breakOut) {
            finalBreakOut = now;
        }

        let breakDiffMs = 0;
        if (record.breakIn && finalBreakOut) {
            const bDiff = new Date(finalBreakOut) - new Date(record.breakIn);
            breakDiffMs = Math.max(0, bDiff);
        }
        const workingHours = parseFloat(((totalDiffMs - breakDiffMs) / (1000 * 60 * 60)).toFixed(2));

        // Smart Status Evaluation based on Policy
        const user = await prisma.user.findUnique({ where: { id: userId } });
        let newStatus = 'PRESENT';
        
        if (user && user.companyId) {
            const policy = await prisma.attendancePolicy.findUnique({ where: { companyId: user.companyId } });
            const minHalfDay = policy ? parseFloat(policy.minimumHoursForHalfDay.toString()) : 4.0;
            const minFullDay = policy ? parseFloat(policy.minimumHoursForFullDay.toString()) : 8.0;

            if (workingHours < minHalfDay) {
                newStatus = 'IRREGULAR';
            } else if (workingHours >= minHalfDay && workingHours < minFullDay) {
                newStatus = 'HALF_DAY';
            }
        }

        const updatedRecord = await prisma.attendanceRecord.update({
            where: { id: record.id },
            data: { 
                checkOut: now, 
                breakOut: finalBreakOut, 
                workingHours, 
                status: newStatus 
            }
        });

        res.json({ message: 'Checked out successfully', record: updatedRecord });
    } catch (error) {
        console.error('Error during check-out:', error);
        res.status(500).json({ message: 'Server error during check-out: ' + error.message });
    }
}

// ── BREAK-IN (Employee) ───────────────────────────────────
async function breakIn(req, res) {
    try {
        const userId = req.user.id;
        let employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const record = await prisma.attendanceRecord.findFirst({
            where: { employeeId: employee.id, date: { gte: todayStart, lte: todayEnd } }
        });

        if (!record || !record.checkIn) {
            return res.status(400).json({ message: 'You have not checked in today' });
        }
        if (record.checkOut) {
            return res.status(400).json({ message: 'Already checked out today' });
        }
        if (record.breakIn && !record.breakOut) {
            return res.status(400).json({ message: 'You are already on a break' });
        }

        const now = new Date();
        const updatedRecord = await prisma.attendanceRecord.update({
            where: { id: record.id },
            data: { breakIn: now, breakOut: null } // Reset breakOut for a new break
        });

        res.json({ message: 'Break started successfully', record: updatedRecord });
    } catch (error) {
        console.error('Error during break-in:', error);
        res.status(500).json({ message: 'Server error during break-in: ' + error.message });
    }
}

// ── BREAK-OUT (Employee) ───────────────────────────────────
async function breakOut(req, res) {
    try {
        const userId = req.user.id;
        let employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const record = await prisma.attendanceRecord.findFirst({
            where: { employeeId: employee.id, date: { gte: todayStart, lte: todayEnd } }
        });

        if (!record || !record.checkIn) {
            return res.status(400).json({ message: 'You have not checked in today' });
        }
        if (!record.breakIn || record.breakOut) {
            return res.status(400).json({ message: 'You are not currently on a break' });
        }

        const now = new Date();
        
        const updatedRecord = await prisma.attendanceRecord.update({
            where: { id: record.id },
            data: { breakOut: now }
        });

        res.json({ message: 'Break ended successfully', record: updatedRecord });
    } catch (error) {
        console.error('Error during break-out:', error);
        res.status(500).json({ message: 'Server error during break-out: ' + error.message });
    }
}

// ── GET ATTENDANCE LOGS (HR sees all | Employee sees own) ────────────────────────
async function getAttendanceLogs(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const role = req.user.role;
        const isMine = req.query.mine === 'true';

        // Employee always sees only their own. HR/Manager sees all unless ?mine=true
        const shouldFilterByEmployee = role === 'EMPLOYEE' || isMine;

        let whereClause = {};

        if (shouldFilterByEmployee) {
            const employee = await prisma.employee.findUnique({ where: { userId } });
            if (!employee) return res.json([]);
            whereClause.employeeId = employee.id;
        } else if (role === 'MANAGER') {
            const managerEmployee = await prisma.employee.findUnique({ where: { userId } });
            if (!managerEmployee) return res.json([]);
            whereClause.employee = { 
                user: { companyId },
                reportingManagerId: managerEmployee.id 
            };
        } else {
            // HR/Admin: filter by company
            if (companyId) {
                whereClause.employee = { user: { companyId } };
            }
        }

        const records = await prisma.attendanceRecord.findMany({
            where: whereClause,
            include: {
                employee: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } },
                        department: true,
                        designation: true
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: 200
        });

        // Fetch policy and settings for dynamic calculations
        let policy = null;
        let settings = null;
        if (companyId) {
            policy = await prisma.attendancePolicy.findUnique({ where: { companyId } });
            settings = await prisma.companySetting.findUnique({ where: { companyId } });
        }

        const minFullDay = policy ? parseFloat(policy.minimumHoursForFullDay.toString()) : 8.0;
        const officeStartTime = settings?.officeStartTime || "09:00";
        const gracePeriod = policy?.lateGracePeriod || 15;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Add dynamic Keka-style calculations
        const enrichedRecords = records.map(record => {
            let lateMinutes = 0;
            let overtimeHours = 0;
            let breakMinutes = 0;
            let status = record.status;
            let workingHours = record.workingHours || 0;

            // Keka HRMS Rule: If record is from a past day and employee punched in but NEVER punched out,
            // treat it as MISSING_PUNCH (incomplete attendance) instead of assuming a full Present day.
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            if (recordDate < todayStart && record.checkIn && !record.checkOut) {
                status = 'MISSING_PUNCH';
                workingHours = 0;
            }

            // Calculate Late
            if (record.checkIn && officeStartTime) {
                const checkInDate = new Date(record.checkIn);
                
                // Get local time in the specified timezone to avoid Docker/Node UTC vs Local mismatches
                const formatter = new Intl.DateTimeFormat('en-US', { 
                    timeZone: settings?.timezone || 'Asia/Kolkata', 
                    hour: 'numeric', minute: 'numeric', hour12: false 
                });
                const parts = formatter.formatToParts(checkInDate);
                const actualHour = parseInt(parts.find(p => p.type === 'hour').value) % 24;
                const actualMin = parseInt(parts.find(p => p.type === 'minute').value);
                
                const [startHour, startMin] = officeStartTime.split(':').map(Number);
                
                const thresholdMinutes = startHour * 60 + startMin + gracePeriod;
                const actualMinutes = actualHour * 60 + actualMin;

                if (actualMinutes > thresholdMinutes) {
                    lateMinutes = actualMinutes - thresholdMinutes;
                }
            }

            // Calculate Overtime
            if (workingHours && workingHours > minFullDay) {
                overtimeHours = parseFloat((workingHours - minFullDay).toFixed(2));
            }

            // Calculate Break (if they took a break today and ended it)
            if (record.breakIn && record.breakOut) {
                const raw = Math.floor((new Date(record.breakOut) - new Date(record.breakIn)) / (1000 * 60));
                breakMinutes = Math.max(0, raw); // guard: never negative
            } else if (record.breakIn && !record.breakOut) {
                // Currently on break — live count
                const raw = Math.floor((new Date() - new Date(record.breakIn)) / (1000 * 60));
                breakMinutes = Math.max(0, raw);
            }

            return {
                ...record,
                status,
                workingHours,
                lateMinutes,
                overtimeHours,
                breakMinutes
            };
        });

        res.json(enrichedRecords);
    } catch (error) {
        console.error('Error fetching attendance logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── SUBMIT REGULARIZATION REQUEST (Employee) ────────────────
async function submitRegularization(req, res) {
    try {
        const { recordId, requestedCheckIn, requestedCheckOut, requestedBreakOut, requestedBreakDuration, reason } = req.body;
        const userId = req.user.id;
        
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const record = await prisma.attendanceRecord.findUnique({ where: { id: parseInt(recordId) } });
        if (!record || record.employeeId !== employee.id) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        const reqCheckIn = requestedCheckIn ? new Date(requestedCheckIn) : record.checkIn;
        const reqCheckOut = requestedCheckOut ? new Date(requestedCheckOut) : record.checkOut;
        
        let reqBreakOut = record.breakOut;
        if (requestedBreakOut) {
            reqBreakOut = new Date(requestedBreakOut);
        } else if (requestedBreakDuration !== undefined && record.breakIn) {
            reqBreakOut = new Date(new Date(record.breakIn).getTime() + parseInt(requestedBreakDuration) * 60000);
        }

        const regularization = await prisma.attendanceRegularization.create({
            data: {
                attendanceRecordId: record.id,
                requestedCheckIn: reqCheckIn,
                requestedCheckOut: reqCheckOut,
                requestedBreakOut: reqBreakOut,
                reason,
                status: 'PENDING'
            }
        });

        res.json({ message: 'Correction request submitted successfully', regularization });
    } catch (error) {
        console.error('Error submitting regularization:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── GET REGULARIZATION REQUESTS (HR/Manager) ────────────────
async function getRegularizationRequests(req, res) {
    try {
        const companyId = req.user.companyId;
        let whereClause = {
            attendanceRecord: {
                employee: {
                    user: { companyId }
                }
            }
        };

        if (req.user.role === 'MANAGER') {
            const managerEmployee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
            if (!managerEmployee) return res.json([]);
            whereClause.attendanceRecord.employee.reportingManagerId = managerEmployee.id;
        }

        const requests = await prisma.attendanceRegularization.findMany({
            where: whereClause,
            include: {
                attendanceRecord: {
                    include: {
                        employee: {
                            include: { user: true, designation: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching regularizations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── REVIEW REGULARIZATION REQUEST (HR/Manager) ──────────────
async function reviewRegularization(req, res) {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body; // status: APPROVED or REJECTED
        const reviewerId = req.user.id;

        const request = await prisma.attendanceRegularization.findUnique({ 
            where: { id: parseInt(id) },
            include: { 
                attendanceRecord: {
                    include: { employee: true }
                }
            }
        });

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Manager guard: can only review requests from their direct reports
        if (req.user.role === 'MANAGER') {
            const managerEmployee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
            const emp = request.attendanceRecord?.employee;
            if (!managerEmployee || !emp || emp.reportingManagerId !== managerEmployee.id) {
                return res.status(403).json({ message: 'You can only review requests from your direct reports' });
            }
        }

        // Update the regularization request
        const updatedRequest = await prisma.attendanceRegularization.update({
            where: { id: request.id },
            data: {
                status,
                remarks,
                reviewedById: reviewerId
            }
        });

        // If approved, update the original attendance record and calculate new hours
        if (status === 'APPROVED') {
            const reqCheckIn = request.requestedCheckIn || request.attendanceRecord.checkIn;
            const reqCheckOut = request.requestedCheckOut || request.attendanceRecord.checkOut;
            const reqBreakOut = request.requestedBreakOut || request.attendanceRecord.breakOut;
            const breakIn = request.attendanceRecord.breakIn;
            
            let workingHours = request.attendanceRecord.workingHours;
            if (reqCheckIn && reqCheckOut) {
                const totalDiffMs = new Date(reqCheckOut) - new Date(reqCheckIn);
                let breakDiffMs = 0;
                
                // If there was a break, subtract it
                if (breakIn && reqBreakOut) {
                    breakDiffMs = new Date(reqBreakOut) - new Date(breakIn);
                    if (breakDiffMs < 0) breakDiffMs = 0;
                }
                
                const netWorkingMs = totalDiffMs - breakDiffMs;
                workingHours = parseFloat((netWorkingMs / (1000 * 60 * 60)).toFixed(2));
            }

            // Smart policy evaluation for the new hours
            const user = await prisma.user.findUnique({ where: { id: reviewerId } });
            const policy = await prisma.attendancePolicy.findUnique({ where: { companyId: user.companyId } });
            
            let newStatus = 'PRESENT';
            const minHalfDay = policy ? parseFloat(policy.minimumHoursForHalfDay.toString()) : 4.0;
            const minFullDay = policy ? parseFloat(policy.minimumHoursForFullDay.toString()) : 8.0;

            if (workingHours !== null) {
                if (workingHours < minHalfDay) newStatus = 'IRREGULAR';
                else if (workingHours < minFullDay) newStatus = 'HALF_DAY';
            }

            await prisma.attendanceRecord.update({
                where: { id: request.attendanceRecordId },
                data: {
                    checkIn: reqCheckIn,
                    checkOut: reqCheckOut,
                    breakOut: reqBreakOut,
                    workingHours,
                    status: newStatus
                }
            });
        }

        res.json({ message: `Request ${status.toLowerCase()}`, request: updatedRequest });
    } catch (error) {
        console.error('Error reviewing regularization:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
// ── UPDATE ATTENDANCE LOG (HR/Admin) ─────────────────────────
async function updateAttendanceLog(req, res) {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, breakMinutes, status } = req.body;
        
        // HR/Manager can do this
        if (req.user.role !== 'HR' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'MANAGER') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const record = await prisma.attendanceRecord.findUnique({ 
            where: { id: parseInt(id) },
            include: { employee: true }
        });

        if (!record) return res.status(404).json({ message: 'Record not found' });

        // Manager guard: can only edit records belonging to their direct reports
        if (req.user.role === 'MANAGER') {
            const managerEmployee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
            if (!managerEmployee || record.employee.reportingManagerId !== managerEmployee.id) {
                return res.status(403).json({ message: 'You can only edit attendance of your direct reports' });
            }
        }

        const reqCheckIn = checkIn ? new Date(checkIn) : record.checkIn;
        const reqCheckOut = checkOut ? new Date(checkOut) : record.checkOut;
        
        let workingHours = record.workingHours;
        let reqBreakIn = record.breakIn;
        let reqBreakOut = record.breakOut;
        
        // If we have both checkIn and checkOut, recalculate working hours
        if (reqCheckIn && reqCheckOut) {
            const totalDiffMs = new Date(reqCheckOut) - new Date(reqCheckIn);
            let breakDiffMs = 0;
            
            if (breakMinutes !== undefined && breakMinutes !== null) {
                breakDiffMs = parseInt(breakMinutes) * 60000;
                
                // Adjust breakOut so it matches the new breakMinutes
                if (breakDiffMs > 0) {
                    reqBreakIn = record.breakIn || new Date(new Date(reqCheckIn).getTime() + (totalDiffMs / 2) - (breakDiffMs / 2));
                    reqBreakOut = new Date(new Date(reqBreakIn).getTime() + breakDiffMs);
                } else {
                    reqBreakIn = null;
                    reqBreakOut = null;
                }
            } else if (record.breakIn && record.breakOut) {
                breakDiffMs = new Date(record.breakOut) - new Date(record.breakIn);
                if (breakDiffMs < 0) breakDiffMs = 0;
            }
            
            const netWorkingMs = totalDiffMs - breakDiffMs;
            workingHours = parseFloat((netWorkingMs / (1000 * 60 * 60)).toFixed(2));
        }

        const updatedRecord = await prisma.attendanceRecord.update({
            where: { id: record.id },
            data: {
                checkIn: reqCheckIn,
                checkOut: reqCheckOut,
                breakIn: reqBreakIn,
                breakOut: reqBreakOut,
                workingHours,
                status: status || record.status
            }
        });

        res.json({ message: 'Attendance record updated successfully', record: updatedRecord });
    } catch (error) {
        console.error('Error updating attendance log:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getTodayStatus,
    checkIn,
    checkOut,
    breakIn,
    breakOut,
    getAttendanceLogs,
    submitRegularization,
    getRegularizationRequests,
    reviewRegularization,
    updateAttendanceLog,
    getPolicy,
    upsertPolicy
};

// ── GET ATTENDANCE POLICY (HR/Admin) ─────────────────────────
async function getPolicy(req, res) {
    try {
        const companyId = req.user.companyId;
        if (!companyId) return res.status(400).json({ message: 'No company associated' });
        
        let policy = await prisma.attendancePolicy.findUnique({ where: { companyId } });
        // Return defaults if no policy exists yet
        if (!policy) {
            policy = {
                companyId,
                minimumHoursForHalfDay: 4.0,
                minimumHoursForFullDay: 8.0,
                allowWebPunch: true,
                requireGeofence: false,
                lateGracePeriod: 15,
                autoCheckoutTime: '18:00'
            };
        }

        const settings = await prisma.companySetting.findUnique({ where: { companyId } });
        policy.officeStartTime = settings?.officeStartTime || "09:00";
        policy.officeEndTime = settings?.officeEndTime || "18:00";

        res.json(policy);
    } catch (error) {
        console.error('Error fetching policy:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// ── UPSERT ATTENDANCE POLICY (HR/Admin) ──────────────────────
async function upsertPolicy(req, res) {
    try {
        const companyId = req.user.companyId;
        if (!companyId) return res.status(400).json({ message: 'No company associated' });
        
        const { minimumHoursForHalfDay, minimumHoursForFullDay, allowWebPunch, requireGeofence, officeStartTime, officeEndTime, lateGracePeriod, autoCheckoutTime } = req.body;
        
        const policy = await prisma.attendancePolicy.upsert({
            where: { companyId },
            create: {
                companyId,
                minimumHoursForHalfDay: parseFloat(minimumHoursForHalfDay) || 4.0,
                minimumHoursForFullDay: parseFloat(minimumHoursForFullDay) || 8.0,
                allowWebPunch: allowWebPunch !== undefined ? allowWebPunch : true,
                requireGeofence: requireGeofence !== undefined ? requireGeofence : false,
                lateGracePeriod: parseInt(lateGracePeriod) || 15,
                autoCheckoutTime: autoCheckoutTime || '18:00'
            },
            update: {
                minimumHoursForHalfDay: parseFloat(minimumHoursForHalfDay) || 4.0,
                minimumHoursForFullDay: parseFloat(minimumHoursForFullDay) || 8.0,
                allowWebPunch: allowWebPunch !== undefined ? allowWebPunch : true,
                requireGeofence: requireGeofence !== undefined ? requireGeofence : false,
                lateGracePeriod: parseInt(lateGracePeriod) || 15,
                autoCheckoutTime: autoCheckoutTime || '18:00'
            }
        });

        if (officeStartTime && officeEndTime) {
            await prisma.companySetting.upsert({
                where: { companyId },
                create: {
                    companyId,
                    officeStartTime,
                    officeEndTime
                },
                update: {
                    officeStartTime,
                    officeEndTime
                }
            });
            policy.officeStartTime = officeStartTime;
            policy.officeEndTime = officeEndTime;
        }
        
        res.json({ message: 'Attendance policy saved successfully', policy });
    } catch (error) {
        console.error('Error saving policy:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
