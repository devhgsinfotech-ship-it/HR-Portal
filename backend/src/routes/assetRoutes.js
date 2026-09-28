// backend/src/routes/assetRoutes.js
const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { verifyToken, requireCompanyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// ── Asset Categories ──
// All authenticated users can view categories
router.get('/categories', assetController.getCategories);
// Only COMPANY_ADMIN, HR, MANAGER can manage asset categories
// SUPER_ADMIN cannot manage company assets (per screenshot: "Company assets managed by Company Admin/HR")
router.post('/categories',    requireCompanyRole('HR', 'MANAGER'), assetController.createCategory);
router.put('/categories/:id', requireCompanyRole('HR', 'MANAGER'), assetController.updateCategory);
router.delete('/categories/:id', requireCompanyRole('HR', 'MANAGER'), assetController.deleteCategory);

// ── Employee My Assets ──
router.get('/my-assets', assetController.getMyAssets);

// ── Assets Inventory ──
// All authenticated users can view the asset list
router.get('/', assetController.getAssets);
// Only COMPANY_ADMIN, HR, MANAGER can manage assets
router.post('/',   requireCompanyRole('HR', 'MANAGER'), assetController.createAsset);
router.put('/:id', requireCompanyRole('HR', 'MANAGER'), assetController.updateAsset);
router.delete('/:id', requireCompanyRole('HR', 'MANAGER'), assetController.deleteAsset);

// ── Assign & Return Asset ──
router.post('/:id/assign',         requireCompanyRole('HR', 'MANAGER'), assetController.assignAsset);
router.post('/:id/return',         requireCompanyRole('HR', 'MANAGER'), assetController.returnAsset);
router.post('/:id/request-return', assetController.requestAssetReturn);

module.exports = router;
