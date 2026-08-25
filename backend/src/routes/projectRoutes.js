// backend/src/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireProjectAdmin, requireFinanceAccess, requireProjectAccess } = require('../middleware/projectPermission');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectBudget,
  getProjectFinancials,
  deleteProject,
  addProjectMembers,
  removeProjectMember,
  addMilestone,
  updateMilestone,
  getGanttData,
  getNotes,
  addNote,
  deleteNote,
  getFiles,
  addFile,
  deleteFile,
} = require('../controllers/projectController');

const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UPLOAD_BASE = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.resolve('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_BASE, 'documents');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `project-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// ── Project CRUD ──────────────────────────────────────────────────────────────
router.get('/',       verifyToken, requireProjectAccess, getProjects);
router.get('/:id',    verifyToken, requireProjectAccess, getProjectById);
router.post('/',      verifyToken, requireProjectAdmin,  createProject);
router.put('/:id',    verifyToken, requireProjectAdmin,  updateProject);
router.delete('/:id', verifyToken, requireProjectAdmin,  deleteProject);

// Legacy single-file upload (kept for backward compat)
router.post('/upload', verifyToken, requireProjectAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const fileUrl = `/uploads/documents/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// ── Budget (Finance/Admin only) ───────────────────────────────────────────────
router.put('/:id/budget',     verifyToken, requireFinanceAccess, updateProjectBudget);
router.get('/:id/financials', verifyToken, requireFinanceAccess, getProjectFinancials);

// ── Team Members (Admin/PM only) ──────────────────────────────────────────────
router.post('/:id/members',             verifyToken, requireProjectAdmin, addProjectMembers);
router.delete('/:id/members/:memberId', verifyToken, requireProjectAdmin, removeProjectMember);

// ── Milestones (Admin/PM only) ────────────────────────────────────────────────
router.post('/:id/milestones',         verifyToken, requireProjectAdmin, addMilestone);
router.put('/milestones/:milestoneId', verifyToken, requireProjectAdmin, updateMilestone);

// ── Notes (all project members) ───────────────────────────────────────────────
router.get('/:id/notes',        verifyToken, requireProjectAccess, getNotes);
router.post('/:id/notes',       verifyToken, requireProjectAccess, addNote);
router.delete('/notes/:noteId', verifyToken, requireProjectAccess, deleteNote);

// ── Files & Images (upload with multer) ───────────────────────────────────────
router.get('/:id/files',         verifyToken, requireProjectAccess, getFiles);
router.post('/:id/files',        verifyToken, requireProjectAccess, upload.single('file'), addFile);
router.delete('/files/:fileId',  verifyToken, requireProjectAccess, deleteFile);

// ── Gantt chart (all project roles) ──────────────────────────────────────────
router.get('/:id/gantt', verifyToken, requireProjectAccess, getGanttData);

module.exports = router;
