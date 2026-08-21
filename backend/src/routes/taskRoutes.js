// backend/src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireProjectAdmin, requireProjectAccess } = require('../middleware/projectPermission');
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
router.post('/',   verifyToken, requireProjectAdmin, createTask);
router.put('/:id', verifyToken, requireProjectAdmin, updateTask);
router.delete('/:id', verifyToken, requireProjectAdmin, deleteTask);

// Status update — all roles (employee guarded in controller)
router.patch('/:id/status', verifyToken, requireProjectAccess, updateTaskStatus);

// Sub-tasks
router.post('/:id/subtasks',         verifyToken, requireProjectAdmin, addSubTask);
router.patch('/subtasks/:id/toggle', verifyToken, requireProjectAccess, toggleSubTask);

module.exports = router;
