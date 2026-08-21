// backend/src/routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireAdminOnly } = require('../middleware/projectPermission');
const {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  savePermissions,
  assignEmployeeRole,
} = require('../controllers/rolePermissionController');

// All Admin/HR only operations
router.get('/',    verifyToken, requireAdminOnly, getRoles);
router.get('/:id', verifyToken, requireAdminOnly, getRoleById);
router.post('/',   verifyToken, requireAdminOnly, createRole);
router.put('/:id', verifyToken, requireAdminOnly, updateRole);
router.delete('/:id', verifyToken, requireAdminOnly, deleteRole);

// Permission matrix save
router.put('/:id/permissions',     verifyToken, requireAdminOnly, savePermissions);

// Assign employee to role
router.put('/:id/assign-employee', verifyToken, requireAdminOnly, assignEmployeeRole);

module.exports = router;
