// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter.
 * If standard SMTP details are not in ENV, it generates an Ethereal test account.
 */
let cachedTransporter = null;

async function getTransporter() {
    // If real SMTP is configured, use it
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        const secure = process.env.SMTP_SECURE === 'true';

        console.log(`[SMTP] Connecting to ${process.env.SMTP_HOST}:${port} secure=${secure} user=${process.env.SMTP_USER}`);

        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    if (cachedTransporter) {
        return cachedTransporter;
    }

    console.log('Generating Ethereal test account for email service...');
    const testAccount = await nodemailer.createTestAccount();

    cachedTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
    return cachedTransporter;
}

/**
 * Sends a verification email containing a link with the provided token.
 * 
 * @param {string} toEmail - The recipient's email address
 * @param {string} token - The verification token
 * @param {string} companyName - The name of the registered company
 * @param {string} workspaceUrl - The generated workspace URL
 */
async function sendVerificationEmail(toEmail, token, companyName, workspaceUrl) {
    try {
        const transporter = await getTransporter();

        // Construct the verification link (assuming frontend runs on port 3000)
        // Note: For local dev with subdomains, we link to the specific workspace verification page
        const verificationLink = `${workspaceUrl}/email-verification?token=${token}`;

        const mailOptions = {
            from: `"SmartHR Support" <${process.env.SMTP_USER || 'noreply@yourhrms.com'}>`,
            to: toEmail,
            subject: 'Verify your SmartHR Workspace',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333;">Welcome to SmartHR, ${companyName}!</h2>
                    <p style="color: #555; font-size: 16px;">
                        Thank you for registering. Your workspace has been created successfully.
                        Please click the button below to verify your email address and activate your account.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #ff5722; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                            Verify Email Address
                        </a>
                    </div>
                    <p style="color: #555; font-size: 14px;">
                        Or copy and paste this link into your browser:<br/>
                        <a href="${verificationLink}" style="color: #ff5722; word-break: break-all;">${verificationLink}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        If you did not request this, please ignore this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('--------------------------------------------------');
        console.log('Email sent: %s', info.messageId);
        // This is crucial for local testing: it prints a URL where you can view the sent email!
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        console.log('--------------------------------------------------');

        return info;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

/**
 * Sends an invitation email to a new employee.
 */
async function sendEmployeeInviteEmail(toEmail, token, companyName, employeeName, workspaceUrl, logoUrl = null) {
    try {
        const transporter = await getTransporter();

        const inviteLink = `${workspaceUrl}/invite/${token}`;

        const mailOptions = {
            from: `"HGS HR Support" <${process.env.SMTP_USER || 'noreply@aaups.com'}>`,
            to: toEmail,
            subject: `You have been invited to join ${companyName} on HGS-HRMS`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    ${logoUrl ? `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${logoUrl}" alt="${companyName}" style="max-height: 60px; object-fit: contain;" />
                    </div>
                    ` : `
                    <h2 style="color: #ff5722; text-align: center; margin-bottom: 20px;">${companyName}</h2>
                    `}
                    <h3 style="color: #333;">Welcome, ${employeeName}!</h3>
                    <p style="color: #555; font-size: 16px;">
                        You have been invited to join <strong>${companyName}</strong>'s HR portal.
                        Please click the button below to set up your account password and complete your onboarding profile.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${inviteLink}" style="background-color: #ff5722; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                            Accept Invitation
                        </a>
                    </div>
                    <p style="color: #555; font-size: 14px;">
                        Or copy and paste this link into your browser:<br/>
                        <a href="${inviteLink}" style="color: #ff5722; word-break: break-all;">${inviteLink}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This link will expire in 48 hours.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('--------------------------------------------------');
        console.log('Employee Invite Email sent: %s', info.messageId, 'Send Email to: %s', toEmail);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        console.log('--------------------------------------------------');

        return info;
    } catch (error) {
        console.error('Error sending employee invite email:', error);
        throw error;
    }
}

async function sendPasswordResetEmail(toEmail, token, workspaceUrl, userName, companyName = null, logoUrl = null) {
    try {
        const transporter = await getTransporter();

        const resetLink = `${workspaceUrl}/reset-password?token=${token}`;

        const mailOptions = {
            from: `"${companyName || 'HGS-HRMS'} Support" <${process.env.SMTP_USER || 'noreply@yourhrms.com'}>`,
            to: toEmail,
            subject: `Reset your ${companyName || 'HGS-HRMS'} Password`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    ${logoUrl ? `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${logoUrl}" alt="${companyName || 'HGS-HRMS'}" style="max-height: 60px; object-fit: contain;" />
                    </div>
                    ` : `
                    <h2 style="color: #ff5722; text-align: center; margin-bottom: 20px;">${companyName || 'SmartHR'}</h2>
                    `}
                    <h3 style="color: #333;">Hello, ${userName || 'User'}!</h3>
                    <p style="color: #555; font-size: 16px;">
                        We received a request to reset your password for your <strong>${companyName || 'SmartHR'}</strong> account. If you didn't make this request, you can safely ignore this email.
                        Otherwise, click the button below to choose a new password.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #ff5722; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #555; font-size: 14px;">
                        Or copy and paste this link into your browser:<br/>
                        <a href="${resetLink}" style="color: #ff5722; word-break: break-all;">${resetLink}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This link will expire in 1 hour.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('--------------------------------------------------');
        console.log('Password Reset Email sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        console.log('--------------------------------------------------');

        return info;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

/**
 * Sends notification email to Company Admin / HR when a new candidate or employee applies for a job.
 */
async function sendJobApplicationNotificationEmail(recipients, applicant, jobPosting, companyName = 'HGS-HRMS') {
    try {
        if (!recipients || recipients.length === 0) return;
        const transporter = await getTransporter();

        const mailOptions = {
            from: `"${companyName} Recruitment" <${process.env.SMTP_USER || 'noreply@yourhrms.com'}>`,
            to: Array.isArray(recipients) ? recipients.join(', ') : recipients,
            subject: `New Job Application Received: ${applicant.firstName} ${applicant.lastName} - ${jobPosting.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #ff5722; margin-bottom: 10px;">New Job Application Received</h2>
                    <p style="color: #333; font-size: 16px;">
                        A candidate has submitted an application for <strong>${jobPosting.title}</strong> (${jobPosting.jobCode || 'N/A'}).
                    </p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #444;">Candidate Details:</h4>
                        <ul style="color: #555; line-height: 1.6; padding-left: 20px;">
                            <li><strong>Full Name:</strong> ${applicant.firstName} ${applicant.lastName}</li>
                            <li><strong>Email:</strong> ${applicant.email}</li>
                            <li><strong>Phone:</strong> ${applicant.phone || 'N/A'}</li>
                            <li><strong>Applied Date:</strong> ${new Date().toLocaleDateString('en-IN')}</li>
                            ${applicant.resumeUrl ? `<li><strong>Resume Attached:</strong> Yes (${applicant.resumeUrl})</li>` : ''}
                        </ul>
                        ${applicant.notes ? `<p style="color: #555; margin-top: 10px;"><strong>Cover Letter / Notes:</strong><br/>${applicant.notes}</p>` : ''}
                    </div>
                    <p style="color: #555; font-size: 14px;">
                        Please log in to your HR Portal under Recruitment > Candidates to review the application and candidate profile.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This is an automated notification from ${companyName} HRMS Recruitment System.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('--------------------------------------------------');
        console.log('[Recruitment Email] Application alert sent to: %s', Array.isArray(recipients) ? recipients.join(', ') : recipients);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        console.log('--------------------------------------------------');
        return info;
    } catch (error) {
        console.error('Error sending job application notification email:', error);
    }
}

/**
 * Sends interview schedule / invitation / update email to Candidate and Interviewer.
 */
async function sendInterviewScheduleEmail({ toEmail, candidateName, jobTitle, roundTitle, scheduledAt, locationOrLink, companyName = 'HGS-HRMS', isResendOrUpdate = false }) {
    try {
        if (!toEmail) return;
        const transporter = await getTransporter();

        const formattedDate = new Date(scheduledAt).toLocaleString('en-IN', {
            dateStyle: 'full',
            timeStyle: 'short'
        });

        const subject = isResendOrUpdate
            ? `[Updated] Interview Schedule: ${roundTitle || 'Interview Round'} - ${jobTitle || 'Position'} | ${companyName}`
            : `Interview Scheduled: ${roundTitle || 'Interview Round'} - ${jobTitle || 'Position'} | ${companyName}`;

        const mailOptions = {
            from: `"${companyName} Recruitment" <${process.env.SMTP_USER || 'noreply@yourhrms.com'}>`,
            to: toEmail,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #ff5722;">
                        <h2 style="color: #ff5722; margin: 0;">${companyName}</h2>
                        <span style="color: #777; font-size: 13px;">Recruitment & Applicant Tracking System</span>
                    </div>
                    <h3 style="color: #333; margin-top: 20px;">
                        ${isResendOrUpdate ? 'Interview Details Updated' : 'Interview Invitation'}
                    </h3>
                    <p style="color: #444; font-size: 15px;">
                        Dear <strong>${candidateName}</strong>,
                    </p>
                    <p style="color: #555; font-size: 15px; line-height: 1.5;">
                        ${isResendOrUpdate 
                            ? `Your interview details for the <strong>${jobTitle || 'Applied Position'}</strong> role have been updated. Please review your schedule details below:`
                            : `We are pleased to invite you for an interview for the <strong>${jobTitle || 'Applied Position'}</strong> role. Here are your schedule details:`
                        }
                    </p>
                    <div style="background-color: #f8f9fa; padding: 18px; border-left: 4px solid #ff5722; border-radius: 6px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #222;">Schedule Details:</h4>
                        <ul style="color: #444; line-height: 1.8; padding-left: 20px; font-size: 14px; margin-bottom: 0;">
                            <li><strong>Interview Round:</strong> ${roundTitle || 'Technical Interview'}</li>
                            <li><strong>Date & Time:</strong> ${formattedDate}</li>
                            <li><strong>Meeting Link / Location:</strong> <a href="${locationOrLink}" target="_blank" style="color: #ff5722; font-weight: bold; word-break: break-all;">${locationOrLink}</a></li>
                        </ul>
                    </div>
                    ${locationOrLink && locationOrLink.startsWith('http') ? `
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="${locationOrLink}" target="_blank" style="background-color: #ff5722; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 15px; display: inline-block;">
                            Join Video Meeting
                        </a>
                    </div>
                    ` : ''}
                    <p style="color: #555; font-size: 14px;">
                        Please ensure you join on time. If you need to reschedule or have any queries, please reply directly to this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        Best regards,<br/>
                        <strong>${companyName} Recruitment Team</strong>
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('--------------------------------------------------');
        console.log('[Interview Schedule Email] Sent to: %s (Message ID: %s)', toEmail, info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        console.log('--------------------------------------------------');
        return info;
    } catch (error) {
        console.error('Error sending interview schedule email:', error);
    }
}

module.exports = {
    sendVerificationEmail,
    sendEmployeeInviteEmail,
    sendPasswordResetEmail,
    sendJobApplicationNotificationEmail,
    sendInterviewScheduleEmail
};

