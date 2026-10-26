import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import Table from "../../core/common/dataTable/index";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import TrainingListModal, { TrainingProgramRecord } from "../../core/modals/trainingListModal";
import apiClient from "../../core/utils/apiClient";
import dayjs from "dayjs";

const TrainingList = () => {
  const routes = all_routes;
  const [programs, setPrograms] = useState<TrainingProgramRecord[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgramRecord | null>(null);
  const [programToDelete, setProgramToDelete] = useState<TrainingProgramRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("Recently Added");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [programsRes, metaRes] = await Promise.all([
        apiClient.get("/api/training/programs"),
        apiClient.get("/api/training/metadata"),
      ]);

      setPrograms(programsRes.data || []);
      setTrainingTypes(metaRes.data?.trainingTypes || []);
      setTrainers(metaRes.data?.trainers || []);
      setEmployees(metaRes.data?.employees || []);
    } catch (err) {
      console.error("Failed to fetch training programs or metadata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPrograms = useMemo(() => {
    let result = [...programs];

    if (selectedStatus !== "ALL") {
      result = result.filter(
        (p) => p.status?.toUpperCase() === selectedStatus.toUpperCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const typeName = p.trainingType?.type?.toLowerCase() || "";
        const title = p.title?.toLowerCase() || "";
        const trainerName = `${p.trainer?.firstName || ""} ${p.trainer?.lastName || ""}`.toLowerCase();
        const desc = p.description?.toLowerCase() || "";
        const hasParticipant = p.participants?.some((pt) =>
          `${pt.employee?.firstName || ""} ${pt.employee?.lastName || ""}`
            .toLowerCase()
            .includes(q)
        );

        return (
          typeName.includes(q) ||
          title.includes(q) ||
          trainerName.includes(q) ||
          desc.includes(q) ||
          hasParticipant
        );
      });
    }

    if (sortBy === "Ascending") {
      result.sort((a, b) =>
        (a.trainingType?.type || a.title).localeCompare(b.trainingType?.type || b.title)
      );
    } else if (sortBy === "Descending") {
      result.sort((a, b) =>
        (b.trainingType?.type || b.title).localeCompare(a.trainingType?.type || a.title)
      );
    } else {
      // Recently Added
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [programs, searchQuery, sortBy, selectedStatus]);

  const columns = [
    {
      title: "Training Type",
      dataIndex: "trainingType",
      render: (_: any, record: TrainingProgramRecord) => (
        <div>
          <h6 className="fw-medium mb-0">
            <span className="text-dark">
              {record.trainingType?.type || record.title}
            </span>
          </h6>
          {record.title && record.trainingType?.type && record.title !== record.trainingType.type && (
            <small className="text-muted">{record.title}</small>
          )}
        </div>
      ),
      sorter: (a: TrainingProgramRecord, b: TrainingProgramRecord) =>
        (a.trainingType?.type || a.title).localeCompare(b.trainingType?.type || b.title),
    },
    {
      title: "Trainer",
      dataIndex: "trainer",
      render: (_: any, record: TrainingProgramRecord) => {
        if (!record.trainer) {
          return <span className="text-muted">Unassigned</span>;
        }
        const trainerName = `${record.trainer.firstName} ${record.trainer.lastName}`;
        const photo = record.trainer.profilePhotoUrl || "user-32.jpg";

        return (
          <div className="d-flex align-items-center file-name-icon">
            <span className="avatar avatar-md border avatar-rounded">
              <ImageWithBasePath
                src={`assets/img/users/${photo}`}
                className="img-fluid"
                alt={`${trainerName} avatar`}
              />
            </span>
            <div className="ms-2">
              <h6 className="fw-medium mb-0">
                <span className="text-dark">{trainerName}</span>
              </h6>
              {record.trainer.role && (
                <small className="text-muted">{record.trainer.role}</small>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Employees Enrolled",
      dataIndex: "participants",
      render: (_: any, record: TrainingProgramRecord) => {
        const parts = record.participants || [];
        if (parts.length === 0) {
          return <span className="text-muted small">0 Enrolled</span>;
        }

        const visibleParticipants = parts.slice(0, 4);
        const extraCount = parts.length - 4;
        const allNames = parts
          .map((p) => `${p.employee?.firstName || ""} ${p.employee?.lastName || ""}`.trim())
          .join(", ");

        return (
          <div
            className="avatar-list-stacked avatar-group-sm"
            title={`Enrolled: ${allNames}`}
          >
            {visibleParticipants.map((p, idx) => (
              <span
                key={p.id || idx}
                className="avatar border-0"
                title={`${p.employee?.firstName} ${p.employee?.lastName}`}
              >
                <ImageWithBasePath
                  src={`assets/img/users/${p.employee?.profilePhotoUrl || "user-32.jpg"}`}
                  className="rounded-circle"
                  alt={p.employee?.firstName || "Employee"}
                />
              </span>
            ))}
            {extraCount > 0 && (
              <span className="avatar group-counts bg-primary rounded-circle border-0 fs-10">
                +{extraCount}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Time Duration",
      dataIndex: "startDate",
      render: (_: any, record: TrainingProgramRecord) => {
        if (!record.startDate && !record.endDate) {
          return <span className="text-muted">—</span>;
        }
        const start = record.startDate
          ? dayjs(record.startDate).format("DD MMM YYYY")
          : "TBD";
        const end = record.endDate
          ? dayjs(record.endDate).format("DD MMM YYYY")
          : "Ongoing";

        return (
          <span className="small text-nowrap">
            <i className="ti ti-calendar me-1 text-muted" />
            {start} <span className="text-muted">to</span> {end}
          </span>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text: string | null) => (
        <span className="text-muted small">
          {text ? (text.length > 50 ? `${text.substring(0, 50)}...` : text) : "—"}
        </span>
      ),
    },
    {
      title: "Cost",
      dataIndex: "cost",
      render: (cost: any) => {
        if (cost === null || cost === undefined || cost === "") {
          return <span className="text-muted">Free</span>;
        }
        return <span className="fw-medium">${parseFloat(cost).toFixed(2)}</span>;
      },
      sorter: (a: TrainingProgramRecord, b: TrainingProgramRecord) =>
        Number(a.cost || 0) - Number(b.cost || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        let badgeClass = "badge-success";
        let label = "Active";

        switch (status?.toUpperCase()) {
          case "IN_PROGRESS":
            badgeClass = "badge-info";
            label = "In Progress";
            break;
          case "COMPLETED":
            badgeClass = "badge-purple";
            label = "Completed";
            break;
          case "CANCELLED":
            badgeClass = "badge-danger";
            label = "Cancelled";
            break;
          default:
            badgeClass = "badge-success";
            label = "Active";
        }

        return (
          <span
            className={`badge ${badgeClass} d-inline-flex align-items-center badge-xs`}
          >
            <i className="ti ti-point-filled me-1" />
            {label}
          </span>
        );
      },
      sorter: (a: TrainingProgramRecord, b: TrainingProgramRecord) =>
        (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: TrainingProgramRecord) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2 text-primary"
            data-bs-toggle="modal"
            data-bs-target="#edit_training"
            onClick={() => setSelectedProgram(record)}
            title="Edit Training Program"
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            className="text-danger"
            data-bs-toggle="modal"
            data-bs-target="#delete_training_modal"
            onClick={() => setProgramToDelete(record)}
            title="Delete Training Program"
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
              <h2 className="mb-1">Training Programs</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Training</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Training Programs
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_training"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Training Program
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Training Programs Card */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Training List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                {/* Search Bar */}
                <div className="input-group input-group-sm" style={{ width: "230px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search programs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setSearchQuery("")}
                    >
                      <i className="ti ti-x" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  className="form-select form-select-sm"
                  style={{ width: "130px" }}
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                {/* Sort Dropdown */}
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center btn-sm"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : {sortBy}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <button
                        type="button"
                        className={`dropdown-item rounded-1 ${sortBy === "Recently Added" ? "active" : ""}`}
                        onClick={() => setSortBy("Recently Added")}
                      >
                        Recently Added
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`dropdown-item rounded-1 ${sortBy === "Ascending" ? "active" : ""}`}
                        onClick={() => setSortBy("Ascending")}
                      >
                        Ascending
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className={`dropdown-item rounded-1 ${sortBy === "Descending" ? "active" : ""}`}
                        onClick={() => setSortBy("Descending")}
                      >
                        Descending
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading Training Programs...</p>
                </div>
              ) : (
                <Table
                  dataSource={filteredPrograms.map((p) => ({ ...p, key: String(p.id) }))}
                  columns={columns}
                  Selection={false}
                />
              )}
            </div>
          </div>
          {/* /Training Programs Card */}
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

      <TrainingListModal
        selectedProgram={selectedProgram}
        programToDelete={programToDelete}
        trainingTypes={trainingTypes}
        trainers={trainers}
        employees={employees}
        onSaved={fetchData}
      />
    </>
  );
};

export default TrainingList;
