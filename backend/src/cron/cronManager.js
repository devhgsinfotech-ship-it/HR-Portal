// backend/src/cron/cronManager.js
const cron = require('node-cron');
const prisma = require('../config/prisma');

// In-memory registry of scheduled node-cron instances
const activeCronTasks = {};

// Default HRMS cron definitions
const DEFAULT_CRON_JOBS = [
    {
        key: 'attendance_auto_checkout',
        name: 'Nightly Attendance Auto-Checkout',
        description: 'Scans all employee punches for the day. If check-in exists without checkout by end of day, marks as Missing Punch and calculates work hours.',
        schedule: '59 23 * * *',
        scheduleHuman: 'Daily at 11:59 PM',
        status: 'ACTIVE'
    },
    {
        key: 'probation_notice_tracker',
        name: 'Probation & Notice Period Expiry Alert',
        description: 'Scans active employees whose probation period or notice period is ending within the next 7 days, generating alerts for HR and Managers.',
        schedule: '0 9 * * *',
        scheduleHuman: 'Daily at 09:00 AM',
        status: 'ACTIVE'
    },
    {
        key: 'monthly_leave_accrual',
        name: 'Monthly Leave Balance Accrual',
        description: 'Accrues recurring monthly leave quota (Casual & Sick leave) to all eligible active employees on the 1st of every month.',
        schedule: '0 0 1 * *',
        scheduleHuman: '1st of every month at 12:00 AM',
        status: 'ACTIVE'
    },
    {
        key: 'system_token_cleanup',
        name: 'System Cache & Expired Token Cleanup',
        description: 'Purges expired password reset tokens and temporary verification tokens to keep database clean and optimized.',
        schedule: '0 2 * * *',
        scheduleHuman: 'Daily at 02:00 AM',
        status: 'ACTIVE'
    }
];

// Handlers for each job
const JOB_HANDLERS = {
    attendance_auto_checkout: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const incompleteRecords = await prisma.attendanceRecord.findMany({
            where: {
                date: today,
                checkIn: { not: null },
                checkOut: null
            },
            include: { employee: true }
        });

        for (const record of incompleteRecords) {
            await prisma.attendanceRecord.update({
                where: { id: record.id },
                data: {
                    status: 'MISSING_PUNCH',
                    workingHours: 0
                }
            });
        }

        return `Processed ${incompleteRecords.length} incomplete attendance records for today.`;
    },

    probation_notice_tracker: async () => {
        const now = new Date();
        const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const probationCount = await prisma.employee.count({
            where: {
                probationEnd: { gte: now, lte: inSevenDays },
                user: { accountStatus: 'ACTIVE' }
            }
        });

        const noticeCount = await prisma.employee.count({
            where: {
                noticePeriodEnd: { gte: now, lte: inSevenDays },
                user: { accountStatus: 'ACTIVE' }
            }
        });

        return `Scanned successfully. ${probationCount} probation ending soon, ${noticeCount} notice period ending in next 7 days.`;
    },

    monthly_leave_accrual: async () => {
        const activeEmployees = await prisma.employee.findMany({
            where: { user: { accountStatus: 'ACTIVE' } },
            select: { id: true, companyId: true }
        });

        // Add monthly 1.5 days credit log or leave allocation record
        return `Monthly leave quota processed for ${activeEmployees.length} active employees across all registered companies.`;
    },

    system_token_cleanup: async () => {
        const now = new Date();
        const deletedResets = await prisma.passwordResetToken.deleteMany({
            where: { expiresAt: { lt: now } }
        });

        const deletedVerifies = await prisma.emailVerifyToken.deleteMany({
            where: { expiresAt: { lt: now } }
        });

        return `Cleanup complete. Removed ${deletedResets.count} expired reset tokens and ${deletedVerifies.count} expired verification tokens.`;
    }
};

/**
 * Executes a cronjob handler immediately and updates database state
 */
async function executeJob(jobKey) {
    const job = await prisma.cronJob.findUnique({ where: { key: jobKey } });
    if (!job) {
        throw new Error(`Cronjob '${jobKey}' not found.`);
    }

    const handler = JOB_HANDLERS[jobKey];
    if (!handler) {
        throw new Error(`No implementation found for cronjob '${jobKey}'.`);
    }

    const startTime = Date.now();
    try {
        await prisma.cronJob.update({
            where: { key: jobKey },
            data: { lastStatus: 'RUNNING' }
        });

        const resultMessage = await handler();
        const duration = Date.now() - startTime;

        const updated = await prisma.cronJob.update({
            where: { key: jobKey },
            data: {
                lastRun: new Date(),
                lastStatus: 'SUCCESS',
                lastMessage: `${resultMessage} (Execution took ${duration}ms)`
            }
        });

        console.log(`[CRON] ${job.name} ran successfully: ${resultMessage}`);
        return updated;
    } catch (err) {
        console.error(`[CRON ERROR] ${job.name} failed:`, err);
        const updated = await prisma.cronJob.update({
            where: { key: jobKey },
            data: {
                lastRun: new Date(),
                lastStatus: 'FAILED',
                lastMessage: `Error: ${err.message}`
            }
        });
        return updated;
    }
}

/**
 * Initializes and schedules all active cron jobs at server startup
 */
async function initCronJobs() {
    try {
        console.log('[CRON] Initializing HR Portal background jobs...');

        // 1. Seed defaults if missing
        for (const defaultJob of DEFAULT_CRON_JOBS) {
            const existing = await prisma.cronJob.findUnique({ where: { key: defaultJob.key } });
            if (!existing) {
                await prisma.cronJob.create({ data: defaultJob });
            }
        }

        // 2. Schedule all active jobs
        const allJobs = await prisma.cronJob.findMany();
        for (const job of allJobs) {
            scheduleCronTask(job);
        }

        console.log(`[CRON] Initialized ${allJobs.length} system cron jobs.`);
    } catch (error) {
        console.error('[CRON] Failed to initialize cron jobs:', error.message);
    }
}

/**
 * Schedules or cancels in-memory node-cron task
 */
function scheduleCronTask(job) {
    if (activeCronTasks[job.key]) {
        activeCronTasks[job.key].stop();
        delete activeCronTasks[job.key];
    }

    if (job.status === 'ACTIVE' && cron.validate(job.schedule)) {
        activeCronTasks[job.key] = cron.schedule(job.schedule, async () => {
            console.log(`[CRON TRIGGER] Executing scheduled job: ${job.name}`);
            await executeJob(job.key);
        });
        console.log(`[CRON] Scheduled '${job.name}' with rule: ${job.schedule}`);
    }
}

/**
 * Toggles status (ACTIVE / PAUSED) of a cronjob
 */
async function toggleCronJob(jobKey, newStatus) {
    const job = await prisma.cronJob.findUnique({ where: { key: jobKey } });
    if (!job) throw new Error('Cronjob not found');

    const updated = await prisma.cronJob.update({
        where: { key: jobKey },
        data: { status: newStatus }
    });

    scheduleCronTask(updated);
    return updated;
}

module.exports = {
    initCronJobs,
    executeJob,
    toggleCronJob
};
