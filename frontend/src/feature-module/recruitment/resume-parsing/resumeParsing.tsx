import React, { useState, useEffect } from 'react';
import { all_routes } from "../../../router/all_routes";
import Table from "../../../core/common/dataTable/index";
import { Link } from "react-router-dom";
import PredefinedDateRanges from "../../../core/common/datePicker";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import apiClient from "../../../core/utils/apiClient";

interface ResumeParsedItem {
  id: number;
  candId: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  experience: string;
  resumeUrl?: string;
  status: string;
}

interface ParsedResult {
  fileName: string;
  resumeUrl?: string;
  candidateName: string;
  email: string;
  phone: string;
  experienceYears: string;
  skills: string[];
  education: string;
  summary: string;
}

const ResumeParsing: React.FC = () => {
  const [resumeList, setResumeList] = useState<ResumeParsedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Parsing modal states
  const [parseFile, setParseFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/applicants');
      if (Array.isArray(res.data)) {
        const mapped: ResumeParsedItem[] = res.data.map((a: any) => ({
          id: a.id,
          candId: `CAND-${String(a.id).padStart(3, '0')}`,
          name: a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Candidate',
          email: a.email,
          phone: a.phone || 'N/A',
          jobTitle: a.jobTitle || 'General',
          experience: '2+ Years',
          resumeUrl: a.resumeUrl,
          status: 'Parsed & Indexed'
        }));
        setResumeList(mapped);
      } else {
        setResumeList([]);
      }
    } catch (err) {
      console.error('Error fetching parsed resumes:', err);
      setResumeList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUploadAndParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parseFile) {
      alert('Please select a resume file (.pdf, .doc, .docx)');
      return;
    }

    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('resume', parseFile);

      const res = await apiClient.post('/applicants/parse-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.parsedData) {
        setParsedResult(res.data.parsedData);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to parse resume');
    } finally {
      setParsing(false);
    }
  };

  const columns = [
    {
      title: "Cand ID",
      dataIndex: "candId",
      render: (text: string) => <span className="fw-medium text-dark">{text}</span>,
      sorter: (a: ResumeParsedItem, b: ResumeParsedItem) => a.candId.localeCompare(b.candId),
    },
    {
      title: "Candidate",
      dataIndex: "name",
      render: (text: string, record: ResumeParsedItem) => (
        <div className="d-flex align-items-center">
          <div className="avatar avatar-md bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-2 fw-bold">
            {text.charAt(0).toUpperCase()}
          </div>
          <div>
            <h6 className="fw-medium mb-0">{text}</h6>
            <span className="text-muted fs-12">{record.email}</span>
          </div>
        </div>
      ),
      sorter: (a: ResumeParsedItem, b: ResumeParsedItem) => a.name.localeCompare(b.name),
    },
    {
      title: "Applied / Parsed Role",
      dataIndex: "jobTitle",
      sorter: (a: ResumeParsedItem, b: ResumeParsedItem) => a.jobTitle.localeCompare(b.jobTitle),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      sorter: (a: ResumeParsedItem, b: ResumeParsedItem) => a.phone.localeCompare(b.phone),
    },
    {
      title: "Experience",
      dataIndex: "experience",
      sorter: (a: ResumeParsedItem, b: ResumeParsedItem) => a.experience.localeCompare(b.experience),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span className="badge bg-success-light text-success border-success fs-12">
          <i className="ti ti-point-filled me-1" />
          {text}
        </span>
      ),
    },
    {
      title: "Resume Document",
      dataIndex: "resumeUrl",
      render: (url?: string) => (
        url ? (
          <a
            href={url.startsWith('http') ? url : `${apiClient.defaults.baseURL || ''}${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center fs-12"
          >
            <i className="ti ti-file-text me-1" /> Open Resume
          </a>
        ) : <span className="text-muted fs-12">No Document</span>
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
              <h2 className="mb-1">Resume Parsing</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Recruitment</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Resume Parsing
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <button
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#parse_resume_modal"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-file-search me-2" />
                  Upload & Parse Resume
                </button>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5 className="mb-0">Parsed Resume Library ({resumeList.length})</h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <PredefinedDateRanges />
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading parsed resumes...</span>
                  </div>
                </div>
              ) : resumeList.length === 0 ? (
                <div className="text-center py-5 px-3">
                  <i className="ti ti-file-search fs-40 text-muted mb-2 d-block"></i>
                  <h5 className="text-muted">No Parsed Resumes Yet</h5>
                  <p className="text-muted fs-14 mb-0">
                    Upload candidate resumes (.pdf, .doc) to automatically extract skills, contact details, and experience!
                  </p>
                </div>
              ) : (
                <Table dataSource={resumeList} columns={columns} Selection={false} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parse Resume Modal */}
      <div className="modal fade" id="parse_resume_modal">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">AI / Automated Resume Parser</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleUploadAndParse}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-medium">Upload Candidate Resume (.pdf, .doc, .docx)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setParseFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                {parsing && (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary me-2" role="status" />
                    <span>Parsing resume text & extracting candidate skills...</span>
                  </div>
                )}

                {parsedResult && !parsing && (
                  <div className="bg-light p-3 rounded border mt-3">
                    <h6 className="fw-bold text-success mb-2">
                      <i className="ti ti-circle-check me-1" /> Extracted Candidate Profile:
                    </h6>
                    <div className="row g-2 fs-13 mb-3">
                      <div className="col-md-6">
                        <strong>Name:</strong> {parsedResult.candidateName}
                      </div>
                      <div className="col-md-6">
                        <strong>Email:</strong> {parsedResult.email}
                      </div>
                      <div className="col-md-6">
                        <strong>Phone:</strong> {parsedResult.phone}
                      </div>
                      <div className="col-md-6">
                        <strong>Experience:</strong> {parsedResult.experienceYears}
                      </div>
                      <div className="col-md-12">
                        <strong>Education:</strong> {parsedResult.education}
                      </div>
                    </div>

                    <div className="mb-2">
                      <strong>Extracted Skills:</strong>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {parsedResult.skills.map((skill, idx) => (
                          <span key={idx} className="badge bg-primary-light text-primary border border-primary">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="fs-12 text-muted mb-0 mt-2">
                      <strong>Executive Summary:</strong> {parsedResult.summary}
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                  Close
                </button>
                <button type="submit" className="btn btn-primary" disabled={parsing}>
                  {parsing ? 'Parsing...' : 'Parse Resume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResumeParsing;
