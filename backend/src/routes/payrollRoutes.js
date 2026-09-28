// backend/src/routes/payrollRoutes.js
const express = require('express');
const router  = express.Router();
const payroll = require('../controllers/payrollController');
const { verifyToken, requireRole, requireCompanyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// ── Salary Structure Configuration (Company HR only — SUPER_ADMIN view only) ──
// SUPER_ADMIN can VIEW salary structures for support purposes
router.get('/salary-structures',           requireRole('HR', 'SUPER_ADMIN'),         payroll.listSalaryStructures);
// Only Company Admin/HR can CREATE or EDIT salary structures
router.put('/salary-structures/:employeeId', requireCompanyRole('HR'),               payroll.upsertSalaryStructure);

// ── Payroll Policy (Company HR only) ──
router.get('/policy',  requireRole('HR', 'SUPER_ADMIN'),   payroll.getPayrollPolicy);
router.put('/policy',  requireCompanyRole('HR'),           payroll.updatePayrollPolicy);

// ── Payroll Periods ──
// View: SUPER_ADMIN allowed (support/reporting visibility)
router.get('/periods',                    requireRole('HR', 'SUPER_ADMIN'),          payroll.listPayrollPeriods);
// Create/Manage period: Company HR only
router.post('/periods',                   requireCompanyRole('HR'),                  payroll.startPayrollPeriod);
router.get('/periods/:periodId/inputs',   requireRole('HR', 'SUPER_ADMIN'),          payroll.getPayrollInputs);
// Calculate & Approve: Company HR only (not a SUPER_ADMIN daily operation)
router.post('/periods/:periodId/calculate', requireCompanyRole('HR'),               payroll.calculatePayrollBatch);
router.get('/periods/:periodId/entries',    requireRole('HR', 'SUPER_ADMIN'),        payroll.getPayrollEntries);
router.post('/periods/:periodId/approve',   requireCompanyRole('HR'),               payroll.approvePayrollPeriod);

// ── Entry Overrides (Company HR only) ──
router.put('/entries/:entryId/override',  requireCompanyRole('HR'),                 payroll.overridePayrollEntry);

// ── Payslips (own payslips — filtered in controller by role) ──
router.get('/payslips',            payroll.getPayslips);
router.get('/payslips/:payslipId', payroll.getPayslipDetail);

module.exports = router;
