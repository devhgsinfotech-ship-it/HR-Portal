import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Chart } from "primereact/chart";
import { Calendar } from 'primereact/calendar';
import ProjectModals from "../../../core/modals/projectModal";
import RequestModals from "../../../core/modals/requestModal";
import TodoModal from "../../../core/modals/todoModal";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";
import { useAppSelector } from "../../../core/data/redux/store";

const AdminDashboard = () => {
  const routes = all_routes;
  const { user } = useAppSelector((state) => state.auth);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    totalEmployees: 0,
    pendingLeavesCount: 0,
    fullTimeCount: 0,
    contractCount: 0,
    probationCount: 0,
    wfhCount: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    permissionCount: 0,
    totalAttendanceToday: 0,
    latestEmployees: [],
    totalProjects: 0,
    totalClients: 0,
    totalTasks: 0
  });

  // ── Clock & Attendance state for Admin login display ──
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [clockLoading, setClockLoading] = useState(false);

  // ── Hire & Approve HR Manager State ──
  const [hireHRForm, setHireHRForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    role: 'HR'
  });
  const [isHREmailEdited, setIsHREmailEdited] = useState(false);
  const [hireHRLoading, setHireHRLoading] = useState(false);

  const getAdminDomain = () => {
    if (user?.email && user.email.includes('@')) {
      const d = user.email.split('@')[1];
      if (d && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(d.toLowerCase())) {
        return d.toLowerCase();
      }
    }
    if ((user as any)?.company?.emailDomain) return (user as any).company.emailDomain.toLowerCase();
    if ((user as any)?.company?.name) {
      const clean = (user as any).company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean) return `${clean}.com`;
    }
    return 'hgsinfotech.com';
  };
  const [pendingHRList, setPendingHRList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [selectedHREmp, setSelectedHREmp] = useState<any>(null);
  const [approveHRForm, setApproveHRForm] = useState({
    departmentId: '',
    designationId: '',
    employeeCode: '',
    username: ''
  });
  const [approveLoading, setApproveLoading] = useState(false);

  const fetchPendingHR = async () => {
    try {
      const res = await apiClient.get('/employees/pending-hr-onboarding');
      setPendingHRList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pending HR onboarding:', err);
    }
  };

  const fetchDeptAndDesig = async () => {
    try {
      const [dRes, desRes] = await Promise.all([
        apiClient.get('/departments'),
        apiClient.get('/designations')
      ]);
      setDepartments(dRes.data || []);
      setDesignations(desRes.data || []);
    } catch (err) {
      console.error('Failed to fetch departments/designations:', err);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
    if (user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN') {
      fetchPendingHR();
      fetchDeptAndDesig();
    }
  }, [user]);

  const handleHireHRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hireHRForm.password !== hireHRForm.confirmPassword) {
      alert('Password and Confirm Password do not match');
      return;
    }
    setHireHRLoading(true);
    try {
      const res = await apiClient.post('/employees/hire-hr', {
        firstName: hireHRForm.firstName,
        lastName: hireHRForm.lastName,
        email: hireHRForm.email,
        password: hireHRForm.password,
        role: hireHRForm.role
      });
      alert(res.data.message || 'HR Manager added successfully!');
      setHireHRForm({
        firstName: '',
        lastName: '',
        email: '',
        password: 'Password@123',
        confirmPassword: 'Password@123',
        role: 'HR'
      });
      const btnClose = document.getElementById('close_hire_hr_modal');
      if (btnClose) btnClose.click();
      fetchPendingHR();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to hire HR Manager');
    } finally {
      setHireHRLoading(false);
    }
  };

  const handleOpenApproveModal = (emp: any) => {
    setSelectedHREmp(emp);
    const defaultDept = departments.find((d: any) => d.name.toLowerCase().includes('hr'))?.id || '';
    const defaultDesig = designations.find((d: any) => d.name.toLowerCase().includes('hr'))?.id || '';
    setApproveHRForm({
      departmentId: defaultDept ? String(defaultDept) : (emp.departmentId ? String(emp.departmentId) : ''),
      designationId: defaultDesig ? String(defaultDesig) : (emp.designationId ? String(emp.designationId) : ''),
      employeeCode: emp.employeeCode && !emp.employeeCode.startsWith('PENDING_HR_') ? emp.employeeCode : '',
      username: emp.user?.name || `${emp.firstName} ${emp.lastName}`
    });
  };

  const handleApproveHRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHREmp) return;
    setApproveLoading(true);
    try {
      const res = await apiClient.post(`/employees/${selectedHREmp.id}/approve-onboarding`, approveHRForm);
      alert(res.data.message || 'HR Manager onboarding approved successfully!');
      const btnClose = document.getElementById('close_approve_hr_modal');
      if (btnClose) btnClose.click();
      fetchPendingHR();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve onboarding');
    } finally {
      setApproveLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await apiClient.get('/attendance/today');
      setAttendanceStatus(res.data);
    } catch (error) {
      console.error('Failed to fetch admin attendance status:', error);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const handlePunch = async () => {
    try {
      setClockLoading(true);
      if (attendanceStatus?.isCheckedIn) {
        await apiClient.post('/attendance/check-out');
      } else {
        await apiClient.post('/attendance/check-in');
      }
      await fetchTodayAttendance();
    } catch (error) {
      console.error('Failed to punch in/out:', error);
    } finally {
      setClockLoading(false);
    }
  };

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

  const formatTimeStr = (val: string) => {
    if (!val || val === '—') return '—';
    if (val.includes('T') || val.includes('-')) {
      return new Date(val).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return val;
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const offset = date.getTimezoneOffset();
        const localDateObj = new Date(date.getTime() - (offset * 60 * 1000));
        const formattedDate = localDateObj.toISOString().split('T')[0];
        const res = await apiClient.get(`/dashboard/admin-summary?date=${formattedDate}`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching admin summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [date]);

  const [isTodo, setIsTodo] = useState([false, false, false]);

  //New Chart
  interface ChartSeries {
    name: string;
    data: number[];
  }

  interface EmpDepartmentOptions {
    chart: object;
    fill: object;
    colors: string[];
    grid: object;
    plotOptions: object;
    dataLabels: object;
    series: ChartSeries[];
    xaxis: object;
  }

  interface SalesIncomeOptions {
    chart: object;
    colors: string[];
    responsive: object[];
    plotOptions: object;
    series: ChartSeries[];
    xaxis: object;
    yaxis: object;
    grid: object;
    legend: object;
    dataLabels: object;
    fill: object;
  }

  const [empDepartment] = useState<EmpDepartmentOptions>({
    chart: {
      height: 235,
      type: 'bar',
      padding: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      },
      toolbar: {
        show: false,
      }
    },
    fill: {
      colors: ['#F26522'], // Fill color for the bars
      opacity: 1, // Adjust opacity (1 is fully opaque)
    },
    colors: ['#F26522'],
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 5,
      padding: {
        top: -20,
        left: 0,
        right: 0,
        bottom: 0
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        horizontal: true,
        barHeight: '35%',
        endingShape: 'rounded'
      }
    },
    dataLabels: {
      enabled: false
    },
    series: [{
      data: [80, 110, 80, 20, 60, 100],
      name: 'Employee'
    }],
    xaxis: {
      categories: ['UI/UX', 'Development', 'Management', 'HR', 'Testing', 'Marketing'],
      labels: {
        style: {
          colors: '#111827',
          fontSize: '13px',
        }
      }
    }
  })

  const [salesIncome] = useState<SalesIncomeOptions>({
    chart: {
      height: 290,
      type: "bar",
      stacked: true,
      toolbar: { show: false },
    },
    colors: ["#FF6F28", "#F8F9FA"], // Income / Expenses colors
    plotOptions: {
      bar: {
        columnWidth: "40%",
        borderRadius: 5,
        borderRadiusWhenStacked: "all",
        borderRadiusApplication: "around",
        horizontal: false,
        endingShape: "rounded",
      },
    },
    series: [
      {
        name: "Income",
        data: [40, 30, 45, 80, 85, 90, 80, 80, 80, 85, 20, 80],
      },
      {
        name: "Expenses",
        data: [60, 70, 55, 20, 15, 10, 20, 20, 20, 15, 80, 20],
      },
    ],
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    yaxis: {
      labels: {
        offsetX: -15,
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,
      padding: { left: -8 },
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    fill: { opacity: 1 },
    // @ts-expect-error: 'tooltip' is not present in type definition but supported by ApexCharts at runtime
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      theme: "dark",
      custom: ({
        series,
        dataPointIndex,
      }: {
        series: number[][],
        dataPointIndex: number
      }) => {
        const incomeStr = "$" + Math.round(series[0][dataPointIndex]) + "K";
        const expensesStr = "$" + Math.round(series[1][dataPointIndex]) + "K";

        return `
          <div style="background:#1F2937; color:#ffffff; padding:10px 14px; border-radius:8px; font-size:13.5px; box-shadow:0 6px 16px rgba(0,0,0,0.4); min-width:165px; line-height:1.5; font-family:inherit;">
            <div style="font-weight:600; margin-bottom:6px; display:flex; justify-content:space-between;">
              <span>Income</span><span>${incomeStr}</span>
            </div>
            <div style="font-weight:600; display:flex; justify-content:space-between;">
              <span>Expenses</span><span>${expensesStr}</span>
            </div>
          </div>
        `;
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
  });

  //Attendance ChartJs
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});
  useEffect(() => {
    const chartVal = {
      labels: ['Late', 'Present', 'Permission', 'Absent'],
      datasets: [
        {
          label: 'Semi Donut',
          data: [data.lateCount, data.presentCount, data.permissionCount, data.absentCount],
          backgroundColor: ['#0C4B5E', '#03C95A', '#FFC107', '#E70D0D'],
          borderWidth: 5,
          borderRadius: 10,
          borderColor: '#fff', // Border between segments
          hoverBorderWidth: 0,   // Border radius for curved edges
          cutout: '60%',
        }
      ]
    };
    const options = {
      rotation: -100,
      circumference: 200,
      layout: {
        padding: {
          top: -20,    // Set to 0 to remove top padding
          bottom: -20, // Set to 0 to remove bottom padding
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Hide the legend
        }
      },
    };

    setChartData(chartVal);
    setChartOptions(options);
  }, [data]);

  //Semi Donut ChartJs
  const [semidonutData, setSemidonutData] = useState({});
  const [semidonutOptions, setSemidonutOptions] = useState({});
  const toggleTodo = (index: number) => {
    setIsTodo((prevIsTodo) => {
      const newIsTodo = [...prevIsTodo];
      newIsTodo[index] = !newIsTodo[index];
      return newIsTodo;
    });
  };

  useEffect(() => {

    const data = {
      labels: ["Ongoing", "Onhold", "Completed", "Overdue"],
      datasets: [
        {
          label: 'Semi Donut',
          data: [20, 40, 20, 10],
          backgroundColor: ['#FFC107', '#1B84FF', '#03C95A', '#E70D0D'],
          borderWidth: -10,
          borderColor: 'transparent', // Border between segments
          hoverBorderWidth: 0,   // Border radius for curved edges
          cutout: '75%',
          spacing: -30,
        },
      ],
    };

    const options = {
      rotation: -90,
      circumference: 185,
      layout: {
        padding: {
          top: -20,    // Set to 0 to remove top padding
          bottom: 20, // Set to 0 to remove bottom padding
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Hide the legend
        }
      }, elements: {
        arc: {
          borderWidth: -30, // Ensure consistent overlap
          borderRadius: 30, // Add some rounding
        }
      },
    };

    setSemidonutData(data);
    setSemidonutOptions(options);
  }, []);




  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Admin Dashboard</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Dashboard</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Admin Dashboard
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
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
              <div className="mb-2">
                <div className="input-icon position-relative month-year-calendar">
                  <span className="input-icon-addon">
                    <i className="ti ti-calendar text-gray-9" />
                  </span>
                  <Calendar value={date} onChange={(e: any) => setDate(e.value)} view="month" dateFormat="M yy" className="Calendar-form" />
                </div>
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Welcome Wrap */}
          <div className="card border-0">
            <div className="card-body d-flex align-items-center justify-content-between flex-wrap pb-1">
              <div className="d-flex align-items-center mb-3">
                <span className="avatar avatar-xl flex-shrink-0 overflow-hidden">
                  {user?.profilePhotoUrl ? (
                    <img
                      src={user.profilePhotoUrl.startsWith('http') ? user.profilePhotoUrl : `${apiClient.defaults.baseURL}${user.profilePhotoUrl}`}
                      alt="img"
                      className="img-fluid rounded-circle"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = "assets/img/profiles/avatar-31.jpg";
                      }}
                    />
                  ) : (
                    <ImageWithBasePath
                      src="assets/img/profiles/avatar-31.jpg"
                      className="rounded-circle"
                      alt="img"
                    />
                  )}
                </span>
                <div className="ms-3">
                  <h3 className="mb-2">
                    Welcome Back, {user?.name || 'Admin'}{" "}
                    <Link to="#" className="edit-icon">
                      <i className="ti ti-edit fs-14" />
                    </Link>
                  </h3>
                  <p>
                    You have{" "}
                    <span className="text-primary text-decoration-underline">
                      {loading ? '—' : data.pendingLeavesCount}
                    </span>{" "}
                    Pending Approvals &amp;{" "}
                    <span className="text-primary text-decoration-underline">
                      {loading ? '—' : data.pendingLeavesCount}
                    </span>{" "}
                    Leave Requests
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-center flex-wrap mb-1">
                {/* ── Clock In / Clock Out Widget (Only for HR, Manager, Employees - Not for Company Admin/Super Admin) ── */}
                {!(user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <div className="card border-0 shadow-sm text-start me-3 mb-2" style={{ backgroundColor: '#162E5B', borderRadius: '12px', minWidth: '320px' }}>
                    <div className="card-body p-3 text-white">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-white fs-13 fw-medium">Time Today - {getFormattedDate()}</span>
                        <Link to={all_routes.attendanceemployee} className="text-white text-decoration-underline fs-12 fw-medium">View All</Link>
                      </div>
                      <span className="d-block text-white-50 fs-11 fw-bold tracking-wide mb-1" style={{ letterSpacing: '0.05em' }}>CURRENT TIME</span>
                      <div className="d-flex align-items-end justify-content-between">
                        <div className="d-flex align-items-baseline text-white me-3">
                          <h1 className="display-4 text-white mb-0 fw-normal" style={{ fontSize: '2rem', lineHeight: '1' }}>{hhmm}</h1>
                          <span className="fs-13 ms-1" style={{ opacity: 0.85 }}>{ssAmPm}</span>
                        </div>
                        {attendanceStatus?.isNotApplicable ? (
                          <span className="badge bg-white-transparent text-white px-3 py-2 fs-12 fw-medium border border-white-50 rounded-3">
                            <i className="ti ti-shield-check me-1" /> Admin Account (No Punch Req.)
                          </span>
                        ) : (
                          <button 
                            onClick={handlePunch} 
                            disabled={clockLoading}
                            className="btn px-3 py-2 border-0 fw-medium fs-13 rounded-3 text-white shadow-sm" 
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
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <button
                    type="button"
                    className="btn btn-outline-primary me-2 mb-2 fw-medium shadow-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#hire_hr_manager_modal"
                  >
                    <i className="ti ti-user-plus me-1" />
                    Add / Hire HR Manager
                  </button>
                )}

                <Link
                  to="#"
                  className="btn btn-white me-2 mb-2"
                  data-bs-toggle="modal"
                  data-bs-target="#add_project"
                >
                  <i className="ti ti-calendar-cog me-1" />
                  Add Schedule
                </Link>
                <Link
                  to="#"
                  className="btn btn-primary mb-2"
                  data-bs-toggle="modal"
                  data-bs-target="#add_leaves"
                >
                  <i className="ti ti-square-rounded-plus me-1" />
                  Add Requests
                </Link>
              </div>
            </div>
          </div>
          {/* /Welcome Wrap */}

          {/* Pending HR Manager Approvals (Only for Company Admin) */}
          {(user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN') && pendingHRList.length > 0 && (
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px', borderLeft: '4px solid #F26522' }}>
              <div className="card-header bg-transparent d-flex align-items-center justify-content-between py-3">
                <h5 className="mb-0 text-dark fw-bold">
                  <i className="ti ti-user-check text-primary me-2 fs-18" />
                  Pending HR Manager Onboarding Approvals ({pendingHRList.length})
                </h5>
                <span className="badge bg-warning-transparent text-warning px-3 py-2 fs-12">Needs Approval</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Candidate Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Date of Joining</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingHRList.map((emp) => (
                        <tr key={emp.id}>
                          <td className="fw-semibold">{emp.firstName} {emp.lastName}</td>
                          <td>{emp.user?.email || emp.email || '—'}</td>
                          <td>{emp.phone || '—'}</td>
                          <td>{emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '—'}</td>
                          <td>
                            <span className={`badge ${emp.onboardingStatus === 'DOCS_SUBMITTED' ? 'bg-success-transparent text-success' : 'bg-info-transparent text-info'}`}>
                              {emp.onboardingStatus === 'DOCS_SUBMITTED' ? 'Completed Onboarding' : emp.onboardingStatus}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary px-3"
                              data-bs-toggle="modal"
                              data-bs-target="#approve_hr_manager_modal"
                              onClick={() => handleOpenApproveModal(emp)}
                            >
                              <i className="ti ti-check me-1" /> Approve &amp; Assign Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Company Admin Quick Control Panel */}
          {(user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'HR') && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm bg-light-subtle" style={{ borderRadius: '12px' }}>
                  <div className="card-body p-3">
                    <div className="d-md-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h5 className="mb-1 text-dark fw-bold">
                          <i className="ti ti-building-cog me-2 text-primary fs-20" />
                          Company &amp; Workspace Management
                        </h5>
                        <p className="text-muted mb-0 fs-13">Quick shortcuts to manage your tenant settings, custom roles, employee permissions, and workspace.</p>
                      </div>
                      <span className="badge bg-primary-transparent text-primary px-3 py-2 rounded-pill fs-12 fw-medium mt-2 mt-md-0">
                        Role: {user?.role === 'COMPANY_ADMIN' ? 'Company Admin (Owner)' : user?.role}
                      </span>
                    </div>

                    <div className="row g-3">
                      <div className="col-xl-3 col-md-6">
                        <Link to="/company-settings" className="card border hover-shadow text-decoration-none transition-all h-100 mb-0">
                          <div className="card-body p-3 d-flex align-items-center">
                            <div className="avatar avatar-md bg-primary-transparent rounded-circle me-3 flex-shrink-0">
                              <i className="ti ti-building-store fs-18 text-primary" />
                            </div>
                            <div>
                              <h6 className="mb-1 text-dark fw-semibold">Company Settings</h6>
                              <span className="fs-12 text-muted">Manage logo, address &amp; details</span>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col-xl-3 col-md-6">
                        <Link to={all_routes.rolePermission} className="card border hover-shadow text-decoration-none transition-all h-100 mb-0">
                          <div className="card-body p-3 d-flex align-items-center">
                            <div className="avatar avatar-md bg-success-transparent rounded-circle me-3 flex-shrink-0">
                              <i className="ti ti-shield-lock fs-18 text-success" />
                            </div>
                            <div>
                              <h6 className="mb-1 text-dark fw-semibold">Roles &amp; Permissions</h6>
                              <span className="fs-12 text-muted">Manage 8 auto-seeded roles &amp; permissions</span>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col-xl-3 col-md-6">
                        <Link to={all_routes.employeeList} className="card border hover-shadow text-decoration-none transition-all h-100 mb-0">
                          <div className="card-body p-3 d-flex align-items-center">
                            <div className="avatar avatar-md bg-info-transparent rounded-circle me-3 flex-shrink-0">
                              <i className="ti ti-users-group fs-18 text-info" />
                            </div>
                            <div>
                              <h6 className="mb-1 text-dark fw-semibold">Employee Directory</h6>
                              <span className="fs-12 text-muted">Invite users, assign roles &amp; onboarding</span>
                            </div>
                          </div>
                        </Link>
                      </div>

                      <div className="col-xl-3 col-md-6">
                        <Link to={all_routes.profilesettings} className="card border hover-shadow text-decoration-none transition-all h-100 mb-0">
                          <div className="card-body p-3 d-flex align-items-center">
                            <div className="avatar avatar-md bg-warning-transparent rounded-circle me-3 flex-shrink-0">
                              <i className="ti ti-settings-automation fs-18 text-warning" />
                            </div>
                            <div>
                              <h6 className="mb-1 text-dark fw-semibold">Workspace Settings</h6>
                              <span className="fs-12 text-muted">Security, preferences &amp; notifications</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="row">
            {/* Widget Info */}
            <div className="col-xxl-8 d-flex">
              <div className="row flex-fill">
                <div className="col-md-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-primary mb-2">
                        <i className="ti ti-calendar-share fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Attendance Overview
                      </h6>
                      <h3 className="mb-3">
                        {loading ? '—' : `${data.totalAttendanceToday}/${data.totalEmployees}`}
                      </h3>
                      <Link to={all_routes.attendanceemployee} className="link-default">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-secondary mb-2">
                        <i className="ti ti-browser fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Total No of Projects
                      </h6>
                      <h3 className="mb-3">{loading ? '—' : data.totalProjects || 0}</h3>
                      <Link to={all_routes.project} className="link-default">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-info mb-2">
                        <i className="ti ti-users-group fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Total No of Clients
                      </h6>
                      <h3 className="mb-3">{loading ? '—' : data.totalClients || 0}</h3>
                      <Link to={all_routes.clientlist} className="link-default">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-pink mb-2">
                        <i className="ti ti-checklist fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Total No of Tasks
                      </h6>
                      <h3 className="mb-3">{loading ? '—' : data.totalTasks || 0}</h3>
                      <Link to={all_routes.tasks} className="link-default">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-purple mb-2">
                        <i className="ti ti-moneybag fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Earnings
                      </h6>
                      <h3 className="mb-3">$21,445</h3>
                      <Link to={all_routes.expenses} className="link-default">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-danger mb-2">
                        <i className="ti ti-browser fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Profit This Week
                      </h6>
                      <h3 className="mb-3">$5,544</h3>
                      <Link to={all_routes.superAdminPurchaseTransaction} className="link-default">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-success mb-2">
                        <i className="ti ti-users-group fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        Job Applicants
                      </h6>
                      <h3 className="mb-3">98</h3>
                      <Link to={all_routes.joblist} className="link-default">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <span className="avatar rounded-circle bg-dark mb-2">
                        <i className="ti ti-user-star fs-16" />
                      </span>
                      <h6 className="fs-13 fw-medium text-default mb-1">
                        New Hire
                      </h6>
                      <h3 className="mb-3">
                        {loading ? '—' : `${data.newHiresCount}/${data.totalEmployees}`}
                      </h3>
                      <Link to={all_routes.candidateslist} className="link-default">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Widget Info */}
            {/* Employees By Department */}
            <div className="col-xxl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Employees By Department</h5>
                  <div className="dropdown mb-2">
                    <Link
                      to="#"
                      className="btn btn-white border btn-md d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-calendar me-1" />
                      This Week
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          This Month
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          This Week
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          Last Week
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <ReactApexChart
                    id="emp-department"
                    options={empDepartment}
                    series={empDepartment.series}
                    type="bar"
                    height={220}
                  />
                  <p className="fs-13">
                    <i className="ti ti-circle-filled me-2 fs-8 text-primary" />
                    No of Employees increased by{" "}
                    <span className="text-success fw-bold">+20%</span> from last
                    Week
                  </p>
                </div>
              </div>
            </div>
            {/* /Employees By Department */}
          </div>
          <div className="row">
            {/* Total Employee */}
            <div className="col-xxl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Employee Status</h5>
                  <div className="dropdown mb-2">
                    <Link
                      to="#"
                      className="btn btn-white border btn-md d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-calendar me-1" />
                      This Week
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          This Month
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          This Week
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          Today
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <p className="fs-13 mb-3">Total Employee</p>
                    <h3 className="mb-3">{loading ? '—' : data.totalEmployees}</h3>
                  </div>
                  <div className="progress-stacked emp-stack mb-3">
                    <div
                      className="progress"
                      role="progressbar"
                      style={{ width: `${loading ? 25 : (data.totalEmployees ? Math.round((data.fullTimeCount / data.totalEmployees) * 100) : 0)}%` }}
                    >
                      <div className="progress-bar bg-warning" />
                    </div>
                    <div
                      className="progress"
                      role="progressbar"
                      style={{ width: `${loading ? 25 : (data.totalEmployees ? Math.round((data.contractCount / data.totalEmployees) * 100) : 0)}%` }}
                    >
                      <div className="progress-bar bg-secondary" />
                    </div>
                    <div
                      className="progress"
                      role="progressbar"
                      style={{ width: `${loading ? 25 : (data.totalEmployees ? Math.round((data.probationCount / data.totalEmployees) * 100) : 0)}%` }}
                    >
                      <div className="progress-bar bg-danger" />
                    </div>
                    <div
                      className="progress"
                      role="progressbar"
                      style={{ width: `${loading ? 25 : (data.totalEmployees ? Math.round((data.wfhCount / data.totalEmployees) * 100) : 0)}%` }}
                    >
                      <div className="progress-bar bg-pink" />
                    </div>
                  </div>
                  <div className="border mb-3">
                    <div className="row gx-0">
                      <div className="col-6">
                        <div className="p-2 flex-fill border-end border-bottom">
                          <p className="fs-13 mb-2">
                            <i className="ti ti-square-rounded-filled text-primary fs-12 me-2" />
                            Fulltime <span className="text-gray-9">({loading ? '—' : (data.totalEmployees ? Math.round((data.fullTimeCount / data.totalEmployees) * 100) : 0)}%)</span>
                          </p>
                          <h2 className="fs-40 fw-bold">{loading ? '—' : data.fullTimeCount}</h2>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 flex-fill border-bottom text-end">
                          <p className="fs-13 mb-2">
                            <i className="ti ti-square-rounded0filled me-2 text-secondary fs-12" />
                            Contract <span className="text-gray-9">({loading ? '—' : (data.totalEmployees ? Math.round((data.contractCount / data.totalEmployees) * 100) : 0)}%)</span>
                          </p>
                          <h2 className="fs-40 fw-bold">{loading ? '—' : data.contractCount}</h2>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 flex-fill border-end">
                          <p className="fs-13 mb-2">
                            <i className="ti ti-square-rounded-filled me-2 text-danger fs-12" />
                            Probation <span className="text-gray-9">({loading ? '—' : (data.totalEmployees ? Math.round((data.probationCount / data.totalEmployees) * 100) : 0)}%)</span>
                          </p>
                          <h2 className="fs-40 fw-bold">{loading ? '—' : data.probationCount}</h2>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 flex-fill text-end">
                          <p className="fs-13 mb-2">
                            <i className="ti ti-square-rounded-filled text-pink me-2 fs-12" />
                            WFH <span className="text-gray-9">({loading ? '—' : (data.totalEmployees ? Math.round((data.wfhCount / data.totalEmployees) * 100) : 0)}%)</span>
                          </p>
                          <h2 className="fs-40 fw-bold">{loading ? '—' : data.wfhCount}</h2>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h6 className="mb-2">Top Performer</h6>
                  <div className="p-2 d-flex align-items-center justify-content-between border border-primary bg-primary-100 br-5 mb-4 perfomer-card">
                    <div className="d-flex align-items-center overflow-hidden">
                      <span className="me-2">
                        <i className="ti ti-award-filled text-primary fs-24" />
                      </span>
                      <Link
                        to={all_routes.employeedetails}
                        className="avatar avatar-md me-2"
                      >
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-24.jpg"
                          className="rounded-circle border border-white"
                          alt="img"
                        />
                      </Link>
                      <div>
                        <h6 className="text-truncate mb-1 fs-14 fw-medium">
                          <Link to={all_routes.employeedetails}>Daniel Esbella</Link>
                        </h6>
                        <p className="fs-13">IOS Developer</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="fs-13 mb-1">Performance</p>
                      <h5 className="text-primary">99%</h5>
                    </div>
                  </div>
                  <Link to={all_routes.employeeList} className="btn btn-light btn-md w-100">
                    View All Employees
                  </Link>
                </div>
              </div>
            </div>
            {/* /Total Employee */}
            {/* Attendance Overview */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Attendance Overview</h5>
                  <div className="dropdown mb-2">
                    <Link
                      to="#"
                      className="btn btn-white border btn-md d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-calendar me-1 fs-14" />
                      Today
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          This Month
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          This Week
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          Today
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="chartjs-wrapper-demo position-relative mb-4">
                    <Chart type="doughnut" data={chartData} options={chartOptions} className="w-full attendence-chart md:w-30rem" />
                    <div className="position-absolute text-center attendance-canvas">
                      <p className="fs-13 mb-1">Total Attendance</p>
                      <h3>{loading ? '—' : data.totalAttendanceToday}</h3>
                    </div>
                  </div>
                  <h6 className="mb-3">Status</h6>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="f-13 mb-2">
                      <i className="ti ti-circle-filled text-success me-1" />
                      Present
                    </p>
                    <p className="f-13 fw-medium text-gray-9 mb-2">{loading ? '—' : (data.totalEmployees ? Math.round((data.presentCount / data.totalEmployees) * 100) : 0)}%</p>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="f-13 mb-2">
                      <i className="ti ti-circle-filled text-secondary me-1" />
                      Late
                    </p>
                    <p className="f-13 fw-medium text-gray-9 mb-2">{loading ? '—' : (data.totalEmployees ? Math.round((data.lateCount / data.totalEmployees) * 100) : 0)}%</p>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="f-13 mb-2">
                      <i className="ti ti-circle-filled text-warning me-1" />
                      Permission
                    </p>
                    <p className="f-13 fw-medium text-gray-9 mb-2">{loading ? '—' : (data.totalEmployees ? Math.round((data.permissionCount / data.totalEmployees) * 100) : 0)}%</p>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <p className="f-13 mb-2">
                      <i className="ti ti-circle-filled text-danger me-1" />
                      Absent
                    </p>
                    <p className="f-13 fw-medium text-gray-9 mb-2">{loading ? '—' : (data.totalEmployees ? Math.round((data.absentCount / data.totalEmployees) * 100) : 0)}%</p>
                  </div>
                  <div className="bg-light br-5 box-shadow-xs p-2 pb-0 d-flex align-items-center justify-content-between flex-wrap">
                    <div className="d-flex align-items-center">
                      <p className="mb-2 me-2">Total Absenties</p>
                      <div className="avatar-list-stacked avatar-group-sm mb-2">
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/profiles/avatar-27.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/profiles/avatar-30.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath src="assets/img/profiles/avatar-14.jpg" alt="img" />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath src="assets/img/profiles/avatar-29.jpg" alt="img" />
                        </span>
                        <Link
                          className="avatar bg-primary avatar-rounded text-fixed-white fs-10"
                          to="#"
                        >
                          +1
                        </Link>
                      </div>
                    </div>
                    <Link
                      to={all_routes.leaveadmin}
                      className="fs-13 link-primary text-decoration-underline mb-2"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* /Attendance Overview */}
            {/* Clock-In/Out */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <h5 className="mb-0">Clock-In/Out</h5>
                  <div className="d-flex align-items-center">
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="dropdown-toggle btn btn-white btn-sm d-inline-flex align-items-center border-0 fs-13 me-2"
                        data-bs-toggle="dropdown"
                      >
                        All Departments
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Finance
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Development
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Marketing
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="border btn btn-white btn-sm p-2 d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1 fs-14" />
                        Today
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Month
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Week
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Today
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div>
                    {loading ? (
                      <p className="text-muted text-center py-3">Loading...</p>
                    ) : data.clockedInList.length === 0 ? (
                      <p className="text-muted text-center py-3">No clocked-in employees today</p>
                    ) : (
                      data.clockedInList.map((item: any, idx: number) => (
                        <div key={item.id} className={`d-flex align-items-center justify-content-between mb-3 p-2 border br-5 ${idx === 0 ? 'border-dashed' : ''}`}>
                          <div className="d-flex align-items-center">
                            <div className="avatar flex-shrink-0">
                              <img
                                src={item.photo ? `${apiClient.defaults.baseURL}${item.photo}` : "assets/img/profiles/avatar-24.jpg"}
                                className="rounded-circle border border-2"
                                alt="img"
                                onError={(e) => { e.currentTarget.src = "assets/img/profiles/avatar-24.jpg"; }}
                                style={{ width: 38, height: 38, objectFit: 'cover' }}
                              />
                            </div>
                            <div className="ms-2">
                              <h6 className="fs-14 fw-medium text-truncate">
                                {item.name}
                              </h6>
                              <p className="fs-13">{item.designation}</p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <Link to="#" className="link-default me-2">
                              <i className="ti ti-clock-share" />
                            </Link>
                            <span className="fs-10 fw-medium d-inline-flex align-items-center badge badge-success">
                              <i className="ti ti-circle-filled fs-5 me-1" />
                              {formatTimeStr(item.checkIn)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Overall Summary Stats Box */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap mt-2 border br-5 p-2 pb-0 mb-3 bg-light">
                      <div>
                        <p className="mb-1 d-inline-flex align-items-center">
                          <i className="ti ti-circle-filled text-success fs-5 me-1" />
                          Clock In
                        </p>
                        <h6 className="fs-13 fw-normal mb-2">{loading ? '—' : formatTimeStr(data.firstCheckIn)}</h6>
                      </div>
                      <div>
                        <p className="mb-1 d-inline-flex align-items-center">
                          <i className="ti ti-circle-filled text-danger fs-5 me-1" />
                          Clock Out
                        </p>
                        <h6 className="fs-13 fw-normal mb-2">{loading ? '—' : formatTimeStr(data.lastCheckOut)}</h6>
                      </div>
                      <div>
                        <p className="mb-1 d-inline-flex align-items-center">
                          <i className="ti ti-circle-filled text-warning fs-5 me-1" />
                          Production
                        </p>
                        <h6 className="fs-13 fw-normal mb-2">{loading ? '—' : data.totalProduction}</h6>
                      </div>
                    </div>
                  </div>
                  
                  <h6 className="mb-2">Late</h6>
                  {loading ? (
                    <p className="text-muted text-center py-2">Loading...</p>
                  ) : data.lateList.length === 0 ? (
                    <p className="text-muted text-center py-2">No late arrivals today</p>
                  ) : (
                    data.lateList.map((item: any) => (
                      <div key={item.id} className="d-flex align-items-center justify-content-between mb-3 p-2 border border-dashed br-5">
                        <div className="d-flex align-items-center">
                          <span className="avatar flex-shrink-0">
                            <img
                              src={item.photo ? `${apiClient.defaults.baseURL}${item.photo}` : "assets/img/profiles/avatar-29.jpg"}
                              className="rounded-circle border border-2"
                              alt="img"
                              onError={(e) => { e.currentTarget.src = "assets/img/profiles/avatar-29.jpg"; }}
                              style={{ width: 38, height: 38, objectFit: 'cover' }}
                            />
                          </span>
                          <div className="ms-2">
                            <h6 className="fs-14 fw-medium text-truncate">
                              {item.name}{" "}
                              <span className="fs-10 fw-medium d-inline-flex align-items-center badge badge-danger">
                                <i className="ti ti-clock-hour-11 me-1" />
                                {item.lateMinutes}
                              </span>
                            </h6>
                            <p className="fs-13">{item.designation}</p>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <Link to="#" className="link-default me-2">
                            <i className="ti ti-clock-share" />
                          </Link>
                          <span className="fs-10 fw-medium d-inline-flex align-items-center badge badge-success">
                            <i className="ti ti-circle-filled fs-5 me-1" />
                            {formatTimeStr(item.checkIn)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <Link
                    to={all_routes.attendancereport}
                    className="btn btn-light btn-md w-100"
                  >
                    View All Attendance
                  </Link>
                </div>
              </div>
            </div>
            {/* /Clock-In/Out */}
          </div>
          <div className="row">
            {/* Jobs Applicants */}
            <div className="col-xxl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Jobs Applicants</h5>
                  <Link to={all_routes.joblist} className="btn btn-light btn-md mb-2">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  <ul
                    className="nav nav-tabs tab-style-1 nav-justified d-sm-flex d-block p-0 mb-4"
                    role="tablist"
                  >
                    <li className="nav-item" role="presentation">
                      <Link
                        className="nav-link fw-medium"
                        data-bs-toggle="tab"
                        data-bs-target="#openings"
                        aria-current="page"
                        to="#openings"
                        aria-selected="true"
                        role="tab"
                      >
                        Openings
                      </Link>
                    </li>
                    <li className="nav-item" role="presentation">
                      <Link
                        className="nav-link fw-medium active"
                        data-bs-toggle="tab"
                        data-bs-target="#applicants"
                        to="#applicants"
                        aria-selected="false"
                        tabIndex={-1}
                        role="tab"
                      >
                        Applicants
                      </Link>
                    </li>
                  </ul>
                  <div className="tab-content">
                    <div className="tab-pane fade" id="openings">
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="avatar overflow-hidden flex-shrink-0 bg-gray-100"
                          >
                            <ImageWithBasePath
                              src="assets/img/icons/apple.svg"
                              className="img-fluid rounded-circle w-auto h-auto"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2 overflow-hidden">
                            <p className="text-dark fw-medium text-truncate mb-0">
                              <Link to="#">Senior IOS Developer</Link>
                            </p>
                            <span className="fs-12">No of Openings : 25 </span>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className="btn btn-light btn-sm p-0 btn-icon d-flex align-items-center justify-content-center"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="avatar overflow-hidden flex-shrink-0 bg-gray-100"
                          >
                            <ImageWithBasePath
                              src="assets/img/icons/php.svg"
                              className="img-fluid w-auto h-auto"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2 overflow-hidden">
                            <p className="text-dark fw-medium text-truncate mb-0">
                              <Link to="#">Junior PHP Developer</Link>
                            </p>
                            <span className="fs-12">No of Openings : 20 </span>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className="btn btn-light btn-sm p-0 btn-icon d-flex align-items-center justify-content-center"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="avatar overflow-hidden flex-shrink-0 bg-gray-100"
                          >
                            <ImageWithBasePath
                              src="assets/img/icons/react.svg"
                              className="img-fluid w-auto h-auto"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2 overflow-hidden">
                            <p className="text-dark fw-medium text-truncate mb-0">
                              <Link to="#">Junior React Developer </Link>
                            </p>
                            <span className="fs-12">No of Openings : 30 </span>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className="btn btn-light btn-sm p-0 btn-icon d-flex align-items-center justify-content-center"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-0">
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="avatar overflow-hidden flex-shrink-0 bg-gray-100"
                          >
                            <ImageWithBasePath
                              src="assets/img/icons/laravel-icon.svg"
                              className="img-fluid w-auto h-auto"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2 overflow-hidden">
                            <p className="text-dark fw-medium text-truncate mb-0">
                              <Link to="#">Senior Laravel Developer</Link>
                            </p>
                            <span className="fs-12">No of Openings : 40 </span>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className="btn btn-light btn-sm p-0 btn-icon d-flex align-items-center justify-content-center"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                      </div>
                    </div>
                    <div className="tab-pane fade show active" id="applicants">
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center">
                          <Link to="#" className="avatar overflow-hidden flex-shrink-0">
                            <ImageWithBasePath
                              src="assets/img/users/user-09.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2 overflow-hidden">
                            <p className="text-dark fw-medium text-truncate mb-0">
                              <Link to="#">Brian Villalobos</Link>
                            </p>
                            <span className="fs-13 d-inline-flex align-items-center">
                              Exp : 5+ Years
                              <i className="ti ti-circle-filled fs-4 mx-2 text-primary" />
                              USA
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-secondary badge-xs">
                          UI/UX Designer
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center">
                          <Link to="#" className="avatar overflow-hidden flex-shrink-0">
                            <ImageWithBasePath
                              src="assets/img/users/user-32.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2 overflow-hidden">
                            <p className="text-dark fw-medium text-truncate mb-0">
                              <Link to="#">Anthony Lewis</Link>
                            </p>
                            <span className="fs-13 d-inline-flex align-items-center">
                              Exp : 4+ Years
                              <i className="ti ti-circle-filled fs-4 mx-2 text-primary" />
                              USA
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-info badge-xs">
                          Python Developer
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center">
                          <Link to="#" className="avatar overflow-hidden flex-shrink-0">
                            <ImageWithBasePath
                              src="assets/img/users/user-32.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2 overflow-hidden">
                            <p className="text-dark fw-medium text-truncate mb-0">
                              <Link to="#">Stephan Peralt</Link>
                            </p>
                            <span className="fs-13 d-inline-flex align-items-center">
                              Exp : 6+ Years
                              <i className="ti ti-circle-filled fs-4 mx-2 text-primary" />
                              USA
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-pink badge-xs">
                          Android Developer
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-0">
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="avatar overflow-hidden flex-shrink-0"
                          >
                            <ImageWithBasePath
                              src="assets/img/users/user-34.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2 overflow-hidden">
                            <p className="text-dark fw-medium text-truncate mb-0">
                              <Link to="#">Doglas Martini</Link>
                            </p>
                            <span className="fs-13 d-inline-flex align-items-center">
                              Exp : 2+ Years
                              <i className="ti ti-circle-filled fs-4 mx-2 text-primary" />
                              USA
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-purple badge-xs">
                          React Developer
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Jobs Applicants */}
            {/* Employees */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Employees</h5>
                  <Link to={all_routes.employeeList} className="btn btn-light btn-md mb-2">
                    View All
                  </Link>
                </div>
                <div className="card-body p-0 employee-table">
                  <div className="table-responsive">
                    <table className="table table-nowrap mb-0">
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={2} className="text-center py-3 text-muted">
                              Loading...
                            </td>
                          </tr>
                        ) : data.latestEmployees.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="text-center py-3 text-muted">
                              No employees found
                            </td>
                          </tr>
                        ) : (
                          data.latestEmployees.map((emp: any) => (
                            <tr key={emp.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <Link to={all_routes.employeedetails} className="avatar">
                                    <img
                                      src={emp.photo ? `${apiClient.defaults.baseURL}${emp.photo}` : "assets/img/users/user-32.jpg"}
                                      className="img-fluid rounded-circle"
                                      alt="img"
                                      onError={(e) => { e.currentTarget.src = "assets/img/users/user-32.jpg"; }}
                                      style={{ width: 32, height: 32, objectFit: 'cover' }}
                                    />
                                  </Link>
                                  <div className="ms-2">
                                    <h6 className="fw-medium">
                                      <Link to={all_routes.employeedetails}>{emp.name}</Link>
                                    </h6>
                                    <span className="fs-12">{emp.designation}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="text-end">
                                <span className="badge badge-secondary-transparent badge-xs">
                                  {emp.department}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            {/* /Employees */}

            {/* Todo */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Todo</h5>
                  <div className="d-flex align-items-center">
                    <div className="dropdown mb-2 me-2">
                      <Link
                        to="#"
                        className="border btn btn-white btn-sm p-2 d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1 fs-14" />
                        Today
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Month
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Week
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Today
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <Link
                      to="#"
                      className="btn btn-primary btn-icon btn-xs rounded-circle d-flex align-items-center justify-content-center p-0 mb-2"
                      data-bs-toggle="modal"
                      data-bs-target="#add_todo"
                    >
                      <i className="ti ti-plus fs-16" />
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className={`d-flex align-items-center todo-item border bg-white p-2 br-5 mb-2 ${isTodo[0] ? 'todo-strike' : ''}`}>
                    <i className="ti ti-grid-dots me-2" />
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="todo1"
                        onChange={() => toggleTodo(0)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="todo1">
                        Add Holidays
                      </label>
                    </div>
                  </div>
                  <div className={`d-flex align-items-center todo-item border p-2 br-5 mb-2 bg-primary-transparent ${isTodo[1] ? 'todo-strike' : ''}`}>
                    <i className="ti ti-grid-dots me-2" />
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="todo2"
                        onChange={() => toggleTodo(1)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="todo2">
                        Add Meeting to Client
                      </label>
                    </div>
                  </div>
                  <div className={`d-flex align-items-center todo-item border p-2 br-5 mb-2 bg-danger-transparent ${isTodo[2] ? 'todo-strike' : ''}`}>
                    <i className="ti ti-grid-dots me-2" />
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="todo3"
                        onChange={() => toggleTodo(2)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="todo3">
                        Chat with Adrian
                      </label>
                    </div>
                  </div>
                  <div className={`d-flex align-items-center todo-item border p-2 br-5 mb-2 bg-purple-transparent ${isTodo[3] ? 'todo-strike' : ''}`}>
                    <i className="ti ti-grid-dots me-2" />
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="todo4"
                        onChange={() => toggleTodo(3)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="todo4">
                        Management Call
                      </label>
                    </div>
                  </div>
                  <div className={`d-flex align-items-center todo-item border p-2 br-5 mb-2 bg-info-transparent ${isTodo[4] ? 'todo-strike' : ''}`}>
                    <i className="ti ti-grid-dots me-2" />
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="todo5"
                        onChange={() => toggleTodo(4)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="todo5">
                        Add Payroll
                      </label>
                    </div>
                  </div>
                  <div className={`d-flex align-items-center todo-item border p-2 br-5 mb-0 bg-warning-transparent ${isTodo[5] ? 'todo-strike' : ''}`}>
                    <i className="ti ti-grid-dots me-2" />
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="todo6"
                        onChange={() => toggleTodo(5)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="todo6">
                        Add Policy for Increment{" "}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Todo */}
          </div>
          <div className="row">
            {/* Sales Overview */}
            <div className="col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Sales Overview</h5>
                  <div className="d-flex align-items-center">
                    <div className="dropdown mb-2">
                      <Link
                        to="#"
                        className="dropdown-toggle btn btn-white border-0 btn-sm d-inline-flex align-items-center fs-13 me-2"
                        data-bs-toggle="dropdown"
                      >
                        All Departments
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            UI/UX Designer
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            HR Manager
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Junior Tester
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="dropdown mb-2">
                      <Link
                        to="#"
                        className="border btn btn-white btn-sm p-2 d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1 fs-14" />
                        Today
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Month
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Week
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Today
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <div className="d-flex align-items-center mb-1">
                      <p className="fs-13 text-gray-9 me-3 mb-0">
                        <i className="ti ti-square-rounded-filled me-2 text-primary" />
                        Income
                      </p>
                      <p className="fs-13 text-gray-9 mb-0">
                        <i className="ti ti-square-rounded-filled me-2 text-gray-2" />
                        Expenses
                      </p>
                    </div>
                    <p className="fs-13 mb-1">Last Updated at 11:30PM</p>
                  </div>
                  <ReactApexChart
                    id="sales-income"
                    options={salesIncome}
                    series={salesIncome.series}
                    type="bar"
                    height={270}
                  />
                </div>
              </div>
            </div>
            {/* /Sales Overview */}
            {/* Invoices */}
            <div className="col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Invoices</h5>
                  <div className="d-flex align-items-center">
                    <div className="dropdown mb-2">
                      <Link
                        to="#"
                        className="dropdown-toggle btn btn-white btn-sm d-inline-flex align-items-center fs-13 me-2 border-0"
                        data-bs-toggle="dropdown"
                      >
                        Invoices
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Invoices
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Paid
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Unpaid
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="dropdown mb-2">
                      <Link
                        to="#"
                        className="border btn btn-white btn-md d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1 fs-14" />
                        This Week
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Month
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Week
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Today
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body pt-2">
                  <div className="table-responsive pt-1">
                    <table className="table table-nowrap table-borderless mb-0">
                      <tbody>
                        <tr>
                          <td className="px-0">
                            <div className="d-flex align-items-center">
                              <Link to={all_routes.invoiceDetails} className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/users/user-39.jpg"
                                  className="img-fluid rounded-circle"
                                  alt="img"
                                />
                              </Link>
                              <div className="ms-2">
                                <h6 className="fw-medium">
                                  <Link to={all_routes.invoiceDetails}>
                                    Redesign Website
                                  </Link>
                                </h6>
                                <span className="fs-13 d-inline-flex align-items-center">
                                  #INVOO2
                                  <i className="ti ti-circle-filled fs-4 mx-1 text-primary" />
                                  Logistics
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="fs-13 mb-1">Payment</p>
                            <h6 className="fw-medium">$3560</h6>
                          </td>
                          <td className="px-0 text-end">
                            <span className="badge badge-danger-transparent badge-xs d-inline-flex align-items-center">
                              <i className="ti ti-circle-filled fs-5 me-1" />
                              Unpaid
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-0">
                            <div className="d-flex align-items-center">
                              <Link to={all_routes.invoiceDetails} className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/users/user-40.jpg"
                                  className="img-fluid rounded-circle"
                                  alt="img"
                                />
                              </Link>
                              <div className="ms-2">
                                <h6 className="fw-medium">
                                  <Link to={all_routes.invoiceDetails}>
                                    Module Completion
                                  </Link>
                                </h6>
                                <span className="fs-13 d-inline-flex align-items-center">
                                  #INVOO5
                                  <i className="ti ti-circle-filled fs-4 mx-1 text-primary" />
                                  Yip Corp
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="fs-13 mb-1">Payment</p>
                            <h6 className="fw-medium">$4175</h6>
                          </td>
                          <td className="px-0 text-end">
                            <span className="badge badge-danger-transparent badge-xs d-inline-flex align-items-center">
                              <i className="ti ti-circle-filled fs-5 me-1" />
                              Unpaid
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-0">
                            <div className="d-flex align-items-center">
                              <Link to={all_routes.invoiceDetails} className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/users/user-55.jpg"
                                  className="img-fluid rounded-circle"
                                  alt="img"
                                />
                              </Link>
                              <div className="ms-2">
                                <h6 className="fw-medium">
                                  <Link to={all_routes.invoiceDetails}>
                                    Change on Emp Module
                                  </Link>
                                </h6>
                                <span className="fs-13 d-inline-flex align-items-center">
                                  #INVOO3
                                  <i className="ti ti-circle-filled fs-4 mx-1 text-primary" />
                                  Ignis LLP
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="fs-13 mb-1">Payment</p>
                            <h6 className="fw-medium">$6985</h6>
                          </td>
                          <td className="px-0 text-end">
                            <span className="badge badge-danger-transparent badge-xs d-inline-flex align-items-center">
                              <i className="ti ti-circle-filled fs-5 me-1" />
                              Unpaid
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-0">
                            <div className="d-flex align-items-center">
                              <Link to={all_routes.invoiceDetails} className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/users/user-42.jpg"
                                  className="img-fluid rounded-circle"
                                  alt="img"
                                />
                              </Link>
                              <div className="ms-2">
                                <h6 className="fw-medium">
                                  <Link to={all_routes.invoiceDetails}>
                                    Changes on the Board
                                  </Link>
                                </h6>
                                <span className="fs-13 d-inline-flex align-items-center">
                                  #INVOO2
                                  <i className="ti ti-circle-filled fs-4 mx-1 text-primary" />
                                  Ignis LLP
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="fs-13 mb-1">Payment</p>
                            <h6 className="fw-medium">$1457</h6>
                          </td>
                          <td className="px-0 text-end">
                            <span className="badge badge-danger-transparent badge-xs d-inline-flex align-items-center">
                              <i className="ti ti-circle-filled fs-5 me-1" />
                              Unpaid
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-0">
                            <div className="d-flex align-items-center">
                              <Link to={all_routes.invoiceDetails} className="avatar">
                                <ImageWithBasePath
                                  src="assets/img/users/user-44.jpg"
                                  className="img-fluid rounded-circle"
                                  alt="img"
                                />
                              </Link>
                              <div className="ms-2">
                                <h6 className="fw-medium">
                                  <Link to={all_routes.invoiceDetails}>
                                    Hospital Management
                                  </Link>
                                </h6>
                                <span className="fs-13 d-inline-flex align-items-center">
                                  #INVOO6
                                  <i className="ti ti-circle-filled fs-4 mx-1 text-primary" />
                                  HCL Corp
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="fs-13 mb-1">Payment</p>
                            <h6 className="fw-medium">$6458</h6>
                          </td>
                          <td className="px-0 text-end">
                            <span className="badge badge-success-transparent badge-xs d-inline-flex align-items-center">
                              <i className="ti ti-circle-filled fs-5 me-1" />
                              Paid
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Link
                    to={all_routes.invoice}
                    className="btn btn-light btn-md w-100 mt-2"
                  >
                    View All
                  </Link>
                </div>
              </div>
            </div>
            {/* /Invoices */}
          </div>
          <div className="row">
            {/* Projects */}
            <div className="col-xxl-8 col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Projects</h5>
                  <div className="d-flex align-items-center">
                    <div className="dropdown mb-2">
                      <Link
                        to="#"
                        className="border btn btn-white btn-md d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1 fs-14" />
                        September
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Month
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Week
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Today
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-nowrap mb-0">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Team</th>
                          <th>Hours</th>
                          <th>Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <Link to={all_routes.projectdetails} className="link-default">
                              PRO-001
                            </Link>
                          </td>
                          <td>
                            <h6 className="fw-medium">
                              <Link to={all_routes.projectdetails}>
                                Office Management App
                              </Link>
                            </h6>
                          </td>
                          <td>
                            <div className="avatar-list-stacked avatar-group-sm">
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-02.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-03.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-05.jpg"
                                  alt="img"
                                />
                              </span>
                            </div>
                          </td>
                          <td>
                            <p className="mb-1">15/255 Hrs</p>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={40}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: "40%" }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-danger d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              High
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Link to={all_routes.projectdetails} className="link-default">
                              PRO-002
                            </Link>
                          </td>
                          <td>
                            <h6 className="fw-medium">
                              <Link to={all_routes.projectdetails}>Clinic Management </Link>
                            </h6>
                          </td>
                          <td>
                            <div className="avatar-list-stacked avatar-group-sm">
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-06.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-07.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-08.jpg"
                                  alt="img"
                                />
                              </span>
                              <Link
                                className="avatar bg-primary avatar-rounded text-fixed-white fs-10 fw-medium"
                                to="#"
                              >
                                +1
                              </Link>
                            </div>
                          </td>
                          <td>
                            <p className="mb-1">15/255 Hrs</p>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={40}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: "40%" }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-success d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Low
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Link to={all_routes.projectdetails} className="link-default">
                              PRO-003
                            </Link>
                          </td>
                          <td>
                            <h6 className="fw-medium">
                              <Link to={all_routes.projectdetails}>
                                Educational Platform
                              </Link>
                            </h6>
                          </td>
                          <td>
                            <div className="avatar-list-stacked avatar-group-sm">
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-06.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-08.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-09.jpg"
                                  alt="img"
                                />
                              </span>
                            </div>
                          </td>
                          <td>
                            <p className="mb-1">40/255 Hrs</p>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={50}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: "50%" }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-pink d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Medium
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Link to={all_routes.projectdetails} className="link-default">
                              PRO-004
                            </Link>
                          </td>
                          <td>
                            <h6 className="fw-medium">
                              <Link to={all_routes.projectdetails}>
                                Chat &amp; Call Mobile App
                              </Link>
                            </h6>
                          </td>
                          <td>
                            <div className="avatar-list-stacked avatar-group-sm">
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-11.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-12.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-13.jpg"
                                  alt="img"
                                />
                              </span>
                            </div>
                          </td>
                          <td>
                            <p className="mb-1">35/155 Hrs</p>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={50}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: "50%" }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-danger d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              High
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Link to={all_routes.projectdetails} className="link-default">
                              PRO-005
                            </Link>
                          </td>
                          <td>
                            <h6 className="fw-medium">
                              <Link to={all_routes.projectdetails}>
                                Travel Planning Website
                              </Link>
                            </h6>
                          </td>
                          <td>
                            <div className="avatar-list-stacked avatar-group-sm">
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-17.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-18.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-19.jpg"
                                  alt="img"
                                />
                              </span>
                            </div>
                          </td>
                          <td>
                            <p className="mb-1">50/235 Hrs</p>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={50}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: "50%" }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-pink d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Medium
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Link to={all_routes.projectdetails} className="link-default">
                              PRO-006
                            </Link>
                          </td>
                          <td>
                            <h6 className="fw-medium">
                              <Link to={all_routes.projectdetails}>
                                Service Booking Software
                              </Link>
                            </h6>
                          </td>
                          <td>
                            <div className="avatar-list-stacked avatar-group-sm">
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-06.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-08.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-09.jpg"
                                  alt="img"
                                />
                              </span>
                            </div>
                          </td>
                          <td>
                            <p className="mb-1">40/255 Hrs</p>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={50}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: "50%" }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-success d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Low
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-0">
                            <Link to={all_routes.projectdetails} className="link-default">
                              PRO-008
                            </Link>
                          </td>
                          <td className="border-0">
                            <h6 className="fw-medium">
                              <Link to={all_routes.projectdetails}>
                                Travel Planning Website
                              </Link>
                            </h6>
                          </td>
                          <td className="border-0">
                            <div className="avatar-list-stacked avatar-group-sm">
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-15.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-16.jpg"
                                  alt="img"
                                />
                              </span>
                              <span className="avatar avatar-rounded">
                                <ImageWithBasePath
                                  className="border border-white"
                                  src="assets/img/profiles/avatar-17.jpg"
                                  alt="img"
                                />
                              </span>
                              <Link
                                className="avatar bg-primary avatar-rounded text-fixed-white fs-10 fw-medium"
                                to="#"
                              >
                                +2
                              </Link>
                            </div>
                          </td>
                          <td className="border-0">
                            <p className="mb-1">15/255 Hrs</p>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={45}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: "45%" }}
                              />
                            </div>
                          </td>
                          <td className="border-0">
                            <span className="badge badge-pink d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Medium
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            {/* /Projects */}
            {/* Tasks Statistics */}
            <div className="col-xxl-4 col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Tasks Statistics</h5>
                  <div className="d-flex align-items-center">
                    <div className="dropdown mb-2">
                      <Link
                        to="#"
                        className="border btn btn-white btn-sm p-2 d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1 fs-14" />
                        This Week
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Month
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            This Week
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Today
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="chartjs-wrapper-demo position-relative mb-4">
                    <Chart type="doughnut" data={semidonutData} options={semidonutOptions} className="w-full md:w-30rem semi-donut-chart mx-auto" />
                    <div className="position-absolute text-center attendance-canvas">
                      <p className="fs-13 mb-1">Total Tasks</p>
                      <h3>124/165</h3>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-center flex-wrap">
                    <div className="border-end text-center me-2 pe-2 mb-3">
                      <p className="fs-13 d-inline-flex align-items-center mb-1">
                        <i className="ti ti-circle-filled fs-10 me-1 text-warning" />
                        Ongoing
                      </p>
                      <h5>24%</h5>
                    </div>
                    <div className="border-end text-center me-2 pe-2 mb-3">
                      <p className="fs-13 d-inline-flex align-items-center mb-1">
                        <i className="ti ti-circle-filled fs-10 me-1 text-info" />
                        On Hold{" "}
                      </p>
                      <h5>10%</h5>
                    </div>
                    <div className="border-end text-center me-2 pe-2 mb-3">
                      <p className="fs-13 d-inline-flex align-items-center mb-1">
                        <i className="ti ti-circle-filled fs-10 me-1 text-danger" />
                        Overdue
                      </p>
                      <h5>16%</h5>
                    </div>
                    <div className="text-center me-2 pe-2 mb-3">
                      <p className="fs-13 d-inline-flex align-items-center mb-1">
                        <i className="ti ti-circle-filled fs-10 me-1 text-success" />
                        Ongoing
                      </p>
                      <h5>40%</h5>
                    </div>
                  </div>
                  <div className="bg-dark br-5 p-3 pb-0 d-flex align-items-center justify-content-between hrs-card">
                    <div className="mb-2">
                      <h4 className="text-success">389/689 hrs</h4>
                      <p className="fs-13 mb-0">Spent on Overall Tasks This Week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Tasks Statistics */}
          </div>
          <div className="row">
            {/* Schedules */}
            <div className="col-xxl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Schedules</h5>
                  <Link to={all_routes.candidateslist} className="btn btn-light btn-md mb-2">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  <div className="bg-light p-3 br-5 mb-4">
                    <span className="badge badge-secondary badge-xs mb-1">
                      UI/ UX Designer
                    </span>
                    <h6 className="mb-2 text-truncate">
                      Interview Candidates - UI/UX Designer
                    </h6>
                    <div className="d-flex align-items-center flex-wrap">
                      <p className="fs-13 mb-1 me-2">
                        <i className="ti ti-calendar-event me-2" />
                        Thu, 15 Feb 2025
                      </p>
                      <p className="fs-13 mb-1">
                        <i className="ti ti-clock-hour-11 me-2" />
                        01:00 PM - 02:20 PM
                      </p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top mt-2 pt-3">
                      <div className="avatar-list-stacked avatar-group-sm">
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-49.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-13.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-11.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-22.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-58.jpg"
                            alt="img"
                          />
                        </span>
                        <Link
                          className="avatar bg-primary avatar-rounded text-fixed-white fs-10 fw-medium"
                          to="#"
                        >
                          +3
                        </Link>
                      </div>
                      <Link to="#" className="btn btn-white">
                        Join Meeting
                      </Link>
                    </div>
                  </div>
                  <div className="bg-light p-3 br-5 mb-0">
                    <span className="badge badge-dark badge-xs mb-1">
                      IOS Developer
                    </span>
                    <h6 className="mb-2 text-truncate">
                      Interview Candidates - IOS Developer
                    </h6>
                    <div className="d-flex align-items-center flex-wrap">
                      <p className="fs-13 mb-1 me-2">
                        <i className="ti ti-calendar-event me-2" />
                        Thu, 15 Feb 2025
                      </p>
                      <p className="fs-13 mb-1">
                        <i className="ti ti-clock-hour-11 me-2" />
                        02:00 PM - 04:20 PM
                      </p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top mt-2 pt-3">
                      <div className="avatar-list-stacked avatar-group-sm">
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-49.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-13.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-11.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-22.jpg"
                            alt="img"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/users/user-58.jpg"
                            alt="img"
                          />
                        </span>
                        <Link
                          className="avatar bg-primary avatar-rounded text-fixed-white fs-10 fw-medium"
                          to="#"
                        >
                          +3
                        </Link>
                      </div>
                      <Link to="#" className="btn btn-white">
                        Join Meeting
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Schedules */}
            {/* Recent Activities */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Recent Activities</h5>
                  <Link to={all_routes.activity} className="btn btn-light btn-md mb-2">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  <div className="recent-item">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex align-items-center w-100">
                        <Link
                          to="javscript:void(0);"
                          className="avatar  flex-shrink-0"
                        >
                          <ImageWithBasePath
                            src="assets/img/users/user-38.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2 flex-fill">
                          <div className="d-flex align-items-center justify-content-between">
                            <h6 className="fs-medium text-truncate">
                              <Link to="javscript:void(0);">Matt Morgan</Link>
                            </h6>
                            <p className="fs-13">05:30 PM</p>
                          </div>
                          <p className="fs-13">
                            Added New Project{" "}
                            <span className="text-primary">HRMS Dashboard</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="recent-item">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex align-items-center w-100">
                        <Link
                          to="javscript:void(0);"
                          className="avatar  flex-shrink-0"
                        >
                          <ImageWithBasePath
                            src="assets/img/users/user-01.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2 flex-fill">
                          <div className="d-flex align-items-center justify-content-between">
                            <h6 className="fs-medium text-truncate">
                              <Link to="javscript:void(0);">Jay Ze</Link>
                            </h6>
                            <p className="fs-13">05:00 PM</p>
                          </div>
                          <p className="fs-13">Commented on Uploaded Document</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="recent-item">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex align-items-center w-100">
                        <Link
                          to="javscript:void(0);"
                          className="avatar  flex-shrink-0"
                        >
                          <ImageWithBasePath
                            src="assets/img/users/user-19.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2 flex-fill">
                          <div className="d-flex align-items-center justify-content-between">
                            <h6 className="fs-medium text-truncate">
                              <Link to="javscript:void(0);">Mary Donald</Link>
                            </h6>
                            <p className="fs-13">05:30 PM</p>
                          </div>
                          <p className="fs-13">Approved Task Projects</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="recent-item">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex align-items-center w-100">
                        <Link
                          to="javscript:void(0);"
                          className="avatar  flex-shrink-0"
                        >
                          <ImageWithBasePath
                            src="assets/img/users/user-11.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2 flex-fill">
                          <div className="d-flex align-items-center justify-content-between">
                            <h6 className="fs-medium text-truncate">
                              <Link to="javscript:void(0);">George David</Link>
                            </h6>
                            <p className="fs-13">06:00 PM</p>
                          </div>
                          <p className="fs-13">
                            Requesting Access to Module Tickets
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="recent-item">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex align-items-center w-100">
                        <Link
                          to="javscript:void(0);"
                          className="avatar  flex-shrink-0"
                        >
                          <ImageWithBasePath
                            src="assets/img/users/user-20.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2 flex-fill">
                          <div className="d-flex align-items-center justify-content-between">
                            <h6 className="fs-medium text-truncate">
                              <Link to="javscript:void(0);">Aaron Zeen</Link>
                            </h6>
                            <p className="fs-13">06:30 PM</p>
                          </div>
                          <p className="fs-13">Downloaded App Reportss</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="recent-item">
                    <div className="d-flex justify-content-between">
                      <div className="d-flex align-items-center w-100">
                        <Link
                          to="javscript:void(0);"
                          className="avatar  flex-shrink-0"
                        >
                          <ImageWithBasePath
                            src="assets/img/users/user-08.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2 flex-fill">
                          <div className="d-flex align-items-center justify-content-between">
                            <h6 className="fs-medium text-truncate">
                              <Link to="javscript:void(0);">Hendry Daniel</Link>
                            </h6>
                            <p className="fs-13">05:30 PM</p>
                          </div>
                          <p className="fs-13">
                            Completed New Project <span>HMS</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Recent Activities */}
            {/* Birthdays */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Birthdays</h5>
                  <Link
                    to="#"
                    className="btn btn-light btn-md mb-2"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body pb-1">
                  <h6 className="mb-2">Today</h6>
                  <div className="p-2 border border-dashed rounded mb-3 birthday-card active">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <Link to="#" className="avatar">
                          <ImageWithBasePath
                            src="assets/img/users/user-38.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2 overflow-hidden">
                          <h6 className="fs-medium ">Andrew Jermia</h6>
                          <p className="fs-13">IOS Developer</p>
                        </div>
                      </div>
                      <Link to="#" className="btn btn-sm btn-white">
                        <i className="ti ti-cake me-1" />
                        Send
                      </Link>
                    </div>
                  </div>
                  <h6 className="mb-2">Tomorrow</h6>
                  <div className="p-2 border border-dashed rounded mb-3 birthday-card">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <Link to="#" className="avatar">
                          <ImageWithBasePath
                            src="assets/img/users/user-10.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2 overflow-hidden">
                          <h6 className="fs-medium">
                            <Link to="#">Mary Zeen</Link>
                          </h6>
                          <p className="fs-13">UI/UX Designer</p>
                        </div>
                      </div>
                      <Link to="#" className="btn btn-sm btn-white">
                        <i className="ti ti-cake me-1" />
                        Send
                      </Link>
                    </div>
                  </div>
                  <div className="p-2 border border-dashed rounded mb-3 birthday-card">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <Link to="#" className="avatar">
                          <ImageWithBasePath
                            src="assets/img/users/user-09.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </Link>
                        <div className="ms-2 overflow-hidden">
                          <h6 className="fs-medium ">
                            <Link to="#">Antony Lewis</Link>
                          </h6>
                          <p className="fs-13">Android Developer</p>
                        </div>
                      </div>
                      <Link to="#" className="btn btn-sm btn-white">
                        <i className="ti ti-cake me-1" />
                        Send
                      </Link>
                    </div>
                  </div>
                  <h6 className="mb-2">25 Jan 2025</h6>
                  <div className="p-2 border border-dashed rounded mb-3 birthday-card">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <span className="avatar">
                          <ImageWithBasePath
                            src="assets/img/users/user-12.jpg"
                            className="rounded-circle"
                            alt="img"
                          />
                        </span>
                        <div className="ms-2 overflow-hidden">
                          <h6 className="fs-medium ">Doglas Martini</h6>
                          <p className="fs-13">.Net Developer</p>
                        </div>
                      </div>
                      <Link to="#" className="btn btn-sm btn-white">
                        <i className="ti ti-cake me-1" />
                        Send
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Birthdays */}
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
      <ProjectModals />
      <RequestModals />
      <TodoModal />

      {/* Hire HR Manager Modal */}
      <div className="modal fade" id="hire_hr_manager_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title text-white fw-bold">
                <i className="ti ti-user-plus me-2" />
                Add / Hire HR Manager
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                id="close_hire_hr_modal"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleHireHRSubmit}>
              <div className="modal-body p-4">
                <div className="alert alert-info py-2 px-3 fs-13 mb-3">
                  <i className="ti ti-info-circle me-1" />
                  Adding an HR Manager creates their initial account. They will log in and fill their onboarding details (Phone, Date of Joining, Profile Photo, Bank &amp; Documents).
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">First Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={hireHRForm.firstName}
                      onChange={(e) => {
                        const fn = e.target.value;
                        const domain = getAdminDomain();
                        const fnClean = fn.toLowerCase().replace(/\s+/g, '');
                        const lnClean = (hireHRForm.lastName || '').toLowerCase().replace(/\s+/g, '');
                        const handle = fnClean ? (lnClean ? `${fnClean}.${lnClean}` : fnClean) : '';
                        if (!isHREmailEdited) {
                          setHireHRForm({ ...hireHRForm, firstName: fn, email: handle ? `${handle}@${domain}` : '' });
                        } else {
                          setHireHRForm({ ...hireHRForm, firstName: fn });
                        }
                      }}
                      placeholder="e.g. Jane"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Last Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={hireHRForm.lastName}
                      onChange={(e) => {
                        const ln = e.target.value;
                        const domain = getAdminDomain();
                        const fnClean = (hireHRForm.firstName || '').toLowerCase().replace(/\s+/g, '');
                        const lnClean = ln.toLowerCase().replace(/\s+/g, '');
                        const handle = fnClean ? (lnClean ? `${fnClean}.${lnClean}` : fnClean) : '';
                        if (!isHREmailEdited) {
                          setHireHRForm({ ...hireHRForm, lastName: ln, email: handle ? `${handle}@${domain}` : '' });
                        } else {
                          setHireHRForm({ ...hireHRForm, lastName: ln });
                        }
                      }}
                      placeholder="e.g. Doe"
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-medium">Email Address <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={hireHRForm.email}
                        onChange={(e) => {
                          setIsHREmailEdited(true);
                          setHireHRForm({ ...hireHRForm, email: e.target.value });
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          const domain = getAdminDomain();
                          if (val && !val.includes('@')) {
                            setHireHRForm({ ...hireHRForm, email: `${val.toLowerCase()}@${domain}` });
                            setIsHREmailEdited(true);
                          }
                        }}
                        placeholder={`e.g. hr@${getAdminDomain()}`}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        title={`Append @${getAdminDomain()}`}
                        onClick={() => {
                          const domain = getAdminDomain();
                          const val = hireHRForm.email.trim();
                          if (!val) {
                            const fnClean = (hireHRForm.firstName || '').toLowerCase().replace(/\s+/g, '');
                            const lnClean = (hireHRForm.lastName || '').toLowerCase().replace(/\s+/g, '');
                            const handle = fnClean ? (lnClean ? `${fnClean}.${lnClean}` : fnClean) : 'hr.manager';
                            setHireHRForm({ ...hireHRForm, email: `${handle}@${domain}` });
                          } else if (!val.includes('@')) {
                            setHireHRForm({ ...hireHRForm, email: `${val.toLowerCase()}@${domain}` });
                          } else {
                            const handle = val.split('@')[0];
                            setHireHRForm({ ...hireHRForm, email: `${handle}@${domain}` });
                          }
                          setIsHREmailEdited(true);
                        }}
                      >
                        @{getAdminDomain()}
                      </button>
                    </div>
                    <div className="form-text text-muted mt-1">
                      💡 Auto Domain Reference: <span className="fw-semibold text-primary">@{getAdminDomain()}</span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Password</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={hireHRForm.password}
                      onChange={(e) => setHireHRForm({ ...hireHRForm, password: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Confirm Password</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={hireHRForm.confirmPassword}
                      onChange={(e) => setHireHRForm({ ...hireHRForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={hireHRLoading}>
                  {hireHRLoading ? 'Saving...' : 'Add HR Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Approve HR Manager Modal */}
      <div className="modal fade" id="approve_hr_manager_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title text-white fw-bold">
                <i className="ti ti-check-check me-2" />
                Approve HR Manager Onboarding
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
                id="close_approve_hr_modal"
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleApproveHRSubmit}>
              <div className="modal-body p-4">
                {selectedHREmp && (
                  <div className="mb-3 p-3 bg-light rounded border">
                    <h6 className="mb-1 fw-bold">{selectedHREmp.firstName} {selectedHREmp.lastName}</h6>
                    <span className="text-muted fs-13 d-block">{selectedHREmp.user?.email || selectedHREmp.email}</span>
                    {selectedHREmp.phone && <span className="text-muted fs-13 d-block">Phone: {selectedHREmp.phone}</span>}
                    {selectedHREmp.dateOfJoining && (
                      <span className="text-muted fs-13 d-block">
                        Date of Joining: {new Date(selectedHREmp.dateOfJoining).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Department <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      required
                      value={approveHRForm.departmentId}
                      onChange={(e) => setApproveHRForm({ ...approveHRForm, departmentId: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Designation <span className="text-danger">*</span></label>
                    <select
                      className="form-select"
                      required
                      value={approveHRForm.designationId}
                      onChange={(e) => setApproveHRForm({ ...approveHRForm, designationId: e.target.value })}
                    >
                      <option value="">Select Designation</option>
                      {designations.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Employee ID (Auto-generated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={approveHRForm.employeeCode}
                      onChange={(e) => setApproveHRForm({ ...approveHRForm, employeeCode: e.target.value })}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-medium">Username / Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={approveHRForm.username}
                      onChange={(e) => setApproveHRForm({ ...approveHRForm, username: e.target.value })}
                      placeholder="Username or Full Name"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={approveLoading}>
                  {approveLoading ? 'Approving...' : 'Approve & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

