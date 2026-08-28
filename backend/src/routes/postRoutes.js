const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH) 
    : path.resolve('uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = path.join(UPLOAD_BASE, 'posts');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

router.use(verifyToken); // Ensure user is authenticated

// Get all posts for the company (with pagination)
router.get('/', postController.getPosts);

// Create a new post with multiple attachments
router.post('/', upload.array('attachments', 10), postController.createPost);

// Edit/Draft post
router.put('/:id', upload.array('attachments', 10), postController.updatePost);

// Delete post
router.delete('/:id', postController.deletePost);

// Toggle a like on a post
router.post('/:id/like', postController.toggleLike);

// Add a comment to a post
router.post('/:id/comments', postController.addComment);

module.exports = router;
