import React, { useState, useEffect } from 'react';
import { all_routes } from '../../../router/all_routes';
import { Link } from 'react-router-dom';
import PredefinedDateRanges from '../../../core/common/datePicker';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import apiClient from '../../../core/utils/apiClient';

interface Job {
  id?: number;
  jobCode: string;
  title: string;
  departmentName: string;
  employmentType: string;
  experienceLevel: string;
  location: string;
  salaryRange: string;
  postedDate: string;
  status?: string;
  vacancies?: number;
  applicantsCount?: number;
  bannerUrl?: string;
  description?: string;
  requirements?: string;
  minSalary?: number;
  maxSalary?: number;
}

const JobGrid = () => {
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states for creating job
  const [newTitle, setNewTitle] = useState('');
  const [newJobCode, setNewJobCode] = useState('');
  const [newLocation, setNewLocation] = useState('Onsite');
  const [newVacancies, setNewVacancies] = useState('1');
  const [newMinSalary, setNewMinSalary] = useState('');
  const [newMaxSalary, setNewMaxSalary] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState('');
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [newBannerPreview, setNewBannerPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // View Job Details Modal State
  const [selectedJobDetails, setSelectedJobDetails] = useState<Job | null>(null);

  const extractSkillBadges = (text: string) => {
    if (!text) return [];
    const skillList = [
      'React', 'Node.js', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 
      'Laravel', 'Express', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SQL', 'PostgreSQL', 
      'MySQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'Git', 'REST API', 
      'GraphQL', 'Agile', 'DevOps', 'Android', 'iOS', 'Flutter', 'React Native', 
      'Figma', 'UI/UX', 'Communication', 'Leadership', 'Management', 'Sales', 'HR'
    ];
    const found: string[] = [];
    skillList.forEach(s => {
      const regex = new RegExp(`\\b${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        found.push(s);
      }
    });
    return found;
  };

  // Apply Job Modal States
  const [applyJobId, setApplyJobId] = useState<number | null>(null);
  const [applyJobTitle, setApplyJobTitle] = useState('');
  const [candidateFirstName, setCandidateFirstName] = useState('');
  const [candidateLastName, setCandidateLastName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateNotes, setCandidateNotes] = useState('');
  const [candidateResumeFile, setCandidateResumeFile] = useState<File | null>(null);
  const [applying, setApplying] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/job-postings');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped: Job[] = res.data.map((j: any) => {
          let salaryRange = 'Competitive';
          if (j.minSalary && j.maxSalary) {
            salaryRange = `₹${Number(j.minSalary).toLocaleString('en-IN')} - ₹${Number(j.maxSalary).toLocaleString('en-IN')}`;
          } else if (j.minSalary) {
            salaryRange = `₹${Number(j.minSalary).toLocaleString('en-IN')}+`;
          }

          return {
            id: j.id,
            jobCode: j.jobCode || `JOB-${j.id}`,
            title: j.title,
            departmentName: j.departmentName || 'General',
            employmentType: j.employmentType ? j.employmentType.replace('_', ' ') : 'Full Time',
            experienceLevel: j.experienceLevel || '1-3 Years',
            location: j.location || 'Onsite',
            salaryRange: salaryRange,
            postedDate: new Date(j.createdAt).toLocaleDateString('en-IN'),
            status: j.status || 'OPEN',
            vacancies: j.vacancies || 1,
            applicantsCount: j.stageCounts?.total || 0,
            bannerUrl: j.bannerUrl,
            description: j.description,
            requirements: j.requirements,
            minSalary: j.minSalary,
            maxSalary: j.maxSalary
          };
        });
        setJobsList(mapped);
      } else {
        setJobsList([]);
      }
    } catch (err) {
      console.error('Failed to fetch job postings for grid:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleNewBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewBannerFile(file);
      setNewBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter a job title');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newTitle.trim());
      if (newJobCode.trim()) formData.append('jobCode', newJobCode.trim());
      formData.append('location', newLocation);
      formData.append('vacancies', newVacancies);
      if (newMinSalary) formData.append('minSalary', newMinSalary);
      if (newMaxSalary) formData.append('maxSalary', newMaxSalary);
      formData.append('description', newDescription);
      formData.append('requirements', newRequirements);
      formData.append('status', 'OPEN');
      if (newBannerFile) {
        formData.append('banner', newBannerFile);
      }

      await apiClient.post('/job-postings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Job posted successfully!');
      
      setNewTitle('');
      setNewJobCode('');
      setNewMinSalary('');
      setNewMaxSalary('');
      setNewDescription('');
      setNewRequirements('');
      setNewBannerFile(null);
      setNewBannerPreview(null);

      const closeBtn = document.querySelector('#add_post .custom-btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();

      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  const userObj = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const userRole = userObj?.role || '';
  const canManageJobs = ['COMPANY_ADMIN', 'HR', 'MANAGER'].includes(userRole);

  const handleOpenApplyModal = (job: Job) => {
    setApplyJobId(job.id || null);
    setApplyJobTitle(job.title);

    let fName = '';
    let lName = '';
    let email = '';
    if (userObj.name) {
      const parts = userObj.name.split(' ');
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }
    if (userObj.email) {
      email = userObj.email;
    }

    setCandidateFirstName(fName);
    setCandidateLastName(lName);
    setCandidateEmail(email);
    setCandidatePhone('');
    setCandidateNotes('');
    setCandidateResumeFile(null);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyJobId) return;
    if (!candidateFirstName.trim() || !candidateLastName.trim() || !candidateEmail.trim()) {
      alert('First name, last name, and email address are required.');
      return;
    }

    setApplying(true);
    try {
      const formData = new FormData();
      formData.append('jobPostingId', String(applyJobId));
      formData.append('firstName', candidateFirstName.trim());
      formData.append('lastName', candidateLastName.trim());
      formData.append('email', candidateEmail.trim());
      if (candidatePhone) formData.append('phone', candidatePhone.trim());
      if (candidateNotes) formData.append('notes', candidateNotes);
      if (candidateResumeFile) {
        formData.append('resume', candidateResumeFile);
      }

      await apiClient.post('/applicants/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('🎉 Application submitted successfully! HR will review your application.');

      const closeBtn = document.querySelector('#apply_job_modal .custom-btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();

      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleDeleteJob = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await apiClient.delete(`/job-postings/${id}`);
      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete job');
    }
  };

  const handleShareLink = (id?: number) => {
    if (!id) return;
    const publicUrl = `${window.location.origin}/careers/job/${id}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      alert(`Public Candidate Job Share Link copied to clipboard!\n\n${publicUrl}`);
    }).catch(() => {
      prompt("Copy public job link:", publicUrl);
    });
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Jobs Grid</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Recruitment</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Jobs Grid
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link to={all_routes.joblist} className="btn btn-icon btn-sm me-1">
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={all_routes.jobgrid}
                    className="btn btn-icon btn-sm active bg-primary text-white"
                  >
                    <i className="ti ti-layout-grid" />
                  </Link>
                </div>
              </div>
              {canManageJobs && (
                <div className="mb-2">
                  <button
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#add_post"
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <i className="ti ti-circle-plus me-2" />
                    Post Job
                  </button>
                </div>
              )}
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          <div className="card mb-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="mb-0">Job Grid ({jobsList.length})</h5>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <PredefinedDateRanges />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading jobs...</span>
              </div>
            </div>
          ) : jobsList.length === 0 ? (
            <div className="text-center py-5 bg-white rounded border">
              <i className="ti ti-briefcase fs-40 text-muted mb-2 d-block"></i>
              <h5 className="text-muted">No Job Postings Found</h5>
              <p className="text-muted fs-14">Post a new job to display it here in the grid.</p>
            </div>
          ) : (
            <div className="row">
              {jobsList.map((job) => (
                <div className="col-xl-4 col-lg-6 col-md-6 mb-4" key={job.id || job.jobCode}>
                  <div className="card h-100 shadow-sm border">
                    {/* Banner Image Container */}
                    <div className="position-relative bg-light rounded-top overflow-hidden" style={{ height: '140px' }}>
                      {job.bannerUrl ? (
                        <img
                          src={job.bannerUrl.startsWith('http') ? job.bannerUrl : `${apiClient.defaults.baseURL || ''}${job.bannerUrl}`}
                          alt={job.title}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="w-100 h-100 bg-gradient-primary d-flex align-items-center justify-content-center text-white opacity-75">
                          <i className="ti ti-briefcase fs-36"></i>
                        </div>
                      )}
                      <span className={`badge position-absolute top-0 end-0 m-2 ${job.status === 'OPEN' ? 'bg-success' : 'bg-secondary'}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="badge bg-light text-dark border">{job.departmentName}</span>
                        <span className="fs-12 text-muted">{job.postedDate}</span>
                      </div>

                      <h5 className="fw-semibold text-truncate mb-1" title={job.title}>
                        <a
                          href="#view_job_modal"
                          data-bs-toggle="modal"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedJobDetails(job);
                          }}
                          className="text-dark hover-primary"
                        >
                          {job.title}
                        </a>
                      </h5>
                      <span className="text-muted fs-12 d-block mb-3">Code: {job.jobCode}</span>

                      <div className="d-flex flex-column gap-2 fs-13 mb-3">
                        <div className="d-flex align-items-center text-dark">
                          <i className="ti ti-map-pin text-primary me-2 fs-16"></i>
                          <span>{job.location}</span>
                        </div>
                        <div className="d-flex align-items-center text-dark">
                          <i className="ti ti-currency-rupee text-success me-2 fs-16"></i>
                          <span className="fw-medium">{job.salaryRange}</span>
                        </div>
                        <div className="d-flex align-items-center text-dark">
                          <i className="ti ti-users text-info me-2 fs-16"></i>
                          <span>{job.applicantsCount} Applicants ({job.vacancies} Vacancies)</span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between border-top pt-3 flex-wrap gap-1">
                        <div className="d-flex gap-1 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-purple btn-sm text-white d-flex align-items-center"
                            data-bs-toggle="modal"
                            data-bs-target="#view_job_modal"
                            onClick={() => setSelectedJobDetails(job)}
                            title="View Job Description & Required Skills"
                          >
                            <i className="ti ti-eye me-1 fs-14"></i>Details
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm d-flex align-items-center"
                            data-bs-toggle="modal"
                            data-bs-target="#apply_job_modal"
                            onClick={() => handleOpenApplyModal(job)}
                          >
                            <i className="ti ti-send me-1 fs-14"></i>Apply
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-info btn-sm d-flex align-items-center"
                            onClick={() => handleShareLink(job.id)}
                            title="Copy Share Link"
                          >
                            <i className="ti ti-share me-1 fs-14"></i>Share
                          </button>
                        </div>
                        {canManageJobs && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            <i className="ti ti-trash me-1"></i>Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post Job Modal */}
      <div className="modal fade" id="add_post">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Post Job</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleCreateJob}>
              <div className="modal-body pb-0">
                <div className="row">
                  {/* Job Banner Upload Box */}
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-semibold">Upload Job Banner Image</label>
                    <div className="d-flex align-items-center flex-wrap gap-3 bg-light w-100 rounded p-3">
                      <div className="border rounded bg-white overflow-hidden d-flex align-items-center justify-content-center" style={{ width: '140px', height: '80px' }}>
                        {newBannerPreview ? (
                          <img src={newBannerPreview} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span className="text-muted fs-12 text-center p-1"><i className="ti ti-photo fs-20 d-block mb-1"></i>No Banner</span>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control form-control-sm"
                          onChange={handleNewBannerChange}
                        />
                        <span className="fs-12 text-muted mt-1 d-block">Recommended size: 1200x400 px (PNG, JPG, WebP)</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Job Title <span className="text-danger"> *</span>
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={newTitle} 
                        onChange={(e) => setNewTitle(e.target.value)} 
                        required 
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Job Description <span className="text-danger"> *</span>
                      </label>
                      <textarea
                        rows={3}
                        className="form-control"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Enter detailed job roles & responsibilities..."
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-purple">
                        <i className="ti ti-subtask me-1" /> Required Skills & Qualifications
                      </label>
                      <textarea
                        rows={2}
                        className="form-control"
                        value={newRequirements}
                        onChange={(e) => setNewRequirements(e.target.value)}
                        placeholder="e.g. React, Node.js, TypeScript, PostgreSQL, 3+ years experience, Strong REST API knowledge"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Vacancies <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={newVacancies}
                        onChange={(e) => setNewVacancies(e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Location <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="e.g. Mumbai / Remote / Hybrid"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Min. Salary (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={newMinSalary}
                        onChange={(e) => setNewMinSalary(e.target.value)}
                        placeholder="e.g. 500000"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Max. Salary (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={newMaxSalary}
                        onChange={(e) => setNewMaxSalary(e.target.value)}
                        placeholder="e.g. 1200000"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Candidate Apply Job Modal */}
      <div className="modal fade" id="apply_job_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Apply for Job</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleApplySubmit}>
              <div className="modal-body pb-0">
                <div className="alert alert-primary py-2 mb-3 fs-13">
                  Applying for: <strong>{applyJobTitle}</strong>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">First Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={candidateFirstName}
                      onChange={(e) => setCandidateFirstName(e.target.value)}
                      required
                      placeholder="e.g. Amit"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={candidateLastName}
                      onChange={(e) => setCandidateLastName(e.target.value)}
                      required
                      placeholder="e.g. Sharma"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email Address <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      required
                      placeholder="e.g. amit@example.com"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={candidatePhone}
                      onChange={(e) => setCandidatePhone(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Upload Resume (PDF/Word)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="form-control"
                      onChange={(e) => e.target.files && setCandidateResumeFile(e.target.files[0])}
                    />
                    <span className="fs-12 text-muted mt-1 d-block">Supported formats: PDF, DOC, DOCX (Max 10MB)</span>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Cover Note / Experience Summary</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      value={candidateNotes}
                      onChange={(e) => setCandidateNotes(e.target.value)}
                      placeholder="Briefly describe your experience and skills..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={applying}
                >
                  {applying ? 'Submitting Application...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* VIEW JOB DETAILS & REQUIRED SKILLS MODAL */}
      <div className="modal fade" id="view_job_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-gradient-primary text-white">
              <h5 className="modal-title text-white d-flex align-items-center">
                <i className="ti ti-briefcase fs-20 me-2" />
                {selectedJobDetails?.title || 'Job Description & Requirements'}
              </h5>
              <button type="button" className="btn-close custom-btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body p-4">
              {selectedJobDetails ? (
                <div>
                  {/* Job Banner Preview */}
                  {selectedJobDetails.bannerUrl && (
                    <div className="rounded overflow-hidden mb-3 border shadow-sm" style={{ maxHeight: '200px' }}>
                      <img
                        src={selectedJobDetails.bannerUrl.startsWith('http') ? selectedJobDetails.bannerUrl : `${apiClient.defaults.baseURL || ''}${selectedJobDetails.bannerUrl}`}
                        alt={selectedJobDetails.title}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Header Meta Box */}
                  <div className="card bg-light border p-3 mb-3 rounded-3">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div>
                        <span className="badge bg-primary me-2">{selectedJobDetails.jobCode}</span>
                        <span className="badge bg-light text-dark border me-2">{selectedJobDetails.departmentName}</span>
                        <span className={`badge ${selectedJobDetails.status === 'OPEN' ? 'bg-success' : 'bg-secondary'}`}>
                          {selectedJobDetails.status || 'OPEN'}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="fw-bold text-success fs-15 d-block">{selectedJobDetails.salaryRange}</span>
                        <span className="fs-12 text-muted">Location: <strong>{selectedJobDetails.location}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Role Specifications Grid */}
                  <div className="row g-2 mb-3 fs-13">
                    <div className="col-md-3 col-6">
                      <div className="p-2 border rounded bg-white">
                        <span className="text-muted d-block fs-11">Vacancies</span>
                        <strong className="text-dark">{selectedJobDetails.vacancies || 1} Openings</strong>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-2 border rounded bg-white">
                        <span className="text-muted d-block fs-11">Total Applicants</span>
                        <strong className="text-info">{selectedJobDetails.applicantsCount || 0} Candidates</strong>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-2 border rounded bg-white">
                        <span className="text-muted d-block fs-11">Employment Type</span>
                        <strong className="text-dark">{selectedJobDetails.employmentType}</strong>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-2 border rounded bg-white">
                        <span className="text-muted d-block fs-11">Posted Date</span>
                        <strong className="text-dark">{selectedJobDetails.postedDate}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="bg-white p-3 rounded border mb-3">
                    <h6 className="fw-bold text-dark mb-2">
                      <i className="ti ti-file-text me-1 text-primary" /> Job Description & Roles:
                    </h6>
                    <p className="fs-13 text-secondary mb-0 style-description" style={{ whiteSpace: 'pre-line' }}>
                      {selectedJobDetails.description || 'No detailed description specified for this job posting.'}
                    </p>
                  </div>

                  {/* Required Skills & Qualifications */}
                  <div className="bg-white p-3 rounded border mb-3">
                    <h6 className="fw-bold text-dark mb-2">
                      <i className="ti ti-subtask me-1 text-purple" /> Required Skills & Qualifications:
                    </h6>
                    {selectedJobDetails.requirements ? (
                      <p className="fs-13 text-secondary mb-3 style-requirements" style={{ whiteSpace: 'pre-line' }}>
                        {selectedJobDetails.requirements}
                      </p>
                    ) : null}

                    {/* Detected Core Skill Tags */}
                    <div>
                      <span className="fs-12 text-muted d-block mb-1 font-semibold">Key Skill Tags:</span>
                      <div className="d-flex flex-wrap gap-1">
                        {extractSkillBadges(`${selectedJobDetails.description || ''} ${selectedJobDetails.requirements || ''} ${selectedJobDetails.title}`).length > 0 ? (
                          extractSkillBadges(`${selectedJobDetails.description || ''} ${selectedJobDetails.requirements || ''} ${selectedJobDetails.title}`).map((skill, idx) => (
                            <span key={idx} className="badge bg-purple-transparent text-purple border border-purple fs-12">
                              ✓ {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted fs-12 italic">General Skill Profile</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  Select a job posting to view details.
                </div>
              )}
            </div>
            <div className="modal-footer d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-info btn-sm"
                onClick={() => handleShareLink(selectedJobDetails?.id)}
              >
                <i className="ti ti-share me-1" /> Copy Share Link
              </button>
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobGrid;
