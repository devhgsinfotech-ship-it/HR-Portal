const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');

// Get Paginated Feed
async function getPosts(req, res) {
    try {
        const companyId = req.user.companyId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await prisma.post.findMany({
            where: { companyId, status: 'PUBLISHED' },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true }
                },
                attachments: true,
                mentions: {
                    include: {
                        employee: { select: { id: true, firstName: true, lastName: true } }
                    }
                },
                likes: {
                    select: { employeeId: true }
                },
                comments: {
                    include: {
                        author: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        const total = await prisma.post.count({ where: { companyId, status: 'PUBLISHED' } });

        res.json({
            posts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

// Create new post
async function createPost(req, res) {
    try {
        const { content, postType, status } = req.body;
        // Parse mentions if they were sent as stringified JSON
        let parsedMentions = [];
        if (req.body.mentions) {
             try {
                parsedMentions = typeof req.body.mentions === 'string' ? JSON.parse(req.body.mentions) : req.body.mentions;
             } catch(e) {}
        }
        
        const userId = req.user.id;
        const companyId = req.user.companyId;

        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const attachmentData = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                attachmentData.push({
                    fileUrl: `uploads/posts/${file.filename}`,
                    fileType: file.mimetype.startsWith('image/') ? 'image' : 
                              file.mimetype.startsWith('video/') ? 'video' : 'document',
                    fileName: file.originalname
                });
            });
        }

        const newPost = await prisma.post.create({
            data: {
                companyId,
                authorId: employee.id,
                content,
                postType: postType || 'GENERAL',
                status: status || 'PUBLISHED',
                attachments: attachmentData.length > 0 ? { create: attachmentData } : undefined,
                mentions: parsedMentions.length > 0 ? {
                    create: parsedMentions.map(empId => ({
                        employeeId: parseInt(empId)
                    }))
                } : undefined
            },
            include: {
                author: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
                attachments: true,
                mentions: { include: { employee: { select: { id: true, firstName: true, lastName: true } } } },
                likes: true,
                comments: true
            }
        });

        res.status(201).json(newPost);
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

// Update post (edit / draft publish)
async function updatePost(req, res) {
    try {
        const postId = parseInt(req.params.id);
        const { content, status } = req.body;
        const userId = req.user.id;
        
        const employee = await prisma.employee.findUnique({ where: { userId } });
        const existingPost = await prisma.post.findUnique({ where: { id: postId } });

        if (!existingPost) return res.status(404).json({ message: 'Post not found' });
        if (existingPost.authorId !== employee.id) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        // Keep it simple for MVP: append new attachments. We don't delete old ones for now.
        const attachmentData = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                attachmentData.push({
                    fileUrl: `uploads/posts/${file.filename}`,
                    fileType: file.mimetype.startsWith('image/') ? 'image' : 
                              file.mimetype.startsWith('video/') ? 'video' : 'document',
                    fileName: file.originalname
                });
            });
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: {
                content: content || existingPost.content,
                status: status || existingPost.status,
                attachments: attachmentData.length > 0 ? { create: attachmentData } : undefined
            },
            include: {
                author: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } },
                attachments: true,
                mentions: { include: { employee: { select: { id: true, firstName: true, lastName: true } } } },
                likes: true,
                comments: true
            }
        });

        res.json(updatedPost);
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

// Delete Post
async function deletePost(req, res) {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;
        
        const employee = await prisma.employee.findUnique({ where: { userId } });
        const existingPost = await prisma.post.findUnique({ 
            where: { id: postId },
            include: { attachments: true } 
        });

        if (!existingPost) return res.status(404).json({ message: 'Post not found' });
        
        // Ensure user is author OR user is Admin/HR (Assuming role check here, but simple author check for MVP)
        // If we want admin to delete: check req.user.role === 'SUPER_ADMIN' || 'HR'
        if (existingPost.authorId !== employee.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'HR') {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await prisma.post.delete({ where: { id: postId } });

        // Cleanup files
        const UPLOAD_BASE = process.env.UPLOAD_PATH ? path.resolve(process.env.UPLOAD_PATH) : path.resolve('uploads');
        existingPost.attachments.forEach(att => {
            if (att.fileUrl) {
                const filePath = path.join(UPLOAD_BASE, '..', att.fileUrl); // fileUrl is 'uploads/posts/...' so we go back one dir
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

// Toggle Like
async function toggleLike(req, res) {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;
        
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { author: true }
        });

        if (!post) return res.status(404).json({ message: 'Post not found' });

        const existingLike = await prisma.postLike.findUnique({
            where: {
                postId_employeeId: {
                    postId,
                    employeeId: employee.id
                }
            }
        });

        if (existingLike) {
            await prisma.postLike.delete({ where: { id: existingLike.id } });
            // Optionally delete the notification if unliked
            await prisma.notification.deleteMany({
                where: {
                    receiverId: post.author.userId,
                    senderId: userId,
                    type: 'POST_LIKE',
                    referenceId: postId
                }
            });
            res.json({ message: 'Unliked', liked: false });
        } else {
            await prisma.postLike.create({
                data: {
                    postId,
                    employeeId: employee.id
                }
            });

            // Create Notification
            if (post.author.userId !== userId) {
                await prisma.notification.create({
                    data: {
                        receiverId: post.author.userId,
                        senderId: userId,
                        type: 'POST_LIKE',
                        title: 'New Like',
                        message: `${employee.firstName} ${employee.lastName} liked your post.`,
                        referenceId: postId
                    }
                });
            }

            res.json({ message: 'Liked', liked: true });
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

// Add Comment
async function addComment(req, res) {
    try {
        const postId = parseInt(req.params.id);
        const { content } = req.body;
        const userId = req.user.id;
        
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { author: true }
        });

        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = await prisma.postComment.create({
            data: {
                postId,
                authorId: employee.id,
                content
            },
            include: {
                author: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } }
            }
        });

        // Create Notification
        if (post.author.userId !== userId) {
            await prisma.notification.create({
                data: {
                    receiverId: post.author.userId,
                    senderId: userId,
                    type: 'POST_COMMENT',
                    title: 'New Comment',
                    message: `${employee.firstName} ${employee.lastName} commented on your post: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
                    referenceId: postId
                }
            });
        }

        res.status(201).json(comment);
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

module.exports = {
    getPosts,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    addComment
};
