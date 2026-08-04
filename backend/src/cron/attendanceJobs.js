const cron = require('node-cron');
const prisma = require('../config/prisma');

// Run every night at 11:59 PM
cron.schedule('59 23 * * *', async () => {
    console.log('Running nightly attendance job: checking for missing punches...');
    
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Find all records from today where checkIn is filled but checkOut is null
        const incompleteRecords = await prisma.attendanceRecord.findMany({
            where: {
                date: today,
                checkIn: { not: null },
                checkOut: null
            },
            include: {
                employee: {
                    include: {
                        user: true
                    }
                }
            }
        });
        
        for (const record of incompleteRecords) {
            // Get company policy
            const policy = await prisma.attendancePolicy.findUnique({ 
                where: { companyId: record.employee.user.companyId } 
            });
            
            // Mark as MISSING_PUNCH
            await prisma.attendanceRecord.update({
                where: { id: record.id },
                data: {
                    status: 'MISSING_PUNCH',
                    workingHours: 0
                }
            });
            console.log(`Marked MISSING_PUNCH for employee ${record.employeeId}`);
        }
    } catch (error) {
        console.error('Error running nightly attendance job:', error);
    }
});
