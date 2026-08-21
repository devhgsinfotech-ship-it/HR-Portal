import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../core/common/dataTable/index";
import apiClient from "../../../core/utils/apiClient";
import { useAppSelector } from "../../../core/data/redux/store";

interface Project {
  id: number;
  name: string;
}

interface Task {
  id: number;
  name: string;
  title?: string;
}

interface TimeLog {
  id: number;
  logDate: string;
  hoursSpent: number;
  billableHours: number;
  description: string | null;
  approvalStatus: string;
  project: {
    id: number;
    name: string;
  };
  task: {
    id: number;
    title: string;
  } | null;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const TimeSheet = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  // Scopes & Permissions check
  const isFinanceOrAdmin = currentUser?.role === 'SUPER_ADMIN' || 
                           currentUser?.role === 'HR' ||
                           currentUser?.permissions?.some(p => p.module === 'FINANCE' && p.canWrite);

  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProject, setFilterProject] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [logDate, setLogDate] = useState("");
  const [hoursSpent, setHoursSpent] = useState("");
  const [billableHours, setBillableHours] = useState("");
  const [description, setDescription] = useState("");

  const [message, setMessage] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // If Finance or Admin, call GET /api/timesheets which returns employee scopes automatically or we query all
      const res = await apiClient.get("/api/timesheets");
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get("/api/projects");
      if (res.data?.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  // When selected project changes in Form, fetch project tasks
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }
    const fetchProjectTasks = async () => {
      try {
        const res = await apiClient.get(`/api/tasks?projectId=${selectedProjectId}`);
        if (res.data?.success) {
          setTasks(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load tasks:", err);
      }
    };
    fetchProjectTasks();
  }, [selectedProjectId]);

  useEffect(() => {
    fetchLogs();
    fetchProjects();
  }, []);

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !logDate || !hoursSpent) return;

    try {
      setMessage("");
      const payload = {
        projectId: parseInt(selectedProjectId, 10),
        taskId: selectedTaskId ? parseInt(selectedTaskId, 10) : undefined,
        logDate,
        hoursSpent: parseFloat(hoursSpent),
        billableHours: billableHours ? parseFloat(billableHours) : parseFloat(hoursSpent),
        description
      };

      const res = await apiClient.post("/api/timesheets", payload);
      if (res.data?.success) {
        setSelectedProjectId("");
        setSelectedTaskId("");
        setLogDate("");
        setHoursSpent("");
        setBillableHours("");
        setDescription("");

        // Refresh
        fetchLogs();

        // Close modal
        const closeBtn = document.getElementById("close-logtime-modal");
        if (closeBtn) closeBtn.click();
      }
    } catch (err: any) {
      console.error("Failed to log time:", err);
      setMessage(err.response?.data?.message || "Failed to log hours.");
    }
  };

  const handleDeleteLog = async (logId: number) => {
    if (!window.confirm("Are you sure you want to delete this log entry?")) return;
    try {
      const res = await apiClient.delete(`/api/timesheets/${logId}`);
      if (res.data?.success) {
        fetchLogs();
      }
    } catch (err) {
      console.error("Failed to delete log entry:", err);
    }
  };

  const handleApproveLog = async (logId: number, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await apiClient.patch(`/api/timesheets/${logId}/approve`, { status });
      if (res.data?.success) {
        fetchLogs();
      }
    } catch (err) {
      console.error("Failed to approve log:", err);
    }
  };

  // Filter logs locally
  const filteredLogs = logs.filter((log) => {
    if (filterProject !== "ALL" && log.project.id !== parseInt(filterProject, 10)) return false;
    if (filterStatus !== "ALL" && log.approvalStatus !== filterStatus) return false;
    return true;
  });

  const columns: any[] = [
    {
      title: "Employee",
      dataIndex: "employee",
      render: (emp: any) => (
        <span className="fw-medium text-dark">{emp ? `${emp.firstName} ${emp.lastName}` : "N/A"}</span>
      ),
      sorter: (a: TimeLog, b: TimeLog) => `${a.employee.firstName} ${a.employee.lastName}`.localeCompare(`${b.employee.firstName} ${b.employee.lastName}`),
    },
    {
      title: "Project",
      dataIndex: "project",
      render: (proj: any) => <span className="fw-medium">{proj?.name || "N/A"}</span>,
      sorter: (a: TimeLog, b: TimeLog) => a.project.name.localeCompare(b.project.name),
    },
    {
      title: "Date",
      dataIndex: "logDate",
      render: (d: string) => <span>{new Date(d).toLocaleDateString()}</span>,
      sorter: (a: TimeLog, b: TimeLog) => new Date(a.logDate).getTime() - new Date(b.logDate).getTime(),
    },
    {
      title: "Task",
      dataIndex: "task",
      render: (task: any) => <span>{task?.title || "General / Other"}</span>,
    },
    {
      title: "Hours Spent",
      dataIndex: "hoursSpent",
      render: (hrs: number) => <span className="fw-bold">{hrs} hrs</span>,
      sorter: (a: TimeLog, b: TimeLog) => a.hoursSpent - b.hoursSpent,
    },
    {
      title: "Billable Hours",
      dataIndex: "billableHours",
      render: (hrs: number) => <span>{hrs} hrs</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (desc: string) => <span className="text-muted text-truncate d-inline-block" style={{ maxWidth: "200px" }}>{desc || "--"}</span>
    },
    {
      title: "Status",
      dataIndex: "approvalStatus",
      render: (status: string) => {
        let badgeClass = "bg-warning-transparent text-warning";
        if (status === "APPROVED") badgeClass = "bg-success-transparent text-success";
        if (status === "REJECTED") badgeClass = "bg-danger-transparent text-danger";
        return <span className={`badge ${badgeClass}`}>{status}</span>;
      },
      sorter: (a: TimeLog, b: TimeLog) => a.approvalStatus.localeCompare(b.approvalStatus),
    },
    {
      title: "Action",
      dataIndex: "id",
      render: (id: number, record: TimeLog) => (
        <div className="d-flex align-items-center gap-2">
          {isFinanceOrAdmin && record.approvalStatus === "PENDING" && (
            <>
              <button
                onClick={() => handleApproveLog(id, "APPROVED")}
                className="btn btn-xs btn-success text-white"
                title="Approve Hours"
              >
                Approve
              </button>
              <button
                onClick={() => handleApproveLog(id, "REJECTED")}
                className="btn btn-xs btn-danger text-white"
                title="Reject Hours"
              >
                Reject
              </button>
            </>
          )}
          {record.approvalStatus === "PENDING" && (
            <button
              onClick={() => handleDeleteLog(id)}
              className="btn btn-link text-danger p-0"
              title="Delete Entry"
            >
              <i className="ti ti-trash fs-14" />
            </button>
          )}
        </div>
      ),
    }
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Time Logs (Timesheets)</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">HRM</li>
                  <li className="breadcrumb-item active">Timesheets</li>
                </ol>
              </nav>
            </div>
            
            <div className="mb-2">
              <button
                data-bs-toggle="modal"
                data-bs-target="#log_time_modal"
                className="btn btn-primary d-flex align-items-center"
              >
                <i className="ti ti-clock me-2" />
                Log Hours
              </button>
            </div>
          </div>

          {/* Filtering */}
          <div className="card mb-3 shadow-xs">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <h5 className="mb-0 fw-semibold">Logged Hours Index</h5>
                <div className="d-flex align-items-center flex-wrap gap-3">
                  <span className="fs-12 text-muted">Project:</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                  >
                    <option value="ALL">All Projects</option>
                    {projects.map(p => (
                      <option value={p.id} key={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <span className="fs-12 text-muted">Status:</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All States</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table index */}
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              <Table
                dataSource={filteredLogs}
                columns={columns}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Log Time Modal */}
      <div className="modal fade" id="log_time_modal" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Log Daily Worked Hours</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                id="close-logtime-modal"
              />
            </div>
            <form onSubmit={handleLogTime}>
              <div className="modal-body">
                {message && <div className="alert alert-danger mb-3">{message}</div>}
                
                <div className="mb-3">
                  <label className="form-label fs-13">Choose Project <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map(p => (
                      <option value={p.id} key={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13">Project Task</label>
                  <select
                    className="form-select"
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    disabled={!selectedProjectId}
                  >
                    <option value="">-- General / No Specific Task --</option>
                    {tasks.map(t => (
                      <option value={t.id} key={t.id}>{t.title || t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13">Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label fs-13">Hours Logged <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      className="form-control"
                      placeholder="e.g. 8"
                      value={hoursSpent}
                      onChange={(e) => setHoursSpent(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label fs-13">Billable Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      className="form-control"
                      placeholder="Same as hours spent"
                      value={billableHours}
                      onChange={(e) => setBillableHours(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13">Activity Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide details on features developed, bug fixes, or administrative scope..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedProjectId || !logDate || !hoursSpent}
                >
                  Submit Hours
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default TimeSheet;