// backend/src/utils/emailService.js
const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter.
 * If standard SMTP details are not in ENV, it generates an Ethereal test account.
 */
async function getTransporter() {
    // If real SMTP is configured, use it
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // Otherwise, generate a test Ethereal account
    console.log('No SMTP credentials found in ENV. Generating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
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
            from: '"SmartHR Support" <noreply@yourhrms.com>',
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
async function sendEmployeeInviteEmail(toEmail, token, companyName, employeeName, workspaceUrl) {
    try {
        const transporter = await getTransporter();

        const inviteLink = `${workspaceUrl}/invite/${token}`;

        const mailOptions = {
            from: '"SmartHR Support" <noreply@yourhrms.com>',
            to: toEmail,
            subject: `You have been invited to join ${companyName} on SmartHR`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333;">Welcome, ${employeeName}!</h2>
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
        console.log('Employee Invite Email sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        console.log('--------------------------------------------------');

        return info;
    } catch (error) {
        console.error('Error sending employee invite email:', error);
        throw error;
    }
}

module.exports = {
    sendVerificationEmail,
    sendEmployeeInviteEmail
};
