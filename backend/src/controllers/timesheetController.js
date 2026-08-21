// backend/src/controllers/timesheetController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * POST /api/timesheets — Employee/PM logs hours
 */
const logTime = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { projectId, taskId, logDate, hoursSpent, billableHours, description } = req.body;

    if (!projectId || !logDate || !hoursSpent) {
      return res.status(400).json({ message: 'Project, date, and hours are required.' });
    }

    const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found.' });

    const timeLog = await prisma.timeLog.create({
      data: {
        companyId,
        employeeId: employee.id,
        projectId: Number(projectId),
        taskId: taskId ? Number(taskId) : undefined,
        logDate: new Date(logDate),
        hoursSpent: Number(hoursSpent),
        billableHours: billableHours ? Number(billableHours) : Number(hoursSpent),
        description,
      },
    });

    res.status(201).json({ success: true, message: 'Time logged.', data: timeLog });
  } catch (err) {
    console.error('logTime error:', err);
    res.status(500).json({ message: 'Failed to log time.' });
  }
};

/**
 * GET /api/timesheets — Employee sees own; Finance/Admin see all
 */
const getTimeLogs = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { projectId, employeeId, startDate, endDate, approvalStatus } = req.query;

    const where = { companyId };
    if (projectId) where.projectId = Number(projectId);
    if (approvalStatus) where.approvalStatus = approvalStatus;

    // Date range filter
    if (startDate || endDate) {
      where.logDate = {};
      if (startDate) where.logDate.gte = new Date(startDate);
      if (endDate) where.logDate.lte = new Date(endDate);
    }

    // Employees only see their own
    if (req.user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      if (employee) where.employeeId = employee.id;
    } else if (employeeId) {
      where.employeeId = Number(employeeId);
    }

    const timeLogs = await prisma.timeLog.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        task: { select: { id: true, title: true, taskCode: true } },
      },
      orderBy: { logDate: 'desc' },
    });

    const totals = timeLogs.reduce(
      (acc, log) => {
        acc.totalHours += log.hoursSpent;
        acc.billableHours += log.billableHours;
        return acc;
      },
      { totalHours: 0, billableHours: 0 }
    );

    res.json({ success: true, data: timeLogs, totals });
  } catch (err) {
    console.error('getTimeLogs error:', err);
    res.status(500).json({ message: 'Failed to fetch time logs.' });
  }
};

/**
 * GET /api/timesheets/all — Finance/Admin: all timesheets + summary
 */
const getAllTimeLogs = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { projectId, approvalStatus, startDate, endDate } = req.query;

    const where = { companyId };
    if (projectId) where.projectId = Number(projectId);
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (startDate || endDate) {
      where.logDate = {};
      if (startDate) where.logDate.gte = new Date(startDate);
      if (endDate) where.logDate.lte = new Date(endDate);
    }

    const timeLogs = await prisma.timeLog.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        task: { select: { id: true, title: true, taskCode: true } },
      },
      orderBy: { logDate: 'desc' },
    });

    res.json({ success: true, data: timeLogs, count: timeLogs.length });
  } catch (err) {
    console.error('getAllTimeLogs error:', err);
    res.status(500).json({ message: 'Failed to fetch all time logs.' });
  }
};

/**
 * PATCH /api/timesheets/:id/approve — Finance/Admin only
 */
const approveTimeLog = async (req, res) => {
  try {
    const { status, remarks } = req.body; // APPROVED | REJECTED
    const timeLog = await prisma.timeLog.update({
      where: { id: Number(req.params.id) },
      data: { approvalStatus: status },
    });
    res.json({ success: true, message: `Time log ${status.toLowerCase()}.`, data: timeLog });
  } catch (err) {
    console.error('approveTimeLog error:', err);
    res.status(500).json({ message: 'Failed to update approval status.' });
  }
};

/**
 * DELETE /api/timesheets/:id — Owner or Admin
 */
const deleteTimeLog = async (req, res) => {
  try {
    await prisma.timeLog.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Time log deleted.' });
  } catch (err) {
    console.error('deleteTimeLog error:', err);
    res.status(500).json({ message: 'Failed to delete time log.' });
  }
};

module.exports = { logTime, getTimeLogs, getAllTimeLogs, approveTimeLog, deleteTimeLog };
