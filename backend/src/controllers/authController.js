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

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { 
                company: true,
                employee: {
                    select: { profilePhotoUrl: true }
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
                profilePhotoUrl: user.employee?.profilePhotoUrl || null,
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
        const { companyName, email, contactPerson, phone, companySize, industry, address, password } = req.body;

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

        const workspaceUrl = `http://${result.company.subdomain}.localhost:3000`;

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

module.exports = { login, register, verifyEmail };

