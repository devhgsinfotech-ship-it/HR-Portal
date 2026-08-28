import { useState, useEffect } from "react";
import apiClient from "../../../core/utils/apiClient";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { DatePicker } from "antd";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import EmployeeDashboardModal from "./employeeDashboardModal";
import CommonFooter from "@/core/common/commonFooter/footer";
import { APP_CONFIG } from "../../../environment";

const EmployeeDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getFormattedDate = () => {
    const d = currentTime;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getFormattedTimeParts = () => {
    const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const parts = timeString.split(':');
    if (parts.length < 3) return { hhmm: '00:00', ssAmPm: ':00 AM' };
    const hh = parts[0];
    const mm = parts[1];
    const ssWithAmPm = parts[2];
    return { hhmm: `${hh}:${mm}`, ssAmPm: `:${ssWithAmPm}` };
  };

  const { hhmm, ssAmPm } = getFormattedTimeParts();
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const apiUrl = APP_CONFIG.getBackendUrl();

  const fetchData = async () => {
    try {
      const [empRes, statusRes, logsRes, balancesRes, requestsRes] = await Promise.all([
        apiClient.get('/employees/me').catch(() => ({ data: null })),
        apiClient.get('/attendance/today').catch(() => ({ data: null })),
        apiClient.get('/attendance/logs?mine=true').catch(() => ({ data: [] })),
        apiClient.get('/leaves/balances').catch(() => ({ data: [] })),
        apiClient.get('/leaves/requests').catch(() => ({ data: [] }))
      ]);
      setEmployeeData(empRes.data);
      setAttendanceStatus(statusRes.data);
      setAttendanceLogs(logsRes.data || []);
      setLeaveBalances(balancesRes.data || []);
      setLeaveRequests(requestsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePunch = async () => {
    try {
      if (attendanceStatus?.isCheckedIn) {
        await apiClient.post('/attendance/check-out');
      } else {
        await apiClient.post('/attendance/check-in');
      }
      fetchData(); // refresh data
    } catch (error) {
      console.error("Failed to punch in/out:", error);
    }
  };

  const getBalanceForType = (typeKeywords: string[], defaultValue: number) => {
    if (!leaveBalances || !Array.isArray(leaveBalances)) return defaultValue;
    const match = leaveBalances.find(b => 
      typeKeywords.some(keyword => b.leaveTypeName.toLowerCase().includes(keyword.toLowerCase()))
    );
    return match ? match.remainingDays : defaultValue;
  };

  const casualRemaining = getBalanceForType(['casual'], 8);
  const earnedRemaining = getBalanceForType(['earned', 'annual', 'privilege'], 6);
  const medicalRemaining = getBalanceForType(['medical', 'sick'], 6);
  const unpaidRemaining = getBalanceForType(['unpaid', 'loss', 'lop'], 7);

  const renderBalanceRing = (value: number, total: number, progressColor?: string) => {
    const radius = 22;
    const strokeWidth = 3;
    const circumference = 2 * Math.PI * radius;
    const percent = total > 0 ? (value / total) * 100 : 0;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="#EAEEF2"
            strokeWidth={strokeWidth}
          />
          {progressColor && (
            <circle
              cx="30"
              cy="30"
              r={radius}
              fill="none"
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dashoffset 0.35s',
              }}
            />
          )}
        </svg>
        <span className="position-absolute fs-16 fw-bold text-gray-9">{value}</span>
      </div>
    );
  };

  const renderTimeProgressRing = (valueStr: string, valueMs: number, targetMs: number, label: string, color: string) => {
    const radius = 24;
    const strokeWidth = 3.5;
    const circumference = 2 * Math.PI * radius;
    const percent = targetMs > 0 ? Math.min(100, (valueMs / targetMs) * 100) : 0;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-2">
        <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px' }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#EAEEF2"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dashoffset 0.35s',
              }}
            />
          </svg>
          <span className="position-absolute fw-bold text-gray-9" style={{ fontSize: '10px' }}>
            {valueStr.replace(/\s+/g, '')}
          </span>
        </div>
        <span className="d-block text-gray-5 mt-2 fw-semibold text-uppercase text-center" style={{ letterSpacing: '0.03em', fontSize: '9px' }}>
          {label}
        </span>
      </div>
    );
  };


  const getModalContainer = () => {
    const modalElement = document.getElementById('modal-datepicker');
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };
  // Today's Time Calculations

  // Today's Time Calculations
  let totalHoursStr = "00h 00m";
  let productiveHoursStr = "00h 00m";
  let breakHoursStr = "00m 00s";
  let overtimeStr = "00h 00m";
  
  let totalMs = 0;
  let breakMs = 0;
  let prodMs = 0;
  let overMs = 0;

  if (attendanceStatus?.record) {
    const record = attendanceStatus.record;
    
    // Total Hours (Elapsed since checkIn)
    const checkInTime = new Date(record.checkIn).getTime();
    const endTime = record.checkOut ? new Date(record.checkOut).getTime() : Date.now();
    totalMs = Math.max(0, endTime - checkInTime);
    
    const totalH = Math.floor(totalMs / 3600000);
    const totalM = Math.floor((totalMs % 3600000) / 60000);
    totalHoursStr = `${totalH.toString().padStart(2, '0')}h ${totalM.toString().padStart(2, '0')}m`;

    // Break Hours
    if (record.breakIn) {
      const bIn = new Date(record.breakIn).getTime();
      const bOut = record.breakOut ? new Date(record.breakOut).getTime() : Date.now();
      breakMs = Math.max(0, bOut - bIn);
    }
    const breakM = Math.floor(breakMs / 60000);
    const breakS = Math.floor((breakMs % 60000) / 1000);
    breakHoursStr = `${breakM.toString().padStart(2, '0')}m ${breakS.toString().padStart(2, '0')}s`;

    // Productive Hours (Total - Break)
    prodMs = Math.max(0, totalMs - breakMs);
    const prodH = Math.floor(prodMs / 3600000);
    const prodM = Math.floor((prodMs % 3600000) / 60000);
    productiveHoursStr = `${prodH.toString().padStart(2, '0')}h ${prodM.toString().padStart(2, '0')}m`;

    // Overtime (> 8 hours productive)
    const minFullDayMs = 8 * 3600000;
    if (prodMs > minFullDayMs) {
      overMs = prodMs - minFullDayMs;
      const overH = Math.floor(overMs / 3600000);
      const overM = Math.floor((overMs % 3600000) / 60000);
      overtimeStr = `${overH.toString().padStart(2, '0')}h ${overM.toString().padStart(2, '0')}m`;
    }
  }

  const getWeeklyHours = () => {
    if (!attendanceLogs || !Array.isArray(attendanceLogs)) return 0;
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const todayStr = now.toISOString().split('T')[0];

    const weekLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      const logDateStr = logDate.toISOString().split('T')[0];
      return logDate >= startOfWeek && logDateStr !== todayStr;
    });

    const pastSum = weekLogs.reduce((acc, log) => acc + Number(log.workingHours || 0), 0);
    const todayLive = prodMs / 3600000;
    return parseFloat((pastSum + todayLive).toFixed(2));
  };

  const getMonthlyHours = () => {
    if (!attendanceLogs || !Array.isArray(attendanceLogs)) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = now.toISOString().split('T')[0];

    const monthLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      const logDateStr = logDate.toISOString().split('T')[0];
      return logDate >= startOfMonth && logDateStr !== todayStr;
    });

    const pastSum = monthLogs.reduce((acc, log) => acc + Number(log.workingHours || 0), 0);
    const todayLive = prodMs / 3600000;
    return parseFloat((pastSum + todayLive).toFixed(2));
  };

  const getMonthlyOvertime = () => {
    if (!attendanceLogs || !Array.isArray(attendanceLogs)) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStr = now.toISOString().split('T')[0];

    const monthLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      const logDateStr = logDate.toISOString().split('T')[0];
      return logDate >= startOfMonth && logDateStr !== todayStr;
    });

    const pastSum = monthLogs.reduce((acc, log) => {
      const workingHoursNum = Number(log.workingHours || 0);
      const ot = workingHoursNum > 8 ? workingHoursNum - 8 : 0;
      return acc + ot;
    }, 0);

    const todayLiveOt = overMs / 3600000;
    return parseFloat((pastSum + todayLiveOt).toFixed(2));
  };

  const getTodayPercentage = () => {
    const todayVal = parseFloat((totalMs / 3600000).toFixed(2));
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const yesterdayLog = attendanceLogs.find(log => {
      const logDateStr = new Date(log.date || log.checkIn).toISOString().split('T')[0];
      return logDateStr === yesterdayStr;
    });
    
    const yesterdayVal = yesterdayLog ? Number(yesterdayLog.workingHours || 0) : 8.0;
    const diff = todayVal - yesterdayVal;
    const percent = yesterdayVal > 0 ? Math.abs(Math.round((diff / yesterdayVal) * 100)) : 5;
    return { percent: percent || 5, isUp: diff >= 0 };
  };

  const getWeeklyPercentage = () => {
    const thisWeekVal = getWeeklyHours();
    const now = new Date();
    const startOfLastWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
    startOfLastWeek.setDate(diff);
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);

    const lastWeekLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      return logDate >= startOfLastWeek && logDate < endOfLastWeek;
    });

    const lastWeekVal = lastWeekLogs.reduce((acc, log) => acc + Number(log.workingHours || 0), 0);
    const diffVal = thisWeekVal - lastWeekVal;
    const percent = lastWeekVal > 0 ? Math.abs(Math.round((diffVal / lastWeekVal) * 100)) : 7;
    return { percent: percent || 7, isUp: diffVal >= 0 };
  };

  const getMonthlyPercentage = () => {
    const thisMonthVal = getMonthlyHours();
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      return logDate >= startOfLastMonth && logDate < endOfLastMonth;
    });

    const lastMonthVal = lastMonthLogs.reduce((acc, log) => acc + Number(log.workingHours || 0), 0);
    const diffVal = thisMonthVal - lastMonthVal;
    const percent = lastMonthVal > 0 ? Math.abs(Math.round((diffVal / lastMonthVal) * 100)) : 8;
    return { percent: percent || 8, isUp: diffVal >= 0 };
  };

  const getOvertimePercentage = () => {
    const thisMonthOt = getMonthlyOvertime();
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthLogs = attendanceLogs.filter(log => {
      const logDate = new Date(log.date || log.checkIn);
      return logDate >= startOfLastMonth && logDate < endOfLastMonth;
    });

    const lastMonthOt = lastMonthLogs.reduce((acc, log) => {
      const workingHoursNum = Number(log.workingHours || 0);
      const ot = workingHoursNum > 8 ? workingHoursNum - 8 : 0;
      return acc + ot;
    }, 0);

    const diffVal = thisMonthOt - lastMonthOt;
    const percent = lastMonthOt > 0 ? Math.abs(Math.round((diffVal / lastMonthOt) * 100)) : 6;
    return { percent: percent || 6, isUp: diffVal >= 0 };
  };

  const todayPercent = getTodayPercentage();
  const weekPercent = getWeeklyPercentage();
  const monthPercent = getMonthlyPercentage();
  const overPercent = getOvertimePercentage();


  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Employee Dashboard</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Dashboard</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Employee Dashboard
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="input-icon-end position-relative">
                <DatePicker
                  className="form-control datetimepicker mb-0"
                  format={{
                    format: "DD-MM-YYYY",
                    type: "mask",
                  }}
                  getPopupContainer={getModalContainer}
                  placeholder="15-04-2025"
                />
                <span className="input-icon-addon">
                  <i className="ti ti-calendar text-gray-7" />
                </span>
              </div>
              <div className="ms-2 mt-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="alert bg-secondary-transparent alert-dismissible fade show mb-4 d-flex align-items-center justify-content-between gap-2">
            Your Leave Request on “24th April 2024” has been Approved!!!
            <button
              type="button"
              className="btn-close fs-14"
              data-bs-dismiss="alert"
              aria-label="Close"
            >
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="row">
            <div className="col-xxl-4 col-xl-12 d-flex flex-column row-gap-3">
                          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4 text-center">
                  <div className="position-relative d-inline-block mb-3">
                    <span className="avatar avatar-xxl avatar-rounded border border-2 border-white shadow-sm overflow-hidden" style={{ width: '90px', height: '90px', display: 'inline-block' }}>
                      {employeeData?.profilePhotoUrl ? (
                        <img 
                          src={employeeData.profilePhotoUrl.startsWith('http') ? employeeData.profilePhotoUrl : `${apiUrl}${employeeData.profilePhotoUrl}`} 
                          alt="Img" 
                          className="img-fluid rounded-circle" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <ImageWithBasePath src="assets/img/users/user-01.jpg" alt="Img" className="img-fluid rounded-circle" />
                      )}
                    </span>
                    <span className="position-absolute bg-success d-inline-flex align-items-center justify-content-center rounded-circle border border-white border-2" style={{ right: '0px', bottom: '5px', width: '22px', height: '22px' }}>
                      <i className="ti ti-discount-check-filled text-white" style={{ fontSize: '12px' }} />
                    </span>
                  </div>

                  <h5 className="text-gray-9 fw-bold mb-1 fs-18">
                    {employeeData?.firstName ? `${employeeData.firstName} ${employeeData.lastName}` : "Loading..."}
                  </h5>
                  <p className="text-gray-5 fs-13 mb-0 fw-medium">
                    {employeeData?.designation?.name || "N/A"} • {employeeData?.department?.name || "N/A"}
                  </p>

                  <hr className="my-3 border-light-subtle" />

                  <div className="text-start">
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1">
                      <span className="text-gray-5 fs-13">Phone Number</span>
                      <span className="text-gray-9 fw-medium fs-13">{employeeData?.phone || "N/A"}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1">
                      <span className="text-gray-5 fs-13">Email Address</span>
                      <span className="text-gray-9 fw-medium fs-13 text-truncate ms-2" style={{ maxWidth: '180px' }} title={employeeData?.user?.email}>{employeeData?.user?.email || "N/A"}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-1">
                      <span className="text-gray-5 fs-13">Reporting Manager</span>
                      <span className="text-gray-9 fw-medium fs-13">{employeeData?.reportingManager ? `${employeeData.reportingManager.firstName} ${employeeData.reportingManager.lastName}` : "N/A"}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-gray-5 fs-13">Joined on</span>
                      <span className="text-gray-9 fw-medium fs-13">
                        {employeeData?.dateOfJoining ? new Date(employeeData.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

                              <div className="card bg-warning">
                  <div className="card-body d-flex align-items-center justify-content-between p-3">
                    <div>
                      <h5 className="mb-1">Next Holiday</h5>
                      <p className="text-gray-9">Diwali, 15 Sep 2025</p>
                    </div>
                    <Link to={all_routes.holidays} className="btn btn-white btn-md px-3">
                      View All
                    </Link>
                  </div>
                </div>

              <div className="card">
                <div className="card-body p-3">
                  <h6 className="fw-medium text-gray-9 mb-3">On Leave Today</h6>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h4 className="fs-15 text-gray-9 mb-1">Everyone is working today!</h4>
                      <p className="fs-13 text-gray-5 mb-0">No one is on leave today.</p>
                    </div>
                    <div className="empty-leave-illustration" style={{ width: '90px', height: '60px' }}>
                      <svg width="100%" height="100%" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M72 15C65 15 62 23 62 30C62 37 68 45 75 45C82 45 85 37 85 30C85 23 79 15 72 15Z" fill="#F4F6F8" />
                        <path d="M58 20C53 15 45 18 42 25C39 32 43 40 48 42C53 44 61 41 64 34C67 27 63 25 58 20Z" fill="#F4F6F8" />
                        <rect x="38" y="28" width="46" height="26" rx="4" fill="white" stroke="#DDE2E5" strokeWidth="1" />
                        <circle cx="48" cy="41" r="5" fill="#E8F4FD" stroke="#3A9BF2" strokeWidth="1" />
                        <path d="M46.5 41L47.5 42L49.5 40" stroke="#3A9BF2" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="58" y="38" width="20" height="2" rx="1" fill="#A8D0F5" />
                        <rect x="58" y="43" width="16" height="2" rx="1" fill="#A8D0F5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

                            <div className="card border-0" style={{ backgroundColor: '#8F7EC5', borderRadius: '8px' }}>
                <div className="card-body p-3 text-white">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <span className="text-white fs-14 fw-medium">Time Today - {getFormattedDate()}</span>
                    <Link to={all_routes.attendanceemployee} className="text-white text-decoration-underline fs-14 fw-medium">View All</Link>
                  </div>
                  <span className="d-block text-white-50 fs-11 fw-bold tracking-wide mb-1" style={{ letterSpacing: '0.05em' }}>CURRENT TIME</span>
                  <div className="d-flex align-items-end justify-content-between">
                    <div className="d-flex align-items-baseline text-white">
                      <h1 className="display-4 text-white mb-0 fw-normal" style={{ fontSize: '2.5rem', lineHeight: '1' }}>{hhmm}</h1>
                      <span className="fs-14 ms-1" style={{ opacity: 0.85 }}>{ssAmPm}</span>
                    </div>
                    <button onClick={handlePunch} className="btn px-4 py-2 border-0 fw-medium fs-14 rounded-3 text-white" style={{ backgroundColor: attendanceStatus?.isCheckedIn ? '#FF655A' : '#03C95A', transition: 'all 0.2s' }}>
                      {attendanceStatus?.isCheckedIn ? "Clock-out" : "Clock-in"}
                    </button>
                  </div>
                </div>
              </div>


                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <h6 className="fw-medium text-gray-9 mb-4">Time Progress</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      {renderTimeProgressRing(totalHoursStr, totalMs, 9 * 3600000, "Total Working", "#8F9BBA")}
                    </div>
                    <div className="col-6">
                      {renderTimeProgressRing(productiveHoursStr, prodMs, 8 * 3600000, "Productive", "#28C76F")}
                    </div>
                    <div className="col-6">
                      {renderTimeProgressRing(breakHoursStr, breakMs, 1 * 3600000, "Break Hours", "#FF9F43")}
                    </div>
                    <div className="col-6">
                      {renderTimeProgressRing(overtimeStr, overMs, 4 * 3600000, "Overtime", "#3A9BF2")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <h6 className="fw-medium text-gray-9 mb-0">Leave Balances</h6>
                    <div className="text-end">
                      <Link to={all_routes.leaveemployee} className="d-block fs-13 fw-semibold mb-1" style={{ color: '#FE502E' }}>Request Leave</Link>
                      <Link to={all_routes.leaveemployee} className="d-block fs-13 fw-semibold" style={{ color: '#FE502E' }}>View All Balances</Link>
                    </div>
                  </div>
                  
                  <div className="row text-center mb-3">
                    <div className="col-3 px-1">
                      {renderBalanceRing(casualRemaining, 12, '#00A3FF')}
                      <span className="d-block text-gray-5 mt-2 fw-bold text-uppercase" style={{ letterSpacing: '0.02em', fontSize: '9px' }}>Casual Leave</span>
                    </div>
                    <div className="col-3 px-1">
                      {renderBalanceRing(earnedRemaining, 10)}
                      <span className="d-block text-gray-5 mt-2 fw-bold text-uppercase" style={{ letterSpacing: '0.02em', fontSize: '9px' }}>Earned Leave</span>
                    </div>
                    <div className="col-3 px-1">
                      {renderBalanceRing(medicalRemaining, 8)}
                      <span className="d-block text-gray-5 mt-2 fw-bold text-uppercase" style={{ letterSpacing: '0.02em', fontSize: '9px' }}>Medical & Others</span>
                    </div>
                    <div className="col-3 px-1">
                      {renderBalanceRing(unpaidRemaining, 10)}
                      <span className="d-block text-gray-5 mt-2 fw-bold text-uppercase" style={{ letterSpacing: '0.02em', fontSize: '9px' }}>Unpaid Leave</span>
                    </div>
                  </div>
                  
                  <hr className="my-2 border-light-subtle" />
                </div>
              </div>

            </div>
            <div className="col-xxl-8 col-xl-12">
              <div className="row flex-fill">
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-primary mb-2">
                          <i className="ti ti-clock-stop" />
                        </span>
                        <h2 className="mb-2">
                          {(totalMs / 3600000).toFixed(2)} / <span className="fs-20 text-gray-5"> 9</span>
                        </h2>
                        <p className="fw-medium text-truncate">Total Hours Today</p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13">
                          <span className={`avatar avatar-xs rounded-circle bg-${todayPercent.isUp ? 'success' : 'danger'} flex-shrink-0 me-2`}>
                            <i className={`ti ti-arrow-${todayPercent.isUp ? 'up' : 'down'} fs-12`} />
                          </span>
                          <span>{todayPercent.percent}% This Week</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-dark mb-2">
                          <i className="ti ti-clock-up" />
                        </span>
                        <h2 className="mb-2">
                          {getWeeklyHours()} / <span className="fs-20 text-gray-5"> 40</span>
                        </h2>
                        <p className="fw-medium text-truncate">Total Hours Week</p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13">
                          <span className={`avatar avatar-xs rounded-circle bg-${weekPercent.isUp ? 'success' : 'danger'} flex-shrink-0 me-2`}>
                            <i className={`ti ti-arrow-${weekPercent.isUp ? 'up' : 'down'} fs-12`} />
                          </span>
                          <span>{weekPercent.percent}% Last Week</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-info mb-2">
                          <i className="ti ti-calendar-up" />
                        </span>
                        <h2 className="mb-2">
                          {getMonthlyHours()} / <span className="fs-20 text-gray-5"> 98</span>
                        </h2>
                        <p className="fw-medium text-truncate">Total Hours Month</p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13 text-truncate">
                          <span className={`avatar avatar-xs rounded-circle bg-${monthPercent.isUp ? 'success' : 'danger'} flex-shrink-0 me-2`}>
                            <i className={`ti ti-arrow-${monthPercent.isUp ? 'up' : 'down'} fs-12`} />
                          </span>
                          <span>{monthPercent.percent}% Last Month</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-pink mb-2">
                          <i className="ti ti-calendar-star" />
                        </span>
                        <h2 className="mb-2">
                          {getMonthlyOvertime()} / <span className="fs-20 text-gray-5"> 28</span>
                        </h2>
                        <p className="fw-medium text-truncate">
                          Overtime this Month
                        </p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13 text-truncate">
                          <span className={`avatar avatar-xs rounded-circle bg-${overPercent.isUp ? 'success' : 'danger'} flex-shrink-0 me-2`}>
                            <i className={`ti ti-arrow-${overPercent.isUp ? 'up' : 'down'} fs-12`} />
                          </span>
                          <span>{overPercent.percent}% Last Month</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              {/* Right side widgets & posts will go here */}
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
      {/* /Page Wrapper */}
      <EmployeeDashboardModal />
    </>
  );
};

export default EmployeeDashboard;



