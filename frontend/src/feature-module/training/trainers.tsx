import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import Table from "../../core/common/dataTable/index";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import TrainersModal, { TrainerRecord } from "../../core/modals/trainersModal";
import apiClient from "../../core/utils/apiClient";

const Trainers = () => {
  const routes = all_routes;
  const [trainers, setTrainers] = useState<TrainerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerRecord | null>(null);
  const [trainerToDelete, setTrainerToDelete] = useState<TrainerRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("Recently Added");

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/training/trainers");
      setTrainers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch trainers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const filteredTrainers = useMemo(() => {
    let result = [...trainers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const fullName = `${t.firstName || ""} ${t.lastName || ""}`.toLowerCase();
        return (
          fullName.includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.role?.toLowerCase().includes(q) ||
          t.phone?.toLowerCase().includes(q)
        );
      });
    }

    if (sortBy === "Ascending") {
      result.sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
    } else if (sortBy === "Descending") {
      result.sort((a, b) =>
        `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`)
      );
    } else {
      // Recently Added
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [trainers, searchQuery, sortBy]);

  const columns = [
    {
      title: "Name",
      dataIndex: "firstName",
      render: (_: any, record: TrainerRecord) => {
        const fullName = `${record.firstName || ""} ${record.lastName || ""}`.trim();
        const photo = record.profilePhotoUrl || "user-32.jpg";
        return (
          <div className="d-flex align-items-center file-name-icon">
            <Link to="#" className="avatar avatar-md border avatar-rounded">
              <ImageWithBasePath
                src={`assets/img/users/${photo}`}
                className="img-fluid"
                alt={`${fullName} avatar`}
              />
            </Link>
            <div className="ms-2">
              <h6 className="fw-medium mb-0">
                <span className="text-dark">{fullName}</span>
              </h6>
              {record.role && <small className="text-muted">{record.role}</small>}
            </div>
          </div>
        );
      },
      sorter: (a: TrainerRecord, b: TrainerRecord) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (phone: string | null) => (
        <span>{phone || "—"}</span>
      ),
      sorter: (a: TrainerRecord, b: TrainerRecord) =>
        (a.phone || "").localeCompare(b.phone || ""),
    },
    {
      title: "Email",
      dataIndex: "email",
      render: (email: string) => (
        <a href={`mailto:${email}`} className="text-primary">
          {email}
        </a>
      ),
      sorter: (a: TrainerRecord, b: TrainerRecord) =>
        (a.email || "").localeCompare(b.email || ""),
    },
    {
      title: "Type",
      dataIndex: "trainerType",
      render: (type: string | undefined) => {
        const isInternal = type?.toUpperCase() === "INTERNAL";
        return (
          <span
            className={`badge ${
              isInternal ? "badge-info-transparent" : "badge-purple-transparent"
            } badge-xs`}
          >
            {isInternal ? "Internal" : "External"}
          </span>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text: string | null) => (
        <span className="text-muted small">
          {text ? (text.length > 55 ? `${text.substring(0, 55)}...` : text) : "—"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        const isActive = status?.toUpperCase() === "ACTIVE";
        return (
          <span
            className={`badge ${
              isActive ? "badge-success" : "badge-secondary"
            } d-inline-flex align-items-center badge-xs`}
          >
            <i className="ti ti-point-filled me-1" />
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
      sorter: (a: TrainerRecord, b: TrainerRecord) =>
        (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: TrainerRecord) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2 text-primary"
            data-bs-toggle="modal"
            data-bs-target="#edit_trainer"
            onClick={() => setSelectedTrainer(record)}
            title="Edit Trainer"
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            className="text-danger"
            data-bs-toggle="modal"
            data-bs-target="#delete_trainer_modal"
            onClick={() => setTrainerToDelete(record)}
            title="Delete Trainer"
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
              <h2 className="mb-1">Trainers</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Training</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Trainers
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_trainer"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Trainer
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Trainers List Card */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Trainers Directory</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                {/* Search Bar */}
                <div className="input-group input-group-sm" style={{ width: "230px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search trainer..."
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
                  <p className="mt-2 text-muted">Loading Trainers...</p>
                </div>
              ) : (
                <Table
                  dataSource={filteredTrainers.map((t) => ({ ...t, key: String(t.id) }))}
                  columns={columns}
                  Selection={false}
                />
              )}
            </div>
          </div>
          {/* /Trainers List Card */}
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

      <TrainersModal
        selectedTrainer={selectedTrainer}
        trainerToDelete={trainerToDelete}
        onSaved={fetchTrainers}
      />
    </>
  );
};

export default Trainers;
