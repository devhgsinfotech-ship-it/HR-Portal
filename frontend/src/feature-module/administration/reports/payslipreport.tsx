import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Table from "../../../core/common/dataTable/index";
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import ReactApexChart from 'react-apexcharts';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import { all_routes } from '../../../router/all_routes';
import apiClient from '../../../core/utils/apiClient';

interface PayslipReportItem {
    id: number;
    Name: string;
    Image: string;
    Role: string;
    Department: string;
    PaidAmount: string;
    GrossEarnings: string;
    Deductions: string;
    PaidMonth: string;
    PaidYear: string;
    Status: string;
    [key: string]: any;
}

interface ColumnType<T> {
    title: string;
    dataIndex: keyof T | string;
    render?: (text: any, record?: T) => React.ReactNode;
    sorter?: (a: T, b: T) => number;
}

const formatRupee = (val: any) => {
    if (!val && val !== 0) return "₹0.00";
    const s = String(val).trim();
    if (s.startsWith("₹")) return s;
    const num = parseFloat(s.replace(/[^0-9.-]/g, ""));
    if (isNaN(num)) return "₹0.00";
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PayslipReport = () => {
    const routes = all_routes;
    const [records, setRecords] = useState<PayslipReportItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [metrics, setMetrics] = useState({
        totalPaid: "0.00",
        totalGross: "0.00",
        totalDeductions: "0.00",
        totalEntries: 0
    });
    const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
    const [sortBy, setSortBy] = useState<string>("Recently Added");

    const [chartSeries, setChartSeries] = useState<any[]>([
        { name: "Net Salary Paid (₹)", data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
    ]);

    const fetchPayslipData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/api/reports/payslip');
            const data = res.data;
            if (data) {
                setRecords(data.records || []);
                setMetrics(data.metrics || {
                    totalPaid: "0.00",
                    totalGross: "0.00",
                    totalDeductions: "0.00",
                    totalEntries: 0
                });
                if (data.chartSeries) {
                    setChartSeries(data.chartSeries);
                }
            }
        } catch (err) {
            console.error('Failed to fetch payslip report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayslipData();
    }, []);

    const filteredRecords = useMemo(() => {
        let result = [...records];
        if (selectedMonth !== "ALL") {
            result = result.filter(r => r.PaidMonth?.toUpperCase() === selectedMonth.toUpperCase());
        }

        if (sortBy === "Ascending") {
            result.sort((a, b) => a.Name.localeCompare(b.Name));
        } else if (sortBy === "Descending") {
            result.sort((a, b) => b.Name.localeCompare(a.Name));
        } else {
            result.sort((a, b) => b.id - a.id);
        }

        return result;
    }, [records, selectedMonth, sortBy]);

    const columns: ColumnType<PayslipReportItem>[] = [
        {
            title: "Employee Name",
            dataIndex: "Name",
            render: (_text: string, record?: PayslipReportItem) => {
                const photo = record?.Image;
                const imgSrc = photo && (photo.includes('uploads/') || photo.startsWith('http'))
                    ? photo
                    : `assets/img/profiles/${photo || 'avatar-02.jpg'}`;

                return (
                    <div className="d-flex align-items-center file-name-icon">
                        <Link to="#" className="avatar avatar-md border avatar-rounded">
                            <ImageWithBasePath
                                src={imgSrc}
                                className="img-fluid"
                                alt="User"
                            />
                        </Link>
                        <div className="ms-2">
                            <h6 className="fw-medium">
                                <Link to="#">{record?.Name}</Link>
                            </h6>
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
            title: "Gross Earnings",
            dataIndex: "GrossEarnings",
            render: (amount: string) => <span className="text-dark fw-medium">{formatRupee(amount)}</span>,
        },
        {
            title: "Deductions",
            dataIndex: "Deductions",
            render: (amount: string) => <span className="text-danger fw-medium">{formatRupee(amount)}</span>,
        },
        {
            title: "Net Paid Amount",
            dataIndex: "PaidAmount",
            render: (amount: string) => <span className="text-success fw-bold">{formatRupee(amount)}</span>,
            sorter: (a, b) => parseFloat(String(a.PaidAmount).replace(/[^0-9.]/g, '')) - parseFloat(String(b.PaidAmount).replace(/[^0-9.]/g, '')),
        },
        {
            title: "Paid Month",
            dataIndex: "PaidMonth",
            render: (_: any, record?: PayslipReportItem) => (
                <span className="badge badge-purple-transparent badge-sm">
                    {record?.PaidMonth} {record?.PaidYear}
                </span>
            ),
            sorter: (a, b) => a.PaidMonth.localeCompare(b.PaidMonth),
        },
        {
            title: "Status",
            dataIndex: "Status",
            render: (status: string) => (
                <span className="badge badge-success d-inline-flex align-items-center badge-xs">
                    <i className="ti ti-point-filled me-1" />
                    {status || "Processed"}
                </span>
            ),
        },
    ];

    const chartOptions: any = {
        chart: {
            type: 'line',
            height: 200,
            zoom: { enabled: false }
        },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        yaxis: {
            labels: {
                formatter: (val: number) => `₹${Number(val).toLocaleString('en-IN')}`
            }
        },
        tooltip: {
            y: {
                formatter: (val: number) => `₹${Number(val).toLocaleString('en-IN')}`
            }
        },
        colors: ['#0d6efd']
    };

    return (
        <>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Payslip Report</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Reports</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Payslip Report
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
                                {/* Total Gross Earnings */}
                                <div className="col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between bg-light border rounded p-2 mb-2">
                                                <div>
                                                    <span className="fs-12 fw-normal text-muted mb-1">
                                                        Total Gross Earnings
                                                    </span>
                                                    <h5 className="mb-0 text-dark">₹{metrics.totalGross}</h5>
                                                </div>
                                                <span className="avatar avatar-md avatar-rounded bg-transparent-primary border border-primary">
                                                    <i className="ti ti-wallet text-primary" />
                                                </span>
                                            </div>
                                            <p className="fs-12 text-muted mb-0">Total pre-deduction earnings</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Deductions */}
                                <div className="col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between bg-light border rounded p-2 mb-2">
                                                <div>
                                                    <span className="fs-12 fw-normal text-muted mb-1">
                                                        Total Deductions
                                                    </span>
                                                    <h5 className="mb-0 text-danger">₹{metrics.totalDeductions}</h5>
                                                </div>
                                                <span className="avatar avatar-md avatar-rounded bg-transparent-danger border border-danger">
                                                    <i className="ti ti-receipt-tax text-danger" />
                                                </span>
                                            </div>
                                            <p className="fs-12 text-muted mb-0">Tax, PF, and other withholdings</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Pay */}
                                <div className="col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between bg-light border rounded p-2 mb-2">
                                                <div>
                                                    <span className="fs-12 fw-normal text-muted mb-1">
                                                        Net Disbursed Pay
                                                    </span>
                                                    <h5 className="mb-0 text-success">₹{metrics.totalPaid}</h5>
                                                </div>
                                                <span className="avatar avatar-md avatar-rounded bg-transparent-success border border-success">
                                                    <i className="ti ti-cash text-success" />
                                                </span>
                                            </div>
                                            <p className="fs-12 text-muted mb-0">Net employee disbursement</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Payslips */}
                                <div className="col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between bg-light border rounded p-2 mb-2">
                                                <div>
                                                    <span className="fs-12 fw-normal text-muted mb-1">
                                                        Total Payslips Issued
                                                    </span>
                                                    <h5 className="mb-0 text-purple">{metrics.totalEntries}</h5>
                                                </div>
                                                <span className="avatar avatar-md avatar-rounded bg-transparent-purple border border-purple">
                                                    <i className="ti ti-file-certificate text-purple" />
                                                </span>
                                            </div>
                                            <p className="fs-12 text-muted mb-0">Across all payroll periods</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Column */}
                        <div className="col-xl-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-header">
                                    <h5>Annual Payroll Expense Trends</h5>
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
                            <h5>Employee Payslips Overview</h5>
                            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                                {/* Month Filter */}
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: "130px" }}
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                >
                                    <option value="ALL">All Months</option>
                                    <option value="Jan">Jan</option>
                                    <option value="Feb">Feb</option>
                                    <option value="Mar">Mar</option>
                                    <option value="Apr">Apr</option>
                                    <option value="May">May</option>
                                    <option value="Jun">Jun</option>
                                    <option value="Jul">Jul</option>
                                    <option value="Aug">Aug</option>
                                    <option value="Sep">Sep</option>
                                    <option value="Oct">Oct</option>
                                    <option value="Nov">Nov</option>
                                    <option value="Dec">Dec</option>
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
                                    <p className="mt-2 text-muted">Loading Payslip Report...</p>
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

export default PayslipReport;
