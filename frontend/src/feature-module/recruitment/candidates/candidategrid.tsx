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
          rawStage: a.stage || 'APPLIED'
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
                No candidate applications have been received yet. Post jobs or share job links to start receiving applicants!
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
                              <span className="badge bg-light text-secondary border fs-11 mt-1">
                                {cand.candId}
                              </span>
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
    </>
  );
};

export default CandidateGrid;
