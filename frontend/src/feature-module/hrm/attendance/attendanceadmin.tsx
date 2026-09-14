import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../../core/utils/apiClient';
import { attendance_admin_details } from '../../../core/data/json/attendanceadmin';
import { all_routes } from '../../../router/all_routes';
import PredefinedDateRanges from '../../../core/common/datePicker';
import Table from "../../../core/common/dataTable/index";
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import CommonSelect from '../../../core/common/commonSelect';
import { DatePicker, TimePicker } from 'antd';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';

// Define a type for attendance admin data
interface AttendanceAdminData {
  Employee: string;
  Image: string;
  Role: string;
  Status: string;
  CheckIn: string;
  CheckOut: string;
  Break: string;
  Late: string;
  ProductionHours: string;
}

const AttendanceAdmin = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'requests' | 'policy'>('logs');
  // Determine current user role for scoped view
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('authUser') || '{}'); } catch { return {}; } })();
  const userRole: string = currentUser?.role || '';
  const isManager = userRole === 'MANAGER';
  const pageTitle = isManager ? 'Team Attendance' : 'Admin Attendance';
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [policy, setPolicy] = useState({ minimumHoursForHalfDay: 4, minimumHoursForFullDay: 8, allowWebPunch: true, requireGeofence: false, officeStartTime: '09:00', officeEndTime: '18:00', lateGracePeriod: 15, autoCheckoutTime: '18:00' });
  const [policySaving, setPolicySaving] = useState(false);
  const [policyMsg, setPolicyMsg] = useState('');

  // Dynamic Filter & Search States
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [totalEmployeesCount, setTotalEmployeesCount] = useState<number>(0);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSortBy, setSelectedSortBy] = useState<string>('Last 7 Days');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  // Edit & Report Modal State
  const [reportRecord, setReportRecord] = useState<any>(null);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [editIn, setEditIn] = useState('');
  const [editOut, setEditOut] = useState('');
  const [editBreakMinutes, setEditBreakMinutes] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Helper: convert a Date or ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
  const toDatetimeLocal = (dt: any): string => {
    if (!dt) return '';
    const d = new Date(dt);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleEditSubmit = async (e: any) => {
    e.preventDefault();
    if (!editRecord) return;

    const toUTCIso = (localStr: string): string | undefined => {
      if (!localStr) return undefined;
      return new Date(localStr).toISOString();
    };

    setLoadingAction(true);
    try {
      await apiClient.put(`/attendance/logs/${editRecord.key}`, {
        checkIn: toUTCIso(editIn),
        checkOut: toUTCIso(editOut),
        breakMinutes: parseInt(editBreakMinutes) || 0,
        status: editStatus
      });
      alert('Attendance record updated successfully!');

      const closeBtn = document.getElementById('close-edit-modal');
      if (closeBtn) closeBtn.click();

      fetchLogs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating record');
    } finally {
      setLoadingAction(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get('/attendance/logs');

      const formatHrs = (hrs: any) => {
        if (!hrs) return '0h 0m';
        const h = Math.floor(parseFloat(hrs));
        const m = Math.round((parseFloat(hrs) - h) * 60);
        return `${h}h ${m}m`;
      };

      const mapped = res.data.map((rec: any) => ({
        key: rec.id,
        Employee: `${rec.employee?.firstName || ''} ${rec.employee?.lastName || ''}`.trim() || 'Employee',
        Role: rec.employee?.designation?.name || 'Staff',
        Department: rec.employee?.department?.name || rec.departmentName || 'Operations',
        DepartmentId: rec.employee?.departmentId || rec.employee?.department?.id,
        Image: rec.employee?.profilePhotoUrl ? (rec.employee.profilePhotoUrl.startsWith('/') ? rec.employee.profilePhotoUrl.substring(1) : rec.employee.profilePhotoUrl) : 'user-01.jpg',
        Status: rec.status,
        CheckIn: rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        CheckOut: rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        Break: rec.breakMinutes ? `${rec.breakMinutes} Min` : '0 Min',
        Late: rec.lateMinutes ? `${rec.lateMinutes} Min` : '0 Min',
        Overtime: formatHrs(rec.overtimeHours),
        ProductionHours: formatHrs(rec.workingHours),
        _rawCheckIn: rec.checkIn,
        _rawCheckOut: rec.checkOut,
        _rawBreakMinutes: rec.breakMinutes,
        _rawLateMinutes: rec.lateMinutes || 0,
        _rawDate: rec.date
      }));
      setDbLogs(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get('/departments');
      if (res.data && Array.isArray(res.data)) {
        setDbDepartments(res.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees');
      if (res.data && Array.isArray(res.data)) {
        setTotalEmployeesCount(res.data.length);
      }
    } catch (err) {
      console.error('Error fetching employees count:', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get('/attendance/regularize/requests');

      const mapped = res.data.map((req: any) => ({
        key: req.id,
        Employee: `${req.attendanceRecord.employee.firstName} ${req.attendanceRecord.employee.lastName}`.trim(),
        Image: req.attendanceRecord.employee.profilePhotoUrl ? (req.attendanceRecord.employee.profilePhotoUrl.startsWith('/') ? req.attendanceRecord.employee.profilePhotoUrl.substring(1) : req.attendanceRecord.employee.profilePhotoUrl) : 'user-01.jpg',
        Role: req.attendanceRecord.employee.designation?.name || 'Staff',
        Date: new Date(req.attendanceRecord.date).toLocaleDateString(),
        RequestedIn: req.requestedCheckIn ? new Date(req.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        RequestedBreakOut: req.requestedBreakOut ? new Date(req.requestedBreakOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        RequestedOut: req.requestedCheckOut ? new Date(req.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        Reason: req.reason,
        Status: req.status
      }));
      setRequests(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPolicy = async () => {
    try {
      const res = await apiClient.get('/attendance/policy');
      setPolicy(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const savePolicy = async (e: any) => {
    e.preventDefault();
    setPolicySaving(true);
    setPolicyMsg('');
    try {
      await apiClient.put('/attendance/policy', policy);
      setPolicyMsg('Policy saved successfully!');
    } catch (err: any) {
      setPolicyMsg(err.response?.data?.message || 'Error saving policy');
    } finally {
      setPolicySaving(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchRequests();
    fetchPolicy();
    fetchDepartments();
    fetchEmployees();
  }, []);

  // Compute Dynamic List of Absent Employees for Avatar Toggle Widget (Selected Date / Today)
  const absentEmployeesToday = useMemo(() => {
    const targetDate = selectedDateRange.start ? new Date(selectedDateRange.start) : new Date();
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // Find who checked in on target date
    const checkedInEmpKeys = new Set(
      dbLogs
        .filter(rec => {
          if (!rec._rawDate && !rec._rawCheckIn) return false;
          const d = new Date(rec._rawDate || rec._rawCheckIn);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          return dateStr === targetDateStr && (String(rec.Status).toUpperCase().includes('PRESENT') || String(rec.Status).toUpperCase() === 'ON_TIME');
        })
        .map(rec => rec.Employee)
    );

    // Employees absent on target date
    const absentList = dbLogs.filter(rec => {
      if (!rec._rawDate && !rec._rawCheckIn) return false;
      const d = new Date(rec._rawDate || rec._rawCheckIn);
      const dateStr = d.toISOString().split('T')[0];
      return dateStr === targetDateStr && !checkedInEmpKeys.has(rec.Employee);
    });

    // Deduplicate by employee name
    const uniqueMap = new Map();
    absentList.forEach(rec => {
      if (!uniqueMap.has(rec.Employee)) {
        uniqueMap.set(rec.Employee, rec);
      }
    });

    return Array.from(uniqueMap.values());
  }, [dbLogs, selectedDateRange]);

  // Compute 5 Dynamic Top Stat Counters for the selected target date (Defaults to Today)
  const dynamicStats = useMemo(() => {
    const targetDate = selectedDateRange.start ? new Date(selectedDateRange.start) : new Date();
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Filter logs strictly belonging to Target Date
    const targetLogs = dbLogs.filter(rec => {
      if (!rec._rawDate && !rec._rawCheckIn) return false;
      const d = new Date(rec._rawDate || rec._rawCheckIn);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      return dateStr === targetDateStr;
    });

    let present = 0;
    let lateLogin = 0;
    let uninformed = 0;
    let permission = 0;

    targetLogs.forEach((rec) => {
      const st = String(rec.Status || '').toUpperCase();
      const lateMins = Number(rec._rawLateMinutes || parseFloat(rec.Late) || 0);

      if (st.includes('PRESENT') || st === 'ON_TIME') {
        present++;
      }
      if (lateMins > 0 || st.includes('LATE')) {
        lateLogin++;
      }
      if (st.includes('UNINFORMED') || st.includes('UNEXCUSED')) {
        uninformed++;
      }
      if (st.includes('PERMISSION') || st.includes('HALF') || st === 'HALF_DAY' || st === 'ON_LEAVE') {
        permission++;
      }
    });

    // Total employees absent on target date = Total Company Headcount - Present
    const totalEmp = totalEmployeesCount || (dbLogs.length ? new Set(dbLogs.map(l => l.Employee)).size : 11);
    const absent = Math.max(0, totalEmp - present);

    return { present, lateLogin, uninformed, permission, absent, targetDateStr };
  }, [dbLogs, totalEmployeesCount, selectedDateRange]);

  // Compute Filtered and Sorted Logs dynamically
  const filteredAndSortedLogs = useMemo(() => {
    let result = [...dbLogs];

    // 1. Department Filter
    if (selectedDepartment !== 'All') {
      result = result.filter(rec =>
        String(rec.Department || '').toLowerCase().includes(selectedDepartment.toLowerCase())
      );
    }

    // 2. Status Filter (Strictly matches Today's stat card counts unless custom date range is set)
    if (selectedStatus !== 'All') {
      const sel = selectedStatus.toUpperCase();
      const todayStr = new Date().toISOString().split('T')[0];

      result = result.filter(rec => {
        // If no custom date range is picked, restrict to Today's logs to match Today's stat cards (0 Present -> 0 records)
        const isToday = (() => {
          if (selectedDateRange.start && selectedDateRange.end) return true;
          if (!rec._rawDate && !rec._rawCheckIn) return false;
          const d = new Date(rec._rawDate || rec._rawCheckIn);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dy = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dy}` === todayStr;
        })();

        if (!isToday) return false;

        const st = String(rec.Status || '').toUpperCase();
        const lateMins = Number(rec._rawLateMinutes || parseFloat(rec.Late) || 0);

        if (sel === 'PRESENT') return st.includes('PRESENT') || st === 'ON_TIME';
        if (sel === 'LATE_LOGIN' || sel === 'LATE') return lateMins > 0 || st.includes('LATE');
        if (sel === 'UNINFORMED') return st.includes('UNINFORMED') || st.includes('UNEXCUSED');
        if (sel === 'PERMISSION') return st.includes('PERMISSION') || st.includes('HALF') || st === 'HALF_DAY';
        if (sel === 'ABSENT') return st.includes('ABSENT') || st.includes('MISSING');
        return st.includes(sel);
      });
    }

    // 3. Date Range Filter
    if (selectedDateRange.start && selectedDateRange.end) {
      const start = new Date(selectedDateRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDateRange.end);
      end.setHours(23, 59, 59, 999);

      result = result.filter(rec => {
        if (!rec._rawDate && !rec._rawCheckIn) return true;
        const d = new Date(rec._rawDate || rec._rawCheckIn);
        return d >= start && d <= end;
      });
    }

    // 4. Search Bar Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(rec => {
        const empName = String(rec.Employee || '').toLowerCase();
        const role = String(rec.Role || '').toLowerCase();
        const dept = String(rec.Department || '').toLowerCase();
        const status = String(rec.Status || '').toLowerCase();
        return empName.includes(q) || role.includes(q) || dept.includes(q) || status.includes(q);
      });
    }

    // 5. Sort By Filter
    if (selectedSortBy === 'Last 7 Days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter(rec => {
        if (!rec._rawDate && !rec._rawCheckIn) return true;
        return new Date(rec._rawDate || rec._rawCheckIn) >= sevenDaysAgo;
      });
    } else if (selectedSortBy === 'Last 30 Days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter(rec => {
        if (!rec._rawDate && !rec._rawCheckIn) return true;
        return new Date(rec._rawDate || rec._rawCheckIn) >= thirtyDaysAgo;
      });
    } else if (selectedSortBy === 'Late Login First') {
      result.sort((a, b) => (b._rawLateMinutes || 0) - (a._rawLateMinutes || 0));
    } else if (selectedSortBy === 'Newest First') {
      result.sort((a, b) => new Date(b._rawDate || b._rawCheckIn || 0).getTime() - new Date(a._rawDate || a._rawCheckIn || 0).getTime());
    } else if (selectedSortBy === 'Oldest First') {
      result.sort((a, b) => new Date(a._rawDate || a._rawCheckIn || 0).getTime() - new Date(b._rawDate || b._rawCheckIn || 0).getTime());
    }

    return result;
  }, [dbLogs, selectedDepartment, selectedStatus, selectedDateRange, searchQuery, selectedSortBy]);

  const data: AttendanceAdminData[] = filteredAndSortedLogs; // Dynamic filtered logs
  const columns = [
    {
      title: "Employee",
      dataIndex: "Employee",
      render: (_text: string, record: AttendanceAdminData) => (
        <div className="d-flex align-items-center file-name-icon">
          <span className="avatar avatar-md border avatar-rounded">
            <ImageWithBasePath src={`assets/img/users/${record.Image}`} className="img-fluid" alt={`${record.Employee} Profile`} />
          </span>
          <div className="ms-2">
            <h6 className="fw-medium">{record.Employee}</h6>
            <span className="fs-12 fw-normal ">{record.Role}</span>
          </div>
        </div>
      ),
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) => a.Employee.length - b.Employee.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        let badgeClass = 'badge-danger-transparent';
        let displayText = text;
        const upper = (text || '').toUpperCase().replace(' ', '_');

        if (upper === 'PRESENT') badgeClass = 'badge-success-transparent';
        else if (upper === 'HALF_DAY') badgeClass = 'badge-warning-transparent';
        else if (upper === 'ON_LEAVE') {
          badgeClass = 'badge-warning-transparent';
          displayText = 'ON LEAVE';
        } else if (upper === 'WEEKLY_OFF') {
          badgeClass = 'badge-info-transparent';
          displayText = 'WEEKLY OFF';
        } else if (upper === 'HOLIDAY') {
          badgeClass = 'badge-purple-transparent';
          displayText = 'HOLIDAY';
        } else if (upper === 'ABSENT') {
          badgeClass = 'badge-danger-transparent';
          displayText = 'ABSENT';
        } else if (upper === 'MISSING_PUNCH') {
          badgeClass = 'badge-danger-transparent';
          displayText = 'MISSING PUNCH';
        }

        return (
          <span className={`badge ${badgeClass} d-inline-flex align-items-center`}>
            <i className="ti ti-point-filled me-1" />
            {displayText}
          </span>
        );
      },
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) => a.Status.length - b.Status.length,
    },
    {
      title: "Check In",
      dataIndex: "CheckIn",
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) => a.CheckIn.length - b.CheckIn.length,
    },
    {
      title: "Check Out",
      dataIndex: "CheckOut",
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) => a.CheckOut.length - b.CheckOut.length,
    },
    {
      title: "Break",
      dataIndex: "Break",
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) => a.Break.length - b.Break.length,
    },
    {
      title: "Late",
      dataIndex: "Late",
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) => a.Late.length - b.Late.length,
    },
    {
      title: "Production Hours",
      dataIndex: "ProductionHours",
      render: (_text: string, record: AttendanceAdminData) => (
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
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) => a.ProductionHours.length - b.ProductionHours.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: (_text: string, record: AttendanceAdminData) => (
        <div className="action-icon d-inline-flex">
          <button
            type="button"
            className="me-2 text-primary"
            data-bs-toggle="modal"
            data-bs-target="#attendance_report"
            aria-label="View attendance report"
            title="View Attendance Report Details"
            onClick={() => setReportRecord(record)}
          >
            <i className="ti ti-eye" />
          </button>
          <button
            type="button"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_attendance"
            aria-label="Edit attendance"
            onClick={() => {
              setEditRecord(record);
              const original = (dbLogs as any[]).find((l: any) => l.key === (record as any).key);
              if (original) {
                setEditIn(original._rawCheckIn ? toDatetimeLocal(original._rawCheckIn) : '');
                setEditOut(original._rawCheckOut ? toDatetimeLocal(original._rawCheckOut) : '');
                setEditBreakMinutes(original._rawBreakMinutes?.toString() || '0');
                setEditStatus(original.Status);
              }
            }}
          >
            <i className="ti ti-edit" />
          </button>
        </div>
      ),
    },
  ];

  const handleReviewRequest = async (id: number, status: string) => {
    setLoadingAction(true);
    try {
      await apiClient.put(`/attendance/regularize/${id}`, { status, remarks: '' });
      fetchLogs();
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error reviewing request');
    } finally {
      setLoadingAction(false);
    }
  };

  const requestColumns = [
    {
      title: "Employee",
      dataIndex: "Employee",
      render: (_text: string, record: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <span className="avatar avatar-md border avatar-rounded">
            <ImageWithBasePath src={`assets/img/users/${record.Image}`} className="img-fluid" alt={`${record.Employee} Profile`} />
          </span>
          <div className="ms-2">
            <h6 className="fw-medium">{record.Employee}</h6>
            <span className="fs-12 fw-normal ">{record.Role}</span>
          </div>
        </div>
      )
    },
    { title: "Date", dataIndex: "Date" },
    { title: "Requested In", dataIndex: "RequestedIn" },
    { title: "Req. Break Out", dataIndex: "RequestedBreakOut" },
    { title: "Requested Out", dataIndex: "RequestedOut" },
    { title: "Reason", dataIndex: "Reason" },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span className={`badge ${text === 'APPROVED' ? 'badge-success-transparent' : text === 'REJECTED' ? 'badge-danger-transparent' : 'badge-warning-transparent'} d-inline-flex align-items-center`}>
          <i className="ti ti-point-filled me-1" />
          {text}
        </span>
      )
    },
    {
      title: "Action",
      render: (_text: string, record: any) => (
        record.Status === 'PENDING' ? (
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-success" disabled={loadingAction} onClick={() => handleReviewRequest(record.key, 'APPROVED')}>Approve</button>
            <button className="btn btn-sm btn-danger" disabled={loadingAction} onClick={() => handleReviewRequest(record.key, 'REJECTED')}>Reject</button>
          </div>
        ) : null
      )
    }
  ];

  const statusChoose = [
    { value: "Select", label: "Select" },
    { value: "Present", label: "Present" },
    { value: "Absent", label: "Absent" },
  ];

  const exportToExcel = () => {
    if (!filteredAndSortedLogs || filteredAndSortedLogs.length === 0) {
      alert('No attendance data available to export.');
      return;
    }
    const headers = ["Employee", "Role", "Department", "Status", "Check In", "Check Out", "Break", "Late", "Production Hours"];
    const rows = filteredAndSortedLogs.map(rec => [
      `"${rec.Employee || ''}"`,
      `"${rec.Role || ''}"`,
      `"${rec.Department || ''}"`,
      `"${rec.Status || ''}"`,
      `"${rec.CheckIn || ''}"`,
      `"${rec.CheckOut || ''}"`,
      `"${rec.Break || ''}"`,
      `"${rec.Late || ''}"`,
      `"${rec.ProductionHours || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!filteredAndSortedLogs || filteredAndSortedLogs.length === 0) {
      alert('No attendance data available to export.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Attendance Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { color: #1e293b; margin-bottom: 5px; }
            p { color: #64748b; font-size: 13px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>Attendance Admin Report</h2>
          <p>Generated on ${new Date().toLocaleString()} | Total Records: ${filteredAndSortedLogs.length}</p>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Break</th>
                <th>Late</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAndSortedLogs.map(rec => `
                <tr>
                  <td>${rec.Employee}</td>
                  <td>${rec.Role}</td>
                  <td>${rec.Department}</td>
                  <td>${rec.Status}</td>
                  <td>${rec.CheckIn}</td>
                  <td>${rec.CheckOut}</td>
                  <td>${rec.Break}</td>
                  <td>${rec.Late}</td>
                  <td>${rec.ProductionHours}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Attendance Admin</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Attendance Admin
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={all_routes.attendanceemployee}
                    className="btn btn-icon btn-sm  me-1"
                  >
                    <i className="ti ti-brand-days-counter" />
                  </Link>
                  <Link
                    to={all_routes.attendanceadmin}
                    className="btn btn-icon btn-sm active bg-primary text-white"
                  >
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
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                        onClick={exportToPDF}
                      >
                        <i className="ti ti-file-type-pdf me-1 text-danger" />
                        Export as PDF
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                        onClick={exportToExcel}
                      >
                        <i className="ti ti-file-type-xls me-1 text-success" />
                        Export as Excel
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="card border-0">
            <div className="card-body">
              <div className="row align-items-center mb-4">
                <div className="col-md-7">
                  <div className="mb-3 mb-md-0 d-flex gap-3 flex-wrap">
                    <button
                      className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => setActiveTab('logs')}
                    >
                      <i className="ti ti-list me-1" />Team Logs
                    </button>
                    <button
                      className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-light'}`}
                      onClick={() => setActiveTab('requests')}
                    >
                      <i className="ti ti-clock-edit me-1" />Correction Requests
                      {requests.filter(r => r.Status === 'PENDING').length > 0 &&
                        <span className="badge bg-danger ms-2">{requests.filter(r => r.Status === 'PENDING').length}</span>
                      }
                    </button>
                    {!isManager && (
                      <button
                        className={`btn ${activeTab === 'policy' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => setActiveTab('policy')}
                      >
                        <i className="ti ti-settings me-1" />Attendance Policy
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="row align-items-center mb-4">
                <div className="col-md-5">
                  <div className="mb-3 mb-md-0">
                    <h4 className="mb-1 text-dark fw-bold">{pageTitle}</h4>
                    <p className="text-muted mb-0 fs-13">
                      {isManager
                        ? 'Showing attendance for your direct reports'
                        : `Today Data from the ${totalEmployeesCount || dbLogs.length || 0} total no of employees`}
                    </p>
                  </div>
                </div>
                <div className="col-md-7">
                  <div className="d-flex align-items-center justify-content-md-end">
                    <div
                      className="d-flex align-items-center cursor-pointer bg-light border px-3 py-2 rounded-3"
                      onClick={() => setSelectedStatus(selectedStatus === 'ABSENT' ? 'All' : 'ABSENT')}
                      title="Click to filter Absent employees"
                    >
                      <h6 className="mb-0 text-dark fw-semibold me-3 fs-13">Total Absenties today</h6>
                      <div className="avatar-list-stacked avatar-group-sm d-flex align-items-center">
                        {absentEmployeesToday.length === 0 ? (
                          <span className="badge bg-success-transparent text-success border px-2 py-1 fs-12 ms-1">0 Absent</span>
                        ) : (
                          <>
                            {absentEmployeesToday.slice(0, 4).map((emp, idx) => {
                              const imgSrc = emp.Image && (emp.Image.startsWith('assets/') || emp.Image.startsWith('http'))
                                ? emp.Image
                                : `assets/img/users/${emp.Image || 'user-01.jpg'}`;

                              return (
                                <span className="avatar avatar-rounded border border-2 border-white shadow-xs me-1 overflow-hidden" key={emp.key || idx} title={emp.Employee}>
                                  {imgSrc.startsWith('http') ? (
                                    <img src={imgSrc} className="w-100 h-100 object-fit-cover" alt={emp.Employee} />
                                  ) : (
                                    <ImageWithBasePath src={imgSrc} className="w-100 h-100 object-fit-cover" alt={emp.Employee} />
                                  )}
                                </span>
                              );
                            })}
                            {absentEmployeesToday.length > 0 && (
                              <span className="avatar bg-danger avatar-rounded text-white fs-11 fw-bold ms-1" title={`${absentEmployeesToday.length} Total Absentees`}>
                                +{absentEmployeesToday.length}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border rounded shadow-xs mb-3">
                <div className="row gx-0">
                  {/* Stat Card 1: Present */}
                  <div
                    className={`col-md col-sm-4 border-end cursor-pointer p-3 ${selectedStatus === 'PRESENT' ? 'bg-success-transparent' : ''}`}
                    onClick={() => setSelectedStatus(selectedStatus === 'PRESENT' ? 'All' : 'PRESENT')}
                    title="Click to filter Present employees"
                  >
                    <span className="fw-medium mb-1 d-block text-muted">Present</span>
                    <div className="d-flex align-items-center justify-content-between">
                      <h4 className="fw-bold mb-0 text-success">{dynamicStats.present}</h4>
                      <span className="badge badge-success d-inline-flex align-items-center">
                        <i className="ti ti-check me-1" /> Active
                      </span>
                    </div>
                  </div>

                  {/* Stat Card 2: Late Login */}
                  <div
                    className={`col-md col-sm-4 border-end cursor-pointer p-3 ${selectedStatus === 'LATE_LOGIN' ? 'bg-warning-transparent' : ''}`}
                    onClick={() => setSelectedStatus(selectedStatus === 'LATE_LOGIN' ? 'All' : 'LATE_LOGIN')}
                    title="Click to filter Late Login employees"
                  >
                    <span className="fw-medium mb-1 d-block text-muted">Late Login</span>
                    <div className="d-flex align-items-center justify-content-between">
                      <h4 className="fw-bold mb-0 text-warning">{dynamicStats.lateLogin}</h4>
                      <span className="badge badge-warning d-inline-flex align-items-center">
                        <i className="ti ti-clock me-1" /> Late
                      </span>
                    </div>
                  </div>

                  {/* Stat Card 3: Uninformed */}
                  <div
                    className={`col-md col-sm-4 border-end cursor-pointer p-3 ${selectedStatus === 'UNINFORMED' ? 'bg-danger-transparent' : ''}`}
                    onClick={() => setSelectedStatus(selectedStatus === 'UNINFORMED' ? 'All' : 'UNINFORMED')}
                    title="Click to filter Uninformed absentees"
                  >
                    <span className="fw-medium mb-1 d-block text-muted">Uninformed</span>
                    <div className="d-flex align-items-center justify-content-between">
                      <h4 className="fw-bold mb-0 text-danger">{dynamicStats.uninformed}</h4>
                      <span className="badge badge-danger d-inline-flex align-items-center">
                        <i className="ti ti-alert-circle me-1" /> Notice Off
                      </span>
                    </div>
                  </div>

                  {/* Stat Card 4: Permission */}
                  <div
                    className={`col-md col-sm-4 border-end cursor-pointer p-3 ${selectedStatus === 'PERMISSION' ? 'bg-info-transparent' : ''}`}
                    onClick={() => setSelectedStatus(selectedStatus === 'PERMISSION' ? 'All' : 'PERMISSION')}
                    title="Click to filter Permission / Half-day employees"
                  >
                    <span className="fw-medium mb-1 d-block text-muted">Permission</span>
                    <div className="d-flex align-items-center justify-content-between">
                      <h4 className="fw-bold mb-0 text-info">{dynamicStats.permission}</h4>
                      <span className="badge badge-info d-inline-flex align-items-center">
                        <i className="ti ti-calendar-event me-1" /> Granted
                      </span>
                    </div>
                  </div>

                  {/* Stat Card 5: Absent */}
                  <div
                    className={`col-md col-sm-4 cursor-pointer p-3 ${selectedStatus === 'ABSENT' ? 'bg-danger-transparent' : ''}`}
                    onClick={() => setSelectedStatus(selectedStatus === 'ABSENT' ? 'All' : 'ABSENT')}
                    title="Click to filter Absent employees"
                  >
                    <span className="fw-medium mb-1 d-block text-muted">Absent</span>
                    <div className="d-flex align-items-center justify-content-between">
                      <h4 className="fw-bold mb-0 text-secondary">{dynamicStats.absent}</h4>
                      <span className="badge badge-secondary d-inline-flex align-items-center">
                        <i className="ti ti-user-x me-1" /> Off
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0">Admin Attendance</h5>
                <span className="badge bg-light text-dark border ms-2">
                  Showing {filteredAndSortedLogs.length} of {dbLogs.length} Records
                </span>
              </div>

              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
                {/* Search Bar Input */}
                <div className="input-group input-group-sm" style={{ width: '220px' }}>
                  <span className="input-group-text bg-light border-end-0">
                    <i className="ti ti-search text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search employee, dept..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchQuery('')}>
                      <i className="ti ti-x" />
                    </button>
                  )}
                </div>

                {/* Single Date Day-Wise Track Picker */}
                <div className="d-flex align-items-center gap-1">
                  <span className="fs-12 text-muted fw-semibold me-1">Day Track:</span>
                  <DatePicker
                    placeholder="Pick Single Date"
                    style={{ height: '38px', borderRadius: '5px', width: '150px' }}
                    onChange={(date) => {
                      if (date) {
                        const d = date.toDate();
                        setSelectedDateRange({ start: d, end: d });
                      } else {
                        setSelectedDateRange({ start: null, end: null });
                      }
                    }}
                  />
                </div>

                {/* Range Date Picker */}
                <div className="input-icon position-relative">
                  <DatePicker.RangePicker
                    placeholder={['Start Date', 'End Date']}
                    style={{ height: '38px', borderRadius: '5px' }}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setSelectedDateRange({ start: dates[0].toDate(), end: dates[1].toDate() });
                      } else {
                        setSelectedDateRange({ start: null, end: null });
                      }
                    }}
                  />
                </div>

                {/* Department Dropdown (Dynamic from DB) */}
                <div className="dropdown">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white border d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-building-community me-1 text-primary" />
                    {selectedDepartment === 'All' ? 'Department' : selectedDepartment}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm">
                    <li>
                      <button
                        type="button"
                        className={`dropdown-item rounded-1 ${selectedDepartment === 'All' ? 'active' : ''}`}
                        onClick={() => setSelectedDepartment('All')}
                      >
                        All Departments
                      </button>
                    </li>
                    {dbDepartments.map((d: any) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          className={`dropdown-item rounded-1 ${selectedDepartment === d.name ? 'active' : ''}`}
                          onClick={() => setSelectedDepartment(d.name)}
                        >
                          {d.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Select Status Dropdown (Dynamic Filter) */}
                <div className="dropdown">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white border d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-filter me-1 text-primary" />
                    {selectedStatus === 'All' ? 'Select Status' : selectedStatus.replace('_', ' ')}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm">
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedStatus === 'All' ? 'active' : ''}`} onClick={() => setSelectedStatus('All')}>All Status</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedStatus === 'PRESENT' ? 'active' : ''}`} onClick={() => setSelectedStatus('PRESENT')}>Present</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedStatus === 'LATE_LOGIN' ? 'active' : ''}`} onClick={() => setSelectedStatus('LATE_LOGIN')}>Late Login</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedStatus === 'HALF_DAY' ? 'active' : ''}`} onClick={() => setSelectedStatus('HALF_DAY')}>Half Day</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedStatus === 'ON_LEAVE' ? 'active' : ''}`} onClick={() => setSelectedStatus('ON_LEAVE')}>On Leave</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedStatus === 'WEEKLY_OFF' ? 'active' : ''}`} onClick={() => setSelectedStatus('WEEKLY_OFF')}>Weekly Off</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedStatus === 'HOLIDAY' ? 'active' : ''}`} onClick={() => setSelectedStatus('HOLIDAY')}>Holiday</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedStatus === 'ABSENT' ? 'active' : ''}`} onClick={() => setSelectedStatus('ABSENT')}>Absent</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedStatus === 'MISSING_PUNCH' ? 'active' : ''}`} onClick={() => setSelectedStatus('MISSING_PUNCH')}>Missing Punch</button></li>
                  </ul>
                </div>

                {/* Sort By Dropdown */}
                <div className="dropdown">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white border d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-sort-ascending me-1 text-primary" />
                    Sort By : {selectedSortBy}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm">
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedSortBy === 'Last 7 Days' ? 'active' : ''}`} onClick={() => setSelectedSortBy('Last 7 Days')}>Last 7 Days</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedSortBy === 'Last 30 Days' ? 'active' : ''}`} onClick={() => setSelectedSortBy('Last 30 Days')}>Last 30 Days</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedSortBy === 'Late Login First' ? 'active' : ''}`} onClick={() => setSelectedSortBy('Late Login First')}>Late Login First</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedSortBy === 'Newest First' ? 'active' : ''}`} onClick={() => setSelectedSortBy('Newest First')}>Newest First</button></li>
                    <li><button type="button" className={`dropdown-item rounded-1 ${selectedSortBy === 'Oldest First' ? 'active' : ''}`} onClick={() => setSelectedSortBy('Oldest First')}>Oldest First</button></li>
                  </ul>
                </div>

                {/* Reset Filters button */}
                {(selectedDepartment !== 'All' || selectedStatus !== 'All' || selectedSortBy !== 'Last 7 Days' || searchQuery || selectedDateRange.start) && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    title="Reset all filters"
                    onClick={() => {
                      setSelectedDepartment('All');
                      setSelectedStatus('All');
                      setSelectedSortBy('Last 7 Days');
                      setSearchQuery('');
                      setSelectedDateRange({ start: null, end: null });
                    }}
                  >
                    <i className="ti ti-rotate-clockwise me-1" /> Reset
                  </button>
                )}
              </div>
            </div>
            <div className="card-body p-0">
              {activeTab === "logs" ? (
                <>
                  <Table
                    dataSource={data}
                    columns={columns}
                    Selection={true}
                  />
                </>
              ) : activeTab === "requests" ? (
                <>
                  <div className="p-3">
                    <h4 className="mb-4">Pending Regularization Requests</h4>
                  </div>
                  <Table
                    dataSource={requests}
                    columns={requestColumns}
                    Selection={false}
                  />
                </>
              ) : (
                /* Policy Settings Panel */
                <div className="p-4">
                  <h4 className="mb-1">Attendance Policy Settings</h4>
                  <p className="text-muted mb-4">Configure working hour thresholds. These rules are automatically applied when employees punch out.</p>
                  {policyMsg && (
                    <div className={`alert ${policyMsg.includes('success') ? 'alert-success' : 'alert-danger'} mb-3`}>
                      {policyMsg}
                    </div>
                  )}
                  <form onSubmit={savePolicy}>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="ti ti-clock-half-2 me-1 text-warning" />
                          Minimum Hours for Half Day
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="12"
                          className="form-control"
                          value={policy.minimumHoursForHalfDay}
                          onChange={e => setPolicy(p => ({ ...p, minimumHoursForHalfDay: parseFloat(e.target.value) }))}
                        />
                        <div className="form-text">Employees working at least this many hours get a HALF_DAY mark.</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="ti ti-clock me-1 text-success" />
                          Minimum Hours for Full Day
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="24"
                          className="form-control"
                          value={policy.minimumHoursForFullDay}
                          onChange={e => setPolicy(p => ({ ...p, minimumHoursForFullDay: parseFloat(e.target.value) }))}
                        />
                        <div className="form-text">Employees working at least this many hours get a PRESENT mark.</div>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="ti ti-sunrise me-1 text-primary" />
                          Office Start Time
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          value={policy.officeStartTime}
                          onChange={e => setPolicy(p => ({ ...p, officeStartTime: e.target.value }))}
                        />
                        <div className="form-text">The official start time (e.g. 09:00 AM) to calculate late punch-ins.</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="ti ti-sunset me-1 text-primary" />
                          Office End Time
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          value={policy.officeEndTime}
                          onChange={e => setPolicy(p => ({ ...p, officeEndTime: e.target.value }))}
                        />
                        <div className="form-text">The official end time (e.g. 06:00 PM) to calculate early departures or overtime.</div>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="ti ti-clock-pause me-1 text-danger" />
                          Late Grace Period (Minutes)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="120"
                          value={policy.lateGracePeriod}
                          onChange={e => setPolicy(p => ({ ...p, lateGracePeriod: parseInt(e.target.value) || 0 }))}
                        />
                        <div className="form-text">Employees punching in after Start Time + Grace Period will be marked Late.</div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <i className="ti ti-clock-bolt me-1 text-warning" />
                          Incomplete Attendance Detection Time (IST)
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          value={(policy as any).autoCheckoutTime || '18:00'}
                          onChange={e => setPolicy(p => ({ ...p, autoCheckoutTime: e.target.value }))}
                        />
                        <div className="form-text">If an employee forgets to punch out, the system will flag the session as <strong>Incomplete</strong> at this time and prompt regularization next login.</div>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-12">
                        <label className="form-label fw-semibold">
                          <i className="ti ti-calendar-off me-1 text-danger" />
                          Company Weekly Off Days
                        </label>
                        <div className="d-flex flex-wrap gap-2 pt-1">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                            const raw = (policy as any).weekOffDays;
                            const activeDays = raw 
                              ? (typeof raw === 'string' ? raw.split(',') : raw)
                              : ['Saturday', 'Sunday'];
                            const isOff = activeDays.includes(day);
                            return (
                              <button
                                type="button"
                                key={day}
                                className={`btn btn-xs rounded-pill px-3 py-1.5 ${isOff ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                                onClick={() => {
                                  const updated = isOff
                                    ? activeDays.filter((d: string) => d !== day)
                                    : [...activeDays, day];
                                  setPolicy((p: any) => ({ ...p, weekOffDays: updated.join(',') }));
                                }}
                              >
                                {isOff ? <i className="ti ti-check me-1" /> : null}{day}
                              </button>
                            );
                          })}
                        </div>
                        <div className="form-text">Selected days are marked as official Weekly Off days for company employees.</div>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="allowWebPunch"
                            checked={policy.allowWebPunch}
                            onChange={e => setPolicy(p => ({ ...p, allowWebPunch: e.target.checked }))}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="allowWebPunch">
                            Allow Web Punch (browser check-in)
                          </label>
                        </div>
                        <div className="form-text">Allow employees to punch in/out from the web browser.</div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="requireGeofence"
                            checked={policy.requireGeofence}
                            onChange={e => setPolicy(p => ({ ...p, requireGeofence: e.target.checked }))}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="requireGeofence">
                            Require Geofence (location-based)
                          </label>
                        </div>
                        <div className="form-text">Flag punch-ins from outside the office location for review.</div>
                      </div>
                    </div>

                    <div className="bg-light rounded p-3 mb-4">
                      <h6 className="mb-2">How policy works:</h6>
                      <ul className="mb-0 small text-muted">
                        <li>Worked &lt; <strong>{policy.minimumHoursForHalfDay}h</strong> → Status: <span className="badge badge-danger-transparent">IRREGULAR</span></li>
                        <li>Worked {policy.minimumHoursForHalfDay}h–{policy.minimumHoursForFullDay}h → Status: <span className="badge badge-warning-transparent">HALF_DAY</span></li>
                        <li>Worked ≥ <strong>{policy.minimumHoursForFullDay}h</strong> → Status: <span className="badge badge-success-transparent">PRESENT</span></li>
                        <li>Forgot to punch out → Status: <span className="badge badge-danger-transparent">MISSING_PUNCH</span> (set by nightly CRON)</li>
                      </ul>
                    </div>

                    <button type="submit" className="btn btn-primary px-4" disabled={policySaving}>
                      {policySaving ? 'Saving...' : 'Save Policy'}
                    </button>
                  </form>
                </div>
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
      {/* Edit Attendance */}
      <div className="modal fade" id="edit_attendance">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Attendance</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <p className="text-muted mb-0">Modifying record for <strong>{editRecord?.Employee}</strong> on <strong>{editRecord ? new Date(dbLogs.find((l: any) => l.key === editRecord.key)?._rawDate).toLocaleDateString() : ''}</strong></p>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Check In (Local Time)</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={editIn}
                        onChange={(e) => setEditIn(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Check Out (Local Time)</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={editOut}
                        onChange={(e) => setEditOut(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Break Duration (Minutes)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editBreakMinutes}
                        onChange={(e) => setEditBreakMinutes(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status Override</label>
                      <select
                        className="form-select"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="PRESENT">PRESENT</option>
                        <option value="HALF_DAY">HALF_DAY</option>
                        <option value="IRREGULAR">IRREGULAR</option>
                        <option value="MISSING_PUNCH">MISSING_PUNCH</option>
                        <option value="ABSENT">ABSENT</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                  id="close-edit-modal"
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleEditSubmit} disabled={loadingAction}>
                  {loadingAction ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Attendance */}
      {/* Dynamic Attendance Details & Report Modal */}
      <div className="modal fade" id="attendance_report">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Attendance Details</h4>
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
                  <div className="row align-items-center">
                    <div className="col-lg-4">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar avatar-md border avatar-rounded flex-shrink-0 me-2 overflow-hidden">
                          {reportRecord?.Image?.startsWith('http') ? (
                            <img src={reportRecord.Image} className="w-100 h-100 object-fit-cover" alt="avatar" />
                          ) : (
                            <ImageWithBasePath 
                              src={reportRecord?.Image ? (reportRecord.Image.startsWith('assets/') ? reportRecord.Image : `assets/img/users/${reportRecord.Image}`) : "assets/img/profiles/avatar-02.jpg"} 
                              alt="avatar" 
                            />
                          )}
                        </span>
                        <div>
                          <h6 className="fw-medium mb-0">{reportRecord?.Employee || 'Anthony Lewis'}</h6>
                          <span className="fs-12 text-muted">{reportRecord?.Role || reportRecord?.Department || 'UI/UX Team'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-8">
                      <div className="row">
                        <div className="col-sm-3">
                          <div className="mb-3 text-sm-end">
                            <span className="fs-12 text-muted d-block">Date</span>
                            <p className="text-gray-9 fw-medium mb-0">
                              {reportRecord?._rawDate 
                                ? new Date(reportRecord._rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                                : reportRecord?.Date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="col-sm-3">
                          <div className="mb-3 text-sm-end">
                            <span className="fs-12 text-muted d-block">Punch in at</span>
                            <p className="text-gray-9 fw-medium mb-0">{reportRecord?.CheckIn || '09:00 AM'}</p>
                          </div>
                        </div>
                        <div className="col-sm-3">
                          <div className="mb-3 text-sm-end">
                            <span className="fs-12 text-muted d-block">Punch out at</span>
                            <p className="text-gray-9 fw-medium mb-0">{reportRecord?.CheckOut || '06:45 PM'}</p>
                          </div>
                        </div>
                        <div className="col-sm-3">
                          <div className="mb-3 text-sm-end">
                            <span className="fs-12 text-muted d-block">Status</span>
                            <p className="text-gray-9 fw-medium mb-0">{reportRecord?.Status || 'Present'}</p>
                          </div>
                        </div>
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
                        <p className="d-flex align-items-center mb-1 text-muted fs-13">
                          <i className="ti ti-point-filled text-dark-transparent me-1" />
                          Total Working hours
                        </p>
                        <h3 className="fw-bold">{reportRecord?.ProductionHours || '08h 36m'}</h3>
                      </div>
                    </div>
                    <div className="col-xl-3">
                      <div className="mb-4">
                        <p className="d-flex align-items-center mb-1 text-muted fs-13">
                          <i className="ti ti-point-filled text-success me-1" />
                          Productive Hours
                        </p>
                        <h3 className="fw-bold">{reportRecord?.ProductionHours || '08h 00m'}</h3>
                      </div>
                    </div>
                    <div className="col-xl-3">
                      <div className="mb-4">
                        <p className="d-flex align-items-center mb-1 text-muted fs-13">
                          <i className="ti ti-point-filled text-warning me-1" />
                          Break hours
                        </p>
                        <h3 className="fw-bold">{reportRecord?.Break || '30m 00s'}</h3>
                      </div>
                    </div>
                    <div className="col-xl-3">
                      <div className="mb-4">
                        <p className="d-flex align-items-center mb-1 text-muted fs-13">
                          <i className="ti ti-point-filled text-info me-1" />
                          Overtime
                        </p>
                        <h3 className="fw-bold">{reportRecord?.Overtime || '00h 00m'}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-10 mx-auto">
                      <div
                        className="progress bg-transparent-dark mb-3"
                        style={{ height: 24 }}
                      >
                        <div
                          className="progress-bar bg-success rounded me-2"
                          role="progressbar"
                          style={{ width: "40%" }}
                        />
                        <div
                          className="progress-bar bg-warning rounded me-2"
                          role="progressbar"
                          style={{ width: "10%" }}
                        />
                        <div
                          className="progress-bar bg-success rounded me-2"
                          role="progressbar"
                          style={{ width: "40%" }}
                        />
                        <div
                          className="progress-bar bg-info rounded"
                          role="progressbar"
                          style={{ width: "10%" }}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
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
      {/* /Dynamic Attendance Details & Report Modal */}
    </>
  );
};

export default AttendanceAdmin;
