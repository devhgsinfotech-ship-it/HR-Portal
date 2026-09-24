import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PredefinedDateRanges from "../../../core/common/datePicker";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";

interface Candidate {
  id: number;
  key: string;
  candId: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  jobTitle: string;
  jobCode: string;
  departmentName: string;
  appliedDate: string;
  stage: string;
  rawStage: string;
  rating?: number;
  matchScore?: number;
  aiInsights?: any;
  interviews?: any[];
}

const STAGE_CONFIG: Record<string, { label: string; colorClass: string }> = {
  APPLIED: { label: 'New', colorClass: 'bg-purple-light text-purple border-purple' },
  SHORTLISTED: { label: 'Scheduled', colorClass: 'bg-pink-light text-pink border-pink' },
  INTERVIEW: { label: 'Interviewed', colorClass: 'bg-info-light text-info border-info' },
  OFFER: { label: 'Offered', colorClass: 'bg-warning-light text-warning border-warning' },
  HIRED: { label: 'Hired', colorClass: 'bg-success-light text-success border-success' },
  REJECTED: { label: 'Rejected', colorClass: 'bg-danger-light text-danger border-danger' }
};

const CandidatesList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<string>('ALL');


  // Modal States for Interview Scheduling
  const [schedCand, setSchedCand] = useState<Candidate | null>(null);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [roundTitle, setRoundTitle] = useState<string>('Technical Round 1');
  const [scheduling, setScheduling] = useState<boolean>(false);

  // Modal States for Rating & Scorecard
  const [evalCand, setEvalCand] = useState<Candidate | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Modal States for Offer Letter & Hired Conversion
  const [offerCand, setOfferCand] = useState<Candidate | null>(null);
  const [annualCtc, setAnnualCtc] = useState<string>('600000');
  const [basicSalary, setBasicSalary] = useState<string>('300000');
  const [hra, setHra] = useState<string>('120000');
  const [specialAllowance, setSpecialAllowance] = useState<string>('180000');
  const [joiningDate, setJoiningDate] = useState<string>('');
  const [offerNotes, setOfferNotes] = useState<string>('Subject to background verification and document submission.');
  const [generatingOffer, setGeneratingOffer] = useState<boolean>(false);
  const [converting, setConverting] = useState<boolean>(false);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/applicants');
      if (Array.isArray(res.data)) {
        const mapped: Candidate[] = res.data.map((a: any) => ({
          id: a.id,
          key: `cand-${a.id}`,
          candId: `CAND-${String(a.id).padStart(3, '0')}`,
          name: a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Candidate',
          email: a.email,
          phone: a.phone || 'N/A',
          resumeUrl: a.resumeUrl,
          jobTitle: a.jobTitle || 'General',
          jobCode: a.jobCode || '',
          departmentName: a.departmentName || 'General',
          appliedDate: a.appliedAt ? new Date(a.appliedAt).toLocaleDateString('en-IN') : 'N/A',
          stage: STAGE_CONFIG[a.stage]?.label || a.stage,
          rawStage: a.stage || 'APPLIED',
          rating: a.rating || 0,
          matchScore: a.matchScore || (a.rating > 0 ? a.rating * 18 : 82),
          aiInsights: a.aiInsights,
          interviews: a.interviews || []
        }));
        setCandidates(mapped);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);


  const handleUpdateStage = async (id: number, newStage: string) => {
    try {
      await apiClient.put(`/applicants/${id}/stage`, { stage: newStage });
      fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update candidate stage');
    }
  };

  const handleDeleteApplicant = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this candidate application?')) return;
    try {
      await apiClient.delete(`/applicants/${id}`);
      fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete applicant');
    }
  };

  // Open Schedule Modal
  const handleOpenScheduleModal = (cand: Candidate) => {
    setSchedCand(cand);
    setMeetingLink('https://meet.google.com/abc-defg-hij');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setInterviewDate(tomorrow.toISOString().slice(0, 16));
  };

  // Submit Schedule Interview
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedCand || !interviewDate) {
      alert('Please select interview date and time');
      return;
    }

    setScheduling(true);
    try {
      await apiClient.post(`/applicants/${schedCand.id}/schedule-interview`, {
        scheduledAt: interviewDate,
        locationOrLink: meetingLink,
        roundTitle
      });

      alert(`Interview schedule saved! Invitation email sent to ${schedCand.email || schedCand.name}.`);
      const closeBtn = document.querySelector('#schedule_interview_modal .custom-btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();
      fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setScheduling(false);
    }
  };

  // Re-trigger / Resend Email Notification manually
  const handleResendEmail = async () => {
    if (!schedCand) return;
    setScheduling(true);
    try {
      await apiClient.post(`/applicants/${schedCand.id}/resend-interview-email`, {
        roundTitle,
        scheduledAt: interviewDate,
        locationOrLink: meetingLink
      });
      alert(`Updated interview schedule email sent to ${schedCand.email || schedCand.name}!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resend interview email');
    } finally {
      setScheduling(false);
    }
  };

  // Open Scorecard Modal
  const handleOpenScorecardModal = (cand: Candidate) => {
    setEvalCand(cand);
    setRatingScore(cand.rating || 5);
  };

  // Open Offer Letter Modal
  const handleOpenOfferModal = (cand: Candidate) => {
    setOfferCand(cand);
    const in15Days = new Date();
    in15Days.setDate(in15Days.getDate() + 15);
    setJoiningDate(in15Days.toISOString().slice(0, 10));
  };

  // Generate & Send Offer Letter Submit
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerCand || !annualCtc || !joiningDate) {
      alert('Please fill in Annual CTC and Joining Date');
      return;
    }

    setGeneratingOffer(true);
    try {
      const res = await apiClient.post(`/applicants/${offerCand.id}/offer-letter`, {
        annualCtc,
        basicSalary,
        hra,
        specialAllowance,
        joiningDate,
        notes: offerNotes
      });

      alert(`Offer letter generated and sent to ${offerCand.name} (${offerCand.email})! Stage updated to OFFER.`);
      const closeBtn = document.querySelector('#generate_offer_modal .custom-btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();

      if (res.data?.offerLetterUrl) {
        window.open(`${apiClient.defaults.baseURL || ''}${res.data.offerLetterUrl}`, '_blank');
      }
      fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate offer letter');
    } finally {
      setGeneratingOffer(false);
    }
  };

  // One-Click Convert Hired Candidate to Employee
  const handleConvertToEmployee = async (cand: Candidate) => {
    if (!window.confirm(`Are you sure you want to convert candidate "${cand.name}" into a full Employee? This will generate their employee profile and send onboarding credentials.`)) return;

    setConverting(true);
    try {
      const res = await apiClient.post(`/applicants/${cand.id}/convert-to-employee`, {
        dateOfJoining: new Date().toISOString().slice(0, 10)
      });

      alert(`Success! ${cand.name} converted to Employee (${res.data.employeeCode}). Onboarding invite sent to ${cand.email}.`);
      fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert candidate to employee');
    } finally {
      setConverting(false);
    }
  };

  // Submit Scorecard Rating
  const handleScorecardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalCand) return;

    setEvaluating(true);
    try {
      await apiClient.put(`/applicants/${evalCand.id}/stage`, {
        rating: ratingScore,
        notes: feedbackNotes
      });

      alert(`Scorecard & ${ratingScore}-star rating submitted for ${evalCand.name}!`);
      const closeBtn = document.querySelector('#submit_scorecard_modal .custom-btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();
      fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit scorecard rating');
    } finally {
      setEvaluating(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`ti ti-star-filled fs-12 ${i <= rating ? 'text-warning' : 'text-muted opacity-25'}`}
        />
      );
    }
    return <div className="d-inline-flex gap-1">{stars}</div>;
  };

  const filteredCandidates = filterStage === 'ALL'
    ? candidates
    : candidates.filter(c => c.rawStage === filterStage);

  const columns = [
    {
      title: "Cand ID",
      dataIndex: "candId",
      sorter: (a: Candidate, b: Candidate) => a.candId.localeCompare(b.candId),
      render: (text: string) => <span className="fw-medium text-dark">{text}</span>
    },
    {
      title: "Candidate",
      dataIndex: "name",
      render: (_text: string, record: Candidate) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-md bg-gradient-primary rounded-circle text-white d-flex align-items-center justify-content-center fw-bold me-2">
            {record.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h6 className="fw-medium mb-0">{record.name}</h6>
            <span className="text-muted fs-12">{record.email}</span>
            <div className="d-flex align-items-center gap-1 mt-1">
              {renderStars(record.rating || 0)}
            </div>
          </div>
        </div>
      ),
      sorter: (a: Candidate, b: Candidate) => a.name.localeCompare(b.name),
    },
    {
      title: "Applied Role",
      dataIndex: "jobTitle",
      render: (text: string, record: Candidate) => (
        <div>
          <span className="fw-medium d-block">{text}</span>
          {record.jobCode && <span className="fs-12 text-muted">{record.jobCode}</span>}
        </div>
      ),
      sorter: (a: Candidate, b: Candidate) => a.jobTitle.localeCompare(b.jobTitle),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      sorter: (a: Candidate, b: Candidate) => a.phone.localeCompare(b.phone),
    },
    {
      title: "Applied Date",
      dataIndex: "appliedDate",
      sorter: (a: Candidate, b: Candidate) => a.appliedDate.localeCompare(b.appliedDate),
    },
    {
      title: "Resume",
      dataIndex: "resumeUrl",
      render: (url?: string) => (
        <div className="d-inline-flex">
          {url ? (
            <a
              href={url.startsWith('http') ? url : `${apiClient.defaults.baseURL || ''}${url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center"
              title="View Candidate Resume"
            >
              <i className="ti ti-file-text me-1 fs-14" /> Resume
            </a>
          ) : (
            <span className="text-muted fs-12">No Resume</span>
          )}
        </div>
      )
    },
    {
      title: "Status / Stage",
      dataIndex: "rawStage",
      render: (_text: string, record: Candidate) => (
        <div className="dropdown">
          <button
            className={`btn btn-sm dropdown-toggle border px-2 py-1 fs-12 fw-medium ${STAGE_CONFIG[record.rawStage]?.colorClass || 'bg-light text-dark'}`}
            type="button"
            data-bs-toggle="dropdown"
          >
            {STAGE_CONFIG[record.rawStage]?.label || record.rawStage}
          </button>
          <ul
            className="dropdown-menu p-2 shadow-lg border-0 fs-12"
            style={{
              maxHeight: '160px',
              overflowY: 'auto',
              minWidth: '150px',
              zIndex: 1050,
              borderRadius: '8px'
            }}
          >
            {Object.keys(STAGE_CONFIG).map((stageKey) => (
              <li key={stageKey} className="mb-1">
                <button
                  className={`dropdown-item rounded-2 py-1 px-2 ${record.rawStage === stageKey ? 'bg-primary-light text-primary fw-bold' : 'text-dark'}`}
                  onClick={() => handleUpdateStage(record.id, stageKey)}
                >
                  {STAGE_CONFIG[stageKey].label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )
    },
    {
      title: "Actions",
      dataIndex: "id",
      render: (_id: number, record: Candidate) => (
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-info py-1 px-2 d-inline-flex align-items-center"
            data-bs-toggle="modal"
            data-bs-target="#schedule_interview_modal"
            onClick={() => handleOpenScheduleModal(record)}
            title="Schedule Interview Round"
          >
            <i className="ti ti-calendar-event me-1 fs-14" /> Schedule
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-warning py-1 px-2 d-inline-flex align-items-center"
            data-bs-toggle="modal"
            data-bs-target="#submit_scorecard_modal"
            onClick={() => handleOpenScorecardModal(record)}
            title="Rate & Scorecard Evaluation"
          >
            <i className="ti ti-star me-1 fs-14" /> Rate
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-success py-1 px-2 d-inline-flex align-items-center"
            data-bs-toggle="modal"
            data-bs-target="#generate_offer_modal"
            onClick={() => handleOpenOfferModal(record)}
            title="Generate & Send Offer Letter"
          >
            <i className="ti ti-file-certificate me-1 fs-14" /> Offer
          </button>

          {(record.rawStage === 'OFFER' || record.rawStage === 'HIRED') && (
            <button
              type="button"
              className="btn btn-sm btn-success text-white py-1 px-2 d-inline-flex align-items-center"
              onClick={() => handleConvertToEmployee(record)}
              disabled={converting}
              title="Convert Candidate to Active Employee Profile"
            >
              <i className="ti ti-user-check me-1 fs-14" /> {converting ? 'Converting...' : 'Convert'}
            </button>
          )}

          <button
            type="button"
            className="btn btn-icon btn-sm text-danger border-0 bg-transparent ms-1"
            onClick={() => handleDeleteApplicant(record.id)}
            title="Delete Candidate"
          >
            <i className="ti ti-trash fs-16" />
          </button>
        </div>
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
              <h2 className="mb-1">Candidates</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Recruitment</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Candidates List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={all_routes.candidateskanban}
                    className="btn btn-icon btn-sm me-1"
                    title="Kanban View"
                  >
                    <i className="ti ti-layout-kanban" />
                  </Link>
                  <Link
                    to={all_routes.candidateslist}
                    className="btn btn-icon btn-sm active bg-primary text-white me-1"
                    title="List View"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={all_routes.candidatesGrid}
                    className="btn btn-icon btn-sm"
                    title="Grid View"
                  >
                    <i className="ti ti-layout-grid" />
                  </Link>
                </div>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5 className="mb-0">Candidates List ({filteredCandidates.length})</h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <PredefinedDateRanges />
                <div className="dropdown">
                  <button
                    className="dropdown-toggle btn btn-white border d-inline-flex align-items-center fs-13"
                    data-bs-toggle="dropdown"
                  >
                    Filter Stage: {filterStage === 'ALL' ? 'All Stages' : STAGE_CONFIG[filterStage]?.label || filterStage}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm">
                    <li>
                      <button className="dropdown-item rounded-1 fs-12" onClick={() => setFilterStage('ALL')}>
                        All Stages
                      </button>
                    </li>
                    {Object.keys(STAGE_CONFIG).map((sk) => (
                      <li key={sk}>
                        <button className="dropdown-item rounded-1 fs-12" onClick={() => setFilterStage(sk)}>
                          {STAGE_CONFIG[sk].label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading candidate applications...</span>
                  </div>
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-5 px-3">
                  <i className="ti ti-users fs-40 text-muted mb-2 d-block"></i>
                  <h5 className="text-muted">No Candidates Found</h5>
                  <p className="text-muted fs-14 mb-0">
                    No job applications have been submitted yet. Share job links to start receiving applicants!
                  </p>
                </div>
              ) : (
                <Table dataSource={filteredCandidates} columns={columns} Selection={false} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE INTERVIEW MODAL */}
      <div className="modal fade" id="schedule_interview_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-calendar-event text-primary me-2" />
                Schedule Interview - {schedCand?.name}
              </h5>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-medium">Candidate</label>
                  <input type="text" className="form-control" value={`${schedCand?.name || ''} (${schedCand?.email || ''})`} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Round Name / Stage</label>
                  <select
                    className="form-select"
                    value={roundTitle}
                    onChange={(e) => setRoundTitle(e.target.value)}
                  >
                    <option value="HR Screening">HR Screening</option>
                    <option value="Technical Round 1">Technical Round 1</option>
                    <option value="Technical Round 2">Technical Round 2</option>
                    <option value="Managerial Interview">Managerial Interview</option>
                    <option value="Final HR Discussion">Final HR Discussion</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Meeting Link / Room Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. https://meet.google.com/xyz-abc"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-info btn-sm d-inline-flex align-items-center"
                  onClick={handleResendEmail}
                  disabled={scheduling || !schedCand}
                  title="Resend email with current round, date, and link"
                >
                  <i className="ti ti-mail-forward me-1 fs-14" /> Resend Email to Candidate
                </button>
                <div>
                  <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={scheduling}>
                    {scheduling ? 'Saving...' : 'Save & Send Email'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* SUBMIT SCORECARD & RATING MODAL */}
      <div className="modal fade" id="submit_scorecard_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-star text-warning me-2" />
                Scorecard & Rating - {evalCand?.name}
              </h5>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <form onSubmit={handleScorecardSubmit}>
              <div className="modal-body">
                <div className="mb-3 text-center">
                  <label className="form-label d-block fw-medium">Overall Rating (1 to 5 Stars)</label>
                  <div className="d-flex justify-content-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className="btn btn-link p-0 border-0 fs-24"
                        onClick={() => setRatingScore(star)}
                      >
                        <i className={`ti ti-star-filled ${star <= ratingScore ? 'text-warning' : 'text-muted opacity-25'}`} />
                      </button>
                    ))}
                  </div>
                  <small className="text-muted d-block mt-1">Click a star to rate</small>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Interviewer Feedback & Scorecard Notes</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Enter assessment notes, domain knowledge ratings, communication skills..."
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning text-white" disabled={evaluating}>
                  {evaluating ? 'Submitting...' : 'Save Scorecard Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* GENERATE OFFER LETTER MODAL */}
      <div className="modal fade" id="generate_offer_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-file-certificate text-success me-2" />
                Generate Offer Letter - {offerCand?.name}
              </h5>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <form onSubmit={handleOfferSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Candidate</label>
                    <input type="text" className="form-control" value={`${offerCand?.name || ''} (${offerCand?.email || ''})`} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Applied Position</label>
                    <input type="text" className="form-control" value={offerCand?.jobTitle || ''} disabled />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-medium">Annual CTC (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 600000"
                      required
                      value={annualCtc}
                      onChange={(e) => {
                        const ctc = parseFloat(e.target.value) || 0;
                        setAnnualCtc(e.target.value);
                        setBasicSalary(String(Math.round(ctc * 0.5)));
                        setHra(String(Math.round(ctc * 0.2)));
                        setSpecialAllowance(String(Math.round(ctc * 0.3)));
                      }}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Expected Joining Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-medium">Basic Salary (₹ / yr)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium">HRA (₹ / yr)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={hra}
                      onChange={(e) => setHra(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium">Special Allowance (₹ / yr)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={specialAllowance}
                      onChange={(e) => setSpecialAllowance(e.target.value)}
                    />
                  </div>

                  <div className="col-md-12">
                    <label className="form-label fw-medium">Offer Terms & Notes</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={offerNotes}
                      onChange={(e) => setOfferNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success text-white" disabled={generatingOffer}>
                  {generatingOffer ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Generating PDF & Emailing...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-mail-forward me-1" /> Generate PDF & Send Offer Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>


    </>
  );
};

export default CandidatesList;
