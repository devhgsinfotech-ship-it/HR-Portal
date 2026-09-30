// backend/src/routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireProjectAdmin, checkModulePermission } = require('../middleware/projectPermission');
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');

router.get('/',    verifyToken, getClients);
router.get('/:id', verifyToken, getClientById);
router.post('/',   verifyToken, checkModulePermission('CLIENTS', 'create'), createClient);
router.put('/:id', verifyToken, checkModulePermission('CLIENTS', 'write'), updateClient);
router.delete('/:id', verifyToken, checkModulePermission('CLIENTS', 'delete'), deleteClient);

module.exports = router;

