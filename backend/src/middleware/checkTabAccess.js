// backend/src/middleware/checkTabAccess.js
// Blocks a route unless HR has enabled this tab for the logged-in employee

const prisma = require('../config/prisma');

function checkTabAccess(tabName) {
  return async (req, res, next) => {
    try {
      const employee = await prisma.employees.findUnique({
        where: { user_id: req.user.id },
      });

      if (!employee) {
        return res.status(404).json({ message: 'Employee profile not found' });
      }

      const access = await prisma.employee_tab_access.findUnique({
        where: {
          employee_id_tab_name: {
            employee_id: employee.id,
            tab_name: tabName,
          },
        },
      });

      if (!access || !access.is_enabled) {
        return res.status(403).json({ message: 'Access to this section is restricted by HR' });
      }

      req.employee = employee;
      next();
    } catch (err) {
      res.status(500).json({ message: 'Server error checking access', error: err.message });
    }
  };
}

module.exports = checkTabAccess;
