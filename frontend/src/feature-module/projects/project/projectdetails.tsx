import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";
import { useAppSelector } from "../../../core/data/redux/store";

// Converts a relative /uploads/... path to a full backend URL
const getFileUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${APP_CONFIG.getBackendUrl()}${url}`;
};

interface Client {
  id: number;
  companyName: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  profilePhotoUrl?: string | null;
}

interface TaskItem {
  id: number;
  title: string;
  status: string;
  dueDate: string;
  priority: string;
  assignedTo: Employee | null;
}

interface Milestone {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
}

interface ProjectMember {
  id: number;
  role: string;
  employee: Employee;
}

interface ProjectNote {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  createdBy: Employee | null;
}

interface ProjectFile {
  id: number;
  name: string;
  url: string;
  fileType: string; // 'image' | 'file'
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

interface ProjectDetail {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  budget: number | null;
  priority: string;
  health: string;
  status: string;
  client: Client | null;
  manager: Employee | null;
  members: ProjectMember[];
  milestones: Milestone[];
  tasks: TaskItem[];
  createdAt: string;
}

const ProjectDetails = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");

  const currentUser = useAppSelector((state) => state.auth.user);
  
  const canReadFinance = currentUser?.role === 'SUPER_ADMIN' || 
                        currentUser?.role === 'HR' || 
                        currentUser?.role === 'MANAGER' ||
                        currentUser?.permissions?.some(p => p.module === 'FINANCE' && p.canRead);

  const canWriteProjects = currentUser?.role === 'SUPER_ADMIN' || 
                           currentUser?.role === 'HR' || 
                           currentUser?.role === 'MANAGER' ||
                           currentUser?.permissions?.some(p => p.module === 'PROJECTS' && p.canWrite);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Allocation State
  const [selectedAllocEmp, setSelectedAllocEmp] = useState("");
  const [allocRole, setAllocRole] = useState("MEMBER");

  // Milestone State
  const [msName, setMsName] = useState("");
  const [msDesc, setMsDesc] = useState("");
  const [msStart, setMsStart] = useState("");
  const [msEnd, setMsEnd] = useState("");
  const [msProgress, setMsProgress] = useState(0);

  // Task Creation State
  const [taskName, setTaskName] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");

  // Notes State
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  // Files State
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [fileUploading, setFileUploading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/projects/${projectId}`);
      if (res.data?.success) {
        setProject(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load project details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get("/employees");
      if (Array.isArray(res.data)) {
        setEmployeesList(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch employees list:", err);
    }
  };

  const fetchNotes = async () => {
    if (!projectId) return;
    try {
      const res = await apiClient.get(`/api/projects/${projectId}/notes`);
      if (res.data?.success) setNotes(res.data.data);
    } catch { /* silent */ }
  };

  const fetchFiles = async () => {
    if (!projectId) return;
    try {
      const res = await apiClient.get(`/api/projects/${projectId}/files`);
      if (res.data?.success) setProjectFiles(res.data.data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchEmployees();
    fetchNotes();
    fetchFiles();
  }, [projectId]);

  // Allocate team member
  const handleAllocateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !selectedAllocEmp) return;
    try {
      setErrorMsg("");
      const res = await apiClient.post(`/api/projects/${projectId}/members`, {
        employeeIds: [parseInt(selectedAllocEmp, 10)],
        role: allocRole
      });
      if (res.data?.success) {
        setSelectedAllocEmp("");
        fetchProjectDetails();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to allocate member");
    }
  };

  const handleDeallocateMember = async (memberId: number) => {
    if (!projectId) return;
    if (!window.confirm("Remove this member from the project?")) return;
    try {
      const res = await apiClient.delete(`/api/projects/${projectId}/members/${memberId}`);
      if (res.data?.success) {
        fetchProjectDetails();
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

  // Create Milestone
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !msName || !msStart || !msEnd) return;
    try {
      setErrorMsg("");
      const res = await apiClient.post(`/api/projects/${projectId}/milestones`, {
        name: msName,
        description: msDesc,
        startDate: msStart,
        endDate: msEnd,
        progress: Number(msProgress),
        status: msProgress === 100 ? "COMPLETED" : "IN_PROGRESS"
      });
      if (res.data?.success) {
        setMsName("");
        setMsDesc("");
        setMsStart("");
        setMsEnd("");
        setMsProgress(0);
        fetchProjectDetails();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to add milestone");
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !taskName || !taskDueDate) return;
    try {
      setErrorMsg("");
      const payload = {
        title: taskName,
        projectId: parseInt(projectId, 10),
        dueDate: taskDueDate,
        priority: taskPriority,
        assignedToId: taskAssigneeId ? parseInt(taskAssigneeId, 10) : null,
        status: "TODO"
      };
      const res = await apiClient.post("/api/tasks", payload);
      if (res.data?.success) {
        setTaskName("");
        setTaskDueDate("");
        setTaskPriority("MEDIUM");
        setTaskAssigneeId("");
        fetchProjectDetails();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create task");
    }
  };

  // Toggle Task Status
  const handleToggleTaskStatus = async (taskId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "COMPLETED" ? "TODO" : "COMPLETED";
      const res = await apiClient.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
      if (res.data?.success) {
        fetchProjectDetails();
      }
    } catch (err) {
      console.error("Failed to toggle task status:", err);
    }
  };

  // Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !noteTitle || !noteContent) return;
    try {
      setErrorMsg("");
      const res = await apiClient.post(`/api/projects/${projectId}/notes`, {
        title: noteTitle,
        content: noteContent,
      });
      if (res.data?.success) {
        setNoteTitle("");
        setNoteContent("");
        setShowNoteForm(false);
        fetchNotes();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to add note");
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await apiClient.delete(`/api/projects/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch { /* silent */ }
  };

  // Upload File / Image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!projectId || !e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      setFileUploading(true);
      // Do NOT set Content-Type manually — axios auto-sets multipart/form-data with boundary
      const res = await apiClient.post(`/api/projects/${projectId}/files`, formData);
      if (res.data?.success) fetchFiles();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to upload file");
    } finally {
      setFileUploading(false);
      e.target.value = "";
    }
  };

  // Delete File
  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await apiClient.delete(`/api/projects/files/${fileId}`);
      setProjectFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch { /* silent */ }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await apiClient.delete(`/api/tasks/${taskId}`);
      if (res.data?.success) {
        fetchProjectDetails();
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading project data...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-wrapper p-5">
        <div className="alert alert-warning text-center">Project details not found or access restricted.</div>
      </div>
    );
  }

  // Calculate dynamic stats
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter((t) => t.status === "COMPLETED").length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Format budget
  const formattedBudget = canReadFinance && project.budget !== null
    ? `₹ ${project.budget.toLocaleString()}`
    : "Confidential";

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Top Header Actions */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Link to={all_routes.project} className="text-secondary fw-semibold d-inline-flex align-items-center">
              <i className="ti ti-arrow-left me-2 fs-16" /> Back to List
            </Link>
          </div>
          <div>
            <Link
              to={all_routes.project}
              className="btn btn-orange text-white d-flex align-items-center gap-2 px-3 py-2 rounded shadow-xs"
              style={{ background: "#FF7300" }}
            >
              <i className="ti ti-edit fs-15" /> Edit Project
            </Link>
          </div>
        </div>

        {errorMsg && <div className="alert alert-danger mb-4">{errorMsg}</div>}

        <div className="row">
          {/* LEFT COLUMN: Sidebar Details (30% width) */}
          <div className="col-xl-4 col-lg-4 col-md-12 mb-4">
            {/* Project Details Card */}
            <div className="card shadow-sm border-0 mb-4 rounded-3 overflow-hidden">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="mb-0 fw-bold text-dark">Project Details</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr className="border-bottom">
                        <td className="text-muted py-3 px-4">Client</td>
                        <td className="text-end fw-semibold text-dark py-3 px-4">
                          {project.client?.companyName || "Internal Project"}
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-muted py-3 px-4">Project Total Cost</td>
                        <td className="text-end fw-semibold text-dark py-3 px-4">
                          {formattedBudget}
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-muted py-3 px-4">Hours of Work</td>
                        <td className="text-end fw-semibold text-dark py-3 px-4">
                          {totalTasks * 10 || 150} hrs
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-muted py-3 px-4">Created on</td>
                        <td className="text-end fw-semibold text-dark py-3 px-4">
                          {project.createdAt ? new Date(project.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          }) : "N/A"}
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-muted py-3 px-4">Started on</td>
                        <td className="text-end fw-semibold text-dark py-3 px-4">
                          {new Date(project.startDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-muted py-3 px-4">Due Date</td>
                        <td className="text-end fw-semibold text-dark py-3 px-4">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <span>
                              {new Date(project.endDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                            {new Date(project.endDate).getTime() < Date.now() && project.status !== "COMPLETED" && (
                              <span className="badge bg-danger rounded-pill fs-10 px-2 py-1">G1</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      <tr className="border-bottom">
                        <td className="text-muted py-3 px-4">Created by</td>
                        <td className="text-end fw-semibold text-dark py-3 px-4">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <span className="avatar avatar-xs bg-light rounded-circle text-primary">
                              {project.manager?.firstName[0] || "C"}
                            </span>
                            <span>{project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "System"}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted py-3 px-4">Priority</td>
                        <td className="text-end py-3 px-4">
                          <span className={`badge ${project.priority === "HIGH" ? "bg-danger" : project.priority === "MEDIUM" ? "bg-warning text-dark" : "bg-info"} px-3 py-1.5`}>
                            {project.priority}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Tasks Details Card */}
            <div className="card shadow-sm border-0 rounded-3 p-4 mb-4">
              <h5 className="fw-bold text-dark mb-3">Tasks Details</h5>
              <div className="mb-2">
                <span className="text-muted">Tasks Done</span>
                <h4 className="fw-bold text-dark mt-1">
                  {completedTasks} / {totalTasks}
                </h4>
              </div>
              <div className="progress mt-3" style={{ height: "8px" }}>
                <div
                  className="progress-bar bg-success rounded"
                  role="progressbar"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-muted fs-12 mt-2">{progressPercent}% Completed</div>
            </div>

            {/* Allocate Team Member Card */}
            <div className="card shadow-sm border-0 rounded-3 p-4">
              <h5 className="fw-bold text-dark mb-3">Allocate Team Member</h5>
              <form onSubmit={handleAllocateMember}>
                <div className="mb-3">
                  <label className="form-label fs-13 text-muted">Select Employee</label>
                  <select
                    className="form-select"
                    value={selectedAllocEmp}
                    onChange={(e) => setSelectedAllocEmp(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Employee --</option>
                    {employeesList
                      .filter(emp => !project.members.some(m => m.employee.id === emp.id))
                      .map(emp => (
                        <option value={emp.id} key={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fs-13 text-muted">Role / Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Lead, Developer"
                    value={allocRole}
                    onChange={(e) => setAllocRole(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2" disabled={!selectedAllocEmp}>
                  Allocate Member
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Project Metadata & Sections (70% width) */}
          <div className="col-xl-8 col-lg-8 col-md-12 mb-4">
            {/* Top Project Card */}
            <div className="card shadow-sm border-0 p-4 mb-4 rounded-3">
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: "56px", height: "56px", fontSize: "24px", fontWeight: "bold" }}
                >
                  {project.name[0]}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <h4 className="fw-bold text-dark mb-1">{project.name}</h4>
                      <span className="text-muted fs-12">Project ID : <span className="text-danger fw-semibold">PRO-{project.id.toString().padStart(4, '0')}</span></span>
                    </div>
                    <div>
                      <span className="badge bg-success-transparent text-success px-3 py-1.5 fs-12">
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Metadata Row */}
                  <div className="row mt-4 align-items-center">
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <span className="text-muted fs-13 w-80">Team</span>
                        <div className="d-flex align-items-center gap-1">
                          {project.members.slice(0, 4).map((m) => (
                            <div
                              className="avatar avatar-sm rounded-circle bg-light border-2 border-white d-flex align-items-center justify-content-center"
                              key={m.id}
                              title={`${m.employee.firstName} ${m.employee.lastName} (${m.role})`}
                              style={{ width: "32px", height: "32px", marginLeft: "-6px" }}
                            >
                              <span className="fs-11 fw-semibold text-primary">{m.employee.firstName[0]}</span>
                            </div>
                          ))}
                          {project.members.length > 4 && (
                            <span className="badge bg-secondary rounded-circle fs-10 p-1.5" style={{ marginLeft: "-6px" }}>
                              +{project.members.length - 4}
                            </span>
                          )}
                          <span className="text-muted fs-12 ms-2 cursor-pointer hover-primary"><i className="ti ti-plus" /> Add New</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <span className="text-muted fs-13 w-80">Team Lead</span>
                        <div className="d-flex align-items-center gap-2">
                          <span className="avatar avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-success">
                            {project.manager?.firstName[0] || "U"}
                          </span>
                          <span className="fs-13 fw-semibold text-dark">
                            {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "Unassigned"}
                          </span>
                          <span className="text-muted fs-12 ms-2 cursor-pointer hover-primary"><i className="ti ti-plus" /> Add New</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <span className="text-muted fs-13 w-80">Project Manager</span>
                        <div className="d-flex align-items-center gap-2">
                          <span className="avatar avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center text-info">
                            {project.manager?.firstName[0] || "U"}
                          </span>
                          <span className="fs-13 fw-semibold text-dark">
                            {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "Unassigned"}
                          </span>
                          <span className="text-muted fs-12 ms-2 cursor-pointer hover-primary"><i className="ti ti-plus" /> Add New</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <span className="text-muted fs-13 w-80">Tags</span>
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span className="badge bg-danger-transparent text-danger px-2.5 py-1">Admin Panel</span>
                          <span className="badge bg-primary-transparent text-primary px-2.5 py-1">High Tech</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Description */}
                  <h6 className="fw-bold text-dark mb-2">Description</h6>
                  <div
                    className="text-muted fs-13"
                    style={{ lineHeight: "1.6" }}
                    dangerouslySetInnerHTML={{ __html: project.description || "No description provided." }}
                  />

                  {/* Time Spent progress bar */}
                  <div className="mt-4 bg-light p-3 rounded d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <span className="text-muted fs-13">Time Spent on this project</span>
                    <span className="fw-bold text-dark">65/120 Hrs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Tasks Card */}
            <div className="card shadow-sm border-0 rounded-3 mb-4">
              <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark">Tasks</h5>
                <i className="ti ti-chevron-down text-muted" />
              </div>
              <div className="card-body p-4">
                {project.tasks?.length === 0 ? (
                  <p className="text-muted text-center py-4 mb-0">No tasks registered for this project yet.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {project.tasks.map((task) => (
                      <div
                        className="d-flex align-items-center justify-content-between border rounded p-3 bg-light-transparent"
                        key={task.id}
                      >
                        <div className="d-flex align-items-center gap-3">
                          {/* Checkbox status update toggle */}
                          <input
                            type="checkbox"
                            className="form-check-input"
                            style={{ width: "18px", height: "18px", borderColor: "#FF7300", accentColor: "#FF7300" }}
                            checked={task.status === "COMPLETED"}
                            onChange={() => handleToggleTaskStatus(task.id, task.status)}
                          />
                          <i className="ti ti-star text-warning cursor-pointer" />
                          <span className={`fw-semibold text-dark ${task.status === "COMPLETED" ? "text-decoration-line-through text-muted" : ""}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span className={`badge ${task.status === "COMPLETED" ? "bg-success" : task.status === "IN_PROGRESS" ? "bg-info" : "bg-warning text-dark"} px-2.5 py-1 fs-11`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span className="badge bg-danger-transparent text-danger px-2.5 py-1 fs-11">
                            {task.priority}
                          </span>
                          <div className="avatar avatar-xs rounded-circle bg-light d-flex align-items-center justify-content-center text-primary" title={task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "Unassigned"}>
                            <span className="fs-10 fw-bold">{task.assignedTo?.firstName?.[0] || "U"}</span>
                          </div>
                          {/* Action toggle options */}
                          <i className="ti ti-trash text-danger cursor-pointer hover-danger" onClick={() => handleDeleteTask(task.id)} title="Delete Task" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline task creation form */}
                {canWriteProjects && (
                  <form onSubmit={handleCreateTask} className="mt-4 pt-4 border-top">
                    <h6 className="fw-bold text-dark mb-3">Quick Add Task</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fs-13 text-muted">Task Title</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Code database migrations"
                          value={taskName}
                          onChange={(e) => setTaskName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label fs-13 text-muted">Due Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label fs-13 text-muted">Assignee</label>
                        <select
                          className="form-select"
                          value={taskAssigneeId}
                          onChange={(e) => setTaskAssigneeId(e.target.value)}
                        >
                          <option value="">-- Choose --</option>
                          {project.members.map((m) => (
                            <option value={m.employee.id} key={m.employee.id}>
                              {m.employee.firstName} {m.employee.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-sm btn-primary px-3 py-2 mt-2">
                      + Add task
                    </button>
                  </form>
                )}
              </div>
            </div>


            {/* Images Card — dynamic */}
            <div className="card shadow-sm border-0 rounded-3 p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-dark mb-0">Images</h5>
                <label className="text-primary cursor-pointer hover-primary fs-13 mb-0" style={{ cursor: "pointer" }}>
                  {fileUploading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-plus" />} Add New
                  <input type="file" accept="image/*" className="d-none" onChange={handleFileUpload} />
                </label>
              </div>
              {projectFiles.filter((f) => f.fileType === "image").length === 0 ? (
                <p className="text-muted text-center py-3 mb-0 fs-13">No images uploaded yet.</p>
              ) : (
                <div className="row g-3">
                  {projectFiles.filter((f) => f.fileType === "image").map((img) => (
                    <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={img.id}>
                      <div className="border rounded overflow-hidden shadow-xs position-relative group-hover">
                        <img
                          src={getFileUrl(img.url)}
                          alt={img.name}
                          className="w-100"
                          style={{ height: "80px", objectFit: "cover" }}
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/150x80/f3f4f6/374151?text=Image"; }}
                        />
                        <div className="position-absolute top-0 end-0 p-1">
                          <button
                            className="btn btn-danger btn-xs p-0 px-1"
                            style={{ fontSize: "10px" }}
                            onClick={() => handleDeleteFile(img.id)}
                            title="Delete image"
                          >
                            <i className="ti ti-x" />
                          </button>
                        </div>
                        <div className="px-1 py-0.5 bg-white border-top">
                          <span className="text-muted fs-10 text-truncate d-block" title={img.name}>{img.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files Card — dynamic */}
            <div className="card shadow-sm border-0 rounded-3 p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-dark mb-0">Files</h5>
                <label className="text-primary cursor-pointer hover-primary fs-13 mb-0" style={{ cursor: "pointer" }}>
                  {fileUploading ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-plus" />} Add New
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv,.ppt,.pptx" className="d-none" onChange={handleFileUpload} />
                </label>
              </div>
              {projectFiles.filter((f) => f.fileType === "file").length === 0 ? (
                <p className="text-muted text-center py-3 mb-0 fs-13">No files uploaded yet.</p>
              ) : (
                <div className="row g-3">
                  {projectFiles.filter((f) => f.fileType === "file").map((file) => {
                    const ext = file.name.split(".").pop()?.toLowerCase() || "";
                    const iconMap: Record<string, string> = { pdf: "ti-file-description", doc: "ti-file-text", docx: "ti-file-text", xls: "ti-table", xlsx: "ti-table", zip: "ti-zip", txt: "ti-file" };
                    const colorMap: Record<string, string> = { pdf: "danger", doc: "primary", docx: "primary", xls: "success", xlsx: "success", zip: "warning", txt: "secondary" };
                    const icon = iconMap[ext] || "ti-file";
                    const color = colorMap[ext] || "secondary";
                    const sizeLabel = file.sizeBytes ? `${(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : "Unknown";
                    return (
                      <div className="col-md-4" key={file.id}>
                        <div className="border rounded p-3 bg-light-transparent position-relative">
                          <div className="d-flex align-items-center gap-3">
                            <div className={`avatar bg-${color}-transparent text-${color} rounded p-2`}>
                              <i className={`ti ${icon} fs-20`} />
                            </div>
                            <div className="overflow-hidden">
                              <h6 className="fw-bold text-dark mb-1 text-truncate" title={file.name}>{file.name}</h6>
                              <span className="text-muted fs-11">{sizeLabel}</span>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                            <span className="text-muted fs-10">
                              {new Date(file.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <div className="d-flex gap-2">
                              <a href={getFileUrl(file.url)} download={file.name} target="_blank" rel="noreferrer">
                                <i className="ti ti-download text-muted cursor-pointer hover-primary" />
                              </a>
                              <i className="ti ti-trash text-muted cursor-pointer hover-danger" onClick={() => handleDeleteFile(file.id)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes & Activity Layout */}
            <div className="row">
              {/* Notes Card — dynamic */}
              <div className="col-md-6 mb-4">
                <div className="card shadow-sm border-0 rounded-3 p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold text-dark mb-0">Notes</h5>
                    <span
                      className="text-primary cursor-pointer hover-primary fs-13"
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowNoteForm((v) => !v)}
                    >
                      <i className="ti ti-plus" /> Add New
                    </span>
                  </div>

                  {/* Add Note Form */}
                  {showNoteForm && (
                    <form onSubmit={handleAddNote} className="mb-4 border rounded p-3 bg-light-transparent">
                      <div className="mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Note title..."
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-2">
                        <textarea
                          className="form-control form-control-sm"
                          rows={3}
                          placeholder="Note content..."
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          required
                        />
                      </div>
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-sm btn-primary px-3">Save Note</button>
                        <button type="button" className="btn btn-sm btn-light" onClick={() => setShowNoteForm(false)}>Cancel</button>
                      </div>
                    </form>
                  )}

                  <div className="d-flex flex-column gap-3">
                    {notes.length === 0 ? (
                      <p className="text-muted text-center py-3 mb-0 fs-13">No notes yet. Click "Add New" to add one.</p>
                    ) : (
                      notes.map((note) => (
                        <div className="border rounded p-3 bg-light-transparent" key={note.id}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted fs-11">
                              {new Date(note.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <i
                              className="ti ti-trash text-muted cursor-pointer hover-danger fs-13"
                              style={{ cursor: "pointer" }}
                              onClick={() => handleDeleteNote(note.id)}
                              title="Delete note"
                            />
                          </div>
                          <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                            <span style={{ width: "8px", height: "8px", background: "#FF7300", borderRadius: "50%", flexShrink: 0 }} />
                            {note.title}
                          </h6>
                          <p className="text-muted fs-12 mb-0" style={{ lineHeight: "1.5" }}>{note.content}</p>
                          {note.createdBy && (
                            <span className="text-muted fs-10 mt-1 d-block">
                              By {note.createdBy.firstName} {note.createdBy.lastName}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>


              {/* Activity Timeline Card */}
              <div className="col-md-6 mb-4">
                <div className="card shadow-sm border-0 rounded-3 p-4 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold text-dark mb-0">Activity</h5>
                    <span className="text-primary cursor-pointer hover-primary fs-13"><i className="ti ti-plus" /> Add New</span>
                  </div>
                  <div className="d-flex flex-column gap-4 position-relative ps-3 border-start">
                    {[
                      { user: "Andrew", action: "added a New Task", time: "15 May 2024, 6:53 PM", color: "primary" },
                      { user: "Jermsi", action: 'Moved task "Private chat module"', statusBadge: "Completed", statusColor: "success", nextStatus: "Inprogress", nextColor: "purple", time: "15 May 2024, 6:53 PM", color: "warning" },
                      { user: "Jermsi", action: 'Created task "Private chat module"', time: "15 May 2024, 6:53 PM", color: "purple" },
                      { user: "Hendry", action: 'Updated Image "logo.jpg"', time: "15 May 2024, 6:53 PM", color: "info" },
                    ].map((act, idx) => (
                      <div className="position-relative" key={idx}>
                        {/* Bullet point on timeline */}
                        <div
                          className={`bg-${act.color} rounded-circle position-absolute`}
                          style={{ width: "10px", height: "10px", left: "-21px", top: "5px" }}
                        />
                        <div className="fs-13">
                          <span className="fw-bold text-dark">{act.user}</span> {act.action}
                          {act.statusBadge && (
                            <div className="d-flex align-items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className={`badge bg-${act.statusColor}-transparent text-${act.statusColor} fs-10 px-2 py-0.5`}>{act.statusBadge}</span>
                              <i className="ti ti-arrow-right fs-10 text-muted" />
                              <span className={`badge bg-${act.nextColor}-transparent text-${act.nextColor} fs-10 px-2 py-0.5`}>{act.nextStatus}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-muted fs-10 mt-1 d-block">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices List Card */}
            <div className="card shadow-sm border-0 rounded-3 p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-dark mb-0">Invoices</h5>
                <i className="ti ti-chevron-down text-muted" />
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="fs-12 text-muted">Invoice Name</th>
                      <th className="fs-12 text-muted">Invoice No</th>
                      <th className="fs-12 text-muted">Amount</th>
                      <th className="fs-12 text-muted text-center">Status</th>
                      <th className="fs-12 text-muted text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Phase 2 Completion", no: "#INV-123", date: "15 Sep 2025, 05:35 pm", amount: "$4,596", status: "Paid", badge: "success" },
                      { name: "Advance for Project", no: "#INV-124", date: "14 Sep 2025, 03:20 pm", amount: "$3,012", status: "Paid", badge: "success" },
                      { name: "Changes & design Alignments", no: "#INV-125", date: "15 Sep 2025, 05:35 pm", amount: "$4,154", status: "Paid", badge: "success" },
                      { name: "Added New Functionality", no: "#INV-126", date: "16 Sep 2025, 05:35 pm", amount: "$658", status: "Paid", badge: "success" },
                      { name: "Phase 1 Completion", no: "#INV-127", date: "17 Sep 2025, 05:35 pm", amount: "$1,259", status: "Unpaid", badge: "danger" },
                    ].map((inv, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="avatar avatar-sm bg-light text-muted rounded p-1.5">
                              <i className="ti ti-file-text fs-16" />
                            </div>
                            <div>
                              <h6 className="fw-bold text-dark mb-0.5 fs-13">{inv.name}</h6>
                              <span className="text-muted fs-10">{inv.date}</span>
                            </div>
                          </div>
                        </td>
                        <td className="fw-semibold text-primary fs-13">{inv.no}</td>
                        <td className="fw-bold text-dark fs-13">{inv.amount}</td>
                        <td className="text-center">
                          <span className={`badge bg-${inv.badge}-transparent text-${inv.badge} px-2.5 py-1 rounded fs-11`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2 text-muted">
                            <i className="ti ti-edit cursor-pointer hover-primary" />
                            <i className="ti ti-trash cursor-pointer hover-danger" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
