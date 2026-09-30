// backend/src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { checkModulePermission, checkProjectModulePermission, requireProjectAccess } = require('../middleware/projectPermission');
const {
  getTasks,
  getTaskBoard,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addSubTask,
  toggleSubTask,
} = require('../controllers/taskController');

// Task list and board (all project roles)
router.get('/',      verifyToken, requireProjectAccess, getTasks);
router.get('/board', verifyToken, requireProjectAccess, getTaskBoard);

// Create/Edit/Delete — Admin/PM only
router.post('/',   verifyToken, checkProjectModulePermission('TASKS', 'create'), createTask);
router.put('/:id', verifyToken, checkProjectModulePermission('TASKS', 'write'), updateTask);
router.delete('/:id', verifyToken, checkProjectModulePermission('TASKS', 'delete'), deleteTask);

// Status update — all roles (employee guarded in controller)
router.patch('/:id/status', verifyToken, requireProjectAccess, updateTaskStatus);

// Sub-tasks
router.post('/:id/subtasks',         verifyToken, checkProjectModulePermission('TASKS', 'write'), addSubTask);
router.patch('/subtasks/:id/toggle', verifyToken, requireProjectAccess, toggleSubTask);

module.exports = router;
