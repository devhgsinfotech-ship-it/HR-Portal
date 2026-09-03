const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get unread notifications for a user
async function getMyNotifications(req, res) {
    try {
        const userId = req.user.id;
        const notifications = await prisma.notification.findMany({
            where: { receiverId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } }
            },
            take: 20
        });
        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// Mark all as read
async function markAllAsRead(req, res) {
    try {
        const userId = req.user.id;
        await prisma.notification.updateMany({
            where: { receiverId: userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = {
    getMyNotifications,
    markAllAsRead
};
