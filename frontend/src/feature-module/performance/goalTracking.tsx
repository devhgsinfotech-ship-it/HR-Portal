import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import Table from "../../core/common/dataTable/index";
import GoalTrackingModal, { GoalRecord } from "../../core/modals/goalTrackingModal";
import apiClient from "../../core/utils/apiClient";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import dayjs from "dayjs";

interface ColumnType<T> {
  title: string;
  dataIndex: keyof T | string;
  sorter?: (a: T, b: T) => number;
  render?: (text: any, record?: T) => React.ReactNode;
}

const GoalTracking = () => {
  const routes = all_routes;
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [goalTypes, setGoalTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedGoal, setSelectedGoal] = useState<GoalRecord | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<GoalRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("Last 7 Days");
  const [selectedMember, setSelectedMember] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch Goals & Metadata from Backend
  const fetchGoalsAndMetadata = async () => {
    try {
      setLoading(true);
      const [goalsRes, metaRes] = await Promise.all([
        apiClient.get("/api/performance/goals"),
        apiClient.get("/api/performance/metadata"),
      ]);

      const rawGoals = goalsRes.data || [];
      const formattedGoals: GoalRecord[] = rawGoals.map((g: any, index: number) => {
        const prog =
          g.progress !== undefined && g.progress !== null
            ? g.progress
            : g.progressValue !== undefined && g.progressValue !== null
            ? g.progressValue
            : parseInt(String(g.Progress || "").replace(/[^0-9]/g, "")) || 0;

        return {
          id: g.id,
          key: String(g.id || index + 1),
          GoalType: g.GoalType || g.goalType?.name || g.goalTypeName || "Project Goals",
          goalTypeId: g.goalTypeId,
          Subject: g.Subject || g.subject || "",
          subject: g.subject || g.Subject || "",
          TargetAchievement: g.TargetAchievement || g.targetAchievement || "",
          targetAchievement: g.targetAchievement || g.TargetAchievement || "",
          StartDate: g.StartDate || (g.startDate ? dayjs(g.startDate).format("DD MMM YYYY") : ""),
          startDate: g.startDate || g.StartDate || "",
          EndDate: g.EndDate || (g.endDate ? dayjs(g.endDate).format("DD MMM YYYY") : ""),
          endDate: g.endDate || g.EndDate || "",
          Description: g.Description || g.description || "",
          description: g.description || g.Description || "",
          Status: g.status === "COMPLETED" ? "Active" : g.Status || (g.status?.toLowerCase() === "inactive" ? "Inactive" : "Active"),
          status: g.status || "ACTIVE",
          Progress: `Completed ${prog}%`,
          progressValue: prog,
          progress: prog,
          isCompleted: g.isCompleted || prog >= 100,
          employeeId: g.employeeId,
          employeeName: g.employeeName,
          employeeCode: g.employeeCode,
          designation: g.designation,
          department: g.department,
          profilePhotoUrl: g.profilePhotoUrl || g.Image,
        };
      });

      setGoals(formattedGoals);

      if (metaRes.data) {
        setEmployees(metaRes.data.employees || []);
        setGoalTypes(metaRes.data.goalTypes || []);
      }
    } catch (err: any) {
      console.error("Failed to load goal tracking data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndMetadata();
  }, []);

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      setActionLoading(goalToDelete.id);
      await apiClient.delete(`/api/performance/goals/${goalToDelete.id}`);
      setGoalToDelete(null);
      fetchGoalsAndMetadata();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete goal");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredGoals = useMemo(() => {
    let list = [...goals];

    if (selectedMember !== "ALL") {
      list = list.filter((g) => String(g.employeeId) === String(selectedMember));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((g) => {
        const subj = (g.Subject || g.subject || "").toLowerCase();
        const emp = (g.employeeName || "").toLowerCase();
        const type = (g.GoalType || "").toLowerCase();
        const target = (g.TargetAchievement || g.targetAchievement || "").toLowerCase();
        const desc = (g.Description || g.description || "").toLowerCase();
        return subj.includes(q) || emp.includes(q) || type.includes(q) || target.includes(q) || desc.includes(q);
      });
    }

    if (sortBy === "Ascending") {
      list.sort((a, b) => (a.Subject || "").localeCompare(b.Subject || ""));
    } else if (sortBy === "Descending") {
      list.sort((a, b) => (b.Subject || "").localeCompare(a.Subject || ""));
    } else if (sortBy === "Recently Added") {
      list.sort((a, b) => b.id - a.id);
    }
    return list;
  }, [goals, selectedMember, searchQuery, sortBy]);

  const columns: ColumnType<GoalRecord>[] = [
    {
      title: "Team Member",
      dataIndex: "employeeName",
      render: (text: string, record?: GoalRecord) => {
        const photo = record?.profilePhotoUrl;
        const imgSrc =
          photo && (photo.includes("uploads/") || photo.startsWith("http"))
            ? photo
            : `assets/img/users/${photo || "user-32.jpg"}`;
        const name = text || record?.employeeName || "Unassigned";

        return (
          <div className="d-flex align-items-center">
            <Link to="#" className="avatar avatar-md avatar-rounded me-2">
              <ImageWithBasePath
                src={imgSrc}
                alt={name}
                className="img-fluid rounded-circle"
              />
            </Link>
            <div>
              <h6 className="fw-medium mb-0 fs-13">
                <Link to="#">{name}</Link>
              </h6>
              <span className="fs-11 text-muted">
                {record?.designation || record?.department || (record?.employeeCode ? `#${record.employeeCode}` : "Staff")}
              </span>
            </div>
          </div>
        );
      },
      sorter: (a, b) => (a.employeeName || "").localeCompare(b.employeeName || ""),
    },
    {
      title: "Goal Type",
      dataIndex: "GoalType",
      render: (text: string) => (
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-12">
          {text || "General"}
        </span>
      ),
      sorter: (a, b) => (a.GoalType || "").length - (b.GoalType || "").length,
    },
    {
      title: "Subject",
      dataIndex: "Subject",
      sorter: (a, b) => (a.Subject || "").length - (b.Subject || "").length,
    },
    {
      title: "Target Achievement",
      dataIndex: "TargetAchievement",
      sorter: (a, b) => (a.TargetAchievement || "").length - (b.TargetAchievement || "").length,
    },
    {
      title: "Start Date",
      dataIndex: "StartDate",
      render: (text: string) => (text ? (dayjs(text).isValid() ? dayjs(text).format("DD MMM YYYY") : text) : "—"),
      sorter: (a, b) => (a.StartDate || "").length - (b.StartDate || "").length,
    },
    {
      title: "End Date",
      dataIndex: "EndDate",
      render: (text: string) => (text ? (dayjs(text).isValid() ? dayjs(text).format("DD MMM YYYY") : text) : "—"),
      sorter: (a, b) => (a.EndDate || "").length - (b.EndDate || "").length,
    },
    {
      title: "Description",
      dataIndex: "Description",
      sorter: (a, b) => (a.Description || "").length - (b.Description || "").length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        const isActive = (text || "").toLowerCase() !== "inactive";
        return (
          <span className={`badge ${isActive ? "badge-success" : "badge-danger"} d-inline-flex align-items-center badge-xs`}>
            <i className="ti ti-point-filled me-1" aria-hidden="true" />
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
      sorter: (a, b) => (a.Status || "").length - (b.Status || "").length,
    },
    {
      title: "Progress",
      dataIndex: "Progress",
      render: (_text: string, record?: GoalRecord) => {
        const p =
          record?.progress !== undefined && record?.progress !== null
            ? record.progress
            : record?.progressValue !== undefined && record?.progressValue !== null
            ? record.progressValue
            : parseInt(String(record?.Progress || "").replace(/[^0-9]/g, "")) || 0;

        return (
          <>
            <span className="fs-12 mb-1">Completed {p}%</span>
            <div className="progress" style={{ width: "87px", height: "5px" }}>
              <div
                className="progress-bar bg-primary"
                style={{
                  width: `${p}%`,
                }}
                aria-valuenow={p}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              />
            </div>
          </>
        );
      },
      sorter: (a, b) => {
        const pA = a.progress ?? a.progressValue ?? 0;
        const pB = b.progress ?? b.progressValue ?? 0;
        return pA - pB;
      },
    },
    {
      title: "",
      dataIndex: "actions",
      render: (_text: string, record?: GoalRecord) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#edit_goal"
            onClick={() => setSelectedGoal(record || null)}
            aria-label="Edit Goal"
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#delete_modal"
            onClick={() => setGoalToDelete(record || null)}
            aria-label="Delete Goal"
          >
            <i className="ti ti-trash" />
          </Link>
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
              <h2 className="mb-1">Goal Tracking</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Performance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Goal Tracking
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-inert={true}
                  data-bs-target="#add_goal"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Goal{" "}
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Performance Goal Tracking list */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Goal Tracking List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                {/* Search Input */}
                <div className="input-icon-start position-relative" style={{ minWidth: "220px" }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search goal, employee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Team Member Filter */}
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white border d-inline-flex align-items-center fs-13"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-users me-1 text-primary" />
                    Team Member:{" "}
                    {selectedMember === "ALL"
                      ? "All Members"
                      : employees.find((e) => String(e.id) === String(selectedMember))?.name || "Selected"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2" style={{ maxHeight: "280px", overflowY: "auto" }}>
                    <li>
                      <Link
                        to="#"
                        className={`dropdown-item rounded-1 ${selectedMember === "ALL" ? "active" : ""}`}
                        onClick={() => setSelectedMember("ALL")}
                      >
                        All Team Members ({goals.length})
                      </Link>
                    </li>
                    <li className="dropdown-divider my-1" />
                    {employees.map((emp) => {
                      const count = goals.filter((g) => g.employeeId === emp.id).length;
                      return (
                        <li key={emp.id}>
                          <Link
                            to="#"
                            className={`dropdown-item rounded-1 d-flex justify-content-between align-items-center ${
                              selectedMember === String(emp.id) ? "active" : ""
                            }`}
                            onClick={() => setSelectedMember(String(emp.id))}
                          >
                            <span>{emp.name}</span>
                            <span className="badge bg-light text-muted ms-2">{count}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Sort Dropdown */}
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white border d-inline-flex align-items-center fs-13"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : {sortBy}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setSortBy("Recently Added")}
                      >
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setSortBy("Ascending")}
                      >
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setSortBy("Descending")}
                      >
                        Descending
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <Table dataSource={filteredGoals} columns={columns} Selection={true} />
            </div>
          </div>
          {/* /Performance Goal Tracking list */}
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
      {/* /Page Wrapper */}

      {/* Add / Edit Modals */}
      <GoalTrackingModal
        selectedGoal={selectedGoal}
        employees={employees}
        goalTypes={goalTypes}
        canManage={true}
        onSaved={fetchGoalsAndMetadata}
      />

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3">
                Are you sure you want to delete goal "{goalToDelete?.Subject || goalToDelete?.subject}"? This action cannot be undone.
              </p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading === goalToDelete?.id}
                >
                  {actionLoading === goalToDelete?.id ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoalTracking;
