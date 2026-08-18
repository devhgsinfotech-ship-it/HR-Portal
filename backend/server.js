// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like curl, Postman, mobile apps)
        if (!origin) return callback(null, true);

        // Allow localhost for development
        if (origin.includes('localhost')) return callback(null, true);

        // Allow the production domain
        const liveDomain = process.env.FRONTEND_DOMAIN || 'aaups.com';
        if (origin.includes(liveDomain)) {
            return callback(null, true);
        }

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

// Initialize Cron Jobs
require('./src/cron/attendanceJobs');

app.use('/auth', authRoutes);
app.use('/departments', departmentRoutes);
app.use('/designations', designationRoutes);
app.use('/employees', employeeRoutes);
app.use('/leaves', leaveRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/holidays', holidayRoutes);

const prisma = require('./src/config/prisma');
app.get('/health', async (req, res) => {
    try {
        // Attempt a simple DB query
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message, stack: error.stack });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Asynchronously push Prisma schema to database in the background
    // to prevent blocking server startup and causing Hostinger Gateway/Connection timeouts (408/504)
    const { exec } = require('child_process');
    console.log('Starting Prisma schema sync in background...');
    exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
        if (error) {
            console.error('Warning: Prisma schema sync failed in background:', error.message);
            return;
        }
        console.log('Prisma schema sync completed successfully in background.');
    });
});
