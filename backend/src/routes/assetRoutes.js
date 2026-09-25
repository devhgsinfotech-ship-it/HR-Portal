// backend/src/routes/assetRoutes.js
const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Asset Categories
router.get('/categories', assetController.getCategories);
router.post('/categories', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), assetController.createCategory);
router.put('/categories/:id', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), assetController.updateCategory);
router.delete('/categories/:id', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), assetController.deleteCategory);

// Employee My Assets
router.get('/my-assets', assetController.getMyAssets);

// Assets Inventory
router.get('/', assetController.getAssets);
router.post('/', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), assetController.createAsset);
router.put('/:id', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), assetController.updateAsset);
router.delete('/:id', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), assetController.deleteAsset);

// Assign & Return Asset
router.post('/:id/assign', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), assetController.assignAsset);
router.post('/:id/return', requireRole('COMPANY_ADMIN', 'HR', 'MANAGER'), assetController.returnAsset);
router.post('/:id/request-return', assetController.requestAssetReturn);

module.exports = router;
