const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getCelebrations = async (req, res) => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        // Fetch all active employees with necessary fields
        const employees = await prisma.employee.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
                dateOfBirth: true,
                dateOfJoining: true,
            }
        });

        const birthdaysToday = [];
        const upcomingBirthdays = [];
        const workAnniversariesToday = [];
        const newJoiners = [];

        employees.forEach(emp => {
            // Birthdays
            if (emp.dateOfBirth) {
                const dob = new Date(emp.dateOfBirth);
                const dobMonth = dob.getMonth();
                const dobDay = dob.getDate();

                if (dobMonth === currentMonth && dobDay === currentDay) {
                    birthdaysToday.push(emp);
                } else {
                    // Check if upcoming in the next 30 days
                    const nextBirthday = new Date(today.getFullYear(), dobMonth, dobDay);
                    if (nextBirthday < today) {
                        nextBirthday.setFullYear(today.getFullYear() + 1);
                    }
                    const diffDays = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
                    if (diffDays > 0 && diffDays <= 30) {
                        upcomingBirthdays.push({ ...emp, diffDays, nextBirthday });
                    }
                }
            }

            // Work Anniversaries (ignore if they joined today)
            if (emp.dateOfJoining) {
                const doj = new Date(emp.dateOfJoining);
                const dojMonth = doj.getMonth();
                const dojDay = doj.getDate();
                const dojYear = doj.getFullYear();

                if (dojMonth === currentMonth && dojDay === currentDay && dojYear !== today.getFullYear()) {
                    const years = today.getFullYear() - dojYear;
                    workAnniversariesToday.push({ ...emp, years });
                }

                // New Joiners (joined in current month and year)
                if (dojMonth === currentMonth && dojYear === today.getFullYear()) {
                    newJoiners.push(emp);
                }
            }
        });

        // Sort upcoming birthdays by diffDays
        upcomingBirthdays.sort((a, b) => a.diffDays - b.diffDays);

        res.json({
            birthdaysToday,
            upcomingBirthdays,
            workAnniversariesToday,
            newJoiners
        });

    } catch (error) {
        console.error("Error fetching celebrations:", error);
        res.status(500).json({ error: "Failed to fetch celebrations" });
    }
};

module.exports = {
    getCelebrations
};
