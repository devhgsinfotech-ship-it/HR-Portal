// backend/src/middleware/projectPermission.js
const prisma = require('../config/prisma');

/**
 * Check if user has a required system role (SUPER_ADMIN, COMPANY_ADMIN, HR, MANAGER, EMPLOYEE)
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
 * Check if user has a specific module permission via CompanyRole
 * Falls back to system role check for SUPER_ADMIN / COMPANY_ADMIN / HR
 */
const checkModulePermission = (module, action) => async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized.' });

    // Super Admin and Company Admin always have full access
    if (user.role === 'SUPER_ADMIN' || user.role === 'COMPANY_ADMIN') return next();

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

// Shorthand middleware factories
const requireProjectAdmin = checkSystemRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'MANAGER']);
const requireFinanceAccess = checkSystemRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR']);
const requireProjectAccess = checkSystemRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']);
const requireAdminOnly = checkSystemRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR']);

module.exports = {
  checkSystemRole,
  checkModulePermission,
  requireProjectAdmin,
  requireFinanceAccess,
  requireProjectAccess,
  requireAdminOnly,
};

