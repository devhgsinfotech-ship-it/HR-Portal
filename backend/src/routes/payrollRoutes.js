// backend/src/routes/payrollRoutes.js
const express = require('express');
const router  = express.Router();
const payroll = require('../controllers/payrollController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// ── Salary Structure Configuration (HR only) ──────────────────
router.get('/salary-structures', requireRole('HR', 'SUPER_ADMIN'), payroll.listSalaryStructures);
router.put('/salary-structures/:employeeId', requireRole('HR', 'SUPER_ADMIN'), payroll.upsertSalaryStructure);

// ── Payroll Policy (HR only) ──────────────────────────────────
router.get('/policy',  requireRole('HR', 'SUPER_ADMIN'), payroll.getPayrollPolicy);
router.put('/policy',  requireRole('HR', 'SUPER_ADMIN'), payroll.updatePayrollPolicy);

// ── Payroll Periods ───────────────────────────────────────────
router.get('/periods',                requireRole('HR', 'SUPER_ADMIN'), payroll.listPayrollPeriods);
router.post('/periods',               requireRole('HR', 'SUPER_ADMIN'), payroll.startPayrollPeriod);
router.get('/periods/:periodId/inputs',    requireRole('HR', 'SUPER_ADMIN'), payroll.getPayrollInputs);
router.post('/periods/:periodId/calculate', requireRole('HR', 'SUPER_ADMIN'), payroll.calculatePayrollBatch);
router.get('/periods/:periodId/entries',   requireRole('HR', 'SUPER_ADMIN'), payroll.getPayrollEntries);
router.post('/periods/:periodId/approve',  requireRole('HR', 'SUPER_ADMIN'), payroll.approvePayrollPeriod);

// ── Entry Overrides (HR only) ─────────────────────────────────
router.put('/entries/:entryId/override', requireRole('HR', 'SUPER_ADMIN'), payroll.overridePayrollEntry);

// ── Payslips ──────────────────────────────────────────────────
router.get('/payslips',            payroll.getPayslips);
router.get('/payslips/:payslipId', payroll.getPayslipDetail);

module.exports = router;
