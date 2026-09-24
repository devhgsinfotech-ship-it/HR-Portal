// backend/src/controllers/authController.js
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../utils/emailService');
const { seedDefaultCompanyRoles } = require('../utils/seedDefaultRoles');

async function login(req, res) {
    try {
        const { email, password, subdomain } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // 1. Find user with companyRole permissions
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                company: true,
                employee: {
                    include: {
                        companyRole: {
                            include: {
                                permissions: true
                            }
                        }
                    }
                }
            },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Subdomain & Role Validation
        if (subdomain) {
            // Trying to login to a specific workspace (e.g. hgsinfotech.yourhrms.com)
            if (!user.company || user.company.subdomain !== subdomain) {
                return res.status(403).json({ message: 'You do not have access to this workspace' });
            }
        } else {
            // Trying to login to the main domain (e.g. yourhrms.com or localhost)
            // ONLY Super Admins are allowed here.
            if (user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: 'Please log in through your company\'s specific workspace URL.' });
            }
        }

        // 3. Check account status
        if (user.accountStatus !== 'ACTIVE') {
            return res.status(403).json({ message: 'Account is pending or disabled. Please verify your email.' });
        }

        // 4. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 5. Generate JWT — include companyId and subdomain in token
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                email: user.email,
                companyId: user.companyId,
                subdomain: user.company?.subdomain || null,
            },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1d' }
        );

        // Map permission matrix for easy frontend consumption
        const permissions = user.employee?.companyRole?.permissions || [];

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                subdomain: user.company?.subdomain || null,
                companyLogoUrl: user.company?.logoUrl || null,
                profilePhotoUrl: user.employee?.profilePhotoUrl || null,
                onboardingStatus: user.role === 'EMPLOYEE' ? (user.employee?.onboardingStatus || 'INVITED') : 'COMPLETED',
                companyRoleName: user.employee?.companyRole?.name || null,
                permissions: permissions
            },
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Generates a clean subdomain from a company name.
 * e.g. "HGS Infotech Pvt Ltd" → "hgsinfotech"
 * e.g. "Tech World Pvt Ltd"   → "techworld"
 */
function buildBaseSubdomain(companyName) {
    // Common business suffixes to strip (longest first to avoid partial matches)
    const suffixes = [
        'private limited', 'private lmtd', 'pvt. ltd.', 'pvt. ltd', 'pvt ltd', 'pvt lmtd',
        'pvt.', 'pvt', 'ltd.', 'ltd', 'lmtd',
        'incorporated', 'inc.', 'inc',
        'limited', 'llc', 'corp.', 'corp',
        'co. ltd', 'co.', '& co'
    ];

    let name = companyName.toLowerCase().trim();

    // Remove suffix from end of name
    for (const suffix of suffixes) {
        if (name.endsWith(suffix)) {
            name = name.slice(0, name.length - suffix.length).trim();
            break;
        }
    }

    // Remove all non-alphanumeric characters (no hyphens — pure concatenation)
    return name
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 25);
}

async function register(req, res) {
    try {
        const { companyName, email, contactPerson, phone, companySize, industry, address, password, logoUrl } = req.body;

        if (!companyName || !email || !password || !contactPerson) {
            return res.status(400).json({ message: 'Company name, email, contact person and password are required' });
        }

        // ── Block public email domains ──────────────────────────────
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!emailDomain) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
        if (publicDomains.includes(emailDomain)) {
            return res.status(400).json({ message: 'Please register with your corporate email address. Public domains are not allowed.' });
        }

        // ── Auto-generate unique subdomain ──────────────────────────────
        const base = buildBaseSubdomain(companyName);
        if (!base || base.length < 2) {
            return res.status(400).json({ message: 'Company name is too short to generate a workspace URL.' });
        }

        // Try base → base2 → base3 … until we find a free one
        let generatedSubdomain = base;
        let counter = 2;
        while (true) {
            const taken = await prisma.company.findUnique({ where: { subdomain: generatedSubdomain } });
            if (!taken) break;                           // Found a free subdomain
            if (counter > 99) {
                // Extremely unlikely; fall back to base + timestamp
                generatedSubdomain = base + Date.now().toString().slice(-4);
                break;
            }
            generatedSubdomain = `${base}${counter}`;
            counter++;
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name: companyName,
                    email,
                    emailDomain,                     // ← Store the corporate domain
                    subdomain: generatedSubdomain,   // ← Store the subdomain
                    phone: phone || null,
                    industry: industry || null,
                    companySize: companySize || null,
                    address: address || null,
                    logoUrl: logoUrl || null,
                },
            });

            const user = await tx.user.create({
                data: {
                    companyId: company.id,
                    name: contactPerson,
                    email,
                    password: hashedPassword,
                    role: 'COMPANY_ADMIN',
                    accountStatus: 'PENDING',
                },
            });

            await tx.emailVerifyToken.create({
                data: { userId: user.id, token: verifyToken, expiresAt: tokenExpiry },
            });

            await tx.companySetting.create({
                data: { companyId: company.id },
            });

            // Seed standard default company roles & permission matrix
            await seedDefaultCompanyRoles(tx, company.id);

            // Auto-provision 14-day trial Subscription on Starter Plan
            const starterPlan = await tx.subscriptionPlan.findFirst({ where: { code: 'STARTER' } });
            if (starterPlan) {
                const trialEndsAt = new Date();
                trialEndsAt.setDate(trialEndsAt.getDate() + 14);
                await tx.subscription.create({
                    data: {
                        companyId: company.id,
                        planId: starterPlan.id,
                        status: 'TRIAL',
                        billingCycle: 'MONTHLY',
                        trialEndsAt
                    }
                });
            }

            return { company, user };
        });

        // Dynamically generate the workspace URL based on the environment
        const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_DOMAIN === 'aaups.com';
        const domain = process.env.FRONTEND_DOMAIN || (isProduction ? 'aaups.com' : 'localhost:3000');
        const protocol = domain.includes('localhost') ? 'http' : 'https';
        const workspaceUrl = `${protocol}://${result.company.subdomain}.${domain}`;

        // Send real email instead of just logging token
        try {
            await emailService.sendVerificationEmail(email, verifyToken, companyName, workspaceUrl);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // We still return 201 because the user was created, but we could warn them.
        }

        res.status(201).json({
            message: 'Company registered successfully! Please check your email to verify your account.',
            company: {
                id: result.company.id,
                name: result.company.name,
                subdomain: result.company.subdomain,
                workspaceUrl: workspaceUrl,
            }
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function verifyEmail(req, res) {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Verification token is required' });
        }
        // Find the token in the database
        const verifyRecord = await prisma.emailVerifyToken.findUnique({
            where: { token },
            include: { user: { include: { company: true } } },
        });
        if (!verifyRecord) {
            return res.status(400).json({ message: 'Invalid or missing verification token' });
        }

        const company = verifyRecord.user?.company;

        if (verifyRecord.used || verifyRecord.user?.accountStatus === 'ACTIVE') {
            return res.json({
                success: true,
                alreadyVerified: true,
                message: 'Your email has already been verified! You can log in to your workspace.',
                subdomain: company?.subdomain || null,
                companyName: company?.name || null,
                logoUrl: company?.logoUrl || null,
            });
        }

        if (new Date() > verifyRecord.expiresAt) {
            return res.status(400).json({
                message: 'Verification token has expired. Please log in or request a new verification link.',
                subdomain: company?.subdomain || null,
                logoUrl: company?.logoUrl || null,
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.emailVerifyToken.update({
                where: { token },
                data: { used: true },
            });
            await tx.user.update({
                where: { id: verifyRecord.userId },
                data: { accountStatus: 'ACTIVE' },
            });
            if (verifyRecord.user?.companyId) {
                await tx.company.update({
                    where: { id: verifyRecord.user.companyId },
                    data: { isEmailVerified: true },
                });
            }
        });

        res.json({
            success: true,
            message: 'Email verified successfully! You can now log in to your workspace.',
            subdomain: company?.subdomain || null,
            companyName: company?.name || null,
            logoUrl: company?.logoUrl || null,
        });

    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({ message: 'Internal server error: ' + error.message });
    }
}

async function verifyInviteToken(req, res) {
    try {
        const rawToken = (req.query.token || req.body.token || '').trim();
        if (!rawToken) {
            return res.status(400).json({ valid: false, message: 'Token is required' });
        }

        let invite = await prisma.inviteToken.findFirst({
            where: { token: rawToken },
            include: { user: { include: { company: true } }, employee: true }
        });

        if (invite) {
            if (new Date() > invite.expiresAt) {
                return res.status(400).json({ valid: false, message: 'Invitation link has expired (valid for 48 hours). Please ask HR to resend the invitation link.' });
            }
            return res.json({
                valid: true,
                type: 'INVITE',
                employeeName: invite.employee ? `${invite.employee.firstName} ${invite.employee.lastName || ''}`.trim() : invite.user.name,
                companyName: invite.user.company?.name || 'Company',
                logoUrl: invite.user.company?.logoUrl || null,
                subdomain: invite.user.company?.subdomain || null
            });
        }

        const resetTokenRecord = await prisma.passwordResetToken.findFirst({
            where: { token: rawToken, used: false },
            include: { user: { include: { company: true } } }
        });

        if (resetTokenRecord) {
            if (new Date() > resetTokenRecord.expiresAt) {
                return res.status(400).json({ valid: false, message: 'Password reset link has expired. Please request a new link.' });
            }
            return res.json({
                valid: true,
                type: 'RESET',
                employeeName: resetTokenRecord.user.name,
                companyName: resetTokenRecord.user.company?.name || 'Company',
                logoUrl: resetTokenRecord.user.company?.logoUrl || null,
                subdomain: resetTokenRecord.user.company?.subdomain || null
            });
        }

        return res.status(400).json({
            valid: false,
            message: 'This invitation or setup link is invalid, expired, or was already used. If you have already set up your password, please log in.'
        });
    } catch (error) {
        console.error('Verify Invite Token Error:', error);
        res.status(500).json({ valid: false, message: 'Internal server error' });
    }
}

async function acceptInvite(req, res) {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        const cleanToken = token.trim();

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // 1. Check inviteToken
        let invite = await prisma.inviteToken.findFirst({
            where: { token: cleanToken },
            include: { user: true, employee: true }
        });

        let targetUserId = null;
        let targetEmployeeId = null;
        let inviteTokenIdToDelete = null;
        let resetTokenIdToMarkUsed = null;

        if (invite) {
            if (new Date() > invite.expiresAt) {
                return res.status(400).json({ message: 'Invitation link has expired. Please ask HR to resend the invite.' });
            }
            targetUserId = invite.userId || invite.employee?.userId;
            targetEmployeeId = invite.employeeId || invite.employee?.id;
            inviteTokenIdToDelete = invite.id;
        } else {
            // 2. Check passwordResetToken
            const resetRecord = await prisma.passwordResetToken.findFirst({
                where: { token: cleanToken, used: false },
                include: { user: { include: { employee: true } } }
            });

            if (resetRecord) {
                if (new Date() > resetRecord.expiresAt) {
                    return res.status(400).json({ message: 'Reset token has expired. Please request a new link.' });
                }
                targetUserId = resetRecord.userId;
                targetEmployeeId = resetRecord.user?.employee?.[0]?.id || null;
                resetTokenIdToMarkUsed = resetRecord.id;
            }
        }

        if (!targetUserId) {
            return res.status(400).json({
                message: 'This invitation or password setup link is invalid, expired, or has already been used. If you have already set up your account, please log in.'
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Primary Mandatory Step: Update User Password & set Account Status to ACTIVE
        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                password: hashedPassword,
                accountStatus: 'ACTIVE'
            }
        });

        // Secondary operations (Cleanup tokens & employee onboarding status) wrapped safely
        try {
            if (targetEmployeeId) {
                const emp = await prisma.employee.findUnique({ where: { id: targetEmployeeId } });
                if (emp && emp.onboardingStatus === 'INVITED') {
                    await prisma.employee.update({
                        where: { id: targetEmployeeId },
                        data: { onboardingStatus: 'PROFILE_SUBMITTED' }
                    }).catch(e => console.warn('Employee onboardingStatus update notice:', e.message));
                }
            }

            if (inviteTokenIdToDelete) {
                await prisma.inviteToken.delete({
                    where: { id: inviteTokenIdToDelete }
                }).catch(e => console.warn('InviteToken delete notice:', e.message));
            }

            if (resetTokenIdToMarkUsed) {
                await prisma.passwordResetToken.update({
                    where: { id: resetTokenIdToMarkUsed },
                    data: { used: true }
                }).catch(e => console.warn('PasswordResetToken update notice:', e.message));
            }
        } catch (secondaryErr) {
            console.warn('Secondary cleanup error ignored:', secondaryErr.message);
        }

        // Auto-login & Return JWT token and Onboarding redirect URL based on company subdomain
        const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_DOMAIN === 'aaups.com';
        const baseDomain = process.env.FRONTEND_DOMAIN || (isProduction ? 'aaups.com' : 'localhost:3000');
        const protocol = baseDomain.includes('localhost') ? 'http' : 'https';

        const updatedUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: { company: true, employee: true }
        });

        const jwtToken = jwt.sign(
            {
                id: updatedUser.id,
                role: updatedUser.role,
                email: updatedUser.email,
                companyId: updatedUser.companyId,
                subdomain: updatedUser.company?.subdomain || null,
            },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '7d' }
        );

        const companySubdomain = updatedUser.company?.subdomain;
        const redirectUrl = companySubdomain
            ? `${protocol}://${companySubdomain}.${baseDomain}/onboarding`
            : `${protocol}://${baseDomain}/onboarding`;

        return res.json({
            success: true,
            message: 'Account set up successfully! Redirecting to onboarding...',
            token: jwtToken,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                companyId: updatedUser.companyId,
                subdomain: companySubdomain || null,
                companyLogoUrl: updatedUser.company?.logoUrl || null,
                profilePhotoUrl: updatedUser.employee?.profilePhotoUrl || null,
                onboardingStatus: updatedUser.role === 'EMPLOYEE' ? (updatedUser.employee?.onboardingStatus || 'INVITED') : 'COMPLETED',
            },
            redirectUrl
        });
    } catch (error) {
        console.error('Accept Invite Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}

async function resendVerification(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true }
        });

        if (!user) {
            // Return success even if not found to prevent email enumeration
            return res.json({ message: 'If your email is registered, a new verification link has been sent.' });
        }

        if (user.accountStatus === 'ACTIVE') {
            return res.status(400).json({ message: 'This account is already verified. Please log in.' });
        }

        // Delete existing tokens and create a new one
        await prisma.emailVerifyToken.deleteMany({ where: { userId: user.id } });

        const crypto = require('crypto');
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.emailVerifyToken.create({
            data: { userId: user.id, token: verifyToken, expiresAt: tokenExpiry }
        });

        const isProduction = process.env.NODE_ENV === 'production';
        const domain = process.env.FRONTEND_DOMAIN || (isProduction ? 'aaups.com' : 'localhost:3000');
        const protocol = domain.includes('localhost') ? 'http' : 'https';
        const workspaceUrl = `${protocol}://${user.company.subdomain}.${domain}`;

        await emailService.sendVerificationEmail(email, verifyToken, user.company.name, workspaceUrl);

        res.json({ message: 'A new verification email has been sent. Please check your inbox.' });
    } catch (error) {
        console.error('Resend Verification Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email, subdomain } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true }
        });

        if (!user) {
            // Return success even if not found to prevent email enumeration
            return res.json({ message: 'If your email is registered, a password reset link has been sent.' });
        }

        // Subdomain & Role validation for forgot password
        if (subdomain) {
            // Trying to reset password from a specific company workspace
            if (!user.company || user.company.subdomain !== subdomain) {
                return res.status(403).json({ message: 'This account does not belong to this workspace / subdomain' });
            }
        } else {
            // Resetting from the main domain
            // ONLY Super Admins are allowed here.
            if (user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: 'Please request password reset from your company\'s specific workspace URL.' });
            }
        }

        // Generate a 32-byte hex token (64 characters)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Deactivate any previous reset tokens for this user
        await prisma.passwordResetToken.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true }
        });

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt
            }
        });

        const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_DOMAIN === 'aaups.com';
        const domain = process.env.FRONTEND_DOMAIN || (isProduction ? 'aaups.com' : 'localhost:3000');
        const protocol = domain.includes('localhost') ? 'http' : 'https';

        let workspaceUrl = '';
        const companyName = user.company ? user.company.name : 'HGS-HRMS';
        const logoUrl = user.company?.logoUrl ? (user.company.logoUrl.startsWith('http') ? user.company.logoUrl : `https://api.aaups.com${user.company.logoUrl}`) : null;

        if (user.company && user.company.subdomain) {
            workspaceUrl = `${protocol}://${user.company.subdomain}.${domain}`;
        } else {
            workspaceUrl = `${protocol}://${domain}`;
        }

        await emailService.sendPasswordResetEmail(email, resetToken, workspaceUrl, user.name, companyName, logoUrl);

        res.json({ message: 'If your email is registered, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function resetPassword(req, res) {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        const cleanToken = token.trim();

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        const resetRecord = await prisma.passwordResetToken.findFirst({
            where: { token: cleanToken, used: false },
            include: { user: { include: { company: true } } }
        });

        if (!resetRecord) {
            return res.status(400).json({ message: 'Invalid or already used password reset link. If you already reset your password, please log in.' });
        }

        if (new Date() > resetRecord.expiresAt) {
            return res.status(400).json({ message: 'Token has expired. Please request a new password reset link.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Primary step: Update user password & activate account
        await prisma.user.update({
            where: { id: resetRecord.userId },
            data: {
                password: hashedPassword,
                accountStatus: 'ACTIVE'
            }
        });

        // Secondary cleanup step
        try {
            await prisma.passwordResetToken.update({
                where: { id: resetRecord.id },
                data: { used: true }
            }).catch(e => console.warn('Mark token used notice:', e.message));

            await prisma.employee.updateMany({
                where: { userId: resetRecord.userId },
                data: { onboardingStatus: 'COMPLETED' }
            }).catch(e => console.warn('Employee status update notice:', e.message));
        } catch (secondaryErr) {
            console.warn('Secondary cleanup error in resetPassword ignored:', secondaryErr.message);
        }

        res.json({ message: 'Password has been reset successfully! You can now log in.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
}

async function getCompanyLogo(req, res) {
    try {
        const { subdomain, email, emailDomain, token } = req.query;
        let company = null;

        if (token) {
            const verifyRecord = await prisma.emailVerifyToken.findUnique({
                where: { token },
                include: { user: { include: { company: true } } }
            });
            if (verifyRecord?.user?.company) {
                company = verifyRecord.user.company;
            } else {
                const inviteRecord = await prisma.inviteToken.findFirst({
                    where: { token },
                    include: { user: { include: { company: true } } }
                });
                if (inviteRecord?.user?.company) {
                    company = inviteRecord.user.company;
                }
            }
        }

        if (!company && subdomain) {
            company = await prisma.company.findUnique({
                where: { subdomain },
                select: { logoUrl: true, name: true }
            });
        } else if (!company && email) {
            const domain = email.split('@')[1]?.toLowerCase();
            if (domain) {
                company = await prisma.company.findFirst({
                    where: { emailDomain: domain },
                    select: { logoUrl: true, name: true }
                });
            }
        } else if (!company && emailDomain) {
            company = await prisma.company.findFirst({
                where: { emailDomain: emailDomain.toLowerCase() },
                select: { logoUrl: true, name: true }
            });
        }

        if (!company) {
            return res.json({ success: false, logoUrl: null });
        }

        res.json({ success: true, logoUrl: company.logoUrl, companyName: company.name });
    } catch (err) {
        console.error('Error fetching company logo:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getCompanySettings(req, res) {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user account' });
        }
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                subdomain: true,
                emailDomain: true,
                industry: true,
                companySize: true,
                address: true,
                logoUrl: true,
                createdAt: true,
            }
        });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }
        res.json({ success: true, company });
    } catch (err) {
        console.error('Error fetching company settings:', err);
        res.status(500).json({ message: 'Failed to fetch company settings' });
    }
}

async function updateCompanySettings(req, res) {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with user account' });
        }

        if (req.user.role !== 'COMPANY_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Unauthorized: Only Company Admins can modify company settings' });
        }

        const { name, phone, email, address, industry, companySize, logoUrl } = req.body;
        
        let newLogoUrl = logoUrl;
        if (req.file) {
            newLogoUrl = `/uploads/logos/${req.file.filename}`;
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (address !== undefined) updateData.address = address;
        if (industry !== undefined) updateData.industry = industry;
        if (companySize !== undefined) updateData.companySize = companySize;
        if (newLogoUrl !== undefined) updateData.logoUrl = newLogoUrl;

        const updatedCompany = await prisma.company.update({
            where: { id: companyId },
            data: updateData,
        });

        res.json({ success: true, message: 'Company settings updated successfully', company: updatedCompany });
    } catch (err) {
        console.error('Error updating company settings:', err);
        res.status(500).json({ message: 'Failed to update company settings' });
    }
}

async function getProfile(req, res) {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: true,
                employee: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profileData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyName: user.company?.name || null,
            subdomain: user.company?.subdomain || null,
            firstName: user.employee?.firstName || user.name.split(' ')[0] || '',
            lastName: user.employee?.lastName || user.name.split(' ').slice(1).join(' ') || '',
            phone: user.employee?.phone || user.company?.phone || '',
            address: user.employee?.address || '',
            country: user.employee?.country || '',
            state: user.employee?.state || '',
            city: user.employee?.city || '',
            postalCode: user.employee?.postalCode || '',
            gender: user.employee?.gender || null,
            dateOfBirth: user.employee?.dateOfBirth ? user.employee.dateOfBirth.toISOString().split('T')[0] : null,
            profilePhotoUrl: user.employee?.profilePhotoUrl || null,
            emergencyContactName: user.employee?.emergencyContactName || '',
            emergencyContactPhone: user.employee?.emergencyContactPhone || '',
        };

        res.json({ success: true, profile: profileData });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
}

async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const {
            name, firstName, lastName, phone, address,
            country, state, city, postalCode, gender,
            dateOfBirth, emergencyContactName, emergencyContactPhone, profilePhotoUrl
        } = req.body;

        let newPhotoUrl = profilePhotoUrl;
        if (req.file) {
            newPhotoUrl = `/uploads/profiles/${req.file.filename}`;
        }

        const fullName = name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || undefined);

        if (fullName) {
            await prisma.user.update({
                where: { id: userId },
                data: { name: fullName }
            });
        }

        const employeeData = {};
        if (firstName !== undefined) employeeData.firstName = firstName;
        if (lastName !== undefined) employeeData.lastName = lastName;
        if (phone !== undefined) employeeData.phone = phone;
        if (address !== undefined) employeeData.address = address;
        if (country !== undefined) employeeData.country = country;
        if (state !== undefined) employeeData.state = state;
        if (city !== undefined) employeeData.city = city;
        if (postalCode !== undefined) employeeData.postalCode = postalCode;
        if (gender !== undefined) employeeData.gender = gender;
        if (dateOfBirth) employeeData.dateOfBirth = new Date(dateOfBirth);
        if (emergencyContactName !== undefined) employeeData.emergencyContactName = emergencyContactName;
        if (emergencyContactPhone !== undefined) employeeData.emergencyContactPhone = emergencyContactPhone;
        if (newPhotoUrl !== undefined) employeeData.profilePhotoUrl = newPhotoUrl;

        const existingEmp = await prisma.employee.findUnique({ where: { userId } });
        let updatedEmp;
        if (existingEmp) {
            updatedEmp = await prisma.employee.update({
                where: { userId },
                data: employeeData,
            });
        } else {
            const userRec = await prisma.user.findUnique({ where: { id: userId } });
            updatedEmp = await prisma.employee.create({
                data: {
                    userId,
                    employeeCode: `EMP-${Date.now().toString().slice(-5)}`,
                    firstName: firstName || userRec.name.split(' ')[0] || 'User',
                    lastName: lastName || userRec.name.split(' ').slice(1).join(' ') || '',
                    ...employeeData,
                }
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            employee: updatedEmp
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Failed to update profile' });
    }
}

module.exports = {
    login,
    register,
    verifyEmail,
    verifyInviteToken,
    acceptInvite,
    resendVerification,
    forgotPassword,
    resetPassword,
    getCompanyLogo,
    getCompanySettings,
    updateCompanySettings,
    getProfile,
    updateProfile
};
