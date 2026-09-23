import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import PredefinedDateRanges from '../../../core/common/datePicker';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import CommonSelect from '../../../core/common/commonSelect';
import apiClient from '../../../core/utils/apiClient';
import { joblistdetails } from './joblistdetails';

interface Job {
  id?: number;
  Job_ID: string;
  Image: string;
  Job_Title: string;
  Roll: string;
  Category: string;
  Location: string;
  Salary_Range: string;
  Posted_Date: string;
  Status?: string;
  vacancies?: number;
  applicantsCount?: number;
  description?: string;
  requirements?: string;
  minSalary?: number;
  maxSalary?: number;
  bannerUrl?: string;
  employmentType?: string;
}

const JobList = () => {
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states for creating a job posting
  const [newTitle, setNewTitle] = useState('');
  const [newJobCode, setNewJobCode] = useState('');
  const [newLocation, setNewLocation] = useState('Onsite');
  const [newVacancies, setNewVacancies] = useState('1');
  const [newMinSalary, setNewMinSalary] = useState('');
  const [newMaxSalary, setNewMaxSalary] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [newBannerPreview, setNewBannerPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states for editing a job posting
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editJobCode, setEditJobCode] = useState('');
  const [editLocation, setEditLocation] = useState('Onsite');
  const [editVacancies, setEditVacancies] = useState('1');
  const [editMinSalary, setEditMinSalary] = useState('');
  const [editMaxSalary, setEditMaxSalary] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('OPEN');
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/job-postings');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped: Job[] = res.data.map((j: any) => {
          let salaryRange = 'Competitive';
          if (j.minSalary && j.maxSalary) {
            salaryRange = `₹${Number(j.minSalary).toLocaleString('en-IN')} - ₹${Number(j.maxSalary).toLocaleString('en-IN')}`;
          } else if (j.minSalary) {
            salaryRange = `₹${Number(j.minSalary).toLocaleString('en-IN')}+`;
          }

          return {
            id: j.id,
            Job_ID: j.jobCode || `JOB-${j.id}`,
            Image: 'apple.svg',
            Job_Title: j.title,
            Roll: j.departmentName || 'General',
            Category: j.employmentType || 'Full Time',
            Location: j.location || 'Onsite',
            Salary_Range: salaryRange,
            Posted_Date: new Date(j.createdAt).toLocaleDateString('en-IN'),
            Status: j.status,
            vacancies: j.vacancies,
            applicantsCount: j.stageCounts?.total || 0,
            description: j.description,
            requirements: j.requirements,
            minSalary: j.minSalary,
            maxSalary: j.maxSalary,
            bannerUrl: j.bannerUrl,
            employmentType: j.employmentType
          };
        });
        setJobsList(mapped);
      } else {
        setJobsList(joblistdetails);
      }
    } catch (err) {
      console.error('Failed to fetch job postings:', err);
      setJobsList(joblistdetails);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleNewBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewBannerFile(file);
      setNewBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleEditBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditBannerFile(file);
      setEditBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter a job title');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newTitle.trim());
      if (newJobCode.trim()) formData.append('jobCode', newJobCode.trim());
      formData.append('location', newLocation);
      formData.append('vacancies', newVacancies);
      if (newMinSalary) formData.append('minSalary', newMinSalary);
      if (newMaxSalary) formData.append('maxSalary', newMaxSalary);
      formData.append('description', newDescription);
      formData.append('status', 'OPEN');
      if (newBannerFile) {
        formData.append('banner', newBannerFile);
      }

      await apiClient.post('/job-postings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Job posted successfully!');
      
      // Reset form
      setNewTitle('');
      setNewJobCode('');
      setNewMinSalary('');
      setNewMaxSalary('');
      setNewDescription('');
      setNewBannerFile(null);
      setNewBannerPreview(null);

      // Dismiss modal
      const closeBtn = document.querySelector('#add_post .custom-btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();

      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (record: Job) => {
    setEditId(record.id || null);
    setEditTitle(record.Job_Title || '');
    setEditJobCode(record.Job_ID || '');
    setEditLocation(record.Location || 'Onsite');
    setEditVacancies(record.vacancies ? String(record.vacancies) : '1');
    setEditMinSalary(record.minSalary ? String(record.minSalary) : '');
    setEditMaxSalary(record.maxSalary ? String(record.maxSalary) : '');
    setEditDescription(record.description || '');
    setEditStatus(record.Status || 'OPEN');
    setEditBannerFile(null);
    setEditBannerPreview(record.bannerUrl || null);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    if (!editTitle.trim()) {
      alert('Please enter a job title');
      return;
    }

    setEditSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('location', editLocation);
      formData.append('vacancies', editVacancies);
      if (editMinSalary) formData.append('minSalary', editMinSalary);
      if (editMaxSalary) formData.append('maxSalary', editMaxSalary);
      formData.append('description', editDescription);
      formData.append('status', editStatus);
      if (editBannerFile) {
        formData.append('banner', editBannerFile);
      }

      await apiClient.put(`/job-postings/${editId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Job posting updated successfully!');

      // Dismiss modal
      const closeBtn = document.querySelector('#edit_post .custom-btn-close') as HTMLElement;
      if (closeBtn) closeBtn.click();

      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update job');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteJob = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await apiClient.delete(`/job-postings/${id}`);
      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete job');
    }
  };

  const handleShareLink = (id?: number) => {
    if (!id) return;
    const publicUrl = `${window.location.origin}/careers/job/${id}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      alert(`Public Candidate Job Share Link copied to clipboard!\n\n${publicUrl}`);
    }).catch(() => {
      prompt("Copy public job link:", publicUrl);
    });
  };

  const userObj = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const userRole = userObj?.role || '';
  const canManageJobs = ['COMPANY_ADMIN', 'HR', 'MANAGER'].includes(userRole);

  const data: Job[] = jobsList;
  const columns = [
    {
      title: "Job ID",
      dataIndex: "Job_ID",
      sorter: (a: Job, b: Job) => a.Job_ID.length - b.Job_ID.length,
    },
    {
      title: "Job Title",
      dataIndex: "Job_Title",
      render: (_text: string, record: Job) => (
        <div className="d-flex align-items-center file-name-icon">
          <div className="avatar avatar-md bg-light rounded overflow-hidden flex-shrink-0">
            {record.bannerUrl ? (
              <img
                src={record.bannerUrl.startsWith('http') ? record.bannerUrl : `${apiClient.defaults.baseURL || ''}${record.bannerUrl}`}
                className="img-fluid rounded"
                alt={record.Job_Title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <ImageWithBasePath
                src={`assets/img/icons/${record.Image}`}
                className="img-fluid rounded-circle"
                alt={record.Job_Title}
              />
            )}
          </div>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{record.Job_Title}</Link>
            </h6>
            <span className="d-block mt-1 text-muted fs-12">{record.Roll}</span>
          </div>
        </div>
      ),
      sorter: (a: Job, b: Job) => a.Job_Title.length - b.Job_Title.length,
    },
    {
      title: "Category",
      dataIndex: "Category",
      sorter: (a: Job, b: Job) => a.Category.length - b.Category.length,
    },
    {
      title: "Location",
      dataIndex: "Location",
      sorter: (a: Job, b: Job) => a.Location.length - b.Location.length,
    },
    {
      title: "Salary Range",
      dataIndex: "Salary_Range",
      sorter: (a: Job, b: Job) => a.Salary_Range.length - b.Salary_Range.length,
    },
    {
      title: "Posted Date",
      dataIndex: "Posted_Date",
      sorter: (a: Job, b: Job) => a.Posted_Date.length - b.Posted_Date.length,
    },
    {
      title: "Action",
      dataIndex: "actions",
      render: (_text: string, record: Job) => (
        <div className="action-icon d-inline-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-icon btn-sm text-info border-0 bg-transparent"
            onClick={() => handleShareLink(record.id)}
            title="Copy Public Share Link"
          >
            <i className="ti ti-share fs-16" />
          </button>
          {canManageJobs && (
            <>
              <button
                type="button"
                className="btn btn-icon btn-sm text-primary border-0 bg-transparent"
                data-bs-toggle="modal"
                data-bs-target="#edit_post"
                onClick={() => handleOpenEditModal(record)}
                title="Edit Job"
              >
                <i className="ti ti-edit fs-16" />
              </button>
              <button
                type="button"
                className="btn btn-icon btn-sm text-danger border-0 bg-transparent"
                onClick={() => handleDeleteJob(record.id)}
                title="Delete Job"
              >
                <i className="ti ti-trash fs-16" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Jobs</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Recruitment</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Jobs
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={all_routes.joblist}
                    className="btn btn-icon btn-sm active bg-primary text-white me-1"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link to={all_routes.jobgrid} className="btn btn-icon btn-sm">
                    <i className="ti ti-layout-grid" />
                  </Link>
                </div>
              </div>
              {canManageJobs && (
                <div className="mb-2">
                  <button
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#add_post"
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <i className="ti ti-circle-plus me-2" />
                    Post job
                  </button>
                </div>
              )}
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Job List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-3">
                  <div className="input-icon position-relative">
                    <PredefinedDateRanges />
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <Table dataSource={data} columns={columns} Selection={true} />
            </div>
          </div>
        </div>
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR.</p>
        </div>
      </div>
      {/* /Page Wrapper */}

      {/* Post Job Modal */}
      <div className="modal fade" id="add_post">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Post Job</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleCreateJob}>
              <div className="modal-body pb-0">
                <div className="row">
                  {/* Job Banner Upload Box */}
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-semibold">Upload Job Banner Image</label>
                    <div className="d-flex align-items-center flex-wrap gap-3 bg-light w-100 rounded p-3">
                      <div className="border rounded bg-white overflow-hidden d-flex align-items-center justify-content-center" style={{ width: '140px', height: '80px' }}>
                        {newBannerPreview ? (
                          <img src={newBannerPreview} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span className="text-muted fs-12 text-center p-1"><i className="ti ti-photo fs-20 d-block mb-1"></i>No Banner</span>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control form-control-sm"
                          onChange={handleNewBannerChange}
                        />
                        <span className="fs-12 text-muted mt-1 d-block">Recommended size: 1200x400 px (PNG, JPG, WebP)</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Job Title <span className="text-danger"> *</span>
                      </label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={newTitle} 
                        onChange={(e) => setNewTitle(e.target.value)} 
                        required 
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Job Description <span className="text-danger"> *</span>
                      </label>
                      <textarea
                        rows={3}
                        className="form-control"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Enter detailed job description..."
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Vacancies <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={newVacancies}
                        onChange={(e) => setNewVacancies(e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Location <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="e.g. Mumbai / Remote / Hybrid"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Min. Salary (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={newMinSalary}
                        onChange={(e) => setNewMinSalary(e.target.value)}
                        placeholder="e.g. 500000"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Max. Salary (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={newMaxSalary}
                        onChange={(e) => setNewMaxSalary(e.target.value)}
                        placeholder="e.g. 1200000"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Post Job */}

      {/* Edit Post Modal */}
      <div className="modal fade" id="edit_post">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Job Posting</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdateJob}>
              <div className="modal-body pb-0">
                <div className="row">
                  {/* Job Banner Upload Box */}
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-semibold">Job Banner Image</label>
                    <div className="d-flex align-items-center flex-wrap gap-3 bg-light w-100 rounded p-3">
                      <div className="border rounded bg-white overflow-hidden d-flex align-items-center justify-content-center" style={{ width: '140px', height: '80px' }}>
                        {editBannerPreview ? (
                          <img
                            src={editBannerPreview.startsWith('blob:') || editBannerPreview.startsWith('http') ? editBannerPreview : `${apiClient.defaults.baseURL || ''}${editBannerPreview}`}
                            alt="Banner Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span className="text-muted fs-12 text-center p-1"><i className="ti ti-photo fs-20 d-block mb-1"></i>No Banner</span>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control form-control-sm"
                          onChange={handleEditBannerChange}
                        />
                        <span className="fs-12 text-muted mt-1 d-block">Upload new banner image if you wish to change it.</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Job Title <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Job Description <span className="text-danger"> *</span>
                      </label>
                      <textarea
                        rows={3}
                        className="form-control"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Vacancies</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editVacancies}
                        onChange={(e) => setEditVacancies(e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="OPEN">Open</option>
                        <option value="DRAFT">Draft</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Min. Salary (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editMinSalary}
                        onChange={(e) => setEditMinSalary(e.target.value)}
                        placeholder="e.g. 500000"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Max. Salary (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editMaxSalary}
                        onChange={(e) => setEditMaxSalary(e.target.value)}
                        placeholder="e.g. 1200000"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Post Modal */}
    </>
  );
};

export default JobList;
