// backend/src/controllers/authController.js
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

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
                onboardingStatus: user.employee?.onboardingStatus || 'COMPLETED',
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
                    role: 'HR',
                    accountStatus: 'PENDING',
                },
            });

            await tx.emailVerifyToken.create({
                data: { userId: user.id, token: verifyToken, expiresAt: tokenExpiry },
            });

            await tx.companySetting.create({
                data: { companyId: company.id },
            });

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
            include: { user: true },
        });
        if (!verifyRecord) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }
        if (verifyRecord.used) {
            return res.status(400).json({ message: 'Token has already been used' });
        }
        if (new Date() > verifyRecord.expiresAt) {
            return res.status(400).json({ message: 'Verification token has expired' });
        }
        // Mark email as verified and activate the account
        await prisma.$transaction([
            prisma.emailVerifyToken.update({
                where: { token },
                data: { used: true },
            }),
            prisma.user.update({
                where: { id: verifyRecord.userId },
                data: { accountStatus: 'ACTIVE' },
            }),
            prisma.company.update({
                where: { id: verifyRecord.user.companyId },
                data: { isEmailVerified: true },
            }),
        ]);

        // Fetch the company subdomain to send back
        const company = await prisma.company.findUnique({
            where: { id: verifyRecord.user.companyId },
            select: { subdomain: true },
        });
        res.json({
            message: 'Email verified successfully! You can now log in.',
            subdomain: company?.subdomain || null,
        });

    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function acceptInvite(req, res) {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        const invite = await prisma.inviteToken.findUnique({
            where: { token },
            include: { user: true, employee: true }
        });

        if (!invite) {
            return res.status(400).json({ message: 'Invalid or expired invite token' });
        }

        if (new Date() > invite.expiresAt) {
            return res.status(400).json({ message: 'Invite token has expired' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: invite.userId },
                data: {
                    password: hashedPassword,
                    accountStatus: 'ACTIVE'
                }
            }),
            prisma.inviteToken.delete({
                where: { id: invite.id }
            })
        ]);

        res.json({ message: 'Account set up successfully! You can now login.' });
    } catch (error) {
        console.error('Accept Invite Error:', error);
        res.status(500).json({ message: 'Internal server error' });
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
        const { token, password, subdomain } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        const resetRecord = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: { include: { company: true } } }
        });

        if (!resetRecord || resetRecord.used) {
            return res.status(400).json({ message: 'Invalid or already used token' });
        }

        if (new Date() > resetRecord.expiresAt) {
            return res.status(400).json({ message: 'Token has expired' });
        }

        // Validate subdomain matches during password reset
        const user = resetRecord.user;
        if (subdomain) {
            if (!user.company || user.company.subdomain !== subdomain) {
                return res.status(403).json({ message: 'This reset token is not valid for this workspace / subdomain.' });
            }
        } else {
            if (user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ message: 'Please reset password from your company\'s specific workspace URL.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetRecord.userId },
                data: { password: hashedPassword }
            }),
            prisma.passwordResetToken.update({
                where: { id: resetRecord.id },
                data: { used: true }
            })
        ]);

        res.json({ message: 'Password has been reset successfully! You can now log in.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getCompanyLogo(req, res) {
    try {
        const { subdomain, email, emailDomain } = req.query;
        let company = null;

        if (subdomain) {
            company = await prisma.company.findUnique({
                where: { subdomain },
                select: { logoUrl: true, name: true }
            });
        } else if (email) {
            const domain = email.split('@')[1]?.toLowerCase();
            if (domain) {
                company = await prisma.company.findFirst({
                    where: { emailDomain: domain },
                    select: { logoUrl: true, name: true }
                });
            }
        } else if (emailDomain) {
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

module.exports = {
    login,
    register,
    verifyEmail,
    acceptInvite,
    resendVerification,
    forgotPassword,
    resetPassword,
    getCompanyLogo
};
