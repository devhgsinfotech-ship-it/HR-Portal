// backend/src/utils/lifecycleNotifier.js
const prisma = require('../config/prisma');
const { sendLifecycleNotificationEmail } = require('./emailService');
const { getDynamicFrontendUrl } = require('./urlHelper');

/**
 * Helper to fetch all management users (Super Admin, Company Admin, HR) for a company.
 */
async function getManagementRecipients(companyId) {
    if (!companyId) return [];
    try {
        return await prisma.user.findMany({
            where: {
                companyId,
                role: { in: ['COMPANY_ADMIN', 'HR', 'SUPER_ADMIN'] },
                accountStatus: 'ACTIVE'
            },
            select: { id: true, email: true, name: true, role: true }
        });
    } catch (err) {
        console.error('[lifecycleNotifier] Failed to fetch management recipients:', err);
        return [];
    }
}

/**
 * Helper to fetch employee user details (userId, email, name).
 */
async function getEmployeeUser(employeeId) {
    if (!employeeId) return null;
    try {
        const emp = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                user: { select: { id: true, email: true, name: true } },
                reportingManager: {
                    include: {
                        user: { select: { id: true, email: true, name: true } }
                    }
                }
            }
        });
        return emp;
    } catch (err) {
        console.error('[lifecycleNotifier] Failed to fetch employee user:', err);
        return null;
    }
}

/**
 * 1. PROMOTION NOTIFICATION
 */
async function notifyPromotion({ companyId, senderUserId, promotionRecord }) {
    try {
        const empData = await getEmployeeUser(promotionRecord.employeeId);
        if (!empData) return;

        const empName = `${empData.firstName} ${empData.lastName}`.trim();
        const promoDate = promotionRecord.promotionDate
            ? new Date(promotionRecord.promotionDate).toISOString().split('T')[0]
            : 'Immediate';
        const newDesigName = promotionRecord.newDesignation?.name || 'New Role';
        const deptName = promotionRecord.department?.name || 'Department';

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';

        const portalBaseUrl = getDynamicFrontendUrl();
        const promoPortalUrl = `${portalBaseUrl}/promotion`;

        // 1. In-app notification to the promoted Employee
        if (empData.user?.id) {
            await prisma.notification.create({
                data: {
                    receiverId: empData.user.id,
                    senderId: senderUserId || null,
                    type: 'PROMOTION',
                    title: '🎉 Congratulations on Your Promotion!',
                    message: `You have been promoted to ${newDesigName} in ${deptName}, effective ${promoDate}.`
                }
            });

            if (empData.user.email) {
                sendLifecycleNotificationEmail({
                    toEmail: empData.user.email,
                    recipientName: empName,
                    title: '🎉 Congratulations on Your Promotion!',
                    messageHtml: `
                        <p>We are delighted to announce that you have been promoted to <strong>${newDesigName}</strong> in the <strong>${deptName}</strong> department, effective from <strong>${promoDate}</strong>.</p>
                        <p>Thank you for your hard work, dedication, and valuable contributions to ${companyName}. We wish you continued success in your new role!</p>
                    `,
                    companyName,
                    actionUrl: promoPortalUrl
                }).catch(err => console.warn('[lifecycleNotifier] Promotion email warn:', err.message));
            }
        }

        // 2. In-app notification to Management (Company Admins & HRs)
        const management = await getManagementRecipients(companyId);
        for (const admin of management) {
            if (admin.id === senderUserId) continue; // Skip sender if they triggered it

            await prisma.notification.create({
                data: {
                    receiverId: admin.id,
                    senderId: senderUserId || null,
                    type: 'PROMOTION',
                    title: 'Employee Promotion Recorded',
                    message: `${empName} (${empData.employeeCode}) has been promoted to ${newDesigName} in ${deptName}.`
                }
            });

            if (admin.email) {
                sendLifecycleNotificationEmail({
                    toEmail: admin.email,
                    recipientName: admin.name || 'Admin',
                    title: `Promotion Recorded: ${empName}`,
                    messageHtml: `
                        <p>An employee promotion has been processed:</p>
                        <ul>
                            <li><strong>Employee:</strong> ${empName} (${empData.employeeCode})</li>
                            <li><strong>New Designation:</strong> ${newDesigName}</li>
                            <li><strong>Department:</strong> ${deptName}</li>
                            <li><strong>Effective Date:</strong> ${promoDate}</li>
                        </ul>
                    `,
                    companyName,
                    actionUrl: promoPortalUrl
                }).catch(err => console.warn('[lifecycleNotifier] Admin promo email warn:', err.message));
            }
        }
    } catch (err) {
        console.error('[lifecycleNotifier] notifyPromotion error:', err);
    }
}

/**
 * 2. TERMINATION NOTIFICATION
 */
async function notifyTermination({ companyId, senderUserId, terminationRecord }) {
    try {
        const empData = await getEmployeeUser(terminationRecord.employeeId);
        if (!empData) return;

        const empName = `${empData.firstName} ${empData.lastName}`.trim();
        const termDate = terminationRecord.terminationDate
            ? new Date(terminationRecord.terminationDate).toISOString().split('T')[0]
            : 'N/A';
        const termType = (terminationRecord.terminationType || '').replace('_', ' ');

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';

        const portalBaseUrl = getDynamicFrontendUrl();
        const termPortalUrl = `${portalBaseUrl}/termination`;

        // 1. In-app notification to the terminated Employee
        if (empData.user?.id) {
            await prisma.notification.create({
                data: {
                    receiverId: empData.user.id,
                    senderId: senderUserId || null,
                    type: 'TERMINATION',
                    title: 'Employment Termination Notice',
                    message: `Your employment termination has been recorded effective ${termDate}. Type: ${termType}.`
                }
            });

            if (empData.user.email) {
                sendLifecycleNotificationEmail({
                    toEmail: empData.user.email,
                    recipientName: empName,
                    title: 'Employment Termination Notice',
                    messageHtml: `
                        <p>This is to inform you that your employment termination has been recorded in our records.</p>
                        <ul>
                            <li><strong>Effective Date:</strong> ${termDate}</li>
                            <li><strong>Type:</strong> ${termType}</li>
                        </ul>
                        <p>Please connect with the HR department regarding exit clearance and settlement formalities.</p>
                    `,
                    companyName,
                    actionUrl: termPortalUrl
                }).catch(err => console.warn('[lifecycleNotifier] Termination email warn:', err.message));
            }
        }

        // 2. In-app notification to Management (Company Admins & HRs)
        const management = await getManagementRecipients(companyId);
        for (const admin of management) {
            if (admin.id === senderUserId) continue;

            await prisma.notification.create({
                data: {
                    receiverId: admin.id,
                    senderId: senderUserId || null,
                    type: 'TERMINATION',
                    title: 'Employee Termination Recorded',
                    message: `${empName} (${empData.employeeCode}) has been terminated effective ${termDate} (${termType}).`
                }
            });

            if (admin.email) {
                sendLifecycleNotificationEmail({
                    toEmail: admin.email,
                    recipientName: admin.name || 'Admin',
                    title: `Termination Notice: ${empName}`,
                    messageHtml: `
                        <p>An employee termination has been recorded:</p>
                        <ul>
                            <li><strong>Employee:</strong> ${empName} (${empData.employeeCode})</li>
                            <li><strong>Termination Type:</strong> ${termType}</li>
                            <li><strong>Effective Date:</strong> ${termDate}</li>
                            <li><strong>Reason:</strong> ${terminationRecord.reason || 'Not specified'}</li>
                        </ul>
                    `,
                    companyName,
                    actionUrl: termPortalUrl
                }).catch(err => console.warn('[lifecycleNotifier] Admin term email warn:', err.message));
            }
        }
    } catch (err) {
        console.error('[lifecycleNotifier] notifyTermination error:', err);
    }
}

/**
 * 3. RESIGNATION NOTIFICATION
 */
async function notifyResignation({ companyId, senderUserId, resignationRecord }) {
    try {
        const empData = await getEmployeeUser(resignationRecord.employeeId);
        if (!empData) return;

        const empName = `${empData.firstName} ${empData.lastName}`.trim();
        const resDate = resignationRecord.resignationDate
            ? new Date(resignationRecord.resignationDate).toISOString().split('T')[0]
            : 'N/A';
        const notDate = resignationRecord.noticeDate
            ? new Date(resignationRecord.noticeDate).toISOString().split('T')[0]
            : 'N/A';

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';

        const portalBaseUrl = getDynamicFrontendUrl();
        const resPortalUrl = `${portalBaseUrl}/resignation`;

        // 1. In-app notification to Employee
        if (empData.user?.id) {
            await prisma.notification.create({
                data: {
                    receiverId: empData.user.id,
                    senderId: senderUserId || null,
                    type: 'RESIGNATION',
                    title: 'Resignation Submitted',
                    message: `Your resignation has been recorded. Notice Date: ${notDate}, Last Working Day: ${resDate}.`
                }
            });

            if (empData.user.email) {
                sendLifecycleNotificationEmail({
                    toEmail: empData.user.email,
                    recipientName: empName,
                    title: 'Resignation Record Acknowledgment',
                    messageHtml: `
                        <p>Your resignation submission has been acknowledged and recorded in the system.</p>
                        <ul>
                            <li><strong>Notice Date:</strong> ${notDate}</li>
                            <li><strong>Expected Last Working Day:</strong> ${resDate}</li>
                        </ul>
                        <p>Your HR manager and reporting lead will coordinate handover and exit procedures with you.</p>
                    `,
                    companyName,
                    actionUrl: resPortalUrl
                }).catch(err => console.warn('[lifecycleNotifier] Resignation email warn:', err.message));
            }
        }

        // 2. In-app notification to Management (Company Admins & HRs)
        const management = await getManagementRecipients(companyId);
        for (const admin of management) {
            if (admin.id === senderUserId) continue;

            await prisma.notification.create({
                data: {
                    receiverId: admin.id,
                    senderId: senderUserId || null,
                    type: 'RESIGNATION',
                    title: 'Resignation Submitted',
                    message: `${empName} (${empData.employeeCode}) has submitted resignation. Last Working Day: ${resDate}.`
                }
            });

            if (admin.email) {
                sendLifecycleNotificationEmail({
                    toEmail: admin.email,
                    recipientName: admin.name || 'Admin',
                    title: `Resignation Submitted: ${empName}`,
                    messageHtml: `
                        <p>A resignation has been submitted in your organization:</p>
                        <ul>
                            <li><strong>Employee:</strong> ${empName} (${empData.employeeCode})</li>
                            <li><strong>Notice Date:</strong> ${notDate}</li>
                            <li><strong>Last Working Day:</strong> ${resDate}</li>
                            <li><strong>Reason:</strong> ${resignationRecord.reason || 'Personal reasons'}</li>
                        </ul>
                    `,
                    companyName,
                    actionUrl: resPortalUrl
                }).catch(err => console.warn('[lifecycleNotifier] Admin res email warn:', err.message));
            }
        }
    } catch (err) {
        console.error('[lifecycleNotifier] notifyResignation error:', err);
    }
}

/**
 * 4. PROBATION STATUS NOTIFICATION
 */
async function notifyProbationStatus({ companyId, senderUserId, employeeId, status, probationEndDate, extensionMonths }) {
    try {
        const empData = await getEmployeeUser(employeeId);
        if (!empData) return;

        const empName = `${empData.firstName} ${empData.lastName}`.trim();
        const endDateStr = probationEndDate
            ? (typeof probationEndDate === 'string' ? probationEndDate : new Date(probationEndDate).toISOString().split('T')[0])
            : 'N/A';

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';

        let empTitle = 'Probation Status Updated';
        let empMsg = `Your probation status is now ${status.replace('_', ' ')}.`;
        let adminTitle = `Probation Updated: ${empName}`;
        let adminMsg = `${empName}'s probation status updated to ${status.replace('_', ' ')}.`;

        if (status === 'CONFIRMED') {
            empTitle = '🎉 Congratulations! Probation Confirmed';
            empMsg = 'Your probation period has been successfully completed and confirmed. You are now a permanent employee!';
            adminTitle = 'Probation Confirmed';
            adminMsg = `${empName} (${empData.employeeCode}) has successfully completed probation and is now confirmed.`;
        } else if (status === 'EXTENDED') {
            empTitle = 'Probation Period Extended';
            empMsg = `Your probation period has been extended by ${extensionMonths || 3} month(s) until ${endDateStr}.`;
            adminTitle = 'Probation Extended';
            adminMsg = `${empName} (${empData.employeeCode}) probation extended until ${endDateStr}.`;
        } else if (status === 'FAILED') {
            empTitle = 'Probation Review Update';
            empMsg = 'Your probation review has concluded without confirmation. Please consult HR.';
            adminTitle = 'Probation Discontinued';
            adminMsg = `${empName} (${empData.employeeCode}) probation has been marked as failed/discontinued.`;
        } else if (status === 'ON_PROBATION') {
            empTitle = 'Probation Period Assigned';
            empMsg = `You have been assigned to probation until ${endDateStr}.`;
            adminTitle = 'Probation Assigned';
            adminMsg = `${empName} (${empData.employeeCode}) has been placed on probation until ${endDateStr}.`;
        }

        const portalBaseUrl = getDynamicFrontendUrl();
        const probPortalUrl = `${portalBaseUrl}/probation-management`;

        // 1. In-app notification to Employee
        if (empData.user?.id) {
            await prisma.notification.create({
                data: {
                    receiverId: empData.user.id,
                    senderId: senderUserId || null,
                    type: 'PROBATION',
                    title: empTitle,
                    message: empMsg
                }
            });

            if (empData.user.email) {
                sendLifecycleNotificationEmail({
                    toEmail: empData.user.email,
                    recipientName: empName,
                    title: empTitle,
                    messageHtml: `<p>${empMsg}</p>`,
                    companyName,
                    actionUrl: probPortalUrl
                }).catch(err => console.warn('[lifecycleNotifier] Probation email warn:', err.message));
            }
        }

        // 2. In-app notification to Management (Company Admins & HRs)
        const management = await getManagementRecipients(companyId);
        for (const admin of management) {
            if (admin.id === senderUserId) continue;

            await prisma.notification.create({
                data: {
                    receiverId: admin.id,
                    senderId: senderUserId || null,
                    type: 'PROBATION',
                    title: adminTitle,
                    message: adminMsg
                }
            });

            if (admin.email) {
                sendLifecycleNotificationEmail({
                    toEmail: admin.email,
                    recipientName: admin.name || 'Admin',
                    title: adminTitle,
                    messageHtml: `<p>${adminMsg}</p>`,
                    companyName,
                    actionUrl: probPortalUrl
                }).catch(err => console.warn('[lifecycleNotifier] Admin prob email warn:', err.message));
            }
        }
    } catch (err) {
        console.error('[lifecycleNotifier] notifyProbationStatus error:', err);
    }
}

module.exports = {
    notifyPromotion,
    notifyTermination,
    notifyResignation,
    notifyProbationStatus
};
