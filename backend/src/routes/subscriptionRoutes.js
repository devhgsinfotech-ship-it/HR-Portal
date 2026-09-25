// backend/src/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All subscription routes require authentication
router.use(verifyToken);

// Tenant Company Admin Subscription View & Upgrade
router.get('/company', subscriptionController.getCompanySubscription);
router.post('/company/change-plan', subscriptionController.changeCompanyPlan);

// Super Admin Only Routes
router.use(requireRole('SUPER_ADMIN'));

// Super Admin Dashboard Summary Analytics
router.get('/dashboard-summary', subscriptionController.getDashboardSummary);

// Plans Management
router.get('/plans', subscriptionController.getPlans);
router.post('/plans', subscriptionController.createPlan);
router.put('/plans/:id', subscriptionController.updatePlan);
router.delete('/plans/:id', subscriptionController.deletePlan);

// Tenant Subscriptions Management
router.get('/subscriptions', subscriptionController.getSubscriptions);
router.put('/subscriptions/:companyId', subscriptionController.updateCompanySubscription);
router.post('/subscriptions/:companyId/extend-trial', subscriptionController.extendTrial);

// Invoices & Billing Management
router.get('/invoices', subscriptionController.getInvoices);
router.post('/invoices', subscriptionController.createInvoice);
router.put('/invoices/:id/status', subscriptionController.updateInvoiceStatus);

module.exports = router;
