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
          stage: a.stage || 'APPLIED'
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
      // Optimistic state update for instant responsive UI
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: newStage } : c));
      await apiClient.put(`/applicants/${id}/stage`, { stage: newStage });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update candidate stage');
      fetchApplicants(); // Revert on failure
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
                    style={{ width: '310px', minHeight: '550px' }}
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
                                <span className="badge bg-light text-primary border fs-11">
                                  {cand.candId}
                                </span>
                                <div className="dropdown">
                                  <button
                                    className="btn btn-icon btn-sm border-0 text-muted p-0"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                  >
                                    <i className="ti ti-dots-vertical fs-16" />
                                  </button>
                                  <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm fs-12">
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

                              {/* Resume Link */}
                              {cand.resumeUrl ? (
                                <a
                                  href={cand.resumeUrl.startsWith('http') ? cand.resumeUrl : `${apiClient.defaults.baseURL || ''}${cand.resumeUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary w-100 py-1 d-flex align-items-center justify-content-center fs-12"
                                >
                                  <i className="ti ti-file-text me-1" /> View Resume
                                </a>
                              ) : (
                                <span className="text-muted fs-12 d-block text-center">No Resume Attached</span>
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
    </>
  );
};

export default CandidateKanban;
