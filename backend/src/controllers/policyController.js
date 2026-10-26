// backend/src/controllers/policyController.js
const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const UPLOAD_BASE = process.env.UPLOAD_PATH
    ? path.resolve(process.env.UPLOAD_PATH)
    : path.resolve('uploads');

function getCompanyId(req) {
    return req.user?.companyId;
}

const DEFAULT_POLICIES = [
    {
        title: 'Information Security & Data Protection Policy',
        description: 'Comprehensive guidelines regarding encryption standards, password governance, customer confidentiality, and access control.',
        policyDate: new Date('2026-01-15'),
        documentUrl: 'assets/docs/information_security_policy.pdf',
        status: 'ACTIVE'
    },
    {
        title: 'Leave & Attendance Policy',
        description: 'Protocols for annual paid leave, emergency medical time-off, bereavement, core working hours, and shift swap requests.',
        policyDate: new Date('2026-02-01'),
        documentUrl: 'assets/docs/leave_attendance_policy.pdf',
        status: 'ACTIVE'
    },
    {
        title: 'Workplace Code of Conduct & Anti-Harassment',
        description: 'Zero-tolerance policy for workplace discrimination, respectful peer communication, anti-harassment standards, and escalation ethics.',
        policyDate: new Date('2026-01-01'),
        documentUrl: 'assets/docs/code_of_conduct.pdf',
        status: 'ACTIVE'
    },
    {
        title: 'Remote Work & Flexible Hours Policy',
        description: 'Guidelines on WFH eligibility, home workstation ergonomics, data security over public networks, and sprint availability.',
        policyDate: new Date('2026-03-10'),
        documentUrl: 'assets/docs/remote_work_policy.pdf',
        status: 'ACTIVE'
    }
];

async function ensureDefaultPolicies(companyId) {
    if (!companyId) return;
    try {
        const count = await prisma.companyPolicy.count({ where: { companyId } });
        if (count === 0) {
            const departments = await prisma.department.findMany({
                where: { companyId },
                take: 3
            });

            await prisma.companyPolicy.createMany({
                data: DEFAULT_POLICIES.map((p, index) => ({
                    companyId,
                    departmentId: departments[index % departments.length]?.id || null,
                    title: p.title,
                    description: p.description,
                    policyDate: p.policyDate,
                    documentUrl: p.documentUrl,
                    status: p.status
                })),
                skipDuplicates: true
            });
        }
    } catch (err) {
        console.error('Error seeding default company policies:', err);
    }
}

// Metadata for Department filter/selection
async function getPolicyMetadata(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const departments = await prisma.department.findMany({
            where: { companyId },
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });

        res.json({ departments });
    } catch (error) {
        console.error('Error fetching policy metadata:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// 1. Get All Policies
async function getPolicies(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        await ensureDefaultPolicies(companyId);

        const { departmentId, search, status } = req.query;

        const where = { companyId };
        if (departmentId && departmentId !== 'ALL') {
            where.departmentId = parseInt(departmentId);
        }
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (search && search.trim()) {
            where.OR = [
                { title: { contains: search.trim() } },
                { description: { contains: search.trim() } }
            ];
        }

        const policies = await prisma.companyPolicy.findMany({
            where,
            include: {
                department: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { policyDate: 'desc' }
        });

        res.json(policies);
    } catch (error) {
        console.error('Error fetching company policies:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// 2. Create Policy (Supports JSON & multipart/form-data PDF upload)
async function createPolicy(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const {
            title,
            description,
            departmentId,
            policyDate,
            status = 'ACTIVE'
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Policy name/title is required' });
        }

        let documentUrl = req.body.documentUrl || null;
        if (req.file) {
            documentUrl = `/uploads/policies/${req.file.filename}`;
        }

        const parsedDeptId = (departmentId && departmentId !== 'ALL' && departmentId !== 'null' && departmentId !== 'undefined')
            ? parseInt(departmentId)
            : null;

        const newPolicy = await prisma.companyPolicy.create({
            data: {
                companyId,
                departmentId: parsedDeptId,
                title: title.trim(),
                description: description ? description.trim() : null,
                policyDate: policyDate ? new Date(policyDate) : new Date(),
                documentUrl,
                status: status || 'ACTIVE'
            },
            include: {
                department: {
                    select: { id: true, name: true }
                }
            }
        });

        res.status(201).json(newPolicy);
    } catch (error) {
        console.error('Error creating company policy:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// 3. Update Policy (Supports JSON & multipart/form-data PDF upload)
async function updatePolicy(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const existing = await prisma.companyPolicy.findFirst({
            where: { id: parseInt(id), companyId }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Policy not found' });
        }

        const {
            title,
            description,
            departmentId,
            policyDate,
            status
        } = req.body;

        let documentUrl = req.body.documentUrl !== undefined ? req.body.documentUrl : existing.documentUrl;
        if (req.file) {
            documentUrl = `/uploads/policies/${req.file.filename}`;
        }

        const parsedDeptId = (departmentId !== undefined)
            ? (departmentId && departmentId !== 'ALL' && departmentId !== 'null' && departmentId !== 'undefined' ? parseInt(departmentId) : null)
            : existing.departmentId;

        const updated = await prisma.companyPolicy.update({
            where: { id: existing.id },
            data: {
                ...(title && { title: title.trim() }),
                ...(description !== undefined && { description: description ? description.trim() : null }),
                departmentId: parsedDeptId,
                ...(policyDate !== undefined && {
                    policyDate: policyDate ? new Date(policyDate) : null
                }),
                ...(documentUrl !== undefined && { documentUrl }),
                ...(status && { status })
            },
            include: {
                department: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating company policy:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// 4. Delete Policy
async function deletePolicy(req, res) {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const existing = await prisma.companyPolicy.findFirst({
            where: { id: parseInt(id), companyId }
        });
        if (!existing) {
            return res.status(404).json({ message: 'Policy not found' });
        }

        // Clean up uploaded file if on disk
        if (existing.documentUrl && existing.documentUrl.startsWith('/uploads/policies/')) {
            try {
                const filePath = path.join(UPLOAD_BASE, existing.documentUrl.replace(/^\/uploads\//, ''));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileErr) {
                console.warn('Could not remove policy file from disk:', fileErr.message);
            }
        }

        await prisma.companyPolicy.delete({
            where: { id: existing.id }
        });

        res.json({ message: 'Policy deleted successfully' });
    } catch (error) {
        console.error('Error deleting company policy:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

// 5. Download / View Policy PDF (Serves uploaded file or generates official branded PDF via PDFKit)
async function downloadPolicyPdf(req, res) {
    try {
        const companyId = getCompanyId(req);
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });
        const { id } = req.params;

        const policy = await prisma.companyPolicy.findFirst({
            where: { id: parseInt(id), companyId },
            include: {
                company: { select: { id: true, name: true, logoUrl: true } },
                department: { select: { id: true, name: true } }
            }
        });

        if (!policy) {
            return res.status(404).json({ message: 'Company Policy not found' });
        }

        const isInline = req.query.inline === 'true' || req.query.view === 'true';
        const safeTitle = (policy.title || 'company_policy')
            .replace(/[^a-zA-Z0-9_\-\s]/g, '')
            .trim()
            .replace(/\s+/g, '_');
        const filename = `${safeTitle}.pdf`;

        // 1. Check if an uploaded physical file exists on disk
        if (policy.documentUrl && policy.documentUrl.startsWith('/uploads/')) {
            const relativePath = policy.documentUrl.replace(/^\/uploads\//, '');
            const filePath = path.join(UPLOAD_BASE, relativePath);
            if (fs.existsSync(filePath)) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader(
                    'Content-Disposition',
                    `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(filename)}"`
                );
                return fs.createReadStream(filePath).pipe(res);
            }
        }

        // 2. If not on disk, generate an official branded PDF document via PDFKit
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: policy.title,
                Author: policy.company?.name || 'HR Portal Cloud',
                Subject: 'Official Corporate Policy Document'
            }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(filename)}"`
        );

        // Ensure policies directory exists for caching
        const policyDir = path.join(UPLOAD_BASE, 'policies');
        if (!fs.existsSync(policyDir)) {
            fs.mkdirSync(policyDir, { recursive: true });
        }
        const cacheFilename = `policy-${policy.id}-${Date.now()}.pdf`;
        const cachePath = path.join(policyDir, cacheFilename);
        const fileStream = fs.createWriteStream(cachePath);

        doc.pipe(res);
        doc.pipe(fileStream);

        // Decorative Header Bar
        const companyName = policy.company?.name || 'HR Portal Global Enterprise';
        doc.rect(0, 0, 595.28, 12).fill('#1b5a90');

        doc.moveDown(1);
        doc.fontSize(18).fillColor('#1b5a90').font('Helvetica-Bold').text(companyName.toUpperCase(), { align: 'center' });
        doc.fontSize(10).fillColor('#6c757d').font('Helvetica').text('CORPORATE POLICY & COMPLIANCE HANDBOOK', { align: 'center' });
        doc.moveDown(0.8);

        // Divider
        doc.strokeColor('#e2e8f0').lineWidth(1.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        // Policy Title
        doc.fontSize(16).fillColor('#1e293b').font('Helvetica-Bold').text(policy.title, { align: 'left' });
        doc.moveDown(0.5);

        // Metadata box
        const metaY = doc.y;
        doc.rect(50, metaY, 495, 65).fillAndStroke('#f8fafc', '#e2e8f0');
        
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
        doc.text('DOCUMENT REF:', 65, metaY + 12);
        doc.text('TARGET DEPARTMENT:', 65, metaY + 28);
        doc.text('EFFECTIVE DATE:', 65, metaY + 44);

        doc.font('Helvetica').fillColor('#0f172a');
        doc.text(`POL-${String(policy.id).padStart(4, '0')}-REV1`, 190, metaY + 12);
        doc.text(policy.department?.name || 'All Departments (Company-wide)', 190, metaY + 28);
        const formattedDate = policy.policyDate
            ? new Date(policy.policyDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(formattedDate, 190, metaY + 44);

        doc.font('Helvetica-Bold').fillColor('#475569');
        doc.text('CLASSIFICATION:', 340, metaY + 12);
        doc.text('STATUS:', 340, metaY + 28);
        doc.text('VERSION:', 340, metaY + 44);

        doc.font('Helvetica').fillColor('#0f172a');
        doc.text('Official Internal', 440, metaY + 12);
        doc.fillColor(policy.status === 'ACTIVE' ? '#16a34a' : '#dc2626').font('Helvetica-Bold').text(policy.status || 'ACTIVE', 440, metaY + 28);
        doc.font('Helvetica').fillColor('#0f172a').text('v1.0 (Signed)', 440, metaY + 44);

        doc.y = metaY + 80;
        doc.moveDown(0.5);

        // Section 1: Executive Summary & Objective
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1b5a90').text('1. PURPOSE & OBJECTIVE');
        doc.moveDown(0.4);
        const descriptionText = policy.description || `This official policy outlines mandatory guidelines, compliance protocols, and procedural best practices for all employees, contractors, and departments of ${companyName}.`;
        doc.fontSize(10).font('Helvetica').fillColor('#334155').text(descriptionText, { align: 'justify', lineGap: 3 });
        doc.moveDown(1);

        // Section 2: Core Provisions & Standards
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1b5a90').text('2. CORE GOVERNANCE STANDARDS');
        doc.moveDown(0.4);

        const bulletPoints = [
            'All personnel are required to review, comprehend, and adhere to the guidelines set forth within this document.',
            'Managers and team leads are responsible for ensuring operational workflows under their supervision remain in full compliance.',
            'Any deviation, exception, or ambiguity must be reported to the Human Resources department or relevant Compliance Officer immediately.',
            'Violations of this policy are subject to disciplinary action in accordance with standard company employment terms.'
        ];

        bulletPoints.forEach((bp) => {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#1b5a90').text('• ', { continued: true });
            doc.font('Helvetica').fillColor('#334155').text(bp, { align: 'justify', lineGap: 2 });
            doc.moveDown(0.2);
        });

        doc.moveDown(1);

        // Section 3: Periodic Review & Enforcement
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1b5a90').text('3. COMPLIANCE & PERIODIC AUDIT');
        doc.moveDown(0.4);
        doc.fontSize(10).font('Helvetica').fillColor('#334155').text(
            `This policy is formally reviewed on an annual basis by executive leadership and the HR compliance committee. Updates will be distributed through the HR Portal. For inquiries or guidance regarding the interpretation of this policy, contact the Human Resources Department.`,
            { align: 'justify', lineGap: 3 }
        );
        doc.moveDown(1.5);

        // Signatures block
        const signY = doc.y;
        if (signY > 660) doc.addPage();
        const currentY = doc.y;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569').text('AUTHORIZATION & APPROVAL', 50, currentY);
        doc.moveDown(0.5);

        const boxY = doc.y;
        // Sign box 1
        doc.rect(50, boxY, 235, 75).stroke('#cbd5e1');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('AUTHORIZED BY', 60, boxY + 10);
        doc.fontSize(9).font('Helvetica').fillColor('#0f172a').text('Human Resources & Compliance', 60, boxY + 30);
        doc.fontSize(8).fillColor('#94a3b8').text('Signature: [Digitally Verified]', 60, boxY + 55);

        // Sign box 2
        doc.rect(310, boxY, 235, 75).stroke('#cbd5e1');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('EXECUTIVE APPROVAL', 320, boxY + 10);
        doc.fontSize(9).font('Helvetica').fillColor('#0f172a').text(companyName, 320, boxY + 30);
        doc.fontSize(8).fillColor('#94a3b8').text(`Date: ${formattedDate}`, 320, boxY + 55);

        // Footer
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(
            `${companyName} • Confidential & Proprietary • Generated via HR Portal Cloud`,
            50,
            780,
            { align: 'center', width: 495 }
        );

        doc.end();

        // Update database with generated cache path if original was missing or static asset
        fileStream.on('finish', async () => {
            try {
                if (!policy.documentUrl || policy.documentUrl.startsWith('assets/')) {
                    await prisma.companyPolicy.update({
                        where: { id: policy.id },
                        data: { documentUrl: `/uploads/policies/${cacheFilename}` }
                    });
                }
            } catch (err) {
                console.error('Error updating cached policy URL:', err);
            }
        });

    } catch (error) {
        console.error('Error downloading company policy PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Internal server error generating PDF', error: error.message });
        }
    }
}

module.exports = {
    getPolicyMetadata,
    getPolicies,
    createPolicy,
    updatePolicy,
    deletePolicy,
    downloadPolicyPdf
};
