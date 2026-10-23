// backend/src/utils/workArrangementNotifier.js
const prisma = require('../config/prisma');
const { sendLifecycleNotificationEmail } = require('./emailService');
const { getDynamicFrontendUrl } = require('./urlHelper');

/**
 * Fetch all management users (Company Admin, HR, Super Admin) for a company.
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
        console.error('[workArrangementNotifier] Error fetching management recipients:', err);
        return [];
    }
}

/**
 * Fetch full employee info along with User and Reporting Manager (Team Lead).
 */
async function getEmployeeWithManager(employeeId) {
    if (!employeeId) return null;
    try {
        return await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                user: { select: { id: true, email: true, name: true } },
                department: { select: { id: true, name: true } },
                designation: { select: { name: true } },
                reportingManager: {
                    include: {
                        user: { select: { id: true, email: true, name: true } }
                    }
                }
            }
        });
    } catch (err) {
        console.error('[workArrangementNotifier] Error fetching employee with manager:', err);
        return null;
    }
}

/**
 * Fetch department leads/managers (Designation or CompanyRole has 'Lead' or 'Manager').
 */
async function getDepartmentLeads(companyId, departmentId) {
    if (!companyId || !departmentId) return [];
    try {
        const emps = await prisma.employee.findMany({
            where: {
                departmentId,
                user: { companyId, accountStatus: 'ACTIVE' },
                OR: [
                    { designation: { name: { contains: 'Lead' } } },
                    { designation: { name: { contains: 'Manager' } } },
                    { companyRole: { name: { in: ['Manager', 'Team Lead', 'HR Manager'] } } }
                ]
            },
            select: { user: { select: { id: true, email: true, name: true } } }
        });
        return emps.map(e => e.user).filter(Boolean);
    } catch (err) {
        console.warn('[workArrangementNotifier] Error fetching department leads:', err.message);
        return [];
    }
}

/**
 * Helper to dispatch in-app notification & email to a list of recipients.
 */
async function dispatchNotifications({ recipients, senderUserId, type, title, message, actionUrl, companyName }) {
    if (!recipients || recipients.length === 0) return;

    // Deduplicate recipients by userId
    const uniqueRecipients = [];
    const seen = new Set();
    for (const r of recipients) {
        if (!r || !r.id) continue;
        if (senderUserId && r.id === senderUserId) continue; // Don't notify the person who triggered it
        if (!seen.has(r.id)) {
            seen.add(r.id);
            uniqueRecipients.push(r);
        }
    }

    if (uniqueRecipients.length === 0) return;

    for (const r of uniqueRecipients) {
        try {
            // 1. In-App Notification
            await prisma.notification.create({
                data: {
                    receiverId: r.id,
                    senderId: senderUserId || null,
                    type,
                    title,
                    message,
                    isRead: false
                }
            });

            // 2. Email Notification (if email is available)
            if (r.email) {
                sendLifecycleNotificationEmail({
                    toEmail: r.email,
                    recipientName: r.name || 'Team Member',
                    title,
                    messageHtml: `<p style="margin: 0; font-size: 14px;">${message}</p>`,
                    companyName,
                    actionUrl
                }).catch(e => console.warn(`[workArrangementNotifier] Email failed for ${r.email}:`, e.message));
            }
        } catch (err) {
            console.error(`[workArrangementNotifier] Failed to deliver notification to user ${r.id}:`, err.message);
        }
    }
}

/**
 * 1. NOTIFY ON WORK FROM HOME (WFH) APPLICATION
 * Sent to: HR Manager, Reporting Manager, Assigned Team Lead, Company Admin
 */
async function notifyWfhApplied({ companyId, senderUserId, wfhRecord, req }) {
    try {
        const emp = await getEmployeeWithManager(wfhRecord.employeeId);
        if (!emp) return;

        const empName = `${emp.firstName} ${emp.lastName}`.trim();
        const empCode = emp.employeeCode || '';
        const deptName = emp.department?.name || 'General';
        const startStr = wfhRecord.startDate ? new Date(wfhRecord.startDate).toISOString().split('T')[0] : '';
        const endStr = wfhRecord.endDate ? new Date(wfhRecord.endDate).toISOString().split('T')[0] : startStr;
        const reasonStr = wfhRecord.reason ? `Reason: "${wfhRecord.reason}"` : 'Reason: Personal / Remote';

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';
        const portalUrl = `${getDynamicFrontendUrl(req)}/wfh-management`;

        // Gather Recipients
        const mgmt = await getManagementRecipients(companyId);
        const recipients = [...mgmt];

        // Add Direct Reporting Manager / Team Lead
        if (emp.reportingManager?.user) {
            recipients.push(emp.reportingManager.user);
        }

        // Add Department Team Leads
        if (emp.department?.id) {
            const leads = await getDepartmentLeads(companyId, emp.department.id);
            recipients.push(...leads);
        }

        const title = '🏠 New Work From Home (WFH) Request';
        const message = `${empName} (${empCode}, ${deptName}) applied for Work From Home from ${startStr} to ${endStr}. ${reasonStr}`;

        await dispatchNotifications({
            recipients,
            senderUserId,
            type: 'WFH',
            title,
            message,
            actionUrl: portalUrl,
            companyName
        });
    } catch (err) {
        console.error('[workArrangementNotifier] Error in notifyWfhApplied:', err);
    }
}

/**
 * 2. NOTIFY ON WFH STATUS UPDATE (APPROVED / REJECTED)
 * Sent to: Employee who requested, and their Reporting Manager
 */
async function notifyWfhStatusChanged({ companyId, senderUserId, wfhRecord, status, req }) {
    try {
        const emp = await getEmployeeWithManager(wfhRecord.employeeId);
        if (!emp || !emp.user) return;

        const empName = `${emp.firstName} ${emp.lastName}`.trim();
        const startStr = wfhRecord.startDate ? new Date(wfhRecord.startDate).toISOString().split('T')[0] : '';
        const endStr = wfhRecord.endDate ? new Date(wfhRecord.endDate).toISOString().split('T')[0] : startStr;

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';
        const portalUrl = `${getDynamicFrontendUrl(req)}/wfh-management`;

        const isApproved = status === 'APPROVED';
        const title = isApproved ? '✅ WFH Request Approved' : '❌ WFH Request Rejected';
        const message = isApproved
            ? `Your Work From Home request for ${startStr} to ${endStr} has been APPROVED.`
            : `Your Work From Home request for ${startStr} to ${endStr} has been REJECTED.`;

        const recipients = [emp.user];
        if (emp.reportingManager?.user) {
            recipients.push(emp.reportingManager.user);
        }

        await dispatchNotifications({
            recipients,
            senderUserId,
            type: 'WFH',
            title,
            message,
            actionUrl: portalUrl,
            companyName
        });
    } catch (err) {
        console.error('[workArrangementNotifier] Error in notifyWfhStatusChanged:', err);
    }
}

/**
 * 3. NOTIFY ON SHIFT SWAP REQUEST
 * Sent to: Target Colleague (peer to swap with), HR Manager, Reporting Manager, Team Lead
 */
async function notifyShiftSwapRequested({ companyId, senderUserId, swapRecord, req }) {
    try {
        const [requester, targetColleague, currentShift, requestedShift] = await Promise.all([
            getEmployeeWithManager(swapRecord.requesterId),
            swapRecord.targetEmployeeId ? getEmployeeWithManager(swapRecord.targetEmployeeId) : null,
            prisma.shiftPolicy.findUnique({ where: { id: swapRecord.currentShiftId } }),
            prisma.shiftPolicy.findUnique({ where: { id: swapRecord.requestedShiftId } })
        ]);

        if (!requester) return;

        const reqName = `${requester.firstName} ${requester.lastName}`.trim();
        const targetName = targetColleague ? `${targetColleague.firstName} ${targetColleague.lastName}`.trim() : 'Colleague';
        const shiftDateStr = swapRecord.shiftDate ? new Date(swapRecord.shiftDate).toISOString().split('T')[0] : '';
        const fromShift = currentShift?.name || 'Current Shift';
        const toShift = requestedShift?.name || 'Requested Shift';
        const reasonStr = swapRecord.reason ? ` Reason: "${swapRecord.reason}"` : '';

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';
        const portalUrl = `${getDynamicFrontendUrl(req)}/shift-swap-requests`;

        // 1. Notify Target Colleague specifically
        if (targetColleague?.user) {
            const peerTitle = '🔄 Incoming Shift Swap Request';
            const peerMessage = `${reqName} wants to exchange shifts with you on ${shiftDateStr}. (Their: ${fromShift} ⇄ Your: ${toShift}).${reasonStr}`;
            await dispatchNotifications({
                recipients: [targetColleague.user],
                senderUserId,
                type: 'SHIFT_SWAP',
                title: peerTitle,
                message: peerMessage,
                actionUrl: portalUrl,
                companyName
            });
        }

        // 2. Notify Management, Reporting Managers & Team Leads
        const mgmt = await getManagementRecipients(companyId);
        const recipients = [...mgmt];

        if (requester.reportingManager?.user) {
            recipients.push(requester.reportingManager.user);
        }
        if (targetColleague?.reportingManager?.user) {
            recipients.push(targetColleague.reportingManager.user);
        }
        if (requester.department?.id) {
            const leads = await getDepartmentLeads(companyId, requester.department.id);
            recipients.push(...leads);
        }

        const mgmtTitle = '🔄 New Shift Swap Request';
        const mgmtMessage = `${reqName} requested a shift swap with ${targetName} for ${shiftDateStr} (${fromShift} ⇄ ${toShift}).${reasonStr}`;

        await dispatchNotifications({
            recipients,
            senderUserId,
            type: 'SHIFT_SWAP',
            title: mgmtTitle,
            message: mgmtMessage,
            actionUrl: portalUrl,
            companyName
        });
    } catch (err) {
        console.error('[workArrangementNotifier] Error in notifyShiftSwapRequested:', err);
    }
}

/**
 * 4. NOTIFY ON SHIFT SWAP STATUS UPDATE (APPROVED / REJECTED)
 * Sent to: Requester Employee AND Target Colleague
 */
async function notifyShiftSwapStatusChanged({ companyId, senderUserId, swapRecord, status, rejectionReason, req }) {
    try {
        const [requester, targetColleague] = await Promise.all([
            getEmployeeWithManager(swapRecord.requesterId),
            swapRecord.targetEmployeeId ? getEmployeeWithManager(swapRecord.targetEmployeeId) : null
        ]);

        if (!requester) return;

        const reqName = `${requester.firstName} ${requester.lastName}`.trim();
        const targetName = targetColleague ? `${targetColleague.firstName} ${targetColleague.lastName}`.trim() : 'Colleague';
        const shiftDateStr = swapRecord.shiftDate ? new Date(swapRecord.shiftDate).toISOString().split('T')[0] : '';

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';
        const portalUrl = `${getDynamicFrontendUrl(req)}/shift-swap-requests`;

        const isApproved = status === 'APPROVED';
        const title = isApproved ? '✅ Shift Swap Request Approved' : '❌ Shift Swap Request Rejected';
        const message = isApproved
            ? `Shift swap between ${reqName} and ${targetName} for ${shiftDateStr} has been APPROVED by HR. Your schedule has been updated.`
            : `Shift swap request for ${shiftDateStr} has been REJECTED.${rejectionReason ? ` Reason: "${rejectionReason}"` : ''}`;

        const recipients = [];
        if (requester.user) recipients.push(requester.user);
        if (targetColleague?.user) recipients.push(targetColleague.user);
        if (requester.reportingManager?.user) recipients.push(requester.reportingManager.user);

        await dispatchNotifications({
            recipients,
            senderUserId,
            type: 'SHIFT_SWAP',
            title,
            message,
            actionUrl: portalUrl,
            companyName
        });
    } catch (err) {
        console.error('[workArrangementNotifier] Error in notifyShiftSwapStatusChanged:', err);
    }
}

/**
 * 5. NOTIFY ON OVERTIME SUBMISSION
 * Sent to: HR Manager, Reporting Manager, Team Lead, Company Admin
 */
async function notifyOvertimeSubmitted({ companyId, senderUserId, overtimeRecord, req }) {
    try {
        const emp = await getEmployeeWithManager(overtimeRecord.employeeId);
        if (!emp) return;

        const empName = `${emp.firstName} ${emp.lastName}`.trim();
        const empCode = emp.employeeCode || '';
        const dateStr = overtimeRecord.overtimeDate ? new Date(overtimeRecord.overtimeDate).toISOString().split('T')[0] : '';
        const hours = Number(overtimeRecord.hours || 0);
        const proj = overtimeRecord.project ? ` Project: "${overtimeRecord.project}".` : '';

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';
        const portalUrl = `${getDynamicFrontendUrl(req)}/overtime`;

        const mgmt = await getManagementRecipients(companyId);
        const recipients = [...mgmt];

        if (emp.reportingManager?.user) {
            recipients.push(emp.reportingManager.user);
        }
        if (emp.department?.id) {
            const leads = await getDepartmentLeads(companyId, emp.department.id);
            recipients.push(...leads);
        }

        const title = '⏱️ New Overtime Claim Submitted';
        const message = `${empName} (${empCode}) submitted an overtime claim for ${hours} hr(s) on ${dateStr}.${proj}`;

        await dispatchNotifications({
            recipients,
            senderUserId,
            type: 'OVERTIME',
            title,
            message,
            actionUrl: portalUrl,
            companyName
        });
    } catch (err) {
        console.error('[workArrangementNotifier] Error in notifyOvertimeSubmitted:', err);
    }
}

/**
 * 6. NOTIFY ON OVERTIME STATUS UPDATE (APPROVED / REJECTED)
 * Sent to: Employee who filed overtime
 */
async function notifyOvertimeStatusChanged({ companyId, senderUserId, overtimeRecord, status, req }) {
    try {
        const emp = await getEmployeeWithManager(overtimeRecord.employeeId);
        if (!emp || !emp.user) return;

        const dateStr = overtimeRecord.overtimeDate ? new Date(overtimeRecord.overtimeDate).toISOString().split('T')[0] : '';
        const hours = Number(overtimeRecord.hours || 0);

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';
        const portalUrl = `${getDynamicFrontendUrl(req)}/overtime`;

        const isApproved = status === 'APPROVED';
        const title = isApproved ? '✅ Overtime Claim Approved' : '❌ Overtime Claim Rejected';
        const message = isApproved
            ? `Your overtime claim for ${hours} hr(s) on ${dateStr} has been APPROVED.`
            : `Your overtime claim for ${hours} hr(s) on ${dateStr} has been REJECTED.`;

        const recipients = [emp.user];
        if (emp.reportingManager?.user) {
            recipients.push(emp.reportingManager.user);
        }

        await dispatchNotifications({
            recipients,
            senderUserId,
            type: 'OVERTIME',
            title,
            message,
            actionUrl: portalUrl,
            companyName
        });
    } catch (err) {
        console.error('[workArrangementNotifier] Error in notifyOvertimeStatusChanged:', err);
    }
}

/**
 * 7. NOTIFY ON DIRECT SHIFT SCHEDULE ASSIGNED / CHANGED BY HR
 * Sent to: The Employee who received the new shift
 */
async function notifyShiftScheduleAssigned({ companyId, senderUserId, employeeId, shiftPolicy, startDate, endDate, req }) {
    try {
        const emp = await getEmployeeWithManager(employeeId);
        if (!emp || !emp.user) return;

        const startStr = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
        const endStr = endDate ? new Date(endDate).toISOString().split('T')[0] : '';
        const shiftName = shiftPolicy?.name || 'New Shift';
        const shiftTimes = shiftPolicy?.startTime && shiftPolicy?.endTime ? ` (${shiftPolicy.startTime} - ${shiftPolicy.endTime})` : '';

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true }
        });
        const companyName = company?.name || 'HGS-HRMS';
        const portalUrl = `${getDynamicFrontendUrl(req)}/schedule-timing`;

        const title = '📅 Shift Schedule Assigned';
        const message = `Your work shift has been set to "${shiftName}"${shiftTimes} effective from ${startStr}${endStr ? ` to ${endStr}` : ' (ongoing)'}.`;

        await dispatchNotifications({
            recipients: [emp.user],
            senderUserId,
            type: 'SHIFT_SWAP',
            title,
            message,
            actionUrl: portalUrl,
            companyName
        });
    } catch (err) {
        console.error('[workArrangementNotifier] Error in notifyShiftScheduleAssigned:', err);
    }
}

module.exports = {
    notifyWfhApplied,
    notifyWfhStatusChanged,
    notifyShiftSwapRequested,
    notifyShiftSwapStatusChanged,
    notifyOvertimeSubmitted,
    notifyOvertimeStatusChanged,
    notifyShiftScheduleAssigned
};
