const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { sendJobApplicationNotificationEmail, sendInterviewScheduleEmail, sendOfferLetterEmail, sendEmployeeInviteEmail } = require('../utils/emailService');
const { extractSkillsFromText, extractExperienceYears, calculateSkillMatch } = require('../utils/aiSkillMatcher');

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



// ── GENERATE & SEND OFFER LETTER ───────────────────────────────
async function generateOfferLetter(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { annualCtc, joiningDate, basicSalary, hra, specialAllowance, notes, sendEmail = true } = req.body;

    if (isNaN(id) || !annualCtc || !joiningDate) {
      return res.status(400).json({ message: 'Applicant ID, Annual CTC, and Joining Date are required' });
    }

    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: { jobPosting: { include: { company: true } } }
    });

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    const companyName = applicant.jobPosting?.company?.name || 'HGS-HRMS';
    const candidateName = applicant.fullName || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Candidate';
    const jobTitle = applicant.jobPosting?.title || 'Position';
    const parsedCtc = parseFloat(annualCtc);
    const formattedCtc = `₹${parsedCtc.toLocaleString('en-IN')}`;

    // 1. Generate Offer Letter PDF with PDFKit
    const docDir = path.resolve('uploads', 'documents');
    if (!fs.existsSync(docDir)) {
      fs.mkdirSync(docDir, { recursive: true });
    }

    const filename = `offer-letter-${id}-${Date.now()}.pdf`;
    const fullPdfPath = path.join(docDir, filename);
    const relativePdfUrl = `/uploads/documents/${filename}`;

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(fullPdfPath);
    doc.pipe(writeStream);

    // Title / Header
    doc.fillColor('#28a745').fontSize(22).text(companyName, { align: 'center' });
    doc.fontSize(12).fillColor('#777777').text('OFFICIAL OFFER OF EMPLOYMENT', { align: 'center' }).moveDown(1.5);

    doc.fillColor('#333333').fontSize(11).text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
    doc.text(`Candidate: ${candidateName}`);
    doc.text(`Email: ${applicant.email}`).moveDown(1);

    doc.fontSize(14).fillColor('#28a745').text(`Dear ${candidateName},`, { underline: false }).moveDown(0.5);
    doc.fontSize(11).fillColor('#333333').text(
      `We are pleased to offer you the position of "${jobTitle}" at ${companyName}. Based on your performance during our selection process, we believe your experience and skills will be a valuable asset to our organization.`,
      { align: 'justify' }
    ).moveDown(1);

    // Compensation Summary Box
    doc.fontSize(12).fillColor('#28a745').text('COMPENSATION & BENEFITS BREAKDOWN:').moveDown(0.5);
    doc.fontSize(10).fillColor('#444444');
    doc.text(`• Annual CTC: ${formattedCtc} per annum`);
    if (basicSalary) doc.text(`• Basic Salary: ₹${parseFloat(basicSalary).toLocaleString('en-IN')} / year`);
    if (hra) doc.text(`• House Rent Allowance (HRA): ₹${parseFloat(hra).toLocaleString('en-IN')} / year`);
    if (specialAllowance) doc.text(`• Special Allowance: ₹${parseFloat(specialAllowance).toLocaleString('en-IN')} / year`);
    doc.text(`• Expected Joining Date: ${new Date(joiningDate).toLocaleDateString('en-IN', { dateStyle: 'full' })}`).moveDown(1);

    if (notes) {
      doc.fontSize(11).fillColor('#333333').text('Terms & Additional Notes:').moveDown(0.3);
      doc.fontSize(10).fillColor('#555555').text(notes).moveDown(1);
    }

    doc.fontSize(11).fillColor('#333333').text(
      `Please review and sign this offer letter within 5 working days. We look forward to welcoming you aboard!`,
      { align: 'justify' }
    ).moveDown(2);

    doc.text(`Authorized Signatory,`, { align: 'right' });
    doc.fontSize(12).fillColor('#28a745').text(`${companyName} Human Resources`, { align: 'right' });

    doc.end();

    // Wait for PDF file stream to finish writing
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // 2. Update Applicant Stage to OFFER
    await prisma.applicant.update({
      where: { id },
      data: {
        stage: 'OFFER',
        notes: `Offer Letter Generated (CTC: ${formattedCtc}, Joining: ${joiningDate})`
      }
    });

    // 3. Send Email Notification
    if (sendEmail && applicant.email) {
      await sendOfferLetterEmail({
        toEmail: applicant.email,
        candidateName,
        jobTitle,
        annualCtc: parsedCtc,
        joiningDate,
        pdfPath: fullPdfPath,
        companyName
      });
    }

    res.json({
      success: true,
      message: `Offer letter generated and sent successfully to ${applicant.email}!`,
      offerLetterUrl: relativePdfUrl,
      applicantStage: 'OFFER'
    });
  } catch (error) {
    console.error('Error generating offer letter:', error);
    res.status(500).json({ message: error.message || 'Failed to generate offer letter' });
  }
}

// ── ONE-CLICK CONVERT HIRED CANDIDATE TO EMPLOYEE ──────────────
async function convertToEmployee(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { departmentId, designationId, employeeCode, dateOfJoining } = req.body;

    if (isNaN(id)) return res.status(400).json({ message: 'Invalid applicant ID' });

    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: { jobPosting: true }
    });

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    const companyId = applicant.companyId;

    // Check if user account already exists with candidate email
    let user = await prisma.user.findUnique({ where: { email: applicant.email } });
    if (!user) {
      // Create User Account with temporary random password
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      user = await prisma.user.create({
        data: {
          email: applicant.email,
          password: hashedPassword,
          name: applicant.fullName || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Employee',
          role: 'EMPLOYEE',
          companyId,
          accountStatus: 'ACTIVE'
        }
      });
    }

    // Auto-generate employeeCode if not provided
    let empCode = employeeCode;
    if (!empCode) {
      const empCount = await prisma.employee.count({ where: { user: { companyId } } });
      empCode = `EMP-${String(empCount + 1).padStart(3, '0')}`;
    }

    // Check if Employee profile already exists
    let employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          userId: user.id,
          employeeCode: empCode,
          firstName: applicant.firstName || 'Candidate',
          lastName: applicant.lastName || '',
          phone: applicant.phone || null,
          departmentId: departmentId ? parseInt(departmentId, 10) : (applicant.jobPosting?.departmentId || null),
          designationId: designationId ? parseInt(designationId, 10) : null,
          dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
          onboardingStatus: 'INVITED'
        }
      });
    }

    // Create Onboarding Invite Token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    await prisma.inviteToken.create({
      data: {
        employeeId: employee.id,
        userId: user.id,
        token: inviteToken,
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000) // 48 hours
      }
    });

    // Send Onboarding Email to New Employee
    const isProduction = process.env.NODE_ENV === 'production' || process.env.FRONTEND_DOMAIN === 'aaups.com';
    const baseDomain = process.env.FRONTEND_DOMAIN || (isProduction ? 'aaups.com' : 'localhost:3000');
    const protocol = baseDomain.includes('localhost') ? 'http' : 'https';

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, subdomain: true }
    });

    const companyName = company?.name || 'HGS-HRMS';
    const workspaceUrl = company?.subdomain
      ? `${protocol}://${company.subdomain}.${baseDomain}`
      : (process.env.APP_URL || `${protocol}://${baseDomain}`);

    await sendEmployeeInviteEmail(
      applicant.email,
      inviteToken,
      companyName,
      `${applicant.firstName} ${applicant.lastName || ''}`.trim(),
      workspaceUrl
    );

    // Update applicant stage to HIRED
    await prisma.applicant.update({
      where: { id },
      data: { stage: 'HIRED' }
    });

    res.json({
      success: true,
      message: `Candidate converted to Employee (${empCode}) successfully! Onboarding invitation sent.`,
      employeeId: employee.id,
      employeeCode: empCode
    });
  } catch (error) {
    console.error('Error converting candidate to employee:', error);
    res.status(500).json({ message: error.message || 'Failed to convert candidate to employee' });
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
  generateOfferLetter,
  convertToEmployee,

  deleteApplicant
};


