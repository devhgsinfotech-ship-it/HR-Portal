import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import Table from "../../../core/common/dataTable/index";
import CommonSelect, { Option } from "../../../core/common/commonSelect";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import apiClient from "../../../core/utils/apiClient";
import dayjs from "dayjs";

export interface CompanyPolicyItem {
  id: number;
  title: string;
  description?: string | null;
  departmentId?: number | null;
  department?: { id: number; name: string } | null;
  policyDate?: string | null;
  documentUrl?: string | null;
  status: string;
  createdAt?: string;
}

const statusOptions: Option[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const Policy = () => {
  const routes = all_routes;
  const [policies, setPolicies] = useState<CompanyPolicyItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("Recently Added");

  // Selected policy for Edit & Delete
  const [selectedPolicy, setSelectedPolicy] = useState<CompanyPolicyItem | null>(null);
  const [policyToDelete, setPolicyToDelete] = useState<CompanyPolicyItem | null>(null);

  // Add Modal Form State
  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addDeptId, setAddDeptId] = useState<number | null>(null);
  const [addDate, setAddDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [addStatus, setAddStatus] = useState("ACTIVE");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal Form State
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeptId, setEditDeptId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Download / View in progress
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);

  // Delete Loading
  const [deleteLoading, setDeleteLoading] = useState(false);

  const closeAddBtnRef = useRef<HTMLButtonElement>(null);
  const closeEditBtnRef = useRef<HTMLButtonElement>(null);
  const closeDeleteBtnRef = useRef<HTMLButtonElement>(null);

  const fetchPoliciesAndMeta = async () => {
    try {
      setLoading(true);
      const [policiesRes, metaRes] = await Promise.all([
        apiClient.get("/api/policies"),
        apiClient.get("/api/policies/metadata"),
      ]);
      setPolicies(policiesRes.data || []);
      setDepartments(metaRes.data?.departments || []);
    } catch (err) {
      console.error("Failed to fetch policies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoliciesAndMeta();
  }, []);

  useEffect(() => {
    if (selectedPolicy) {
      setEditTitle(selectedPolicy.title || "");
      setEditDescription(selectedPolicy.description || "");
      setEditDeptId(selectedPolicy.departmentId || null);
      setEditDate(
        selectedPolicy.policyDate
          ? dayjs(selectedPolicy.policyDate).format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD")
      );
      setEditStatus(selectedPolicy.status || "ACTIVE");
      setEditFile(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      setEditError(null);
    }
  }, [selectedPolicy]);

  const departmentOptions: Option[] = [
    { value: "ALL", label: "All Departments" },
    ...departments.map((d) => ({ value: String(d.id), label: d.name })),
  ];

  // 1. Download Policy PDF file
  const handleDownloadPolicyPdf = async (policy: CompanyPolicyItem) => {
    try {
      setDownloadingId(policy.id);
      const res = await apiClient.get(`/api/policies/${policy.id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const safeTitle = (policy.title || "policy")
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      link.setAttribute("download", `${safeTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert("Failed to download policy PDF. Please check server logs or try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  // 2. View / Preview Policy PDF file in new browser tab
  const handleViewPolicyPdf = async (policy: CompanyPolicyItem) => {
    try {
      setViewingId(policy.id);
      const res = await apiClient.get(`/api/policies/${policy.id}/download?inline=true`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl, "_blank");
    } catch (err) {
      console.error("Failed to preview PDF:", err);
      alert("Failed to preview policy PDF document. Please try again.");
    } finally {
      setViewingId(null);
    }
  };

  // 3. Create Policy with optional PDF file upload
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim()) {
      setAddError("Please enter a policy name.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);

      const formData = new FormData();
      formData.append("title", addTitle.trim());
      if (addDescription.trim()) formData.append("description", addDescription.trim());
      if (addDeptId) formData.append("departmentId", String(addDeptId));
      if (addDate) formData.append("policyDate", addDate);
      formData.append("status", addStatus);
      if (addFile) {
        formData.append("file", addFile);
      }

      await apiClient.post("/api/policies", formData);

      setAddTitle("");
      setAddDescription("");
      setAddDeptId(null);
      setAddFile(null);
      if (addFileInputRef.current) addFileInputRef.current.value = "";
      closeAddBtnRef.current?.click();
      fetchPoliciesAndMeta();
    } catch (err: any) {
      console.error("Failed to create policy:", err);
      setAddError(err.response?.data?.message || "Failed to create policy");
    } finally {
      setAddLoading(false);
    }
  };

  // 4. Update Policy with optional PDF replacement
  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    if (!editTitle.trim()) {
      setEditError("Please enter a policy name.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);

      const formData = new FormData();
      formData.append("title", editTitle.trim());
      if (editDescription.trim()) formData.append("description", editDescription.trim());
      formData.append("departmentId", editDeptId ? String(editDeptId) : "ALL");
      if (editDate) formData.append("policyDate", editDate);
      formData.append("status", editStatus);
      if (editFile) {
        formData.append("file", editFile);
      }

      await apiClient.put(`/api/policies/${selectedPolicy.id}`, formData);

      setEditFile(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      closeEditBtnRef.current?.click();
      fetchPoliciesAndMeta();
    } catch (err: any) {
      console.error("Failed to update policy:", err);
      setEditError(err.response?.data?.message || "Failed to update policy");
    } finally {
      setEditLoading(false);
    }
  };

  // 5. Delete Policy
  const handleDeletePolicy = async () => {
    if (!policyToDelete) return;
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/api/policies/${policyToDelete.id}`);
      closeDeleteBtnRef.current?.click();
      fetchPoliciesAndMeta();
    } catch (err: any) {
      console.error("Failed to delete policy:", err);
      alert("Failed to delete policy: " + (err.response?.data?.message || err.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter & Sort
  const filteredPolicies = useMemo(() => {
    let result = [...policies];

    if (selectedDeptFilter !== "ALL") {
      result = result.filter(
        (p) => String(p.departmentId) === String(selectedDeptFilter)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.department?.name?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "Ascending") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "Descending") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [policies, selectedDeptFilter, searchQuery, sortBy]);

  const columns = [
    {
      title: "Policy Name",
      dataIndex: "title",
      render: (text: string, record: CompanyPolicyItem) => (
        <div>
          <h6 className="fw-medium fs-14 text-dark mb-0">{text}</h6>
          <small className="text-muted d-flex align-items-center mt-1">
            <i className="ti ti-file-text me-1 text-primary" />
            {record.documentUrl?.startsWith("/uploads/policies/") ? "Custom PDF Uploaded" : "Official Policy PDF"}
          </small>
        </div>
      ),
      sorter: (a: CompanyPolicyItem, b: CompanyPolicyItem) => a.title.localeCompare(b.title),
    },
    {
      title: "Department",
      dataIndex: "department",
      render: (_: any, record: CompanyPolicyItem) => (
        <span
          className={`badge ${
            record.department?.name
              ? "badge-info-transparent"
              : "badge-purple-transparent"
          } badge-xs`}
        >
          {record.department?.name || "All Departments"}
        </span>
      ),
      sorter: (a: CompanyPolicyItem, b: CompanyPolicyItem) =>
        (a.department?.name || "All").localeCompare(b.department?.name || "All"),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text: string | null) => (
        <span className="text-muted small">
          {text ? (text.length > 70 ? `${text.substring(0, 70)}...` : text) : "—"}
        </span>
      ),
    },
    {
      title: "Effective Date",
      dataIndex: "policyDate",
      render: (date: string | null) => (
        <span className="small text-nowrap">
          <i className="ti ti-calendar me-1 text-muted" />
          {date ? dayjs(date).format("DD MMM YYYY") : "—"}
        </span>
      ),
      sorter: (a: CompanyPolicyItem, b: CompanyPolicyItem) =>
        (a.policyDate || "").localeCompare(b.policyDate || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        const isActive = status?.toUpperCase() === "ACTIVE";
        return (
          <span
            className={`badge ${
              isActive ? "badge-success" : "badge-secondary"
            } d-inline-flex align-items-center badge-xs`}
          >
            <i className="ti ti-point-filled me-1" />
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
      sorter: (a: CompanyPolicyItem, b: CompanyPolicyItem) =>
        (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "Document (PDF)",
      dataIndex: "documentUrl",
      render: (_: any, record: CompanyPolicyItem) => {
        const isDownloading = downloadingId === record.id;
        const isViewing = viewingId === record.id;

        return (
          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-outline-primary btn-xs d-inline-flex align-items-center"
              onClick={() => handleViewPolicyPdf(record)}
              disabled={isViewing || isDownloading}
              title="Preview policy PDF in new tab"
            >
              {isViewing ? (
                <span className="spinner-border spinner-border-sm me-1" role="status" />
              ) : (
                <i className="ti ti-eye me-1" />
              )}
              View
            </button>
            <button
              type="button"
              className="btn btn-primary btn-xs d-inline-flex align-items-center"
              onClick={() => handleDownloadPolicyPdf(record)}
              disabled={isDownloading || isViewing}
              title="Download official policy PDF document"
            >
              {isDownloading ? (
                <span className="spinner-border spinner-border-sm me-1" role="status" />
              ) : (
                <i className="ti ti-download me-1" />
              )}
              Download
            </button>
          </div>
        );
      },
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: CompanyPolicyItem) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2 text-primary"
            data-bs-toggle="modal"
            data-bs-target="#edit_policy"
            onClick={() => setSelectedPolicy(record)}
            title="Edit Policy"
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            className="text-danger"
            data-bs-toggle="modal"
            data-bs-target="#delete_policy_modal"
            onClick={() => setPolicyToDelete(record)}
            title="Delete Policy"
          >
            <i className="ti ti-trash" />
          </Link>
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
              <h2 className="mb-1">Policies</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">HRM</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Policies
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_policy"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Policy
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Policies Card */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Company Policies List ({filteredPolicies.length})</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                {/* Search */}
                <div className="input-group input-group-sm me-2" style={{ width: "220px" }}>
                  <span className="input-group-text bg-white">
                    <i className="ti ti-search text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search policy..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setSearchQuery("")}
                    >
                      <i className="ti ti-x" />
                    </button>
                  )}
                </div>

                {/* Department Filter */}
                <select
                  className="form-select form-select-sm"
                  style={{ width: "160px" }}
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>

                {/* Sort Dropdown */}
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center btn-sm"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : {sortBy}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <button
                        type="button"
                        className={`dropdown-item rounded-1 ${
                          sortBy === "Recently Added" ? "active" : ""
                        }`}
                        onClick={() => setSortBy("Recently Added")}
                      >
                        Recently Added
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`dropdown-item rounded-1 ${
                          sortBy === "Ascending" ? "active" : ""
                        }`}
                        onClick={() => setSortBy("Ascending")}
                      >
                        Ascending
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`dropdown-item rounded-1 ${
                          sortBy === "Descending" ? "active" : ""
                        }`}
                        onClick={() => setSortBy("Descending")}
                      >
                        Descending
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading Policies...</p>
                </div>
              ) : (
                <Table
                  dataSource={filteredPolicies.map((p) => ({ ...p, key: String(p.id) }))}
                  columns={columns}
                  Selection={false}
                />
              )}
            </div>
          </div>
          {/* /Policies Card */}
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
      {/* /Page Wrapper */}

      {/* Add Policy Modal */}
      <div className="modal fade" id="add_policy" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Company Policy</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ref={closeAddBtnRef}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleCreatePolicy}>
              <div className="modal-body pb-0">
                {addError && (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    <i className="ti ti-alert-triangle me-1" />
                    {addError}
                  </div>
                )}
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Policy Name / Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Information Security & Data Protection"
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Target Department</label>
                      <CommonSelect
                        className="select"
                        options={departmentOptions}
                        defaultValue={departmentOptions[0]}
                        onChange={(opt) =>
                          setAddDeptId(opt?.value && opt.value !== "ALL" ? parseInt(opt.value) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Effective Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={addDate}
                        onChange={(e) => setAddDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={statusOptions}
                        defaultValue={statusOptions[0]}
                        onChange={(opt) => setAddStatus(opt?.value || "ACTIVE")}
                      />
                    </div>
                  </div>

                  {/* PDF Document Upload Area */}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label fw-medium d-flex justify-content-between">
                        <span>
                          Policy Document (PDF) <span className="text-muted fs-12">(Optional)</span>
                        </span>
                        <span className="text-muted fs-11">Max 25MB • .pdf</span>
                      </label>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={addFileInputRef}
                        accept="application/pdf,.pdf"
                        className="d-none"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
                              alert("Please select a valid PDF file.");
                              return;
                            }
                            setAddFile(file);
                          }
                        }}
                      />

                      {!addFile ? (
                        <div
                          className="border border-2 border-dashed rounded p-3 text-center bg-light cursor-pointer"
                          onClick={() => addFileInputRef.current?.click()}
                          style={{ cursor: "pointer", borderColor: "#cbd5e1" }}
                        >
                          <i className="ti ti-file-upload fs-28 text-primary d-block mb-1" />
                          <p className="fw-medium text-dark mb-1 fs-13">
                            Click to upload official policy document
                          </p>
                          <span className="text-muted fs-11">
                            Click here to browse and select a PDF file from your device
                          </span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between p-2 rounded border bg-light-50">
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm bg-danger-transparent text-danger rounded me-2 d-flex align-items-center justify-content-center">
                              <i className="ti ti-file-type-pdf fs-20" />
                            </div>
                            <div>
                              <h6 className="fs-13 fw-medium mb-0 text-dark text-truncate" style={{ maxWidth: 380 }}>
                                {addFile.name}
                              </h6>
                              <small className="text-muted fs-11">
                                {(addFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document ready
                              </small>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-xs"
                            onClick={() => {
                              setAddFile(null);
                              if (addFileInputRef.current) addFileInputRef.current.value = "";
                            }}
                          >
                            <i className="ti ti-trash me-1" /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Policy Summary / Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Key rules, compliance guidelines, and employee expectations"
                        value={addDescription}
                        onChange={(e) => setAddDescription(e.target.value)}
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
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                      Saving Policy...
                    </>
                  ) : (
                    "Add Policy"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Policy Modal */}

      {/* Edit Policy Modal */}
      <div className="modal fade" id="edit_policy" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Company Policy</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ref={closeEditBtnRef}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdatePolicy}>
              <div className="modal-body pb-0">
                {editError && (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    <i className="ti ti-alert-triangle me-1" />
                    {editError}
                  </div>
                )}
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Policy Name / Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Target Department</label>
                      <CommonSelect
                        className="select"
                        options={departmentOptions}
                        defaultValue={
                          departmentOptions.find(
                            (o) => o.value === String(editDeptId || "ALL")
                          ) || departmentOptions[0]
                        }
                        onChange={(opt) =>
                          setEditDeptId(opt?.value && opt.value !== "ALL" ? parseInt(opt.value) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Effective Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={statusOptions}
                        defaultValue={
                          statusOptions.find((o) => o.value === editStatus) || statusOptions[0]
                        }
                        onChange={(opt) => setEditStatus(opt?.value || "ACTIVE")}
                      />
                    </div>
                  </div>

                  {/* Edit PDF Document Upload Area */}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label fw-medium d-flex justify-content-between">
                        <span>Update Policy Document (PDF)</span>
                        <span className="text-muted fs-11">Max 25MB • .pdf</span>
                      </label>

                      {/* Current Document indicator if exists */}
                      {selectedPolicy?.documentUrl && !editFile && (
                        <div className="d-flex align-items-center justify-content-between p-2 mb-2 rounded border bg-light">
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-xs bg-primary-transparent text-primary rounded me-2 d-flex align-items-center justify-content-center">
                              <i className="ti ti-file-check fs-16" />
                            </div>
                            <div>
                              <span className="fs-12 fw-medium text-dark">Current Document Attached</span>
                              <div className="text-muted fs-11 text-truncate" style={{ maxWidth: 300 }}>
                                {selectedPolicy.documentUrl}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-xs"
                            onClick={() => handleViewPolicyPdf(selectedPolicy)}
                          >
                            <i className="ti ti-eye me-1" /> Preview Current
                          </button>
                        </div>
                      )}

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={editFileInputRef}
                        accept="application/pdf,.pdf"
                        className="d-none"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
                              alert("Please select a valid PDF file.");
                              return;
                            }
                            setEditFile(file);
                          }
                        }}
                      />

                      {!editFile ? (
                        <div
                          className="border border-2 border-dashed rounded p-3 text-center bg-light cursor-pointer"
                          onClick={() => editFileInputRef.current?.click()}
                          style={{ cursor: "pointer", borderColor: "#cbd5e1" }}
                        >
                          <i className="ti ti-upload fs-28 text-primary d-block mb-1" />
                          <p className="fw-medium text-dark mb-1 fs-13">
                            {selectedPolicy?.documentUrl
                              ? "Click to upload a new PDF to replace existing document"
                              : "Click to upload policy document (.pdf)"}
                          </p>
                          <span className="text-muted fs-11">
                            Supported format: PDF up to 25MB
                          </span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-between p-2 rounded border bg-light-50">
                          <div className="d-flex align-items-center">
                            <div className="avatar avatar-sm bg-danger-transparent text-danger rounded me-2 d-flex align-items-center justify-content-center">
                              <i className="ti ti-file-type-pdf fs-20" />
                            </div>
                            <div>
                              <h6 className="fs-13 fw-medium mb-0 text-dark text-truncate" style={{ maxWidth: 380 }}>
                                {editFile.name}
                              </h6>
                              <small className="text-muted fs-11">
                                {(editFile.size / 1024 / 1024).toFixed(2)} MB • New PDF will replace current file on save
                              </small>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-xs"
                            onClick={() => {
                              setEditFile(null);
                              if (editFileInputRef.current) editFileInputRef.current.value = "";
                            }}
                          >
                            <i className="ti ti-trash me-1" /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Policy Summary / Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
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
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Policy Modal */}

      {/* Delete Policy Modal */}
      <div className="modal fade" id="delete_policy_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Delete Policy</h4>
              <p className="mb-3 text-muted">
                Are you sure you want to delete policy{" "}
                <strong>{policyToDelete?.title || "this policy"}</strong>? This action cannot be
                undone.
              </p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                  ref={closeDeleteBtnRef}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePolicy}
                  className="btn btn-danger"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Policy Modal */}
    </>
  );
};

export default Policy;
