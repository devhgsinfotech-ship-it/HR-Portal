// backend/src/controllers/rolePermissionController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// All modules available in the system
const AVAILABLE_MODULES = [
  'EMPLOYEES',
  'ATTENDANCE',
  'LEAVES',
  'PAYROLL',
  'PROJECTS',
  'TASKS',
  'TIMESHEETS',
  'CLIENTS',
  'FINANCE',
  'ASSETS',
  'DOCUMENTS',
  'REPORTS',
  'SETTINGS',
];

/**
 * GET /api/roles — List all company roles
 */
const getRoles = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const roles = await prisma.companyRole.findMany({
      where: { companyId },
      include: {
        permissions: true,
        _count: { select: { employees: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: roles });
  } catch (err) {
    console.error('getRoles error:', err);
    res.status(500).json({ message: 'Failed to fetch roles.' });
  }
};

/**
 * GET /api/roles/:id — Get role with permissions
 */
const getRoleById = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const role = await prisma.companyRole.findFirst({
      where: { id: Number(req.params.id), companyId },
      include: {
        permissions: true,
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    if (!role) return res.status(404).json({ message: 'Role not found.' });

    // Fill in missing modules with default false values
    const existingModules = role.permissions.map((p) => p.module);
    const missingModules = AVAILABLE_MODULES.filter((m) => !existingModules.includes(m));
    const fullPermissions = [
      ...role.permissions,
      ...missingModules.map((m) => ({
        module: m,
        canRead: false,
        canWrite: false,
        canCreate: false,
        canDelete: false,
        canImport: false,
        canExport: false,
      })),
    ];

    res.json({ success: true, data: { ...role, permissions: fullPermissions } });
  } catch (err) {
    console.error('getRoleById error:', err);
    res.status(500).json({ message: 'Failed to fetch role.' });
  }
};

/**
 * POST /api/roles — Create a new company role
 */
const createRole = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ message: 'Role name is required.' });

    const existing = await prisma.companyRole.findFirst({ where: { companyId, name } });
    if (existing) return res.status(409).json({ message: 'Role with this name already exists.' });

    const role = await prisma.companyRole.create({
      data: { companyId, name, description },
    });

    res.status(201).json({ success: true, message: 'Role created.', data: role });
  } catch (err) {
    console.error('createRole error:', err);
    res.status(500).json({ message: 'Failed to create role.' });
  }
};

/**
 * PUT /api/roles/:id — Update role name/description
 */
const updateRole = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { name, description, isActive } = req.body;

    const role = await prisma.companyRole.update({
      where: { id: Number(req.params.id) },
      data: { name, description, isActive },
    });

    res.json({ success: true, message: 'Role updated.', data: role });
  } catch (err) {
    console.error('updateRole error:', err);
    res.status(500).json({ message: 'Failed to update role.' });
  }
};

/**
 * DELETE /api/roles/:id
 */
const deleteRole = async (req, res) => {
  try {
    const roleId = Number(req.params.id);

    // Unlink employees from this role first
    await prisma.employee.updateMany({
      where: { companyRoleId: roleId },
      data: { companyRoleId: null },
    });

    await prisma.companyRole.delete({ where: { id: roleId } });
    res.json({ success: true, message: 'Role deleted.' });
  } catch (err) {
    console.error('deleteRole error:', err);
    res.status(500).json({ message: 'Failed to delete role.' });
  }
};

/**
 * PUT /api/roles/:id/permissions — Save full permission matrix for a role
 * Body: { permissions: [{ module, canRead, canWrite, canCreate, canDelete, canImport, canExport }] }
 */
const savePermissions = async (req, res) => {
  try {
    const companyRoleId = Number(req.params.id);
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions must be an array.' });
    }

    // Upsert each module's permissions
    await Promise.all(
      permissions.map(({ module, canRead, canWrite, canCreate, canDelete, canImport, canExport }) =>
        prisma.rolePermission.upsert({
          where: { companyRoleId_module: { companyRoleId, module } },
          create: { companyRoleId, module, canRead, canWrite, canCreate, canDelete, canImport, canExport },
          update: { canRead, canWrite, canCreate, canDelete, canImport, canExport },
        })
      )
    );

    const updatedPermissions = await prisma.rolePermission.findMany({ where: { companyRoleId } });
    res.json({ success: true, message: 'Permissions saved.', data: updatedPermissions });
  } catch (err) {
    console.error('savePermissions error:', err);
    res.status(500).json({ message: 'Failed to save permissions.' });
  }
};

/**
 * PUT /api/roles/:id/assign-employee — Assign employee to a role
 * Body: { employeeId }
 */
const assignEmployeeRole = async (req, res) => {
  try {
    const companyRoleId = Number(req.params.id);
    const { employeeId } = req.body;

    await prisma.employee.update({
      where: { id: Number(employeeId) },
      data: { companyRoleId },
    });

    res.json({ success: true, message: 'Employee role assigned.' });
  } catch (err) {
    console.error('assignEmployeeRole error:', err);
    res.status(500).json({ message: 'Failed to assign role.' });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  savePermissions,
  assignEmployeeRole,
  AVAILABLE_MODULES,
};
