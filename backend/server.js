// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Parse allowed origins dynamically from environment variables (with fallback for aaups.com)
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_DOMAIN || 'aaups.com';
const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map(originStr => originStr.trim())
    .filter(Boolean)
    .map(originStr => {
        if (originStr.includes('://')) {
            try {
                return new URL(originStr).hostname;
            } catch (e) {
                return originStr.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
            }
        }
        return originStr.split('/')[0].split(':')[0];
    });

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like curl, Postman, mobile apps)
        if (!origin) return callback(null, true);

        try {
            const originUrl = new URL(origin);
            const originHostname = originUrl.hostname;

            // In development, automatically allow localhost and local IPs
            if (process.env.NODE_ENV !== 'production') {
                if (
                    originHostname === 'localhost' ||
                    originHostname === '127.0.0.1' ||
                    originHostname.endsWith('.localhost')
                ) {
                    return callback(null, true);
                }
            }

            // Check against allowed origins list from environment variables
            const isAllowed = allowedOrigins.some(targetDomain => {
                return originHostname === targetDomain || originHostname.endsWith('.' + targetDomain);
            });

            if (isAllowed) {
                return callback(null, true);
            }
        } catch (err) {
            // Safe fallback if origin is in clean domain env list
            const cleanOrigin = origin.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
            if (allowedOrigins.includes(cleanOrigin)) {
                return callback(null, true);
            }
        }

        console.error(`[CORS BLOCKED] Origin: "${origin}" | Allowed:`, allowedOrigins);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());

// Serve uploaded files from directory configured in env (persistent upload path)
const UPLOAD_BASE = process.env.UPLOAD_PATH
    ? path.resolve(process.env.UPLOAD_PATH)
    : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOAD_BASE));

// Routes are added incrementally as each feature is built.
// Uncomment each line once its route file exists AND (for Prisma-backed
// routes) your schema.prisma has models and `npx prisma generate` has run.
//
const authRoutes = require('./src/routes/authRoutes');
const departmentRoutes = require('./src/routes/departmentRoutes');
const designationRoutes = require('./src/routes/designationRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const leaveRoutes = require('./src/routes/leaveRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const holidayRoutes = require('./src/routes/holidayRoutes'); // Added Holiday Routes
const hrDashboardRoutes = require('./src/routes/hrDashboardRoutes');
const announcementRoutes = require('./src/routes/announcementRoutes');

// PSA Module Routes
const clientRoutes = require('./src/routes/clientRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const timesheetRoutes = require('./src/routes/timesheetRoutes');
const roleRoutes = require('./src/routes/roleRoutes');
const payrollRoutes = require('./src/routes/payrollRoutes');

// SaaS Subscription Billing Routes & Seeder
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const { seedDefaultPlans } = require('./src/utils/seedDefaultPlans');

// Phase 4 Routes: Assets, Documents & Notifications
const assetRoutes = require('./src/routes/assetRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

// Initialize Cron Jobs
require('./src/cron/attendanceJobs');

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/departments', departmentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/designations', designationRoutes);
app.use('/api/designations', designationRoutes);
app.use('/employees', employeeRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/leaves', leaveRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/holidays', holidayRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/dashboard', hrDashboardRoutes);
app.use('/api/dashboard', hrDashboardRoutes);
app.use('/announcements', announcementRoutes);
app.use('/api/announcements', announcementRoutes);

// PSA & Payroll Modules
app.use('/clients', clientRoutes);
app.use('/api/clients', clientRoutes);
app.use('/projects', projectRoutes);
app.use('/api/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/timesheets', timesheetRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/roles', roleRoutes);
app.use('/api/roles', roleRoutes);
app.use('/payroll', payrollRoutes);
app.use('/api/payroll', payrollRoutes);

// SaaS Subscriptions & Plans
app.use('/super-admin', subscriptionRoutes);
app.use('/api/super-admin', subscriptionRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Phase 4 APIs
app.use('/assets', assetRoutes);
app.use('/api/assets', assetRoutes);
app.use('/documents', documentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);

// Phase 5.1 & 5.2 Recruitment ATS & Referral Routes
const jobPostingRoutes = require('./src/routes/jobPostingRoutes');
const applicantRoutes = require('./src/routes/applicantRoutes');
const referralRoutes = require('./src/routes/referralRoutes');
app.use('/job-postings', jobPostingRoutes);
app.use('/api/job-postings', jobPostingRoutes);
app.use('/applicants', applicantRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/referrals', referralRoutes);
app.use('/api/referrals', referralRoutes);


const prisma = require('./src/config/prisma');
app.get('/health', async (req, res) => {
    try {
        // Attempt a simple DB query
        await prisma.user.findFirst({ select: { id: true } });
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
    }
});

// Auto-run prisma db push on startup to sync schema with database
const { execSync } = require('child_process');
const fs = require('fs');

function getPrismaSyncConfig() {
    // Dynamically locate schema.prisma file (checks backend/prisma or root prisma)
    let schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) {
        const altPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
        if (fs.existsSync(altPath)) {
            schemaPath = altPath;
        }
    }

    const prismaCli = require.resolve('prisma/build/index.js');
    const cmd = `"${process.execPath}" "${prismaCli}" db push --schema="${schemaPath}" --accept-data-loss`;

    return { cmd, env: { ...process.env } };
}

function runDbPush() {
    // On production servers, spawning child process CLI tasks on every HTTP startup is disabled for security.
    // Database sync runs via build step or when ENABLE_AUTO_DB_PUSH=true is set.
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AUTO_DB_PUSH !== 'true') {
        console.log('[DB] Production mode active: Database connected cleanly.');
        return;
    }
    try {
        console.log('[DB] Running prisma db push to sync schema...');
        const { cmd, env } = getPrismaSyncConfig();
        const output = execSync(cmd, {
            cwd: __dirname,
            timeout: 60000,
            stdio: 'pipe',
            env
        }).toString();
        console.log('[DB] Schema sync complete:', output.trim());
    } catch (err) {
        const stdErrOutput = err.stderr ? err.stderr.toString() : err.message;
        console.warn('[DB] Schema sync notice:', stdErrOutput);
    }
}

// Admin endpoint to manually trigger database sync
app.get('/admin/db-push', async (req, res) => {
    try {
        const { cmd, env } = getPrismaSyncConfig();
        const output = execSync(cmd, {
            cwd: __dirname,
            timeout: 60000,
            env
        }).toString();
        res.json({ success: true, output });
    } catch (err) {
        const stdErrOutput = err.stderr ? err.stderr.toString() : '';
        res.status(500).json({ success: false, error: err.message, stderr: stdErrOutput });
    }
});

// Admin endpoint to trigger Super Admin creation
app.get('/admin/seed-superadmin', async (req, res) => {
    try {
        const { seedSuperAdmin } = require('./src/utils/seedDefaultPlans');
        await seedSuperAdmin();
        res.json({ success: true, message: 'Super Admin check/creation complete.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // Sync database schema after server starts
    runDbPush();
    await seedDefaultPlans();
});