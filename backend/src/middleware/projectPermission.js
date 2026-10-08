// backend/src/middleware/projectPermission.js
const prisma = require('../config/prisma');

/**
 * checkSystemRole — Platform-level check.
 * SUPER_ADMIN and COMPANY_ADMIN both auto-bypass.
 * Use for READ/VIEW operations.
 */
const checkSystemRole = (allowedRoles) => (req, res, next) => {
  const userRole = req.user?.role;
  if (!userRole) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // SUPER_ADMIN and COMPANY_ADMIN automatically pass all system role checks
  if (userRole === 'SUPER_ADMIN' || userRole === 'COMPANY_ADMIN') {
    return next();
  }

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }
  next();
};

/**
 * checkCompanyRole — Company-level operational check.
 * Only COMPANY_ADMIN auto-bypasses.
 * SUPER_ADMIN must be explicitly listed in allowedRoles.
 *
 * Use for WRITE operations on company data (projects, tasks, assets, timesheets, finance).
 * SUPER_ADMIN = platform manager, not company HR/PM operator.
 */
const checkCompanyRole = (allowedRoles) => (req, res, next) => {
  const userRole = req.user?.role;
  if (!userRole) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  // Only COMPANY_ADMIN gets automatic bypass for company-level write operations
  if (userRole === 'COMPANY_ADMIN') {
    return next();
  }

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      message: 'Access denied. This operation requires company-level admin privileges.'
    });
  }
  next();
};

/**
 * Check if user has a specific module permission via CompanyRole
 * Falls back to system role check for SUPER_ADMIN / COMPANY_ADMIN / HR
 */
const checkModulePermission = (module, action) => async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized.' });

    // Infer action from req.method if action parameter is omitted
    const effectiveAction = action || (req.method === 'GET' ? 'read' : 'write');

    // Company Admin always has full access to company ops
    if (user.role === 'COMPANY_ADMIN') return next();

    // Super Admin: platform-level read/support only (no write access to company modules)
    if (user.role === 'SUPER_ADMIN') {
      if (effectiveAction === 'read') return next();
      return res.status(403).json({
        message: 'Super Admin has view-only access to company modules. Use Company Admin for operational tasks.'
      });
    }

    // Check CompanyRole permissions first
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: {
        companyRole: {
          include: { permissions: { where: { module } } },
        },
      },
    });

    const perm = employee?.companyRole?.permissions?.[0];
    if (perm) {
      const actionMap = {
        read:   perm.canRead,
        write:  perm.canWrite,
        create: perm.canCreate,
        delete: perm.canDelete,
        import: perm.canImport,
        export: perm.canExport,
      };

      const targetAction = effectiveAction;
      if (!actionMap[targetAction]) {
        return res.status(403).json({ message: `Permission denied: cannot ${targetAction} ${module}` });
      }

      req.modulePermission = perm;
      return next();
    }

    // Fallback: HR default access if no dynamic permission record exists yet
    if (user.role === 'HR' && action !== 'budget') return next();

    return res.status(403).json({ message: `No permission for module: ${module}` });
  } catch (err) {
    console.error('Permission check error:', err);
    res.status(500).json({ message: 'Internal server error during permission check.' });
  }
};

// ─── Shorthand middleware factories ──────────────────────────────────────────

/**
 * Check module permissions, BUT bypass if user is the Project Manager or Team Lead of the project
 */
const checkProjectModulePermission = (module, action) => async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized.' });

    const effectiveAction = action || (req.method === 'GET' ? 'read' : 'write');
    if (user.role === 'COMPANY_ADMIN') return next();
    if (user.role === 'SUPER_ADMIN') {
      if (effectiveAction === 'read') return next();
      return res.status(403).json({ message: 'Super Admin has view-only access to company modules.' });
    }
    if (user.role === 'HR' && action !== 'budget') return next();

    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: {
        companyRole: {
          include: { permissions: { where: { module } } },
        },
      },
    });

    const perm = employee?.companyRole?.permissions?.[0];
    let hasGlobalPerm = false;
    if (perm) {
      const actionMap = {
        read:   perm.canRead,
        write:  perm.canWrite,
        create: perm.canCreate,
        delete: perm.canDelete,
        import: perm.canImport,
        export: perm.canExport,
      };
      hasGlobalPerm = actionMap[effectiveAction];
    }

    if (hasGlobalPerm) return next();

    // If NO global perm, check if they are PM or Team Lead for THIS project
    let projectId = req.body.projectId || req.query.projectId;
    if (!projectId && req.params.id) {
       if (req.baseUrl.includes('tasks') || req.originalUrl.includes('tasks')) {
           const task = await prisma.task.findUnique({ where: { id: Number(req.params.id) }, select: { projectId: true } });
           projectId = task?.projectId;
       } else if (req.baseUrl.includes('projects') || req.originalUrl.includes('projects')) {
           projectId = Number(req.params.id);
       }
    }

    if (projectId) {
        const project = await prisma.project.findUnique({
            where: { id: Number(projectId) },
            include: { members: true }
        });
        if (project) {
            const isPM = project.projectManagerId === employee?.id;
            const isManager = project.managerId === employee?.id;
            const isTeamLead = project.members.some(m => m.employeeId === employee?.id && (m.role === 'Team Lead' || m.role === 'Team_Lead' || m.role?.toLowerCase() === 'team lead'));
            const isMember = project.members.some(m => m.employeeId === employee?.id);
            
            // PM and Team Lead: full write access
            if (isPM || isManager || isTeamLead) {
                return next();
            }
            // Regular members: allow write/update on their own tasks (task status update is enforced in controller)
            if (isMember && (effectiveAction === 'write' || effectiveAction === 'read')) {
                return next();
            }
        }
    }

    return res.status(403).json({ message: `Permission denied: cannot ${effectiveAction} ${module}. You must be a project member, Team Lead, or Project Manager.` });
  } catch (err) {
    console.error('Permission check error:', err);
    res.status(500).json({ message: 'Internal server error during permission check.' });
  }
};

// READ — SUPER_ADMIN + COMPANY_ADMIN both bypass (support/view access)
const requireProjectAccess  = checkSystemRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']);

// WRITE — COMPANY_ADMIN bypass only; SUPER_ADMIN must be explicitly in list
const requireProjectAdmin   = checkCompanyRole(['COMPANY_ADMIN', 'HR', 'MANAGER']);
const requireFinanceAccess  = checkCompanyRole(['COMPANY_ADMIN', 'HR']);
const requireAdminOnly      = checkCompanyRole(['COMPANY_ADMIN', 'HR']);

module.exports = {
  checkSystemRole,
  checkCompanyRole,
  checkModulePermission,
  checkProjectModulePermission,
  requireProjectAdmin,
  requireFinanceAccess,
  requireProjectAccess,
  requireAdminOnly,
};
