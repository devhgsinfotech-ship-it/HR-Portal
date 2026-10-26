import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import Table from "../../core/common/dataTable/index";
import PerformanceIndicatorModal from "../../core/modals/performanceIndicatorModal";
import apiClient from "../../core/utils/apiClient";
import dayjs from "dayjs";

// Define interface for performance indicator data
export interface PerformanceIndicatorRecord {
  id: number;
  key: string;
  Designation: string;
  designationName?: string;
  designationId?: number | null;
  Department: string;
  departmentName?: string;
  departmentId?: number | null;
  ApprovedBy: string;
  addedByName?: string;
  Image: string;
  profilePhotoUrl?: string | null;
  Role: string;
  CreatedDate: string;
  createdAt?: string;
  Status: string;
  status?: string;
  customerExperience?: string | null;
  marketing?: string | null;
  management?: string | null;
  administration?: string | null;
  presentationSkills?: string | null;
  qualityOfWork?: string | null;
  efficiency?: string | null;
  integrity?: string | null;
}

interface ColumnType<T> {
  title: string;
  dataIndex: keyof T | string;
  sorter?: (a: T, b: T) => number;
  render?: (text: any, record?: T) => React.ReactNode;
}

const PerformanceIndicator = () => {
  const routes = all_routes;
  const [indicators, setIndicators] = useState<PerformanceIndicatorRecord[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIndicator, setSelectedIndicator] = useState<any | null>(null);
  const [indicatorToDelete, setIndicatorToDelete] = useState<PerformanceIndicatorRecord | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("Last 7 Days");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchIndicatorsAndMeta = async () => {
    try {
      setLoading(true);
      const [indRes, metaRes] = await Promise.all([
        apiClient.get("/api/performance/indicators"),
        apiClient.get("/api/performance/metadata"),
      ]);

      const rawIndicators = indRes.data || [];
      const formatted: PerformanceIndicatorRecord[] = rawIndicators.map((ind: any, index: number) => {
        const desig = ind.Designation || ind.designationName || ind.designation?.name || "All Designations";
        const dept = ind.Department || ind.departmentName || ind.department?.name || "All Departments";
        const appr = ind.ApprovedBy || ind.addedByName || "Admin";
        const cDate = ind.CreatedDate || (ind.createdAt ? dayjs(ind.createdAt).format("DD MMM YYYY") : "14 Jan 2024");
        const stat = ind.Status || (ind.status === "ACTIVE" ? "Active" : "Inactive");
        const img = ind.profilePhotoUrl || ind.Image || "user-34.jpg";

        return {
          id: ind.id,
          key: String(ind.id || index + 1),
          Designation: desig,
          designationName: desig,
          designationId: ind.designationId,
          Department: dept,
          departmentName: dept,
          departmentId: ind.departmentId,
          ApprovedBy: appr,
          addedByName: appr,
          Image: img,
          profilePhotoUrl: ind.profilePhotoUrl,
          Role: ind.Role || "HR Manager",
          CreatedDate: cDate,
          createdAt: ind.createdAt,
          Status: stat,
          status: ind.status || (stat === "Active" ? "ACTIVE" : "INACTIVE"),
          customerExperience: ind.customerExperience,
          marketing: ind.marketing,
          management: ind.management,
          administration: ind.administration,
          presentationSkills: ind.presentationSkills,
          qualityOfWork: ind.qualityOfWork,
          efficiency: ind.efficiency,
          integrity: ind.integrity,
        };
      });

      setIndicators(formatted);

      if (metaRes.data) {
        setDepartments(metaRes.data.departments || []);
        setDesignations(metaRes.data.designations || []);
      }
    } catch (err: any) {
      console.error("Failed to load indicators:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicatorsAndMeta();
  }, []);

  const handleConfirmDelete = async () => {
    if (!indicatorToDelete) return;
    try {
      setActionLoading(indicatorToDelete.id);
      await apiClient.delete(`/api/performance/indicators/${indicatorToDelete.id}`);
      setIndicatorToDelete(null);
      fetchIndicatorsAndMeta();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete indicator");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredData = useMemo(() => {
    let list = [...indicators];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => {
        const desig = (item.Designation || item.designationName || "").toLowerCase();
        const dept = (item.Department || item.departmentName || "").toLowerCase();
        const appr = (item.ApprovedBy || item.addedByName || "").toLowerCase();
        return desig.includes(q) || dept.includes(q) || appr.includes(q);
      });
    }

    if (sortBy === "Ascending") {
      list.sort((a, b) => (a.Designation || "").localeCompare(b.Designation || ""));
    } else if (sortBy === "Descending") {
      list.sort((a, b) => (b.Designation || "").localeCompare(a.Designation || ""));
    } else if (sortBy === "Recently Added") {
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [indicators, searchQuery, sortBy]);

  const columns: ColumnType<PerformanceIndicatorRecord>[] = [
    {
      title: "Designation",
      dataIndex: "Designation",
      render: (text: string) => (
        <div className="d-flex align-items-center file-name-icon">
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{text}</Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a, b) => (a.Designation || "").length - (b.Designation || "").length,
    },
    {
      title: "Department",
      dataIndex: "Department",
      sorter: (a, b) => (a.Department || "").length - (b.Department || "").length,
    },
    {
      title: "Approved By",
      dataIndex: "ApprovedBy",
      render: (text: string, record?: PerformanceIndicatorRecord) => {
        const imgSrc =
          record?.Image && (record.Image.includes("uploads/") || record.Image.startsWith("http"))
            ? record.Image
            : `assets/img/users/${record?.Image || "user-32.jpg"}`;

        return (
          <div className="d-flex align-items-center file-name-icon">
            <Link to="#" className="avatar avatar-md avatar-rounded">
              <ImageWithBasePath
                src={imgSrc}
                className="img-fluid rounded-circle"
                alt={record?.ApprovedBy || "Approved By"}
              />
            </Link>
            <div className="ms-2">
              <h6 className="fw-medium">
                <Link to="#">{text}</Link>
              </h6>
              <p className="fs-12">{record?.Role || "HR Manager"}</p>
            </div>
          </div>
        );
      },
      sorter: (a, b) => (a.ApprovedBy || "").length - (b.ApprovedBy || "").length,
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      render: (text: string) => (text ? (dayjs(text).isValid() ? dayjs(text).format("DD MMM YYYY") : text) : "—"),
      sorter: (a, b) => (a.CreatedDate || "").length - (b.CreatedDate || "").length,
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
      title: "",
      dataIndex: "actions",
      render: (_text: string, record?: PerformanceIndicatorRecord) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#edit_performance-indicator"
            onClick={() => setSelectedIndicator(record || null)}
            aria-label="Edit Performance Indicator"
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#delete_indicator_modal"
            onClick={() => setIndicatorToDelete(record || null)}
            aria-label="Delete Performance Indicator"
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
              <h2 className="mb-1">Performance Indicator</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Performance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Performance Indicator
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
                  data-bs-target="#add_performance_indicator"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Indicator
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Performance Indicator list */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Performance Indicator List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : {sortBy}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
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
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setSortBy("Last Month")}
                      >
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                        onClick={() => setSortBy("Last 7 Days")}
                      >
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <Table dataSource={filteredData} columns={columns} Selection={true} />
            </div>
          </div>
          {/* /Performance Indicator list */}
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

      {/* Add & Edit Modal */}
      <PerformanceIndicatorModal
        selectedIndicator={selectedIndicator}
        departments={departments}
        designations={designations}
        onSaved={fetchIndicatorsAndMeta}
      />

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_indicator_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3">
                Are you sure you want to delete indicator for "{indicatorToDelete?.Designation || indicatorToDelete?.designationName}"? This action cannot be undone.
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
                  disabled={actionLoading === indicatorToDelete?.id}
                >
                  {actionLoading === indicatorToDelete?.id ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PerformanceIndicator;
