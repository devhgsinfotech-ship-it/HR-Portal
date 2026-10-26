// backend/src/controllers/performanceController.js
const prisma = require('../config/prisma');

function getCompanyId(req) {
    return req.user?.companyId;
}

const NON_ADMIN_USER_FILTER = {
    role: { notIn: ['SUPER_ADMIN', 'COMPANY_ADMIN'] }
};

const DEFAULT_GOAL_TYPES = [
    { name: 'Quarterly Objectives', description: 'Core business and functional OKRs set for the quarter.' },
    { name: 'Project Delivery', description: 'Milestones, architecture deliverables, and on-time project execution.' },
    { name: 'Skill & Professional Development', description: 'Technical certifications, upskilling, and mentorship.' },
    { name: 'Revenue & Client Success', description: 'Client retention, customer satisfaction, and revenue impact.' }
];

async function ensureDefaultGoalTypes(companyId) {
    if (!companyId) return;
    const count = await prisma.goalType.count({ where: { companyId } });
    if (count === 0) {
        try {
            await prisma.goalType.createMany({
                data: DEFAULT_GOAL_TYPES.map(g => ({
                    companyId,
                    name: g.name,
                    description: g.description,
                    status: 'ACTIVE'
                })),
                skipDuplicates: true
            });
        } catch (e) {
            // Concurrent insert safety
        }
    }
}

// ========================================================
// 0. METADATA FOR PERFORMANCE MODALS & DROPDOWNS
// ========================================================
async function getPerformanceMetadata(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultGoalTypes(companyId);

        const [employees, departments, designations, goalTypes] = await Promise.all([
            prisma.employee.findMany({
                where: { user: { companyId, ...NON_ADMIN_USER_FILTER } },
                select: {
                    id: true,
                    userId: true,
                    employeeCode: true,
                    firstName: true,
                    lastName: true,
                    profilePhotoUrl: true,
                    departmentId: true,
                    designationId: true,
                    department: { select: { id: true, name: true } },
                    designation: { select: { id: true, name: true } }
                },
                orderBy: { firstName: 'asc' }
            }),
            prisma.department.findMany({
                where: { companyId },
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            }),
            prisma.designation.findMany({
                where: { companyId },
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            }),
            prisma.goalType.findMany({
                where: { companyId, status: 'ACTIVE' },
                select: { id: true, name: true, description: true },
                orderBy: { name: 'asc' }
            })
        ]);

        const formattedEmps = employees.map(e => ({
            id: e.id,
            userId: e.userId,
            employeeCode: e.employeeCode,
            name: `${e.firstName} ${e.lastName}`.trim(),
            departmentId: e.departmentId,
            departmentName: e.department?.name || 'General',
            designationId: e.designationId,
            designationName: e.designation?.name || 'Staff'
        }));

        return res.json({
            employees: formattedEmps,
            departments,
            designations,
            goalTypes
        });
    } catch (error) {
        console.error('Error in getPerformanceMetadata:', error);
        return res.status(500).json({ message: 'Failed to fetch performance metadata', error: error.message });
    }
}

// ========================================================
// 1. GOAL TYPES CRUD
// ========================================================
async function getGoalTypes(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultGoalTypes(companyId);

        const types = await prisma.goalType.findMany({
            where: { companyId },
            include: {
                _count: { select: { goals: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = types.map(t => ({
            id: t.id,
            Type: t.name,
            name: t.name,
            Description: t.description || 'No description provided',
            description: t.description || '',
            Status: t.status === 'ACTIVE' ? 'Active' : 'Inactive',
            status: t.status,
            goalCount: t._count?.goals || 0,
            createdAt: t.createdAt ? t.createdAt.toISOString().split('T')[0] : null
        }));

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getGoalTypes:', error);
        return res.status(500).json({ message: 'Failed to fetch goal types', error: error.message });
    }
}

async function createGoalType(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { name, description, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Goal type name is required.' });
        }

        const existing = await prisma.goalType.findFirst({
            where: { companyId, name: name.trim() }
        });
        if (existing) {
            return res.status(400).json({ message: 'A goal type with this name already exists in your company.' });
        }

        const goalType = await prisma.goalType.create({
            data: {
                companyId,
                name: name.trim(),
                description: description ? description.trim() : null,
                status: status || 'ACTIVE'
            }
        });

        return res.status(201).json({ message: 'Goal type created successfully', goalType });
    } catch (error) {
        console.error('Error creating goal type:', error);
        return res.status(500).json({ message: 'Failed to create goal type', error: error.message });
    }
}

async function updateGoalType(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const { name, description, status } = req.body;

        const existing = await prisma.goalType.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(404).json({ message: 'Goal type not found' });

        const updated = await prisma.goalType.update({
            where: { id },
            data: {
                name: name ? name.trim() : existing.name,
                description: description !== undefined ? description.trim() : existing.description,
                status: status || existing.status
            }
        });

        return res.json({ message: 'Goal type updated successfully', goalType: updated });
    } catch (error) {
        console.error('Error updating goal type:', error);
        return res.status(500).json({ message: 'Failed to update goal type', error: error.message });
    }
}

async function deleteGoalType(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.goalType.findFirst({
            where: { id, companyId },
            include: { _count: { select: { goals: true } } }
        });
        if (!existing) return res.status(404).json({ message: 'Goal type not found' });

        if (existing._count.goals > 0) {
            return res.status(400).json({
                message: `Cannot delete goal type: it is linked to ${existing._count.goals} active goal(s). Please reassign them first.`
            });
        }

        await prisma.goalType.delete({ where: { id } });
        return res.json({ message: 'Goal type deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal type:', error);
        return res.status(500).json({ message: 'Failed to delete goal type', error: error.message });
    }
}

// ========================================================
// 2. GOAL TRACKING (PERFORMANCE GOALS) CRUD
// ========================================================
async function getPerformanceGoals(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const where = { companyId };

        if (req.user?.role === 'EMPLOYEE') {
            where.employee = { userId: req.user.id };
        } else if (req.query.employeeId) {
            where.employeeId = parseInt(req.query.employeeId, 10);
        }


        const goals = await prisma.performanceGoal.findMany({
            where,
            include: {
                goalType: true,
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                        profilePhotoUrl: true,
                        department: { select: { name: true } },
                        designation: { select: { name: true } }
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = goals.map(g => {
            const rawProgress = g.progress || 0;
            const empName = g.employee ? `${g.employee.firstName} ${g.employee.lastName}`.trim() : 'Unassigned';
            const creatorName = g.createdBy ? `${g.createdBy.firstName} ${g.createdBy.lastName}`.trim() : 'Admin';

            return {
                id: g.id,
                GoalType: g.goalType?.name || 'General Goal',
                goalType: g.goalType?.name || 'General Goal',
                goalTypeName: g.goalType?.name || 'General Goal',
                goalTypeId: g.goalTypeId,
                Subject: g.subject,
                subject: g.subject,
                TargetAchievement: g.targetAchievement || 'Target not specified',
                targetAchievement: g.targetAchievement || '',
                StartDate: g.startDate ? g.startDate.toISOString().split('T')[0] : '',
                startDate: g.startDate ? g.startDate.toISOString().split('T')[0] : '',
                EndDate: g.endDate ? g.endDate.toISOString().split('T')[0] : '',
                endDate: g.endDate ? g.endDate.toISOString().split('T')[0] : '',
                Description: g.description || 'No description',
                description: g.description || '',
                Status: g.status === 'COMPLETED' ? 'Completed' : (g.status === 'IN_PROGRESS' ? 'In Progress' : 'Active'),
                status: g.status,
                Progress: `Completed ${rawProgress}%`,
                progressValue: rawProgress,
                progress: rawProgress,
                isCompleted: g.isCompleted,
                employeeId: g.employeeId,
                employeeName: empName,
                employeeCode: g.employee?.employeeCode || '',
                profilePhotoUrl: g.employee?.profilePhotoUrl || null,
                Image: g.employee?.profilePhotoUrl || 'user-32.jpg',
                department: g.employee?.department?.name || '',
                designation: g.employee?.designation?.name || '',
                createdByName: creatorName,
                createdAt: g.createdAt ? g.createdAt.toISOString().split('T')[0] : null
            };
        });

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getPerformanceGoals:', error);
        return res.status(500).json({ message: 'Failed to fetch performance goals', error: error.message });
    }
}

async function createPerformanceGoal(req, res) {
    try {
        const companyId = getCompanyId(req);
        let { employeeId, goalTypeId, subject, targetAchievement, startDate, endDate, description, progress, status } = req.body;

        if (req.user?.role === 'EMPLOYEE') {
            const myEmp = await prisma.employee.findUnique({ where: { userId: req.user.id } });
            if (!myEmp) return res.status(404).json({ message: 'Employee profile not found' });
            employeeId = myEmp.id;
        }

        if (!employeeId || !subject || !subject.trim()) {
            return res.status(400).json({ message: 'Assigned employee and goal subject are required.' });
        }

        let creatorEmpId = null;
        if (req.user?.id) {
            const creator = await prisma.employee.findFirst({ where: { userId: req.user.id } });
            creatorEmpId = creator?.id || null;
        }

        const progNum = Math.min(100, Math.max(0, parseInt(progress || 0, 10)));
        const finalStatus = progNum === 100 ? 'COMPLETED' : (status || (progNum > 0 ? 'IN_PROGRESS' : 'ACTIVE'));

        const goal = await prisma.performanceGoal.create({
            data: {
                companyId,
                employeeId: parseInt(employeeId, 10),
                createdById: creatorEmpId,
                goalTypeId: goalTypeId ? parseInt(goalTypeId, 10) : null,
                subject: subject.trim(),
                targetAchievement: targetAchievement ? targetAchievement.trim() : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                description: description ? description.trim() : null,
                progress: progNum,
                status: finalStatus,
                isCompleted: progNum === 100
            },
            include: {
                employee: { select: { userId: true, firstName: true, lastName: true } },
                goalType: true
            }
        });

        // In-app notification to employee if created by manager/HR
        if (goal.employee?.userId && goal.employee.userId !== req.user?.id) {
            await prisma.notification.create({
                data: {
                    receiverId: goal.employee.userId,
                    senderId: req.user?.id || null,
                    type: 'PERFORMANCE_GOAL',
                    title: '🎯 New Goal Assigned',
                    message: `You have been assigned a new goal: "${goal.subject}". Target: ${goal.targetAchievement || 'See details'}.`,
                    isRead: false
                }
            }).catch(e => console.warn('Failed to notify employee of goal:', e.message));
        }

        return res.status(201).json({ message: 'Performance goal created successfully', goal });
    } catch (error) {
        console.error('Error creating performance goal:', error);
        return res.status(500).json({ message: 'Failed to create performance goal', error: error.message });
    }
}

async function updatePerformanceGoal(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const { employeeId, goalTypeId, subject, targetAchievement, startDate, endDate, description, progress, status } = req.body;

        const existing = await prisma.performanceGoal.findFirst({
            where: { id, companyId },
            include: { employee: true }
        });
        if (!existing) return res.status(404).json({ message: 'Performance goal not found' });

        if (req.user?.role === 'EMPLOYEE' && existing.employee.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied: You can only update your own goals.' });
        }

        const updateData = {};
        if (employeeId && req.user?.role !== 'EMPLOYEE') updateData.employeeId = parseInt(employeeId, 10);
        if (goalTypeId !== undefined) updateData.goalTypeId = goalTypeId ? parseInt(goalTypeId, 10) : null;
        if (subject) updateData.subject = subject.trim();
        if (targetAchievement !== undefined) updateData.targetAchievement = targetAchievement ? targetAchievement.trim() : null;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (description !== undefined) updateData.description = description ? description.trim() : null;

        if (progress !== undefined) {
            const progNum = Math.min(100, Math.max(0, parseInt(progress, 10)));
            updateData.progress = progNum;
            if (progNum === 100) {
                updateData.isCompleted = true;
                updateData.status = 'COMPLETED';
            } else {
                updateData.isCompleted = false;
                if (!status && existing.status === 'COMPLETED') {
                    updateData.status = 'IN_PROGRESS';
                }
            }
        }

        if (status) {
            updateData.status = status;
            if (status === 'COMPLETED') {
                updateData.isCompleted = true;
                updateData.progress = 100;
            }
        }

        const updated = await prisma.performanceGoal.update({
            where: { id },
            data: updateData
        });

        return res.json({ message: 'Performance goal updated successfully', goal: updated });
    } catch (error) {
        console.error('Error updating performance goal:', error);
        return res.status(500).json({ message: 'Failed to update performance goal', error: error.message });
    }
}

async function deletePerformanceGoal(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.performanceGoal.findFirst({
            where: { id, companyId },
            include: { employee: true }
        });
        if (!existing) return res.status(404).json({ message: 'Performance goal not found' });

        if (req.user?.role === 'EMPLOYEE' && existing.employee.userId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied: You can only delete your own goals.' });
        }

        await prisma.performanceGoal.delete({ where: { id } });
        return res.json({ message: 'Performance goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting performance goal:', error);
        return res.status(500).json({ message: 'Failed to delete performance goal', error: error.message });
    }
}

// ========================================================
// 3. PERFORMANCE INDICATORS (KPIS) CRUD
// ========================================================
async function getPerformanceIndicators(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const indicators = await prisma.performanceIndicator.findMany({
            where: { companyId },
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, name: true } },
                addedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profilePhotoUrl: true,
                        designation: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = indicators.map(ind => {
            const approverName = ind.addedBy ? `${ind.addedBy.firstName} ${ind.addedBy.lastName}`.trim() : 'Admin';
            return {
                id: ind.id,
                Designation: ind.designation?.name || 'All Designations',
                designationName: ind.designation?.name || 'All Designations',
                designationId: ind.designationId,
                Department: ind.department?.name || 'All Departments',
                departmentName: ind.department?.name || 'All Departments',
                departmentId: ind.departmentId,
                ApprovedBy: approverName,
                addedByName: approverName,
                Image: ind.addedBy?.profilePhotoUrl || 'user-01.jpg',
                profilePhotoUrl: ind.addedBy?.profilePhotoUrl || null,
                Role: ind.addedBy?.designation?.name || 'HR Manager',
                CreatedDate: ind.createdAt ? ind.createdAt.toISOString().split('T')[0] : '',
                createdAt: ind.createdAt ? ind.createdAt.toISOString().split('T')[0] : '',
                Status: ind.status === 'ACTIVE' ? 'Active' : 'Inactive',
                status: ind.status,
                // Competencies
                customerExperience: ind.customerExperience,
                marketing: ind.marketing,
                management: ind.management,
                administration: ind.administration,
                presentationSkills: ind.presentationSkills,
                qualityOfWork: ind.qualityOfWork,
                efficiency: ind.efficiency,
                integrity: ind.integrity
            };
        });

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getPerformanceIndicators:', error);
        return res.status(500).json({ message: 'Failed to fetch performance indicators', error: error.message });
    }
}

async function createPerformanceIndicator(req, res) {
    try {
        const companyId = getCompanyId(req);
        const {
            departmentId,
            designationId,
            customerExperience,
            marketing,
            management,
            administration,
            presentationSkills,
            qualityOfWork,
            efficiency,
            integrity,
            status
        } = req.body;

        if (!designationId) {
            return res.status(400).json({ message: 'Designation is required to set performance indicators.' });
        }

        let addedById = null;
        if (req.user?.id) {
            const currentEmp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
            addedById = currentEmp?.id || null;
        }

        const indicator = await prisma.performanceIndicator.create({
            data: {
                companyId,
                departmentId: departmentId ? parseInt(departmentId, 10) : null,
                designationId: parseInt(designationId, 10),
                addedById,
                customerExperience: customerExperience || 'Advanced',
                marketing: marketing || 'Intermediate',
                management: management || 'Advanced',
                administration: administration || 'Intermediate',
                presentationSkills: presentationSkills || 'Advanced',
                qualityOfWork: qualityOfWork || 'Advanced',
                efficiency: efficiency || 'Advanced',
                integrity: integrity || 'Advanced',
                status: status || 'ACTIVE'
            },
            include: {
                designation: true,
                department: true
            }
        });

        return res.status(201).json({ message: 'Performance indicator created successfully', indicator });
    } catch (error) {
        console.error('Error creating performance indicator:', error);
        return res.status(500).json({ message: 'Failed to create performance indicator', error: error.message });
    }
}

async function updatePerformanceIndicator(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const {
            departmentId,
            designationId,
            customerExperience,
            marketing,
            management,
            administration,
            presentationSkills,
            qualityOfWork,
            efficiency,
            integrity,
            status
        } = req.body;

        const existing = await prisma.performanceIndicator.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ message: 'Performance indicator not found' });

        const updated = await prisma.performanceIndicator.update({
            where: { id },
            data: {
                departmentId: departmentId ? parseInt(departmentId, 10) : existing.departmentId,
                designationId: designationId ? parseInt(designationId, 10) : existing.designationId,
                customerExperience: customerExperience || existing.customerExperience,
                marketing: marketing || existing.marketing,
                management: management || existing.management,
                administration: administration || existing.administration,
                presentationSkills: presentationSkills || existing.presentationSkills,
                qualityOfWork: qualityOfWork || existing.qualityOfWork,
                efficiency: efficiency || existing.efficiency,
                integrity: integrity || existing.integrity,
                status: status || existing.status
            }
        });

        return res.json({ message: 'Performance indicator updated successfully', indicator: updated });
    } catch (error) {
        console.error('Error updating performance indicator:', error);
        return res.status(500).json({ message: 'Failed to update performance indicator', error: error.message });
    }
}

async function deletePerformanceIndicator(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.performanceIndicator.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ message: 'Performance indicator not found' });

        await prisma.performanceIndicator.delete({ where: { id } });
        return res.json({ message: 'Performance indicator deleted successfully' });
    } catch (error) {
        console.error('Error deleting performance indicator:', error);
        return res.status(500).json({ message: 'Failed to delete performance indicator', error: error.message });
    }
}

// ========================================================
// 4. PERFORMANCE APPRAISALS & 360 REVIEWS CRUD
// ========================================================
async function getPerformanceAppraisals(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const where = { companyId };

        if (req.user?.role === 'EMPLOYEE') {
            where.employee = { userId: req.user.id };
        } else if (req.query.employeeId) {
            where.employeeId = parseInt(req.query.employeeId, 10);
        }


        const appraisals = await prisma.performanceAppraisal.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                        profilePhotoUrl: true,
                        department: { select: { name: true } },
                        designation: { select: { name: true } }
                    }
                },
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { appraisalDate: 'desc' }
        });

        const formatted = appraisals.map(a => {
            const empName = a.employee ? `${a.employee.firstName} ${a.employee.lastName}`.trim() : 'Employee';
            const stat = a.status ? a.status.toUpperCase() : 'DRAFT';
            let displayStatus = 'Draft';
            if (stat === 'APPROVED' || stat === 'COMPLETED') displayStatus = 'Approved';
            else if (stat === 'REVIEWED') displayStatus = 'Reviewed';
            else if (stat === 'SUBMITTED' || stat === 'IN_PROGRESS') displayStatus = 'Submitted';

            return {
                id: a.id,
                Name: empName,
                name: empName,
                employeeName: empName,
                employeeId: a.employeeId,
                employeeCode: a.employee?.employeeCode || '',
                Image: a.employee?.profilePhotoUrl || 'user-32.jpg',
                profilePhotoUrl: a.employee?.profilePhotoUrl || null,
                Designation: a.employee?.designation?.name || 'Staff',
                designation: a.employee?.designation?.name || 'Staff',
                Department: a.employee?.department?.name || 'General',
                department: a.employee?.department?.name || 'General',
                AppraisalDate: a.appraisalDate ? a.appraisalDate.toISOString().split('T')[0] : '',
                appraisalDate: a.appraisalDate ? a.appraisalDate.toISOString().split('T')[0] : '',
                appraisalCycle: a.appraisalCycle || 'Annual 2026',
                Status: displayStatus,
                status: stat,
                selfRating: a.selfRating || 0,
                managerRating: a.managerRating || 0,
                finalRating: a.finalRating || 0,
                competencyScore: a.competencyScore || 0,
                reviewerName: a.reviewer ? `${a.reviewer.firstName} ${a.reviewer.lastName}`.trim() : 'Pending Review',
                reviewerId: a.reviewerId,
                strengths: a.strengths || '',
                areasForImprovement: a.areasForImprovement || '',
                employeeRemarks: a.employeeRemarks || '',
                managerRemarks: a.managerRemarks || '',
                hrRemarks: a.hrRemarks || ''
            };
        });

        return res.json(formatted);
    } catch (error) {
        console.error('Error in getPerformanceAppraisals:', error);
        return res.status(500).json({ message: 'Failed to fetch performance appraisals', error: error.message });
    }
}

async function createPerformanceAppraisal(req, res) {
    try {
        const companyId = getCompanyId(req);
        const {
            employeeId,
            reviewerId,
            appraisalCycle,
            appraisalDate,
            selfRating,
            managerRating,
            finalRating,
            competencyScore,
            strengths,
            areasForImprovement,
            employeeRemarks,
            managerRemarks,
            hrRemarks,
            status
        } = req.body;

        if (!employeeId || !appraisalDate) {
            return res.status(400).json({ message: 'Employee and appraisal date are required.' });
        }

        const appraisal = await prisma.performanceAppraisal.create({
            data: {
                companyId,
                employeeId: parseInt(employeeId, 10),
                reviewerId: reviewerId ? parseInt(reviewerId, 10) : null,
                appraisalCycle: appraisalCycle ? appraisalCycle.trim() : 'Annual Review 2026',
                appraisalDate: new Date(appraisalDate),
                selfRating: selfRating ? parseFloat(selfRating) : 0,
                managerRating: managerRating ? parseFloat(managerRating) : 0,
                finalRating: finalRating ? parseFloat(finalRating) : 0,
                competencyScore: competencyScore ? parseFloat(competencyScore) : 0,
                strengths: strengths || null,
                areasForImprovement: areasForImprovement || null,
                employeeRemarks: employeeRemarks || null,
                managerRemarks: managerRemarks || null,
                hrRemarks: hrRemarks || null,
                status: status || 'PENDING'
            },
            include: {
                employee: { select: { userId: true, firstName: true, lastName: true } }
            }
        });

        // Notify employee of appraisal initiation
        if (appraisal.employee?.userId && appraisal.employee.userId !== req.user?.id) {
            await prisma.notification.create({
                data: {
                    receiverId: appraisal.employee.userId,
                    senderId: req.user?.id || null,
                    type: 'PERFORMANCE_APPRAISAL',
                    title: '📋 Performance Appraisal Initiated',
                    message: `Your performance appraisal for cycle "${appraisal.appraisalCycle}" has been initiated.`,
                    isRead: false
                }
            }).catch(e => console.warn('Failed to notify employee of appraisal:', e.message));
        }

        return res.status(201).json({ message: 'Performance appraisal created successfully', appraisal });
    } catch (error) {
        console.error('Error creating performance appraisal:', error);
        return res.status(500).json({ message: 'Failed to create performance appraisal', error: error.message });
    }
}

async function updatePerformanceAppraisal(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);
        const {
            reviewerId,
            appraisalCycle,
            appraisalDate,
            selfRating,
            managerRating,
            finalRating,
            competencyScore,
            strengths,
            areasForImprovement,
            employeeRemarks,
            managerRemarks,
            hrRemarks,
            status
        } = req.body;

        const existing = await prisma.performanceAppraisal.findFirst({
            where: { id, companyId },
            include: { employee: true }
        });
        if (!existing) return res.status(404).json({ message: 'Performance appraisal not found' });

        const updateData = {};
        if (reviewerId !== undefined) updateData.reviewerId = reviewerId ? parseInt(reviewerId, 10) : null;
        if (appraisalCycle) updateData.appraisalCycle = appraisalCycle.trim();
        if (appraisalDate) updateData.appraisalDate = new Date(appraisalDate);
        if (selfRating !== undefined) updateData.selfRating = parseFloat(selfRating);
        if (managerRating !== undefined) updateData.managerRating = parseFloat(managerRating);
        if (finalRating !== undefined) updateData.finalRating = parseFloat(finalRating);
        if (competencyScore !== undefined) updateData.competencyScore = parseFloat(competencyScore);
        if (strengths !== undefined) updateData.strengths = strengths ? strengths.trim() : null;
        if (areasForImprovement !== undefined) updateData.areasForImprovement = areasForImprovement ? areasForImprovement.trim() : null;
        if (employeeRemarks !== undefined) updateData.employeeRemarks = employeeRemarks ? employeeRemarks.trim() : null;
        if (managerRemarks !== undefined) updateData.managerRemarks = managerRemarks ? managerRemarks.trim() : null;
        if (hrRemarks !== undefined) updateData.hrRemarks = hrRemarks ? hrRemarks.trim() : null;
        if (status) updateData.status = status;

        const updated = await prisma.performanceAppraisal.update({
            where: { id },
            data: updateData
        });

        return res.json({ message: 'Performance appraisal updated successfully', appraisal: updated });
    } catch (error) {
        console.error('Error updating performance appraisal:', error);
        return res.status(500).json({ message: 'Failed to update performance appraisal', error: error.message });
    }
}

async function deletePerformanceAppraisal(req, res) {
    try {
        const companyId = getCompanyId(req);
        const id = parseInt(req.params.id, 10);

        const existing = await prisma.performanceAppraisal.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ message: 'Performance appraisal not found' });

        await prisma.performanceAppraisal.delete({ where: { id } });
        return res.json({ message: 'Performance appraisal deleted successfully' });
    } catch (error) {
        console.error('Error deleting performance appraisal:', error);
        return res.status(500).json({ message: 'Failed to delete performance appraisal', error: error.message });
    }
}

module.exports = {
    getPerformanceMetadata,
    // Goal Types
    getGoalTypes,
    createGoalType,
    updateGoalType,
    deleteGoalType,
    // Goals
    getPerformanceGoals,
    createPerformanceGoal,
    updatePerformanceGoal,
    deletePerformanceGoal,
    // Indicators
    getPerformanceIndicators,
    createPerformanceIndicator,
    updatePerformanceIndicator,
    deletePerformanceIndicator,
    // Appraisals
    getPerformanceAppraisals,
    createPerformanceAppraisal,
    updatePerformanceAppraisal,
    deletePerformanceAppraisal
};
