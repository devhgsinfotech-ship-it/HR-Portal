// backend/src/controllers/employeeController.js

const prisma = require('../config/prisma');

// GET /employees  (HR only)
async function getAllEmployees(req, res) {
  const employees = await prisma.employees.findMany({
    include: { users: { select: { email: true, role: true, account_status: true } } },
  });
  res.json(employees);
}

// GET /employees/me/salary  (employee, own data only — gated by checkTabAccess('salary'))
async function getMySalary(req, res) {
  const salary = await prisma.salary_structures.findFirst({
    where: { employee_id: req.employee.id },
    orderBy: { effective_from: 'desc' },
  });
  res.json(salary);
}

module.exports = { getAllEmployees, getMySalary };
