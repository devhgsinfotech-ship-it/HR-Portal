import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Table from "../../../core/common/dataTable/index";
import { all_routes } from '../../../router/all_routes';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import PredefinedDateRanges from '../../../core/common/datePicker';
import ReactApexChart from 'react-apexcharts';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import apiClient from '../../../core/utils/apiClient';

interface AttendanceReportItem {
    id: number;
    Name: string;
    Image: string;
    Role: string;
    Department: string;
    Date: string;
    CheckIn: string;
    Status: string;
    CheckOut: string;
    Break: string;
    Late: string;
    Overtime: string;
    ProductionHours: string;
    [key: string]: any;
}

interface ColumnType<T> {
    title: string;
    dataIndex: keyof T | string;
    render?: (text: any, record?: T) => React.ReactNode;
    sorter?: (a: T, b: T) => number;
}

const AttendanceReport = () => {
    const [records, setRecords] = useState<AttendanceReportItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [metrics, setMetrics] = useState({
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        halfDayCount: 0
    });
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<string>("Recently Added");

    const [chartSeries, setChartSeries] = useState<any[]>([
        { name: "Present", data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: "Late / Irregular", data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
    ]);

    const fetchAttendanceData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/api/reports/attendance');
            const data = res.data;
            if (data) {
                setRecords(data.records || []);
                setMetrics(data.metrics || {
                    totalRecords: 0,
                    presentCount: 0,
                    absentCount: 0,
                    lateCount: 0,
                    halfDayCount: 0
                });
                if (data.chartSeries) {
                    setChartSeries(data.chartSeries);
                }
            }
        } catch (err) {
            console.error('Failed to fetch attendance report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
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

    const columns: ColumnType<AttendanceReportItem>[] = [
        {
            title: "Name",
            dataIndex: "Name",
            render: (_text: string, record?: AttendanceReportItem) => {
                const photo = record?.Image;
                const imgSrc = photo && (photo.includes('uploads/') || photo.startsWith('http'))
                    ? photo
                    : `assets/img/users/${photo || 'user-32.jpg'}`;
                return (
                    <div className="d-flex align-items-center">
                        <Link
                            to="#"
                            className="avatar avatar-md me-2 border avatar-rounded"
                        >
                            <ImageWithBasePath
                                src={imgSrc}
                                className="img-fluid rounded-circle"
                                alt="users-image"
                            />
                        </Link>
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
            title: "Date",
            dataIndex: "Date",
            render: (text: string) => <span>{text || '—'}</span>,
            sorter: (a, b) => (a.Date || '').localeCompare(b.Date || ''),
        },
        {
            title: "Check in",
            dataIndex: "CheckIn",
            sorter: (a, b) => (a.CheckIn || '').localeCompare(b.CheckIn || ''),
        },
        {
            title: "Status",
            dataIndex: "Status",
            render: (text: string) => {
                const isPresent = text?.toUpperCase() === 'PRESENT';
                return (
                    <span className={`badge d-inline-flex align-items-center badge-xs ${isPresent ? 'badge-soft-success' : 'badge-soft-danger'}`}>
                        <i className="ti ti-point-filled me-1" />
                        {text}
                    </span>
                );
            },
            sorter: (a, b) => (a.Status || '').localeCompare(b.Status || ''),
        },
        {
            title: "Check Out",
            dataIndex: "CheckOut",
            sorter: (a, b) => (a.CheckOut || '').localeCompare(b.CheckOut || ''),
        },
        {
            title: "Break",
            dataIndex: "Break",
            sorter: (a, b) => (a.Break || '').localeCompare(b.Break || ''),
        },
        {
            title: "Late",
            dataIndex: "Late",
            render: (late: string) => (
                <span className={late !== '0 min' ? 'text-danger fw-medium' : 'text-muted'}>
                    {late}
                </span>
            ),
            sorter: (a, b) => (a.Late || '').localeCompare(b.Late || ''),
        },
        {
            title: "Production Hours",
            dataIndex: "ProductionHours",
            render: (_text: string, record?: AttendanceReportItem) => (
                <span className="badge badge-success d-inline-flex align-items-center badge-sm">
                    <i className="ti ti-clock-hour-11 me-1" />{record?.ProductionHours}
                </span>
            ),
            sorter: (a, b) => (a.ProductionHours || '').localeCompare(b.ProductionHours || ''),
        },
    ];

    const chartOptions: any = {
        chart: {
            height: 200,
            type: 'line',
            zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        grid: {
            row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 }
        },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        colors: ['#28a745', '#dc3545']
    };

    return (
        <>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Attendance Report</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Reports</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Attendance Report
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

                    {/* Summary KPI Cards & Chart Row */}
                    <div className="row">
                        <div className="col-xl-6 d-flex">
                            <div className="row flex-fill">
                                {/* Total Present */}
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
                                                        Total Present Days
                                                    </p>
                                                    <h4>{metrics.presentCount}</h4>
                                                </div>
                                            </div>
                                            <div className="attendance-report-bar mb-2">
                                                <div className="progress" style={{ height: 5 }}>
                                                    <div
                                                        className="progress-bar bg-success"
                                                        style={{
                                                            width: metrics.totalRecords > 0
                                                                ? `${Math.min(100, Math.round((metrics.presentCount / metrics.totalRecords) * 100))}%`
                                                                : "100%"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="fs-12 text-muted mb-0">
                                                    Out of {metrics.totalRecords} total attendance logs
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Absent */}
                                <div className="col-lg-6 col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center overflow-hidden mb-2">
                                                <div className="attendence-icon">
                                                    <span>
                                                        <i className="ti ti-user-x text-danger" />
                                                    </span>
                                                </div>
                                                <div className="ms-2 overflow-hidden">
                                                    <p className="fs-12 fw-normal mb-1 text-truncate">
                                                        Total Absent Days
                                                    </p>
                                                    <h4>{metrics.absentCount}</h4>
                                                </div>
                                            </div>
                                            <div className="attendance-report-bar mb-2">
                                                <div className="progress" style={{ height: 5 }}>
                                                    <div
                                                        className="progress-bar bg-danger"
                                                        style={{
                                                            width: metrics.totalRecords > 0
                                                                ? `${Math.min(100, Math.round((metrics.absentCount / metrics.totalRecords) * 100))}%`
                                                                : "0%"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="fs-12 text-muted mb-0">
                                                    Recorded absences
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Halfdays */}
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
                                                        Total Halfdays
                                                    </p>
                                                    <h4>{metrics.halfDayCount}</h4>
                                                </div>
                                            </div>
                                            <div className="attendance-report-bar mb-2">
                                                <div className="progress" style={{ height: 5 }}>
                                                    <div
                                                        className="progress-bar bg-warning"
                                                        style={{
                                                            width: metrics.totalRecords > 0
                                                                ? `${Math.min(100, Math.round((metrics.halfDayCount / metrics.totalRecords) * 100))}%`
                                                                : "0%"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="fs-12 text-muted mb-0">
                                                    Half day sessions
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Late Arrivals */}
                                <div className="col-lg-6 col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center overflow-hidden mb-2">
                                                <div className="attendence-icon">
                                                    <span>
                                                        <i className="ti ti-alert-triangle text-purple" />
                                                    </span>
                                                </div>
                                                <div className="ms-2 overflow-hidden">
                                                    <p className="fs-12 fw-normal mb-1 text-truncate">
                                                        Late Attendance
                                                    </p>
                                                    <h4>{metrics.lateCount}</h4>
                                                </div>
                                            </div>
                                            <div className="attendance-report-bar mb-2">
                                                <div className="progress" style={{ height: 5 }}>
                                                    <div
                                                        className="progress-bar bg-purple"
                                                        style={{
                                                            width: metrics.totalRecords > 0
                                                                ? `${Math.min(100, Math.round((metrics.lateCount / metrics.totalRecords) * 100))}%`
                                                                : "0%"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="fs-12 text-muted mb-0">
                                                    Late check-in occurrences
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Column */}
                        <div className="col-xl-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header">
                                    <h5>Annual Attendance Trends</h5>
                                </div>
                                <div className="card-body pb-0">
                                    <ReactApexChart
                                        options={chartOptions}
                                        series={chartSeries}
                                        type="line"
                                        height={200}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                            <h5>Employee Attendance Log</h5>
                            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                                {/* Status Filter */}
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: "140px" }}
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="PRESENT">Present</option>
                                    <option value="ABSENT">Absent</option>
                                    <option value="HALF_DAY">Half Day</option>
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
                                    <p className="mt-2 text-muted">Loading Attendance Report...</p>
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

export default AttendanceReport;
