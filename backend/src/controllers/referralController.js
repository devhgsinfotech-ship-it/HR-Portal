// backend/src/controllers/referralController.js
const prisma = require('../config/prisma');

async function getEffectiveCompanyId(req) {
  if (req.user && req.user.companyId) return req.user.companyId;
  if (req.user && req.user.id) {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { companyId: true } });
    if (user && user.companyId) return user.companyId;
  }
  const firstCompany = await prisma.company.findFirst({ select: { id: true } });
  return firstCompany ? firstCompany.id : 1;
}

// ── GET REFERRALS ──────────────────────────────────────────────
async function getReferrals(req, res) {
  try {
    const companyId = await getEffectiveCompanyId(req);
    const where = { companyId };

    // Regular employees see their own referrals; HR/Admins see all company referrals
    if (req.user.role === 'EMPLOYEE') {
      where.referrerId = req.user.id;
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            employee: { select: { firstName: true, lastName: true } }
          }
        },
        jobPosting: {
          select: { id: true, title: true, jobCode: true, department: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = referrals.map(r => ({
      id: r.id,
      candidateName: r.candidateName,
      candidateEmail: r.candidateEmail,
      candidatePhone: r.candidatePhone || 'N/A',
      relationship: r.relationship || 'Friend / Peer',
      resumeUrl: r.resumeUrl,
      notes: r.notes || '',
      status: r.status,
      rewardAmount: r.rewardAmount || 0,
      createdAt: r.createdAt,
      referrerName: r.referrer ? (r.referrer.employee ? `${r.referrer.employee.firstName} ${r.referrer.employee.lastName || ''}`.trim() : r.referrer.name) : 'Anonymous',
      referrerEmail: r.referrer?.email || '',
      jobTitle: r.jobPosting ? r.jobPosting.title : 'General Referral',
      jobCode: r.jobPosting ? r.jobPosting.jobCode : '',
      departmentName: r.jobPosting?.department?.name || 'General'
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch referrals' });
  }
}

// ── CREATE REFERRAL ────────────────────────────────────────────
async function createReferral(req, res) {
  try {
    const companyId = await getEffectiveCompanyId(req);
    const { jobPostingId, candidateName, candidateEmail, candidatePhone, relationship, notes, rewardAmount } = req.body;

    if (!candidateName || !candidateEmail) {
      return res.status(400).json({ message: 'Candidate name and email are required' });
    }

    let resumeUrl = req.body.resumeUrl || null;
    if (req.file) {
      resumeUrl = `/uploads/documents/${req.file.filename}`;
    }

    const referral = await prisma.referral.create({
      data: {
        companyId,
        referrerId: req.user.id,
        jobPostingId: jobPostingId ? parseInt(jobPostingId, 10) : null,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim().toLowerCase(),
        candidatePhone: candidatePhone ? candidatePhone.trim() : null,
        relationship: relationship || 'Friend / Peer',
        resumeUrl,
        notes: notes || '',
        rewardAmount: rewardAmount ? parseFloat(rewardAmount) : 5000,
        status: 'PENDING'
      },
      include: {
        jobPosting: { select: { title: true, jobCode: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Referral submitted successfully!',
      referral
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ message: error.message || 'Failed to submit referral' });
  }
}

// ── UPDATE REFERRAL STATUS ─────────────────────────────────────
async function updateReferralStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, rewardAmount } = req.body;

    if (isNaN(id)) return res.status(400).json({ message: 'Invalid referral ID' });

    const updated = await prisma.referral.update({
      where: { id },
      data: {
        status: status || undefined,
        rewardAmount: rewardAmount !== undefined ? parseFloat(rewardAmount) : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating referral status:', error);
    res.status(500).json({ message: error.message || 'Failed to update referral status' });
  }
}

// ── DELETE REFERRAL ────────────────────────────────────────────
async function deleteReferral(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid referral ID' });

    await prisma.referral.delete({ where: { id } });
    res.json({ message: 'Referral deleted successfully' });
  } catch (error) {
    console.error('Error deleting referral:', error);
    res.status(500).json({ message: error.message || 'Failed to delete referral' });
  }
}

module.exports = {
  getReferrals,
  createReferral,
  updateReferralStatus,
  deleteReferral
};
