// backend/src/controllers/trainingController.js
const prisma = require('../config/prisma');

function getCompanyId(req) {
    return req.user?.companyId;
}

const NON_ADMIN_USER_FILTER = {
    role: { notIn: ['SUPER_ADMIN', 'COMPANY_ADMIN'] }
};

const DEFAULT_TRAINING_TYPES = [
    { type: 'Git & Version Control', description: 'Git commands, branch workflows, rebasing, and GitHub PR collaboration' },
    { type: 'Frontend Frameworks', description: 'React, Next.js, state management, and modern UI performance optimization' },
    { type: 'Cloud & DevOps', description: 'Docker containerization, CI/CD pipeline automation, and cloud deployments' },
    { type: 'Agile & Team Leadership', description: 'Scrum rituals, sprint delivery, mentorship, and cross-functional communication' }
];

const DEFAULT_TRAINERS = [
    {
        firstName: 'Anthony',
        lastName: 'Lewis',
        email: 'anthony.lewis@example.com',
        phone: '(555) 234-8291',
        role: 'Cloud Solutions Architect',
        trainerType: 'EXTERNAL',
        status: 'ACTIVE',
        profilePhotoUrl: 'user-32.jpg',
        description: 'Specialist in cloud infrastructure and DevOps automation.'
    },
    {
        firstName: 'Brian',
        lastName: 'Villalobos',
        email: 'brian.v@example.com',
        phone: '(555) 738-9124',
        role: 'Staff Frontend Engineer',
        trainerType: 'INTERNAL',
        status: 'ACTIVE',
        profilePhotoUrl: 'user-09.jpg',
        description: 'Expert in modern JavaScript, React ecosystem, and frontend performance.'
    },
    {
        firstName: 'Harvey',
        lastName: 'Smith',
        email: 'harvey.smith@example.com',
        phone: '(555) 912-3847',
        role: 'Agile Practice Lead',
        trainerType: 'INTERNAL',
        status: 'ACTIVE',
        profilePhotoUrl: 'user-01.jpg',
        description: '10+ years mentoring engineering teams on Agile delivery and leadership.'
    }
];

async function ensureDefaultTrainingData(companyId) {
    if (!companyId) return;

    // 1. Ensure Training Types
    const typeCount = await prisma.trainingType.count({ where: { companyId } });
    if (typeCount === 0) {
        try {
            await prisma.trainingType.createMany({
                data: DEFAULT_TRAINING_TYPES.map(t => ({
                    companyId,
                    type: t.type,
                    description: t.description,
                    status: 'ACTIVE'
                })),
                skipDuplicates: true
            });
        } catch (e) {
            console.error('Error creating default training types:', e.message);
        }
    }

    // 2. Ensure Trainers
    const trainerCount = await prisma.trainer.count({ where: { companyId } });
    if (trainerCount === 0) {
        try {
            await prisma.trainer.createMany({
                data: DEFAULT_TRAINERS.map(t => ({
                    companyId,
                    firstName: t.firstName,
                    lastName: t.lastName,
                    email: t.email,
                    phone: t.phone,
                    role: t.role,
                    trainerType: t.trainerType,
                    status: t.status,
                    profilePhotoUrl: t.profilePhotoUrl,
                    description: t.description
                })),
                skipDuplicates: true
            });
        } catch (e) {
            console.error('Error creating default trainers:', e.message);
        }
    }

    // 3. Ensure Sample Training Programs if none exist
    const programCount = await prisma.trainingProgram.count({ where: { companyId } });
    if (programCount === 0) {
        try {
            const [types, trainers, employees] = await Promise.all([
                prisma.trainingType.findMany({ where: { companyId }, take: 2 }),
                prisma.trainer.findMany({ where: { companyId }, take: 2 }),
                prisma.employee.findMany({
                    where: { user: { companyId, ...NON_ADMIN_USER_FILTER } },
                    take: 3
                })
            ]);

            if (types.length > 0 && trainers.length > 0) {
                // Program 1
                const prog1 = await prisma.trainingProgram.create({
                    data: {
                        companyId,
                        trainingTypeId: types[0].id,
                        trainerId: trainers[0].id,
                        title: `${types[0].type} Fundamentals`,
                        description: types[0].description || 'Comprehensive training session.',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 14 * 86400000),
                        cost: 250.00,
                        status: 'ACTIVE'
                    }
                });

                if (employees.length > 0) {
                    await prisma.trainingParticipant.createMany({
                        data: employees.slice(0, 2).map(emp => ({
                            companyId,
                            trainingProgramId: prog1.id,
                            employeeId: emp.id,
                            attendanceStatus: 'ENROLLED'
                        })),
                        skipDuplicates: true
                    });
                }

                // Program 2 if 2nd type exists
                if (types.length > 1) {
                    const prog2 = await prisma.trainingProgram.create({
                        data: {
                            companyId,
                            trainingTypeId: types[1].id,
                            trainerId: trainers[1]?.id || trainers[0].id,
                            title: `Advanced ${types[1].type}`,
                            description: types[1].description || 'Advanced hands-on program.',
                            startDate: new Date(Date.now() + 7 * 86400000),
                            endDate: new Date(Date.now() + 21 * 86400000),
                            cost: 400.00,
                            status: 'ACTIVE'
                        }
                    });

                    if (employees.length > 1) {
                        await prisma.trainingParticipant.createMany({
                            data: employees.map(emp => ({
                                companyId,
                                trainingProgramId: prog2.id,
                                employeeId: emp.id,
                                attendanceStatus: 'ENROLLED'
                            })),
                            skipDuplicates: true
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Error creating default training programs:', e.message);
        }
    }
}

// ========================================================
// 0. METADATA FOR TRAINING MODALS
// ========================================================
async function getTrainingMetadata(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultTrainingData(companyId);

        const [trainers, trainingTypes, employees] = await Promise.all([
            prisma.trainer.findMany({
                where: { companyId, status: 'ACTIVE' },
                orderBy: { firstName: 'asc' }
            }),
            prisma.trainingType.findMany({
                where: { companyId, status: 'ACTIVE' },
                orderBy: { type: 'asc' }
            }),
            prisma.employee.findMany({
                where: { user: { companyId, ...NON_ADMIN_USER_FILTER } },
                select: {
                    id: true,
                    employeeCode: true,
                    firstName: true,
                    lastName: true,
                    profilePhotoUrl: true,
                    department: { select: { id: true, name: true } },
                    designation: { select: { id: true, name: true } }
                },
                orderBy: { firstName: 'asc' }
            })
        ]);

        res.json({
            trainers,
            trainingTypes,
            employees
        });
    } catch (error) {
        console.error('Error fetching training metadata:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// ========================================================
// 1. TRAINING TYPES CRUD
// ========================================================
async function getTrainingTypes(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultTrainingData(companyId);

        const types = await prisma.trainingType.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { trainingPrograms: true }
                }
            },
            orderBy: { id: 'desc' }
        });

        res.json(types);
    } catch (error) {
        console.error('Error fetching training types:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function createTrainingType(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const { type, description, status = 'ACTIVE' } = req.body;
        if (!type || !type.trim()) {
            return res.status(400).json({ message: 'Training type name is required' });
        }

        const newType = await prisma.trainingType.create({
            data: {
                companyId,
                type: type.trim(),
                description: description ? description.trim() : null,
                status: status || 'ACTIVE'
            }
        });

        res.status(201).json(newType);
    } catch (error) {
        console.error('Error creating training type:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Training type with this name already exists' });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function updateTrainingType(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;
        const { type, description, status } = req.body;

        const existing = await prisma.trainingType.findFirst({
            where: { id: parseInt(id), companyId }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Training type not found' });
        }

        const updated = await prisma.trainingType.update({
            where: { id: existing.id },
            data: {
                ...(type && { type: type.trim() }),
                ...(description !== undefined && { description: description ? description.trim() : null }),
                ...(status && { status })
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating training type:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function deleteTrainingType(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const existing = await prisma.trainingType.findFirst({
            where: { id: parseInt(id), companyId }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Training type not found' });
        }

        await prisma.trainingType.delete({
            where: { id: existing.id }
        });

        res.json({ message: 'Training type deleted successfully' });
    } catch (error) {
        console.error('Error deleting training type:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// ========================================================
// 2. TRAINERS CRUD
// ========================================================
async function getTrainers(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultTrainingData(companyId);

        const trainers = await prisma.trainer.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { trainingPrograms: true }
                }
            },
            orderBy: { id: 'desc' }
        });

        res.json(trainers);
    } catch (error) {
        console.error('Error fetching trainers:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function createTrainer(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const {
            firstName,
            lastName,
            email,
            phone,
            role,
            trainerType = 'INTERNAL',
            status = 'ACTIVE',
            profilePhotoUrl = 'user-32.jpg',
            description
        } = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({ message: 'First name, last name, and email are required' });
        }

        const newTrainer = await prisma.trainer.create({
            data: {
                companyId,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                phone: phone ? phone.trim() : null,
                role: role ? role.trim() : null,
                trainerType: trainerType || 'INTERNAL',
                status: status || 'ACTIVE',
                profilePhotoUrl: profilePhotoUrl || 'user-32.jpg',
                description: description ? description.trim() : null
            }
        });

        res.status(201).json(newTrainer);
    } catch (error) {
        console.error('Error creating trainer:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function updateTrainer(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const existing = await prisma.trainer.findFirst({
            where: { id: parseInt(id), companyId }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        const {
            firstName,
            lastName,
            email,
            phone,
            role,
            trainerType,
            status,
            profilePhotoUrl,
            description
        } = req.body;

        const updated = await prisma.trainer.update({
            where: { id: existing.id },
            data: {
                ...(firstName && { firstName: firstName.trim() }),
                ...(lastName && { lastName: lastName.trim() }),
                ...(email && { email: email.trim().toLowerCase() }),
                ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
                ...(role !== undefined && { role: role ? role.trim() : null }),
                ...(trainerType && { trainerType }),
                ...(status && { status }),
                ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
                ...(description !== undefined && { description: description ? description.trim() : null })
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating trainer:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function deleteTrainer(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const existing = await prisma.trainer.findFirst({
            where: { id: parseInt(id), companyId }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Trainer not found' });
        }

        await prisma.trainer.delete({
            where: { id: existing.id }
        });

        res.json({ message: 'Trainer deleted successfully' });
    } catch (error) {
        console.error('Error deleting trainer:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// ========================================================
// 3. TRAINING PROGRAMS CRUD
// ========================================================
async function getTrainingPrograms(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultTrainingData(companyId);

        const programs = await prisma.trainingProgram.findMany({
            where: { companyId },
            include: {
                trainingType: true,
                trainer: true,
                participants: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeCode: true,
                                profilePhotoUrl: true
                            }
                        }
                    }
                }
            },
            orderBy: { id: 'desc' }
        });

        res.json(programs);
    } catch (error) {
        console.error('Error fetching training programs:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function createTrainingProgram(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const {
            trainingTypeId,
            trainerId,
            title,
            description,
            startDate,
            endDate,
            cost,
            status = 'ACTIVE',
            employeeIds = []
        } = req.body;

        if (!trainingTypeId) {
            return res.status(400).json({ message: 'Training Type is required' });
        }

        // Validate type exists
        const typeRecord = await prisma.trainingType.findFirst({
            where: { id: parseInt(trainingTypeId), companyId }
        });
        if (!typeRecord) {
            return res.status(400).json({ message: 'Invalid training type' });
        }

        const programTitle = title?.trim() || `${typeRecord.type} Training`;

        const newProgram = await prisma.trainingProgram.create({
            data: {
                companyId,
                trainingTypeId: typeRecord.id,
                trainerId: trainerId ? parseInt(trainerId) : null,
                title: programTitle,
                description: description ? description.trim() : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                cost: cost !== undefined && cost !== '' ? parseFloat(cost) : null,
                status: status || 'ACTIVE'
            }
        });

        // Add participants if provided
        if (Array.isArray(employeeIds) && employeeIds.length > 0) {
            const validEmpIds = employeeIds
                .map(id => parseInt(id))
                .filter(id => !isNaN(id));

            if (validEmpIds.length > 0) {
                await prisma.trainingParticipant.createMany({
                    data: validEmpIds.map(empId => ({
                        companyId,
                        trainingProgramId: newProgram.id,
                        employeeId: empId,
                        attendanceStatus: 'ENROLLED'
                    })),
                    skipDuplicates: true
                });
            }
        }

        // Return populated record
        const populated = await prisma.trainingProgram.findUnique({
            where: { id: newProgram.id },
            include: {
                trainingType: true,
                trainer: true,
                participants: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeCode: true,
                                profilePhotoUrl: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json(populated);
    } catch (error) {
        console.error('Error creating training program:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function updateTrainingProgram(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const existing = await prisma.trainingProgram.findFirst({
            where: { id: parseInt(id), companyId }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Training program not found' });
        }

        const {
            trainingTypeId,
            trainerId,
            title,
            description,
            startDate,
            endDate,
            cost,
            status,
            employeeIds
        } = req.body;

        const updateData = {};
        if (trainingTypeId) updateData.trainingTypeId = parseInt(trainingTypeId);
        if (trainerId !== undefined) updateData.trainerId = trainerId ? parseInt(trainerId) : null;
        if (title) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description ? description.trim() : null;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (cost !== undefined) updateData.cost = cost !== '' && cost !== null ? parseFloat(cost) : null;
        if (status) updateData.status = status;

        await prisma.trainingProgram.update({
            where: { id: existing.id },
            data: updateData
        });

        // Update participants if employeeIds is provided
        if (Array.isArray(employeeIds)) {
            const validEmpIds = employeeIds
                .map(i => parseInt(i))
                .filter(i => !isNaN(i));

            // Remove existing participants and add new set
            await prisma.trainingParticipant.deleteMany({
                where: { trainingProgramId: existing.id }
            });

            if (validEmpIds.length > 0) {
                await prisma.trainingParticipant.createMany({
                    data: validEmpIds.map(empId => ({
                        companyId,
                        trainingProgramId: existing.id,
                        employeeId: empId,
                        attendanceStatus: 'ENROLLED'
                    })),
                    skipDuplicates: true
                });
            }
        }

        const populated = await prisma.trainingProgram.findUnique({
            where: { id: existing.id },
            include: {
                trainingType: true,
                trainer: true,
                participants: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                employeeCode: true,
                                profilePhotoUrl: true
                            }
                        }
                    }
                }
            }
        });

        res.json(populated);
    } catch (error) {
        console.error('Error updating training program:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function deleteTrainingProgram(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const existing = await prisma.trainingProgram.findFirst({
            where: { id: parseInt(id), companyId }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Training program not found' });
        }

        // Delete cascade participants
        await prisma.trainingParticipant.deleteMany({
            where: { trainingProgramId: existing.id }
        });

        await prisma.trainingProgram.delete({
            where: { id: existing.id }
        });

        res.json({ message: 'Training program deleted successfully' });
    } catch (error) {
        console.error('Error deleting training program:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

module.exports = {
    getTrainingMetadata,
    getTrainingTypes,
    createTrainingType,
    updateTrainingType,
    deleteTrainingType,
    getTrainers,
    createTrainer,
    updateTrainer,
    deleteTrainer,
    getTrainingPrograms,
    createTrainingProgram,
    updateTrainingProgram,
    deleteTrainingProgram
};
