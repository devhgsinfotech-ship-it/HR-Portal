// backend/src/controllers/cronJobController.js
const prisma = require('../config/prisma');
const { executeJob, toggleCronJob } = require('../cron/cronManager');

async function getCronJobs(req, res) {
    try {
        const jobs = await prisma.cronJob.findMany({
            orderBy: { id: 'asc' }
        });
        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        console.error('Error fetching cron jobs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch cron jobs' });
    }
}

async function runCronJob(req, res) {
    try {
        const { key } = req.params;
        if (!key) {
            return res.status(400).json({ success: false, message: 'Cron job key is required' });
        }

        const result = await executeJob(key);
        res.json({
            success: true,
            message: `Cron job '${result.name}' executed successfully.`,
            data: result
        });
    } catch (error) {
        console.error('Error running cron job:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to execute cron job' });
    }
}

async function toggleCronJobStatus(req, res) {
    try {
        const { key } = req.params;
        const { status } = req.body;

        if (!['ACTIVE', 'PAUSED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Must be ACTIVE or PAUSED.' });
        }

        const updated = await toggleCronJob(key, status);
        res.json({
            success: true,
            message: `Cron job '${updated.name}' is now ${status.toLowerCase()}.`,
            data: updated
        });
    } catch (error) {
        console.error('Error updating cron job status:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update cron job status' });
    }
}

module.exports = {
    getCronJobs,
    runCronJob,
    toggleCronJobStatus
};
