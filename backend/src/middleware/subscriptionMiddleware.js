// backend/src/middleware/subscriptionMiddleware.js
const prisma = require('../config/prisma');

/**
 * Ensures the company has an active subscription or an unexpired trial period.
 * Super Admins bypass this check.
 */
async function checkSubscriptionActive(req, res, next) {
  try {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const companyId = req.user ? req.user.companyId : null;
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is missing from user token' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true }
    });

    if (!subscription) {
      return next(); // Default pass if no record, or handle as trial
    }

    const now = new Date();

    if (subscription.status === 'TRIAL') {
      if (new Date(subscription.trialEndsAt) < now) {
        return res.status(403).json({
          code: 'SUBSCRIPTION_TRIAL_EXPIRED',
          message: 'Your 14-day free trial has expired. Please upgrade your subscription plan to continue.'
        });
      }
    } else if (subscription.status !== 'ACTIVE') {
      return res.status(403).json({
        code: 'SUBSCRIPTION_INACTIVE',
        message: `Your subscription is currently ${subscription.status.toLowerCase()}. Please renew your plan to proceed.`
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('[MIDDLEWARE] Error in checkSubscriptionActive:', error);
    next(error);
  }
}

/**
 * Enforces employee count limits based on the company's subscription plan.
 */
async function checkEmployeeQuota(req, res, next) {
  try {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const companyId = req.user ? req.user.companyId : null;
    if (!companyId) return next();

    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true }
    });

    if (!subscription || !subscription.plan) {
      return next();
    }

    const maxEmployees = subscription.plan.maxEmployees;
    const currentEmployeesCount = await prisma.user.count({
      where: { companyId }
    });

    if (currentEmployeesCount >= maxEmployees) {
      return res.status(400).json({
        code: 'QUOTA_EXCEEDED',
        message: `Employee quota limit of ${maxEmployees} reached for the ${subscription.plan.name}. Upgrade your plan to add more team members.`
      });
    }

    next();
  } catch (error) {
    console.error('[MIDDLEWARE] Error in checkEmployeeQuota:', error);
    next(error);
  }
}

/**
 * Enforces storage quota limit (in GB) based on the company's subscription plan.
 */
async function checkStorageQuota(req, res, next) {
  try {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const companyId = req.user ? req.user.companyId : null;
    if (!companyId) return next();

    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true }
    });

    if (!subscription || !subscription.plan) {
      return next();
    }

    const maxStorageGb = subscription.plan.maxStorageGb;
    const maxStorageBytes = maxStorageGb * 1024 * 1024 * 1024;

    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../../uploads');
    let usedBytes = 0;

    if (fs.existsSync(uploadsDir)) {
      const getDirSize = (dirPath) => {
        let size = 0;
        try {
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
              size += getDirSize(filePath);
            } else if (stats.isFile()) {
              size += stats.size;
            }
          }
        } catch (e) {}
        return size;
      };
      usedBytes = getDirSize(uploadsDir);
    }

    // Check if incoming file pushes usage over limit
    const incomingFileSize = req.file ? req.file.size : (req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : 0);

    if ((usedBytes + incomingFileSize) > maxStorageBytes) {
      return res.status(400).json({
        code: 'STORAGE_QUOTA_EXCEEDED',
        message: `Storage quota limit of ${maxStorageGb} GB reached for the ${subscription.plan.name}. Upgrade your plan to store more files.`
      });
    }

    next();
  } catch (error) {
    console.error('[MIDDLEWARE] Error in checkStorageQuota:', error);
    next();
  }
}

module.exports = {
  checkSubscriptionActive,
  checkEmployeeQuota,
  checkStorageQuota
};
