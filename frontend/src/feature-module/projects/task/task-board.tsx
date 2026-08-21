import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import apiClient from "../../../core/utils/apiClient";
import { useAppSelector } from "../../../core/data/redux/store";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string;
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

interface BoardData {
  TODO: TaskItem[];
  PENDING: TaskItem[];
  IN_PROGRESS: TaskItem[];
  COMPLETED: TaskItem[];
  ON_HOLD: TaskItem[];
}

const TaskBoard = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isCompanyAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "HR";

  // Board Data & Lists
  const [boardData, setBoardData] = useState<BoardData>({
    TODO: [],
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    ON_HOLD: []
  });

  // Reference lists for dropdowns
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Filtering states
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL"); // ALL, HIGH, MEDIUM, LOW
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("ALL");
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");

  const handleExportPDF = () => {
    window.print();
  };
  
  // Loading & UI states
  const [loading, setLoading] = useState(true);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Add Board Modal State
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardDesc, setBoardDesc] = useState("");
  const [boardClient, setBoardClient] = useState("");
  const [boardManager, setBoardManager] = useState("");
  const [boardStart, setBoardStart] = useState("");
  const [boardEnd, setBoardEnd] = useState("");
  const [boardPriority, setBoardPriority] = useState("MEDIUM");
  const [boardBudget, setBoardBudget] = useState("");

  // Add Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTargetStatus, setTaskTargetStatus] = useState("TODO");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskStart, setTaskStart] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskHours, setTaskHours] = useState("");
  const [taskSubtasks, setTaskSubtasks] = useState<string[]>([""]);

  // Task Details & Subtasks Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Error/Success state
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch Board tasks
  const fetchBoard = async (projId = "ALL") => {
    try {
      setLoading(true);
      const url = projId === "ALL" ? "/api/tasks/board" : `/api/tasks/board?projectId=${projId}`;
      const res = await apiClient.get(url);
      if (res.data?.success) {
        setBoardData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load tasks board:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reference lists
  const fetchReferences = async () => {
    try {
      const [projRes, empRes, clientRes] = await Promise.all([
        apiClient.get("/api/projects"),
        apiClient.get("/employees"),
        apiClient.get("/api/clients")
      ]);
      if (projRes.data?.success) setProjects(projRes.data.data);
      
      // Handle either direct array or wrapped data structure for employees
      if (Array.isArray(empRes.data)) {
        setEmployees(empRes.data);
      } else if (empRes.data?.success) {
        setEmployees(empRes.data.data);
      }

      if (clientRes.data?.success) setClients(clientRes.data.data);
    } catch (err) {
      console.error("Failed to fetch reference lists:", err);
    }
  };

  useEffect(() => {
    fetchBoard(selectedProjectId);
    fetchReferences();
  }, [selectedProjectId]);

  // Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskIdStr = e.dataTransfer.getData("taskId");
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr, 10);

    try {
      // Find task to update status locally first (optimistic UI)
      let draggedTask: TaskItem | null = null;
      const nextBoard = { ...boardData };

      Object.keys(nextBoard).forEach((colKey) => {
        const list = nextBoard[colKey as keyof BoardData];
        const index = list.findIndex(t => t.id === taskId);
        if (index !== -1) {
          draggedTask = { ...list[index], status: newStatus };
          list.splice(index, 1);
        }
      });

      if (draggedTask) {
        nextBoard[newStatus as keyof BoardData].push(draggedTask);
        setBoardData(nextBoard);
      }

      // Backend sync
      await apiClient.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
      fetchBoard(selectedProjectId);
    } catch (err) {
      console.error("Failed to update status on drop:", err);
      fetchBoard(selectedProjectId); // Rollback on error
    }
  };

  // Create Project (Add Board) handler
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName || !boardStart || !boardEnd) {
      setErrorMsg("Board Name, Start Date, and End Date are required.");
      return;
    }
    try {
      setErrorMsg("");
      const res = await apiClient.post("/api/projects", {
        name: boardName,
        description: boardDesc,
        clientId: boardClient ? Number(boardClient) : null,
        projectManagerId: boardManager ? Number(boardManager) : null,
        startDate: boardStart,
        endDate: boardEnd,
        priority: boardPriority,
        budget: boardBudget ? Number(boardBudget) : null
      });

      if (res.data?.success) {
        setShowBoardModal(false);
        // Reset inputs
        setBoardName("");
        setBoardDesc("");
        setBoardClient("");
        setBoardManager("");
        setBoardStart("");
        setBoardEnd("");
        setBoardPriority("MEDIUM");
        setBoardBudget("");
        
        // Refresh project list and board
        fetchReferences();
        if (res.data.data?.id) {
          setSelectedProjectId(res.data.data.id.toString());
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create Board.");
    }
  };

  // Create Task handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskProjectId) {
      setErrorMsg("Task Title and Project Focus are required.");
      return;
    }
    try {
      setErrorMsg("");
      const validSubtasks = taskSubtasks.filter(t => t.trim() !== "");
      const res = await apiClient.post("/api/tasks", {
        title: taskTitle,
        description: taskDesc,
        projectId: Number(taskProjectId),
        assignedToId: taskAssigneeId ? Number(taskAssigneeId) : null,
        priority: taskPriority,
        status: taskTargetStatus,
        startDate: taskStart || undefined,
        dueDate: taskDue || undefined,
        estimatedHours: taskHours ? Number(taskHours) : 0,
        subTasks: validSubtasks.length > 0 ? validSubtasks : undefined
      });

      if (res.data?.success) {
        setShowTaskModal(false);
        // Reset inputs
        setTaskTitle("");
        setTaskDesc("");
        setTaskAssigneeId("");
        setTaskPriority("MEDIUM");
        setTaskStart("");
        setTaskDue("");
        setTaskHours("");
        setTaskSubtasks([""]);
        
        fetchBoard(selectedProjectId);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to create Task.");
    }
  };

  // Add subtask within task details modal
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !newSubtaskTitle.trim()) return;

    try {
      const res = await apiClient.post(`/api/tasks/${activeTask.id}/subtasks`, {
        title: newSubtaskTitle
      });
      if (res.data?.success) {
        const added = res.data.data;
        const updatedTask = {
          ...activeTask,
          subTasks: [...(activeTask.subTasks || []), added]
        };
        setActiveTask(updatedTask);
        setNewSubtaskTitle("");
        
        // Sync board
        fetchBoard(selectedProjectId);
      }
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
  };

  // Toggle subtask status in modal
  const handleToggleSubtask = async (subtaskId: number) => {
    if (!activeTask) return;
    try {
      const res = await apiClient.patch(`/api/tasks/subtasks/${subtaskId}/toggle`);
      if (res.data?.success) {
        const updatedSubtasks = (activeTask.subTasks || []).map(s => 
          s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
        );
        setActiveTask({
          ...activeTask,
          subTasks: updatedSubtasks
        });
        
        // Sync board
        fetchBoard(selectedProjectId);
      }
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
    }
  };

  // Delete Task in details modal
  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await apiClient.delete(`/api/tasks/${taskId}`);
      if (res.data?.success) {
        setShowDetailsModal(false);
        setActiveTask(null);
        fetchBoard(selectedProjectId);
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const getPriorityBadgeClass = (prio: string) => {
    switch (prio) {
      case "HIGH": return "badge-danger";
      case "MEDIUM": return "badge-warning";
      case "LOW": return "badge-info";
      default: return "badge-light";
    }
  };

  // Filtering local cards to display with client, created date, due date, status, priority, and search
  const filterTasks = (tasksList: TaskItem[]) => {
    return tasksList.filter(t => {
      // 1. Search term match (task title or project name)
      const matchesSearch = 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.project.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Priority filter match
      const matchesPriority = 
        selectedPriority === "ALL" || 
        t.priority === selectedPriority;

      // 3. Client match
      const proj = projects.find(p => p.id === t.projectId);
      const matchesClient =
        selectedClientId === "ALL" ||
        (proj && proj.clientId?.toString() === selectedClientId);

      // 4. Created Date match
      const matchesCreatedDate =
        !createdDateFilter ||
        (t.createdAt && new Date(t.createdAt) >= new Date(createdDateFilter));

      // 5. Due Date match
      const matchesDueDate =
        !dueDateFilter ||
        (t.dueDate && new Date(t.dueDate) <= new Date(dueDateFilter));

      // 6. Select Status match
      const matchesStatus =
        selectedStatusFilter === "ALL" ||
        t.status === selectedStatusFilter;

      return matchesSearch && matchesPriority && matchesClient && matchesCreatedDate && matchesDueDate && matchesStatus;
    });
  };

  // Subtask progress calculator for task card progress bar (with status fallback)
  const getSubtaskProgress = (task: TaskItem) => {
    const subs = task.subTasks || [];
    if (subs.length > 0) {
      const completed = subs.filter(s => s.isCompleted).length;
      return Math.round((completed / subs.length) * 100);
    }
    // Fallback status-based progress
    switch (task.status) {
      case "COMPLETED": return 100;
      case "IN_PROGRESS": return 50;
      case "ON_HOLD": return 15;
      case "PENDING": return 20;
      default: return 0;
    }
  };

  // Overall counters
  const allTasksCount = 
    boardData.TODO.length + 
    boardData.PENDING.length + 
    boardData.IN_PROGRESS.length + 
    boardData.COMPLETED.length + 
    boardData.ON_HOLD.length;

  const pendingTasksCount = boardData.PENDING.length + boardData.TODO.length;
  const completedTasksCount = boardData.COMPLETED.length;

  // Selected Project Object
  const currentProjectName = 
    selectedProjectId === "ALL" 
      ? "All Projects Workspace" 
      : projects.find(p => p.id.toString() === selectedProjectId)?.name || "Project Workspace";

  return (
    <div className="page-wrapper">
      {/* Dynamic Printing Styles for PDF Export */}
      <style>{`
        @media print {
          body, .page-wrapper {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .sidebar, .header, .page-breadcrumb, .btn, .card-footer, select, input, .alert, .btn-group {
            display: none !important;
          }
          .content {
            padding: 0 !important;
            margin: 0 !important;
          }
          .page-wrapper {
            margin-left: 0 !important;
          }
          .card {
            border: 0 !important;
            box-shadow: none !important;
          }
          .d-flex.overflow-x-auto {
            display: block !important;
            overflow: visible !important;
          }
          .flex-shrink-0 {
            width: 100% !important;
            margin-bottom: 30px !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="content">
        {/* Breadcrumb / Top Bar */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Task Board</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={all_routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Projects</li>
                <li className="breadcrumb-item active">Task Board</li>
              </ol>
            </nav>
          </div>

          <div className="d-flex align-items-center flex-wrap gap-2">
            <button 
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-1 shadow-sm"
              onClick={handleExportPDF}
            >
              <i className="ti ti-download fs-16" /> Export PDF
            </button>
            {isCompanyAdmin && (
              <button 
                className="btn btn-primary d-inline-flex align-items-center gap-1 shadow-sm"
                onClick={() => setShowBoardModal(true)}
              >
                <i className="ti ti-plus fs-16" /> Add Board
              </button>
            )}
          </div>
        </div>

        {/* Board Overview Header Card */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body p-3">
            <div className="row align-items-center g-3">
              {/* Board Title */}
              <div className="col-lg-4 col-md-12">
                <div className="d-flex align-items-center gap-2 mb-2">
                  {selectedProjectId !== "ALL" && projects.find(p => p.id.toString() === selectedProjectId) && (
                    <div className="avatar avatar-sm rounded-circle overflow-hidden bg-light d-inline-flex align-items-center justify-content-center" style={{ width: "30px", height: "30px" }}>
                      {(() => {
                        const activeProj = projects.find(p => p.id.toString() === selectedProjectId);
                        return activeProj?.logoUrl ? (
                          <img
                            src={activeProj.logoUrl.startsWith("http") ? activeProj.logoUrl : `${apiClient.defaults.baseURL || "http://localhost:5000"}${activeProj.logoUrl}`}
                            className="img-fluid"
                            alt="Project Logo"
                            style={{ width: "30px", height: "30px", objectFit: "cover" }}
                          />
                        ) : (
                          <ImageWithBasePath
                            src={`assets/img/social/project-${(activeProj.id % 4) + 1}.svg`}
                            alt="Project Logo"
                          />
                        );
                      })()}
                    </div>
                  )}
                  <h4 className="fw-bold text-dark mb-0">{currentProjectName}</h4>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge badge-light-secondary d-flex align-items-center gap-1">
                    Total Task: {allTasksCount}
                  </span>
                  <span className="badge badge-light-warning">
                    Pending: {pendingTasksCount}
                  </span>
                  <span className="badge badge-light-success">
                    Completed: {completedTasksCount}
                  </span>
                </div>
              </div>

              {/* Priority Filters */}
              <div className="col-lg-4 col-md-6 d-flex align-items-center gap-2">
                <span className="fs-13 fw-semibold text-muted text-nowrap">Priority:</span>
                <div className="btn-group btn-group-sm w-100 shadow-xs" role="group">
                  {["ALL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                    <button
                      type="button"
                      className={`btn ${selectedPriority === p ? "btn-primary" : "btn-outline-light border text-dark"}`}
                      key={p}
                      onClick={() => setSelectedPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Project Filter */}
              <div className="col-lg-4 col-md-6 d-flex gap-2">
                <div className="input-group input-group-sm flex-fill">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="ti ti-search text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  className="form-select form-select-sm w-auto fw-medium border-light shadow-xs"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="ALL">All Projects</option>
                  {projects.map(p => (
                    <option value={p.id} key={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Row */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3">
            <div className="row g-2 align-items-end">
              {/* Clients filter */}
              <div className="col-lg-2 col-md-4">
                <label className="form-label fs-11 fw-semibold text-muted mb-1">Clients</label>
                <select
                  className="form-select form-select-sm shadow-xs"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="ALL">All Clients</option>
                  {clients.map(c => (
                    <option value={c.id} key={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              {/* Created Date Filter */}
              <div className="col-lg-2 col-md-4">
                <label className="form-label fs-11 fw-semibold text-muted mb-1">Created Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm shadow-xs"
                  value={createdDateFilter}
                  onChange={(e) => setCreatedDateFilter(e.target.value)}
                />
              </div>

              {/* Due Date Filter */}
              <div className="col-lg-2 col-md-4">
                <label className="form-label fs-11 fw-semibold text-muted mb-1">Due Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm shadow-xs"
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value)}
                />
              </div>

              {/* Select Status Filter */}
              <div className="col-lg-2 col-md-4">
                <label className="form-label fs-11 fw-semibold text-muted mb-1">Select Status</label>
                <select
                  className="form-select form-select-sm shadow-xs"
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">Inprogress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">Onhold</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div className="col-lg-2 col-md-4">
                <label className="form-label fs-11 fw-semibold text-muted mb-1">Sort By</label>
                <select
                  className="form-select form-select-sm shadow-xs"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="createdAt">Created Date</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="col-lg-2 col-md-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100 shadow-xs"
                  onClick={() => {
                    setSelectedClientId("ALL");
                    setCreatedDateFilter("");
                    setDueDateFilter("");
                    setSelectedStatusFilter("ALL");
                    setSelectedPriority("ALL");
                    setSearchTerm("");
                    setSortBy("createdAt");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Board Content (Horizontal Scroll Column Layout) */}
        {loading ? (
          <div className="text-center p-5 card border-0 shadow-sm">
            <div className="spinner-border text-primary text-center" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted fw-semibold">Loading Kanban task board...</p>
          </div>
        ) : (
          <div className="d-flex gap-3 overflow-x-auto pb-4 flex-nowrap align-items-start" style={{ minHeight: "650px" }}>
            
            {/* COLUMN BUILDER HELPER */}
            {[
              { key: "TODO", label: "To Do", dotColor: "bg-purple", list: boardData.TODO },
              { key: "PENDING", label: "Pending", dotColor: "bg-danger", list: boardData.PENDING },
              { key: "IN_PROGRESS", label: "Inprogress", dotColor: "bg-info", list: boardData.IN_PROGRESS },
              { key: "COMPLETED", label: "Completed", dotColor: "bg-success", list: boardData.COMPLETED },
              { key: "ON_HOLD", label: "On-hold", dotColor: "bg-warning", list: boardData.ON_HOLD }
            ].map((col) => {
              const displayTasks = filterTasks(col.list);
              
              // Apply active sorting logic
              const sortedTasks = [...displayTasks].sort((a, b) => {
                if (sortBy === "dueDate") {
                  const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                  const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                  return dateA - dateB;
                }
                if (sortBy === "priority") {
                  const order: Record<string, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 };
                  return (order[a.priority] || 4) - (order[b.priority] || 4);
                }
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA; // Newest first
              });

              return (
                <div
                  className={`flex-shrink-0`}
                  style={{ width: "290px" }}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDrop={(e) => handleDrop(e, col.key)}
                  key={col.key}
                >
                  <div className={`card bg-light border-0 shadow-sm rounded-3 ${dragOverCol === col.key ? "border-primary border-2" : ""}`}>
                    {/* Header */}
                    <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center rounded-top-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`avatar avatar-xs ${col.dotColor} text-white rounded-circle me-1 d-inline-flex align-items-center justify-content-center fw-bold`}>
                          {displayTasks.length}
                        </span>
                        <h6 className="fw-bold text-dark mb-0">{col.label}</h6>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body p-2 d-flex flex-column gap-2 overflow-y-auto" style={{ minHeight: "480px", maxHeight: "680px" }}>
                      {sortedTasks.map((task) => {
                        const progress = getSubtaskProgress(task);
                        const subCount = task.subTasks?.length || 0;
                        const subCompleted = task.subTasks?.filter(s => s.isCompleted).length || 0;

                        return (
                          <div
                            className="card border shadow-xs bg-white cursor-grab hover-lift-effect"
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onClick={() => {
                              setActiveTask(task);
                              setShowDetailsModal(true);
                            }}
                          >
                            <div className="card-body p-3">
                              {/* Labels */}
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <span className="fs-10 fw-bold text-uppercase text-muted tracking-wider truncate" style={{ maxWidth: "150px" }}>
                                  {task.project.name}
                                </span>
                                <span className={`badge ${getPriorityBadgeClass(task.priority)} badge-xs rounded-pill`}>
                                  {task.priority}
                                </span>
                              </div>

                              {/* Title */}
                              <h6 className={`fw-bold text-dark mb-2 ${task.status === "COMPLETED" ? "text-decoration-line-through text-muted" : ""}`}>
                                {task.title}
                              </h6>

                              {/* Progress bar */}
                              <div className="mt-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fs-10 text-muted fw-semibold">Progress</span>
                                  <span className="fs-10 fw-bold text-primary">{progress}%</span>
                                </div>
                                <div className="progress" style={{ height: "6px" }}>
                                  <div 
                                    className={`progress-bar rounded ${progress === 100 ? "bg-success" : "bg-primary"}`}
                                    role="progressbar" 
                                    style={{ width: `${progress}%` }} 
                                  />
                                </div>
                              </div>

                              {/* Footer details */}
                              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-light">
                                <div className="d-flex align-items-center">
                                  {task.dueDate ? (
                                    <span className="fs-11 text-muted d-inline-flex align-items-center gap-1">
                                      <i className="ti ti-calendar fs-13 text-secondary" />
                                      Due on: {new Date(task.dueDate).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                                    </span>
                                  ) : (
                                    <span className="fs-10 text-danger d-inline-flex align-items-center gap-1 fw-bold bg-danger-light px-2 py-0.5 rounded-3">
                                      <i className="ti ti-alert-triangle fs-11" />
                                      Due Date Missing
                                    </span>
                                  )}
                                </div>
                                
                                <div className="d-flex align-items-center gap-2">
                                  {/* Subtask count indicator */}
                                  <span className="fs-11 text-muted d-inline-flex align-items-center gap-1" title="Checklist / subtasks">
                                    <i className="ti ti-checkbox fs-12 text-secondary" />
                                    {subCompleted || 14}/{subCount || 14}
                                  </span>

                                  {/* Staked Assignee Avatars */}
                                  <div className="avatar-group d-flex align-items-center">
                                    {task.assignedTo ? (
                                      <span 
                                        className="avatar avatar-xs bg-primary text-white rounded-circle fw-bold border border-white d-inline-flex align-items-center justify-content-center"
                                        title={`Assigned to ${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                                        style={{ width: "20px", height: "20px", fontSize: "9px" }}
                                      >
                                        {task.assignedTo.firstName[0].toUpperCase()}
                                      </span>
                                    ) : (
                                      <span 
                                        className="avatar avatar-xs bg-light text-muted rounded-circle fw-bold border border-white d-inline-flex align-items-center justify-content-center" 
                                        title="Unassigned"
                                        style={{ width: "20px", height: "20px", fontSize: "9px" }}
                                      >
                                        ?
                                      </span>
                                    )}
                                    <span className="avatar avatar-xs bg-secondary text-white rounded-circle fw-bold border border-white d-inline-flex align-items-center justify-content-center ms-n1" style={{ width: "20px", height: "20px", fontSize: "9px" }}>
                                      {task.project.name[0].toUpperCase()}
                                    </span>
                                    <span className="avatar avatar-xs bg-light text-dark rounded-circle fw-bold border border-white ms-n1 d-flex align-items-center justify-content-center" style={{ width: "20px", height: "20px", fontSize: "8px" }}>
                                      +1
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {displayTasks.length === 0 && (
                        <div className="text-center py-5 text-muted fs-12 fw-medium border-2 border-dashed border-light rounded-3 bg-white-50 m-2">
                          <i className="ti ti-apps fs-18 d-block mb-1 text-muted-40" />
                          Drag tasks here
                        </div>
                      )}
                    </div>

                    {/* Footer add button */}
                    {isCompanyAdmin && (
                      <div className="card-footer bg-white border-0 py-2 d-grid rounded-bottom-3">
                        <button
                          className="btn btn-outline-light border-dashed text-dark btn-sm d-flex align-items-center justify-content-center gap-1 rounded-3"
                          onClick={() => {
                            setTaskTargetStatus(col.key);
                            // If a project is focused, pre-set it in task creation
                            if (selectedProjectId !== "ALL") {
                              setTaskProjectId(selectedProjectId);
                            }
                            setShowTaskModal(true);
                          }}
                        >
                          <i className="ti ti-plus fs-13" /> New Task
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ADD BOARD (PROJECT) MODAL */}
      {/* ============================================================ */}
      {showBoardModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white border-0 py-3 rounded-top-3">
                <h5 className="modal-title fw-bold text-white">Create New Project Board</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowBoardModal(false)} />
              </div>
              <form onSubmit={handleCreateBoard}>
                <div className="modal-body p-4">
                  {errorMsg && <div className="alert alert-danger p-2 fs-13">{errorMsg}</div>}
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Board / Project Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Hospital Administration"
                        value={boardName}
                        onChange={(e) => setBoardName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Client</label>
                      <select
                        className="form-select"
                        value={boardClient}
                        onChange={(e) => setBoardClient(e.target.value)}
                      >
                        <option value="">Select Client (Optional)</option>
                        {clients.map(c => (
                          <option value={c.id} key={c.id}>{c.companyName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Project Manager</label>
                      <select
                        className="form-select"
                        value={boardManager}
                        onChange={(e) => setBoardManager(e.target.value)}
                      >
                        <option value="">Select Manager (Optional)</option>
                        {employees.map(emp => (
                          <option value={emp.id} key={emp.id}>{emp.firstName} {emp.lastName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={boardStart}
                        onChange={(e) => setBoardStart(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={boardEnd}
                        onChange={(e) => setBoardEnd(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Priority</label>
                      <select
                        className="form-select"
                        value={boardPriority}
                        onChange={(e) => setBoardPriority(e.target.value)}
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Budget (INR)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 500000"
                        value={boardBudget}
                        onChange={(e) => setBoardBudget(e.target.value)}
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Add some details about this project..."
                        value={boardDesc}
                        onChange={(e) => setBoardDesc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 py-3 bg-light rounded-bottom-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light" onClick={() => setShowBoardModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 shadow-sm">Save Board</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD TASK MODAL */}
      {/* ============================================================ */}
      {showTaskModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-primary text-white border-0 py-3 rounded-top-3">
                <h5 className="modal-title fw-bold text-white">Add Task ({taskTargetStatus})</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTaskModal(false)} />
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
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
                      <label className="form-label fw-semibold">Estimated Hours</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 15"
                        value={taskHours}
                        onChange={(e) => setTaskHours(e.target.value)}
                      />
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

                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Provide details about the task requirements..."
                        value={taskDesc}
                        onChange={(e) => setTaskDesc(e.target.value)}
                      />
                    </div>

                    {/* Subtasks builder */}
                    <div className="col-md-12">
                      <label className="form-label fw-semibold d-flex justify-content-between align-items-center">
                        Checklist / Sub-tasks
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-xs rounded-pill"
                          onClick={() => setTaskSubtasks([...taskSubtasks, ""])}
                        >
                          + Add Item
                        </button>
                      </label>
                      <div className="d-flex flex-column gap-2">
                        {taskSubtasks.map((st, i) => (
                          <div className="input-group input-group-sm" key={i}>
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`Checklist item #${i + 1}`}
                              value={st}
                              onChange={(e) => {
                                const next = [...taskSubtasks];
                                next[i] = e.target.value;
                                setTaskSubtasks(next);
                              }}
                            />
                            {taskSubtasks.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => {
                                  setTaskSubtasks(taskSubtasks.filter((_, idx) => idx !== i));
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 py-3 bg-light rounded-bottom-3 d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light" onClick={() => setShowTaskModal(false)}>Cancel</button>
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
                        Back to Board
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

export default TaskBoard;
