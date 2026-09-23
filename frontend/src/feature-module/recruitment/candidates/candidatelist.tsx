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
          rawStage: a.stage || 'APPLIED'
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
          <ul className="dropdown-menu p-2 shadow-sm">
            {Object.keys(STAGE_CONFIG).map((stageKey) => (
              <li key={stageKey}>
                <button
                  className={`dropdown-item rounded-1 fs-12 ${record.rawStage === stageKey ? 'active' : ''}`}
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
      title: "Action",
      dataIndex: "id",
      render: (id: number) => (
        <button
          type="button"
          className="btn btn-icon btn-sm text-danger border-0 bg-transparent"
          onClick={() => handleDeleteApplicant(id)}
          title="Delete Candidate"
        >
          <i className="ti ti-trash fs-16" />
        </button>
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
    </>
  );
};

export default CandidatesList;
