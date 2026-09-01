// backend/src/controllers/announcementController.js
const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE = process.env.UPLOAD_PATH
    ? path.resolve(process.env.UPLOAD_PATH)
    : path.resolve('uploads');

// GET /announcements — visible to ALL authenticated employees
async function getAnnouncements(req, res) {
    try {
        const companyId = req.user.companyId;
        const now = new Date();

        const announcements = await prisma.announcement.findMany({
            where: {
                companyId,
                publishedAt: { lte: now },
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: now } }
                ]
            },
            include: {
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true,
                        designation: { select: { name: true } }
                    }
                }
            },
            orderBy: { publishedAt: 'desc' }
        });

        res.json(announcements);
    } catch (error) {
        console.error('Get Announcements Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// POST /announcements — HR / SUPER_ADMIN only
async function createAnnouncement(req, res) {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.id;
        const { title, content, targetType, expiresAt, publishedAt } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        // Find the employee profile of the creator
        const creatorEmployee = await prisma.employee.findUnique({ where: { userId } });

        // Handle uploaded image
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/announcements/${req.file.filename}`;
        }

        const announcement = await prisma.announcement.create({
            data: {
                companyId,
                title,
                content,
                imageUrl,
                targetType: targetType || 'ALL',
                publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                createdByEmployeeId: creatorEmployee?.id || null
            },
            include: {
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true,
                        designation: { select: { name: true } }
                    }
                }
            }
        });

        res.status(201).json(announcement);
    } catch (error) {
        console.error('Create Announcement Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// PUT /announcements/:id — HR / SUPER_ADMIN only
async function updateAnnouncement(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const { title, content, targetType, expiresAt, publishedAt, removeImage } = req.body;

        const existing = await prisma.announcement.findUnique({ where: { id: Number(id) } });
        if (!existing || existing.companyId !== companyId) {
            return res.status(404).json({ message: 'Announcement not found or unauthorized' });
        }

        let imageUrl = existing.imageUrl;

        // Remove old image if requested
        if (removeImage === 'true' && existing.imageUrl) {
            const oldPath = path.join(UPLOAD_BASE, existing.imageUrl.replace('/uploads/', ''));
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            imageUrl = null;
        }

        // New image uploaded
        if (req.file) {
            if (existing.imageUrl) {
                const oldPath = path.join(UPLOAD_BASE, existing.imageUrl.replace('/uploads/', ''));
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            imageUrl = `/uploads/announcements/${req.file.filename}`;
        }

        const updated = await prisma.announcement.update({
            where: { id: Number(id) },
            data: {
                title: title ?? existing.title,
                content: content ?? existing.content,
                imageUrl,
                targetType: targetType ?? existing.targetType,
                publishedAt: publishedAt ? new Date(publishedAt) : existing.publishedAt,
                expiresAt: expiresAt ? new Date(expiresAt) : expiresAt === '' ? null : existing.expiresAt
            },
            include: {
                createdBy: {
                    select: {
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true,
                        designation: { select: { name: true } }
                    }
                }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update Announcement Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// DELETE /announcements/:id — HR / SUPER_ADMIN only
async function deleteAnnouncement(req, res) {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;

        const existing = await prisma.announcement.findUnique({ where: { id: Number(id) } });
        if (!existing || existing.companyId !== companyId) {
            return res.status(404).json({ message: 'Announcement not found or unauthorized' });
        }

        // Delete attached image file if exists
        if (existing.imageUrl) {
            const imgPath = path.join(UPLOAD_BASE, existing.imageUrl.replace('/uploads/', ''));
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }

        await prisma.announcement.delete({ where: { id: Number(id) } });
        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Delete Announcement Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
