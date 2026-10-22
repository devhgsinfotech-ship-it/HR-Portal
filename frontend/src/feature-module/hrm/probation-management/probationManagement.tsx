import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import CollapseHeader from "@/core/common/collapse-header/collapse-header";
import Table from "../../../core/common/dataTable/index";
import { Link } from "react-router";
import CommonFooter from "@/core/common/commonFooter/footer";
import { all_routes } from "@/router/all_routes";
import ProbationManagementModal from "./modal/probationManagementModal";
import EmployeeAvatar from "@/core/common/employeeAvatar";
import apiClient from "@/core/utils/apiClient";
import { message, Spin } from "antd";

interface ProbationRecord {
    id: number;
    employeeCode: string;
    name: string;
    profilePhotoUrl: string | null;
    department: string;
    departmentId: number | null;
    designation: string;
    designationId: number | null;
    joiningDate: string | null;
    probationEndDate: string | null;
    probationDurationMonths: number;
    probationStatus: string;
    reviewer: string;
    reviewerPhoto: string | null;
    reviewerId: number | null;
    daysRemaining: number | null;
}


const ProbationManagement = () => {
    const user = useSelector((state: any) => state.auth?.user);
    const isEmployee = user?.role === 'EMPLOYEE';

    const [data, setData] = useState<ProbationRecord[]>([]);
    const [metadata, setMetadata] = useState<{ employees: any[]; departments: any[]; designations: any[] }>({
        employees: [],
        departments: [],
        designations: []
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [searchText, setSearchText] = useState<string>("");
    const [selectedRecord, setSelectedRecord] = useState<ProbationRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const fetchProbations = useCallback(async () => {
        try {
            setIsLoading(true);
            const params: any = {};
            if (selectedStatus && selectedStatus !== "All") params.status = selectedStatus;
            if (searchText) params.search = searchText;

            const res = await apiClient.get('/api/lifecycle/probations', { params });
            setData(res.data || []);
        } catch (error: any) {
            console.error("Failed to load probations:", error);
            message.error("Failed to load probation records");
        } finally {
            setIsLoading(false);
        }
    }, [selectedStatus, searchText]);

    const fetchMetadata = async () => {
        try {
            const res = await apiClient.get('/api/lifecycle/metadata');
            setMetadata(res.data);
        } catch (error) {
            console.error("Failed to load metadata:", error);
        }
    };

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchProbations();
    }, [fetchProbations]);

    // Quick status update (e.g. Confirm directly from table)
    const handleQuickStatus = async (record: ProbationRecord, newStatus: string) => {
        try {
            await apiClient.put(`/api/lifecycle/probations/${record.id}/status`, { status: newStatus });
            message.success(`Employee probation marked as ${newStatus}`);
            fetchProbations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    // Remove from probation tracker
    const handleRemoveProbation = async () => {
        if (!selectedRecord) return;
        try {
            setIsDeleting(true);
            await apiClient.delete(`/api/lifecycle/probations/${selectedRecord.id}`);
            message.success('Employee removed from probation tracker');
            const modalEl = document.getElementById('delete_probation_modal');
            if (modalEl) {
                const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement;
                if (closeBtn) closeBtn.click();
            }
            fetchProbations();
            fetchMetadata();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to remove probation');
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = [
        {
            title: "Emp Id",
            dataIndex: "employeeCode",
            render: (text: string, record: ProbationRecord) => (
                <Link
                    to="#"
                    className="link-default fw-medium"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#probation_details"
                    onClick={() => setSelectedRecord(record)}
                >
                    {text}
                </Link>
            ),
            sorter: (a: ProbationRecord, b: ProbationRecord) => a.employeeCode.localeCompare(b.employeeCode),
        },
        {
            title: "Employee",
            dataIndex: "name",
            render: (_text: string, record: ProbationRecord) => (
                <div className="d-flex align-items-center file-name-icon">
                    <Link
                        to="#"
                        className="flex-shrink-0"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#probation_details"
                        onClick={() => setSelectedRecord(record)}
                    >
                        <EmployeeAvatar
                            url={record.profilePhotoUrl}
                            name={record.name}
                            size={38}
                        />
                    </Link>
                    <div className="ms-2">
                        <h6 className="fw-medium mb-0">
                            <Link
                                to="#"
                                data-bs-toggle="offcanvas"
                                data-bs-target="#probation_details"
                                onClick={() => setSelectedRecord(record)}
                            >
                                {record.name}
                            </Link>
                        </h6>
                        <span className="fs-12 text-muted">{record.department}</span>
                    </div>
                </div>
            ),
            sorter: (a: ProbationRecord, b: ProbationRecord) => a.name.localeCompare(b.name),
        },
        {
            title: "Designation",
            dataIndex: "designation",
            sorter: (a: ProbationRecord, b: ProbationRecord) => a.designation.localeCompare(b.designation),
        },
        {
            title: "Joining Date",
            dataIndex: "joiningDate",
            render: (text: string | null) => text || "—",
            sorter: (a: ProbationRecord, b: ProbationRecord) => (a.joiningDate || "").localeCompare(b.joiningDate || ""),
        },
        {
            title: "Probation End Date",
            dataIndex: "probationEndDate",
            render: (text: string | null, record: ProbationRecord) => (
                <div>
                    <div>{text || "—"}</div>
                    {record.daysRemaining !== null && (
                        <small className={record.daysRemaining > 0 ? "text-muted" : "text-danger"}>
                            {record.daysRemaining > 0 ? `${record.daysRemaining} days left` : `Expired`}
                        </small>
                    )}
                </div>
            ),
            sorter: (a: ProbationRecord, b: ProbationRecord) => (a.probationEndDate || "").localeCompare(b.probationEndDate || ""),
        },
        {
            title: "Reviewer",
            dataIndex: "reviewer",
            render: (text: string) => text || "HR Admin",
            sorter: (a: ProbationRecord, b: ProbationRecord) => a.reviewer.localeCompare(b.reviewer),
        },
        {
            title: "Status",
            dataIndex: "probationStatus",
            render: (status: string) => {
                const s = (status || "").toUpperCase();
                const badgeClass =
                    s === "CONFIRMED" ? "badge-soft-success" :
                    s === "EXTENDED" ? "badge-soft-purple" :
                    s === "FAILED" ? "badge-soft-danger" :
                    "badge-soft-info";
                return (
                    <span className={`badge ${badgeClass} d-inline-flex align-items-center badge-xs`}>
                        {s.replace("_", " ")}
                    </span>
                );
            },
            sorter: (a: ProbationRecord, b: ProbationRecord) => a.probationStatus.localeCompare(b.probationStatus),
        },
        {
            title: "Actions",
            dataIndex: "action",
            render: (_text: string, record: ProbationRecord) => (
                <div className="action-icon d-inline-flex align-items-center">
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-light me-1"
                        title="View Details"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#probation_details"
                        onClick={() => setSelectedRecord(record)}
                    >
                        <i className="ti ti-eye" />
                    </button>
                    {!isEmployee && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-icon btn-light me-1"
                                title="Edit / Extend"
                                data-bs-toggle="modal"
                                data-bs-target="#edit_modal"
                                onClick={() => setSelectedRecord(record)}
                            >
                                <i className="ti ti-edit" />
                            </button>
                            {record.probationStatus !== "CONFIRMED" && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-icon btn-soft-success me-1"
                                    title="Confirm Probation"
                                    onClick={() => handleQuickStatus(record, "CONFIRMED")}
                                >
                                    <i className="ti ti-check" />
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn btn-sm btn-icon btn-light text-danger"
                                title="Remove from Probation Tracker"
                                data-bs-toggle="modal"
                                data-bs-target="#delete_probation_modal"
                                onClick={() => setSelectedRecord(record)}
                            >
                                <i className="ti ti-trash" />
                            </button>
                        </>
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
                            <h2 className="mb-1">Probation Management</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                             <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">HRM</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Probation Management
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                            <div className="mb-2 me-2">
                                <button
                                    type="button"
                                    className="btn btn-white d-inline-flex align-items-center border"
                                    onClick={() => { fetchProbations(); fetchMetadata(); }}
                                    title="Refresh Data"
                                >
                                    <i className="ti ti-refresh me-1" />
                                    Refresh
                                </button>
                            </div>
                            {!isEmployee && (
                                <div className="mb-2">
                                    <button
                                        type="button"
                                        data-bs-toggle="modal"
                                        data-bs-target="#add_modal"
                                        className="btn btn-primary d-flex align-items-center"
                                    >
                                        <i className="ti ti-circle-plus me-2" />
                                        Set Employee Probation
                                    </button>
                                </div>
                            )}
                            <div className="ms-2 head-icons">
                                <CollapseHeader />
                            </div>
                        </div>
                    </div>
                    {/* /Breadcrumb */}

                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                            <h5 className="mb-0">Probation Tracker ({data.length})</h5>
                            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                                {/* Search input */}
                                <div className="position-relative">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Search employee / code..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        style={{ width: "220px" }}
                                    />
                                    {searchText && (
                                        <button
                                            type="button"
                                            className="btn-close position-absolute end-0 top-50 translate-middle-y me-2"
                                            style={{ fontSize: "10px" }}
                                            onClick={() => setSearchText("")}
                                        />
                                    )}
                                </div>

                                {/* Status Filter Tabs */}
                                <div className="dropdown">
                                    <button
                                        type="button"
                                        className="dropdown-toggle btn btn-white btn-sm border d-inline-flex align-items-center"
                                        data-bs-toggle="dropdown"
                                    >
                                        Status: {selectedStatus}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end p-2">
                                        {["All", "ON_PROBATION", "CONFIRMED", "EXTENDED", "FAILED"].map((st) => (
                                            <li key={st}>
                                                <button
                                                    type="button"
                                                    className={`dropdown-item rounded-1 ${selectedStatus === st ? "active" : ""}`}
                                                    onClick={() => setSelectedStatus(st)}
                                                >
                                                    {st.replace("_", " ")}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="card-body p-0">
                            {isLoading ? (
                                <div className="text-center py-5">
                                    <Spin size="large" />
                                    <p className="mt-2 text-muted">Loading probation records...</p>
                                </div>
                            ) : data.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ti ti-users fs-36 text-gray-4 d-block mb-2" />
                                    <p className="mb-1 fw-medium">No probation records found</p>
                                    <small>Click "Set Employee Probation" to assign an employee to probation</small>
                                </div>
                            ) : (
                                <Table dataSource={data} columns={columns} Selection={false} />
                            )}
                        </div>
                    </div>
                </div>
                <CommonFooter />
            </div>
            {/* /Page Wrapper */}

            <ProbationManagementModal
                selectedRecord={selectedRecord}
                metadata={metadata}
                onSuccess={() => { fetchProbations(); fetchMetadata(); }}
            />

            {/* Remove / Delete Confirmation Modal */}
            <div className="modal fade" id="delete_probation_modal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-body text-center">
                            <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                                <i className="ti ti-trash fs-36" />
                            </span>
                            <h4 className="mb-1">Remove from Probation</h4>
                            <p className="mb-3">
                                Are you sure you want to remove <strong>{selectedRecord?.name}</strong> from probation tracking?
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
                                    className="btn btn-danger"
                                    onClick={handleRemoveProbation}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Removing...' : 'Yes, Remove'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProbationManagement;