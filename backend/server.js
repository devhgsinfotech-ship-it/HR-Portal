// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like curl, Postman, mobile apps)
        if (!origin) return callback(null, true);

        // Allow localhost for development
        if (origin.includes('localhost')) return callback(null, true);

        // Allow any subdomain of yourhrms.com in production
        if (/^https?:\/\/([a-z0-9-]+\.)?yourhrms\.com$/.test(origin)) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());

// Routes are added incrementally as each feature is built.
// Uncomment each line once its route file exists AND (for Prisma-backed
// routes) your schema.prisma has models and `npx prisma generate` has run.
//
const authRoutes = require('./src/routes/authRoutes');
const departmentRoutes = require('./src/routes/departmentRoutes');
const designationRoutes = require('./src/routes/designationRoutes');
// const employeeRoutes = require('./src/routes/employeeRoutes');
// const salaryRoutes = require('./src/routes/salaryRoutes');
// const payslipRoutes = require('./src/routes/payslipRoutes');
// const leaveRoutes = require('./src/routes/leaveRoutes');
// const tabAccessRoutes = require('./src/routes/tabAccessRoutes');
// const holidayRoutes = require('./src/routes/holidayRoutes');

app.use('/auth', authRoutes);
app.use('/departments', departmentRoutes);
app.use('/designations', designationRoutes);
//app.use('/employees', employeeRoutes);
// app.use('/salary', salaryRoutes);
// app.use('/payslips', payslipRoutes);
// app.use('/leaves', leaveRoutes);
// app.use('/tab-access', tabAccessRoutes);
// app.use('/holidays', holidayRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
