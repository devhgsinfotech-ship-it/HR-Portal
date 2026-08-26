// backend/src/controllers/projectController.js
const prisma = require('../config/prisma');

// ── Helpers ──────────────────────────────────────────────────────────────

const generateProjectCode = async (companyId) => {
  const count = await prisma.project.count({ where: { companyId } });
  return `PRJ-${String(count + 1).padStart(4, '0')}`;
};

// Strip budget from response for employees
const sanitizeProject = (project, userRole, companyRoleName) => {
  const isFinance = userRole === 'SUPER_ADMIN' || userRole === 'HR' || companyRoleName === 'Finance';
  
  // Map projectManager and milestones for frontend compatibility
  const { projectManager, milestones, ...rest } = project;

  const mappedMilestones = milestones?.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    startDate: m.startDate,
    endDate: m.dueDate,
    progress: m.completionPercentage,
    status: m.status,
  })) || [];

  const mapped = {
    ...rest,
    manager: projectManager || null,
    milestones: mappedMilestones,
  };

  if (!isFinance) {
    const { budget, actualCost, ...other } = mapped;
    return other;
  }
  return mapped;
};

// ── Controllers ───────────────────────────────────────────────────────────

/**
 * GET /api/projects
 */
const getProjects = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { status, priority, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { companyId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) where.name = { contains: search };

    // Employees can only see projects they are assigned to
    if (req.user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
      if (employee) {
        where.members = { some: { employeeId: employee.id } };
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true } },
          projectManager: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
          members: {
            include: {
              employee: {
                select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true },
              },
            },
          },
          _count: { select: { members: true, tasks: true, milestones: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.project.count({ where }),
    ]);

    // Get employee's companyRole name for budget stripping
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
      include: { companyRole: { select: { name: true } } },
    });

    const sanitized = projects.map((p) =>
      sanitizeProject(p, req.user.role, employee?.companyRole?.name)
    );

    res.json({ success: true, data: sanitized, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('getProjects error:', err);
    res.status(500).json({ message: 'Failed to fetch projects.' });
  }
};

/**
 * GET /api/projects/:id
 */
const getProjectById = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const projectId = Number(req.params.id);

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      include: {
        client: true,
        projectManager: {
          select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true },
        },
        members: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true },
            },
          },
        },
        milestones: { orderBy: { dueDate: 'asc' } },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true },
            },
            subTasks: true,
            _count: { select: { timeLogs: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
      include: { companyRole: { select: { name: true } } },
    });

    res.json({ success: true, data: sanitizeProject(project, req.user.role, employee?.companyRole?.name) });
  } catch (err) {
    console.error('getProjectById error:', err);
    res.status(500).json({ message: 'Failed to fetch project.' });
  }
};

/**
 * POST /api/projects — Admin/PM only
 */
const createProject = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const {
      name, description, clientId, projectManagerId,
      startDate, endDate, priority, status, memberIds, attachmentUrl, logoUrl, budget
    } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, start date, and end date are required.' });
    }

    const projectCode = await generateProjectCode(companyId);

    const project = await prisma.project.create({
      data: {
        companyId,
        projectCode,
        name,
        description,
        clientId: clientId ? Number(clientId) : null,
        projectManagerId: projectManagerId ? Number(projectManagerId) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priority: priority || 'MEDIUM',
        status: status || 'ACTIVE',
        attachmentUrl,
        logoUrl,
        budget: budget ? Number(budget) : null,
        // Add members if provided
        members: memberIds?.length
          ? { create: memberIds.map((empId) => ({ employeeId: Number(empId) })) }
          : undefined,
      },
      include: {
        client: { select: { id: true, companyName: true } },
        projectManager: { select: { id: true, firstName: true, lastName: true } },
        members: { include: { employee: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
      include: { companyRole: { select: { name: true } } },
    });

    res.status(201).json({ success: true, message: 'Project created.', data: sanitizeProject(project, req.user.role, employee?.companyRole?.name) });
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ message: 'Failed to create project.' });
  }
};

/**
 * PUT /api/projects/:id — Admin/PM only
 */
const updateProject = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const projectId = Number(req.params.id);
    const {
      name, description, clientId, projectManagerId,
      startDate, endDate, priority, status, healthStatus, memberIds, attachmentUrl, logoUrl, budget
    } = req.body;

    const existing = await prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!existing) return res.status(404).json({ message: 'Project not found.' });

    // Perform inside transaction to ensure atomicity
    const project = await prisma.$transaction(async (tx) => {
      // 1. Update project details
      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          name,
          description,
          clientId: clientId !== undefined ? (clientId ? Number(clientId) : null) : undefined,
          projectManagerId: projectManagerId !== undefined ? (projectManagerId ? Number(projectManagerId) : null) : undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          priority,
          status,
          healthStatus,
          attachmentUrl,
          logoUrl,
          budget: budget !== undefined ? (budget ? Number(budget) : null) : undefined,
        },
      });

      // 2. Sync members if provided
      if (memberIds !== undefined) {
        // Delete existing allocations
        await tx.projectMember.deleteMany({ where: { projectId } });

        // Insert new allocations
        if (memberIds.length > 0) {
          await tx.projectMember.createMany({
            data: memberIds.map((empId) => ({
              projectId,
              employeeId: Number(empId),
              role: 'Developer' // Default fallback role
            })),
            skipDuplicates: true,
          });
        }
      }

      return updated;
    });

    const updatedProject = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      include: {
        client: { select: { id: true, companyName: true } },
        projectManager: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
        members: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true },
            },
          },
        },
      },
    });

    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
      include: { companyRole: { select: { name: true } } },
    });

    res.json({ success: true, message: 'Project updated.', data: sanitizeProject(updatedProject, req.user.role, employee?.companyRole?.name) });
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ message: 'Failed to update project.' });
  }
};

/**
 * PUT /api/projects/:id/budget — Finance/Admin only
 */
const updateProjectBudget = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const projectId = Number(req.params.id);
    const { budget, actualCost } = req.body;

    const existing = await prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!existing) return res.status(404).json({ message: 'Project not found.' });

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        budget: budget !== undefined ? Number(budget) : undefined,
        actualCost: actualCost !== undefined ? Number(actualCost) : undefined,
      },
    });

    res.json({ success: true, message: 'Budget updated.', data: { budget: project.budget, actualCost: project.actualCost } });
  } catch (err) {
    console.error('updateProjectBudget error:', err);
    res.status(500).json({ message: 'Failed to update budget.' });
  }
};

/**
 * GET /api/projects/:id/financials — Finance/Admin only
 */
const getProjectFinancials = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const projectId = Number(req.params.id);

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true, name: true, budget: true, actualCost: true },
    });
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const billableHours = await prisma.timeLog.aggregate({
      where: { projectId },
      _sum: { billableHours: true, hoursSpent: true },
    });

    res.json({
      success: true,
      data: {
        ...project,
        budgetUtilization: project.budget ? ((project.actualCost / project.budget) * 100).toFixed(1) : 0,
        totalBillableHours: billableHours._sum.billableHours || 0,
        totalHoursLogged: billableHours._sum.hoursSpent || 0,
      },
    });
  } catch (err) {
    console.error('getProjectFinancials error:', err);
    res.status(500).json({ message: 'Failed to fetch financials.' });
  }
};

/**
 * DELETE /api/projects/:id — Admin only
 */
const deleteProject = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const projectId = Number(req.params.id);

    const existing = await prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!existing) return res.status(404).json({ message: 'Project not found.' });

    await prisma.project.delete({ where: { id: projectId } });
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    console.error('deleteProject error:', err);
    res.status(500).json({ message: 'Failed to delete project.' });
  }
};

/**
 * POST /api/projects/:id/members — Add team members
 */
const addProjectMembers = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const projectId = Number(req.params.id);
    const { members } = req.body; // [{ employeeId, role, allocationPercentage }]

    const existing = await prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!existing) return res.status(404).json({ message: 'Project not found.' });

    // Upsert members (skip duplicates)
    const results = await Promise.all(
      members.map(({ employeeId, role, allocationPercentage }) =>
        prisma.projectMember.upsert({
          where: { projectId_employeeId: { projectId, employeeId: Number(employeeId) } },
          create: { projectId, employeeId: Number(employeeId), role, allocationPercentage },
          update: { role, allocationPercentage },
        })
      )
    );

    res.json({ success: true, message: 'Members updated.', data: results });
  } catch (err) {
    console.error('addProjectMembers error:', err);
    res.status(500).json({ message: 'Failed to add members.' });
  }
};

/**
 * DELETE /api/projects/:id/members/:memberId
 */
const removeProjectMember = async (req, res) => {
  try {
    await prisma.projectMember.delete({ where: { id: Number(req.params.memberId) } });
    res.json({ success: true, message: 'Member removed.' });
  } catch (err) {
    console.error('removeProjectMember error:', err);
    res.status(500).json({ message: 'Failed to remove member.' });
  }
};

/**
 * POST /api/projects/:id/milestones — Add milestone/phase
 */
const addMilestone = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const projectId = Number(req.params.id);
    const { name, description, startDate, endDate, progress, status } = req.body;

    const existing = await prisma.project.findFirst({ where: { id: projectId, companyId } });
    if (!existing) return res.status(404).json({ message: 'Project not found.' });

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId,
        name,
        description: description || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: new Date(endDate),
        completionPercentage: progress ? Number(progress) : 0,
        status: status || 'PENDING'
      },
    });

    res.status(201).json({
      success: true,
      message: 'Milestone added.',
      data: {
        id: milestone.id,
        name: milestone.name,
        description: milestone.description,
        startDate: milestone.startDate,
        endDate: milestone.dueDate,
        progress: milestone.completionPercentage,
        status: milestone.status,
      }
    });
  } catch (err) {
    console.error('addMilestone error:', err);
    res.status(500).json({ message: 'Failed to add milestone.' });
  }
};

/**
 * PUT /api/projects/milestones/:milestoneId
 */
const updateMilestone = async (req, res) => {
  try {
    const { name, dueDate, completionPercentage, status } = req.body;
    const milestone = await prisma.projectMilestone.update({
      where: { id: Number(req.params.milestoneId) },
      data: {
        name,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completionPercentage: completionPercentage !== undefined ? Number(completionPercentage) : undefined,
        status,
      },
    });
    res.json({ success: true, message: 'Milestone updated.', data: milestone });
  } catch (err) {
    console.error('updateMilestone error:', err);
    res.status(500).json({ message: 'Failed to update milestone.' });
  }
};

/**
 * GET /api/projects/:id/gantt — Gantt chart data
 */
const getGanttData = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const projectId = Number(req.params.id);

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId },
      include: {
        milestones: {
          include: {
            tasks: {
              include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { dueDate: 'asc' },
        },
        tasks: {
          where: { milestoneId: null }, // Unassigned tasks
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json({ success: true, data: project });
  } catch (err) {
    console.error('getGanttData error:', err);
    res.status(500).json({ message: 'Failed to fetch Gantt data.' });
  }
};


// ── Notes Controllers ─────────────────────────────────────────────────────

/**
 * GET /api/projects/:id/notes
 */
const getNotes = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const notes = await prisma.projectNote.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: notes });
  } catch (err) {
    console.error('getNotes error:', err);
    res.status(500).json({ message: 'Failed to fetch notes.' });
  }
};

/**
 * POST /api/projects/:id/notes
 */
const addNote = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required.' });

    const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
    const note = await prisma.projectNote.create({
      data: { projectId, title, content, createdById: employee?.id || null },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
      },
    });
    res.json({ success: true, data: note });
  } catch (err) {
    console.error('addNote error:', err);
    res.status(500).json({ message: 'Failed to add note.' });
  }
};

/**
 * DELETE /api/projects/notes/:noteId
 */
const deleteNote = async (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    await prisma.projectNote.delete({ where: { id: noteId } });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteNote error:', err);
    res.status(500).json({ message: 'Failed to delete note.' });
  }
};

// ── Files Controllers ─────────────────────────────────────────────────────

/**
 * GET /api/projects/:id/files
 */
const getFiles = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const { type } = req.query; // 'image' or 'file'
    const where = { projectId };
    if (type) where.fileType = type;
    const files = await prisma.projectFile.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: files });
  } catch (err) {
    console.error('getFiles error:', err);
    res.status(500).json({ message: 'Failed to fetch files.' });
  }
};

/**
 * POST /api/projects/:id/files  — after multer upload middleware
 */
const addFile = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
    const mime = req.file.mimetype || '';
    const isImage = mime.startsWith('image/');
    const fileUrl = `/uploads/documents/${req.file.filename}`;

    const saved = await prisma.projectFile.create({
      data: {
        projectId,
        name: req.file.originalname,
        url: fileUrl,
        fileType: isImage ? 'image' : 'file',
        mimeType: mime,
        sizeBytes: req.file.size,
        uploadedById: employee?.id || null,
      },
    });
    res.json({ success: true, data: saved });
  } catch (err) {
    console.error('addFile error:', err);
    res.status(500).json({ message: 'Failed to save file.' });
  }
};

/**
 * DELETE /api/projects/files/:fileId
 */
const deleteFile = async (req, res) => {
  try {
    const fileId = Number(req.params.fileId);
    await prisma.projectFile.delete({ where: { id: fileId } });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteFile error:', err);
    res.status(500).json({ message: 'Failed to delete file.' });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectBudget,
  getProjectFinancials,
  deleteProject,
  addProjectMembers,
  removeProjectMember,
  addMilestone,
  updateMilestone,
  getGanttData,
  // Notes
  getNotes,
  addNote,
  deleteNote,
  // Files
  getFiles,
  addFile,
  deleteFile,
};

