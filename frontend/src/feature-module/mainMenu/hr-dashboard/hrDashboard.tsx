import { useState, useEffect, useCallback } from 'react'
import PredefinedDatePicker from '@/core/common/datePicker'
import ImageWithBasePath from '@/core/common/imageWithBasePath'
import { all_routes } from '@/router/all_routes'
import { Link } from 'react-router'
import EmployeeStatusChart from './charts/employeeStatusChart'
import CollapseHeader from '@/core/common/collapse-header/collapse-header'
import LeaveTypeChart from './charts/leaveTypeChart'
import AttendanceChart from './charts/attendanceChart'
import EmployeeDistributionChart from './charts/employeeDistributionChart'
import DeductionChart from './charts/deductionChart'
import PayrollChart from './charts/payrollChart'
import CommonFooter from '@/core/common/commonFooter/footer'
import TrainingChart from './charts/trainingChart'
import ImagePointChart from './charts/topEmployeeChart'
import apiClient from '../../../core/utils/apiClient'

// ── Types ─────────────────────────────────────────────────────
interface LateArrival {
    id: number
    name: string
    department: string
    photo: string | null
    checkIn: string
    delayMinutes: number
}

interface LeaveTypeStat {
    name: string
    count: number
}

interface PendingLeave {
    id: number
    employeeName: string
    designation: string
    photo: string | null
    leaveType: string
    startDate: string
    endDate: string
    totalDays: number
    reason: string
}

interface DashData {
    totalEmployees: number
    newJoinees: number
    fullTimeCount: number
    contractCount: number
    probationCount: number
    onTimeCount: number
    lateCount: number
    absentCount: number
    lateArrivalsList: LateArrival[]
    leaveTypeStats: LeaveTypeStat[]
    pendingLeaves: PendingLeave[]
}

const defaultDash: DashData = {
    totalEmployees: 0,
    newJoinees: 0,
    fullTimeCount: 0,
    contractCount: 0,
    probationCount: 0,
    onTimeCount: 0,
    lateCount: 0,
    absentCount: 0,
    lateArrivalsList: [],
    leaveTypeStats: [],
    pendingLeaves: []
}

const HrDashboard = () => {
    const [dashData, setDashData] = useState<DashData>(defaultDash)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
        start: null,
        end: null
    })

    const fetchDashboard = useCallback(async (start?: Date | null, end?: Date | null) => {
        try {
            setLoading(true)
            const params: Record<string, string> = {}
            if (start) params.startDate = start.toISOString().split('T')[0]
            if (end) params.endDate = end.toISOString().split('T')[0]
            const res = await apiClient.get('/dashboard/hr-summary', { params })
            setDashData(res.data)
        } catch (err) {
            console.error('Error fetching HR dashboard data:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDashboard()
    }, [fetchDashboard])

    const handleDateChange = (start: Date | null, end: Date | null) => {
        setDateRange({ start, end })
        fetchDashboard(start, end)
    }

    const handleLeaveAction = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            await apiClient.put(`/leaves/requests/${id}/status`, { status })
            fetchDashboard(dateRange.start, dateRange.end)
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Error updating leave status')
        }
    }

    const formatDateRange = (start: string, end: string) => {
        const s = new Date(start)
        const e = new Date(end)
        const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
        if (s.toDateString() === e.toDateString()) return s.toLocaleDateString('en-US', opts)
        return `${s.toLocaleDateString('en-US', opts)} - ${e.toLocaleDateString('en-US', opts)}`
    }

    const getPhotoSrc = (photo: string | null) =>
        photo ? `${apiClient.defaults.baseURL}${photo}` : 'assets/img/users/user-13.jpg'

    return (
        <>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">HR Dashboard</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Dashboard</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        HR Dashboard
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-3 mb-2">
                            {/* Date Range Picker — triggers API re-fetch */}
                            <div className="me-3 input-icon position-relative">
                                <PredefinedDatePicker onDateRangeChange={handleDateChange} />
                            </div>
                            <div className="dropdown">
                                <Link
                                    to="#"
                                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="ti ti-file-export me-1" />
                                    Yearly Report
                                </Link>
                                <ul className="dropdown-menu  dropdown-menu-end p-3">
                                    <li>
                                        <Link to="#" className="dropdown-item rounded-1">
                                            Monthly Report
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="#" className="dropdown-item rounded-1">
                                            Yearly Report{" "}
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="dropdown">
                                <Link
                                    to="#"
                                    className="dropdown-toggle btn btn-primary d-inline-flex align-items-center"
                                    data-bs-toggle="dropdown"
                                >
                                    Add New
                                </Link>
                                <ul className="dropdown-menu  dropdown-menu-end p-3">
                                    <li>
                                        <Link to={all_routes.employeeList} className="dropdown-item rounded-1">
                                            Employee
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to={all_routes.attendanceemployee}
                                            className="dropdown-item rounded-1"
                                        >
                                            Attendance
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to={all_routes.leaveadmin} className="dropdown-item rounded-1">
                                            Leave
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-2 head-icons">
                                <CollapseHeader />
                            </div>
                        </div>
                    </div>
                    {/* /Breadcrumb */}

                    {/* start row */}
                    <div className="row">
                        <div className="col-xl-5 d-flex flex-column">
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-3">
                                        <h2 className="card-title mb-0">Employee Status &amp; Type</h2>
                                        <Link to={all_routes.employeereport} className="btn btn-md btn-light">
                                            View All
                                        </Link>
                                    </div>
                                    <div className="mb-3">
                                        <EmployeeStatusChart />
                                    </div>
                                    <div className="row">
                                        <div className="col-4">
                                            <div className="text-center">
                                                <h3 className="main-title mb-1">
                                                    {loading ? '—' : dashData.fullTimeCount}
                                                </h3>
                                                <p className="d-inline-flex align-items-center mb-0">
                                                    <span className="chart-line bg-primary me-1" />
                                                    Full-Time
                                                </p>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="text-center">
                                                <h3 className="main-title mb-1">
                                                    {loading ? '—' : dashData.contractCount}
                                                </h3>
                                                <p className="d-inline-flex align-items-center mb-0">
                                                    <span className="chart-line bg-secondary me-1" />
                                                    Contract
                                                </p>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="text-center">
                                                <h3 className="main-title mb-1">
                                                    {loading ? '—' : dashData.probationCount}
                                                </h3>
                                                <p className="d-inline-flex align-items-center mb-0">
                                                    <span className="chart-line bg-light me-1" />
                                                    Part-Time/Intern
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card flex-fill">
                                <div className="card-body pb-sm-2">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-3">
                                        <h2 className="card-title mb-0">Leave Type Distribution</h2>
                                    </div>
                                    <div className="row">
                                        <div className="col-sm-5">
                                            <LeaveTypeChart />
                                        </div>
                                        <div className="col-sm-7">
                                            <div>
                                                {loading ? (
                                                    <p className="text-muted fs-13">Loading...</p>
                                                ) : dashData.leaveTypeStats.length === 0 ? (
                                                    <p className="text-muted fs-13">No approved leaves in this period.</p>
                                                ) : (
                                                    dashData.leaveTypeStats.map((lt, i) => (
                                                        <div key={i} className="d-flex align-items-center justify-content-between mb-2">
                                                            <p className="d-inline-flex align-items-center text-dark mb-0">
                                                                <i className="ti ti-circle-filled text-primary-900 fs-7 me-1" />
                                                                {lt.name}
                                                            </p>
                                                            <span className="badge fw-normal bg-light text-dark border rounded-pill fs-13">
                                                                {lt.count}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>{" "}
                                {/* end card body */}
                            </div>{" "}
                            {/* end card */}
                        </div>{" "}
                        {/* end col */}
                        <div className="col-xl-7">
                            <div className="card">
                                <div className="card-body">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-3">
                                        <h2 className="card-title mb-0">Overview Statistics</h2>
                                    </div>
                                    <div className="row g-3">
                                        {/* Total Employees */}
                                        <div className="col-md-6 d-flex">
                                            <div className="card shadow-none mb-0 flex-fill">
                                                <div className="card-body">
                                                    <div className="d-flex align-items-center mb-3">
                                                        <div className="avatar avatar-lg bg-primary rounded-circle flex-shrink-0">
                                                            <i className="ti ti-users-group text-white fs-24" />
                                                        </div>
                                                        <div className="ms-2">
                                                            <p className="fw-semibold text-truncate mb-0">
                                                                Total Employees
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div>
                                                            <h3 className="main-title mb-1">
                                                                {loading ? '—' : dashData.totalEmployees.toLocaleString()}
                                                            </h3>
                                                            <p className="fs-13 mb-0">Headcount Overview</p>
                                                        </div>
                                                        <div className="d-inline-flex align-items-center bg-light border rounded-pill text-dark p-1 ps-2">
                                                            <Link to={all_routes.employeeList} className="text-dark fs-12">View</Link>
                                                            <span className="bg-success btn-icon btn-sm rounded-circle d-flex align-items-center justify-content-center ms-1">
                                                                <i className="ti ti-arrow-up-right fs-20" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>{" "}
                                            </div>{" "}
                                        </div>{" "}
                                        {/* New Joinees */}
                                        <div className="col-md-6 d-flex">
                                            <div className="card shadow-none mb-0 flex-fill">
                                                <div className="card-body">
                                                    <div className="d-flex avatar-lg align-items-center mb-3">
                                                        <div className="avatar bg-secondary rounded-circle flex-shrink-0">
                                                            <i className="ti ti-users-plus text-white fs-24" />
                                                        </div>
                                                        <div className="ms-2">
                                                            <p className="fw-semibold text-truncate mb-0">
                                                                New Joinees
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div>
                                                            <h3 className="main-title mb-1">
                                                                {loading ? '—' : dashData.newJoinees}
                                                            </h3>
                                                            <p className="fs-13 mb-0">In Selected Period</p>
                                                        </div>
                                                        <div className="d-inline-flex align-items-center bg-light border rounded-pill text-dark p-1 ps-2">
                                                            <Link to={all_routes.employeeList} className="text-dark fs-12">View</Link>
                                                            <span className="bg-success btn-icon btn-sm rounded-circle d-flex align-items-center justify-content-center ms-1">
                                                                <i className="ti ti-arrow-up-right fs-20" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>{" "}
                                            </div>{" "}
                                        </div>{" "}
                                        {/* Late Arrivals */}
                                        <div className="col-md-6 d-flex">
                                            <div className="card shadow-none mb-0 flex-fill">
                                                <div className="card-body">
                                                    <div className="d-flex align-items-center mb-3">
                                                        <div className="avatar avatar-lg bg-dark rounded-circle flex-shrink-0">
                                                            <i className="ti ti-clock-x text-white fs-24" />
                                                        </div>
                                                        <div className="ms-2">
                                                            <p className="fw-semibold text-truncate mb-0">
                                                                Late Arrivals Today
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div>
                                                            <h3 className="main-title mb-1">
                                                                {loading ? '—' : dashData.lateCount}
                                                            </h3>
                                                            <p className="fs-13 mb-0">Delayed Logins Today</p>
                                                        </div>
                                                        <div className="d-inline-flex align-items-center bg-light border rounded-pill text-dark p-1 ps-2">
                                                            <Link to={all_routes.attendanceadmin} className="text-dark fs-12">View</Link>
                                                            <span className="bg-danger btn-icon btn-sm rounded-circle d-flex align-items-center justify-content-center ms-1">
                                                                <i className="ti ti-arrow-down-right fs-20" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>{" "}
                                            </div>{" "}
                                        </div>{" "}
                                        {/* Absent */}
                                        <div className="col-md-6 d-flex">
                                            <div className="card shadow-none mb-0 flex-fill">
                                                <div className="card-body">
                                                    <div className="d-flex align-items-center mb-3">
                                                        <div className="avatar avatar-lg bg-purple rounded-circle flex-shrink-0">
                                                            <i className="ti ti-user-off text-white fs-24" />
                                                        </div>
                                                        <div className="ms-2">
                                                            <p className="fw-semibold text-truncate mb-0">
                                                                Absent Today
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div>
                                                            <h3 className="main-title mb-1">
                                                                {loading ? '—' : dashData.absentCount}
                                                            </h3>
                                                            <p className="fs-13 mb-0">No Check-In Recorded</p>
                                                        </div>
                                                        <div className="d-inline-flex align-items-center bg-light border rounded-pill text-dark p-1 ps-2">
                                                            <Link to={all_routes.attendanceadmin} className="text-dark fs-12">View</Link>
                                                            <span className="bg-warning btn-icon btn-sm rounded-circle d-flex align-items-center justify-content-center ms-1">
                                                                <i className="ti ti-minus fs-20" />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>{" "}
                                            </div>{" "}
                                        </div>{" "}
                                    </div>
                                </div>{" "}
                            </div>{" "}
                        </div>{" "}
                    </div>
                    {/* end row */}

                    {/* start row — Attendance Trend + Top Employee Distribution */}
                    <div className="row">
                        <div className="col-xl-8 d-flex">
                            <div className="card flex-fill">
                                <div className="card-body pb-0">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-3">
                                        <h2 className="card-title mb-0">Attendance Trend</h2>
                                        <Link to={all_routes.attendanceadmin} className="btn btn-md btn-light">
                                            View All
                                        </Link>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                                        <div className="d-flex align-items-center flex-wrap gap-3">
                                            <div className="d-flex align-items-center pe-3 border-end">
                                                <h3 className="mb-0">
                                                    {loading ? '—' : dashData.onTimeCount}
                                                    <span className="ms-2 fw-normal fs-14 text-default">
                                                        On-Time
                                                    </span>
                                                </h3>
                                            </div>
                                            <div className="d-flex align-items-center pe-3 border-end">
                                                <h3 className="mb-0">
                                                    {loading ? '—' : dashData.lateCount}
                                                    <span className="ms-2 fw-normal fs-14 text-default">
                                                        Late
                                                    </span>
                                                </h3>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <h3 className="mb-0">
                                                    {loading ? '—' : dashData.absentCount}
                                                    <span className="ms-2 fw-normal fs-14 text-default">
                                                        Absent
                                                    </span>
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3">
                                            <p className="mb-0">
                                                <i className="ti ti-square-filled text-primary fs-12 me-1" />
                                                Present
                                            </p>
                                            <p className="mb-0">
                                                <i className="ti ti-square-filled text-secondary fs-12 me-1" />
                                                Late
                                            </p>
                                            <p className="mb-0">
                                                <i className="ti ti-square-filled text-warning fs-12 me-1" />
                                                Absent
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-sm-flex align-items-center flex-sm-row flex-column">
                                        <div className="w-100">
                                            <AttendanceChart />
                                        </div>
                                        <div className="flex-shrink-0">
                                            <div className="border p-3 rounded text-center mb-3">
                                                <p className="mb-1">On-Time Today</p>
                                                <h3 className="main-title mb-0">
                                                    {loading ? '—' : dashData.onTimeCount}
                                                </h3>
                                            </div>
                                            <div className="border p-3 rounded text-center mb-3">
                                                <p className="mb-1">Late Today</p>
                                                <h3 className="main-title mb-0">
                                                    {loading ? '—' : dashData.lateCount}
                                                </h3>
                                            </div>
                                            <div className="border p-3 rounded text-center mb-3">
                                                <p className="mb-1">Absent Today</p>
                                                <h3 className="main-title mb-0">
                                                    {loading ? '—' : dashData.absentCount}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>{" "}
                            </div>{" "}
                        </div>{" "}
                        <div className="col-xl-4 d-flex">
                            <div className="card flex-fill">
                                <div className="card-body pb-0">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-0">
                                        <h2 className="card-title mb-0">Top Employee Distribution</h2>
                                        <Link to={all_routes.employeeList} className="btn btn-md btn-light">
                                            View All
                                        </Link>
                                    </div>
                                    <EmployeeDistributionChart />
                                </div>{" "}
                            </div>{" "}
                        </div>{" "}
                    </div>
                    {/* end row */}

                    {/* start row — Late Arrivals + Recruitment Statistics + Upcoming Interviews */}
                    <div className="row">
                        <div className="col-xxl-4 col-xl-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-3">
                                        <h2 className="card-title mb-0">Late Arrivals Today</h2>
                                        <Link to={all_routes.attendanceadmin} className="btn btn-md btn-light">
                                            View All
                                        </Link>
                                    </div>
                                    {loading ? (
                                        <p className="text-muted text-center py-3">Loading...</p>
                                    ) : dashData.lateArrivalsList.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="ti ti-circle-check text-success fs-32 mb-2 d-block" />
                                            No late arrivals today!
                                        </div>
                                    ) : (
                                        dashData.lateArrivalsList.map((emp, i) => (
                                            <div
                                                key={emp.id}
                                                className={`p-2 bg-light rounded border-bottom d-flex align-items-center justify-content-between ${i === dashData.lateArrivalsList.length - 1 ? 'mb-0' : 'mb-2'}`}
                                            >
                                                <div className="d-flex align-items-center">
                                                    <Link to="#" className="avatar flex-shrink-0">
                                                        <img
                                                            src={getPhotoSrc(emp.photo)}
                                                            className="rounded-circle"
                                                            alt="user"
                                                            style={{ width: 40, height: 40, objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                e.currentTarget.src = 'assets/img/users/user-13.jpg'
                                                            }}
                                                        />
                                                    </Link>
                                                    <div className="ms-2">
                                                        <p className="fs-14 fw-medium text-truncate mb-1">
                                                            <Link to="#">{emp.name}</Link>
                                                        </p>
                                                        <p className="fs-13">{emp.department}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="fs-13 text-dark mb-1">{emp.checkIn}</p>
                                                    <span className="badge badge-danger-transparent rounded-pill">
                                                        +{emp.delayMinutes} Min
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>{" "}
                            </div>{" "}
                        </div>{" "}
                        <div className="col-xxl-4 col-xl-6 d-flex flex-column">
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-3">
                                        <h2 className="card-title mb-0">Recruitment Statistics</h2>
                                    </div>
                                    <div className="mb-4">
                                        <div className="row g-3">
                                            <div className="col-6 col-sm-4">
                                                <div className="text-center">
                                                    <p className="mb-1">Applicants</p>
                                                    <h2 className="mb-0">—</h2>
                                                </div>
                                            </div>
                                            <div className="col-6 col-sm-4">
                                                <div className="text-center">
                                                    <p className="mb-1">Hired</p>
                                                    <h2 className="mb-0">—</h2>
                                                </div>
                                            </div>
                                            <div className="col-6 col-sm-4">
                                                <div className="text-center">
                                                    <p className="mb-1">Avg Time</p>
                                                    <h2 className="mb-0">—</h2>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-muted fs-13 text-center">Recruitment module coming soon</p>
                                </div>{" "}
                            </div>{" "}
                            <div className="card bg-secondary shadow-none z-1">
                                <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    <div>
                                        <p className="text-white mb-1">Employees in Training</p>
                                        <h2 className="text-white mb-0">—</h2>
                                    </div>
                                    <div className="d-inline-flex align-items-center gap-2">
                                        <div className="chartjs-wrapper-demo position-relative">
                                            <TrainingChart />
                                        </div>
                                    </div>
                                </div>{" "}
                                <ImageWithBasePath
                                    src="assets/img/bg/emp-bg.png"
                                    alt="bg"
                                    className="img-fluid position-absolute top-0 start-1 z-n1"
                                />
                            </div>{" "}
                        </div>{" "}
                        <div className="col-xxl-4 col-xl-12 d-flex">
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-3">
                                        <h2 className="card-title mb-0">Upcoming Interview</h2>
                                    </div>
                                    <div className="text-center py-4 text-muted">
                                        <i className="ti ti-calendar-event fs-32 mb-2 d-block" />
                                        Interview scheduling coming soon
                                    </div>
                                    <Link to={all_routes.candidatesGrid} className="btn btn-light w-100">
                                        View All
                                        <i className="ti ti-arrow-right ms-1" />
                                    </Link>
                                </div>{" "}
                            </div>{" "}
                        </div>{" "}
                    </div>
                    {/* end row */}

                    {/* start row — Payroll + Top Employees + Pending Approvals */}
                    <div className="row">
                        <div className="col-xl-7 d-flex flex-column">
                            {/* start row */}
                            <div className="row">
                                <div className="col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="mb-1">Benefits Deductions</p>
                                                    <h2 className="mb-2">—</h2>
                                                    <p className="mb-0">Insurance + 401(k)</p>
                                                </div>
                                                <div>
                                                    <DeductionChart />
                                                </div>
                                            </div>
                                        </div>{" "}
                                    </div>{" "}
                                </div>{" "}
                                <div className="col-md-6 d-flex">
                                    <div className="card flex-fill">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="mb-1">Total Payroll</p>
                                                    <h2 className="mb-2">—</h2>
                                                    <p className="mb-0">
                                                        <span className="text-muted">Payroll module coming soon</span>
                                                    </p>
                                                </div>
                                                <div className="text-end">
                                                    <PayrollChart />
                                                </div>
                                            </div>
                                        </div>{" "}
                                    </div>{" "}
                                </div>{" "}
                            </div>
                            {/* end row */}
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-3">
                                        <h2 className="card-title mb-0">Top Employees</h2>
                                    </div>
                                    <div className="tab-content">
                                        <div className="tab-pane fade show active" id="day" role="tabpanel">
                                            <div className="chart-container">
                                                <ImagePointChart />
                                            </div>
                                        </div>
                                    </div>
                                </div>{" "}
                            </div>{" "}
                        </div>{" "}
                        <div className="col-xl-5 d-flex">
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="border rounded border-start border-start-primary d-flex align-items-center justify-content-between p-2 gap-2 flex-wrap mb-3">
                                        <h2 className="card-title mb-0">Pending Approvals</h2>
                                        <Link to={all_routes.leaveadmin} className="btn btn-md btn-light">
                                            View All
                                        </Link>
                                    </div>
                                    {loading ? (
                                        <p className="text-muted text-center py-3">Loading...</p>
                                    ) : dashData.pendingLeaves.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="ti ti-circle-check text-success fs-32 mb-2 d-block" />
                                            No pending approvals!
                                        </div>
                                    ) : (
                                        dashData.pendingLeaves.map((leave, i) => (
                                            <div
                                                key={leave.id}
                                                className={`p-2 rounded border d-flex align-items-sm-center justify-content-between gap-2 flex-column flex-sm-row ${i < dashData.pendingLeaves.length - 1 ? 'mb-2' : 'mb-0'}`}
                                            >
                                                <div>
                                                    <div className="d-flex align-items-center mb-1">
                                                        <Link to="#" className="avatar avatar-sm flex-shrink-0">
                                                            <img
                                                                src={getPhotoSrc(leave.photo)}
                                                                className="rounded-circle"
                                                                alt="user"
                                                                style={{ width: 32, height: 32, objectFit: 'cover' }}
                                                                onError={(e) => {
                                                                    e.currentTarget.src = 'assets/img/users/user-13.jpg'
                                                                }}
                                                            />
                                                        </Link>
                                                        <div className="ms-2">
                                                            <p className="fs-14 fw-semibold text-truncate mb-0">
                                                                <Link to="#">{leave.employeeName}</Link>
                                                            </p>
                                                            {leave.designation && (
                                                                <p className="fs-12 text-muted mb-0">{leave.designation}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="d-inline-flex align-items-center gap-1">
                                                        <p className="fs-13 d-inline-flex align-items-center mb-0">
                                                            <i className="ti ti-calendar-up me-1" />
                                                            {formatDateRange(leave.startDate, leave.endDate)}
                                                        </p>
                                                        <span>
                                                            <i className="ti ti-minus-vertical border-color fs-14" />
                                                        </span>
                                                        <p className="fs-13 d-inline-flex align-items-center mb-0">
                                                            <i className="ti ti-clock-hour-11 me-1" />{leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    {leave.reason && (
                                                        <p className="fs-13 mb-0 text-truncate" style={{ maxWidth: 200 }}>
                                                            Reason: {leave.reason}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>{" "}
                            </div>{" "}
                        </div>{" "}
                    </div>
                    {/* end row */}
                </div>
                <CommonFooter />
            </div>
            {/* /Page Wrapper */}
        </>
    )
}

export default HrDashboard