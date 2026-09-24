// backend/src/controllers/jobPostingController.js
const prisma = require('../config/prisma');

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

// ── GET JOB POSTINGS (Admin & HR View) ────────────────────────
async function getJobPostings(req, res) {
  try {
    const companyId = await getEffectiveCompanyId(req);
    const { status, departmentId } = req.query;

    const where = { companyId };
    if (status) where.status = status;
    if (departmentId) where.departmentId = parseInt(departmentId, 10);

    const jobPostings = await prisma.jobPosting.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        applicants: {
          select: { id: true, stage: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = jobPostings.map(job => {
      const stageCounts = {
        applied: job.applicants.filter(a => a.stage === 'APPLIED').length,
        shortlisted: job.applicants.filter(a => a.stage === 'SHORTLISTED').length,
        interview: job.applicants.filter(a => a.stage === 'INTERVIEW').length,
        offer: job.applicants.filter(a => a.stage === 'OFFER').length,
        hired: job.applicants.filter(a => a.stage === 'HIRED').length,
        rejected: job.applicants.filter(a => a.stage === 'REJECTED').length,
        total: job.applicants.length
      };

      return {
        id: job.id,
        jobCode: job.jobCode,
        title: job.title,
        departmentId: job.departmentId,
        departmentName: job.department ? job.department.name : 'General',
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel || '0-2 Years',
        location: job.location || 'Onsite',
        vacancies: job.vacancies,
        minSalary: job.minSalary,
        maxSalary: job.maxSalary,
        status: job.status,
        description: job.description,
        requirements: job.requirements,
        bannerUrl: job.bannerUrl,
        createdAt: job.createdAt,
        stageCounts
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching job postings:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch job postings' });
  }
}

// ── GET SINGLE JOB POSTING DETAIL ─────────────────────────────
async function getJobPostingById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid job ID' });

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        department: true,
        applicants: {
          include: {
            interviews: {
              include: { interviewer: { select: { id: true, firstName: true, lastName: true } } }
            }
          },
          orderBy: { appliedAt: 'desc' }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job posting detail:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch job posting detail' });
  }
}

// ── CREATE JOB POSTING ─────────────────────────────────────────
async function createJobPosting(req, res) {
  try {
    const companyId = await getEffectiveCompanyId(req);
    const { title, jobCode, departmentId, employmentType, experienceLevel, location, vacancies, minSalary, maxSalary, status, description, requirements } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    let code = jobCode?.trim();
    if (!code) {
      const count = await prisma.jobPosting.count({ where: { companyId } });
      code = `JOB-${String(count + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
    }

    const existing = await prisma.jobPosting.findFirst({
      where: { companyId, jobCode: code }
    });
    if (existing) {
      code = `${code}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Normalize employmentType to enum
    const validTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
    let empType = employmentType ? employmentType.toUpperCase().replace(/\s+|-/g, '_') : 'FULL_TIME';
    if (!validTypes.includes(empType)) empType = 'FULL_TIME';

    // Handle banner file upload if present
    let bannerUrl = req.body.bannerUrl || null;
    if (req.file) {
      bannerUrl = `/uploads/banners/${req.file.filename}`;
    }

    const job = await prisma.jobPosting.create({
      data: {
        companyId,
        jobCode: code,
        title: title.trim(),
        departmentId: departmentId ? parseInt(departmentId, 10) : null,
        employmentType: empType,
        experienceLevel: experienceLevel || '1-3 Years',
        location: location || 'Onsite',
        vacancies: vacancies ? parseInt(vacancies, 10) : 1,
        minSalary: minSalary ? parseFloat(minSalary) : null,
        maxSalary: maxSalary ? parseFloat(maxSalary) : null,
        status: status || 'OPEN',
        description: description || '',
        requirements: requirements || '',
        bannerUrl
      },
      include: { department: true }
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job posting:', error);
    res.status(500).json({ message: error.message || 'Failed to create job posting' });
  }
}

// ── UPDATE JOB POSTING ─────────────────────────────────────────
async function updateJobPosting(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid job ID' });

    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    const { title, departmentId, employmentType, experienceLevel, location, vacancies, minSalary, maxSalary, status, description, requirements } = req.body;

    const dataToUpdate = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (departmentId !== undefined) dataToUpdate.departmentId = departmentId ? parseInt(departmentId, 10) : null;
    if (employmentType !== undefined) {
      const validTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
      let empType = employmentType ? employmentType.toUpperCase().replace(/\s+|-/g, '_') : 'FULL_TIME';
      if (validTypes.includes(empType)) dataToUpdate.employmentType = empType;
    }
    if (experienceLevel !== undefined) dataToUpdate.experienceLevel = experienceLevel;
    if (location !== undefined) dataToUpdate.location = location;
    if (vacancies !== undefined) dataToUpdate.vacancies = parseInt(vacancies, 10);
    if (minSalary !== undefined) dataToUpdate.minSalary = minSalary ? parseFloat(minSalary) : null;
    if (maxSalary !== undefined) dataToUpdate.maxSalary = maxSalary ? parseFloat(maxSalary) : null;
    if (status !== undefined) dataToUpdate.status = status;
    if (description !== undefined) dataToUpdate.description = description;
    if (requirements !== undefined) dataToUpdate.requirements = requirements;
    if (req.file) {
      dataToUpdate.bannerUrl = `/uploads/banners/${req.file.filename}`;
    } else if (req.body.bannerUrl !== undefined) {
      dataToUpdate.bannerUrl = req.body.bannerUrl;
    }

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: dataToUpdate,
      include: { department: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating job posting:', error);
    res.status(500).json({ message: error.message || 'Failed to update job posting' });
  }
}

// ── DELETE JOB POSTING ─────────────────────────────────────────
async function deleteJobPosting(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid job ID' });

    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    await prisma.jobPosting.delete({ where: { id } });
    res.json({ message: 'Job posting deleted successfully' });
  } catch (error) {
    console.error('Error deleting job posting:', error);
    res.status(500).json({ message: error.message || 'Failed to delete job posting' });
  }
}

module.exports = {
  getJobPostings,
  getJobPostingById,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting
};
