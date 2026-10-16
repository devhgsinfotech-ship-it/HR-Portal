import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";

interface CronJobItem {
  id: number;
  key: string;
  name: string;
  description: string | null;
  schedule: string;
  scheduleHuman: string;
  status: "ACTIVE" | "PAUSED";
  lastRun: string | null;
  nextRun: string | null;
  lastStatus: "SUCCESS" | "FAILED" | "RUNNING" | null;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

const Cronjob: React.FC = () => {
  const routes = all_routes;

  const [jobs, setJobs] = useState<CronJobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/cronjobs");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setJobs(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch cron jobs:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to load cron jobs.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRunNow = async (jobKey: string) => {
    try {
      setRunningKey(jobKey);
      setAlert(null);
      const res = await apiClient.post(`/cronjobs/${jobKey}/run`);
      if (res.data?.success) {
        setAlert({
          type: "success",
          message: res.data.message || `Cron job '${jobKey}' executed successfully.`,
        });
        // Update job record in state
        if (res.data.data) {
          setJobs((prev) =>
            prev.map((j) => (j.key === jobKey ? res.data.data : j))
          );
        }
      }
    } catch (err: any) {
      console.error("Failed to execute cron job:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || `Failed to run job '${jobKey}'.`,
      });
    } finally {
      setRunningKey(null);
    }
  };

  const handleToggleStatus = async (jobKey: string, currentStatus: "ACTIVE" | "PAUSED") => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      setTogglingKey(jobKey);
      setAlert(null);

      // Optimistic state update
      setJobs((prev) =>
        prev.map((j) => (j.key === jobKey ? { ...j, status: newStatus } : j))
      );

      const res = await apiClient.put(`/cronjobs/${jobKey}/toggle`, {
        status: newStatus,
      });

      if (res.data?.success) {
        setAlert({
          type: "success",
          message: res.data.message,
        });
        if (res.data.data) {
          setJobs((prev) =>
            prev.map((j) => (j.key === jobKey ? res.data.data : j))
          );
        }
      }
    } catch (err: any) {
      console.error("Failed to toggle cron job:", err);
      // Revert optimistic update
      setJobs((prev) =>
        prev.map((j) => (j.key === jobKey ? { ...j, status: currentStatus } : j))
      );
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to toggle status.",
      });
    } finally {
      setTogglingKey(null);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Never run yet";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getJobIcon = (key: string) => {
    switch (key) {
      case "attendance_auto_checkout":
        return "ti ti-clock-check text-primary";
      case "probation_notice_tracker":
        return "ti ti-bell-ringing text-warning";
      case "monthly_leave_accrual":
        return "ti ti-calendar-event text-success";
      case "system_token_cleanup":
        return "ti ti-trash-x text-info";
      default:
        return "ti ti-cpu text-secondary";
    }
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.scheduleHuman.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.description && j.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCount = jobs.filter((j) => j.status === "ACTIVE").length;

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumb */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Settings</h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Other Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Cronjob
                </li>
              </ol>
            </nav>
          </div>
          <div className="head-icons ms-2">
            <CollapseHeader />
          </div>
        </div>
        {/* /Breadcrumb */}

        {/* Settings Navigation Tabs */}
        <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3">
          <li className="nav-item">
            <Link className="nav-link" to={routes.profilesettings}>
              <i className="ti ti-settings me-2" />
              General Settings
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to={routes.businessSettings}>
              <i className="ti ti-world-cog me-2" />
              Website Settings
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to={routes.salarySettings}>
              <i className="ti ti-device-ipad-horizontal-cog me-2" />
              App Settings
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to={routes.emailSettings}>
              <i className="ti ti-server-cog me-2" />
              System Settings
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to={routes.paymentGateways}>
              <i className="ti ti-settings-dollar me-2" />
              Financial Settings
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link active" to={routes.cronjob}>
              <i className="ti ti-settings-2 me-2" />
              Other Settings
            </Link>
          </li>
        </ul>

        {/* Global Alert Notification */}
        {alert && (
          <div
            className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center justify-content-between mb-3`}
            role="alert"
          >
            <div className="d-flex align-items-center">
              <i
                className={`ti ${
                  alert.type === "success" ? "ti-circle-check" : "ti-alert-circle"
                } fs-20 me-2`}
              />
              <span>{alert.message}</span>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setAlert(null)}
            />
          </div>
        )}

        <div className="row">
          {/* Submenu Sidebar */}
          <div className="col-xl-3 theiaStickySidebar">
            <div className="card">
              <div className="card-body">
                <div className="d-flex flex-column list-group settings-list">
                  <Link
                    to={routes.cronjob}
                    className="d-inline-flex align-items-center rounded active py-2 px-3"
                  >
                    <i className="ti ti-arrow-badge-right me-2" />
                    Cronjob
                  </Link>
                  <Link
                    to={routes.banIpAddress}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
                    Ban IP Address
                  </Link>
                  <Link
                    to={routes.backup}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
                    Backup
                  </Link>
                  <Link
                    to={routes.clearcache}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
                    Clear Cache
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-xl-9">
            {/* KPI Cards */}
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm mb-3">
                  <div className="card-body p-3 d-flex align-items-center">
                    <div className="avatar avatar-md bg-primary-transparent text-primary rounded-circle me-3 d-flex align-items-center justify-content-center">
                      <i className="ti ti-cpu fs-22" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">
                        Total Jobs
                      </p>
                      <h4 className="mb-0 fw-bold">{jobs.length}</h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm mb-3">
                  <div className="card-body p-3 d-flex align-items-center">
                    <div className="avatar avatar-md bg-success-transparent text-success rounded-circle me-3 d-flex align-items-center justify-content-center">
                      <i className="ti ti-activity fs-22" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">
                        Active Jobs
                      </p>
                      <h4 className="mb-0 fw-bold">{activeCount}</h4>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm mb-3">
                  <div className="card-body p-3 d-flex align-items-center">
                    <div className="avatar avatar-md bg-info-transparent text-info rounded-circle me-3 d-flex align-items-center justify-content-center">
                      <i className="ti ti-server fs-22" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-12 text-uppercase fw-semibold">
                        Cron Engine
                      </p>
                      <div className="d-flex align-items-center mt-1">
                        <span className="badge badge-sm badge-success-transparent text-success d-inline-flex align-items-center">
                          <span
                            className="bg-success rounded-circle me-1"
                            style={{ width: "6px", height: "6px" }}
                          />
                          node-cron active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cron Jobs Table Card */}
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h4 className="mb-0">Automated Cron Jobs</h4>
                  <p className="text-muted fs-13 mb-0">
                    Background automated scheduled jobs for HR compliance, attendance, leave accrual, and database maintenance.
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="input-icon-start position-relative">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ minWidth: "180px" }}
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-search" />
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={fetchJobs}
                    disabled={loading}
                    title="Refresh Job Status"
                  >
                    <i className={`ti ti-refresh ${loading ? "spin" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ minWidth: "300px", maxWidth: "380px" }}>Job Name & Description</th>
                        <th style={{ minWidth: "160px" }}>Schedule</th>
                        <th style={{ minWidth: "190px" }}>Last Execution</th>
                        <th style={{ minWidth: "110px" }}>Status</th>
                        <th style={{ minWidth: "90px" }} className="text-center">
                          Active
                        </th>
                        <th style={{ minWidth: "120px" }} className="text-end">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5">
                            <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
                            <span className="text-muted">Loading cron jobs...</span>
                          </td>
                        </tr>
                      ) : filteredJobs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5 text-muted">
                            <i className="ti ti-calendar-off fs-32 d-block mb-2 text-muted" />
                            No cron jobs matched your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredJobs.map((job) => {
                          const isRunning = runningKey === job.key || job.lastStatus === "RUNNING";
                          const isToggling = togglingKey === job.key;

                          return (
                            <tr key={job.id}>
                              {/* Name & Details */}
                              <td style={{ whiteSpace: "normal", minWidth: "300px", maxWidth: "380px" }}>
                                <div className="d-flex align-items-start">
                                  <div className="avatar avatar-sm rounded bg-light me-3 flex-shrink-0 mt-1 d-flex align-items-center justify-content-center">
                                    <i className={`${getJobIcon(job.key)} fs-18`} />
                                  </div>
                                  <div>
                                    <h6 className="fw-semibold mb-1 fs-14 text-dark">{job.name}</h6>
                                    <p
                                      className="text-muted fs-12 mb-0"
                                      style={{
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        lineHeight: "1.45",
                                      }}
                                    >
                                      {job.description}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* Schedule */}
                              <td style={{ whiteSpace: "nowrap" }}>
                                <div>
                                  <div className="fw-medium text-dark fs-13 mb-1">
                                    <i className="ti ti-clock me-1 text-muted" />
                                    {job.scheduleHuman}
                                  </div>
                                  <span className="badge bg-light text-secondary border font-monospace fs-11">
                                    {job.schedule}
                                  </span>
                                </div>
                              </td>

                              {/* Last Execution */}
                              <td style={{ whiteSpace: "normal", minWidth: "190px" }}>
                                <div>
                                  <div className="text-dark fs-12 fw-medium mb-1">
                                    {formatDateTime(job.lastRun)}
                                  </div>
                                  {job.lastStatus === "SUCCESS" && (
                                    <span className="badge badge-sm badge-success-transparent text-success d-inline-flex align-items-center">
                                      <i className="ti ti-circle-check me-1" /> Success
                                    </span>
                                  )}
                                  {job.lastStatus === "FAILED" && (
                                    <span className="badge badge-sm badge-danger-transparent text-danger d-inline-flex align-items-center">
                                      <i className="ti ti-alert-triangle me-1" /> Failed
                                    </span>
                                  )}
                                  {job.lastStatus === "RUNNING" && (
                                    <span className="badge badge-sm badge-info-transparent text-info d-inline-flex align-items-center">
                                      <span className="spinner-border spinner-border-sm me-1" /> Running
                                    </span>
                                  )}
                                  {!job.lastStatus && (
                                    <span className="badge badge-sm bg-light text-muted">Pending</span>
                                  )}

                                  {job.lastMessage && (
                                    <div
                                      className="text-muted fs-11 mt-1"
                                      style={{
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        lineHeight: "1.3",
                                        maxWidth: "240px",
                                      }}
                                      title={job.lastMessage}
                                    >
                                      {job.lastMessage}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td style={{ whiteSpace: "nowrap" }}>
                                {job.status === "ACTIVE" ? (
                                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fs-12 rounded-pill">
                                    <i className="ti ti-player-play-filled me-1 fs-10" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 fs-12 rounded-pill">
                                    <i className="ti ti-player-pause-filled me-1 fs-10" />
                                    Paused
                                  </span>
                                )}
                              </td>

                              {/* Active Toggle Switch */}
                              <td className="text-center" style={{ whiteSpace: "nowrap" }}>
                                <div className="form-check form-switch d-inline-flex align-items-center mb-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id={`toggle-${job.key}`}
                                    checked={job.status === "ACTIVE"}
                                    disabled={isToggling}
                                    onChange={() => handleToggleStatus(job.key, job.status)}
                                    style={{ cursor: "pointer", width: "36px", height: "18px" }}
                                    title={job.status === "ACTIVE" ? "Click to Pause" : "Click to Activate"}
                                  />
                                </div>
                              </td>

                              {/* Run Now Action */}
                              <td className="text-end" style={{ whiteSpace: "nowrap" }}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary d-inline-flex align-items-center"
                                  onClick={() => handleRunNow(job.key)}
                                  disabled={isRunning}
                                  title="Execute this job immediately"
                                >
                                  {isRunning ? (
                                    <>
                                      <span
                                        className="spinner-border spinner-border-sm me-1"
                                        role="status"
                                        aria-hidden="true"
                                      />
                                      Running...
                                    </>
                                  ) : (
                                    <>
                                      <i className="ti ti-bolt me-1" />
                                      Run Now
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* /Cron Jobs Table Card */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cronjob;
