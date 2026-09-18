// backend/src/utils/seedDefaultRoles.js

const DEFAULT_COMPANY_ROLES = [
  {
    name: 'HR Manager',
    description: 'Full HR control — employees, payroll, leaves, assets, settings',
    permissions: {
      EMPLOYEES:  { canRead: true, canWrite: true, canCreate: true, canDelete: true, canImport: true, canExport: true },
      ATTENDANCE: { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      LEAVES:     { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      PAYROLL:    { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      ASSETS:     { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      DOCUMENTS:  { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: false },
      REPORTS:    { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: true },
      SETTINGS:   { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: false },
      PROJECTS:   { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
      TASKS:      { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
      TIMESHEETS: { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
      CLIENTS:    { canRead: false, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
      FINANCE:    { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: true },
    },
  },
  {
    name: 'HR Executive',
    description: 'Day-to-day HR operations — no payroll access',
    permissions: {
      EMPLOYEES:  { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: true, canExport: true },
      ATTENDANCE: { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      LEAVES:     { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      PAYROLL:    { canRead: false, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
      DOCUMENTS:  { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: false },
      REPORTS:    { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
      SETTINGS:   { canRead: false, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
    },
  },
  {
    name: 'Manager / Team Lead',
    description: 'Manages team members, attendance approvals, leave requests & tasks',
    permissions: {
      EMPLOYEES:  { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
      ATTENDANCE: { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      LEAVES:     { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      PROJECTS:   { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      TASKS:      { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      TIMESHEETS: { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
    },
  },
  {
    name: 'Payroll Manager',
    description: 'Manages salary processing, payslips, bank details & payroll reports',
    permissions: {
      EMPLOYEES:  { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: true },
      ATTENDANCE: { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: true },
      LEAVES:     { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: true },
      PAYROLL:    { canRead: true, canWrite: true, canCreate: true, canDelete: true, canImport: true, canExport: true },
      FINANCE:    { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: true, canExport: true },
      REPORTS:    { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: true },
    },
  },
  {
    name: 'Recruiter',
    description: 'Handles hiring, job applicants, onboarding & employee documentation',
    permissions: {
      EMPLOYEES:  { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: true, canExport: false },
      DOCUMENTS:  { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: false },
    },
  },
  {
    name: 'Sales Manager',
    description: 'Manages client relations, projects, milestones & time tracking',
    permissions: {
      CLIENTS:    { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      PROJECTS:   { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      TASKS:      { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
      TIMESHEETS: { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
    },
  },
  {
    name: 'Finance Manager',
    description: 'Financial reports, payroll auditing & expense tracking',
    permissions: {
      PAYROLL:    { canRead: true, canWrite: true, canCreate: false, canDelete: false, canImport: false, canExport: true },
      FINANCE:    { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: true, canExport: true },
      REPORTS:    { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: true },
    },
  },
  {
    name: 'Employee',
    description: 'Default role — view self profile, log attendance, request leaves, view payslips',
    permissions: {
      EMPLOYEES:  { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
      ATTENDANCE: { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: false },
      LEAVES:     { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: false },
      PAYROLL:    { canRead: true, canWrite: false, canCreate: false, canDelete: false, canImport: false, canExport: false },
      DOCUMENTS:  { canRead: true, canWrite: true, canCreate: true, canDelete: false, canImport: false, canExport: false },
    },
  },
];

/**
 * Seed default company roles for a specific companyId within a Prisma transaction or client instance.
 * @param {Object} prismaClient - Prisma client or transaction client
 * @param {number} companyId - Target company ID
 */
async function seedDefaultCompanyRoles(prismaClient, companyId) {
  for (const roleDef of DEFAULT_COMPANY_ROLES) {
    const existing = await prismaClient.companyRole.findFirst({
      where: { companyId, name: roleDef.name },
    });

    let role = existing;
    if (!role) {
      role = await prismaClient.companyRole.create({
        data: {
          companyId,
          name: roleDef.name,
          description: roleDef.description,
        },
      });
    }

    // Seed permissions for each module defined in the role
    const permissionsToCreate = Object.entries(roleDef.permissions).map(([module, perms]) => ({
      companyRoleId: role.id,
      module,
      canRead: perms.canRead || false,
      canWrite: perms.canWrite || false,
      canCreate: perms.canCreate || false,
      canDelete: perms.canDelete || false,
      canImport: perms.canImport || false,
      canExport: perms.canExport || false,
    }));

    for (const perm of permissionsToCreate) {
      await prismaClient.rolePermission.upsert({
        where: {
          companyRoleId_module: {
            companyRoleId: role.id,
            module: perm.module,
          },
        },
        create: perm,
        update: {
          canRead: perm.canRead,
          canWrite: perm.canWrite,
          canCreate: perm.canCreate,
          canDelete: perm.canDelete,
          canImport: perm.canImport,
          canExport: perm.canExport,
        },
      });
    }
  }
}

module.exports = {
  DEFAULT_COMPANY_ROLES,
  seedDefaultCompanyRoles,
};
