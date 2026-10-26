import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import Table from "../../core/common/dataTable/index";
import TrainingTypeModal, { TrainingTypeItem } from "../../core/modals/trainingTypeModal";
import apiClient from "../../core/utils/apiClient";

const TrainingType = () => {
  const routes = all_routes;
  const [types, setTypes] = useState<TrainingTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<TrainingTypeItem | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<TrainingTypeItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("Recently Added");

  const fetchTrainingTypes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/training/types");
      setTypes(res.data || []);
    } catch (err) {
      console.error("Failed to fetch training types:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainingTypes();
  }, []);

  // Filter & Sort
  const filteredTypes = useMemo(() => {
    let result = [...types];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.type?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "Ascending") {
      result.sort((a, b) => a.type.localeCompare(b.type));
    } else if (sortBy === "Descending") {
      result.sort((a, b) => b.type.localeCompare(a.type));
    } else {
      // Recently Added (default)
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [types, searchQuery, sortBy]);

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      render: (text: string, record: TrainingTypeItem) => (
        <div>
          <h6 className="fw-medium mb-0">
            <span className="text-dark">{text}</span>
          </h6>
          {record._count && (
            <small className="text-muted">
              {record._count.trainingPrograms} {record._count.trainingPrograms === 1 ? "Program" : "Programs"}
            </small>
          )}
        </div>
      ),
      sorter: (a: TrainingTypeItem, b: TrainingTypeItem) => a.type.localeCompare(b.type),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text: string | null) => (
        <span className="text-muted">{text || "No description provided"}</span>
      ),
      sorter: (a: TrainingTypeItem, b: TrainingTypeItem) =>
        (a.description || "").localeCompare(b.description || ""),
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
      sorter: (a: TrainingTypeItem, b: TrainingTypeItem) => a.status.localeCompare(b.status),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: TrainingTypeItem) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2 text-primary"
            data-bs-toggle="modal"
            data-bs-target="#edit_training_type"
            onClick={() => setSelectedType(record)}
            title="Edit Training Type"
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            className="text-danger"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            onClick={() => setTypeToDelete(record)}
            title="Delete Training Type"
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
              <h2 className="mb-1">Training Type</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Training</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Training Type
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_training_type"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Training Type
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Training Type Card */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Training Type List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                {/* Search Bar */}
                <div className="input-group input-group-sm" style={{ width: "220px" }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search type..."
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
                  <p className="mt-2 text-muted">Loading Training Types...</p>
                </div>
              ) : (
                <Table
                  dataSource={filteredTypes.map((t) => ({ ...t, key: String(t.id) }))}
                  columns={columns}
                  Selection={false}
                />
              )}
            </div>
          </div>
          {/* /Training Type Card */}
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

      <TrainingTypeModal
        selectedType={selectedType}
        typeToDelete={typeToDelete}
        onSaved={fetchTrainingTypes}
      />
    </>
  );
};

export default TrainingType;
