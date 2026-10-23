import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "@/core/common/collapse-header/collapse-header";
import Table from "../../../core/common/dataTable/index";
import { all_routes } from "@/router/all_routes";
import ShiftSwapRequestsModal from "./modal/shiftSwapRequestsModal";
import apiClient from "@/core/utils/apiClient";
import { APP_CONFIG } from "@/environment";

interface ShiftSwapItem {
  id: number;
  requesterId: number;
  name: string;
  employeeCode: string;
  profilePhotoUrl: string | null;
  designation: string;
  department: string;
  targetEmployeeId: number | null;
  targetEmployeeName: string;
  shiftDate: string;
  currentShiftId: number;
  currentShift: string;
  requestedShiftId: number;
  requestedShift: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const ShiftSwapRequests = () => {
  const [swaps, setSwaps] = useState<ShiftSwapItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [shiftPolicies, setShiftPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "danger"; text: string } | null>(null);

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

  const fetchSwapsAndMeta = async () => {
    try {
      setLoading(true);
      const [swapsRes, metaRes] = await Promise.all([
        apiClient.get("/api/shifts/swaps"),
        apiClient.get("/api/shifts/metadata"),
      ]);

      setSwaps(swapsRes.data || []);
      if (metaRes.data) {
        setEmployees(metaRes.data.allEmployees || metaRes.data.employees || []);
        setShiftPolicies(metaRes.data.shiftPolicies || []);
      }
    } catch (err: any) {
      console.error("Failed to load shift swap data:", err);
      setFeedbackMsg({
        type: "danger",
        text: err.response?.data?.message || "Failed to load shift swap requests",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwapsAndMeta();
  }, []);

  const handleUpdateStatus = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(id);
      await apiClient.put(`/api/shifts/swaps/${id}/status`, { status });
      setFeedbackMsg({
        type: "success",
        text: `Shift swap request ${status.toLowerCase()} successfully!`,
      });
      fetchSwapsAndMeta();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSwap = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this swap request?")) return;
    try {
      setActionLoading(id);
      await apiClient.delete(`/api/shifts/swaps/${id}`);
      setFeedbackMsg({ type: "success", text: "Shift swap request cancelled." });
      fetchSwapsAndMeta();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel request");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSwaps = useMemo(() => {
    return swaps.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.targetEmployeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [swaps, searchQuery, statusFilter]);

  const kpis = useMemo(() => {
    const total = swaps.length;
    const pending = swaps.filter((s) => s.status === "PENDING").length;
    const approved = swaps.filter((s) => s.status === "APPROVED").length;
    const rejected = swaps.filter((s) => s.status === "REJECTED").length;
    return { total, pending, approved, rejected };
  }, [swaps]);

  const columns = [
    {
      title: "Employee",
      dataIndex: "name",
      render: (_text: string, record: ShiftSwapItem) => (
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
                alt={`${record.name} Profile`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              record.name?.substring(0, 2).toUpperCase() || "EM"
            )}
          </span>
          <div className="ms-2">
            <h6 className="fw-medium mb-0">{record.name}</h6>
            <span className="fs-12 text-muted">{record.employeeCode}</span>
          </div>
        </div>
      ),
      sorter: (a: ShiftSwapItem, b: ShiftSwapItem) => a.name.localeCompare(b.name),
    },
    {
      title: "Designation & Dept",
      dataIndex: "designation",
      render: (_text: string, record: ShiftSwapItem) => (
        <div>
          <span className="fw-medium d-block">{record.designation}</span>
          <span className="fs-12 text-muted">{record.department}</span>
        </div>
      ),
    },
    {
      title: "Current Shift",
      dataIndex: "currentShift",
      render: (text: string) => (
        <span className="badge badge-soft-secondary fs-12 fw-normal">{text}</span>
      ),
    },
    {
      title: "Requested Shift / Swap With",
      dataIndex: "requestedShift",
      render: (_text: string, record: ShiftSwapItem) => (
        <div>
          <span className="badge badge-soft-primary fs-12 fw-semibold d-inline-block mb-1">
            {record.requestedShift}
          </span>
          {record.targetEmployeeName && record.targetEmployeeName !== "Open Swap" && (
            <div className="fs-12 text-muted">
              <i className="ti ti-arrows-left-right me-1 text-primary" />
              With: <strong>{record.targetEmployeeName}</strong>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Shift Date",
      dataIndex: "shiftDate",
      render: (text: string, record: ShiftSwapItem) => (
        <div>
          <span className="fw-medium text-dark">{text || "N/A"}</span>
          <div className="fs-11 text-muted">Filed: {record.createdAt}</div>
        </div>
      ),
      sorter: (a: ShiftSwapItem, b: ShiftSwapItem) => (a.shiftDate || "").localeCompare(b.shiftDate || ""),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      render: (text: string) => (
        <span className="fs-12 text-muted text-truncate d-inline-block" style={{ maxWidth: "200px" }} title={text}>
          {text || "No reason given"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: ShiftSwapItem["status"]) => {
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
          <span className={`badge ${badgeClass} d-inline-flex align-items-center gap-1`}>
            <i className={`ti ${icon}`} />
            {text}
          </span>
        );
      },
      sorter: (a: ShiftSwapItem, b: ShiftSwapItem) => a.status.localeCompare(b.status),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_text: string, record: ShiftSwapItem) => {
        const isPending = record.status === "PENDING";
        const isLoadingThis = actionLoading === record.id;

        return (
          <div className="d-flex align-items-center gap-1">
            {canManage && isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center"
                  onClick={() => handleUpdateStatus(record.id, "APPROVED")}
                  disabled={isLoadingThis}
                  title="Approve Swap"
                >
                  <i className="ti ti-check" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                  onClick={() => handleUpdateStatus(record.id, "REJECTED")}
                  disabled={isLoadingThis}
                  title="Reject Swap"
                >
                  <i className="ti ti-x" />
                </button>
              </>
            )}

            {isPending && (
              <button
                type="button"
                className="btn btn-sm btn-light text-muted d-inline-flex align-items-center"
                onClick={() => handleDeleteSwap(record.id)}
                disabled={isLoadingThis}
                title="Cancel Swap Request"
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
              <h2 className="mb-1">Shift Swap Requests</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Shift Swap Requests
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              <button
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#add_shift_swap_modal"
                className="btn btn-primary d-inline-flex align-items-center"
              >
                <i className="ti ti-arrows-shuffle me-1" />
                Request Shift Swap
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

          {/* KPI Cards */}
          <div className="row mb-3">
            <div className="col-xl-3 col-sm-6 mb-3 mb-xl-0">
              <div className="card shadow-none border mb-0">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md bg-primary-subtle text-primary rounded-circle me-3">
                      <i className="ti ti-arrows-shuffle fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">Total Swaps</p>
                      <h4 className="fw-bold mb-0">{kpis.total}</h4>
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
                      <p className="text-muted mb-0 fs-13">Pending Approval</p>
                      <h4 className="fw-bold mb-0">{kpis.pending}</h4>
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
                      <p className="text-muted mb-0 fs-13">Approved Swaps</p>
                      <h4 className="fw-bold mb-0">{kpis.approved}</h4>
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
                      <h4 className="fw-bold mb-0">{kpis.rejected}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Card */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0">
                {isEmployee ? "My Shift Swap Requests" : "All Shift Swap Requests"}
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="input-icon position-relative">
                  <span className="input-icon-addon">
                    <i className="ti ti-search" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search requester, colleague..."
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
                  <p className="mt-2 text-muted">Loading swap requests...</p>
                </div>
              ) : filteredSwaps.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-arrows-shuffle fs-36 text-muted mb-2 d-block" />
                  <h6 className="fw-semibold">No shift swap requests found</h6>
                  <p className="text-muted fs-13">
                    {searchQuery
                      ? "No records matching your search query."
                      : "Click 'Request Shift Swap' to propose a shift exchange."}
                  </p>
                </div>
              ) : (
                <div className="custom-datatable-filter table-responsive">
                  <Table dataSource={filteredSwaps} columns={columns} Selection={false} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2026 © SmartHR - Work Arrangement Module</p>
        </div>
      </div>

      {/* Modal */}
      <ShiftSwapRequestsModal
        employees={employees}
        shiftPolicies={shiftPolicies}
        isEmployee={isEmployee}
        currentEmployeeId={
          employees.find((e) => e.userId === currentUser?.id)?.id ||
          employees.find((e) => e.id === (currentUser as any)?.employee?.id)?.id ||
          (currentUser as any)?.employee?.id
        }
        onSuccess={fetchSwapsAndMeta}
      />
    </>
  );
};

export default ShiftSwapRequests;