// backend/src/controllers/taskController.js
const prisma = require('../config/prisma');

const generateTaskCode = async (companyId) => {
  const count = await prisma.task.count({ where: { companyId } });
  return `TSK-${String(count + 1).padStart(4, '0')}`;
};

/**
 * GET /api/tasks — List tasks (employees see only assigned)
 */
const getTasks = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { projectId, status, priority, assignedToId } = req.query;

    const where = { companyId };
    if (projectId) where.projectId = Number(projectId);
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = Number(assignedToId);

    // Employees only see tasks assigned to them
    if (req.user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      if (employee) where.assignedToId = employee.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, userId: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        milestone: { select: { id: true, name: true } },
        subTasks: true,
        _count: { select: { timeLogs: true } },
      },
      orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { dueDate: 'asc' }],
    });

    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('getTasks error:', err);
    res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
};

/**
 * GET /api/tasks/board — Kanban board grouped by status
 */
const getTaskBoard = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { projectId } = req.query;

    const where = { companyId };
    if (projectId) where.projectId = Number(projectId);

    // Employee scoping
    if (req.user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      if (employee) where.assignedToId = employee.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, userId: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        project: { select: { id: true, name: true } },
        subTasks: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Group into Kanban columns
    const board = {
      TODO: tasks.filter((t) => t.status === 'TODO'),
      PENDING: tasks.filter((t) => t.status === 'PENDING'),
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
      COMPLETED: tasks.filter((t) => t.status === 'COMPLETED'),
      ON_HOLD: tasks.filter((t) => t.status === 'ON_HOLD'),
    };

    res.json({ success: true, data: board });
  } catch (err) {
    console.error('getTaskBoard error:', err);
    res.status(500).json({ message: 'Failed to fetch task board.' });
  }
};

/**
 * POST /api/tasks — Admin/PM only
 */
const createTask = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const {
      title, description, projectId, milestoneId, assignedToId,
      priority, status, startDate, dueDate, estimatedHours, subTasks,
    } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and project are required.' });
    }

    const taskCode = await generateTaskCode(companyId);

    const task = await prisma.task.create({
      data: {
        companyId,
        taskCode,
        title,
        description,
        projectId: Number(projectId),
        milestoneId: milestoneId ? Number(milestoneId) : undefined,
        assignedToId: assignedToId ? Number(assignedToId) : undefined,
        createdById: req.user.id,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : 0,
        subTasks: subTasks?.length
          ? { create: subTasks.map((t) => ({ title: t })) }
          : undefined,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        subTasks: true,
      },
    });

    res.status(201).json({ success: true, message: 'Task created.', data: task });
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ message: 'Failed to create task.' });
  }
};

/**
 * PUT /api/tasks/:id — Admin/PM only
 */
const updateTask = async (req, res) => {
  try {
    const {
      title, description, assignedToId, milestoneId,
      priority, startDate, dueDate, estimatedHours, sortOrder,
    } = req.body;

    const task = await prisma.task.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        description,
        assignedToId: assignedToId ? Number(assignedToId) : undefined,
        milestoneId: milestoneId ? Number(milestoneId) : undefined,
        priority,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours !== undefined ? Number(estimatedHours) : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });

    res.json({ success: true, message: 'Task updated.', data: task });
  } catch (err) {
    console.error('updateTask error:', err);
    res.status(500).json({ message: 'Failed to update task.' });
  }
};

/**
 * PATCH /api/tasks/:id/status — Update status (all roles, employees = own tasks only)
 */
const updateTaskStatus = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const { status, actualHours } = req.body;

    // Employee: verify they are the assignee
    if (req.user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.assignedToId !== employee?.id) {
        return res.status(403).json({ message: 'You can only update your own tasks.' });
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        actualHours: actualHours !== undefined ? Number(actualHours) : undefined,
      },
    });

    res.json({ success: true, message: 'Task status updated.', data: task });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    res.status(500).json({ message: 'Failed to update task status.' });
  }
};

/**
 * DELETE /api/tasks/:id — Admin/PM only
 */
const deleteTask = async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    console.error('deleteTask error:', err);
    res.status(500).json({ message: 'Failed to delete task.' });
  }
};

/**
 * POST /api/tasks/:id/subtasks
 */
const addSubTask = async (req, res) => {
  try {
    const { title } = req.body;
    const subTask = await prisma.subTask.create({
      data: { taskId: Number(req.params.id), title },
    });
    res.status(201).json({ success: true, data: subTask });
  } catch (err) {
    console.error('addSubTask error:', err);
    res.status(500).json({ message: 'Failed to add sub-task.' });
  }
};

/**
 * PATCH /api/tasks/subtasks/:id/toggle
 */
const toggleSubTask = async (req, res) => {
  try {
    const subTask = await prisma.subTask.findUnique({ where: { id: Number(req.params.id) } });
    if (!subTask) return res.status(404).json({ message: 'Sub-task not found.' });

    const updated = await prisma.subTask.update({
      where: { id: subTask.id },
      data: { isCompleted: !subTask.isCompleted },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('toggleSubTask error:', err);
    res.status(500).json({ message: 'Failed to toggle sub-task.' });
  }
};

module.exports = {
  getTasks,
  getTaskBoard,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addSubTask,
  toggleSubTask,
};
