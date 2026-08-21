// backend/src/routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireProjectAdmin } = require('../middleware/projectPermission');
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');

router.get('/',    verifyToken, getClients);
router.get('/:id', verifyToken, getClientById);
router.post('/',   verifyToken, requireProjectAdmin, createClient);
router.put('/:id', verifyToken, requireProjectAdmin, updateClient);
router.delete('/:id', verifyToken, requireProjectAdmin, deleteClient);

module.exports = router;

