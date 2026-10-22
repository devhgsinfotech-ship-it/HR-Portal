import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import CollapseHeader from "@/core/common/collapse-header/collapse-header";
import Table from "../../../core/common/dataTable/index";
import { Link } from "react-router";
import CommonFooter from "@/core/common/commonFooter/footer";
import { all_routes } from "@/router/all_routes";
import NoticePeriodTrackerModal from "./modal/noticePeriodTrackerModal";
import EmployeeAvatar from "@/core/common/employeeAvatar";
import apiClient from "@/core/utils/apiClient";
import { message, Spin } from "antd";

interface NoticePeriodRecord {
    id: number;
    employeeCode: string;
    name: string;
    profilePhotoUrl: string | null;
    department: string;
    designation: string;
    startDate: string | null;
    endDate: string | null;
    totalDays: number;
    completedDays: number;
    remainingDays: number;
    status: string;
    exitType: string;
}


const NoticePeriodTracker = () => {
    const user = useSelector((state: any) => state.auth?.user);
    const isEmployee = user?.role === 'EMPLOYEE';

    const [data, setData] = useState<NoticePeriodRecord[]>([]);
    const [metadata, setMetadata] = useState<{ employees: any[]; departments: any[]; designations: any[] }>({
        employees: [],
        departments: [],
        designations: []
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [searchText, setSearchText] = useState<string>("");
    const [selectedRecord, setSelectedRecord] = useState<NoticePeriodRecord | null>(null);

    const fetchNoticePeriods = useCallback(async () => {
        try {
            setIsLoading(true);
            const params: any = {};
            if (selectedStatus && selectedStatus !== "All") params.status = selectedStatus;
            if (searchText) params.search = searchText;

            const res = await apiClient.get('/api/lifecycle/notice-periods', { params });
            setData(res.data || []);
        } catch (error: any) {
            console.error("Failed to load notice periods:", error);
            message.error("Failed to load notice period records");
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
        fetchNoticePeriods();
    }, [fetchNoticePeriods]);

    const columns = [
        {
            title: "Emp Id",
            dataIndex: "employeeCode",
            render: (text: string, record: NoticePeriodRecord) => (
                <Link
                    to="#"
                    className="link-default fw-medium"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#notice_details"
                    onClick={() => setSelectedRecord(record)}
                >
                    {text}
                </Link>
            ),
            sorter: (a: NoticePeriodRecord, b: NoticePeriodRecord) => a.employeeCode.localeCompare(b.employeeCode),
        },
        {
            title: "Employee",
            dataIndex: "name",
            render: (_text: string, record: NoticePeriodRecord) => (
                <div className="d-flex align-items-center file-name-icon">
                    <Link
                        to="#"
                        className="flex-shrink-0"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#notice_details"
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
                                data-bs-target="#notice_details"
                                onClick={() => setSelectedRecord(record)}
                            >
                                {record.name}
                            </Link>
                        </h6>
                        <span className="fs-12 text-muted">{record.department}</span>
                    </div>
                </div>
            ),
            sorter: (a: NoticePeriodRecord, b: NoticePeriodRecord) => a.name.localeCompare(b.name),
        },
        {
            title: "Designation",
            dataIndex: "designation",
            sorter: (a: NoticePeriodRecord, b: NoticePeriodRecord) => a.designation.localeCompare(b.designation),
        },
        {
            title: "Start Date",
            dataIndex: "startDate",
            render: (text: string | null) => text || "—",
            sorter: (a: NoticePeriodRecord, b: NoticePeriodRecord) => (a.startDate || "").localeCompare(b.startDate || ""),
        },
        {
            title: "End Date",
            dataIndex: "endDate",
            render: (text: string | null) => text || "—",
            sorter: (a: NoticePeriodRecord, b: NoticePeriodRecord) => (a.endDate || "").localeCompare(b.endDate || ""),
        },
        {
            title: "Total Days",
            dataIndex: "totalDays",
            render: (text: number) => `${text} Days`,
            sorter: (a: NoticePeriodRecord, b: NoticePeriodRecord) => a.totalDays - b.totalDays,
        },
        {
            title: "Completed",
            dataIndex: "completedDays",
            render: (text: number) => `${text} Days`,
            sorter: (a: NoticePeriodRecord, b: NoticePeriodRecord) => a.completedDays - b.completedDays,
        },
        {
            title: "Remaining",
            dataIndex: "remainingDays",
            render: (text: number) => (
                <span className={text <= 7 && text > 0 ? "text-danger fw-semibold" : ""}>
                    {text} Days
                </span>
            ),
            sorter: (a: NoticePeriodRecord, b: NoticePeriodRecord) => a.remainingDays - b.remainingDays,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (text: string) => {
                const badgeClass =
                    text === "Completed" ? "badge-soft-success" :
                    text === "Closing Soon" ? "badge-soft-danger" :
                    text === "Waived" ? "badge-soft-info" :
                    "badge-soft-warning";
                return (
                    <span className={`badge ${badgeClass} d-inline-flex align-items-center badge-xs`}>
                        {text}
                    </span>
                );
            },
            sorter: (a: NoticePeriodRecord, b: NoticePeriodRecord) => a.status.localeCompare(b.status),
        },
        {
            title: "Actions",
            dataIndex: "action",
            render: (_text: string, record: NoticePeriodRecord) => (
                <div className="action-icon d-inline-flex">
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-light"
                        title="View Notice Details"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#notice_details"
                        onClick={() => setSelectedRecord(record)}
                    >
                        <i className="ti ti-eye" />
                    </button>
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
                            <h2 className="mb-1">Notice Period Tracker</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">HRM</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Notice Period Tracker
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                            <div className="mb-2 me-2">
                                <button
                                    type="button"
                                    className="btn btn-white d-inline-flex align-items-center border"
                                    onClick={fetchNoticePeriods}
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
                                        data-bs-target="#add_notice_modal"
                                        className="btn btn-primary d-flex align-items-center"
                                    >
                                        <i className="ti ti-circle-plus me-2" />
                                        Start Notice Period
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
                            <h5 className="mb-0">Employees on Notice ({data.length})</h5>
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

                                {/* Status Filter */}
                                <div className="dropdown">
                                    <button
                                        type="button"
                                        className="dropdown-toggle btn btn-white btn-sm border d-inline-flex align-items-center"
                                        data-bs-toggle="dropdown"
                                    >
                                        Status: {selectedStatus}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end p-2">
                                        {["All", "Active", "Closing Soon", "Completed", "Waived"].map((st) => (
                                            <li key={st}>
                                                <button
                                                    type="button"
                                                    className={`dropdown-item rounded-1 ${selectedStatus === st ? "active" : ""}`}
                                                    onClick={() => setSelectedStatus(st)}
                                                >
                                                    {st}
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
                                    <p className="mt-2 text-muted">Loading notice period records...</p>
                                </div>
                            ) : data.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ti ti-hourglass-empty fs-36 text-gray-4 d-block mb-2" />
                                    <p className="mb-1 fw-medium">No employees currently serving notice</p>
                                    <small>Employees who submit a resignation or are in notice will appear here automatically</small>
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

            <NoticePeriodTrackerModal
                selectedRecord={selectedRecord}
                metadata={metadata}
                onSuccess={fetchNoticePeriods}
            />
        </>
    );
};

export default NoticePeriodTracker;