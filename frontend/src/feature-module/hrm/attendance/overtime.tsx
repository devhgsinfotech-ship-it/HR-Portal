import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";

interface OvertimeItem {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  profilePhotoUrl: string | null;
  department: string;
  designation: string;
  overtimeDate: string;
  hours: number;
  project: string;
  description: string;
  overtimeRate: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedById: number | null;
  approvedAt: string | null;
}

interface MetadataEmployee {
  id: number;
  employeeCode: string;
  name: string;
  departmentName: string;
}

const OverTime = () => {
  const [records, setRecords] = useState<OvertimeItem[]>([]);
  const [employees, setEmployees] = useState<MetadataEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "danger"; text: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Claim Form State
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [overtimeDate, setOvertimeDate] = useState("");
  const [hours, setHours] = useState("");
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");

  // Role Scoping
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "{}");
    } catch {
      return {};
    }
  })();
  const userRole = (currentUser?.role || "").toUpperCase();
  const isEmployee = userRole === "EMPLOYEE";
  const canManage = ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER"].includes(userRole);

  const fetchOvertimeAndMeta = async () => {
    try {
      setLoading(true);
      const [otRes, metaRes] = await Promise.all([
        apiClient.get("/api/shifts/overtime"),
        apiClient.get("/api/shifts/metadata"),
      ]);

      setRecords(otRes.data || []);
      if (metaRes.data?.employees) {
        setEmployees(metaRes.data.employees);
      }
    } catch (err: any) {
      console.error("Failed to load overtime records:", err);
      setFeedbackMsg({
        type: "danger",
        text: err.response?.data?.message || "Failed to load overtime data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertimeAndMeta();
  }, []);

  // Handle Form Submit (Claim Overtime)
  const handleClaimOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmployee && !selectedEmpId) {
      alert("Please select the employee claiming overtime.");
      return;
    }
    if (!overtimeDate || !hours) {
      alert("Please specify the date and overtime hours.");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/api/shifts/overtime", {
        employeeId: isEmployee ? undefined : selectedEmpId,
        overtimeDate,
        hours: parseFloat(hours),
        project: project || "General Project Task",
        description,
      });

      setFeedbackMsg({
        type: "success",
        text: "Overtime claim submitted successfully!",
      });

      // Reset
      setHours("");
      setProject("");
      setDescription("");
      setOvertimeDate("");
      setSelectedEmpId("");

      document.getElementById("close_overtime_modal")?.click();
      fetchOvertimeAndMeta();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit overtime claim");
    } finally {
      setSubmitting(false);
    }
  };

  // Status Change (Approve / Reject)
  const handleStatusChange = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(id);
      await apiClient.put(`/api/shifts/overtime/${id}`, { status });
      setFeedbackMsg({
        type: "success",
        text: `Overtime claim ${status.toLowerCase()} successfully!`,
      });
      fetchOvertimeAndMeta();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} claim`);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Overtime
  const handleDeleteClaim = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel or delete this overtime claim?")) return;
    try {
      setActionLoading(id);
      await apiClient.delete(`/api/shifts/overtime/${id}`);
      setFeedbackMsg({ type: "success", text: "Overtime claim deleted." });
      fetchOvertimeAndMeta();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete claim");
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const totalHours = records.reduce((sum, r) => sum + (r.status === "APPROVED" ? r.hours : 0), 0);
    const pendingCount = records.filter((r) => r.status === "PENDING").length;
    const approvedCount = records.filter((r) => r.status === "APPROVED").length;
    const rejectedCount = records.filter((r) => r.status === "REJECTED").length;
    return {
      totalHours: totalHours.toFixed(1),
      pendingCount,
      approvedCount,
      rejectedCount,
    };
  }, [records]);

  const columns = [
    {
      title: "Employee",
      dataIndex: "employeeName",
      render: (_text: string, record: OvertimeItem) => (
        <div className="d-flex align-items-center file-name-icon">
          <span className="avatar avatar-md border avatar-rounded bg-light text-primary fw-bold d-flex align-items-center justify-content-center overflow-hidden">
            {record.profilePhotoUrl ? (
              <img
                src={
                  record.profilePhotoUrl.startsWith("http")
                    ? record.profilePhotoUrl
                    : `${apiClient.defaults.baseURL || APP_CONFIG.getBackendUrl()}${record.profilePhotoUrl}`
                }
                className="img-fluid"
                alt={`${record.employeeName} Profile`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              record.employeeName?.substring(0, 2).toUpperCase() || "EM"
            )}
          </span>
          <div className="ms-2">
            <h6 className="fw-medium mb-0">{record.employeeName}</h6>
            <span className="fs-12 text-muted">{record.employeeCode}</span>
          </div>
        </div>
      ),
      sorter: (a: OvertimeItem, b: OvertimeItem) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: "Dept & Designation",
      dataIndex: "department",
      render: (_text: string, record: OvertimeItem) => (
        <div>
          <span className="fw-medium text-dark d-block">{record.department}</span>
          <span className="fs-12 text-muted">{record.designation}</span>
        </div>
      ),
    },
    {
      title: "Overtime Date",
      dataIndex: "overtimeDate",
      render: (text: string) => <span className="fw-medium">{text}</span>,
      sorter: (a: OvertimeItem, b: OvertimeItem) => (a.overtimeDate || "").localeCompare(b.overtimeDate || ""),
    },
    {
      title: "OT Hours",
      dataIndex: "hours",
      render: (text: number) => (
        <span className="badge badge-soft-info fs-13 fw-semibold">
          <i className="ti ti-clock me-1" />
          {text} {text === 1 ? "hr" : "hrs"}
        </span>
      ),
      sorter: (a: OvertimeItem, b: OvertimeItem) => a.hours - b.hours,
    },
    {
      title: "Project / Task",
      dataIndex: "project",
      render: (_text: string, record: OvertimeItem) => (
        <div>
          <span className="fw-medium text-dark d-block">{record.project}</span>
          {record.description && (
            <span className="fs-12 text-muted text-truncate d-inline-block" style={{ maxWidth: "220px" }}>
              {record.description}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: OvertimeItem["status"], record: OvertimeItem) => {
        let badgeClass = "badge-soft-warning";
        let icon = "ti-clock";
        if (text === "APPROVED") {
          badgeClass = "badge-soft-success";
          icon = "ti-check";
        } else if (text === "REJECTED") {
          badgeClass = "badge-soft-danger";
          icon = "ti-x";
        }
        return (
          <div>
            <span className={`badge ${badgeClass} d-inline-flex align-items-center gap-1`}>
              <i className={`ti ${icon}`} />
              {text}
            </span>
            {record.approvedAt && (
              <div className="fs-11 text-muted mt-1">Reviewed: {record.approvedAt}</div>
            )}
          </div>
        );
      },
      sorter: (a: OvertimeItem, b: OvertimeItem) => a.status.localeCompare(b.status),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_text: string, record: OvertimeItem) => {
        const isPending = record.status === "PENDING";
        const isLoadingThis = actionLoading === record.id;

        return (
          <div className="d-flex align-items-center gap-1">
            {canManage && isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center"
                  onClick={() => handleStatusChange(record.id, "APPROVED")}
                  disabled={isLoadingThis}
                  title="Approve Overtime"
                >
                  <i className="ti ti-check" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                  onClick={() => handleStatusChange(record.id, "REJECTED")}
                  disabled={isLoadingThis}
                  title="Reject Overtime"
                >
                  <i className="ti ti-x" />
                </button>
              </>
            )}

            {isPending && (
              <button
                type="button"
                className="btn btn-sm btn-light text-muted d-inline-flex align-items-center"
                onClick={() => handleDeleteClaim(record.id)}
                disabled={isLoadingThis}
                title="Cancel Claim"
              >
                <i className="ti ti-trash" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Overtime Management</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Overtime
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              <button
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#claim_overtime_modal"
                className="btn btn-primary d-inline-flex align-items-center"
              >
                <i className="ti ti-plus me-1" />
                Claim Overtime
              </button>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>

          {/* Feedback Msg */}
          {feedbackMsg && (
            <div
              className={`alert alert-${feedbackMsg.type} alert-dismissible fade show d-flex align-items-center`}
              role="alert"
            >
              <i
                className={`ti ${
                  feedbackMsg.type === "success" ? "ti-circle-check" : "ti-alert-triangle"
                } fs-18 me-2`}
              />
              <div>{feedbackMsg.text}</div>
              <button type="button" className="btn-close" onClick={() => setFeedbackMsg(null)} />
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="row mb-3">
            <div className="col-xl-3 col-sm-6 mb-3 mb-xl-0">
              <div className="card shadow-none border mb-0">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md bg-primary-subtle text-primary rounded-circle me-3">
                      <i className="ti ti-hourglass-empty fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">Approved OT Hours</p>
                      <h4 className="fw-bold mb-0">{kpis.totalHours} hrs</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-3 mb-xl-0">
              <div className="card shadow-none border mb-0">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md bg-warning-subtle text-warning rounded-circle me-3">
                      <i className="ti ti-clock fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">Pending Review</p>
                      <h4 className="fw-bold mb-0">{kpis.pendingCount}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-3 mb-xl-0">
              <div className="card shadow-none border mb-0">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md bg-success-subtle text-success rounded-circle me-3">
                      <i className="ti ti-check fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">Approved Claims</p>
                      <h4 className="fw-bold mb-0">{kpis.approvedCount}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-3 mb-xl-0">
              <div className="card shadow-none border mb-0">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md bg-danger-subtle text-danger rounded-circle me-3">
                      <i className="ti ti-x fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">Rejected</p>
                      <h4 className="fw-bold mb-0">{kpis.rejectedCount}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0">
                {isEmployee ? "My Overtime Claims" : "Employee Overtime Records"}
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="input-icon position-relative">
                  <span className="input-icon-addon">
                    <i className="ti ti-search" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employee, project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ minWidth: "220px" }}
                  />
                </div>

                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ minWidth: "150px" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading overtime records...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-clock fs-36 text-muted mb-2 d-block" />
                  <h6 className="fw-semibold">No overtime records found</h6>
                  <p className="text-muted fs-13">
                    {searchQuery
                      ? "No records matching your search query."
                      : "Click 'Claim Overtime' to log extra work hours."}
                  </p>
                </div>
              ) : (
                <div className="custom-datatable-filter table-responsive">
                  <Table dataSource={filteredRecords} columns={columns} Selection={false} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2026 © SmartHR - Work Arrangement Module</p>
        </div>
      </div>

      {/* Claim Overtime Modal */}
      <div id="claim_overtime_modal" className="modal custom-modal fade" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-md" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center">
                <i className="ti ti-clock-plus me-2 text-primary" />
                Claim Overtime Hours
              </h5>
              <button
                id="close_overtime_modal"
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleClaimOvertime}>
              <div className="modal-body">
                <div className="row g-3">
                  {!isEmployee && (
                    <div className="col-12">
                      <label className="form-label">
                        Employee <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={selectedEmpId}
                        onChange={(e) => setSelectedEmpId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Employee --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={String(emp.id)}>
                            {emp.name} ({emp.employeeCode}) - {emp.departmentName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="col-md-6">
                    <label className="form-label">
                      Overtime Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={overtimeDate}
                      onChange={(e) => setOvertimeDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Extra Hours Worked <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="16"
                      className="form-control"
                      placeholder="e.g. 2.5"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Project / Deliverable Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Core App Migration / Release Patch"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Work Description / Justification</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Provide details about the emergency tasks completed during these overtime hours..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Overtime Claim"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverTime;
