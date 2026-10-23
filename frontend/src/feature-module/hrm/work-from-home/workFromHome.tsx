import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "@/core/common/collapse-header/collapse-header";
import Table from "../../../core/common/dataTable/index";
import { all_routes } from "@/router/all_routes";
import WorkFromHomeModal from "./modal/workFromHomeModal";
import apiClient from "@/core/utils/apiClient";
import { APP_CONFIG } from "@/environment";

interface WfhItem {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  profilePhotoUrl: string | null;
  department: string;
  designation: string;
  shift: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const WorkFromHome = () => {
  const [requests, setRequests] = useState<WfhItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
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

  const fetchWfhAndMeta = async () => {
    try {
      setLoading(true);
      const [wfhRes, metaRes] = await Promise.all([
        apiClient.get("/api/shifts/wfh"),
        apiClient.get("/api/shifts/metadata"),
      ]);

      setRequests(wfhRes.data || []);
      if (metaRes.data?.employees) {
        setEmployees(metaRes.data.employees);
      }
    } catch (err: any) {
      console.error("Failed to load WFH requests:", err);
      setFeedbackMsg({
        type: "danger",
        text: err.response?.data?.message || "Failed to load WFH data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWfhAndMeta();
  }, []);

  const handleUpdateStatus = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(id);
      await apiClient.put(`/api/shifts/wfh/${id}/status`, { status });
      setFeedbackMsg({
        type: "success",
        text: `WFH request ${status.toLowerCase()} successfully!`,
      });
      fetchWfhAndMeta();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to update WFH request`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel or delete this WFH request?")) return;
    try {
      setActionLoading(id);
      await apiClient.delete(`/api/shifts/wfh/${id}`);
      setFeedbackMsg({ type: "success", text: "WFH request cancelled." });
      fetchWfhAndMeta();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete request");
    } finally {
      setActionLoading(null);
    }
  };

  // Duration in days calculation
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const days = Math.round(diff / (1000 * 3600 * 24)) + 1;
    return days > 0 ? days : 1;
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const kpis = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "PENDING").length;
    const approved = requests.filter((r) => r.status === "APPROVED").length;
    const rejected = requests.filter((r) => r.status === "REJECTED").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  const columns = [
    {
      title: "Employee",
      dataIndex: "employeeName",
      render: (_text: string, record: WfhItem) => (
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
      sorter: (a: WfhItem, b: WfhItem) => a.employeeName.localeCompare(b.employeeName),
    },
    {
      title: "Department & Shift",
      dataIndex: "department",
      render: (_text: string, record: WfhItem) => (
        <div>
          <span className="fw-medium text-dark d-block">{record.department}</span>
          <span className="fs-12 text-muted">{record.shift}</span>
        </div>
      ),
    },
    {
      title: "WFH Dates",
      dataIndex: "startDate",
      render: (_text: string, record: WfhItem) => {
        const days = calculateDays(record.startDate, record.endDate);
        return (
          <div>
            <span className="fw-medium text-dark">
              {record.startDate} to {record.endDate}
            </span>
            <div className="fs-12 text-muted">
              <span className="badge badge-soft-info py-0 px-2 mt-1">
                {days} {days === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        );
      },
      sorter: (a: WfhItem, b: WfhItem) => (a.startDate || "").localeCompare(b.startDate || ""),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      render: (text: string) => (
        <span
          className="fs-12 text-muted text-truncate d-inline-block"
          style={{ maxWidth: "220px" }}
          title={text}
        >
          {text || "No reason specified"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: WfhItem["status"]) => {
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
      sorter: (a: WfhItem, b: WfhItem) => a.status.localeCompare(b.status),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_text: string, record: WfhItem) => {
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
                  title="Approve WFH"
                >
                  <i className="ti ti-check" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                  onClick={() => handleUpdateStatus(record.id, "REJECTED")}
                  disabled={isLoadingThis}
                  title="Reject WFH"
                >
                  <i className="ti ti-x" />
                </button>
              </>
            )}

            {isPending && (
              <button
                type="button"
                className="btn btn-sm btn-light text-muted d-inline-flex align-items-center"
                onClick={() => handleDeleteRequest(record.id)}
                disabled={isLoadingThis}
                title="Cancel WFH Request"
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
              <h2 className="mb-1">Work From Home (WFH) Management</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    WFH Management
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              <button
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#apply_wfh_modal"
                className="btn btn-primary d-inline-flex align-items-center"
              >
                <i className="ti ti-home-plus me-1" />
                Apply WFH
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
                      <i className="ti ti-home-check fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">Total WFH Requests</p>
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
                      <p className="text-muted mb-0 fs-13">Pending Review</p>
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
                      <p className="text-muted mb-0 fs-13">Approved WFH</p>
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

          {/* Table Card */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0">
                {isEmployee ? "My Work From Home Requests" : "Employee WFH Requests"}
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="input-icon position-relative">
                  <span className="input-icon-addon">
                    <i className="ti ti-search" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employee, dept..."
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
                  <p className="mt-2 text-muted">Loading WFH records...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-home-check fs-36 text-muted mb-2 d-block" />
                  <h6 className="fw-semibold">No WFH requests found</h6>
                  <p className="text-muted fs-13">
                    {searchQuery
                      ? "No records matching your search query."
                      : "Click 'Apply WFH' to request remote work days."}
                  </p>
                </div>
              ) : (
                <div className="custom-datatable-filter table-responsive">
                  <Table dataSource={filteredRequests} columns={columns} Selection={false} />
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
      <WorkFromHomeModal
        employees={employees}
        isEmployee={isEmployee}
        onSuccess={fetchWfhAndMeta}
      />
    </>
  );
};

export default WorkFromHome;