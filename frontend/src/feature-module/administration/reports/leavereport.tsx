import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Table from "../../../core/common/dataTable/index";
import { all_routes } from '../../../router/all_routes';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import ReactApexChart from 'react-apexcharts';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import apiClient from '../../../core/utils/apiClient';

interface LeaveReportItem {
    id: number;
    Name: string;
    Role: string;
    Department: string;
    LeaveType: string;
    StartDate: string;
    EndDate: string;
    Days: number;
    Reason: string;
    Status: string;
    AppliedAt: string;
    Image: string;
}

interface ColumnType<T> {
    title: string;
    dataIndex: keyof T | string;
    render?: (text: any, record?: T) => React.ReactNode;
    sorter?: (a: T, b: T) => number;
}

const LeaveReport = () => {
    const [records, setRecords] = useState<LeaveReportItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [metrics, setMetrics] = useState({
        totalRequests: 0,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0
    });
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<string>("Recently Added");

    const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({
        labels: ['Casual Leave', 'Medical Leave', 'Annual Leave', 'Paid Leave'],
        data: [10, 5, 8, 4]
    });

    const fetchLeaveData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/api/reports/leave');
            const data = res.data;
            if (data) {
                setRecords(data.records || []);
                setMetrics(data.metrics || {
                    totalRequests: 0,
                    approvedCount: 0,
                    pendingCount: 0,
                    rejectedCount: 0
                });
                if (data.typeDistribution && data.typeDistribution.labels?.length > 0) {
                    setChartData(data.typeDistribution);
                }
            }
        } catch (err) {
            console.error('Failed to fetch leave report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveData();
    }, []);

    const filteredRecords = useMemo(() => {
        let result = [...records];
        if (selectedStatus !== "ALL") {
            result = result.filter(r => r.Status?.toUpperCase() === selectedStatus.toUpperCase());
        }

        if (sortBy === "Ascending") {
            result.sort((a, b) => a.Name.localeCompare(b.Name));
        } else if (sortBy === "Descending") {
            result.sort((a, b) => b.Name.localeCompare(a.Name));
        } else {
            result.sort((a, b) => b.id - a.id);
        }

        return result;
    }, [records, selectedStatus, sortBy]);

    const columns: ColumnType<LeaveReportItem>[] = [
        {
            title: "Employee",
            dataIndex: "Name",
            render: (_text: string, record?: LeaveReportItem) => {
                const photo = record?.Image;
                const imgSrc = photo && (photo.includes('uploads/') || photo.startsWith('http'))
                    ? photo
                    : `assets/img/users/${photo || 'user-32.jpg'}`;
                return (
                    <div className="d-flex align-items-center">
                        <span className="avatar avatar-md me-2 border avatar-rounded">
                            <ImageWithBasePath
                                src={imgSrc}
                                className="img-fluid rounded-circle"
                                alt="emp-avatar"
                            />
                        </span>
                        <div>
                            <p className="text-dark fw-medium mb-0">{record?.Name}</p>
                            <span className="fs-12 text-muted">{record?.Role}</span>
                        </div>
                    </div>
                );
            },
            sorter: (a, b) => a.Name.localeCompare(b.Name),
        },
        {
            title: "Department",
            dataIndex: "Department",
            render: (dept: string) => <span className="text-muted small">{dept}</span>,
            sorter: (a, b) => a.Department.localeCompare(b.Department),
        },
        {
            title: "Leave Type",
            dataIndex: "LeaveType",
            render: (type: string) => (
                <span className="fw-semibold text-dark">{type}</span>
            ),
            sorter: (a, b) => a.LeaveType.localeCompare(b.LeaveType),
        },
        {
            title: "Duration",
            dataIndex: "StartDate",
            render: (_: any, record?: LeaveReportItem) => (
                <span className="small text-nowrap">
                    <i className="ti ti-calendar me-1 text-muted" />
                    {record?.StartDate} <span className="text-muted">to</span> {record?.EndDate}
                </span>
            ),
        },
        {
            title: "No. of Days",
            dataIndex: "Days",
            render: (days: number) => (
                <span className="badge badge-info-transparent badge-sm">
                    {days} {days === 1 ? 'Day' : 'Days'}
                </span>
            ),
            sorter: (a, b) => Number(a.Days) - Number(b.Days),
        },
        {
            title: "Reason",
            dataIndex: "Reason",
            render: (text: string) => (
                <span className="text-muted small">
                    {text && text.length > 35 ? `${text.substring(0, 35)}...` : text || '—'}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "Status",
            render: (status: string) => {
                let badgeClass = "badge-soft-warning";
                if (status === 'APPROVED') badgeClass = "badge-soft-success";
                else if (status === 'REJECTED') badgeClass = "badge-soft-danger";

                return (
                    <span className={`badge d-inline-flex align-items-center badge-xs ${badgeClass}`}>
                        <i className="ti ti-point-filled me-1" />
                        {status}
                    </span>
                );
            },
            sorter: (a, b) => a.Status.localeCompare(b.Status),
        },
    ];

    const chartOptions: any = {
        chart: {
            height: 200,
            type: 'bar',
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
                columnWidth: '45%'
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: chartData.labels.length > 0 ? chartData.labels : ['Casual', 'Medical', 'Annual']
        },
        colors: ['#0d6efd']
    };

    const chartSeries = [
        {
            name: 'Days Requested',
            data: chartData.data.length > 0 ? chartData.data : [5, 3, 7]
        }
    ];

    return (
        <>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Leave Report</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Reports</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Leave Report
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                            <div className="head-icons ms-2">
                                <CollapseHeader />
                            </div>
                        </div>
                    </div>
                    {/* /Breadcrumb */}

                    {/* Summary KPI Cards & Chart */}
                    <div className="row">
                        <div className="col-xl-6 d-flex">
                            <div className="row flex-fill">
                                {/* Total Requests */}
                                <div className="col-lg-6 col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center overflow-hidden mb-2">
                                                <div className="attendence-icon">
                                                    <span>
                                                        <i className="ti ti-calendar text-primary" />
                                                    </span>
                                                </div>
                                                <div className="ms-2 overflow-hidden">
                                                    <p className="fs-12 fw-normal mb-1 text-truncate">
                                                        Total Leave Requests
                                                    </p>
                                                    <h4>{metrics.totalRequests}</h4>
                                                </div>
                                            </div>
                                            <div className="attendance-report-bar mb-2">
                                                <div className="progress" style={{ height: 5 }}>
                                                    <div className="progress-bar bg-primary" style={{ width: "100%" }} />
                                                </div>
                                            </div>
                                            <p className="fs-12 text-muted mb-0">Total recorded requests</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Approved Leaves */}
                                <div className="col-lg-6 col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center overflow-hidden mb-2">
                                                <div className="attendence-icon">
                                                    <span>
                                                        <i className="ti ti-check text-success" />
                                                    </span>
                                                </div>
                                                <div className="ms-2 overflow-hidden">
                                                    <p className="fs-12 fw-normal mb-1 text-truncate">
                                                        Approved Leaves
                                                    </p>
                                                    <h4>{metrics.approvedCount}</h4>
                                                </div>
                                            </div>
                                            <div className="attendance-report-bar mb-2">
                                                <div className="progress" style={{ height: 5 }}>
                                                    <div
                                                        className="progress-bar bg-success"
                                                        style={{
                                                            width: metrics.totalRequests > 0
                                                                ? `${Math.round((metrics.approvedCount / metrics.totalRequests) * 100)}%`
                                                                : "0%"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <p className="fs-12 text-muted mb-0">
                                                {metrics.totalRequests > 0
                                                    ? `${Math.round((metrics.approvedCount / metrics.totalRequests) * 100)}% approved rate`
                                                    : "0% rate"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pending Leaves */}
                                <div className="col-lg-6 col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center overflow-hidden mb-2">
                                                <div className="attendence-icon">
                                                    <span>
                                                        <i className="ti ti-clock text-warning" />
                                                    </span>
                                                </div>
                                                <div className="ms-2 overflow-hidden">
                                                    <p className="fs-12 fw-normal mb-1 text-truncate">
                                                        Pending Approval
                                                    </p>
                                                    <h4>{metrics.pendingCount}</h4>
                                                </div>
                                            </div>
                                            <div className="attendance-report-bar mb-2">
                                                <div className="progress" style={{ height: 5 }}>
                                                    <div
                                                        className="progress-bar bg-warning"
                                                        style={{
                                                            width: metrics.totalRequests > 0
                                                                ? `${Math.round((metrics.pendingCount / metrics.totalRequests) * 100)}%`
                                                                : "0%"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <p className="fs-12 text-muted mb-0">Awaiting manager action</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Rejected Leaves */}
                                <div className="col-lg-6 col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center overflow-hidden mb-2">
                                                <div className="attendence-icon">
                                                    <span>
                                                        <i className="ti ti-x text-danger" />
                                                    </span>
                                                </div>
                                                <div className="ms-2 overflow-hidden">
                                                    <p className="fs-12 fw-normal mb-1 text-truncate">
                                                        Rejected Leaves
                                                    </p>
                                                    <h4>{metrics.rejectedCount}</h4>
                                                </div>
                                            </div>
                                            <div className="attendance-report-bar mb-2">
                                                <div className="progress" style={{ height: 5 }}>
                                                    <div
                                                        className="progress-bar bg-danger"
                                                        style={{
                                                            width: metrics.totalRequests > 0
                                                                ? `${Math.round((metrics.rejectedCount / metrics.totalRequests) * 100)}%`
                                                                : "0%"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <p className="fs-12 text-muted mb-0">Declined requests</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Column */}
                        <div className="col-xl-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header">
                                    <h5>Leave Types Utilization</h5>
                                </div>
                                <div className="card-body pb-0">
                                    <ReactApexChart
                                        options={chartOptions}
                                        series={chartSeries}
                                        type="bar"
                                        height={200}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                            <h5>Leave Requests Overview</h5>
                            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                                {/* Status Filter */}
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: "140px" }}
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="REJECTED">Rejected</option>
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
                                    <p className="mt-2 text-muted">Loading Leave Report...</p>
                                </div>
                            ) : (
                                <Table
                                    dataSource={filteredRecords.map((r, idx) => ({ ...r, key: String(r.id || idx) }))}
                                    columns={columns}
                                    Selection={false}
                                />
                            )}
                        </div>
                    </div>
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
        </>
    );
};

export default LeaveReport;
