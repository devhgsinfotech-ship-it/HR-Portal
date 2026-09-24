import React, { useState, useEffect } from 'react';
import { all_routes } from '../../../router/all_routes';
import { Link } from 'react-router-dom';
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import apiClient from '../../../core/utils/apiClient';

interface ReferralItem {
  id: number;
  refId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  relationship: string;
  resumeUrl?: string;
  notes?: string;
  status: string;
  rewardAmount: number;
  createdAt: string;
  referrerName: string;
  referrerEmail: string;
  jobTitle: string;
  jobCode: string;
}

interface JobOption {
  id: number;
  title: string;
  jobCode: string;
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  PENDING: { label: 'Pending Review', badgeClass: 'bg-warning-light text-warning border-warning' },
  REVIEWED: { label: 'In Evaluation', badgeClass: 'bg-info-light text-info border-info' },
  HIRED: { label: 'Hired & Awarded', badgeClass: 'bg-success-light text-success border-success' },
  REJECTED: { label: 'Not Pursued', badgeClass: 'bg-danger-light text-danger border-danger' }
};

const RefferalList: React.FC = () => {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedJobId, setSelectedJobId] = useState('');
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [relationship, setRelationship] = useState('Former Colleague');
  const [notes, setNotes] = useState('');
  const [rewardAmount, setRewardAmount] = useState('5000');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getUserRole = () => {
    try {
      const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      if (authUser?.role) return String(authUser.role).toUpperCase();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.role) return String(user.role).toUpperCase();
      const directRole = localStorage.getItem('userRole');
      if (directRole) return directRole.toUpperCase();
    } catch {
      // fallback
    }
    return '';
  };

  const currentRole = getUserRole();
  // HR, HR Manager, Admin, Super Admin, Manager can all manage referral status & delete records
  const canManageStatus = currentRole !== 'EMPLOYEE';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [refRes, jobRes] = await Promise.all([
        apiClient.get('/referrals'),
        apiClient.get('/job-postings')
      ]);

      if (Array.isArray(refRes.data)) {
        const mapped: ReferralItem[] = refRes.data.map((r: any) => ({
          id: r.id,
          refId: `REF-${String(r.id).padStart(3, '0')}`,
          candidateName: r.candidateName,
          candidateEmail: r.candidateEmail,
          candidatePhone: r.candidatePhone || 'N/A',
          relationship: r.relationship || 'Friend / Peer',
          resumeUrl: r.resumeUrl,
          notes: r.notes || '',
          status: r.status || 'PENDING',
          rewardAmount: r.rewardAmount || 5000,
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : 'N/A',
          referrerName: r.referrerName || 'Employee',
          referrerEmail: r.referrerEmail || '',
          jobTitle: r.jobTitle || 'General Referral',
          jobCode: r.jobCode || ''
        }));
        setReferrals(mapped);
      } else {
        setReferrals([]);
      }

      if (Array.isArray(jobRes.data)) {
        setJobs(jobRes.data.map((j: any) => ({
          id: j.id,
          title: j.title,
          jobCode: j.jobCode || `JOB-${j.id}`
        })));
      }
    } catch (err) {
      console.error('Error fetching referrals data:', err);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim() || !candEmail.trim()) {
      alert('Candidate name and email are required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedJobId) formData.append('jobPostingId', selectedJobId);
      formData.append('candidateName', candName.trim());
      formData.append('candidateEmail', candEmail.trim());
      if (candPhone) formData.append('candidatePhone', candPhone.trim());
      formData.append('relationship', relationship);
      if (notes) formData.append('notes', notes);
      if (rewardAmount) formData.append('rewardAmount', rewardAmount);
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      await apiClient.post('/referrals', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Referral submitted successfully!');

      // Reset form
      setCandName('');
      setCandEmail('');
      setCandPhone('');
      setNotes('');
      setResumeFile(null);

      // Close modal
      const closeBtn = document.querySelector('#add_referral_modal .custom-btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();

      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit referral');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await apiClient.put(`/referrals/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update referral status');
    }
  };

  const handleDeleteReferral = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this referral record?')) return;
    try {
      await apiClient.delete(`/referrals/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete referral');
    }
  };

  const columns = [
    {
      title: "Referral ID",
      dataIndex: "refId",
      render: (text: string) => <span className="fw-medium text-dark">{text}</span>,
      sorter: (a: ReferralItem, b: ReferralItem) => a.refId.localeCompare(b.refId),
    },
    {
      title: "Referrer (Employee)",
      dataIndex: "referrerName",
      render: (text: string, record: ReferralItem) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-md bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold">
            {text.charAt(0).toUpperCase()}
          </div>
          <div>
            <h6 className="fw-medium mb-0">{text}</h6>
            <span className="text-muted fs-12">{record.referrerEmail}</span>
          </div>
        </div>
      ),
      sorter: (a: ReferralItem, b: ReferralItem) => a.referrerName.localeCompare(b.referrerName),
    },
    {
      title: "Referred Candidate",
      dataIndex: "candidateName",
      render: (text: string, record: ReferralItem) => (
        <div>
          <h6 className="fw-semibold mb-0">{text}</h6>
          <span className="text-muted fs-12 d-block">{record.candidateEmail}</span>
          <span className="fs-11 badge bg-light text-secondary border mt-1">{record.relationship}</span>
        </div>
      ),
      sorter: (a: ReferralItem, b: ReferralItem) => a.candidateName.localeCompare(b.candidateName),
    },
    {
      title: "Target Job",
      dataIndex: "jobTitle",
      render: (text: string, record: ReferralItem) => (
        <div>
          <span className="fw-medium text-dark d-block">{text}</span>
          {record.jobCode && <span className="fs-12 text-muted">{record.jobCode}</span>}
        </div>
      ),
      sorter: (a: ReferralItem, b: ReferralItem) => a.jobTitle.localeCompare(b.jobTitle),
    },
    {
      title: "Referral Bonus",
      dataIndex: "rewardAmount",
      render: (val: number) => <span className="fw-bold text-success">₹{val.toLocaleString('en-IN')}</span>,
      sorter: (a: ReferralItem, b: ReferralItem) => a.rewardAmount - b.rewardAmount,
    },
    {
      title: "Resume",
      dataIndex: "resumeUrl",
      render: (url?: string) => (
        url ? (
          <a
            href={url.startsWith('http') ? url : `${apiClient.defaults.baseURL || ''}${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center fs-12"
          >
            <i className="ti ti-file-text me-1" /> Resume
          </a>
        ) : <span className="text-muted fs-12">None</span>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_text: string, record: ReferralItem) => (
        canManageStatus ? (
          <div className="dropdown">
            <button
              className={`btn btn-sm dropdown-toggle border px-2 py-1 fs-12 fw-medium ${STATUS_CONFIG[record.status]?.badgeClass || 'bg-light text-dark'}`}
              type="button"
              data-bs-toggle="dropdown"
            >
              {STATUS_CONFIG[record.status]?.label || record.status}
            </button>
            <ul
              className="dropdown-menu p-2 shadow-lg border-0 fs-12"
              style={{
                maxHeight: '160px',
                overflowY: 'auto',
                minWidth: '165px',
                zIndex: 1050,
                borderRadius: '8px'
              }}
            >
              {Object.keys(STATUS_CONFIG).map((stKey) => (
                <li key={stKey} className="mb-1">
                  <button
                    className={`dropdown-item rounded-2 py-1 px-2 ${record.status === stKey ? 'bg-primary-light text-primary fw-bold' : 'text-dark'}`}
                    onClick={() => handleUpdateStatus(record.id, stKey)}
                  >
                    {STATUS_CONFIG[stKey].label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span className={`badge border fs-12 ${STATUS_CONFIG[record.status]?.badgeClass || 'bg-light text-dark'}`}>
            {STATUS_CONFIG[record.status]?.label || record.status}
          </span>
        )
      )
    },
    {
      title: "Action",
      dataIndex: "id",
      render: (id: number) => (
        canManageStatus && (
          <button
            type="button"
            className="btn btn-icon btn-sm text-danger border-0 bg-transparent"
            onClick={() => handleDeleteReferral(id)}
            title="Delete Referral"
          >
            <i className="ti ti-trash fs-16" />
          </button>
        )
      )
    }
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Referrals</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Recruitment</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Referrals
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <button
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#add_referral_modal"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Submit Referral
                </button>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5 className="mb-0">Employee Candidate Referrals ({referrals.length})</h5>
            </div>
            <div className="card-body p-0" style={{ minHeight: '450px', paddingBottom: '120px' }}>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading referrals...</span>
                  </div>
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-5 px-3">
                  <i className="ti ti-user-plus fs-40 text-muted mb-2 d-block"></i>
                  <h5 className="text-muted">No Referrals Submitted Yet</h5>
                  <p className="text-muted fs-14 mb-0">
                    Employees can submit candidate referrals for open job postings and earn referral bonuses!
                  </p>
                </div>
              ) : (
                <Table dataSource={referrals} columns={columns} Selection={false} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Referral Modal */}
      <div className="modal fade" id="add_referral_modal">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Submit Candidate Referral</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleSubmitReferral}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Select Open Job</label>
                    <select
                      className="form-select"
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                    >
                      <option value="">General Referral (Any Job)</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.jobCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Candidate Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Sharma"
                      value={candName}
                      onChange={(e) => setCandName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Candidate Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. rahul@example.com"
                      value={candEmail}
                      onChange={(e) => setCandEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Candidate Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 9876543210"
                      value={candPhone}
                      onChange={(e) => setCandPhone(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Relationship / Association</label>
                    <select
                      className="form-select"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                    >
                      <option value="Former Colleague">Former Colleague</option>
                      <option value="College Friend">College Friend</option>
                      <option value="Professional Network">Professional Network</option>
                      <option value="Family / Relative">Family / Relative</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Referral Bonus Amount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-medium">Upload Candidate Resume (.pdf, .doc)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-medium">Referral Recommendation / Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Why do you recommend this candidate for our team?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default RefferalList;
