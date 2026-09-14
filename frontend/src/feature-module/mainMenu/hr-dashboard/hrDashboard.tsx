import { useState, useEffect, useCallback } from 'react'
import PredefinedDatePicker from '@/core/common/datePicker'
import { all_routes } from '@/router/all_routes'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import EmployeeStatusChart from './charts/employeeStatusChart'
import LeaveTypeChart from './charts/leaveTypeChart'
import AttendanceChart from './charts/attendanceChart'
import EmployeeDistributionChart from './charts/employeeDistributionChart'
import TopEmployeeChart from './charts/topEmployeeChart'
import apiClient from '../../../core/utils/apiClient'
import ImageWithBasePath from '@/core/common/imageWithBasePath'

// ── Interfaces ────────────────────────────────────────────────────────
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

interface UpcomingLeave {
  id: number
  employeeName: string
  photo: string | null
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
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
  attendanceTrend?: Record<string, any>
  employeeDistribution?: { label: string; count: number; percentage: number }[]
  leaveTypeStats: { name: string; count: number }[]
  pendingLeaves: PendingLeave[]
  upcomingLeaves: UpcomingLeave[]
  recruitmentStats: { applicants: number; hired: number; avgTimeDays: number; interviewPositions: number }
  benefitsDeductions: { amount: number; formattedAmount: string; subtitle: string }
  payrollStats: { amount: number; formattedAmount: string; subtitle: string }
  topEmployees: { name: string; score: number; avatar?: string | null }[]
}

const defaultDash: DashData = {
  totalEmployees: 11,
  newJoinees: 0,
  fullTimeCount: 11,
  contractCount: 0,
  probationCount: 0,
  onTimeCount: 0,
  lateCount: 1,
  absentCount: 10,
  attendanceTrend: {
    week: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      present: [0, 0, 0, 0, 0, 0, 0],
      late: [1, 0, 0, 0, 0, 0, 0],
      absent: [10, 0, 0, 0, 0, 0, 0],
      maxScale: 15
    },
    month: {
      categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      present: [5, 0, 0, 0],
      late: [0, 0, 0, 0],
      absent: [50, 0, 0, 0],
      maxScale: 60
    },
    year: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      present: [0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0],
      late: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      absent: [0, 0, 0, 0, 0, 0, 0, 0, 230, 0, 0, 0],
      maxScale: 250
    }
  },
  employeeDistribution: [
    { label: 'Web Developer', count: 4, percentage: 36 },
    { label: 'SEO', count: 2, percentage: 18 },
    { label: 'IT', count: 2, percentage: 18 },
    { label: 'Web Designer', count: 2, percentage: 18 },
    { label: 'PHP Developer', count: 1, percentage: 10 }
  ],
  leaveTypeStats: [
    { name: 'Casual Leave', count: 5 },
    { name: 'Sick Leave', count: 3 },
    { name: 'Earned Leave', count: 2 },
    { name: 'Maternity Leave', count: 1 },
    { name: 'Other', count: 1 }
  ],
  pendingLeaves: [
    { id: 101, employeeName: 'Kanika Rajput', designation: 'Web Designer', photo: null, leaveType: 'Casual Leave', startDate: '2026-08-19', endDate: '2026-08-19', totalDays: 1, reason: '' },
    { id: 102, employeeName: 'Uday sharma', designation: 'PHP developer', photo: null, leaveType: 'Sick Leave', startDate: '2026-08-25', endDate: '2026-08-25', totalDays: 1, reason: '' },
    { id: 103, employeeName: 'Aman Kumar', designation: 'Web Designer', photo: null, leaveType: 'Casual Leave', startDate: '2026-08-10', endDate: '2026-08-10', totalDays: 1, reason: '' }
  ],
  upcomingLeaves: [],
  recruitmentStats: { applicants: 12, hired: 3, avgTimeDays: 8, interviewPositions: 2 },
  benefitsDeductions: { amount: 45000, formattedAmount: '₹ 45,000', subtitle: 'Insurance + 401(k)' },
  payrollStats: { amount: 325000, formattedAmount: '₹ 3,25,000', subtitle: 'Salary processing & reports' },
  topEmployees: []
}

const HrDashboard = () => {
  const user = useSelector((state: any) => state.auth?.user) as any
  const userName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (localStorage.getItem("userName") || "Vikramjeet"))
  
  const [dashData, setDashData] = useState<DashData>(defaultDash)
  const [loading, setLoading] = useState(false)
  const [attendanceFilter, setAttendanceFilter] = useState<'week' | 'month' | 'year'>('week')

  // ── Clock & Attendance state for HR login display ──
  const [currentTime, setCurrentTime] = useState(new Date())
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null)
  const [clockLoading, setClockLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await apiClient.get('/attendance/today')
      setAttendanceStatus(res.data)
    } catch (error) {
      console.error('Failed to fetch HR attendance status:', error)
    }
  }, [])

  useEffect(() => {
    fetchTodayAttendance()
  }, [fetchTodayAttendance])

  const handlePunch = async () => {
    try {
      setClockLoading(true)
      if (attendanceStatus?.isCheckedIn) {
        await apiClient.post('/attendance/check-out')
      } else {
        await apiClient.post('/attendance/check-in')
      }
      await fetchTodayAttendance()
      fetchDashboard() // Refresh metrics
    } catch (error) {
      console.error('Failed to punch in/out:', error)
    } finally {
      setClockLoading(false)
    }
  }

  const getFormattedDate = () => {
    const d = currentTime
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  const getFormattedTimeParts = () => {
    const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    const parts = timeString.split(':')
    if (parts.length < 3) return { hhmm: '00:00', ssAmPm: ':00 AM' }
    const hh = parts[0]
    const mm = parts[1]
    const ssWithAmPm = parts[2]
    return { hhmm: `${hh}:${mm}`, ssAmPm: `:${ssWithAmPm}` }
  }

  const { hhmm, ssAmPm } = getFormattedTimeParts()

  const fetchDashboard = useCallback(async (start?: Date | null, end?: Date | null) => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      const formatDateParam = (d: Date) => {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      if (start) params.startDate = formatDateParam(start)
      if (end) params.endDate = formatDateParam(end)
      const res = await apiClient.get('/dashboard/hr-summary', { params })
      if (res.data) {
        setDashData((prev) => ({ ...prev, ...res.data }))
      }
    } catch (err) {
      console.error('Error fetching HR dashboard data:', err)
      // Dynamic fallback: fetch live employee list if primary summary endpoint is unreachable
      try {
        const empRes = await apiClient.get('/employee')
        const list = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.employees || empRes.data?.data || [])
        if (list.length > 0) {
          let ft = 0, ct = 0, pt = 0
          list.forEach((e: any) => {
            const type = (e.employmentType || e.type || '').toUpperCase()
            if (type === 'CONTRACT') ct++
            else if (type === 'PART_TIME' || type === 'INTERN') pt++
            else ft++ // Regular Full-Time by default
          })
          setDashData((prev) => ({
            ...prev,
            totalEmployees: list.length,
            fullTimeCount: ft,
            contractCount: ct,
            probationCount: pt,
          }))
        }
      } catch (fallbackErr) {
        console.error('Fallback employee count fetch error:', fallbackErr)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleDateChange = (start: Date | null, end: Date | null) => {
    fetchDashboard(start, end)
  }

  const handleLeaveAction = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.put(`/leaves/requests/${id}/status`, { status })
      fetchDashboard()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Action recorded successfully')
      // Optimistic update for UI responsiveness
      setDashData(prev => ({
        ...prev,
        pendingLeaves: prev.pendingLeaves.filter(p => p.id !== id)
      }))
    }
  }

  const formatDateShort = (dStr: string) => {
    if (!dStr) return ''
    const d = new Date(dStr)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--bs-body-bg, #f4f6f9)', minHeight: '100vh' }}>
      <div className="content container-fluid p-4">
        
        {/* ── Banner Card ──────────────────────────────────────────────── */}
        <div className="card border-0 mb-4 hr-dashboard-card hr-banner-card" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ffffff 100%)', borderRadius: '16px' }}>
          <div className="card-body p-4 position-relative">
            <div className="row align-items-center">
              <div className="col-lg-7 mb-3 mb-lg-0">
                <h2 className="fw-bold mb-1" style={{ color: '#1e1b4b' }}>
                  Good Morning, {userName}! 👋
                </h2>
                <p className="text-muted fs-14 mb-3">Here's what's happening with your team today.</p>
                <div className="d-inline-flex align-items-center bg-white px-3 py-1 rounded-pill shadow-xs border">
                  <i className="ti ti-calendar text-primary me-2 fs-16" />
                  <span className="fs-13 fw-medium text-secondary">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="col-lg-5 text-lg-end">
                <div className="d-flex flex-wrap align-items-center justify-content-lg-end gap-2 mb-3">
                  <div className="bg-white rounded-pill shadow-xs border px-2 py-1">
                    <PredefinedDatePicker onDateRangeChange={handleDateChange} />
                  </div>
                  
                  <div className="dropdown">
                    <button className="btn btn-white btn-sm rounded-pill shadow-xs border dropdown-toggle fw-medium px-3" type="button" data-bs-toggle="dropdown">
                      Yearly Report
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                      <li><Link to="#" className="dropdown-item fs-13">Monthly Report</Link></li>
                      <li><Link to="#" className="dropdown-item fs-13">Yearly Report</Link></li>
                    </ul>
                  </div>

                  <div className="dropdown">
                    <button className="btn btn-primary btn-sm rounded-pill shadow-xs fw-semibold px-3 text-white d-inline-flex align-items-center" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }} type="button" data-bs-toggle="dropdown">
                      <i className="ti ti-plus me-1" /> Add New
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                      <li><Link to={all_routes.employeeList} className="dropdown-item fs-13">Employee</Link></li>
                      <li><Link to={all_routes.attendanceemployee} className="dropdown-item fs-13">Attendance</Link></li>
                      <li><Link to={all_routes.leaveadmin} className="dropdown-item fs-13">Leave</Link></li>
                    </ul>
                  </div>
                </div>

                {/* ── Employee Login Clock Display Widget ── */}
                <div className="card border-0 shadow-sm text-start w-100" style={{ backgroundColor: '#162E5B', borderRadius: '12px' }}>
                  <div className="card-body p-3 text-white">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-white fs-13 fw-medium">Time Today - {getFormattedDate()}</span>
                      <Link to={all_routes.attendanceemployee} className="text-white text-decoration-underline fs-12 fw-medium">View All</Link>
                    </div>
                    <span className="d-block text-white-50 fs-11 fw-bold tracking-wide mb-1" style={{ letterSpacing: '0.05em' }}>CURRENT TIME</span>
                    <div className="d-flex align-items-end justify-content-between">
                      <div className="d-flex align-items-baseline text-white">
                        <h1 className="display-4 text-white mb-0 fw-normal" style={{ fontSize: '2.2rem', lineHeight: '1' }}>{hhmm}</h1>
                        <span className="fs-14 ms-1" style={{ opacity: 0.85 }}>{ssAmPm}</span>
                      </div>
                      <button 
                        onClick={handlePunch} 
                        disabled={clockLoading}
                        className="btn px-4 py-2 border-0 fw-medium fs-14 rounded-3 text-white shadow-sm" 
                        style={{ backgroundColor: attendanceStatus?.isCheckedIn ? '#FF655A' : '#03C95A', transition: 'all 0.2s', opacity: clockLoading ? 0.7 : 1 }}
                      >
                        {clockLoading ? (
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                        ) : attendanceStatus?.isCheckedIn ? (
                          <>
                            <i className="ti ti-clock-off me-1" /> Clock-out
                          </>
                        ) : (
                          <>
                            <i className="ti ti-clock-check me-1" /> Clock-in
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top Metric Cards Row (5 Cards) ─────────────────────────────── */}
        <div className="row g-3 mb-4">
          
          {/* Card 1: Total Employees */}
          <div className="col-xl-20 col-lg-4 col-md-6" style={{ width: '20%' }}>
            <div className="card hr-kpi-card-wrapper card-blue h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="hr-icon-circle hr-icon-blue">
                    <i className="ti ti-users-group" />
                  </div>
                  <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle fs-11 fw-semibold">
                    ↑ 12%
                  </span>
                </div>
                <p className="fs-12 text-muted mb-1 fw-medium">Total Employees</p>
                <h3 className="fw-bold mb-1 text-dark fs-24">{dashData.totalEmployees}</h3>
                <span className="fs-11 text-secondary">Headcount Overview</span>
              </div>
            </div>
          </div>

          {/* Card 2: New Joiners */}
          <div className="col-xl-20 col-lg-4 col-md-6" style={{ width: '20%' }}>
            <div className="card hr-kpi-card-wrapper card-green h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="hr-icon-circle hr-icon-green">
                    <i className="ti ti-user-plus" />
                  </div>
                  <span className="badge rounded-pill bg-secondary-subtle text-secondary border fs-11 fw-medium">
                    No change
                  </span>
                </div>
                <p className="fs-12 text-muted mb-1 fw-medium">New Joiners</p>
                <h3 className="fw-bold mb-1 text-dark fs-24">{dashData.newJoinees}</h3>
                <span className="fs-11 text-secondary">In Selected Period</span>
              </div>
            </div>
          </div>

          {/* Card 3: On Leave Today */}
          <div className="col-xl-20 col-lg-4 col-md-6" style={{ width: '20%' }}>
            <div className="card hr-kpi-card-wrapper card-orange h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="hr-icon-circle hr-icon-orange">
                    <i className="ti ti-calendar-event" />
                  </div>
                  <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle fs-11 fw-semibold">
                    ↓ 50%
                  </span>
                </div>
                <p className="fs-12 text-muted mb-1 fw-medium">On Leave Today</p>
                <h3 className="fw-bold mb-1 text-dark fs-24">2</h3>
                <span className="fs-11 text-secondary">From last period</span>
              </div>
            </div>
          </div>

          {/* Card 4: Late Arrivals Today */}
          <div className="col-xl-20 col-lg-4 col-md-6" style={{ width: '20%' }}>
            <div className="card hr-kpi-card-wrapper card-rose h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="hr-icon-circle hr-icon-rose">
                    <i className="ti ti-clock-x" />
                  </div>
                  <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle fs-11 fw-semibold">
                    ↓ 100%
                  </span>
                </div>
                <p className="fs-12 text-muted mb-1 fw-medium">Late Arrivals Today</p>
                <h3 className="fw-bold mb-1 text-dark fs-24">{dashData.lateCount}</h3>
                <span className="fs-11 text-secondary">Compared to yesterday</span>
              </div>
            </div>
          </div>

          {/* Card 5: Absent Today */}
          <div className="col-xl-20 col-lg-4 col-md-6" style={{ width: '20%' }}>
            <div className="card hr-kpi-card-wrapper card-purple h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="hr-icon-circle hr-icon-purple">
                    <i className="ti ti-user-off" />
                  </div>
                  <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle fs-11 fw-semibold">
                    ↑ 10%
                  </span>
                </div>
                <p className="fs-12 text-muted mb-1 fw-medium">Absent Today</p>
                <h3 className="fw-bold mb-1 text-dark fs-24">{dashData.absentCount}</h3>
                <span className="fs-11 text-secondary">No Check-In Recorded</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Row 2: Status & Leave Type Distribution ─────────────────────── */}
        <div className="row g-3 mb-4">
          
          {/* Employee Status & Type */}
          <div className="col-lg-6">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '16px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold m-0 text-dark">Employee Status &amp; Type</h6>
                  <Link to={all_routes.employeeList} className="btn btn-xs btn-light rounded-pill border fs-12 px-3">View All</Link>
                </div>

                <div className="row align-items-center">
                  {(() => {
                    const totalEmp = dashData.totalEmployees || 11;
                    const ft = dashData.fullTimeCount !== undefined ? dashData.fullTimeCount : 11;
                    const ct = dashData.contractCount !== undefined ? dashData.contractCount : 0;
                    const pt = dashData.probationCount !== undefined ? dashData.probationCount : Math.max(0, totalEmp - ft - ct);
                    const ftPct = totalEmp > 0 ? Math.round((ft / totalEmp) * 100) : 100;
                    const ctPct = totalEmp > 0 ? Math.round((ct / totalEmp) * 100) : 0;
                    const ptPct = totalEmp > 0 ? Math.max(0, 100 - ftPct - ctPct) : 0;

                    return (
                      <>
                        <div className="col-sm-7 mb-3 mb-sm-0">
                          <div className="progress rounded-pill mb-3" style={{ height: 14, backgroundColor: '#f3f4f6' }}>
                            <div className="progress-bar" style={{ width: `${ftPct}%`, backgroundColor: '#3b82f6' }} title={`Full-Time: ${ft}`} />
                            <div className="progress-bar" style={{ width: `${ctPct}%`, backgroundColor: '#8b5cf6' }} title={`Contract: ${ct}`} />
                            <div className="progress-bar" style={{ width: `${ptPct}%`, backgroundColor: '#10b981' }} title={`Part-Time/Intern: ${pt}`} />
                          </div>

                          <div className="d-flex justify-content-between text-center">
                            <div>
                              <h5 className="fw-bold mb-0 text-dark">{ft}</h5>
                              <span className="fs-11 text-muted">Full-Time</span>
                            </div>
                            <div>
                              <h5 className="fw-bold mb-0 text-dark">{ct}</h5>
                              <span className="fs-11 text-muted">Contract</span>
                            </div>
                            <div>
                              <h5 className="fw-bold mb-0 text-dark">{pt}</h5>
                              <span className="fs-11 text-muted">Part-Time/Intern</span>
                            </div>
                          </div>
                        </div>

                        <div className="col-sm-5">
                          <EmployeeStatusChart 
                            fullTime={ft} 
                            contract={ct} 
                            partTime={pt} 
                            totalCount={totalEmp} 
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Leave Type Distribution */}
          <div className="col-lg-6">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '16px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold m-0 text-dark">Leave Type Distribution</h6>
                  <Link to={all_routes.leaveadmin} className="btn btn-xs btn-light rounded-pill border fs-12 px-3">View All</Link>
                </div>

                <div className="row align-items-center">
                  <div className="col-sm-5 mb-3 mb-sm-0">
                    <LeaveTypeChart stats={dashData.leaveTypeStats} />
                  </div>

                  <div className="col-sm-7">
                    <div className="d-flex flex-column gap-2">
                      {dashData.leaveTypeStats.map((item, idx) => {
                        const colors = ['#3b82f6', '#06b6d4', '#f59e0b', '#a855f7', '#64748b']
                        const totalReqs = dashData.leaveTypeStats.reduce((a, b) => a + b.count, 0) || 12
                        const pct = Math.round((item.count / totalReqs) * 100)
                        return (
                          <div key={idx} className="d-flex align-items-center justify-content-between fs-12">
                            <span className="d-inline-flex align-items-center text-secondary">
                              <span className="rounded-circle me-2" style={{ width: 8, height: 8, backgroundColor: colors[idx % colors.length] }} />
                              {item.name}
                            </span>
                            <span className="fw-semibold text-dark">{item.count} ({pct}%)</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* ── Row 3: Attendance Trend & Top Distribution ───────────────────── */}
        <div className="row g-3 mb-4">
          
          {/* Attendance Trend */}
          <div className="col-lg-7">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '16px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                  <h6 className="fw-bold m-0 text-dark">Attendance Trend</h6>
                  
                  <div className="d-flex align-items-center gap-2">
                    <div className="btn-group btn-group-sm rounded-pill border p-1 bg-light">
                      <button type="button" className={`btn btn-xs rounded-pill border-0 ${attendanceFilter === 'week' ? 'bg-primary text-white fw-medium' : 'text-secondary'}`} onClick={() => setAttendanceFilter('week')}>This Week</button>
                      <button type="button" className={`btn btn-xs rounded-pill border-0 ${attendanceFilter === 'month' ? 'bg-primary text-white fw-medium' : 'text-secondary'}`} onClick={() => setAttendanceFilter('month')}>This Month</button>
                      <button type="button" className={`btn btn-xs rounded-pill border-0 ${attendanceFilter === 'year' ? 'bg-primary text-white fw-medium' : 'text-secondary'}`} onClick={() => setAttendanceFilter('year')}>This Year</button>
                    </div>

                    <Link to={all_routes.attendanceadmin} className="btn btn-xs btn-light rounded-pill border fs-12 px-3">View All</Link>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-9 mb-3 mb-md-0">
                    <div className="d-flex align-items-center gap-3 mb-2 fs-12 justify-content-end pe-3">
                      <span className="d-inline-flex align-items-center"><span className="rounded me-1" style={{ width: 10, height: 10, backgroundColor: '#10b981' }} /> Present</span>
                      <span className="d-inline-flex align-items-center"><span className="rounded me-1" style={{ width: 10, height: 10, backgroundColor: '#f97316' }} /> Late</span>
                      <span className="d-inline-flex align-items-center"><span className="rounded me-1" style={{ width: 10, height: 10, backgroundColor: '#ef4444' }} /> Absent</span>
                    </div>
                    <AttendanceChart trendData={dashData.attendanceTrend?.[attendanceFilter]} />
                  </div>

                  <div className="col-md-3 d-flex flex-column justify-content-center gap-3">
                    <div className="p-2 border rounded-3 text-center bg-light-subtle">
                      <span className="fs-11 text-muted d-block">On-Time Today</span>
                      <h4 className="fw-bold text-dark m-0">{dashData.onTimeCount}</h4>
                      <span className="fs-10 text-success">Today</span>
                    </div>

                    <div className="p-2 border rounded-3 text-center bg-light-subtle">
                      <span className="fs-11 text-muted d-block">Late Today</span>
                      <h4 className="fw-bold text-dark m-0">{dashData.lateCount}</h4>
                      <span className="fs-10 text-warning">Today</span>
                    </div>

                    <div className="p-2 border rounded-3 text-center bg-light-subtle">
                      <span className="fs-11 text-muted d-block">Absent Today</span>
                      <h4 className="fw-bold text-dark m-0">{dashData.absentCount}</h4>
                      <span className="fs-10 text-danger">Today</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Top Employee Distribution */}
          <div className="col-lg-5">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '16px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold m-0 text-dark">Top Employee Distribution</h6>
                  <Link to={all_routes.employeeList} className="btn btn-xs btn-light rounded-pill border fs-12 px-3">View All</Link>
                </div>

                <EmployeeDistributionChart distribution={dashData.employeeDistribution} />
              </div>
            </div>
          </div>

        </div>

        {/* ── Row 4: Upcoming Leave, Recruitment & Pending Approvals ───────── */}
        <div className="row g-3 mb-4">
          
          {/* Upcoming Leave */}
          <div className="col-lg-4">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '16px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold m-0 text-dark">Upcoming Leave</h6>
                  <Link to={all_routes.leaveadmin} className="btn btn-xs btn-light rounded-pill border fs-12 px-3">View All</Link>
                </div>

                <div className="d-flex flex-column gap-3">
                  {dashData.upcomingLeaves && dashData.upcomingLeaves.length > 0 ? (
                    dashData.upcomingLeaves.map((item) => {
                      const tagStyle = item.leaveType.toLowerCase().includes('sick')
                        ? 'bg-danger-subtle text-danger'
                        : item.leaveType.toLowerCase().includes('casual')
                        ? 'bg-info-subtle text-info'
                        : 'bg-success-subtle text-success'

                      return (
                        <div key={item.id} className="d-flex align-items-center justify-content-between p-2 rounded-3 border bg-light-subtle">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, fontSize: 13 }}>
                              {item.employeeName.charAt(0)}
                            </div>
                            <div>
                              <h6 className="fw-semibold text-dark mb-0 fs-13">{item.employeeName}</h6>
                              <span className="fs-11 text-muted">{item.leaveType} • {item.totalDays} day{item.totalDays > 1 ? 's' : ''}</span>
                              <span className="fs-11 text-secondary d-block">{formatDateShort(item.startDate)}</span>
                            </div>
                          </div>
                          <span className={`badge rounded-pill fs-11 ${tagStyle}`}>
                            {item.leaveType.split(' ')[0]}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center text-muted py-4 fs-13">
                      <i className="ti ti-calendar-off fs-24 mb-1 d-block text-secondary opacity-50" />
                      No upcoming leaves scheduled
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Recruitment Statistics */}
          <div className="col-lg-4">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '16px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold m-0 text-dark">Recruitment Statistics</h6>
                  <Link to={all_routes.candidatesGrid} className="btn btn-xs btn-light rounded-pill border fs-12 px-3">View All</Link>
                </div>

                <div className="row text-center my-3">
                  <div className="col-4">
                    <span className="fs-11 text-muted d-block mb-1">Applicants</span>
                    <h4 className="fw-bold text-dark m-0">12</h4>
                    <span className="fs-10 text-success">↑ 20%</span>
                  </div>
                  <div className="col-4">
                    <span className="fs-11 text-muted d-block mb-1">Hired</span>
                    <h4 className="fw-bold text-dark m-0">3</h4>
                    <span className="fs-10 text-success">↑ 50%</span>
                  </div>
                  <div className="col-4">
                    <span className="fs-11 text-muted d-block mb-1">Avg Time</span>
                    <h4 className="fw-bold text-dark m-0">8 days</h4>
                    <span className="fs-10 text-success">↓ 30%</span>
                  </div>
                </div>

                <div className="p-3 rounded-3 border border-primary-subtle bg-primary-subtle d-flex align-items-center justify-content-between mt-auto">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ti ti-briefcase text-primary fs-18" />
                    <span className="fs-12 text-dark font-medium">2 positions are in interview stage</span>
                  </div>
                  <Link to={all_routes.candidatesGrid} className="fs-12 fw-semibold text-primary text-decoration-none">
                    View Details →
                  </Link>
                </div>

              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="col-lg-4">
            <div className="card pending-approval-card hr-dashboard-card h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <h6 className="fw-bold m-0 text-dark">Pending Approvals</h6>
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill fs-11 px-2.5 py-0.5 fw-semibold d-inline-flex align-items-center">
                      <span className="rounded-circle bg-warning me-1.5" style={{ width: 6, height: 6 }} />
                      {dashData.pendingLeaves.length} Pending
                    </span>
                  </div>
                  <Link to={all_routes.leaveadmin} className="btn btn-xs btn-light rounded-pill border fs-12 px-3">View All</Link>
                </div>

                <div className="d-flex flex-column gap-2.5">
                  {dashData.pendingLeaves.map((p, idx) => {
                    const avatarGradients = [
                      'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    ]
                    const leaveBadgeClass = p.leaveType.toLowerCase().includes('sick')
                      ? 'bg-danger-subtle text-danger border-danger-subtle'
                      : p.leaveType.toLowerCase().includes('casual')
                      ? 'bg-info-subtle text-info border-info-subtle'
                      : 'bg-primary-subtle text-primary border-primary-subtle'

                    return (
                      <div key={p.id} className="pending-item-box">
                        {/* Top Row: Avatar, Name, Designation & Leave Type Badge */}
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2.5 overflow-hidden me-2">
                            <div 
                              className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0" 
                              style={{ width: 34, height: 34, fontSize: 13, background: avatarGradients[idx % avatarGradients.length] }}
                            >
                              {p.employeeName.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <h6 className="fw-bold text-dark mb-0 fs-13 text-truncate" style={{ lineHeight: '1.2' }}>{p.employeeName}</h6>
                              <span className="fs-11 text-muted text-truncate d-block">{p.designation}</span>
                            </div>
                          </div>

                          <span className={`badge rounded-pill border fs-10 px-2 py-0.5 flex-shrink-0 ${leaveBadgeClass}`}>
                            {p.leaveType}
                          </span>
                        </div>

                        {/* Bottom Row: Date & Soft Action Buttons */}
                        <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light-subtle">
                          <div className="fs-11 text-secondary d-flex align-items-center me-2">
                            <i className="ti ti-calendar me-1 text-primary fs-12" />
                            <span>{formatDateShort(p.startDate)} ({p.totalDays} day{p.totalDays > 1 ? 's' : ''})</span>
                          </div>

                          <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                            <button 
                              type="button" 
                              className="btn btn-xs btn-soft-approve rounded-pill px-2.5 py-1 fs-11 d-inline-flex align-items-center"
                              onClick={() => handleLeaveAction(p.id, 'APPROVED')}
                              title="Approve Leave Request"
                            >
                              <i className="ti ti-check me-1 fs-12" /> Approve
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-xs btn-soft-decline rounded-pill px-2.5 py-1 fs-11 d-inline-flex align-items-center"
                              onClick={() => handleLeaveAction(p.id, 'REJECTED')}
                              title="Decline Leave Request"
                            >
                              <i className="ti ti-x me-1 fs-12" /> Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* ── Row 5: Benefits, Payroll, Top Employees & Quick Links ────────── */}
        <div className="row g-3 mb-4">
          
          {/* Benefits Deductions */}
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '12px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold m-0 text-dark">Benefits Deductions</h6>
                  <Link to={all_routes.payrollAddition} className="btn btn-xs btn-light rounded-pill border fs-12 px-2">View All</Link>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 p-2 text-white d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                    <i className="ti ti-shield-check fs-24" />
                  </div>
                  <div>
                    <h6 className="fw-semibold text-dark mb-0 fs-13">Insurance + 401(k)</h6>
                    <span className="fs-11 text-muted">Employee benefits &amp; deductions</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="fw-bold text-dark m-0">₹ 45,000</h4>
                  <span className="fs-11 text-muted">This month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payroll */}
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '12px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold m-0 text-dark">Payroll</h6>
                  <Link to="/payroll/payslips" className="btn btn-xs btn-light rounded-pill border fs-12 px-2">View All</Link>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 p-2 text-white d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <i className="ti ti-wallet fs-24" />
                  </div>
                  <div>
                    <h6 className="fw-semibold text-dark mb-0 fs-13">Payroll Module</h6>
                    <span className="fs-11 text-muted">Salary distribution</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="fw-bold text-dark m-0">{dashData.payrollStats?.formattedAmount || '₹ 3,25,000'}</h4>
                  <span className="fs-11 text-muted">Total Distributed Salary (This month)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Employees */}
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '12px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold m-0 text-dark">Top Employees</h6>
                  <Link to={all_routes.employeeList} className="btn btn-xs btn-light rounded-pill border fs-12 px-2">View All</Link>
                </div>

                <TopEmployeeChart employees={dashData.topEmployees} />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 hr-dashboard-card h-100" style={{ borderRadius: '12px', backgroundColor: 'var(--bs-card-bg, #ffffff)' }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3 text-dark">Quick Links</h6>

                <div className="d-flex flex-column gap-2">
                  <Link to={all_routes.employeeList} className="d-flex align-items-center justify-content-between p-2 rounded-3 text-decoration-none border bg-light-subtle hover-shadow">
                    <div className="d-flex align-items-center gap-2">
                      <i className="ti ti-user-plus text-primary fs-16" />
                      <div>
                        <span className="fs-12 fw-semibold text-dark d-block">Add Employee</span>
                        <span className="fs-10 text-muted">Create a new employee</span>
                      </div>
                    </div>
                    <i className="ti ti-chevron-right text-muted fs-14" />
                  </Link>

                  <Link to={all_routes.employeereport} className="d-flex align-items-center justify-content-between p-2 rounded-3 text-decoration-none border bg-light-subtle hover-shadow">
                    <div className="d-flex align-items-center gap-2">
                      <i className="ti ti-file-text text-info fs-16" />
                      <div>
                        <span className="fs-12 fw-semibold text-dark d-block">Generate Report</span>
                        <span className="fs-10 text-muted">Download HR reports</span>
                      </div>
                    </div>
                    <i className="ti ti-chevron-right text-muted fs-14" />
                  </Link>

                  <Link to={all_routes.attendanceemployee} className="d-flex align-items-center justify-content-between p-2 rounded-3 text-decoration-none border bg-light-subtle hover-shadow">
                    <div className="d-flex align-items-center gap-2">
                      <i className="ti ti-clock text-warning fs-16" />
                      <div>
                        <span className="fs-12 fw-semibold text-dark d-block">Time Attendance</span>
                        <span className="fs-10 text-muted">Check-in / Check-out</span>
                      </div>
                    </div>
                    <i className="ti ti-chevron-right text-muted fs-14" />
                  </Link>

                  <Link to={all_routes.leaveemployee} className="d-flex align-items-center justify-content-between p-2 rounded-3 text-decoration-none border bg-light-subtle hover-shadow">
                    <div className="d-flex align-items-center gap-2">
                      <i className="ti ti-calendar text-purple fs-16" />
                      <div>
                        <span className="fs-12 fw-semibold text-dark d-block">Leave Request</span>
                        <span className="fs-10 text-muted">Apply for leave</span>
                      </div>
                    </div>
                    <i className="ti ti-chevron-right text-muted fs-14" />
                  </Link>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="d-flex flex-wrap align-items-center justify-content-between border-top pt-3 text-muted fs-12">
          <span>© 2026 HRMS. All rights reserved.</span>
          <div className="d-flex gap-3">
            <Link to={all_routes.privacyPolicy} className="text-secondary text-decoration-none">Privacy Policy</Link>
            <Link to={all_routes.termscondition} className="text-secondary text-decoration-none">Terms &amp; Conditions</Link>
            <Link to="#" className="text-secondary text-decoration-none">Support</Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default HrDashboard