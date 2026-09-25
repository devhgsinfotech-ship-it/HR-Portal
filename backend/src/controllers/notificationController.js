// backend/src/controllers/notificationController.js
const prisma = require('../config/prisma');

// ============================================================
// GET USER NOTIFICATIONS
// ============================================================

async function getNotifications(req, res) {
  try {
    const receiverId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { receiverId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            employee: {
              select: {
                firstName: true,
                lastName: true,
                profilePhotoUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    const unreadCount = await prisma.notification.count({
      where: { receiverId, isRead: false }
    });

    const formatted = notifications.map(n => {
      let senderName = 'System Admin';
      let senderAvatar = null;
      if (n.sender) {
        if (n.sender.employee) {
          senderName = `${n.sender.employee.firstName} ${n.sender.employee.lastName || ''}`.trim();
          senderAvatar = n.sender.employee.profilePhotoUrl;
        } else {
          senderName = n.sender.name || n.sender.email;
        }
      }

      let targetUrl = null;
      const userRole = req.user.role;
      switch (n.type) {
        case 'ASSET_RETURN_REQUESTED':
        case 'ASSET_ASSIGNED':
          targetUrl = '/assets';
          break;
        case 'LEAVE_APPROVAL':
        case 'LEAVE_REJECTION':
          targetUrl = userRole === 'EMPLOYEE' ? '/leaves-employee' : '/leaves';
          break;
        case 'PAYSLIP_GENERATED':
          targetUrl = '/payslip';
          break;
        case 'ATTENDANCE_REMINDER':
          targetUrl = userRole === 'EMPLOYEE' ? '/attendance-employee' : '/attendance-admin';
          break;
        case 'HOLIDAY_REMINDER':
          targetUrl = '/hrm/holidays';
          break;
        case 'DOCUMENT_VERIFIED':
          targetUrl = '/pages/profile';
          break;
        case 'JOB_APPLICATION_RECEIVED':
          targetUrl = '/candidates';
          break;
        default:
          targetUrl = null;
      }

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
        senderName,
        senderAvatar,
        targetUrl
      };
    });

    res.json({
      notifications: formatted,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
}

// ============================================================
// MARK SINGLE NOTIFICATION AS READ
// ============================================================

async function markAsRead(req, res) {
  try {
    const receiverId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid notification ID' });

    const notification = await prisma.notification.findFirst({
      where: { id, receiverId }
    });

    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
}

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

async function markAllAsRead(req, res) {
  try {
    const receiverId = req.user.id;

    await prisma.notification.updateMany({
      where: { receiverId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
