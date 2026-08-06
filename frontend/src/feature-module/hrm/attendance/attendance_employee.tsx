import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { AppRootState as RootState } from '../../../core/data/redux/store';
import { all_routes } from '../../../router/all_routes';
import apiClient from '../../../core/utils/apiClient';
import PredefinedDateRanges from '../../../core/common/datePicker';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';

// Define a type for attendance data
interface AttendanceEmployeeData {
  Date: string;
  CheckIn: string;
  Status: string;
  CheckOut: string;
  Break: string;
  Late: string;
  Overtime: string;
  ProductionHours: string;
  key?: number;
}

const AttendanceEmployee = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [employeeProfile, setEmployeeProfile] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [regularizeReason, setRegularizeReason] = useState('');
  const [regularizeIn, setRegularizeIn] = useState('');
  const [regularizeBreakDurationHours, setRegularizeBreakDurationHours] = useState('');
  const [regularizeBreakDurationMins, setRegularizeBreakDurationMins] = useState('');
  const [regularizeOut, setRegularizeOut] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [incompleteYesterday, setIncompleteYesterday] = useState<any>(null);
  const [showIncompletePopup, setShowIncompletePopup] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const res = await apiClient.get('/attendance/today');
      setIsCheckedIn(res.data.isCheckedIn);
      setTodayRecord(res.data.record);
      setEmployeeProfile(res.data.employee);
      // Show incomplete popup if there's an unclosed session from a previous day
      if (res.data.incompleteYesterday) {
        setIncompleteYesterday(res.data.incompleteYesterday);
        setShowIncompletePopup(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [stats, setStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    overtimeMonth: 0,
    todayBreakMinutes: 0,
    todayOvertimeHours: 0,
  });
  const [attendancePolicy, setAttendancePolicy] = useState<any>({ minimumHoursForFullDay: 8, minimumHoursForHalfDay: 4 });

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get('/attendance/logs?mine=true');
      
      let weekHours = 0;
      let monthHours = 0;
      let overtimeMonth = 0;
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);

      const todayDateStr = now.toLocaleDateString();
      let todayBreakMinutes = 0;
      let todayOvertimeHours = 0;

      let todayHours = 0;

      res.data.forEach((rec: any) => {
        const d = new Date(rec.date);
        const hrs = rec.workingHours ? parseFloat(rec.workingHours) : 0;
        const ovt = rec.overtimeHours ? parseFloat(rec.overtimeHours) : 0;

        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            monthHours += hrs;
            overtimeMonth += ovt;
        }
        if (d >= startOfWeek) {
            weekHours += hrs;
        }
        
        if (d.toLocaleDateString() === todayDateStr) {
            todayBreakMinutes = rec.breakMinutes || 0;
            todayOvertimeHours = rec.overtimeHours || 0;
            todayHours = hrs;
        }
      });
      
      setStats({
          todayHours,
          weekHours: parseFloat(weekHours.toFixed(2)),
          monthHours: parseFloat(monthHours.toFixed(2)),
          overtimeMonth: parseFloat(overtimeMonth.toFixed(2)),
          todayBreakMinutes,
          todayOvertimeHours
      });

      const formatHrs = (hrs: any) => {
        if (!hrs) return '0h 0m';
        const h = Math.floor(parseFloat(hrs));
        const m = Math.round((parseFloat(hrs) - h) * 60);
        return `${h}h ${m}m`;
      };

      const mapped = res.data.map((rec: any) => ({
        key: rec.id,
        Date: new Date(rec.date).toLocaleDateString(),
        CheckIn: rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        CheckOut: rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        Status: rec.status,
        Break: rec.breakMinutes ? `${rec.breakMinutes} Min` : '0 Min',
        Late: rec.lateMinutes ? `${rec.lateMinutes} Min` : '0 Min',
        Overtime: formatHrs(rec.overtimeHours),
        ProductionHours: formatHrs(rec.workingHours)
      }));
      setDbLogs(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchLogs();
    // Fetch policy for dynamic denominators
    apiClient.get('/attendance/policy').then(res => setAttendancePolicy(res.data)).catch(() => {});
  }, []);

  const handlePunch = async () => {
    setLoadingAction(true);
    try {
      if (isCheckedIn) {
        await apiClient.post('/attendance/check-out');
      } else {
        await apiClient.post('/attendance/check-in');
      }
      await fetchTodayStatus();
      await fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error executing punch action');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBreak = async () => {
    setLoadingAction(true);
    try {
      if (todayRecord?.breakIn && !todayRecord?.breakOut) {
        await apiClient.post('/attendance/break-out');
      } else {
        await apiClient.post('/attendance/break-in');
      }
      await fetchTodayStatus();
      await fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error executing break action');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRegularizeSubmit = async (e: any) => {
    e.preventDefault();
    if (!selectedRecord) return;

    // Convert datetime-local value (local browser time) → proper UTC ISO string
    // Without this, the backend (UTC Docker) interprets "09:10" as 09:10 UTC instead of 09:10 IST
    const toUTCIso = (localStr: string): string | undefined => {
      if (!localStr) return undefined;
      return new Date(localStr).toISOString(); // Browser Date() respects local timezone → outputs UTC
    };

    setLoadingAction(true);
    try {
      let requestedBreakDuration = undefined;
      if (regularizeBreakDurationHours !== '' || regularizeBreakDurationMins !== '') {
        requestedBreakDuration = (parseInt(regularizeBreakDurationHours || '0') * 60) + parseInt(regularizeBreakDurationMins || '0');
      }

      await apiClient.post('/attendance/regularize', {
        recordId: selectedRecord.key,
        requestedCheckIn: toUTCIso(regularizeIn),
        requestedBreakDuration: requestedBreakDuration,
        requestedCheckOut: toUTCIso(regularizeOut),
        reason: regularizeReason
      });
      alert('Regularization request submitted successfully!');
      setRegularizeReason('');
      setRegularizeIn('');
      setRegularizeBreakDurationHours('');
      setRegularizeBreakDurationMins('');
      setRegularizeOut('');
      const closeBtn = document.getElementById('close-regularize-modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting request');
    } finally {
      setLoadingAction(false);
    }
  };

  // Helper: convert a Date or ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
  const toDatetimeLocal = (dt: any): string => {
    if (!dt) return '';
    const d = new Date(dt);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Opens the regularize modal pre-filled with the incomplete yesterday record
  const handleRegularizeYesterday = () => {
    if (!incompleteYesterday) return;
    setSelectedRecord({ key: incompleteYesterday.id, Date: new Date(incompleteYesterday.date).toLocaleDateString() });
    setRegularizeIn(toDatetimeLocal(incompleteYesterday.checkIn));
    setRegularizeOut(''); // Employee must fill the correct checkout time
    setRegularizeReason('Forgot to punch out / resume from break');
    setShowIncompletePopup(false);
    // Open the existing regularize modal via Bootstrap
    const modal = document.getElementById('regularize_modal');
    if (modal) {
      const bsModal = (window as any).bootstrap?.Modal?.getOrCreateInstance(modal);
      if (bsModal) bsModal.show();
    }
  };

  // ALWAYS use real API data — empty means no records yet (never fall back to fake JSON)
  const data: AttendanceEmployeeData[] = dbLogs;
  const columns = [
    {
      title: "Date",
      dataIndex: "Date",
      sorter: (a: AttendanceEmployeeData, b: AttendanceEmployeeData) => a.Date.length - b.Date.length,
    },
    {
      title: "Check In",
      dataIndex: "CheckIn",
      sorter: (a: AttendanceEmployeeData, b: AttendanceEmployeeData) => a.CheckIn.length - b.CheckIn.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: AttendanceEmployeeData) => {
        let badgeClass = 'badge-danger-transparent';
        if (text === 'PRESENT') badgeClass = 'badge-success-transparent';
        if (text === 'HALF_DAY') badgeClass = 'badge-warning-transparent';
        if (text === 'MISSING_PUNCH' || text === 'IRREGULAR') badgeClass = 'badge-danger-transparent';
        
        return (
          <span className={`badge ${badgeClass} d-inline-flex align-items-center`}>
            <i className="ti ti-point-filled me-1" />
            {text}
          </span>
        );
      },
      sorter: (a: AttendanceEmployeeData, b: AttendanceEmployeeData) => a.Status.length - b.Status.length,
    },
    {
      title: "Check Out",
      dataIndex: "CheckOut",
      sorter: (a: AttendanceEmployeeData, b: AttendanceEmployeeData) => a.CheckOut.length - b.CheckOut.length,
    },
    {
      title: "Break",
      dataIndex: "Break",
      sorter: (a: AttendanceEmployeeData, b: AttendanceEmployeeData) => a.Break.length - b.Break.length,
    },
    {
      title: "Late",
      dataIndex: "Late",
      sorter: (a: AttendanceEmployeeData, b: AttendanceEmployeeData) => a.Late.length - b.Late.length,
    },
    {
      title: "Overtime",
      dataIndex: "Overtime",
      sorter: (a: AttendanceEmployeeData, b: AttendanceEmployeeData) => a.Overtime.length - b.Overtime.length,
    },
    {
      title: "Production Hours",
      dataIndex: "ProductionHours",
      render: (_text: string, record: AttendanceEmployeeData) => (
        <span className={`badge d-inline-flex align-items-center badge-sm ${parseFloat(record.ProductionHours) < 8
          ? 'badge-danger'
          : parseFloat(record.ProductionHours) >= 8 && parseFloat(record.ProductionHours) <= 9
            ? 'badge-success'
            : 'badge-info'
          }`}
        >
          <i className="ti ti-clock-hour-11 me-1"></i>{record.ProductionHours}
        </span>
      ),
      sorter: (a: AttendanceEmployeeData, b: AttendanceEmployeeData) => a.ProductionHours.length - b.ProductionHours.length,
    },
    {
      title: "Action",
      render: (_text: string, record: AttendanceEmployeeData) => (
        (record.Status === 'MISSING_PUNCH' || record.Status === 'IRREGULAR' || record.Status === 'HALF_DAY') ? (
          <button
            className="btn btn-sm btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#regularize_modal"
            onClick={() => setSelectedRecord(record)}
          >
            Regularize
          </button>
        ) : null
      )
    }
  ];

  return (
    <>
      {/* ── INCOMPLETE ATTENDANCE POPUP ────────────────────────────── */}
      {showIncompletePopup && incompleteYesterday && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 440, width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ background: '#fff3cd', borderRadius: 12, padding: '10px 14px', fontSize: 28 }}>⚠️</span>
              <div>
                <h5 style={{ margin: 0, fontWeight: 700, color: '#1a1a2e' }}>Incomplete Attendance</h5>
                <p style={{ margin: 0, color: '#888', fontSize: 13 }}>
                  {new Date(incompleteYesterday.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#555', fontSize: 13 }}>Punch In</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {incompleteYesterday.checkIn ? new Date(incompleteYesterday.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              {incompleteYesterday.breakIn && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#555', fontSize: 13 }}>Break In</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{new Date(incompleteYesterday.breakIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {incompleteYesterday.breakIn && !incompleteYesterday.breakOut && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#555', fontSize: 13 }}>Break Out</span>
                  <span style={{ color: '#dc3545', fontWeight: 600, fontSize: 13 }}>❌ Missing</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#555', fontSize: 13 }}>Punch Out</span>
                <span style={{ color: '#dc3545', fontWeight: 600, fontSize: 13 }}>❌ Missing</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
              You have an incomplete attendance record. Regularize to submit correct times for HR approval, or continue to today's punch-in.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary flex-fill" onClick={handleRegularizeYesterday}>
                <i className="ti ti-edit me-1" />Regularize Yesterday
              </button>
              <button className="btn btn-outline-secondary flex-fill" onClick={() => setShowIncompletePopup(false)}>
                Continue to Today
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Employee Attendance</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Employee Attendance
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={all_routes.attendanceemployee}
                    className="btn btn-icon btn-sm active bg-primary text-white me-1"
                  >
                    <i className="ti ti-brand-days-counter" />
                  </Link>
                  <Link to={all_routes.attendanceadmin} className="btn btn-icon btn-sm">
                    <i className="ti ti-calendar-event" />
                  </Link>
                </div>
              </div>
              <div className="me-2 mb-2">
                <div className="dropdown">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#attendance_report"
                >
                  <i className="ti ti-file-analytics me-2" />
                  Report
                </button>
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="row">
            <div className="col-xl-3 col-lg-4 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="mb-3 text-center">
                    <h6 className="fw-medium text-gray-5 mb-2">
                      {user?.name || 'Employee'}
                    </h6>
                    <h4>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {currentTime.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</h4>
                  </div>
                  <div
                    className="attendance-circle-progress mx-auto mb-3"
                    data-value={65}
                  >
                    <span className="progress-left">
                      <span className="progress-bar border-success" />
                    </span>
                    <span className="progress-right">
                      <span className="progress-bar border-success" />
                    </span>
                    <div className="avatar avatar-xxl avatar-rounded">
                      {employeeProfile?.profilePhotoUrl ? (
                        <ImageWithBasePath src={employeeProfile.profilePhotoUrl} alt="avatar" />
                      ) : (
                        <ImageWithBasePath src="assets/img/profiles/avatar-27.jpg" alt="avatar" />
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="badge badge-md badge-primary mb-3">
                      Production : {todayRecord?.workingHours ? `${todayRecord.workingHours} hrs` : '0.00 hrs'}
                    </div>
                    <h6 className="fw-medium d-flex align-items-center justify-content-center mb-3">
                      <i className="ti ti-fingerprint text-primary me-1" />
                      {todayRecord?.checkIn ? `Punch In at ${new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not Punched In'}
                    </h6>
                    <button
                      type="button"
                      disabled={loadingAction}
                      onClick={handlePunch}
                      className={`btn w-100 mb-2 ${isCheckedIn ? 'btn-danger' : 'btn-success'}`}
                    >
                      {loadingAction ? 'Processing...' : isCheckedIn ? 'Punch Out' : 'Punch In'}
                    </button>
                    {isCheckedIn && (
                      <button
                        type="button"
                        disabled={loadingAction}
                        onClick={handleBreak}
                        className={`btn w-100 ${(todayRecord?.breakIn && !todayRecord?.breakOut) ? 'btn-warning' : 'btn-outline-warning'}`}
                      >
                        {loadingAction ? 'Processing...' : (todayRecord?.breakIn && !todayRecord?.breakOut) ? 'Resume Work' : 'Take a Break'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-9 col-lg-8 d-flex">
              <div className="row flex-fill">
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-2 pb-2">
                        <span className="avatar avatar-sm bg-primary mb-2">
                          <i className="ti ti-clock-stop" />
                        </span>
                        <h2 className="mb-2">
                          {stats.todayHours} / <span className="fs-20 text-gray-5"> {attendancePolicy.minimumHoursForFullDay}</span>
                        </h2>
                        <p className="fw-medium text-truncate">Total Hours Today</p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13">
                          <span className="avatar avatar-xs rounded-circle bg-success flex-shrink-0 me-2">
                            <i className="ti ti-arrow-up fs-12" />
                          </span>
                          <span>-- This Week</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-2 pb-2">
                        <span className="avatar avatar-sm bg-dark mb-2">
                          <i className="ti ti-clock-up" />
                        </span>
                        <h2 className="mb-2">
                          {stats.weekHours} / <span className="fs-20 text-gray-5"> {(parseFloat(attendancePolicy.minimumHoursForFullDay) * 5).toFixed(0)}</span>
                        </h2>
                        <p className="fw-medium text-truncate">Total Hours Week</p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13">
                          <span className="avatar avatar-xs rounded-circle bg-success flex-shrink-0 me-2">
                            <i className="ti ti-arrow-up fs-12" />
                          </span>
                          <span>-- Last Week</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-2 pb-2">
                        <span className="avatar avatar-sm bg-info mb-2">
                          <i className="ti ti-calendar-up" />
                        </span>
                        <h2 className="mb-2">
                          {stats.monthHours} / <span className="fs-20 text-gray-5"> {(parseFloat(attendancePolicy.minimumHoursForFullDay) * 22).toFixed(0)}</span>
                        </h2>
                        <p className="fw-medium text-truncate">Total Hours Month</p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13 text-truncate">
                          <span className="avatar avatar-xs rounded-circle bg-danger flex-shrink-0 me-2">
                            <i className="ti ti-arrow-down fs-12" />
                          </span>
                          <span>-- Last Month</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-2 pb-2">
                        <span className="avatar avatar-sm bg-pink mb-2">
                          <i className="ti ti-calendar-star" />
                        </span>
                        <h2 className="mb-2">
                          {stats.overtimeMonth} / <span className="fs-20 text-gray-5"> {(parseFloat(attendancePolicy.minimumHoursForFullDay) * 22).toFixed(0)}</span>
                        </h2>
                        <p className="fw-medium text-truncate">
                          Overtime this Month
                        </p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13 text-truncate">
                          <span className="avatar avatar-xs rounded-circle bg-danger flex-shrink-0 me-2">
                            <i className="ti ti-arrow-down fs-12" />
                          </span>
                          <span>-- Last Month</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-xl-3">
                          <div className="mb-3">
                            <p className="d-flex align-items-center mb-1">
                              <i className="ti ti-point-filled text-dark-transparent me-1" />
                              Total Working hours
                            </p>
                            <h3>{Math.floor(stats.todayHours)}h {Math.round((stats.todayHours % 1) * 60)}m</h3>
                          </div>
                        </div>
                        <div className="col-xl-3">
                          <div className="mb-3">
                            <p className="d-flex align-items-center mb-1">
                              <i className="ti ti-point-filled text-success me-1" />
                              Productive Hours
                            </p>
                            <h3>{
                              (() => {
                                const safeBreak = Math.max(0, stats.todayBreakMinutes);
                                const productiveMins = Math.max(0, Math.round(stats.todayHours * 60) - safeBreak);
                                return `${Math.floor(productiveMins / 60)}h ${productiveMins % 60}m`;
                              })()
                            }</h3>
                          <p className="text-muted fs-11 mb-0">Total shift time (break excluded)</p>
                          </div>
                        </div>
                        <div className="col-xl-3">
                          <div className="mb-3">
                            <p className="d-flex align-items-center mb-1">
                              <i className="ti ti-point-filled text-warning me-1" />
                              Break hours
                            </p>
                            <h3>{
                              (() => {
                                const bm = Math.max(0, stats.todayBreakMinutes);
                                return `${Math.floor(bm / 60)}h ${bm % 60}m`;
                              })()
                            }</h3>
                          </div>
                        </div>
                        <div className="col-xl-3">
                          <div className="mb-3">
                            <p className="d-flex align-items-center mb-1">
                              <i className="ti ti-point-filled text-info me-1" />
                              Overtime
                            </p>
                            <h3>{Math.floor(stats.todayOvertimeHours)}h {Math.round((stats.todayOvertimeHours % 1) * 60)}m</h3>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-12">
                          <div
                            className="progress bg-transparent-dark mb-3"
                            style={{ height: 24 }}
                          >
                            <div
                              className="progress-bar bg-white rounded"
                              role="progressbar"
                              style={{ width: "18%" }}
                            />
                            <div
                              className="progress-bar bg-success rounded me-2"
                              role="progressbar"
                              style={{ width: "18%" }}
                            />
                            <div
                              className="progress-bar bg-warning rounded me-2"
                              role="progressbar"
                              style={{ width: "5%" }}
                            />
                            <div
                              className="progress-bar bg-success rounded me-2"
                              role="progressbar"
                              style={{ width: "28%" }}
                            />
                            <div
                              className="progress-bar bg-warning rounded me-2"
                              role="progressbar"
                              style={{ width: "17%" }}
                            />
                            <div
                              className="progress-bar bg-success rounded me-2"
                              role="progressbar"
                              style={{ width: "22%" }}
                            />
                            <div
                              className="progress-bar bg-warning rounded me-2"
                              role="progressbar"
                              style={{ width: "5%" }}
                            />
                            <div
                              className="progress-bar bg-info rounded me-2"
                              role="progressbar"
                              style={{ width: "3%" }}
                            />
                            <div
                              className="progress-bar bg-info rounded"
                              role="progressbar"
                              style={{ width: "2%" }}
                            />
                            <div
                              className="progress-bar bg-white rounded"
                              role="progressbar"
                              style={{ width: "18%" }}
                            />
                          </div>
                        </div>
                        <div className="co-md-12">
                          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                            <span className="fs-10">06:00</span>
                            <span className="fs-10">07:00</span>
                            <span className="fs-10">08:00</span>
                            <span className="fs-10">09:00</span>
                            <span className="fs-10">10:00</span>
                            <span className="fs-10">11:00</span>
                            <span className="fs-10">12:00</span>
                            <span className="fs-10">01:00</span>
                            <span className="fs-10">02:00</span>
                            <span className="fs-10">03:00</span>
                            <span className="fs-10">04:00</span>
                            <span className="fs-10">05:00</span>
                            <span className="fs-10">06:00</span>
                            <span className="fs-10">07:00</span>
                            <span className="fs-10">08:00</span>
                            <span className="fs-10">09:00</span>
                            <span className="fs-10">10:00</span>
                            <span className="fs-10">11:00</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Employee Attendance</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-3">
                  <div className="input-icon position-relative">
                    <PredefinedDateRanges />
                  </div>
                </div>
                <div className="dropdown me-3">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Present
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Absent
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Recently Added
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Ascending
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Descending
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Last Month
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Last 7 Days
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <Table dataSource={data} columns={columns} Selection={false} />
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
      {/* Attendance Report */}
      <div className="modal fade" id="attendance_report">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Attendance</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="card shadow-none bg-transparent-light">
                <div className="card-body pb-1">
                  <div className="row">
                    <div className="col-sm-3">
                      <div className="mb-3">
                        <span>Date</span>
                        <p className="text-gray-9 fw-medium">15 Apr 2025</p>
                      </div>
                    </div>
                    <div className="col-sm-3">
                      <div className="mb-3">
                        <span>Punch in at</span>
                        <p className="text-gray-9 fw-medium">09:00 AM</p>
                      </div>
                    </div>
                    <div className="col-sm-3">
                      <div className="mb-3">
                        <span>Punch out at</span>
                        <p className="text-gray-9 fw-medium">06:45 PM</p>
                      </div>
                    </div>
                    <div className="col-sm-3">
                      <div className="mb-3">
                        <span>Status</span>
                        <p className="text-gray-9 fw-medium">Present</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card shadow-none border mb-0">
                <div className="card-body">
                  <div className="row">
                    <div className="col-xl-3">
                      <div className="mb-4">
                        <p className="d-flex align-items-center mb-1">
                          <i className="ti ti-point-filled text-dark-transparent me-1" />
                          Total Working hours
                        </p>
                        <h3>12h 36m</h3>
                      </div>
                    </div>
                    <div className="col-xl-3">
                      <div className="mb-4">
                        <p className="d-flex align-items-center mb-1">
                          <i className="ti ti-point-filled text-success me-1" />
                          Productive Hours
                        </p>
                        <h3>08h 36m</h3>
                      </div>
                    </div>
                    <div className="col-xl-3">
                      <div className="mb-4">
                        <p className="d-flex align-items-center mb-1">
                          <i className="ti ti-point-filled text-warning me-1" />
                          Break hours
                        </p>
                        <h3>22m 15s</h3>
                      </div>
                    </div>
                    <div className="col-xl-3">
                      <div className="mb-4">
                        <p className="d-flex align-items-center mb-1">
                          <i className="ti ti-point-filled text-info me-1" />
                          Overtime
                        </p>
                        <h3>02h 15m</h3>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-8 mx-auto">
                      <div
                        className="progress bg-transparent-dark mb-3"
                        style={{ height: 24 }}
                      >
                        <div
                          className="progress-bar bg-success rounded me-2"
                          role="progressbar"
                          style={{ width: "18%" }}
                        />
                        <div
                          className="progress-bar bg-warning rounded me-2"
                          role="progressbar"
                          style={{ width: "5%" }}
                        />
                        <div
                          className="progress-bar bg-success rounded me-2"
                          role="progressbar"
                          style={{ width: "28%" }}
                        />
                        <div
                          className="progress-bar bg-warning rounded me-2"
                          role="progressbar"
                          style={{ width: "17%" }}
                        />
                        <div
                          className="progress-bar bg-success rounded me-2"
                          role="progressbar"
                          style={{ width: "22%" }}
                        />
                        <div
                          className="progress-bar bg-warning rounded me-2"
                          role="progressbar"
                          style={{ width: "5%" }}
                        />
                        <div
                          className="progress-bar bg-info rounded me-2"
                          role="progressbar"
                          style={{ width: "3%" }}
                        />
                        <div
                          className="progress-bar bg-info rounded"
                          role="progressbar"
                          style={{ width: "2%" }}
                        />
                      </div>
                    </div>
                    <div className="co-md-12">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="fs-10">06:00</span>
                        <span className="fs-10">07:00</span>
                        <span className="fs-10">08:00</span>
                        <span className="fs-10">09:00</span>
                        <span className="fs-10">10:00</span>
                        <span className="fs-10">11:00</span>
                        <span className="fs-10">12:00</span>
                        <span className="fs-10">01:00</span>
                        <span className="fs-10">02:00</span>
                        <span className="fs-10">03:00</span>
                        <span className="fs-10">04:00</span>
                        <span className="fs-10">05:00</span>
                        <span className="fs-10">06:00</span>
                        <span className="fs-10">07:00</span>
                        <span className="fs-10">08:00</span>
                        <span className="fs-10">09:00</span>
                        <span className="fs-10">10:00</span>
                        <span className="fs-10">11:00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Attendance Report */}

      {/* Regularize Modal */}
      <div className="modal fade" id="regularize_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Regularize Attendance</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="close-regularize-modal"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleRegularizeSubmit}>
                <div className="mb-3">
                  <label className="form-label">Requested Check-In Time</label>
                  <input type="datetime-local" className="form-control" value={regularizeIn} onChange={e => setRegularizeIn(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Requested Check-Out Time</label>
                  <input type="datetime-local" className="form-control" value={regularizeOut} onChange={e => setRegularizeOut(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Break Duration (If applicable)</label>
                  <div className="d-flex align-items-center">
                    <input type="number" className="form-control me-2" placeholder="Hours" min="0" value={regularizeBreakDurationHours} onChange={e => setRegularizeBreakDurationHours(e.target.value)} />
                    <input type="number" className="form-control" placeholder="Minutes" min="0" max="59" value={regularizeBreakDurationMins} onChange={e => setRegularizeBreakDurationMins(e.target.value)} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea className="form-control" rows={3} value={regularizeReason} onChange={e => setRegularizeReason(e.target.value)} required placeholder="E.g., Forgot to punch out, system error..."></textarea>
                </div>
                <div className="text-end">
                  <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loadingAction}>
                    {loadingAction ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceEmployee;
