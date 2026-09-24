import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PredefinedDateRanges from "../../../core/common/datePicker";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";

interface Candidate {
  id: number;
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
  rating: number;
  matchScore?: number;
  aiInsights?: any;
}

const STAGE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  APPLIED: { label: 'New', badgeClass: 'bg-purple text-white' },
  SHORTLISTED: { label: 'Scheduled', badgeClass: 'bg-pink text-white' },
  INTERVIEW: { label: 'Interviewed', badgeClass: 'bg-info text-white' },
  OFFER: { label: 'Offered', badgeClass: 'bg-warning text-white' },
  HIRED: { label: 'Hired', badgeClass: 'bg-success text-white' },
  REJECTED: { label: 'Rejected', badgeClass: 'bg-danger text-white' }
};

const CandidateGrid: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<string>('ALL');


  // Schedule Interview Modal State
  const [schedCand, setSchedCand] = useState<Candidate | null>(null);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState<string>('https://meet.google.com/abc-defg-hij');
  const [roundTitle, setRoundTitle] = useState<string>('Technical Interview Round 1');
  const [scheduling, setScheduling] = useState(false);

  // Scorecard Evaluation Modal State
  const [evalCand, setEvalCand] = useState<Candidate | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [feedbackNotes, setFeedbackNotes] = useState<string>('Strong technical skills, excellent communication, recommended.');
  const [evaluating, setEvaluating] = useState(false);

  // Offer Letter & Employee Conversion State
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
          candId: `Cand-${String(a.id).padStart(3, '0')}`,
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
          aiInsights: a.aiInsights
        }));
        setCandidates(mapped);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      console.error('Error fetching applicants for grid:', err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // Open AI Insights Modal

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

  // Open Schedule Interview Modal
  const handleOpenScheduleModal = (cand: Candidate) => {
    setSchedCand(cand);
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
                    Candidates Grid
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
                    className="btn btn-icon btn-sm me-1"
                    title="List View"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={all_routes.candidatesGrid}
                    className="btn btn-icon btn-sm active bg-primary text-white"
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

          <div className="card mb-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <h5 className="mb-0">Candidates Grid ({filteredCandidates.length})</h5>
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
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading candidate grid...</span>
              </div>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-5 bg-white rounded border">
              <i className="ti ti-users fs-40 text-muted mb-2 d-block"></i>
              <h5 className="text-muted">No Candidates Found</h5>
              <p className="text-muted fs-14 mb-0">
                No candidate applications have been received yet. Share job links to start receiving applicants!
              </p>
            </div>
          ) : (
            <div className="row">
              {filteredCandidates.map((cand) => (
                <div className="col-xl-3 col-lg-4 col-md-6 mb-4" key={cand.id}>
                  <div className="card h-100 shadow-sm border rounded">
                    <div className="card-body p-3 d-flex flex-column justify-content-between">
                      <div>
                        {/* Header: Candidate Avatar & Info */}
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-lg bg-gradient-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-18 me-2">
                              {cand.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <h6 className="fw-semibold text-truncate mb-0" title={cand.name}>
                                {cand.name}
                              </h6>
                              <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                                <span className="badge bg-light text-secondary border fs-11">
                                  {cand.candId}
                                </span>
                                <span className={`badge ${
                                  (cand.matchScore || 0) >= 75 ? 'bg-success-transparent text-success' :
                                  (cand.matchScore || 0) >= 50 ? 'bg-warning-transparent text-warning' :
                                  'bg-danger-transparent text-danger'
                                } fs-11`}>
                                  <i className="ti ti-sparkles me-1" />{cand.matchScore || 0}%
                                </span>
                                {cand.rating > 0 && renderStars(cand.rating)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-icon btn-sm text-danger border-0 bg-transparent p-0"
                            onClick={() => handleDeleteApplicant(cand.id)}
                            title="Delete Candidate"
                          >
                            <i className="ti ti-trash fs-16" />
                          </button>
                        </div>

                        {/* Contact details */}
                        <div className="bg-light p-2 rounded mb-3 fs-12">
                          <div className="text-muted text-truncate mb-1">
                            <i className="ti ti-mail text-primary me-1" />
                            <span>{cand.email}</span>
                          </div>
                          <div className="text-muted">
                            <i className="ti ti-phone text-success me-1" />
                            <span>{cand.phone}</span>
                          </div>
                        </div>

                        {/* Applied Role & Date */}
                        <div className="d-flex align-items-center justify-content-between fs-12 border-bottom pb-2 mb-3">
                          <div>
                            <span className="text-muted d-block">Applied Role</span>
                            <span className="fw-medium text-dark">{cand.jobTitle}</span>
                          </div>
                          <div className="text-end">
                            <span className="text-muted d-block">Applied Date</span>
                            <span className="fw-medium text-dark">{cand.appliedDate}</span>
                          </div>
                        </div>

                        {/* Action Buttons: AI Match, Schedule, Rate, Offer & Convert */}
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary flex-fill py-1 fs-11 d-flex align-items-center justify-content-center"
                            data-bs-toggle="modal"
                            data-bs-target="#schedule_interview_modal"
                            onClick={() => handleOpenScheduleModal(cand)}
                          >
                            <i className="ti ti-calendar me-1" /> Schedule
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning flex-fill py-1 fs-11 d-flex align-items-center justify-content-center"
                            data-bs-toggle="modal"
                            data-bs-target="#submit_scorecard_modal"
                            onClick={() => handleOpenScorecardModal(cand)}
                          >
                            <i className="ti ti-star me-1" /> Rate
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success flex-fill py-1 fs-11 d-flex align-items-center justify-content-center"
                            data-bs-toggle="modal"
                            data-bs-target="#generate_offer_modal"
                            onClick={() => handleOpenOfferModal(cand)}
                          >
                            <i className="ti ti-file-certificate me-1" /> Offer
                          </button>
                        </div>

                        {(cand.rawStage === 'OFFER' || cand.rawStage === 'HIRED') && (
                          <button
                            type="button"
                            className="btn btn-sm btn-success text-white w-100 py-1 fs-12 d-flex align-items-center justify-content-center fw-medium mb-3"
                            onClick={() => handleConvertToEmployee(cand)}
                            disabled={converting}
                          >
                            <i className="ti ti-user-check me-1 fs-14" /> {converting ? 'Converting...' : 'Convert to Employee'}
                          </button>
                        )}
                      </div>

                      {/* Footer: Stage Dropdown & Resume */}
                      <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                        {/* Stage Selector */}
                        <div className="dropdown">
                          <button
                            className={`btn btn-sm dropdown-toggle ${STAGE_CONFIG[cand.rawStage]?.badgeClass || 'bg-secondary text-white'} fs-12 fw-medium px-2 py-1`}
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            {STAGE_CONFIG[cand.rawStage]?.label || cand.rawStage}
                          </button>
                          <ul className="dropdown-menu p-2 shadow-sm">
                            {Object.keys(STAGE_CONFIG).map((sk) => (
                              <li key={sk}>
                                <button
                                  className={`dropdown-item rounded-1 fs-12 ${cand.rawStage === sk ? 'active' : ''}`}
                                  onClick={() => handleUpdateStage(cand.id, sk)}
                                >
                                  {STAGE_CONFIG[sk].label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Resume Button */}
                        {cand.resumeUrl ? (
                          <a
                            href={cand.resumeUrl.startsWith('http') ? cand.resumeUrl : `${apiClient.defaults.baseURL || ''}${cand.resumeUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center fs-12"
                            title="View Candidate Resume"
                          >
                            <i className="ti ti-file-text me-1" /> Resume
                          </a>
                        ) : (
                          <span className="text-muted fs-12">No Resume</span>
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

      {/* Schedule Interview Modal */}
      <div className="modal fade" id="schedule_interview_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Schedule Interview</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body">
                {schedCand && (
                  <div className="bg-light p-2 rounded mb-3 fs-13">
                    <strong>Candidate:</strong> {schedCand.name} ({schedCand.email})<br />
                    <strong>Role:</strong> {schedCand.jobTitle}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-medium">Interview Round Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={roundTitle}
                    onChange={(e) => setRoundTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Interview Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium">Meeting Link / Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Google Meet link or Conference Room 2"
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

      {/* Submit Scorecard & Rating Modal */}
      <div className="modal fade" id="submit_scorecard_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Candidate Evaluation & Rating Scorecard</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleScorecardSubmit}>
              <div className="modal-body">
                {evalCand && (
                  <div className="bg-light p-2 rounded mb-3 fs-13">
                    <strong>Candidate:</strong> {evalCand.name}<br />
                    <strong>Applied Job:</strong> {evalCand.jobTitle}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label fw-medium d-block">Overall Candidate Rating (1 to 5 Stars)</label>
                  <div className="d-flex gap-2 fs-20 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`ti ti-star-filled ${star <= ratingScore ? 'text-warning' : 'text-muted opacity-25'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setRatingScore(star)}
                      />
                    ))}
                    <span className="fs-14 fw-bold ms-2 align-self-center text-primary">{ratingScore} / 5 Stars</span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium">Evaluation Feedback Notes</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="Enter technical skills, communication performance, and assessment notes..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning text-white" disabled={evaluating}>
                  {evaluating ? 'Submitting...' : 'Submit Rating & Scorecard'}
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

export default CandidateGrid;
