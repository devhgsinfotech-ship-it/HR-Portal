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

    // HR always has access to project ops (but not budget)
    if (user.role === 'HR' && action !== 'budget') return next();

    // Check CompanyRole permissions
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: {
        companyRole: {
          include: { permissions: { where: { module } } },
        },
      },
    });

    const perm = employee?.companyRole?.permissions?.[0];
    if (!perm) {
      return res.status(403).json({ message: `No permission for module: ${module}` });
    }

    const actionMap = {
      read:   perm.canRead,
      write:  perm.canWrite,
      create: perm.canCreate,
      delete: perm.canDelete,
      import: perm.canImport,
      export: perm.canExport,
    };

    if (!actionMap[action]) {
      return res.status(403).json({ message: `Permission denied: cannot ${action} ${module}` });
    }

    // Attach permission object to request for downstream use
    req.modulePermission = perm;
    next();
  } catch (err) {
    console.error('Permission check error:', err);
    res.status(500).json({ message: 'Internal server error during permission check.' });
  }
};

// ─── Shorthand middleware factories ──────────────────────────────────────────

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
  requireProjectAdmin,
  requireFinanceAccess,
  requireProjectAccess,
  requireAdminOnly,
};
