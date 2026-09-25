import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../core/utils/apiClient';

interface JobDetail {
  id: number;
  jobCode: string;
  title: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  vacancies: number;
  minSalary?: number;
  maxSalary?: number;
  status: string;
  description?: string;
  requirements?: string;
  bannerUrl?: string;
  department?: { name: string };
  company?: { name: string; logoUrl?: string };
}

const PublicJobApply: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        let res;
        try {
          res = await apiClient.get(`/job-postings/public/${id}`);
        } catch {
          res = await apiClient.get(`/job-postings/${id}`);
        }
        if (res.data) {
          setJob(res.data);
        } else {
          setError('Job posting not found.');
        }
      } catch (err: any) {
        console.error('Error fetching public job details:', err);
        setError(err.response?.data?.message || 'Job posting not found or no longer active.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('First name, last name, and email are required.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('jobPostingId', String(job.id));
      formData.append('firstName', firstName.trim());
      formData.append('lastName', lastName.trim());
      formData.append('email', email.trim());
      if (phone) formData.append('phone', phone.trim());
      if (notes) formData.append('notes', notes);
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      await apiClient.post('/applicants/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (min && max) {
      return `₹${Number(min).toLocaleString('en-IN')} - ₹${Number(max).toLocaleString('en-IN')} per annum`;
    }
    if (min) {
      return `₹${Number(min).toLocaleString('en-IN')}+ per annum`;
    }
    return 'Competitive Compensation';
  };

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center p-4">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading job posting...</span>
          </div>
          <p className="text-muted fw-medium">Loading Job Details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
        <div className="card shadow-sm border-0 text-center p-5" style={{ maxWidth: '500px' }}>
          <i className="ti ti-alert-triangle text-warning fs-48 mb-3"></i>
          <h4 className="fw-bold text-dark mb-2">Job Opening Unavailable</h4>
          <p className="text-muted mb-4">{error || 'This job opening is no longer active or the link is invalid.'}</p>
          <Link to="/" className="btn btn-primary px-4">
            Return to Main Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-4 py-md-5">
      <div className="container" style={{ maxWidth: '1000px' }}>
        {/* Navigation Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold fs-20 text-primary">HR Portal</span>
            <span className="badge bg-primary-transparent text-primary">Careers</span>
          </div>
          <button
            type="button"
            className="btn btn-white btn-sm border d-flex align-items-center gap-2 shadow-sm"
            onClick={handleCopyLink}
          >
            <i className={`ti ${copied ? 'ti-check text-success' : 'ti-share text-primary'}`}></i>
            <span>{copied ? 'Link Copied!' : 'Share Job Link'}</span>
          </button>
        </div>

        {/* Banner Section */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="position-relative bg-gradient-primary" style={{ height: '220px' }}>
            {job.bannerUrl ? (
              <img
                src={job.bannerUrl.startsWith('http') ? job.bannerUrl : `${apiClient.defaults.baseURL || ''}${job.bannerUrl}`}
                alt={job.title}
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-white opacity-75">
                <i className="ti ti-briefcase fs-48"></i>
              </div>
            )}
            <span className="badge bg-success position-absolute top-0 end-0 m-3 fs-12 px-3 py-2">
              {job.status}
            </span>
          </div>

          <div className="card-body p-4 p-md-5">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div>
                <span className="badge bg-light text-dark border mb-2">{job.department?.name || 'Engineering / Product'}</span>
                <h2 className="fw-bold text-dark mb-1">{job.title}</h2>
                <span className="text-muted fs-14">Job Reference Code: {job.jobCode}</span>
              </div>
              <span className="badge bg-pink-transparent fs-14 px-3 py-2">{job.employmentType}</span>
            </div>

            {/* Quick Metrics */}
            <div className="row g-3 py-3 my-2 border-top border-bottom bg-light rounded-3">
              <div className="col-6 col-md-3">
                <div className="d-flex align-items-center">
                  <i className="ti ti-map-pin text-primary fs-24 me-2"></i>
                  <div>
                    <span className="text-muted fs-12 d-block">Location</span>
                    <strong className="text-dark fs-14">{job.location || 'Onsite'}</strong>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-4">
                <div className="d-flex align-items-center">
                  <i className="ti ti-currency-rupee text-success fs-24 me-2"></i>
                  <div>
                    <span className="text-muted fs-12 d-block">Compensation (INR)</span>
                    <strong className="text-dark fs-14">{formatSalary(job.minSalary, job.maxSalary)}</strong>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="d-flex align-items-center">
                  <i className="ti ti-users text-info fs-24 me-2"></i>
                  <div>
                    <span className="text-muted fs-12 d-block">Vacancies</span>
                    <strong className="text-dark fs-14">{job.vacancies} Openings</strong>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-2">
                <div className="d-flex align-items-center">
                  <i className="ti ti-briefcase text-warning fs-24 me-2"></i>
                  <div>
                    <span className="text-muted fs-12 d-block">Experience</span>
                    <strong className="text-dark fs-14">{job.experienceLevel || '1-3 Yrs'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="mt-4">
              <h5 className="fw-bold text-dark mb-3">Job Description & Responsibilities</h5>
              <div className="text-secondary fs-15 lh-lg whitespace-pre-line">
                {job.description || 'No detailed description provided for this opening.'}
              </div>
            </div>

            {job.requirements && (
              <div className="mt-4">
                <h5 className="fw-bold text-dark mb-3">Requirements & Qualifications</h5>
                <div className="text-secondary fs-15 lh-lg whitespace-pre-line">
                  {job.requirements}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Application Form Box */}
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
          {submitted ? (
            <div className="text-center py-5">
              <div className="avatar avatar-xxl bg-success-transparent rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                <i className="ti ti-check text-success fs-40"></i>
              </div>
              <h3 className="fw-bold text-dark mb-2">Application Submitted Successfully!</h3>
              <p className="text-muted fs-15 mb-4" style={{ maxWidth: '550px', margin: '0 auto' }}>
                Thank you for applying for <strong>{job.title}</strong>. Our talent acquisition team will review your candidate profile and reach out via email or phone.
              </p>
              <button
                type="button"
                className="btn btn-primary px-4 py-2"
                onClick={() => setSubmitted(false)}
              >
                Submit Another Application
              </button>
            </div>
          ) : (
            <div>
              <div className="border-bottom pb-3 mb-4">
                <h4 className="fw-bold text-dark mb-1">Apply for this Position</h4>
                <p className="text-muted fs-14 mb-0">Fill out your details and upload your resume to submit your application directly to HR.</p>
              </div>

              <form onSubmit={handleSubmitApplication}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark">First Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-lg fs-14"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="e.g. Rahul"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark">Last Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-lg fs-14"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="e.g. Sharma"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark">Email Address <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control form-control-lg fs-14"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="rahul.sharma@example.com"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium text-dark">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control form-control-lg fs-14"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-medium text-dark">Upload Resume / CV (PDF or DOCX)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="form-control form-control-lg fs-14"
                      onChange={(e) => e.target.files && setResumeFile(e.target.files[0])}
                    />
                    <span className="fs-12 text-muted mt-1 d-block">Supported file types: PDF, DOC, DOCX (Max 10 MB)</span>
                  </div>
                  <div className="col-md-12">
                    <label className="form-label fw-medium text-dark">Cover Letter / Pitch</label>
                    <textarea
                      rows={4}
                      className="form-control fs-14"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Introduce yourself, share relevant achievements, or why you're a fit for this role..."
                    />
                  </div>
                  <div className="col-md-12 pt-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 py-3 fw-semibold shadow-sm"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-send me-2"></i>Submit Application Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicJobApply;
