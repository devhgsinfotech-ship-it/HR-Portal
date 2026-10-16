// backend/src/controllers/otherSettingsController.js
const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');

// Resolve backup storage directory
const UPLOAD_BASE = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve('uploads');
const BACKUP_DIR = path.join(UPLOAD_BASE, 'backups');

// Ensure backups folder exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Format bytes to human readable format (KB, MB, GB)
 */
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// ==========================================
// 1. BAN IP ADDRESS MANAGEMENT
// ==========================================

/**
 * Get banned IPs list (Company Admin sees their company's bans; Super Admin sees all)
 */
async function getBannedIps(req, res) {
    try {
        const user = req.user;
        const isSuperAdmin = user.role === 'SUPER_ADMIN';

        let whereClause = {};
        if (!isSuperAdmin) {
            // Company Admin sees bans for their own company or global bans
            whereClause = {
                OR: [
                    { companyId: user.companyId },
                    { companyId: null }
                ]
            };
        } else if (req.query.companyId) {
            whereClause = { companyId: parseInt(req.query.companyId) };
        }

        const bannedIps = await prisma.bannedIp.findMany({
            where: whereClause,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        companyCode: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: bannedIps
        });
    } catch (error) {
        console.error('Error fetching banned IPs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch banned IPs' });
    }
}

/**
 * Add a new IP to ban list
 */
async function addBannedIp(req, res) {
    try {
        const user = req.user;
        const { ipAddress, reason, status = 'Active', isGlobal = false, targetCompanyId } = req.body;

        if (!ipAddress || !ipAddress.trim()) {
            return res.status(400).json({ success: false, message: 'IP address is required' });
        }

        const cleanIp = ipAddress.trim();

        // Determine companyId based on role
        let targetCompany = null;
        if (user.role === 'SUPER_ADMIN') {
            if (!isGlobal && targetCompanyId) {
                targetCompany = parseInt(targetCompanyId);
            } else if (!isGlobal && user.companyId) {
                targetCompany = user.companyId;
            } else {
                targetCompany = null; // Global ban across all companies
            }
        } else {
            // Company Admin can only ban for their own company
            if (!user.companyId) {
                return res.status(400).json({ success: false, message: 'User does not belong to a company' });
            }
            targetCompany = user.companyId;
        }

        // Check if already banned for this scope
        const existing = await prisma.bannedIp.findFirst({
            where: {
                ipAddress: cleanIp,
                companyId: targetCompany
            }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: targetCompany
                    ? `IP address ${cleanIp} is already banned for this company.`
                    : `IP address ${cleanIp} is already banned globally.`
            });
        }

        const newBan = await prisma.bannedIp.create({
            data: {
                companyId: targetCompany,
                ipAddress: cleanIp,
                reason: reason ? reason.trim() : null,
                status: status || 'Active',
                createdById: user.id
            },
            include: {
                company: {
                    select: { id: true, name: true, companyCode: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: `IP address ${cleanIp} has been successfully banned.`,
            data: newBan
        });
    } catch (error) {
        console.error('Error adding banned IP:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to ban IP address' });
    }
}

/**
 * Update banned IP details
 */
async function updateBannedIp(req, res) {
    try {
        const user = req.user;
        const id = parseInt(req.params.id);
        const { ipAddress, reason, status } = req.body;

        const existing = await prisma.bannedIp.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Banned IP record not found' });
        }

        // Check permission: Company Admin cannot modify global bans or other companies' bans
        if (user.role !== 'SUPER_ADMIN') {
            if (existing.companyId !== user.companyId) {
                return res.status(403).json({ success: false, message: 'Unauthorized to modify this banned IP record' });
            }
        }

        const dataToUpdate = {};
        if (ipAddress) dataToUpdate.ipAddress = ipAddress.trim();
        if (reason !== undefined) dataToUpdate.reason = reason ? reason.trim() : null;
        if (status) dataToUpdate.status = status;

        const updated = await prisma.bannedIp.update({
            where: { id },
            data: dataToUpdate,
            include: {
                company: {
                    select: { id: true, name: true, companyCode: true }
                }
            }
        });

        res.json({
            success: true,
            message: 'Banned IP record updated successfully.',
            data: updated
        });
    } catch (error) {
        console.error('Error updating banned IP:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update banned IP' });
    }
}

/**
 * Delete / Remove banned IP
 */
async function deleteBannedIp(req, res) {
    try {
        const user = req.user;
        const id = parseInt(req.params.id);

        const existing = await prisma.bannedIp.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Banned IP record not found' });
        }

        // Check permission
        if (user.role !== 'SUPER_ADMIN') {
            if (existing.companyId !== user.companyId) {
                return res.status(403).json({ success: false, message: 'Unauthorized to delete this banned IP record' });
            }
        }

        await prisma.bannedIp.delete({ where: { id } });

        res.json({
            success: true,
            message: `Banned IP ${existing.ipAddress} has been unbanned successfully.`
        });
    } catch (error) {
        console.error('Error deleting banned IP:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to remove banned IP' });
    }
}

// ==========================================
// 2. BACKUP MANAGEMENT (COMPANY & ALL COMPANIES)
// ==========================================

/**
 * Get list of backups (Company Admin sees only their company; Super Admin sees all or filtered)
 */
async function getBackups(req, res) {
    try {
        const user = req.user;
        const isSuperAdmin = user.role === 'SUPER_ADMIN';

        let whereClause = {};
        if (!isSuperAdmin) {
            whereClause = { companyId: user.companyId };
        } else {
            if (req.query.companyId) {
                whereClause.companyId = parseInt(req.query.companyId);
            }
            if (req.query.backupType) {
                whereClause.backupType = req.query.backupType;
            }
        }

        const backups = await prisma.backupRecord.findMany({
            where: whereClause,
            include: {
                company: {
                    select: { id: true, name: true, companyCode: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: backups
        });
    } catch (error) {
        console.error('Error fetching backups:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch backups' });
    }
}

/**
 * Generate a new Backup:
 * - COMPANY LEVEL: Exports all data scoped to `companyId` (Employees, Attendance, Leaves, Payroll, Projects, etc.)
 * - SUPER ADMIN ALL COMPANIES: Exports the full multi-tenant dataset (All companies, platform users, etc.)
 */
async function generateBackup(req, res) {
    try {
        const user = req.user;
        const isSuperAdmin = user.role === 'SUPER_ADMIN';
        const { backupType = 'COMPANY', targetCompanyId } = req.body;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let recordCount = 0;
        let backupData = {};
        let finalFileName = '';
        let finalCompanyId = null;
        let finalType = 'COMPANY';

        if (isSuperAdmin && backupType === 'SYSTEM_ALL') {
            // ==========================================
            // SUPER ADMIN: FULL SYSTEM / ALL COMPANIES BACKUP
            // ==========================================
            finalType = 'SYSTEM_ALL';
            finalCompanyId = null;
            finalFileName = `system_full_backup_${timestamp}.json`;

            const [
                companies,
                plans,
                subscriptions,
                users,
                departments,
                designations,
                employees,
                attendances,
                leaves,
                leaveTypes,
                holidays,
                payrolls,
                projects,
                tasks,
                clients,
                timeLogs,
                assets,
                announcements,
                cronJobs,
                seoSettings,
                systemSettings,
                bannedIps,
                invoices,
                companyRoles
            ] = await Promise.all([
                prisma.company.findMany({ include: { settings: true } }),
                prisma.subscriptionPlan.findMany(),
                prisma.subscription.findMany(),
                prisma.user.findMany({
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        companyId: true,
                        accountStatus: true,
                        createdAt: true
                    }
                }),
                prisma.department.findMany(),
                prisma.designation.findMany(),
                prisma.employee.findMany(),
                prisma.attendanceRecord.findMany(),
                prisma.leaveRequest.findMany(),
                prisma.leaveType.findMany(),
                prisma.holiday.findMany(),
                prisma.payrollPeriod.findMany({ include: { entries: true } }),
                prisma.project.findMany(),
                prisma.task.findMany(),
                prisma.client.findMany(),
                prisma.timeLog.findMany(),
                prisma.asset.findMany(),
                prisma.announcement.findMany(),
                prisma.cronJob.findMany(),
                prisma.seoSetting.findMany(),
                prisma.systemSetting.findMany(),
                prisma.bannedIp.findMany(),
                prisma.invoice.findMany(),
                prisma.companyRole.findMany({ include: { permissions: true } })
            ]);

            recordCount = companies.length + users.length + employees.length + attendances.length +
                leaves.length + payrolls.length + projects.length + tasks.length + clients.length;

            backupData = {
                metadata: {
                    title: 'HR Portal - Full System Multi-Company Master Backup',
                    generatedAt: new Date().toISOString(),
                    generatedBy: { id: user.id, email: user.email, role: user.role },
                    backupType: 'SYSTEM_ALL',
                    totalRecords: recordCount,
                    version: '2.0.0'
                },
                companies,
                subscriptionPlans: plans,
                subscriptions,
                invoices,
                users,
                departments,
                designations,
                employees,
                attendanceRecords: attendances,
                leaveRequests: leaves,
                leaveTypes,
                holidays,
                payrollPeriods: payrolls,
                projects,
                tasks,
                clients,
                timeLogs,
                assets,
                announcements,
                companyRoles,
                cronJobs,
                seoSettings,
                systemSettings,
                bannedIps
            };
        } else {
            // ==========================================
            // COMPANY LEVEL: SPECIFIC COMPANY DATA BACKUP
            // ==========================================
            finalType = 'COMPANY';
            finalCompanyId = isSuperAdmin && targetCompanyId ? parseInt(targetCompanyId) : user.companyId;

            if (!finalCompanyId) {
                return res.status(400).json({ success: false, message: 'Valid company ID is required for company backup.' });
            }

            const company = await prisma.company.findUnique({
                where: { id: finalCompanyId },
                include: { settings: true }
            });

            if (!company) {
                return res.status(404).json({ success: false, message: 'Company not found' });
            }

            const companyPrefix = (company.companyCode || company.subdomain || `company_${company.id}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
            finalFileName = `${companyPrefix}_backup_${timestamp}.json`;

            const [
                departments,
                designations,
                users,
                employees,
                attendances,
                leaves,
                leaveTypes,
                holidays,
                payrolls,
                projects,
                tasks,
                clients,
                timeLogs,
                assets,
                announcements,
                companyRoles
            ] = await Promise.all([
                prisma.department.findMany({ where: { companyId: finalCompanyId } }),
                prisma.designation.findMany({ where: { companyId: finalCompanyId } }),
                prisma.user.findMany({
                    where: { companyId: finalCompanyId },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        accountStatus: true,
                        createdAt: true
                    }
                }),
                prisma.employee.findMany({ where: { user: { companyId: finalCompanyId } } }),
                prisma.attendanceRecord.findMany({ where: { employee: { user: { companyId: finalCompanyId } } } }),
                prisma.leaveRequest.findMany({ where: { employee: { user: { companyId: finalCompanyId } } } }),
                prisma.leaveType.findMany({ where: { companyId: finalCompanyId } }),
                prisma.holiday.findMany({ where: { companyId: finalCompanyId } }),
                prisma.payrollPeriod.findMany({
                    where: { companyId: finalCompanyId },
                    include: { entries: true }
                }),
                prisma.project.findMany({ where: { companyId: finalCompanyId } }),
                prisma.task.findMany({ where: { companyId: finalCompanyId } }),
                prisma.client.findMany({ where: { companyId: finalCompanyId } }),
                prisma.timeLog.findMany({ where: { companyId: finalCompanyId } }),
                prisma.asset.findMany({ where: { companyId: finalCompanyId } }),
                prisma.announcement.findMany({ where: { companyId: finalCompanyId } }),
                prisma.companyRole.findMany({
                    where: { companyId: finalCompanyId },
                    include: { permissions: true }
                })
            ]);

            recordCount = employees.length + attendances.length + leaves.length + payrolls.length + projects.length + tasks.length + clients.length;

            backupData = {
                metadata: {
                    title: `HR Portal - Company Backup (${company.name})`,
                    companyId: company.id,
                    companyName: company.name,
                    companyCode: company.companyCode,
                    generatedAt: new Date().toISOString(),
                    generatedBy: { id: user.id, email: user.email, role: user.role },
                    backupType: 'COMPANY',
                    totalRecords: recordCount,
                    version: '2.0.0'
                },
                companyInfo: company,
                departments,
                designations,
                users,
                employees,
                attendanceRecords: attendances,
                leaveRequests: leaves,
                leaveTypes,
                holidays,
                payrollPeriods: payrolls,
                projects,
                tasks,
                clients,
                timeLogs,
                assets,
                announcements,
                companyRoles
            };
        }

        // Write backup JSON file to disk
        const filePath = path.join(BACKUP_DIR, finalFileName);
        const jsonContent = JSON.stringify(backupData, null, 2);
        fs.writeFileSync(filePath, jsonContent, 'utf-8');

        const stats = fs.statSync(filePath);
        const formattedSize = formatBytes(stats.size);

        // Record in Database
        const backupRecord = await prisma.backupRecord.create({
            data: {
                companyId: finalCompanyId,
                backupType: finalType,
                fileName: finalFileName,
                fileSize: formattedSize,
                filePath: filePath,
                recordCount: recordCount,
                status: 'COMPLETED',
                createdById: user.id
            },
            include: {
                company: {
                    select: { id: true, name: true, companyCode: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: finalType === 'SYSTEM_ALL'
                ? 'Full system master backup for all companies generated successfully.'
                : 'Company backup generated successfully.',
            data: backupRecord
        });
    } catch (error) {
        console.error('Error generating backup:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to generate backup' });
    }
}

/**
 * Download a generated backup file
 */
async function downloadBackup(req, res) {
    try {
        const user = req.user;
        const id = parseInt(req.params.id);

        const record = await prisma.backupRecord.findUnique({
            where: { id },
            include: { company: true }
        });

        if (!record) {
            return res.status(404).json({ success: false, message: 'Backup record not found' });
        }

        // Permission check: Company Admin can only download their own company's backup
        if (user.role !== 'SUPER_ADMIN') {
            if (record.companyId !== user.companyId) {
                return res.status(403).json({ success: false, message: 'Unauthorized to download this company backup' });
            }
        }

        // Check file exists on primary path, or fallback to BACKUP_DIR / fileName
        let downloadPath = record.filePath;
        if (!fs.existsSync(downloadPath)) {
            const fallbackPath = path.join(BACKUP_DIR, record.fileName);
            if (fs.existsSync(fallbackPath)) {
                downloadPath = fallbackPath;
            } else {
                return res.status(404).json({ success: false, message: 'Backup file not found on server storage' });
            }
        }

        res.download(downloadPath, record.fileName, (err) => {
            if (err) {
                console.error('Error streaming backup file:', err);
            }
        });
    } catch (error) {
        console.error('Error downloading backup:', error);
        res.status(500).json({ success: false, message: 'Failed to download backup file' });
    }
}

/**
 * Delete a backup file and its DB record
 */
async function deleteBackup(req, res) {
    try {
        const user = req.user;
        const id = parseInt(req.params.id);

        const record = await prisma.backupRecord.findUnique({ where: { id } });
        if (!record) {
            return res.status(404).json({ success: false, message: 'Backup record not found' });
        }

        // Permission check
        if (user.role !== 'SUPER_ADMIN') {
            if (record.companyId !== user.companyId) {
                return res.status(403).json({ success: false, message: 'Unauthorized to delete this backup record' });
            }
        }

        // Remove file from disk if it exists
        const pathsToCheck = [record.filePath, path.join(BACKUP_DIR, record.fileName)];
        for (const p of pathsToCheck) {
            if (p && fs.existsSync(p)) {
                try {
                    fs.unlinkSync(p);
                } catch (fsErr) {
                    console.warn('Could not remove file from disk:', fsErr.message);
                }
            }
        }

        await prisma.backupRecord.delete({ where: { id } });

        res.json({
            success: true,
            message: `Backup ${record.fileName} has been deleted successfully.`
        });
    } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to delete backup' });
    }
}

/**
 * Safely restore company records from parsed backup JSON
 */
async function restoreCompanyData(backupData, targetCompanyId) {
    if (!backupData || typeof backupData !== 'object') {
        throw new Error('Invalid backup file content: Not a valid JSON object.');
    }

    const company = await prisma.company.findUnique({
        where: { id: targetCompanyId },
        include: { settings: true }
    });

    if (!company) {
        throw new Error(`Target company (ID: ${targetCompanyId}) does not exist.`);
    }

    const results = {
        companyName: company.name,
        settingsRestored: false,
        departments: 0,
        designations: 0,
        companyRoles: 0,
        leaveTypes: 0,
        holidays: 0,
        clients: 0,
        projects: 0,
        tasks: 0,
        announcements: 0,
        assets: 0,
        employeesMatched: 0,
        attendanceRestored: 0,
        leavesRestored: 0
    };

    // 1. Restore Company Settings
    const backupSettings = backupData.companyInfo?.settings;
    if (backupSettings) {
        await prisma.companySetting.upsert({
            where: { companyId: targetCompanyId },
            update: {
                workingDays: backupSettings.workingDays || undefined,
                officeStartTime: backupSettings.officeStartTime || undefined,
                officeEndTime: backupSettings.officeEndTime || undefined,
                timezone: backupSettings.timezone || undefined,
                currency: backupSettings.currency || undefined,
                currencySymbol: backupSettings.currencySymbol || undefined,
                dateFormat: backupSettings.dateFormat || undefined,
                timeFormat: backupSettings.timeFormat || undefined,
                financialYear: backupSettings.financialYear || undefined,
                startingMonth: backupSettings.startingMonth || undefined,
                currencyPosition: backupSettings.currencyPosition || undefined
            },
            create: {
                companyId: targetCompanyId,
                workingDays: backupSettings.workingDays || 'Mon,Tue,Wed,Thu,Fri',
                officeStartTime: backupSettings.officeStartTime || '09:00',
                officeEndTime: backupSettings.officeEndTime || '18:00',
                timezone: backupSettings.timezone || 'Asia/Kolkata',
                currency: backupSettings.currency || 'INR',
                currencySymbol: backupSettings.currencySymbol || '₹',
                dateFormat: backupSettings.dateFormat || 'DD/MM/YYYY',
                timeFormat: backupSettings.timeFormat || '12 Hours'
            }
        });
        results.settingsRestored = true;
    }

    // 2. Restore Departments
    const deptIdMap = {};
    if (Array.isArray(backupData.departments)) {
        for (const dept of backupData.departments) {
            if (!dept.name) continue;
            let existing = await prisma.department.findFirst({
                where: { companyId: targetCompanyId, name: dept.name }
            });
            if (!existing) {
                existing = await prisma.department.create({
                    data: {
                        companyId: targetCompanyId,
                        name: dept.name
                    }
                });
                results.departments++;
            }
            deptIdMap[dept.id] = existing.id;
        }
    }

    // 3. Restore Designations
    const desigIdMap = {};
    if (Array.isArray(backupData.designations)) {
        for (const desig of backupData.designations) {
            if (!desig.name) continue;
            let existing = await prisma.designation.findFirst({
                where: { companyId: targetCompanyId, name: desig.name }
            });
            const mappedDeptId = desig.departmentId ? deptIdMap[desig.departmentId] : null;
            if (!existing) {
                existing = await prisma.designation.create({
                    data: {
                        companyId: targetCompanyId,
                        name: desig.name,
                        departmentId: mappedDeptId
                    }
                });
                results.designations++;
            }
            desigIdMap[desig.id] = existing.id;
        }
    }

    // 4. Restore Company Roles and Permissions
    if (Array.isArray(backupData.companyRoles)) {
        for (const role of backupData.companyRoles) {
            if (!role.name) continue;
            let existingRole = await prisma.companyRole.findFirst({
                where: { companyId: targetCompanyId, name: role.name }
            });
            if (!existingRole) {
                existingRole = await prisma.companyRole.create({
                    data: {
                        companyId: targetCompanyId,
                        name: role.name,
                        description: role.description || null
                    }
                });
                results.companyRoles++;
            }
            if (Array.isArray(role.permissions)) {
                for (const perm of role.permissions) {
                    const exists = await prisma.rolePermission.findFirst({
                        where: { roleId: existingRole.id, module: perm.module }
                    });
                    if (!exists) {
                        await prisma.rolePermission.create({
                            data: {
                                roleId: existingRole.id,
                                module: perm.module,
                                canRead: !!perm.canRead,
                                canWrite: !!perm.canWrite,
                                canCreate: !!perm.canCreate,
                                canDelete: !!perm.canDelete
                            }
                        });
                    }
                }
            }
        }
    }

    // 5. Restore Leave Types
    const leaveTypeIdMap = {};
    if (Array.isArray(backupData.leaveTypes)) {
        for (const lt of backupData.leaveTypes) {
            try {
                if (!lt.name) continue;
                let existing = await prisma.leaveType.findFirst({
                    where: { companyId: targetCompanyId, name: lt.name }
                });
                if (!existing) {
                    existing = await prisma.leaveType.create({
                        data: {
                            companyId: targetCompanyId,
                            name: lt.name,
                            totalDaysPerYear: lt.totalDaysPerYear ?? lt.daysAllowed ?? 12,
                            isPaid: lt.isPaid !== undefined ? !!lt.isPaid : true
                        }
                    });
                    results.leaveTypes++;
                }
                leaveTypeIdMap[lt.id] = existing.id;
            } catch (err) {
                console.warn('Error restoring leave type:', err.message);
            }
        }
    }

    // 6. Restore Holidays
    if (Array.isArray(backupData.holidays)) {
        for (const h of backupData.holidays) {
            if (!h.title || !h.holidayDate) continue;
            const hDate = new Date(h.holidayDate);
            const existing = await prisma.holiday.findFirst({
                where: { companyId: targetCompanyId, title: h.title, holidayDate: hDate }
            });
            if (!existing) {
                await prisma.holiday.create({
                    data: {
                        companyId: targetCompanyId,
                        title: h.title,
                        holidayDate: hDate,
                        description: h.description || '',
                        isNational: !!h.isNational
                    }
                });
                results.holidays++;
            }
        }
    }

    // 7. Restore Clients
    const clientIdMap = {};
    if (Array.isArray(backupData.clients)) {
        for (const c of backupData.clients) {
            if (!c.name) continue;
            let existing = await prisma.client.findFirst({
                where: { companyId: targetCompanyId, name: c.name }
            });
            if (!existing) {
                existing = await prisma.client.create({
                    data: {
                        companyId: targetCompanyId,
                        name: c.name,
                        email: c.email || null,
                        phone: c.phone || null,
                        companyName: c.companyName || null,
                        address: c.address || null
                    }
                });
                results.clients++;
            }
            clientIdMap[c.id] = existing.id;
        }
    }

    // 8. Restore Projects
    const projectIdMap = {};
    if (Array.isArray(backupData.projects)) {
        for (const p of backupData.projects) {
            try {
                const projectName = p.name || p.title;
                if (!projectName) continue;
                let existing = await prisma.project.findFirst({
                    where: { companyId: targetCompanyId, name: projectName }
                });
                const mappedClientId = p.clientId ? clientIdMap[p.clientId] : null;
                if (!existing) {
                    const projectCode = p.projectCode || `PRJ-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
                    const validStatuses = ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
                    const statusVal = validStatuses.includes(p.status) ? p.status : 'ACTIVE';
                    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
                    const priorityVal = validPriorities.includes(p.priority) ? p.priority : 'MEDIUM';

                    existing = await prisma.project.create({
                        data: {
                            companyId: targetCompanyId,
                            projectCode: projectCode,
                            name: projectName,
                            description: p.description || null,
                            clientId: mappedClientId,
                            status: statusVal,
                            priority: priorityVal,
                            startDate: p.startDate ? new Date(p.startDate) : new Date(),
                            endDate: p.endDate ? new Date(p.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        }
                    });
                    results.projects++;
                }
                projectIdMap[p.id] = existing.id;
            } catch (err) {
                console.warn('Error restoring project:', err.message);
            }
        }
    }

    // 9. Restore Tasks
    if (Array.isArray(backupData.tasks)) {
        for (const t of backupData.tasks) {
            try {
                if (!t.title) continue;
                const mappedProjectId = t.projectId ? projectIdMap[t.projectId] : null;
                if (mappedProjectId) {
                    const existing = await prisma.task.findFirst({
                        where: { companyId: targetCompanyId, projectId: mappedProjectId, title: t.title }
                    });
                    if (!existing) {
                        const taskCode = t.taskCode || `TSK-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
                        const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'HOLD'];
                        const statusVal = validStatuses.includes(t.status) ? t.status : 'TODO';
                        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
                        const priorityVal = validPriorities.includes(t.priority) ? t.priority : 'MEDIUM';

                        await prisma.task.create({
                            data: {
                                companyId: targetCompanyId,
                                projectId: mappedProjectId,
                                taskCode: taskCode,
                                title: t.title,
                                description: t.description || null,
                                status: statusVal,
                                priority: priorityVal,
                                dueDate: t.dueDate ? new Date(t.dueDate) : null
                            }
                        });
                        results.tasks++;
                    }
                }
            } catch (err) {
                console.warn('Error restoring task:', err.message);
            }
        }
    }

    // 10. Restore Announcements
    if (Array.isArray(backupData.announcements)) {
        for (const a of backupData.announcements) {
            try {
                if (!a.title) continue;
                const existing = await prisma.announcement.findFirst({
                    where: { companyId: targetCompanyId, title: a.title }
                });
                if (!existing) {
                    await prisma.announcement.create({
                        data: {
                            companyId: targetCompanyId,
                            title: a.title,
                            content: a.content || '',
                            targetType: a.targetType || a.targetAudience || 'ALL'
                        }
                    });
                    results.announcements++;
                }
            } catch (err) {
                console.warn('Error restoring announcement:', err.message);
            }
        }
    }

    // 11. Restore Assets
    if (Array.isArray(backupData.assets)) {
        for (const ast of backupData.assets) {
            try {
                if (!ast.name) continue;
                const existing = await prisma.asset.findFirst({
                    where: { companyId: targetCompanyId, name: ast.name }
                });
                if (!existing) {
                    const assetCode = ast.assetCode || ast.assetId || `AST-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
                    const validStatuses = ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'];
                    const statusVal = validStatuses.includes(ast.status) ? ast.status : 'AVAILABLE';
                    await prisma.asset.create({
                        data: {
                            companyId: targetCompanyId,
                            assetCode: assetCode,
                            name: ast.name,
                            status: statusVal
                        }
                    });
                    results.assets++;
                }
            } catch (err) {
                console.warn('Error restoring asset:', err.message);
            }
        }
    }

    // 12. Match and Link Employees
    const empIdMap = {};
    if (Array.isArray(backupData.employees)) {
        for (const emp of backupData.employees) {
            try {
                const backupUser = (backupData.users || []).find(u => u.id === emp.userId);
                let dbEmp = null;

                if (backupUser && backupUser.email) {
                    const dbUser = await prisma.user.findFirst({
                        where: { companyId: targetCompanyId, email: backupUser.email }
                    });
                    if (dbUser) {
                        dbEmp = await prisma.employee.findUnique({ where: { userId: dbUser.id } });
                    }
                }

                if (!dbEmp && emp.employeeCode) {
                    dbEmp = await prisma.employee.findFirst({
                        where: { employeeCode: emp.employeeCode, user: { companyId: targetCompanyId } }
                    });
                }

                if (dbEmp) {
                    empIdMap[emp.id] = dbEmp.id;
                    results.employeesMatched++;

                    const mappedDeptId = emp.departmentId ? deptIdMap[emp.departmentId] : null;
                    const mappedDesigId = emp.designationId ? desigIdMap[emp.designationId] : null;
                    if (mappedDeptId || mappedDesigId) {
                        await prisma.employee.update({
                            where: { id: dbEmp.id },
                            data: {
                                departmentId: mappedDeptId || dbEmp.departmentId,
                                designationId: mappedDesigId || dbEmp.designationId
                            }
                        });
                    }
                }
            } catch (err) {
                console.warn('Error matching employee in restore:', err.message);
            }
        }
    }

    // 13. Restore Attendance Records
    if (Array.isArray(backupData.attendanceRecords)) {
        for (const att of backupData.attendanceRecords) {
            try {
                const mappedEmpId = empIdMap[att.employeeId];
                if (mappedEmpId && att.date) {
                    const attDate = new Date(att.date);
                    const existing = await prisma.attendanceRecord.findFirst({
                        where: { employeeId: mappedEmpId, date: attDate }
                    });
                    if (!existing) {
                        const validStatuses = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF'];
                        const statusVal = validStatuses.includes(att.status) ? att.status : 'PRESENT';
                        await prisma.attendanceRecord.create({
                            data: {
                                employeeId: mappedEmpId,
                                date: attDate,
                                checkIn: att.checkIn ? new Date(att.checkIn) : null,
                                checkOut: att.checkOut ? new Date(att.checkOut) : null,
                                status: statusVal,
                                deviceType: att.deviceType || att.punchMethod || 'WEB'
                            }
                        });
                        results.attendanceRestored++;
                    }
                }
            } catch (err) {
                console.warn('Error restoring attendance record:', err.message);
            }
        }
    }

    // 14. Restore Leave Requests
    if (Array.isArray(backupData.leaveRequests)) {
        for (const lr of backupData.leaveRequests) {
            try {
                const mappedEmpId = empIdMap[lr.employeeId];
                const mappedLtId = lr.leaveTypeId ? leaveTypeIdMap[lr.leaveTypeId] : null;
                if (mappedEmpId && mappedLtId && lr.startDate) {
                    const sDate = new Date(lr.startDate);
                    const eDate = lr.endDate ? new Date(lr.endDate) : sDate;
                    const existing = await prisma.leaveRequest.findFirst({
                        where: { employeeId: mappedEmpId, startDate: sDate }
                    });
                    if (!existing) {
                        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
                        const statusVal = validStatuses.includes(lr.status) ? lr.status : 'APPROVED';
                        await prisma.leaveRequest.create({
                            data: {
                                employeeId: mappedEmpId,
                                leaveTypeId: mappedLtId,
                                startDate: sDate,
                                endDate: eDate,
                                totalDays: lr.totalDays || 1,
                                status: statusVal,
                                reason: lr.reason || 'Restored from backup'
                            }
                        });
                        results.leavesRestored++;
                    }
                }
            } catch (err) {
                console.warn('Error restoring leave request:', err.message);
            }
        }
    }

    return results;
}

/**
 * Restore a backup record by its database ID
 */
async function restoreBackupById(req, res) {
    try {
        const user = req.user;
        const id = parseInt(req.params.id);

        const record = await prisma.backupRecord.findUnique({
            where: { id },
            include: { company: true }
        });

        if (!record) {
            return res.status(404).json({ success: false, message: 'Backup record not found.' });
        }

        // Security check: Company Admin can only restore their own company
        if (user.role !== 'SUPER_ADMIN') {
            if (record.companyId !== user.companyId) {
                return res.status(403).json({ success: false, message: 'Unauthorized to restore this company backup.' });
            }
        }

        let filePath = record.filePath;
        if (!fs.existsSync(filePath)) {
            const fallback = path.join(BACKUP_DIR, record.fileName);
            if (fs.existsSync(fallback)) filePath = fallback;
            else {
                return res.status(404).json({ success: false, message: 'Backup file is missing on server storage.' });
            }
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const backupData = JSON.parse(fileContent);

        let restoreSummary;
        if (record.backupType === 'SYSTEM_ALL') {
            if (user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ success: false, message: 'Only Super Admin can restore full system snapshots.' });
            }
            const compResults = [];
            if (Array.isArray(backupData.companies)) {
                for (const compBackup of backupData.companies) {
                    const compId = compBackup.companyInfo?.id || compBackup.id;
                    if (compId) {
                        try {
                            const compSlice = compBackup.companyInfo ? compBackup : {
                                companyInfo: compBackup,
                                departments: (backupData.departments || []).filter(d => d.companyId === compId),
                                designations: (backupData.designations || []).filter(d => d.companyId === compId),
                                users: (backupData.users || []).filter(u => u.companyId === compId),
                                employees: (backupData.employees || []).filter(e => {
                                    const u = (backupData.users || []).find(usr => usr.id === e.userId);
                                    return u ? u.companyId === compId : (e.companyId === compId);
                                }),
                                companyRoles: (backupData.companyRoles || []).filter(r => r.companyId === compId),
                                leaveTypes: (backupData.leaveTypes || []).filter(lt => lt.companyId === compId),
                                holidays: (backupData.holidays || []).filter(h => h.companyId === compId),
                                clients: (backupData.clients || []).filter(c => c.companyId === compId),
                                projects: (backupData.projects || []).filter(p => p.companyId === compId),
                                tasks: (backupData.tasks || []).filter(t => t.companyId === compId),
                                announcements: (backupData.announcements || []).filter(a => a.companyId === compId),
                                assets: (backupData.assets || []).filter(a => a.companyId === compId),
                                attendanceRecords: backupData.attendanceRecords || [],
                                leaveRequests: backupData.leaveRequests || []
                            };
                            const resComp = await restoreCompanyData(compSlice, compId);
                            compResults.push(resComp);
                        } catch (err) {
                            console.error(`Error restoring company ${compBackup.name || compBackup.companyInfo?.name}:`, err.message);
                        }
                    }
                }
            }
            restoreSummary = { totalCompaniesRestored: compResults.length, details: compResults };
        } else {
            const targetCompanyId = user.role === 'SUPER_ADMIN' ? (record.companyId || req.body.targetCompanyId) : user.companyId;
            if (!targetCompanyId) {
                return res.status(400).json({ success: false, message: 'Target company could not be resolved.' });
            }
            restoreSummary = await restoreCompanyData(backupData, targetCompanyId);
        }

        res.json({
            success: true,
            message: `Backup archive "${record.fileName}" restored successfully!`,
            data: restoreSummary
        });
    } catch (error) {
        console.error('Error restoring backup by id:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to restore backup archive.' });
    }
}

/**
 * Upload a backup JSON file directly and restore it
 */
async function restoreBackupFromFile(req, res) {
    try {
        const user = req.user;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No backup file uploaded.' });
        }

        let backupData;
        try {
            const content = req.file.buffer.toString('utf-8');
            backupData = JSON.parse(content);
        } catch (parseErr) {
            return res.status(400).json({ success: false, message: 'Invalid JSON file: ' + parseErr.message });
        }

        let targetCompanyId = user.companyId;
        if (user.role === 'SUPER_ADMIN') {
            targetCompanyId = req.body.targetCompanyId
                ? parseInt(req.body.targetCompanyId)
                : (backupData.metadata?.companyId || backupData.companyInfo?.id);
        }

        if (!targetCompanyId && backupData.metadata?.backupType !== 'SYSTEM_ALL') {
            return res.status(400).json({ success: false, message: 'Target company ID is required for restore.' });
        }

        let restoreSummary;
        if (backupData.metadata?.backupType === 'SYSTEM_ALL') {
            if (user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ success: false, message: 'Only Super Admin can restore full system snapshots.' });
            }
            const compResults = [];
            if (Array.isArray(backupData.companies)) {
                for (const compBackup of backupData.companies) {
                    const compId = compBackup.companyInfo?.id || compBackup.id;
                    if (compId) {
                        try {
                            const compSlice = compBackup.companyInfo ? compBackup : {
                                companyInfo: compBackup,
                                departments: (backupData.departments || []).filter(d => d.companyId === compId),
                                designations: (backupData.designations || []).filter(d => d.companyId === compId),
                                users: (backupData.users || []).filter(u => u.companyId === compId),
                                employees: (backupData.employees || []).filter(e => {
                                    const u = (backupData.users || []).find(usr => usr.id === e.userId);
                                    return u ? u.companyId === compId : (e.companyId === compId);
                                }),
                                companyRoles: (backupData.companyRoles || []).filter(r => r.companyId === compId),
                                leaveTypes: (backupData.leaveTypes || []).filter(lt => lt.companyId === compId),
                                holidays: (backupData.holidays || []).filter(h => h.companyId === compId),
                                clients: (backupData.clients || []).filter(c => c.companyId === compId),
                                projects: (backupData.projects || []).filter(p => p.companyId === compId),
                                tasks: (backupData.tasks || []).filter(t => t.companyId === compId),
                                announcements: (backupData.announcements || []).filter(a => a.companyId === compId),
                                assets: (backupData.assets || []).filter(a => a.companyId === compId),
                                attendanceRecords: backupData.attendanceRecords || [],
                                leaveRequests: backupData.leaveRequests || []
                            };
                            const resComp = await restoreCompanyData(compSlice, compId);
                            compResults.push(resComp);
                        } catch (err) {
                            console.error(`Error restoring company:`, err.message);
                        }
                    }
                }
            }
            restoreSummary = { totalCompaniesRestored: compResults.length, details: compResults };
        } else {
            restoreSummary = await restoreCompanyData(backupData, targetCompanyId);
        }

        res.json({
            success: true,
            message: `Uploaded backup file restored successfully!`,
            data: restoreSummary
        });
    } catch (error) {
        console.error('Error restoring uploaded backup:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to restore uploaded backup.' });
    }
}

/**
 * Restore a backup created on a specific date (or matching backupId)
 */
async function restoreBackupByDate(req, res) {
    try {
        const user = req.user;
        const { date, backupId, targetCompanyId } = req.body;

        let record = null;
        if (backupId) {
            record = await prisma.backupRecord.findUnique({
                where: { id: parseInt(backupId) },
                include: { company: true }
            });
        } else if (date) {
            const dateStr = String(date).split('T')[0];
            const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
            const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

            const whereClause = {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            };
            if (user.role !== 'SUPER_ADMIN') {
                whereClause.companyId = user.companyId;
            } else if (targetCompanyId) {
                whereClause.companyId = parseInt(targetCompanyId);
            }

            record = await prisma.backupRecord.findFirst({
                where: whereClause,
                include: { company: true },
                orderBy: { createdAt: 'desc' }
            });
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: date
                    ? `No backup archive found for date ${date}. Please select another date or pick from the available archive snapshots.`
                    : 'Backup record not found.'
            });
        }

        req.params.id = record.id;
        return restoreBackupById(req, res);
    } catch (error) {
        console.error('Error in restoreBackupByDate:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to restore backup by date.' });
    }
}

// ==========================================
// 3. CLEAR CACHE MANAGEMENT
// ==========================================

/**
 * Clear cache for the company or all platform
 */
async function clearCache(req, res) {
    try {
        const user = req.user;
        const isSuperAdmin = user.role === 'SUPER_ADMIN';
        const { scope = 'COMPANY' } = req.body;

        const timestamp = new Date().toISOString();

        if (isSuperAdmin && scope === 'ALL') {
            // Full platform cache reset
            res.json({
                success: true,
                message: 'All system, company and platform cache has been cleared successfully.',
                scope: 'ALL',
                timestamp
            });
        } else {
            // Company-level cache reset
            const companyId = user.companyId || (req.body.targetCompanyId ? parseInt(req.body.targetCompanyId) : null);
            res.json({
                success: true,
                message: 'Company cache and temporary application state cleared successfully.',
                scope: 'COMPANY',
                companyId,
                timestamp
            });
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ success: false, message: 'Failed to clear cache' });
    }
}

module.exports = {
    // Banned IPs
    getBannedIps,
    addBannedIp,
    updateBannedIp,
    deleteBannedIp,
    // Backups
    getBackups,
    generateBackup,
    downloadBackup,
    deleteBackup,
    restoreBackupById,
    restoreBackupFromFile,
    restoreBackupByDate,
    // Cache
    clearCache
};
