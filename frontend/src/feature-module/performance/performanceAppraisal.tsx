import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import Table from "../../core/common/dataTable/index";
import PerformanceAppraisalModal, { AppraisalRecord } from "../../core/modals/performanceAppraisalModal";
import apiClient from "../../core/utils/apiClient";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import dayjs from "dayjs";

const PerformanceAppraisal = () => {
  const routes = all_routes;
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppraisal, setSelectedAppraisal] = useState<AppraisalRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "danger"; text: string } | null>(null);

  // Role permissions
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "{}");
    } catch {
      return {};
    }
  })();
  const userRole = (currentUser?.role || "").toUpperCase();
  const canManage = ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER"].includes(userRole);

  const fetchAppraisalsAndMeta = async () => {
    try {
      setLoading(true);
      const [appRes, metaRes] = await Promise.all([
        apiClient.get("/api/performance/appraisals"),
        apiClient.get("/api/performance/metadata"),
      ]);

      setAppraisals(appRes.data || []);
      if (metaRes.data?.employees) {
        setEmployees(metaRes.data.employees);
      }
    } catch (err: any) {
      console.error("Failed to load appraisals:", err);
      setFeedbackMsg({
        type: "danger",
        text: err.response?.data?.message || "Failed to load appraisals",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppraisalsAndMeta();
  }, []);

  const handleDeleteAppraisal = async (record: AppraisalRecord) => {
    if (!window.confirm(`Are you sure you want to delete appraisal for ${record.employeeName || "employee"}?`)) {
      return;
    }

    try {
      setActionLoading(record.id);
      await apiClient.delete(`/api/performance/appraisals/${record.id}`);
      setFeedbackMsg({
        type: "success",
        text: "Performance appraisal deleted successfully.",
      });
      fetchAppraisalsAndMeta();
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete appraisal");
    } finally {
      setActionLoading(null);
    }
  };

  const metrics = useMemo(() => {
    const total = appraisals.length;
    const approved = appraisals.filter((a) => a.status === "APPROVED").length;
    const pending = appraisals.filter((a) => a.status === "SUBMITTED" || a.status === "DRAFT").length;
    const rated = appraisals.filter((a) => a.finalRating !== null && a.finalRating !== undefined);
    const avgRating = rated.length
      ? (rated.reduce((sum, a) => sum + (a.finalRating || 0), 0) / rated.length).toFixed(1)
      : "0.0";

    return { total, approved, pending, avgRating };
  }, [appraisals]);

  const filteredAppraisals = useMemo(() => {
    return appraisals.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.employeeName && item.employeeName.toLowerCase().includes(q)) ||
        ((item as any).Name && (item as any).Name.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q)) ||
        (item.designation && item.designation.toLowerCase().includes(q)) ||
        (item.appraisalCycle && item.appraisalCycle.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status?.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [appraisals, searchQuery, statusFilter]);

  const columns = [
    {
      title: "Employee",
      dataIndex: "employeeName",
      render: (text: string, record: AppraisalRecord) => {
        const displayName = text || (record as any).Name || "Employee";
        const photo = record.profilePhotoUrl || (record as any).Image;
        const imgSrc =
          photo && (photo.includes("uploads/") || photo.startsWith("http"))
            ? photo
            : `assets/img/users/${photo || "user-32.jpg"}`;

        return (
          <div className="d-flex align-items-center">
            <div className="avatar avatar-md avatar-rounded me-2">
              <ImageWithBasePath
                src={imgSrc}
                alt={displayName}
                className="img-fluid rounded-circle"
              />
            </div>
            <div>
              <h6 className="fw-medium mb-0 fs-13">{displayName}</h6>
              <span className="text-muted fs-11">
                {record.employeeCode ? `#${record.employeeCode}` : "Staff"}
              </span>
            </div>
          </div>
        );
      },
      sorter: (a: AppraisalRecord, b: AppraisalRecord) =>
        (a.employeeName || (a as any).Name || "").localeCompare(b.employeeName || (b as any).Name || ""),
    },
    {
      title: "Role & Dept",
      dataIndex: "designation",
      render: (_: any, record: AppraisalRecord) => (
        <div>
          <span className="fw-medium fs-13">{record.designation || "Staff"}</span>
          <div className="text-muted fs-11">{record.department || "General"}</div>
        </div>
      ),
      sorter: (a: AppraisalRecord, b: AppraisalRecord) =>
        (a.designation || "").localeCompare(b.designation || ""),
    },
    {
      title: "Appraisal Cycle",
      dataIndex: "appraisalCycle",
      render: (text: string | null) => (
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-12">
          {text || "Annual 2026"}
        </span>
      ),
    },
    {
      title: "Ratings",
      dataIndex: "finalRating",
      render: (_: any, record: AppraisalRecord) => (
        <div>
          <div className="d-flex align-items-center mb-1">
            <span className="fs-12 text-warning me-1">
              <i className="ti ti-star-filled" />
            </span>
            <strong className="fs-13">
              {record.finalRating ? record.finalRating.toFixed(1) : "—"} / 5.0
            </strong>
          </div>
          <div className="fs-11 text-muted">
            Self: {record.selfRating ?? "—"} | Mgr: {record.managerRating ?? "—"}
          </div>
        </div>
      ),
      sorter: (a: AppraisalRecord, b: AppraisalRecord) =>
        (a.finalRating || 0) - (b.finalRating || 0),
    },
    {
      title: "Appraisal Date",
      dataIndex: "appraisalDate",
      render: (date: string | null) => (
        <span className="fs-12 text-muted">
          {date ? dayjs(date).format("DD MMM YYYY") : "—"}
        </span>
      ),
      sorter: (a: AppraisalRecord, b: AppraisalRecord) =>
        (a.appraisalDate || "").localeCompare(b.appraisalDate || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        const s = status?.toUpperCase();
        let badgeClass = "badge-warning";
        let label = "Draft";

        if (s === "APPROVED") {
          badgeClass = "badge-success";
          label = "Approved";
        } else if (s === "REVIEWED") {
          badgeClass = "badge-info";
          label = "Reviewed";
        } else if (s === "SUBMITTED") {
          badgeClass = "badge-primary";
          label = "Submitted";
        }

        return (
          <span className={`badge ${badgeClass} d-inline-flex align-items-center badge-xs`}>
            <i className="ti ti-point-filled me-1" aria-hidden="true" />
            {label}
          </span>
        );
      },
      sorter: (a: AppraisalRecord, b: AppraisalRecord) => a.status.localeCompare(b.status),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: AppraisalRecord) => (
        <div className="action-icon d-inline-flex align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-icon border-0 me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_performance_appraisal"
            onClick={() => setSelectedAppraisal(record)}
            title="Edit Appraisal"
          >
            <i className="ti ti-edit text-primary fs-16" />
          </button>
          {canManage && (
            <button
              type="button"
              className="btn btn-sm btn-icon border-0"
              onClick={() => handleDeleteAppraisal(record)}
              disabled={actionLoading === record.id}
              title="Delete Appraisal"
            >
              {actionLoading === record.id ? (
                <span className="spinner-border spinner-border-sm text-danger" />
              ) : (
                <i className="ti ti-trash text-danger fs-16" />
              )}
            </button>
          )}
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
              <h2 className="mb-1">Performance Appraisals</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Performance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Performance Appraisal
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              <div className="mb-2">
                <button
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#add_performance_appraisal"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Appraisal
                </button>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {feedbackMsg && (
            <div
              className={`alert alert-${feedbackMsg.type} alert-dismissible fade show d-flex align-items-center`}
              role="alert"
            >
              <i
                className={`ti ${
                  feedbackMsg.type === "success"
                    ? "ti-check-circle text-success"
                    : "ti-alert-circle text-danger"
                } fs-20 me-2`}
              />
              <div className="flex-grow-1">{feedbackMsg.text}</div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setFeedbackMsg(null)}
                aria-label="Close"
              />
            </div>
          )}

          {/* Quick Metrics Banner */}
          <div className="row mb-3">
            <div className="col-xl-3 col-sm-6 mb-2">
              <div className="card shadow-none border bg-light-subtle mb-0">
                <div className="card-body p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium">Total Reviews</span>
                    <h3 className="mb-0 fw-bold">{metrics.total}</h3>
                  </div>
                  <span className="avatar avatar-md bg-primary-subtle text-primary rounded-circle">
                    <i className="ti ti-file-certificate fs-20" />
                  </span>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-2">
              <div className="card shadow-none border bg-light-subtle mb-0">
                <div className="card-body p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium">Avg Rating</span>
                    <h3 className="mb-0 fw-bold text-warning">{metrics.avgRating} <span className="fs-13 text-muted">/ 5.0</span></h3>
                  </div>
                  <span className="avatar avatar-md bg-warning-subtle text-warning rounded-circle">
                    <i className="ti ti-star-filled fs-20" />
                  </span>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-2">
              <div className="card shadow-none border bg-light-subtle mb-0">
                <div className="card-body p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium">Approved</span>
                    <h3 className="mb-0 fw-bold text-success">{metrics.approved}</h3>
                  </div>
                  <span className="avatar avatar-md bg-success-subtle text-success rounded-circle">
                    <i className="ti ti-circle-check fs-20" />
                  </span>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-2">
              <div className="card shadow-none border bg-light-subtle mb-0">
                <div className="card-body p-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted fs-12 fw-medium">In Review / Draft</span>
                    <h3 className="mb-0 fw-bold text-info">{metrics.pending}</h3>
                  </div>
                  <span className="avatar avatar-md bg-info-subtle text-info rounded-circle">
                    <i className="ti ti-clock-hour-4 fs-20" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Appraisals Card */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5 className="mb-0">Appraisal Records ({filteredAppraisals.length})</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                <div className="me-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search employee / cycle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ minWidth: "200px" }}
                  />
                </div>
                <div className="dropdown">
                  <button
                    className="btn btn-white btn-sm dropdown-toggle d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                    type="button"
                  >
                    Status: {statusFilter === "ALL" ? "All" : statusFilter}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <button
                        className={`dropdown-item rounded-1 ${statusFilter === "ALL" ? "active" : ""}`}
                        onClick={() => setStatusFilter("ALL")}
                      >
                        All
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item rounded-1 ${statusFilter === "DRAFT" ? "active" : ""}`}
                        onClick={() => setStatusFilter("DRAFT")}
                      >
                        Draft
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item rounded-1 ${statusFilter === "SUBMITTED" ? "active" : ""}`}
                        onClick={() => setStatusFilter("SUBMITTED")}
                      >
                        Submitted
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item rounded-1 ${statusFilter === "REVIEWED" ? "active" : ""}`}
                        onClick={() => setStatusFilter("REVIEWED")}
                      >
                        Reviewed
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item rounded-1 ${statusFilter === "APPROVED" ? "active" : ""}`}
                        onClick={() => setStatusFilter("APPROVED")}
                      >
                        Approved
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-5 text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading appraisals...</p>
                </div>
              ) : (
                <Table
                  dataSource={filteredAppraisals}
                  columns={columns}
                  Selection={false}
                />
              )}
            </div>
          </div>
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2026 © SmartHR - Performance Appraisals.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>

      <PerformanceAppraisalModal
        selectedAppraisal={selectedAppraisal}
        employees={employees}
        canManage={canManage}
        onSaved={() => {
          setFeedbackMsg({
            type: "success",
            text: "Performance appraisal saved successfully!",
          });
          fetchAppraisalsAndMeta();
          setTimeout(() => setFeedbackMsg(null), 3000);
        }}
      />
    </>
  );
};

export default PerformanceAppraisal;
