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
  stage: string; // APPLIED | SHORTLISTED | INTERVIEW | OFFER | HIRED | REJECTED
  rating: number;
  interviewsCount: number;
  latestInterview?: {
    id: number;
    scheduledAt: string;
    status: string;
    locationOrLink?: string;
  } | null;
}

interface ColumnConfig {
  key: string;
  title: string;
  dotColorClass: string;
  headerBadgeClass: string;
}

const KANBAN_COLUMNS: ColumnConfig[] = [
  { key: 'APPLIED', title: 'New', dotColorClass: 'bg-purple', headerBadgeClass: 'bg-purple-light text-purple' },
  { key: 'SHORTLISTED', title: 'Scheduled', dotColorClass: 'bg-pink', headerBadgeClass: 'bg-pink-light text-pink' },
  { key: 'INTERVIEW', title: 'Interviewed', dotColorClass: 'bg-info', headerBadgeClass: 'bg-info-light text-info' },
  { key: 'OFFER', title: 'Offered', dotColorClass: 'bg-warning', headerBadgeClass: 'bg-warning-light text-warning' },
  { key: 'HIRED', title: 'Hired', dotColorClass: 'bg-success', headerBadgeClass: 'bg-success-light text-success' },
  { key: 'REJECTED', title: 'Rejected', dotColorClass: 'bg-danger', headerBadgeClass: 'bg-danger-light text-danger' }
];

const CandidateKanban: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCandidateId, setDraggedCandidateId] = useState<number | null>(null);

  // Schedule Interview Modal State
  const [schedCand, setSchedCand] = useState<Candidate | null>(null);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState<string>('https://meet.google.com/abc-defg-hij');
  const [roundTitle, setRoundTitle] = useState<string>('Technical Interview Round 1');
  const [scheduling, setScheduling] = useState(false);

  // Scorecard Evaluation Modal State
  const [evalCand, setEvalCand] = useState<Candidate | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [feedbackNotes, setFeedbackNotes] = useState<string>('Strong technical foundation, excellent problem solving skills.');
  const [evaluating, setEvaluating] = useState(false);

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
          stage: a.stage || 'APPLIED',
          rating: a.rating || 0,
          interviewsCount: a.interviewsCount || 0,
          latestInterview: a.latestInterview
        }));
        setCandidates(mapped);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      console.error('Error fetching applicants for kanban:', err);
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
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: newStage } : c));
      await apiClient.put(`/applicants/${id}/stage`, { stage: newStage });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update candidate stage');
      fetchApplicants();
    }
  };

  const handleDeleteApplicant = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this candidate application?')) return;
    try {
      setCandidates(prev => prev.filter(c => c.id !== id));
      await apiClient.delete(`/applicants/${id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete applicant');
      fetchApplicants();
    }
  };

  // Open Schedule Interview Modal
  const handleOpenScheduleModal = (cand: Candidate) => {
    setSchedCand(cand);
    // Set default date to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const formattedDateTime = tomorrow.toISOString().slice(0, 16);
    setInterviewDate(formattedDateTime);
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

      // Dismiss modal
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

      // Dismiss modal
      const closeBtn = document.querySelector('#submit_scorecard_modal .custom-btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();

      fetchApplicants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit scorecard rating');
    } finally {
      setEvaluating(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', String(id));
    setDraggedCandidateId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    const candidateIdStr = e.dataTransfer.getData('text/plain');
    const id = candidateIdStr ? parseInt(candidateIdStr, 10) : draggedCandidateId;
    if (id) {
      handleUpdateStage(id, targetStageKey);
    }
    setDraggedCandidateId(null);
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

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Candidates Kanban</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Recruitment</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Candidates Kanban
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={all_routes.candidateskanban}
                    className="btn btn-icon btn-sm active bg-primary text-white me-1"
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

          <div className="card mb-4">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <h5 className="mb-0">Candidates Pipeline ({candidates.length})</h5>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <PredefinedDateRanges />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading kanban board...</span>
              </div>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-5 bg-white rounded border">
              <i className="ti ti-layout-kanban fs-40 text-muted mb-2 d-block"></i>
              <h5 className="text-muted">No Candidates in Pipeline</h5>
              <p className="text-muted fs-14 mb-0">
                No candidate applications received yet. Share job links to start receiving applicants!
              </p>
            </div>
          ) : (
            /* Kanban Board Horizontal Scroll Container */
            <div className="kanban-wrapper d-flex gap-3 overflow-auto pb-4" style={{ minHeight: '650px' }}>
              {KANBAN_COLUMNS.map((col) => {
                const columnCandidates = candidates.filter((c) => c.stage === col.key);

                return (
                  <div
                    key={col.key}
                    className="kanban-column bg-light rounded border p-3 flex-shrink-0"
                    style={{ width: '320px', minHeight: '550px' }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.key)}
                  >
                    {/* Column Header */}
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`rounded-circle d-inline-block ${col.dotColorClass}`} style={{ width: '10px', height: '10px' }}></span>
                        <h6 className="fw-bold mb-0">{col.title}</h6>
                        <span className={`badge rounded-pill ${col.headerBadgeClass} fs-12 px-2`}>
                          {columnCandidates.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Candidates List */}
                    <div className="d-flex flex-column gap-3" style={{ minHeight: '450px' }}>
                      {columnCandidates.length === 0 ? (
                        <div className="text-center py-4 border border-dashed rounded text-muted fs-13 bg-white">
                          Drag candidates here
                        </div>
                      ) : (
                        columnCandidates.map((cand) => (
                          <div
                            key={cand.id}
                            className="card border shadow-sm mb-0 bg-white rounded cursor-grab"
                            draggable
                            onDragStart={(e) => handleDragStart(e, cand.id)}
                            style={{ cursor: 'grab' }}
                          >
                            <div className="card-body p-3">
                              {/* Top Bar: Cand-ID Badge & Action Dropdown */}
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="d-flex align-items-center gap-1">
                                  <span className="badge bg-light text-primary border fs-11">
                                    {cand.candId}
                                  </span>
                                  {cand.rating > 0 && renderStars(cand.rating)}
                                </div>

                                <div className="dropdown">
                                  <button
                                    className="btn btn-icon btn-sm border-0 text-muted p-0"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                  >
                                    <i className="ti ti-dots-vertical fs-16" />
                                  </button>
                                  <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm fs-12">
                                    <li>
                                      <button
                                        type="button"
                                        className="dropdown-item rounded-1 fs-12 text-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#schedule_interview_modal"
                                        onClick={() => handleOpenScheduleModal(cand)}
                                      >
                                        <i className="ti ti-calendar-event me-1" /> Schedule Interview
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        type="button"
                                        className="dropdown-item rounded-1 fs-12 text-warning"
                                        data-bs-toggle="modal"
                                        data-bs-target="#submit_scorecard_modal"
                                        onClick={() => handleOpenScorecardModal(cand)}
                                      >
                                        <i className="ti ti-star me-1" /> Rate / Scorecard
                                      </button>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li className="dropdown-header text-muted fs-11">Move Stage:</li>
                                    {KANBAN_COLUMNS.map((targetCol) => (
                                      <li key={targetCol.key}>
                                        <button
                                          className={`dropdown-item rounded-1 fs-12 ${cand.stage === targetCol.key ? 'active' : ''}`}
                                          onClick={() => handleUpdateStage(cand.id, targetCol.key)}
                                        >
                                          {targetCol.title}
                                        </button>
                                      </li>
                                    ))}
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                      <button
                                        className="dropdown-item text-danger rounded-1 fs-12"
                                        onClick={() => handleDeleteApplicant(cand.id)}
                                      >
                                        <i className="ti ti-trash me-1" /> Delete
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              </div>

                              {/* Candidate Info */}
                              <div className="d-flex align-items-center mb-3">
                                <div className="avatar avatar-md bg-gradient-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-14 me-2 flex-shrink-0">
                                  {cand.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                  <h6 className="fw-semibold text-truncate mb-0 fs-14" title={cand.name}>
                                    {cand.name}
                                  </h6>
                                  <span className="text-muted fs-12 text-truncate d-block" title={cand.email}>
                                    {cand.email}
                                  </span>
                                </div>
                              </div>

                              {/* Role & Date Info Grid */}
                              <div className="row g-1 bg-light p-2 rounded text-dark fs-12 mb-3">
                                <div className="col-6">
                                  <span className="text-muted d-block fs-11">Applied Role</span>
                                  <span className="fw-medium text-truncate d-block" title={cand.jobTitle}>
                                    {cand.jobTitle}
                                  </span>
                                </div>
                                <div className="col-6 text-end">
                                  <span className="text-muted d-block fs-11">Applied Date</span>
                                  <span className="fw-medium d-block">{cand.appliedDate}</span>
                                </div>
                              </div>

                              {/* Bottom Action Bar */}
                              <div className="d-flex gap-1">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary flex-fill py-1 fs-12 d-flex align-items-center justify-content-center"
                                  data-bs-toggle="modal"
                                  data-bs-target="#schedule_interview_modal"
                                  onClick={() => handleOpenScheduleModal(cand)}
                                >
                                  <i className="ti ti-calendar me-1" /> Schedule
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-warning flex-fill py-1 fs-12 d-flex align-items-center justify-content-center"
                                  data-bs-toggle="modal"
                                  data-bs-target="#submit_scorecard_modal"
                                  onClick={() => handleOpenScorecardModal(cand)}
                                >
                                  <i className="ti ti-star me-1" /> Rate
                                </button>
                              </div>

                              {cand.resumeUrl && (
                                <div className="mt-2">
                                  <a
                                    href={cand.resumeUrl.startsWith('http') ? cand.resumeUrl : `${apiClient.defaults.baseURL || ''}${cand.resumeUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary fs-12 d-inline-flex align-items-center"
                                  >
                                    <i className="ti ti-file-text me-1" /> View Resume Document
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
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
    </>
  );
};

export default CandidateKanban;
