// backend/src/utils/seedEmailTemplates.js
const defaultPrisma = require('../config/prisma');

const DEFAULT_TEMPLATES = [
  {
    slug: 'employee-invite',
    name: 'Employee Invite Email',
    category: 'Onboarding',
    description: 'Invitation sent to new employees to set up account password and begin onboarding.',
    subject: 'You have been invited to join {{companyName}} on HGS-HRMS',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #ff5722; padding-bottom: 15px;">
        <h2 style="color: #ff5722; margin: 0;">{{companyName}}</h2>
        <span style="color: #777; font-size: 13px;">Employee Portal Access</span>
    </div>
    <h3 style="color: #333; margin-top: 15px;">Welcome, {{employeeName}}!</h3>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        You have been officially invited to join <strong>{{companyName}}</strong>'s HR portal. Please click the button below to set up your account password and complete your onboarding profile.
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ff5722; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
            Accept Invitation &amp; Set Password
        </a>
    </div>
    <p style="color: #666; font-size: 13px;">
        Or paste this link into your browser:<br/>
        <a href="{{actionUrl}}" style="color: #ff5722; word-break: break-all;">{{actionUrl}}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        This invitation link will expire in 48 hours. If you did not expect this invite, please contact your HR administrator.
    </p>
</div>`,
    tags: '{{employeeName}}, {{companyName}}, {{actionUrl}}, {{logoUrl}}',
    defaultSubject: 'You have been invited to join {{companyName}} on HGS-HRMS',
    defaultBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #ff5722; padding-bottom: 15px;">
        <h2 style="color: #ff5722; margin: 0;">{{companyName}}</h2>
        <span style="color: #777; font-size: 13px;">Employee Portal Access</span>
    </div>
    <h3 style="color: #333; margin-top: 15px;">Welcome, {{employeeName}}!</h3>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        You have been officially invited to join <strong>{{companyName}}</strong>'s HR portal. Please click the button below to set up your account password and complete your onboarding profile.
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ff5722; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
            Accept Invitation &amp; Set Password
        </a>
    </div>
    <p style="color: #666; font-size: 13px;">
        Or paste this link into your browser:<br/>
        <a href="{{actionUrl}}" style="color: #ff5722; word-break: break-all;">{{actionUrl}}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        This invitation link will expire in 48 hours. If you did not expect this invite, please contact your HR administrator.
    </p>
</div>`,
    status: 'Active'
  },
  {
    slug: 'password-reset',
    name: 'Password Reset Email',
    category: 'Authentication',
    description: 'Email containing one-time secure password recovery link for users.',
    subject: 'Reset your {{companyName}} Password',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #ff5722; padding-bottom: 15px;">
        <h2 style="color: #ff5722; margin: 0;">{{companyName}}</h2>
        <span style="color: #777; font-size: 13px;">Security &amp; Account Recovery</span>
    </div>
    <h3 style="color: #333; margin-top: 15px;">Hello, {{userName}}!</h3>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        We received a request to reset your password for your <strong>{{companyName}}</strong> account. If you did not make this request, you can safely ignore this email.
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ff5722; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
            Reset Account Password
        </a>
    </div>
    <p style="color: #666; font-size: 13px;">
        Direct link:<br/>
        <a href="{{actionUrl}}" style="color: #ff5722; word-break: break-all;">{{actionUrl}}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        This security link is valid for 1 hour only.
    </p>
</div>`,
    tags: '{{userName}}, {{companyName}}, {{actionUrl}}, {{logoUrl}}',
    defaultSubject: 'Reset your {{companyName}} Password',
    defaultBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #ff5722; padding-bottom: 15px;">
        <h2 style="color: #ff5722; margin: 0;">{{companyName}}</h2>
        <span style="color: #777; font-size: 13px;">Security &amp; Account Recovery</span>
    </div>
    <h3 style="color: #333; margin-top: 15px;">Hello, {{userName}}!</h3>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        We received a request to reset your password for your <strong>{{companyName}}</strong> account. If you did not make this request, you can safely ignore this email.
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ff5722; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
            Reset Account Password
        </a>
    </div>
    <p style="color: #666; font-size: 13px;">
        Direct link:<br/>
        <a href="{{actionUrl}}" style="color: #ff5722; word-break: break-all;">{{actionUrl}}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        This security link is valid for 1 hour only.
    </p>
</div>`,
    status: 'Active'
  },
  {
    slug: 'email-verification',
    name: 'Workspace Email Verification',
    category: 'Authentication',
    description: 'Email sent when a new company registers to verify company domain & admin email.',
    subject: 'Verify your {{companyName}} Workspace',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <h2 style="color: #333; margin-top: 0;">Welcome to {{companyName}}!</h2>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Thank you for registering. Your workspace has been created successfully. Please click the button below to verify your email address and activate your administrator account.
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ff5722; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
            Verify Email &amp; Activate Workspace
        </a>
    </div>
    <p style="color: #666; font-size: 13px;">
        Or paste this link into your browser:<br/>
        <a href="{{actionUrl}}" style="color: #ff5722; word-break: break-all;">{{actionUrl}}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        If you did not create this workspace, please ignore this email.
    </p>
</div>`,
    tags: '{{companyName}}, {{actionUrl}}',
    defaultSubject: 'Verify your {{companyName}} Workspace',
    defaultBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <h2 style="color: #333; margin-top: 0;">Welcome to {{companyName}}!</h2>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Thank you for registering. Your workspace has been created successfully. Please click the button below to verify your email address and activate your administrator account.
    </p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ff5722; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
            Verify Email &amp; Activate Workspace
        </a>
    </div>
    <p style="color: #666; font-size: 13px;">
        Or paste this link into your browser:<br/>
        <a href="{{actionUrl}}" style="color: #ff5722; word-break: break-all;">{{actionUrl}}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        If you did not create this workspace, please ignore this email.
    </p>
</div>`,
    status: 'Active'
  },
  {
    slug: 'hr-onboarding',
    name: 'HR Manager Onboarding Email',
    category: 'Onboarding',
    description: 'Email sent when a new HR Manager is added to the system with temporary credentials.',
    subject: 'Welcome to {{companyName}} - Complete Your HR Profile Setup',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <h2 style="color: #ff5722; border-bottom: 2px solid #ff5722; padding-bottom: 10px; margin-top: 0;">Welcome to {{companyName}}</h2>
    <h3 style="color: #333;">Hello, {{hrName}}!</h3>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        You have been appointed as an <strong>HR Manager</strong> for <strong>{{companyName}}</strong>. Your temporary account credentials are:
    </p>
    <div style="background-color: #fff3e0; border-left: 4px solid #ff5722; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 4px 0; color: #333;"><strong>Role:</strong> HR Manager</p>
        <p style="margin: 4px 0; color: #333;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px; font-size: 14px; color: #d84315;">{{tempPassword}}</code></p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ff5722; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
            Verify Account &amp; Set New Password
        </a>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
    <p style="color: #777; font-size: 12px; text-align: center; margin: 0;">
        After logging in, please complete your onboarding details (Contact, Documents, Bank Details).
    </p>
</div>`,
    tags: '{{hrName}}, {{companyName}}, {{actionUrl}}, {{tempPassword}}',
    defaultSubject: 'Welcome to {{companyName}} - Complete Your HR Profile Setup',
    defaultBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <h2 style="color: #ff5722; border-bottom: 2px solid #ff5722; padding-bottom: 10px; margin-top: 0;">Welcome to {{companyName}}</h2>
    <h3 style="color: #333;">Hello, {{hrName}}!</h3>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        You have been appointed as an <strong>HR Manager</strong> for <strong>{{companyName}}</strong>. Your temporary account credentials are:
    </p>
    <div style="background-color: #fff3e0; border-left: 4px solid #ff5722; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 4px 0; color: #333;"><strong>Role:</strong> HR Manager</p>
        <p style="margin: 4px 0; color: #333;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px; font-size: 14px; color: #d84315;">{{tempPassword}}</code></p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ff5722; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
            Verify Account &amp; Set New Password
        </a>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
    <p style="color: #777; font-size: 12px; text-align: center; margin: 0;">
        After logging in, please complete your onboarding details (Contact, Documents, Bank Details).
    </p>
</div>`,
    status: 'Active'
  },
  {
    slug: 'correction-request',
    name: 'Onboarding Correction Request',
    category: 'Onboarding',
    description: 'Notification sent when HR requests document or profile correction from an employee.',
    subject: 'Action Required: Update Your Profile / Documents - {{companyName}}',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
    <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-top: 0;">Action Required: Onboarding Update</h2>
    <p style="color: #333; font-size: 15px;">Dear {{employeeName}},</p>
    <p style="color: #555; font-size: 14px; line-height: 1.6;">
        During the review of your onboarding profile and documents for <strong>{{companyName}}</strong>, our HR team has requested updates:
    </p>
    <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin-top: 0; color: #9a3412;">Notes from HR:</h4>
        <p style="color: #444; font-size: 14px; margin-bottom: 0;">{{notes}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">
            Login &amp; Update Information
        </a>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        Best regards, {{companyName}} HR Team
    </p>
</div>`,
    tags: '{{employeeName}}, {{companyName}}, {{actionUrl}}, {{notes}}',
    defaultSubject: 'Action Required: Update Your Profile / Documents - {{companyName}}',
    defaultBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
    <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-top: 0;">Action Required: Onboarding Update</h2>
    <p style="color: #333; font-size: 15px;">Dear {{employeeName}},</p>
    <p style="color: #555; font-size: 14px; line-height: 1.6;">
        During the review of your onboarding profile and documents for <strong>{{companyName}}</strong>, our HR team has requested updates:
    </p>
    <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin-top: 0; color: #9a3412;">Notes from HR:</h4>
        <p style="color: #444; font-size: 14px; margin-bottom: 0;">{{notes}}</p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{actionUrl}}" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">
            Login &amp; Update Information
        </a>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        Best regards, {{companyName}} HR Team
    </p>
</div>`,
    status: 'Active'
  },
  {
    slug: 'interview-schedule',
    name: 'Job Interview Schedule',
    category: 'Recruitment',
    description: 'Email sent to job candidates containing scheduled interview date, time, and video meeting link.',
    subject: 'Interview Scheduled: {{roundTitle}} - {{jobTitle}} | {{companyName}}',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #ff5722;">
        <h2 style="color: #ff5722; margin: 0;">{{companyName}}</h2>
        <span style="color: #777; font-size: 13px;">Recruitment &amp; Talent Acquisition</span>
    </div>
    <h3 style="color: #333; margin-top: 20px;">Interview Invitation</h3>
    <p style="color: #444; font-size: 15px;">Dear <strong>{{candidateName}}</strong>,</p>
    <p style="color: #555; font-size: 14px; line-height: 1.6;">
        We are pleased to invite you for an interview for the <strong>{{jobTitle}}</strong> position at {{companyName}}. Please review your schedule details below:
    </p>
    <div style="background-color: #f8f9fa; padding: 18px; border-left: 4px solid #ff5722; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #222;">Schedule Details:</h4>
        <ul style="color: #444; line-height: 1.8; padding-left: 20px; font-size: 14px; margin-bottom: 0;">
            <li><strong>Interview Round:</strong> {{roundTitle}}</li>
            <li><strong>Date &amp; Time:</strong> {{interviewDate}}</li>
            <li><strong>Meeting Link / Venue:</strong> <a href="{{locationOrLink}}" target="_blank" style="color: #ff5722; font-weight: bold; word-break: break-all;">{{locationOrLink}}</a></li>
        </ul>
    </div>
    <div style="text-align: center; margin: 25px 0;">
        <a href="{{locationOrLink}}" target="_blank" style="background-color: #ff5722; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Join Video Meeting
        </a>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        Best regards, <strong>{{companyName}} Recruitment Team</strong>
    </p>
</div>`,
    tags: '{{candidateName}}, {{jobTitle}}, {{roundTitle}}, {{interviewDate}}, {{locationOrLink}}, {{companyName}}',
    defaultSubject: 'Interview Scheduled: {{roundTitle}} - {{jobTitle}} | {{companyName}}',
    defaultBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #ff5722;">
        <h2 style="color: #ff5722; margin: 0;">{{companyName}}</h2>
        <span style="color: #777; font-size: 13px;">Recruitment &amp; Talent Acquisition</span>
    </div>
    <h3 style="color: #333; margin-top: 20px;">Interview Invitation</h3>
    <p style="color: #444; font-size: 15px;">Dear <strong>{{candidateName}}</strong>,</p>
    <p style="color: #555; font-size: 14px; line-height: 1.6;">
        We are pleased to invite you for an interview for the <strong>{{jobTitle}}</strong> position at {{companyName}}. Please review your schedule details below:
    </p>
    <div style="background-color: #f8f9fa; padding: 18px; border-left: 4px solid #ff5722; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #222;">Schedule Details:</h4>
        <ul style="color: #444; line-height: 1.8; padding-left: 20px; font-size: 14px; margin-bottom: 0;">
            <li><strong>Interview Round:</strong> {{roundTitle}}</li>
            <li><strong>Date &amp; Time:</strong> {{interviewDate}}</li>
            <li><strong>Meeting Link / Venue:</strong> <a href="{{locationOrLink}}" target="_blank" style="color: #ff5722; font-weight: bold; word-break: break-all;">{{locationOrLink}}</a></li>
        </ul>
    </div>
    <div style="text-align: center; margin: 25px 0;">
        <a href="{{locationOrLink}}" target="_blank" style="background-color: #ff5722; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Join Video Meeting
        </a>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        Best regards, <strong>{{companyName}} Recruitment Team</strong>
    </p>
</div>`,
    status: 'Active'
  },
  {
    slug: 'offer-letter',
    name: 'Offer Letter Email',
    category: 'Recruitment',
    description: 'Formal job offer email sent to selected candidates with compensation and joining details.',
    subject: 'Job Offer Letter: {{jobTitle}} | {{companyName}}',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #28a745;">
        <h2 style="color: #28a745; margin: 0;">{{companyName}}</h2>
        <span style="color: #777; font-size: 13px;">Official Employment Offer</span>
    </div>
    <h3 style="color: #333; margin-top: 20px;">Congratulations, {{candidateName}}!</h3>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        We are thrilled to offer you the position of <strong>{{jobTitle}}</strong> at <strong>{{companyName}}</strong>!
    </p>
    <div style="background-color: #f4fdf7; padding: 18px; border-left: 4px solid #28a745; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #222;">Offer Highlights:</h4>
        <ul style="color: #444; line-height: 1.8; padding-left: 20px; font-size: 14px; margin-bottom: 0;">
            <li><strong>Designation:</strong> {{jobTitle}}</li>
            <li><strong>Annual CTC:</strong> {{annualCtc}}</li>
            <li><strong>Joining Date:</strong> {{joiningDate}}</li>
        </ul>
    </div>
    <p style="color: #555; font-size: 14px;">
        Please review the attached formal Offer Letter PDF document for complete details on compensation, benefits, and joining procedure.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        Best regards, <strong>{{companyName}} Talent Acquisition Team</strong>
    </p>
</div>`,
    tags: '{{candidateName}}, {{jobTitle}}, {{companyName}}, {{annualCtc}}, {{joiningDate}}',
    defaultSubject: 'Job Offer Letter: {{jobTitle}} | {{companyName}}',
    defaultBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #28a745;">
        <h2 style="color: #28a745; margin: 0;">{{companyName}}</h2>
        <span style="color: #777; font-size: 13px;">Official Employment Offer</span>
    </div>
    <h3 style="color: #333; margin-top: 20px;">Congratulations, {{candidateName}}!</h3>
    <p style="color: #555; font-size: 15px; line-height: 1.6;">
        We are thrilled to offer you the position of <strong>{{jobTitle}}</strong> at <strong>{{companyName}}</strong>!
    </p>
    <div style="background-color: #f4fdf7; padding: 18px; border-left: 4px solid #28a745; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #222;">Offer Highlights:</h4>
        <ul style="color: #444; line-height: 1.8; padding-left: 20px; font-size: 14px; margin-bottom: 0;">
            <li><strong>Designation:</strong> {{jobTitle}}</li>
            <li><strong>Annual CTC:</strong> {{annualCtc}}</li>
            <li><strong>Joining Date:</strong> {{joiningDate}}</li>
        </ul>
    </div>
    <p style="color: #555; font-size: 14px;">
        Please review the attached formal Offer Letter PDF document for complete details on compensation, benefits, and joining procedure.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        Best regards, <strong>{{companyName}} Talent Acquisition Team</strong>
    </p>
</div>`,
    status: 'Active'
  },
  {
    slug: 'job-application-alert',
    name: 'Job Application Received Alert',
    category: 'Recruitment',
    description: 'Internal alert sent to recruiters and HR when a candidate submits an application.',
    subject: 'New Job Application: {{candidateName}} - {{jobTitle}}',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <h2 style="color: #ff5722; margin-top: 0;">New Job Application Received</h2>
    <p style="color: #333; font-size: 15px;">
        A new candidate has submitted an application for <strong>{{jobTitle}}</strong> at {{companyName}}.
    </p>
    <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
        <h4 style="margin-top: 0; color: #444;">Candidate Details:</h4>
        <ul style="color: #555; line-height: 1.8; padding-left: 20px; font-size: 14px; margin-bottom: 0;">
            <li><strong>Full Name:</strong> {{candidateName}}</li>
            <li><strong>Email:</strong> {{candidateEmail}}</li>
            <li><strong>Phone:</strong> {{candidatePhone}}</li>
        </ul>
    </div>
    <p style="color: #555; font-size: 14px;">
        Please login to the HR Portal under <strong>Recruitment &gt; Candidates</strong> to review the applicant's resume and schedule an interview.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        Automated alert from {{companyName}} Recruitment Module
    </p>
</div>`,
    tags: '{{candidateName}}, {{candidateEmail}}, {{candidatePhone}}, {{jobTitle}}, {{companyName}}, {{notes}}',
    defaultSubject: 'New Job Application: {{candidateName}} - {{jobTitle}}',
    defaultBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
    <h2 style="color: #ff5722; margin-top: 0;">New Job Application Received</h2>
    <p style="color: #333; font-size: 15px;">
        A new candidate has submitted an application for <strong>{{jobTitle}}</strong> at {{companyName}}.
    </p>
    <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
        <h4 style="margin-top: 0; color: #444;">Candidate Details:</h4>
        <ul style="color: #555; line-height: 1.8; padding-left: 20px; font-size: 14px; margin-bottom: 0;">
            <li><strong>Full Name:</strong> {{candidateName}}</li>
            <li><strong>Email:</strong> {{candidateEmail}}</li>
            <li><strong>Phone:</strong> {{candidatePhone}}</li>
        </ul>
    </div>
    <p style="color: #555; font-size: 14px;">
        Please login to the HR Portal under <strong>Recruitment &gt; Candidates</strong> to review the applicant's resume and schedule an interview.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
        Automated alert from {{companyName}} Recruitment Module
    </p>
</div>`,
    status: 'Active'
  }
];

/**
 * Seed or update all default system email templates
 */
async function seedDefaultEmailTemplates(prismaClient = null) {
  const prisma = prismaClient || defaultPrisma;
  try {
    console.log('[SEED] Seeding Default System Email Templates...');
    let count = 0;

    for (const t of DEFAULT_TEMPLATES) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { slug: t.slug }
      });

      if (!existing) {
        await prisma.emailTemplate.create({
          data: {
            slug: t.slug,
            name: t.name,
            category: t.category,
            description: t.description || null,
            subject: t.subject,
            body: t.body,
            tags: t.tags,
            defaultSubject: t.defaultSubject,
            defaultBody: t.defaultBody,
            isCustomized: false,
            status: t.status || 'Active'
          }
        });
        count++;
      } else {
        // If template already exists but user hasn't customized it, update defaults and metadata
        await prisma.emailTemplate.update({
          where: { slug: t.slug },
          data: {
            name: t.name,
            category: t.category,
            description: t.description || existing.description,
            tags: t.tags,
            defaultSubject: t.defaultSubject,
            defaultBody: t.defaultBody,
            // If not customized, also keep subject and body in sync with standard defaults
            ...(!existing.isCustomized ? { subject: t.subject, body: t.body } : {})
          }
        });
      }
    }

    console.log(`[SEED] Default System Email Templates seeded successfully. (${DEFAULT_TEMPLATES.length} templates present)`);
    return { success: true, count: DEFAULT_TEMPLATES.length };
  } catch (error) {
    console.error('[SEED] Error seeding default email templates:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  DEFAULT_TEMPLATES,
  seedDefaultEmailTemplates
};
