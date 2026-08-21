import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../core/common/dataTable/index";
import apiClient from "../../../core/utils/apiClient";
import { useAppSelector } from "../../../core/data/redux/store";
import CommonTextEditor from "../../../core/common/textEditor";

interface Client {
  id: number;
  companyName: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  Name?: string;
}

interface ProjectMember {
  id: number;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    profilePhotoUrl: string | null;
  };
}

interface ProjectItem {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: number | null;
  priority: string;
  health: string;
  status: string;
  attachmentUrl?: string | null;
  logoUrl?: string | null;
  client: Client | null;
  manager: Employee | null;
  members: ProjectMember[];
}

const ProjectList = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  // Scopes & Permission check
  const canReadFinance = currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'HR' ||
    currentUser?.role === 'MANAGER' ||
    currentUser?.permissions?.some(p => p.module === 'FINANCE' && p.canRead);

  const canWriteProjects = currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'HR' ||
    currentUser?.role === 'MANAGER' ||
    currentUser?.permissions?.some(p => p.module === 'PROJECTS' && p.canWrite);

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // New Project Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [health, setHealth] = useState("GOOD");
  const [projectStatus, setProjectStatus] = useState("ACTIVE");

  // Edit Project State
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editClientId, setEditClientId] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editHealth, setEditHealth] = useState("GOOD");
  const [editProjectStatus, setEditProjectStatus] = useState("ACTIVE");

  // Tab & Member Allocations State
  const [addActiveTab, setAddActiveTab] = useState<"basic" | "members">("basic");
  const [editActiveTab, setEditActiveTab] = useState<"basic" | "members">("basic");
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [editMemberIds, setEditMemberIds] = useState<number[]>([]);

  // Attachments & Logo State
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [editAttachmentUrl, setEditAttachmentUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [message, setMessage] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/projects");
      if (res.data?.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [clientRes, empRes] = await Promise.all([
        apiClient.get("/api/clients"),
        apiClient.get("/employees")
      ]);
      if (clientRes.data?.success) {
        setClients(clientRes.data.data);
      }
      if (Array.isArray(empRes.data)) {
        setEmployees(empRes.data.map(emp => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          Name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
        })));
      }
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchMetadata();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setMessage("");
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post("/api/projects/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        if (isEdit) {
          setEditAttachmentUrl(res.data.url);
        } else {
          setAttachmentUrl(res.data.url);
        }
      }
    } catch (err: any) {
      console.error("File upload failed:", err);
      setMessage(err.response?.data?.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploading(true);
      setMessage("");
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post("/api/projects/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        if (isEdit) {
          setEditLogoUrl(res.data.url);
        } else {
          setLogoUrl(res.data.url);
        }
      }
    } catch (err: any) {
      console.error("Logo upload failed:", err);
      setMessage(err.response?.data?.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId) return;
    try {
      setMessage("");
      const payload = {
        name,
        description,
        clientId: parseInt(clientId, 10),
        projectManagerId: managerId ? parseInt(managerId, 10) : null,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        budget: budget ? parseFloat(budget) : null,
        priority,
        health,
        status: projectStatus,
        memberIds: memberIds,
        attachmentUrl: attachmentUrl,
        logoUrl: logoUrl
      };

      const res = await apiClient.post("/api/projects", payload);
      if (res.data?.success) {
        // Reset state
        setName("");
        setDescription("");
        setClientId("");
        setManagerId("");
        setStartDate("");
        setEndDate("");
        setBudget("");
        setPriority("MEDIUM");
        setHealth("GOOD");
        setProjectStatus("ACTIVE");
        setMemberIds([]);
        setAddActiveTab("basic");
        setAttachmentUrl("");
        setLogoUrl("");

        // Refresh
        fetchProjects();

        // Close modal helper
        const closeBtn = document.getElementById("close-add-project-modal");
        if (closeBtn) closeBtn.click();
      }
    } catch (err: any) {
      console.error("Failed to create project:", err);
      setMessage(err.response?.data?.message || "Failed to create project.");
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await apiClient.delete(`/api/projects/${projectId}`);
      if (res.data?.success) {
        fetchProjects();
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleStartEdit = (proj: ProjectItem) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditDescription(proj.description || "");
    setEditClientId(proj.client ? String(proj.client.id) : "");
    setEditManagerId(proj.manager ? String(proj.manager.id) : "");
    setEditStartDate(proj.startDate ? proj.startDate.split('T')[0] : "");
    setEditEndDate(proj.endDate ? proj.endDate.split('T')[0] : "");
    setEditBudget(proj.budget ? String(proj.budget) : "");
    setEditPriority(proj.priority);
    setEditHealth(proj.health || "GOOD");
    setEditProjectStatus(proj.status);
    setEditMemberIds(proj.members ? proj.members.map(m => m.employee.id) : []);
    setEditActiveTab("basic");
    setEditAttachmentUrl(proj.attachmentUrl || "");
    setEditLogoUrl(proj.logoUrl || "");
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName || !editClientId) return;
    try {
      setMessage("");
      const payload = {
        name: editName,
        description: editDescription,
        clientId: parseInt(editClientId, 10),
        projectManagerId: editManagerId ? parseInt(editManagerId, 10) : null,
        startDate: editStartDate || new Date().toISOString().split('T')[0],
        endDate: editEndDate || new Date().toISOString().split('T')[0],
        budget: editBudget ? parseFloat(editBudget) : null,
        priority: editPriority,
        healthStatus: editHealth,
        status: editProjectStatus,
        memberIds: editMemberIds,
        attachmentUrl: editAttachmentUrl,
        logoUrl: editLogoUrl
      };

      const res = await apiClient.put(`/api/projects/${editingProject.id}`, payload);
      if (res.data?.success) {
        fetchProjects();
        setEditMemberIds([]);
        setEditActiveTab("basic");
        setEditAttachmentUrl("");
        setEditLogoUrl("");
        const closeBtn = document.getElementById("close-edit-project-modal");
        if (closeBtn) closeBtn.click();
      }
    } catch (err: any) {
      console.error("Failed to update project:", err);
      setMessage(err.response?.data?.message || "Failed to update project.");
    }
  };

  const getPriorityLabel = (prio: string) => {
    switch (prio) {
      case "HIGH": return "High";
      case "MEDIUM": return "Medium";
      case "LOW": return "Low";
      default: return prio;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Active";
      case "INACTIVE": return "Inactive";
      case "ON_HOLD": return "On Hold";
      case "COMPLETED": return "Completed";
      default: return status;
    }
  };

  // Filter projects local logic
  const filteredProjects = projects.filter((project) => {
    if (statusFilter !== "ALL" && project.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && project.priority !== priorityFilter) return false;
    return true;
  });

  const columns: any[] = [
    {
      title: "Project ID",
      dataIndex: "id",
      render: (id: number) => (
        <Link to={`${all_routes.projectdetails}?id=${id}`} className="text-primary fw-semibold">
          PRO-{id.toString().padStart(3, '0')}
        </Link>
      ),
      sorter: (a: ProjectItem, b: ProjectItem) => a.id - b.id,
    },
    {
      title: "Project Name",
      dataIndex: "name",
      render: (name: string, record: ProjectItem) => (
        <div className="d-flex align-items-center">
          {record.logoUrl ? (
            <img
              src={`${apiClient.defaults.baseURL || ''}${record.logoUrl}`}
              alt="logo"
              className="rounded border me-2 flex-shrink-0"
              style={{ width: "28px", height: "28px", objectFit: "cover" }}
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center bg-light rounded text-muted border me-2 flex-shrink-0" style={{ width: "28px", height: "28px" }}>
              <i className="ti ti-folder fs-14" />
            </div>
          )}
          <h6 className="fw-semibold mb-0">
            <Link to={`${all_routes.projectdetails}?id=${record.id}`} className="text-dark hover-primary">
              {name}
            </Link>
          </h6>
        </div>
      ),
      sorter: (a: ProjectItem, b: ProjectItem) => a.name.localeCompare(b.name),
    },
    {
      title: "Leader",
      dataIndex: "manager",
      render: (manager: any) => {
        if (!manager) return <span className="text-muted">Unassigned</span>;
        const fullName = `${manager.firstName || ''} ${manager.lastName || ''}`.trim();
        return (
          <div className="d-flex align-items-center">
            <div className="avatar avatar-xs rounded-circle me-2 flex-shrink-0" style={{ width: "24px", height: "24px" }}>
              {manager.profilePhotoUrl ? (
                <img src={`${apiClient.defaults.baseURL || ''}${manager.profilePhotoUrl}`} alt="avatar" className="rounded-circle" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="bg-light rounded-circle text-muted d-flex align-items-center justify-content-center fw-semibold text-uppercase" style={{ width: "100%", height: "100%", fontSize: "10px" }}>
                  {fullName.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-dark fw-medium fs-13">{fullName}</span>
          </div>
        );
      },
      sorter: (a: ProjectItem, b: ProjectItem) => (a.manager?.firstName || "").localeCompare(b.manager?.firstName || ""),
    },
    {
      title: "Team",
      dataIndex: "members",
      render: (members: ProjectMember[]) => {
        if (!members || members.length === 0) return <span className="text-muted">--</span>;
        const limit = 3;
        const displayMembers = members.slice(0, limit);
        const remaining = members.length - limit;
        return (
          <div className="avatar-list-stacked d-flex align-items-center">
            {displayMembers.map((m, idx) => {
              const emp = m.employee;
              if (!emp) return null;
              const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
              return (
                <div
                  key={idx}
                  className="avatar avatar-xs rounded-circle border border-white flex-shrink-0"
                  style={{
                    width: "24px",
                    height: "24px",
                    marginLeft: idx > 0 ? "-8px" : "0",
                    zIndex: 10 - idx
                  }}
                  title={fullName}
                >
                  {emp.profilePhotoUrl ? (
                    <img src={`${apiClient.defaults.baseURL || ''}${emp.profilePhotoUrl}`} alt="avatar" className="rounded-circle" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center fw-semibold text-uppercase" style={{ width: "100%", height: "100%", fontSize: "10px" }}>
                      {fullName.charAt(0)}
                    </div>
                  )}
                </div>
              );
            })}
            {remaining > 0 && (
              <span
                className="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fs-10 ms-1"
                style={{ width: "24px", height: "24px", minWidth: "24px", zIndex: 1 }}
              >
                +{remaining}
              </span>
            )}
          </div>
        );
      }
    },
    {
      title: "Deadline",
      dataIndex: "endDate",
      render: (endDate: string) => {
        const d = new Date(endDate);
        return <span>{String(d.getDate()).padStart(2, '0')}/{String(d.getMonth() + 1).padStart(2, '0')}/{d.getFullYear()}</span>;
      },
      sorter: (a: ProjectItem, b: ProjectItem) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (priority: string) => {
        let dotColor = "bg-warning";
        let badgeClass = "bg-warning-transparent text-warning";
        if (priority === "HIGH") {
          dotColor = "bg-danger";
          badgeClass = "bg-danger-transparent text-danger";
        }
        if (priority === "LOW") {
          dotColor = "bg-success";
          badgeClass = "bg-success-transparent text-success";
        }
        return (
          <span className={`badge badge-sm ${badgeClass} d-inline-flex align-items-center`}>
            <span className={`${dotColor} rounded-circle d-inline-block me-1`} style={{ width: "6px", height: "6px" }} />
            {getPriorityLabel(priority)}
          </span>
        );
      },
      sorter: (a: ProjectItem, b: ProjectItem) => a.priority.localeCompare(b.priority),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        let badgeClass = "bg-success-transparent text-success";
        if (status === "INACTIVE") badgeClass = "bg-danger-transparent text-danger";
        if (status === "ON_HOLD") badgeClass = "bg-warning-transparent text-warning";
        if (status === "COMPLETED") badgeClass = "bg-info-transparent text-info";
        return <span className={`badge ${badgeClass}`}>{getStatusLabel(status)}</span>;
      },
      sorter: (a: ProjectItem, b: ProjectItem) => a.status.localeCompare(b.status),
    },
    ...(canWriteProjects ? [{
      title: "Action",
      dataIndex: "id",
      render: (id: number, record: ProjectItem) => (
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-icon btn-outline-light border text-dark"
            data-bs-toggle="modal"
            data-bs-target="#edit_project_modal"
            onClick={() => handleStartEdit(record)}
            title="Edit Project"
          >
            <i className="ti ti-edit fs-14" />
          </button>
          <button
            className="btn btn-sm btn-icon btn-outline-light border text-danger"
            onClick={() => handleDeleteProject(id)}
            title="Delete Project"
          >
            <i className="ti ti-trash fs-14" />
          </button>
        </div>
      )
    }] : [])
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Projects List</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Projects</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Projects List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 icon-list">
                  <Link to={all_routes.projectlist} className="btn btn-icon btn-sm active bg-primary text-white" title="List View">
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link to={all_routes.project} className="btn btn-icon btn-sm" title="Grid View">
                    <i className="ti ti-layout-grid" />
                  </Link>
                </div>
              </div>
              {canWriteProjects && (
                <div className="mb-2">
                  <button
                    data-bs-toggle="modal"
                    data-bs-target="#add_project"
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <i className="ti ti-circle-plus me-2" />
                    Add Project
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filtering */}
          <div className="card mb-3">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <h5>Projects Directory</h5>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <span className="fs-12 text-muted">Status:</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>

                  <span className="fs-12 text-muted ms-2">Priority:</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              <Table
                dataSource={filteredProjects}
                columns={columns}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      <div className="modal fade" id="add_project" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header header-border align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <h5 className="modal-title me-2 fw-semibold">Add Project</h5>
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                id="close-add-project-modal"
              />
            </div>

            <div className="p-3 pb-0">
              <ul className="progress-bar-wizard d-flex align-items-center border-bottom pb-2 mb-3" style={{ listStyle: "none", paddingLeft: 0, gap: "15px" }}>
                <li
                  className={`pb-1 ${addActiveTab === "basic" ? "active border-bottom border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setAddActiveTab("basic")}
                >
                  <h6 className="fw-medium mb-0" style={{ color: addActiveTab === "basic" ? "#ff5b35" : "#666" }}>Basic Information</h6>
                </li>
                <li
                  className={`pb-1 ${addActiveTab === "members" ? "active border-bottom border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setAddActiveTab("members")}
                >
                  <h6 className="fw-medium mb-0" style={{ color: addActiveTab === "members" ? "#ff5b35" : "#666" }}>Members</h6>
                </li>
              </ul>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="modal-body pt-0">
                {message && <div className="alert alert-danger mb-3">{message}</div>}
                {addActiveTab === "basic" && (
                  <div className="row animate__animated animate__fadeIn">
                    <div className="col-md-12 mb-3">
                      <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-2">
                        <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-3 flex-shrink-0 text-dark bg-white" style={{ width: "80px", height: "80px", border: "1px dashed #ccc" }}>
                          {logoUrl ? (
                            <img src={`${apiClient.defaults.baseURL || ''}${logoUrl}`} alt="logo" className="rounded-circle" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <i className="ti ti-photo text-gray-2 fs-24 text-muted" />
                          )}
                        </div>
                        <div className="profile-upload flex-grow-1">
                          <div className="mb-2">
                            <h6 className="mb-1 fw-semibold fs-14">Upload Project Logo</h6>
                            <p className="fs-12 text-muted mb-0">Image should be below 4 MB (PNG, JPG)</p>
                          </div>
                          <div className="profile-uploader d-flex align-items-center gap-2">
                            <div className="drag-upload-btn btn btn-sm btn-primary position-relative" style={{ overflow: "hidden" }}>
                              {logoUploading ? "Uploading..." : "Upload Logo"}
                              <input
                                type="file"
                                className="position-absolute top-0 start-0 opacity-0 w-100 h-100 cursor-pointer"
                                accept="image/*"
                                onChange={(e) => handleLogoUpload(e, false)}
                                style={{ cursor: "pointer" }}
                              />
                            </div>
                            {logoUrl && (
                              <button type="button" className="btn btn-light btn-sm text-danger" onClick={() => setLogoUrl("")}>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Project Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Website Overhaul"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Client <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Client --</option>
                        {clients.map(c => (
                          <option value={c.id} key={c.id}>{c.companyName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13">End Date (Deadline)</label>
                      <input
                        type="date"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    {canReadFinance && (
                      <div className="col-md-6 mb-3">
                        <label className="form-label fs-13">Project Value / Budget (₹ INR)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 500000"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13">Priority</label>
                      <select
                        className="form-select"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Description</label>
                      <CommonTextEditor
                        value={description}
                        onChange={(val) => setDescription(val)}
                        placeholder="Outline scope, goals and milestones..."
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Upload Document or PDF</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={(e) => handleFileUpload(e, false)}
                      />
                      {uploading && <small className="text-primary d-block mt-1">Uploading file...</small>}
                      {attachmentUrl && (
                        <div className="mt-1">
                          <small className="text-success">Uploaded successfully: </small>
                          <a href={`${apiClient.defaults.baseURL || ''}${attachmentUrl}`} target="_blank" rel="noreferrer" className="text-decoration-underline text-primary fs-12 ms-1">
                            Download Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {addActiveTab === "members" && (
                  <div className="row animate__animated animate__fadeIn">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13 me-2">Allocate Team Members</label>

                      {/* Tags display */}
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {memberIds.map(id => {
                          const emp = employees.find(e => e.id === id);
                          return (
                            <span key={id} className="badge bg-primary text-white p-2 d-inline-flex align-items-center gap-2">
                              {emp ? emp.Name : `ID: ${id}`}
                              <i
                                className="ti ti-x cursor-pointer fs-12"
                                style={{ cursor: "pointer" }}
                                onClick={() => setMemberIds(memberIds.filter(mId => mId !== id))}
                              />
                            </span>
                          );
                        })}
                      </div>

                      {/* Select to allocate */}
                      <select
                        className="form-select"
                        onChange={(e) => {
                          const idVal = parseInt(e.target.value, 10);
                          if (idVal && !memberIds.includes(idVal)) {
                            setMemberIds([...memberIds, idVal]);
                          }
                          e.target.value = ""; // Reset select
                        }}
                      >
                        <option value="">-- Click to allocate member --</option>
                        {employees
                          .filter(e => !memberIds.includes(e.id))
                          .map(e => (
                            <option value={e.id} key={e.id}>{e.Name}</option>
                          ))}
                      </select>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Project Manager</label>
                      <select
                        className="form-select"
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value)}
                      >
                        <option value="">-- Choose PM --</option>
                        {employees.map(e => (
                          <option value={e.id} key={e.id}>{e.Name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Status</label>
                      <select
                        className="form-select"
                        value={projectStatus}
                        onChange={(e) => setProjectStatus(e.target.value)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                {addActiveTab === "basic" ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!name || !clientId) {
                        setMessage("Please fill out the required fields (Project Name and Client) before proceeding.");
                        return;
                      }
                      setMessage("");
                      setAddActiveTab("members");
                    }}
                  >
                    Next: Add Members
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-success text-white"
                    disabled={!name || !clientId}
                  >
                    Create Project
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      <div className="modal fade" id="edit_project_modal" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header header-border align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <h5 className="modal-title me-2 fw-semibold">Edit Project</h5>
                {editingProject && (
                  <p className="text-dark mb-0 fs-12">Project ID: PRO-{editingProject.id.toString().padStart(4, "0")}</p>
                )}
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                id="close-edit-project-modal"
              />
            </div>

            <div className="p-3 pb-0">
              <ul className="progress-bar-wizard d-flex align-items-center border-bottom pb-2 mb-3" style={{ listStyle: "none", paddingLeft: 0, gap: "15px" }}>
                <li
                  className={`pb-1 ${editActiveTab === "basic" ? "active border-bottom border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditActiveTab("basic")}
                >
                  <h6 className="fw-medium mb-0" style={{ color: editActiveTab === "basic" ? "#ff5b35" : "#666" }}>Basic Information</h6>
                </li>
                <li
                  className={`pb-1 ${editActiveTab === "members" ? "active border-bottom border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditActiveTab("members")}
                >
                  <h6 className="fw-medium mb-0" style={{ color: editActiveTab === "members" ? "#ff5b35" : "#666" }}>Members</h6>
                </li>
              </ul>
            </div>

            <form onSubmit={handleUpdateProject}>
              <div className="modal-body pt-0">
                {message && <div className="alert alert-danger mb-3">{message}</div>}

                {editActiveTab === "basic" && (
                  <div className="row animate__animated animate__fadeIn">
                    <div className="col-md-12 mb-3">
                      <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-2">
                        <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-3 flex-shrink-0 text-dark bg-white" style={{ width: "80px", height: "80px", border: "1px dashed #ccc" }}>
                          {editLogoUrl ? (
                            <img src={`${apiClient.defaults.baseURL || ''}${editLogoUrl}`} alt="logo" className="rounded-circle" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <i className="ti ti-photo text-gray-2 fs-24 text-muted" />
                          )}
                        </div>
                        <div className="profile-upload flex-grow-1">
                          <div className="mb-2">
                            <h6 className="mb-1 fw-semibold fs-14">Upload Project Logo</h6>
                            <p className="fs-12 text-muted mb-0">Image should be below 4 MB (PNG, JPG)</p>
                          </div>
                          <div className="profile-uploader d-flex align-items-center gap-2">
                            <div className="drag-upload-btn btn btn-sm btn-primary position-relative" style={{ overflow: "hidden" }}>
                              {logoUploading ? "Uploading..." : "Upload Logo"}
                              <input
                                type="file"
                                className="position-absolute top-0 start-0 opacity-0 w-100 h-100 cursor-pointer"
                                accept="image/*"
                                onChange={(e) => handleLogoUpload(e, true)}
                                style={{ cursor: "pointer" }}
                              />
                            </div>
                            {editLogoUrl && (
                              <button type="button" className="btn btn-light btn-sm text-danger" onClick={() => setEditLogoUrl("")}>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Project Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Client <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={editClientId}
                        onChange={(e) => setEditClientId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Client --</option>
                        {clients.map(c => (
                          <option value={c.id} key={c.id}>{c.companyName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13">End Date (Deadline)</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                      />
                    </div>
                    {canReadFinance && (
                      <div className="col-md-6 mb-3">
                        <label className="form-label fs-13">Project Value / Budget (₹ INR)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editBudget}
                          onChange={(e) => setEditBudget(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13">Priority</label>
                      <select
                        className="form-select"
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Description</label>
                      <CommonTextEditor
                        value={editDescription}
                        onChange={(val) => setEditDescription(val)}
                        placeholder="Outline scope, goals and milestones..."
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Upload Document or PDF</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={(e) => handleFileUpload(e, true)}
                      />
                      {uploading && <small className="text-primary d-block mt-1">Uploading file...</small>}
                      {editAttachmentUrl && (
                        <div className="mt-1">
                          <small className="text-success">Uploaded successfully: </small>
                          <a href={`${apiClient.defaults.baseURL || ''}${editAttachmentUrl}`} target="_blank" rel="noreferrer" className="text-decoration-underline text-primary fs-12 ms-1">
                            Download Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {editActiveTab === "members" && (
                  <div className="row animate__animated animate__fadeIn">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13 me-2">Allocate Team Members</label>

                      {/* Tags display */}
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {editMemberIds.map(id => {
                          const emp = employees.find(e => e.id === id);
                          return (
                            <span key={id} className="badge bg-primary text-white p-2 d-inline-flex align-items-center gap-2">
                              {emp ? emp.Name : `ID: ${id}`}
                              <i
                                className="ti ti-x cursor-pointer fs-12"
                                style={{ cursor: "pointer" }}
                                onClick={() => setEditMemberIds(editMemberIds.filter(mId => mId !== id))}
                              />
                            </span>
                          );
                        })}
                      </div>

                      {/* Select to allocate */}
                      <select
                        className="form-select"
                        onChange={(e) => {
                          const idVal = parseInt(e.target.value, 10);
                          if (idVal && !editMemberIds.includes(idVal)) {
                            setEditMemberIds([...editMemberIds, idVal]);
                          }
                          e.target.value = ""; // Reset select
                        }}
                      >
                        <option value="">-- Click to allocate member --</option>
                        {employees
                          .filter(e => !editMemberIds.includes(e.id))
                          .map(e => (
                            <option value={e.id} key={e.id}>{e.Name}</option>
                          ))}
                      </select>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Project Manager</label>
                      <select
                        className="form-select"
                        value={editManagerId}
                        onChange={(e) => setEditManagerId(e.target.value)}
                      >
                        <option value="">-- Choose PM --</option>
                        {employees.map(e => (
                          <option value={e.id} key={e.id}>{e.Name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Status</label>
                      <select
                        className="form-select"
                        value={editProjectStatus}
                        onChange={(e) => setEditProjectStatus(e.target.value)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                 {editActiveTab === "basic" ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!editName || !editClientId) {
                        setMessage("Please fill out the required fields (Project Name and Client) before proceeding.");
                        return;
                      }
                      setMessage("");
                      setEditActiveTab("members");
                    }}
                  >
                    Next: Manage Members
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-success text-white"
                    disabled={!editName || !editClientId}
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectList;
