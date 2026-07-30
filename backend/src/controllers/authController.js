// backend/src/controllers/authController.js
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function login(req, res) {
    try {
        const { email, password, subdomain } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. If a subdomain is provided (company workspace login), validate it
        if (subdomain) {
            if (!user.company || user.company.subdomain !== subdomain) {
                return res.status(403).json({ message: 'You do not have access to this workspace' });
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
            },
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


async function register(req, res) {
    try {
        const { companyName, email, contactPerson, phone, companySize, industry, address, password, subdomain } = req.body;

        if (!companyName || !email || !password || !contactPerson) {
            return res.status(400).json({ message: 'Company name, email, contact person and password are required' });
        }

        // Generate subdomain from company name if not provided
        const rawSubdomain = subdomain || companyName;
        const generatedSubdomain = rawSubdomain
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);

        // Check if subdomain is already taken
        const existingSubdomain = await prisma.company.findUnique({ where: { subdomain: generatedSubdomain } });
        if (existingSubdomain) {
            return res.status(409).json({ message: `The workspace "${generatedSubdomain}" is already taken. Please choose another.` });
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

        console.log(`📧 Verification token for ${email}: ${verifyToken}`);

        res.status(201).json({
            message: 'Company registered successfully! Please check your email to verify your account.',
            company: {
                id: result.company.id,
                name: result.company.name,
                subdomain: result.company.subdomain,
                workspaceUrl: `https://${result.company.subdomain}.yourhrms.com`,
            },
            devToken: verifyToken, // Remove in production!
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
        res.json({ message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { login, register, verifyEmail };

