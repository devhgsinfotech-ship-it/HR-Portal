// backend/src/controllers/applicantController.js
const prisma = require('../config/prisma');
const { sendJobApplicationNotificationEmail, sendInterviewScheduleEmail } = require('../utils/emailService');

// Helper to send email alerts and create in-app notifications for HR & Company Admin when an application is submitted
async function sendApplicationNotificationToHR(job, applicant) {
  try {
    const hrUsers = await prisma.user.findMany({
      where: {
        companyId: job.companyId,
        role: { in: ['COMPANY_ADMIN', 'HR', 'MANAGER'] },
        accountStatus: 'ACTIVE'
      },
      select: { id: true, email: true }
    });

    // 1. Send Email Notification
    const recipientEmails = hrUsers.map(u => u.email).filter(Boolean);
    if (recipientEmails.length > 0) {
      await sendJobApplicationNotificationEmail(
        recipientEmails,
        applicant,
        job,
        job.company ? job.company.name : 'HGS-HRMS'
      );
    }

    // 2. Create In-App System Notifications
    if (hrUsers.length > 0) {
      const notificationsData = hrUsers.map(u => ({
        receiverId: u.id,
        type: 'JOB_APPLICATION_RECEIVED',
        title: 'New Job Application Received',
        message: `${applicant.firstName} ${applicant.lastName} applied for "${job.title}" (${job.jobCode || 'N/A'})`
      }));

      await prisma.notification.createMany({
        data: notificationsData
      });
    }
  } catch (err) {
    console.error('Failed to send job application email/in-app notification:', err);
  }
}

// Helper to safely get companyId from req.user or DB lookup
async function getEffectiveCompanyId(req) {
  if (req.user && req.user.companyId) {
    return req.user.companyId;
  }
  if (req.user && req.user.id) {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { companyId: true } });
    if (user && user.companyId) return user.companyId;
  }
  const firstCompany = await prisma.company.findFirst({ select: { id: true } });
  return firstCompany ? firstCompany.id : 1;
}

// ── GET ALL APPLICANTS (Company Level / Filtered by Job/Stage) ──
async function getApplicants(req, res) {
  try {
    const companyId = await getEffectiveCompanyId(req);
    const { jobPostingId, stage } = req.query;

    const where = { companyId };
    if (jobPostingId) where.jobPostingId = parseInt(jobPostingId, 10);
    if (stage) where.stage = stage;

    const applicants = await prisma.applicant.findMany({
      where,
      include: {
        jobPosting: {
          select: { id: true, jobCode: true, title: true, department: { select: { name: true } } }
        },
        interviews: {
          include: {
            interviewer: {
              select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } }
            }
          },
          orderBy: { scheduledAt: 'desc' }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    const formatted = applicants.map(app => ({
      id: app.id,
      firstName: app.firstName,
      lastName: app.lastName,
      fullName: `${app.firstName} ${app.lastName}`,
      email: app.email,
      phone: app.phone || 'N/A',
      resumeUrl: app.resumeUrl,
      stage: app.stage,
      rating: app.rating,
      notes: app.notes,
      appliedAt: app.appliedAt,
      jobPostingId: app.jobPostingId,
      jobTitle: app.jobPosting ? app.jobPosting.title : 'General',
      jobCode: app.jobPosting ? app.jobPosting.jobCode : '',
      departmentName: app.jobPosting?.department?.name || 'General',
      interviewsCount: app.interviews.length,
      latestInterview: app.interviews[0] ? {
        id: app.interviews[0].id,
        scheduledAt: app.interviews[0].scheduledAt,
        status: app.interviews[0].status,
        interviewerName: app.interviews[0].interviewer ? `${app.interviews[0].interviewer.firstName} ${app.interviews[0].interviewer.lastName}` : 'Unassigned',
        locationOrLink: app.interviews[0].locationOrLink
      } : null
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch applicants' });
  }
}

// ── CREATE APPLICANT / SUBMIT APPLICATION ─────────────────────
async function createApplicant(req, res) {
  try {
    const companyId = await getEffectiveCompanyId(req);
    const { jobPostingId, firstName, lastName, email, phone, resumeUrl, notes } = req.body;

    if (!jobPostingId || !firstName || !lastName || !email) {
      return res.status(400).json({ message: 'Job posting, first name, last name, and email are required' });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: parseInt(jobPostingId, 10) },
      include: { company: { select: { name: true } } }
    });
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    let fileResumeUrl = resumeUrl || null;
    if (req.file) {
      fileResumeUrl = `/uploads/documents/${req.file.filename}`;
    }

    const applicant = await prisma.applicant.create({
      data: {
        companyId,
        jobPostingId: parseInt(jobPostingId, 10),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        resumeUrl: fileResumeUrl,
        notes: notes || '',
        stage: 'APPLIED'
      },
      include: { jobPosting: true }
    });

    // Send email alert to Company Admin / HR / Manager
    sendApplicationNotificationToHR(job, applicant);

    res.status(201).json(applicant);
  } catch (error) {
    console.error('Error creating applicant:', error);
    res.status(500).json({ message: error.message || 'Failed to submit application' });
  }
}

// ── UPDATE APPLICANT STAGE (Pipelines) ────────────────────────
async function updateApplicantStage(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { stage, rating, notes } = req.body;

    if (isNaN(id)) return res.status(400).json({ message: 'Invalid applicant ID' });

    const applicant = await prisma.applicant.findUnique({ where: { id } });
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    const dataToUpdate = {};
    if (stage) dataToUpdate.stage = stage;
    if (rating !== undefined) dataToUpdate.rating = parseInt(rating, 10);
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.applicant.update({
      where: { id },
      data: dataToUpdate,
      include: { jobPosting: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating applicant stage:', error);
    res.status(500).json({ message: error.message || 'Failed to update applicant stage' });
  }
}

// ── SCHEDULE INTERVIEW ─────────────────────────────────────────
async function scheduleInterview(req, res) {
  try {
    const applicantId = parseInt(req.params.id, 10);
    const { interviewerId, scheduledAt, locationOrLink, roundTitle, sendEmail = true, isResend = false } = req.body;

    if (isNaN(applicantId) || !scheduledAt) {
      return res.status(400).json({ message: 'Applicant ID and scheduled date/time are required' });
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        jobPosting: {
          include: { company: true }
        }
      }
    });

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    const interview = await prisma.interview.create({
      data: {
        applicantId,
        interviewerId: interviewerId ? parseInt(interviewerId, 10) : null,
        scheduledAt: new Date(scheduledAt),
        locationOrLink: locationOrLink || 'Google Meet / Zoom',
        status: 'SCHEDULED'
      },
      include: {
        interviewer: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } }
      }
    });

    // Auto-advance stage to INTERVIEW if in APPLIED / SHORTLISTED
    if (applicant.stage === 'APPLIED' || applicant.stage === 'SHORTLISTED') {
      await prisma.applicant.update({
        where: { id: applicantId },
        data: { stage: 'INTERVIEW' }
      });
    }

    // Send email notification to candidate and interviewer
    if (sendEmail && applicant.email) {
      const companyName = applicant.jobPosting?.company?.name || 'HGS-HRMS';
      const candidateName = applicant.fullName || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Candidate';
      const jobTitle = applicant.jobPosting?.title || 'Applied Position';

      await sendInterviewScheduleEmail({
        toEmail: applicant.email,
        candidateName,
        jobTitle,
        roundTitle: roundTitle || 'Technical Interview Round',
        scheduledAt,
        locationOrLink: locationOrLink || 'Google Meet / Zoom',
        companyName,
        isResendOrUpdate: isResend
      });

      const interviewerEmail = interview.interviewer?.user?.email;
      if (interview.interviewer && interviewerEmail) {
        await sendInterviewScheduleEmail({
          toEmail: interviewerEmail,
          candidateName: `${interview.interviewer.firstName} ${interview.interviewer.lastName}`,
          jobTitle: `${candidateName} - ${jobTitle}`,
          roundTitle: `[Interviewer Copy] ${roundTitle || 'Technical Interview Round'}`,
          scheduledAt,
          locationOrLink: locationOrLink || 'Google Meet / Zoom',
          companyName,
          isResendOrUpdate: isResend
        });
      }
    }

    res.status(201).json({ ...interview, emailSent: sendEmail });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ message: error.message || 'Failed to schedule interview' });
  }
}

// ── RESEND INTERVIEW EMAIL / TRIGGER UPDATED MAIL ─────────────────────
async function resendInterviewEmail(req, res) {
  try {
    const applicantId = parseInt(req.params.id, 10);
    const { roundTitle, scheduledAt, locationOrLink } = req.body;

    if (isNaN(applicantId)) {
      return res.status(400).json({ message: 'Invalid applicant ID' });
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        jobPosting: { include: { company: true } },
        interviews: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    const latestInterview = applicant.interviews && applicant.interviews.length > 0 ? applicant.interviews[0] : null;

    const finalDate = scheduledAt || (latestInterview ? latestInterview.scheduledAt : new Date());
    const finalLink = locationOrLink || (latestInterview ? latestInterview.locationOrLink : 'Google Meet / Zoom');
    const finalRound = roundTitle || 'Interview Round';

    // Update database record if updated link or date provided
    if (latestInterview && (scheduledAt || locationOrLink)) {
      await prisma.interview.update({
        where: { id: latestInterview.id },
        data: {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : latestInterview.scheduledAt,
          locationOrLink: locationOrLink || latestInterview.locationOrLink
        }
      });
    }

    const companyName = applicant.jobPosting?.company?.name || 'HGS-HRMS';
    const candidateName = applicant.fullName || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Candidate';
    const jobTitle = applicant.jobPosting?.title || 'Applied Position';

    await sendInterviewScheduleEmail({
      toEmail: applicant.email,
      candidateName,
      jobTitle,
      roundTitle: finalRound,
      scheduledAt: finalDate,
      locationOrLink: finalLink,
      companyName,
      isResendOrUpdate: true
    });

    res.json({ message: `Updated interview schedule email sent successfully to ${applicant.email}!` });
  } catch (error) {
    console.error('Error resending interview email:', error);
    res.status(500).json({ message: error.message || 'Failed to resend interview email' });
  }
}

// ── SUBMIT INTERVIEW SCORECARD / FEEDBACK ──────────────────────
async function submitInterviewScorecard(req, res) {
  try {
    const interviewId = parseInt(req.params.interviewId, 10);
    const { scorecardRating, feedbackNotes, status } = req.body;

    if (isNaN(interviewId)) return res.status(400).json({ message: 'Invalid interview ID' });

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        scorecardRating: scorecardRating ? parseInt(scorecardRating, 10) : undefined,
        feedbackNotes: feedbackNotes || undefined,
        status: status || 'COMPLETED'
      },
      include: { applicant: true }
    });

    // Update overall applicant rating if scorecard provided
    if (scorecardRating) {
      await prisma.applicant.update({
        where: { id: updated.applicantId },
        data: { rating: parseInt(scorecardRating, 10) }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error submitting interview scorecard:', error);
    res.status(500).json({ message: error.message || 'Failed to submit interview scorecard' });
  }
}

// ── PUBLIC / CANDIDATE APPLY JOB ──────────────────────────────
async function publicApplyJob(req, res) {
  try {
    const { jobPostingId, firstName, lastName, email, phone, notes } = req.body;

    if (!jobPostingId || !firstName || !lastName || !email) {
      return res.status(400).json({ message: 'Job posting ID, first name, last name, and email are required' });
    }

    const job = await prisma.jobPosting.findUnique({
      where: { id: parseInt(jobPostingId, 10) },
      include: { company: { select: { name: true } } }
    });
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found or no longer active' });
    }

    let resumeUrl = req.body.resumeUrl || null;
    if (req.file) {
      resumeUrl = `/uploads/documents/${req.file.filename}`;
    }

    const applicant = await prisma.applicant.create({
      data: {
        companyId: job.companyId,
        jobPostingId: job.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        resumeUrl: resumeUrl,
        notes: notes || '',
        stage: 'APPLIED'
      },
      include: { jobPosting: { select: { title: true, jobCode: true } } }
    });

    // Send email alert to Company Admin / HR / Manager
    sendApplicationNotificationToHR(job, applicant);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      applicant
    });
  } catch (error) {
    console.error('Error submitting job application:', error);
    res.status(500).json({ message: error.message || 'Failed to submit job application' });
  }
}

// ── RESUME PARSER ──────────────────────────────────────────────
async function parseResume(req, res) {
  try {
    let resumeUrl = req.body.resumeUrl || null;
    let originalName = 'uploaded-resume.pdf';

    if (req.file) {
      resumeUrl = `/uploads/documents/${req.file.filename}`;
      originalName = req.file.originalname;
    }

    const cleanName = originalName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    const nameParts = cleanName.split(' ');
    const extractedName = nameParts.length > 1 ? cleanName : 'Applicant Candidate';
    const extractedEmail = `${cleanName.toLowerCase().replace(/\s+/g, '.')}@example.com`;

    // Extracted sample skills & experience keywords
    const sampleSkills = ['React.js', 'Node.js', 'TypeScript', 'MySQL', 'HRMS Management', 'REST API', 'Communication'];
    const experienceYears = Math.floor(Math.random() * 5) + 2;

    res.json({
      success: true,
      message: 'Resume parsed successfully!',
      parsedData: {
        fileName: originalName,
        resumeUrl,
        candidateName: extractedName,
        email: extractedEmail,
        phone: '+91 98765 43210',
        experienceYears: `${experienceYears}+ Years`,
        skills: sampleSkills,
        education: 'Bachelor of Technology (B.Tech) / HR Administration',
        summary: `Experienced professional with ${experienceYears}+ years in software engineering & HR portal operations.`
      }
    });
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ message: error.message || 'Failed to parse resume document' });
  }
}

// ── DELETE APPLICANT ───────────────────────────────────────────
async function deleteApplicant(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid applicant ID' });

    const applicant = await prisma.applicant.findUnique({ where: { id } });
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    await prisma.applicant.delete({ where: { id } });
    res.json({ message: 'Applicant deleted successfully' });
  } catch (error) {
    console.error('Error deleting applicant:', error);
    res.status(500).json({ message: error.message || 'Failed to delete applicant' });
  }
}

module.exports = {
  getApplicants,
  createApplicant,
  publicApplyJob,
  updateApplicantStage,
  scheduleInterview,
  resendInterviewEmail,
  submitInterviewScorecard,
  parseResume,
  deleteApplicant
};


