import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../router/all_routes";
import Table from "../../core/common/dataTable/index";
import GoalTypeModal, { GoalTypeItem } from "../../core/modals/goalTypeModal";
import apiClient from "../../core/utils/apiClient";

const GoalType = () => {
  const routes = all_routes;
  const [goalTypes, setGoalTypes] = useState<GoalTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedGoalType, setSelectedGoalType] = useState<GoalTypeItem | null>(null);
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

  const fetchGoalTypes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/performance/goal-types");
      setGoalTypes(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch goal types:", err);
      setFeedbackMsg({
        type: "danger",
        text: err.response?.data?.message || "Failed to load Goal Types",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalTypes();
  }, []);

  const handleDeleteGoalType = async (item: GoalTypeItem) => {
    if (!window.confirm(`Are you sure you want to delete goal type "${item.name}"?`)) {
      return;
    }

    try {
      setActionLoading(item.id);
      await apiClient.delete(`/api/performance/goal-types/${item.id}`);
      setFeedbackMsg({
        type: "success",
        text: `Goal Type "${item.name}" deleted successfully.`,
      });
      fetchGoalTypes();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to delete goal type:", err);
      alert(err.response?.data?.message || "Failed to delete Goal Type");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredData = useMemo(() => {
    return goalTypes.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [goalTypes, searchQuery, statusFilter]);

  const columns = [
    {
      title: "Type",
      dataIndex: "name",
      render: (text: string, record: GoalTypeItem) => (
        <div>
          <h6 className="fw-medium mb-0">{text}</h6>
          {record.goalsCount !== undefined && (
            <span className="fs-12 text-muted">
              {record.goalsCount} linked {record.goalsCount === 1 ? "goal" : "goals"}
            </span>
          )}
        </div>
      ),
      sorter: (a: GoalTypeItem, b: GoalTypeItem) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text: string) => (
        <span className="text-muted fs-13">
          {text || "—"}
        </span>
      ),
      sorter: (a: GoalTypeItem, b: GoalTypeItem) => (a.description || "").localeCompare(b.description || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        const isActive = status?.toUpperCase() === "ACTIVE";
        return (
          <span
            className={`badge ${
              isActive ? "badge-success" : "badge-danger"
            } d-inline-flex align-items-center badge-xs`}
          >
            <i className="ti ti-point-filled me-1" aria-hidden="true" />
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
      sorter: (a: GoalTypeItem, b: GoalTypeItem) => a.status.localeCompare(b.status),
    },
    ...(canManage
      ? [
          {
            title: "Actions",
            dataIndex: "actions",
            render: (_: any, record: GoalTypeItem) => (
              <div className="action-icon d-inline-flex align-items-center">
                <button
                  type="button"
                  className="btn btn-sm btn-icon border-0 me-2"
                  data-bs-toggle="modal"
                  data-bs-target="#edit_goal_type"
                  onClick={() => setSelectedGoalType(record)}
                  title="Edit Goal Type"
                >
                  <i className="ti ti-edit text-primary fs-16" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-icon border-0"
                  onClick={() => handleDeleteGoalType(record)}
                  disabled={actionLoading === record.id}
                  title="Delete Goal Type"
                >
                  {actionLoading === record.id ? (
                    <span className="spinner-border spinner-border-sm text-danger" />
                  ) : (
                    <i className="ti ti-trash text-danger fs-16" />
                  )}
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Goal Types</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Performance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Goal Types
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              {canManage && (
                <div className="mb-2">
                  <button
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#add_goal_type"
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <i className="ti ti-circle-plus me-2" />
                    Add Goal Type
                  </button>
                </div>
              )}
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

          {/* Goal Type list card */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5 className="mb-0">Goal Type List ({filteredData.length})</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                <div className="me-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search goal types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ minWidth: "180px" }}
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
                        className={`dropdown-item rounded-1 ${statusFilter === "ACTIVE" ? "active" : ""}`}
                        onClick={() => setStatusFilter("ACTIVE")}
                      >
                        Active
                      </button>
                    </li>
                    <li>
                      <button
                        className={`dropdown-item rounded-1 ${statusFilter === "INACTIVE" ? "active" : ""}`}
                        onClick={() => setStatusFilter("INACTIVE")}
                      >
                        Inactive
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
                  <p className="mt-2 text-muted">Loading goal types...</p>
                </div>
              ) : (
                <Table
                  dataSource={filteredData}
                  columns={columns}
                  Selection={false}
                />
              )}
            </div>
          </div>
          {/* /Goal Type list */}
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2026 © SmartHR - Performance Management.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
      {/* /Page Wrapper */}

      <GoalTypeModal
        selectedGoalType={selectedGoalType}
        onSaved={() => {
          setFeedbackMsg({
            type: "success",
            text: "Goal Type saved successfully!",
          });
          fetchGoalTypes();
          setTimeout(() => setFeedbackMsg(null), 4000);
        }}
      />
    </>
  );
};

export default GoalType;
