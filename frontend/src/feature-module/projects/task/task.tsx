import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import apiClient from "../../../core/utils/apiClient";
import { useAppSelector } from "../../../core/data/redux/store";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";

interface Employee {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string;
}

interface ProjectItem {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  priority: string;
  status: string;
  logoUrl?: string;
  projectManager?: Employee;
}

interface SubTask {
  id: number;
  title: string;
  isCompleted: boolean;
}

interface TaskItem {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  startDate?: string;
  estimatedHours: number;
  actualHours: number;
  assignedTo?: Employee;
  projectId: number;
  createdAt?: string;
  project: {
    id: number;
    name: string;
  };
  subTasks?: SubTask[];
}

const Task = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isCompanyAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "HR";

  const canEditTask = (task: TaskItem) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR' || currentUser.role === 'MANAGER' || currentUser.role === 'EMPLOYEE') {
      return true;
    }
    return task.assignedTo?.userId === currentUser.id;
  };

  // Data lists
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Selection & Filters
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL"); // ALL, HIGH, MEDIUM, LOW
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt, dueDate, priority

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Add Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskStatus, setTaskStatus] = useState("TODO");
  const [taskStart, setTaskStart] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskHours, setTaskHours] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch all tasks and projects
  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, taskRes, empRes] = await Promise.all([
        apiClient.get("/api/projects"),
        apiClient.get("/api/tasks"),
        apiClient.get("/employees")
      ]);

      if (projRes.data?.success) {
        const projData = projRes.data.data;
        setProjects(projData);
        // Default to first project if none selected
        if (projData.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projData[0].id);
        }
      }

      if (taskRes.data?.success) {
        setTasks(taskRes.data.data);
      }

      // Handle raw array or wrapped data structure for employees
      if (Array.isArray(empRes.data)) {
        setEmployees(empRes.data);
      } else if (empRes.data?.success) {
        setEmployees(empRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load tasks data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update status handler (marks complete, onhold, etc.)
  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      // Optimistic update
      setTasks((prev) => 
        prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      );
      if (activeTask && activeTask.id === taskId) {
        setActiveTask(prev => prev ? { ...prev, status: newStatus } : null);
      }

      await apiClient.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Failed to update task status:", err);
      fetchData(); // Rollback
    }
  };

  // Add Task submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskProjectId) {
      setErrorMsg("Task Title and Project selection are required.");
      return;
    }
    try {
      setErrorMsg("");
      const res = await apiClient.post("/api/tasks", {
        title: taskTitle,
        description: taskDesc,
        projectId: Number(taskProjectId),
        assignedToId: taskAssigneeId ? Number(taskAssigneeId) : null,
        priority: taskPriority,
        status: taskStatus,
        startDate: taskStart || undefined,
        dueDate: taskDue || undefined,
        estimatedHours: taskHours ? Number(taskHours) : 0
      });

      if (res.data?.success) {
        setShowAddModal(false);
        // Reset form
        setTaskTitle("");
        setTaskDesc("");
        setTaskProjectId("");
        setTaskAssigneeId("");
        setTaskPriority("MEDIUM");
        setTaskStatus("TODO");
        setTaskStart("");
        setTaskDue("");
        setTaskHours("");

        fetchData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create Task.");
    }
  };

  // Toggle subtask checklist item
  const handleToggleSubtask = async (subtaskId: number) => {
    if (!activeTask) return;
    try {
      const res = await apiClient.patch(`/api/tasks/subtasks/${subtaskId}/toggle`);
      if (res.data?.success) {
        const updatedSubtasks = (activeTask.subTasks || []).map(s => 
          s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
        );
        setActiveTask({ ...activeTask, subTasks: updatedSubtasks });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
    }
  };

  // Add inline subtask
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !newSubtaskTitle.trim()) return;

    try {
      const res = await apiClient.post(`/api/tasks/${activeTask.id}/subtasks`, {
        title: newSubtaskTitle
      });
      if (res.data?.success) {
        const added = res.data.data;
        setActiveTask({
          ...activeTask,
          subTasks: [...(activeTask.subTasks || []), added]
        });
        setNewSubtaskTitle("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
  };

  // Delete task handler
  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await apiClient.delete(`/api/tasks/${taskId}`);
      if (res.data?.success) {
        setShowDetailsModal(false);
        setActiveTask(null);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // Toggle Importance / Priority (Star icon helper)
  const handleToggleStar = async (task: TaskItem) => {
    try {
      const newPriority = task.priority === "HIGH" ? "MEDIUM" : "HIGH";
      setTasks((prev) => 
        prev.map(t => t.id === task.id ? { ...t, priority: newPriority } : t)
      );
      await apiClient.put(`/api/tasks/${task.id}`, { priority: newPriority });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle task priority star:", err);
      fetchData();
    }
  };

  // UI Helpers
  const getPriorityBadgeClass = (prio: string) => {
    switch (prio) {
      case "HIGH": return "badge-danger";
      case "MEDIUM": return "badge-warning";
      case "LOW": return "badge-info";
      default: return "badge-light";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-success-transparent text-success";
      case "IN_PROGRESS": return "bg-info-transparent text-info";
      case "ON_HOLD": return "bg-warning-transparent text-warning";
      case "PENDING": return "bg-danger-transparent text-danger";
      default: return "bg-light-transparent text-dark";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Completed";
      case "IN_PROGRESS": return "Inprogress";
      case "ON_HOLD": return "Onhold";
      case "PENDING": return "Pending";
      case "TODO": return "To Do";
      default: return status;
    }
  };

  // Sorting & Filtering Logic
  const getFilteredTasks = () => {
    let filtered = tasks.filter(t => t.projectId === selectedProjectId);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Priority filter
    if (selectedPriority !== "ALL") {
      filtered = filtered.filter(t => t.priority === selectedPriority);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "dueDate") {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === "priority") {
        const order: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (order[a.priority] || 4) - (order[b.priority] || 4);
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return filtered;
  };

  const currentProject = projects.find(p => p.id === selectedProjectId);
  const projectTasks = tasks.filter(t => t.projectId === selectedProjectId);
  const completedProjectTasks = projectTasks.filter(t => t.status === "COMPLETED");
  const projectProgress = projectTasks.length > 0 
    ? Math.round((completedProjectTasks.length / projectTasks.length) * 100) 
    : 0;

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumb / Top Row */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Tasks Workspace</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={all_routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Projects</li>
                <li className="breadcrumb-item active">Tasks</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex align-items-center flex-wrap gap-2">
            {isCompanyAdmin && (
              <button 
                className="btn btn-primary d-inline-flex align-items-center gap-1 shadow-xs"
                onClick={() => {
                  if (selectedProjectId) setTaskProjectId(selectedProjectId.toString());
                  setShowAddModal(true);
                }}
              >
                <i className="ti ti-plus" /> Add Task
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Column Layout */}
        <div className="row g-3">
          
          {/* ============================================================ */}
          {/* LEFT SIDEBAR: PROJECTS LIST */}
          {/* ============================================================ */}
          <div className="col-xl-4 col-lg-12">
            <div className="d-flex flex-column gap-3">
              {projects.map((proj) => {
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                const compTasks = projTasks.filter(t => t.status === "COMPLETED");
                const progress = projTasks.length > 0 ? Math.round((compTasks.length / projTasks.length) * 100) : 0;
                
                // Colors based on project ID for unique look
                const colors = ["bg-primary-transparent text-primary", "bg-success-transparent text-success", "bg-warning-transparent text-warning", "bg-info-transparent text-info"];
                const colorClass = colors[proj.id % colors.length];

                return (
                  <div
                    className={`card cursor-pointer border hover-lift-effect mb-0 ${selectedProjectId === proj.id ? "border-primary shadow-sm ring-1 ring-primary" : "border-light"}`}
                    onClick={() => setSelectedProjectId(proj.id)}
                    key={proj.id}
                  >
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="avatar avatar-md rounded-circle overflow-hidden bg-light d-inline-flex align-items-center justify-content-center">
                          {proj.logoUrl ? (
                            <img
                              src={proj.logoUrl.startsWith("http") ? proj.logoUrl : `${apiClient.defaults.baseURL || "http://localhost:5000"}${proj.logoUrl}`}
                              className="img-fluid"
                              alt="Project Logo"
                              style={{ width: "38px", height: "38px", objectFit: "cover" }}
                            />
                          ) : (
                            <ImageWithBasePath
                              src={`assets/img/social/project-${(proj.id % 4) + 1}.svg`}
                              alt="Project Logo"
                            />
                          )}
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0">{proj.name}</h6>
                          <span className="fs-12 text-muted fw-semibold">
                            {projTasks.length} tasks • {compTasks.length} Completed
                          </span>
                        </div>
                      </div>

                      <div className="row g-2 pt-2 border-top border-light mb-3">
                        <div className="col-4">
                          <span className="fs-10 text-muted d-block uppercase fw-semibold tracking-wide">Deadline</span>
                          <span className="fs-12 fw-bold text-dark">
                            {new Date(proj.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="col-4">
                          <span className="fs-10 text-muted d-block uppercase fw-semibold tracking-wide">Value</span>
                          <span className="fs-12 fw-bold text-dark">
                            {proj.budget ? `₹${proj.budget.toLocaleString()}` : "—"}
                          </span>
                        </div>
                        <div className="col-4">
                          <span className="fs-10 text-muted d-block uppercase fw-semibold tracking-wide">Project Lead</span>
                          <span className="fs-12 fw-bold text-dark truncate d-block" title={proj.projectManager ? `${proj.projectManager.firstName} ${proj.projectManager.lastName}` : "Unassigned"}>
                            {proj.projectManager ? proj.projectManager.firstName : "Unassigned"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fs-11 text-muted fw-medium">Progress</span>
                          <span className="fs-11 fw-bold text-dark">{progress}%</span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className={`progress-bar ${progress === 100 ? "bg-success" : "bg-primary"}`}
                            role="progressbar"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="card text-center p-5 border-light">
                  <span className="text-muted fw-medium fs-13">No projects created yet.</span>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT VIEW: SELECTED PROJECT'S TASKS LIST */}
          {/* ============================================================ */}
          <div className="col-xl-8 col-lg-12">
            {currentProject ? (
              <div className="card border shadow-xs mb-0">
                <div className="card-body p-4">
                  {/* Selected Project Overview Header */}
                  <div className="border-bottom border-light pb-3 mb-4">
                    <h4 className="fw-bold text-dark mb-2">{currentProject.name}</h4>
                    <div className="row align-items-center g-3 mt-1">
                      {/* Overall Progress */}
                      <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fs-12 text-muted fw-semibold">
                            Tasks Done: {completedProjectTasks.length} / {projectTasks.length}
                          </span>
                          <span className="fs-12 fw-bold text-primary">{projectProgress}% Completed</span>
                        </div>
                        <div className="progress" style={{ height: "8px" }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${projectProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Header Filters */}
                      <div className="col-md-6 d-flex justify-content-end gap-2 flex-wrap">
                        {/* Priority Buttons */}
                        <div className="btn-group btn-group-sm shadow-xs" role="group">
                          {["ALL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                            <button
                              type="button"
                              className={`btn btn-xs ${selectedPriority === p ? "btn-primary" : "btn-outline-light border text-dark"}`}
                              key={p}
                              onClick={() => setSelectedPriority(p)}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        {/* Sort selector */}
                        <select
                          className="form-select form-select-xs w-auto border shadow-xs"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="createdAt">Sort: Created Date</option>
                          <option value="dueDate">Sort: Due Date</option>
                          <option value="priority">Sort: Priority</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Task list list-group */}
                  <div className="d-flex flex-column gap-2" style={{ minHeight: "350px" }}>
                    {getFilteredTasks().map((task) => (
                      <div
                        className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-white hover-shadow-sm cursor-pointer"
                        key={task.id}
                        onClick={() => {
                          setActiveTask(task);
                          setShowDetailsModal(true);
                        }}
                      >
                        {/* Left items: Checkbox, Star, Title, Dates */}
                        <div className="d-flex align-items-center gap-3 flex-fill me-3" onClick={(e) => e.stopPropagation()}>
                          {/* Complete status checkbox */}
                          <input
                            type="checkbox"
                            className="form-check-input"
                            style={{ width: "18px", height: "18px" }}
                            checked={task.status === "COMPLETED"}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              handleUpdateStatus(task.id, checked ? "COMPLETED" : "TODO");
                            }}
                          />

                          {/* Star priority selector */}
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none border-0"
                            onClick={() => handleToggleStar(task)}
                          >
                            <i className={`ti ${task.priority === "HIGH" ? "ti-star-filled text-warning" : "ti-star text-muted"} fs-16`} />
                          </button>

                          {/* Title & info */}
                          <div>
                            <span className={`fw-bold text-dark fs-14 ${task.status === "COMPLETED" ? "text-decoration-line-through text-muted" : ""}`}>
                              {task.title}
                            </span>
                            {task.dueDate && (
                              <span className="badge badge-light-secondary ms-2 fs-10 fw-medium">
                                <i className="ti ti-calendar me-1" />
                                {new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right items: Tag, Status dropdown, Assignee avatar, action */}
                        <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Priority badge */}
                          <span className={`badge ${getPriorityBadgeClass(task.priority)} badge-xs rounded-pill me-1`}>
                            {task.priority}
                          </span>

                          {/* Status changer select input */}
                          <select
                            className={`form-select form-select-xs border-0 fw-semibold rounded-pill py-1 px-3 ${getStatusBadgeClass(task.status)}`}
                            style={{ width: "120px", cursor: canEditTask(task) ? "pointer" : "not-allowed" }}
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                            disabled={!canEditTask(task)}
                          >
                            <option value="TODO">To Do</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">Inprogress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ON_HOLD">Onhold</option>
                          </select>

                          {/* Assignee Avatar */}
                          {task.assignedTo ? (
                            <span
                              className="avatar avatar-xs bg-primary-transparent text-primary rounded-circle fw-bold d-inline-flex align-items-center justify-content-center ms-1"
                              title={`Assigned to ${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                            >
                              {task.assignedTo.firstName[0].toUpperCase()}
                            </span>
                          ) : (
                            <span className="avatar avatar-xs bg-light text-muted rounded-circle fw-bold d-inline-flex align-items-center justify-content-center ms-1" title="Unassigned">
                              ?
                            </span>
                          )}

                          {/* Delete action */}
                          {isCompanyAdmin && (
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-ghost text-danger border-0 ms-2"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <i className="ti ti-trash fs-16" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {getFilteredTasks().length === 0 && (
                      <div className="text-center py-5 border-2 border-dashed rounded-3 bg-light-50">
                        <i className="ti ti-checklist fs-24 text-muted mb-2 d-block" />
                        <span className="text-muted fw-semibold fs-13">No tasks found matching criteria.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border text-center p-5 shadow-xs mb-0">
                <div className="card-body py-5">
                  <i className="ti ti-folder fs-36 text-muted mb-2 d-block" />
                  <h5 className="fw-bold text-dark">No Project Selected</h5>
                  <p className="text-muted fs-13">Select a project board from the left panel to display tasks.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* ADD TASK MODAL */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white border-0 py-3 rounded-top-3">
                <h5 className="modal-title fw-bold text-white">Add Task</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)} />
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body p-4">
                  {errorMsg && <div className="alert alert-danger p-2 fs-13">{errorMsg}</div>}
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Task Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Payment Gateway integration"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Project *</label>
                      <select
                        className="form-select"
                        value={taskProjectId}
                        onChange={(e) => setTaskProjectId(e.target.value)}
                        required
                      >
                        <option value="">Select Project</option>
                        {projects.map(p => (
                          <option value={p.id} key={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Assigned To</label>
                      <select
                        className="form-select"
                        value={taskAssigneeId}
                        onChange={(e) => setTaskAssigneeId(e.target.value)}
                      >
                        <option value="">Select Assignee</option>
                        {employees.map(emp => (
                          <option value={emp.id} key={emp.id}>{emp.firstName} {emp.lastName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Priority</label>
                      <select
                        className="form-select"
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Initial Status</label>
                      <select
                        className="form-select"
                        value={taskStatus}
                        onChange={(e) => setTaskStatus(e.target.value)}
                      >
                        <option value="TODO">To Do</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">Inprogress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ON_HOLD">Onhold</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={taskStart}
                        onChange={(e) => setTaskStart(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={taskDue}
                        onChange={(e) => setTaskDue(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Estimated Hours</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 15"
                        value={taskHours}
                        onChange={(e) => setTaskHours(e.target.value)}
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Provide details about the task requirements..."
                        value={taskDesc}
                        onChange={(e) => setTaskDesc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 py-3 bg-light rounded-bottom-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TASK DETAILS & SUBTASKS MODAL */}
      {/* ============================================================ */}
      {showDetailsModal && activeTask && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-white border-bottom py-3 rounded-top-3">
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${getPriorityBadgeClass(activeTask.priority)} rounded-pill`}>
                    {activeTask.priority} Priority
                  </span>
                  <span className="badge badge-light-primary text-uppercase fs-10 tracking-wider">
                    {activeTask.project.name}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-icon btn-sm btn-light rounded-circle border-0 d-flex align-items-center justify-content-center" 
                  onClick={() => setShowDetailsModal(false)}
                  aria-label="Close"
                  style={{ width: "30px", height: "30px" }}
                >
                  <i className="ti ti-x fs-16 text-dark" />
                </button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div className="row g-4">
                  {/* Left Column: Details & Checklist */}
                  <div className="col-lg-7 border-end border-light">
                    <h4 className="fw-bold text-dark mb-3">{activeTask.title}</h4>
                    
                    {activeTask.description && (
                      <div className="mb-4">
                        <h6 className="fw-bold text-muted fs-12 uppercase tracking-wide">Description</h6>
                        <p className="text-gray-6 bg-light p-3 rounded-3 fs-13 mb-0" style={{ whiteSpace: "pre-wrap" }}>
                          {activeTask.description}
                        </p>
                      </div>
                    )}

                    {/* Subtask checklist manager */}
                    <div className="mb-4">
                      <h6 className="fw-bold text-muted fs-12 uppercase tracking-wide mb-3">Subtasks Checklist</h6>
                      
                      {/* Subtask list */}
                      <div className="d-flex flex-column gap-2 mb-3">
                        {(activeTask.subTasks || []).map((sub) => (
                          <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light border-start border-3 border-primary" key={sub.id}>
                            <div className="form-check form-check-md mb-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`sub-${sub.id}`}
                                checked={sub.isCompleted}
                                onChange={() => handleToggleSubtask(sub.id)}
                              />
                              <label
                                className={`form-check-label fs-13 mt-0 ${sub.isCompleted ? "text-decoration-line-through text-muted" : "fw-medium"}`}
                                htmlFor={`sub-${sub.id}`}
                              >
                                {sub.title}
                              </label>
                            </div>
                          </div>
                        ))}

                        {(activeTask.subTasks || []).length === 0 && (
                          <div className="text-center py-4 text-muted border-2 border-dashed rounded-3 fs-13">
                            No subtasks created for this task yet.
                          </div>
                        )}
                      </div>

                      {/* Add new subtask inline */}
                      <form onSubmit={handleAddSubtask} className="d-flex gap-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Add new subtask..."
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary btn-sm px-3 shadow-xs">Add</button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Meta details & actions */}
                  <div className="col-lg-5">
                    <div className="bg-light p-3 rounded-3 mb-4">
                      <h6 className="fw-bold text-muted fs-12 uppercase tracking-wide mb-3">Task Meta</h6>
                      
                      <div className="d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted fs-13">Status:</span>
                          <span className="badge bg-secondary-transparent text-secondary fw-bold">{activeTask.status}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted fs-13">Assignee:</span>
                          <span className="fw-semibold text-dark fs-13">
                            {activeTask.assignedTo 
                              ? `${activeTask.assignedTo.firstName} ${activeTask.assignedTo.lastName}`
                              : "Unassigned"
                            }
                          </span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted fs-13">Due Date:</span>
                          <span className="fw-semibold text-dark fs-13">
                            {activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : "None"}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted fs-13">Est. Hours:</span>
                          <span className="badge bg-light text-dark fw-bold">{activeTask.estimatedHours}h</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      {isCompanyAdmin && (
                        <button
                          type="button"
                          className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-1"
                          onClick={() => handleDeleteTask(activeTask.id)}
                        >
                          <i className="ti ti-trash" /> Delete Task
                        </button>
                      )}
                      
                      <button
                        type="button"
                        className="btn btn-light d-flex align-items-center justify-content-center gap-1"
                        onClick={() => setShowDetailsModal(false)}
                      >
                        Back to Tasks
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Task;
