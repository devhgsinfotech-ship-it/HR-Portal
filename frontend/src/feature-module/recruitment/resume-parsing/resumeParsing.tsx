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
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  experienceFit?: string;
  aiRecommendation?: string;
}

const ResumeParsing: React.FC = () => {
  const [resumeList, setResumeList] = useState<ResumeParsedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobPostings, setJobPostings] = useState<any[]>([]);

  // Parsing modal states
  const [parseFile, setParseFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
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

  const fetchJobPostings = async () => {
    try {
      const res = await apiClient.get('/job-postings');
      if (Array.isArray(res.data)) {
        setJobPostings(res.data);
      }
    } catch (err) {
      console.error('Error fetching job postings:', err);
    }
  };

  useEffect(() => {
    fetchResumes();
    fetchJobPostings();
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
      if (selectedJobId) {
        formData.append('jobPostingId', selectedJobId);
      }

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
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Upload Candidate Resume (.pdf, .doc, .docx)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setParseFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Target Job Posting (For AI Match Score)</label>
                    <select
                      className="form-select"
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                    >
                      <option value="">-- General Match / Select Job --</option>
                      {jobPostings.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} ({job.jobCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {parsing && (
                  <div className="text-center py-4 bg-light rounded border">
                    <div className="spinner-border text-primary mb-2" role="status" />
                    <h6 className="text-primary mb-1">Analyzing Candidate Resume...</h6>
                    <p className="text-muted fs-13 mb-0">Extracting skills, experience, and calculating AI Job Match Score</p>
                  </div>
                )}

                {parsedResult && !parsing && (
                  <div className="bg-light p-3 rounded border mt-3">
                    <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                      <h6 className="fw-bold text-success mb-0">
                        <i className="ti ti-circle-check me-1" /> Extracted Candidate & AI Match Profile
                      </h6>
                      {parsedResult.matchScore !== undefined && (
                        <span className={`badge ${parsedResult.matchScore >= 75 ? 'bg-success' : parsedResult.matchScore >= 50 ? 'bg-warning text-dark' : 'bg-danger'} fs-14 fw-bold px-3 py-1`}>
                          <i className="ti ti-brain me-1" /> AI Match: {parsedResult.matchScore}%
                        </span>
                      )}
                    </div>

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

                    <div className="mb-3">
                      <strong className="d-block mb-1">Extracted Candidate Skills:</strong>
                      <div className="d-flex flex-wrap gap-1">
                        {parsedResult.skills.map((skill, idx) => (
                          <span key={idx} className="badge bg-primary-light text-primary border border-primary fs-12">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {parsedResult.matchedSkills && parsedResult.matchedSkills.length > 0 && (
                      <div className="mb-3">
                        <strong className="d-block text-success mb-1">
                          <i className="ti ti-check me-1" /> Matched Job Skills:
                        </strong>
                        <div className="d-flex flex-wrap gap-1">
                          {parsedResult.matchedSkills.map((mSkill, idx) => (
                            <span key={idx} className="badge bg-success-light text-success border border-success fs-12">
                              ✓ {mSkill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {parsedResult.missingSkills && parsedResult.missingSkills.length > 0 && (
                      <div className="mb-3">
                        <strong className="d-block text-warning mb-1">
                          <i className="ti ti-alert-triangle me-1" /> Missing Skill Gaps:
                        </strong>
                        <div className="d-flex flex-wrap gap-1">
                          {parsedResult.missingSkills.map((gapSkill, idx) => (
                            <span key={idx} className="badge bg-warning-light text-warning border border-warning fs-12">
                              ! {gapSkill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="fs-12 text-muted mb-0 mt-2 bg-white p-2 rounded border">
                      <strong>AI Executive Summary:</strong> {parsedResult.summary}
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
