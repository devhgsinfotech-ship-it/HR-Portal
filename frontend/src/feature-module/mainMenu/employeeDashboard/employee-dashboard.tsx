import React, { useState, useEffect } from "react";
import apiClient from "../../../core/utils/apiClient";
import { Link } from "react-router-dom";
import moment from "moment";
import { all_routes } from "../../../router/all_routes";
import { APP_CONFIG } from "../../../environment";
import { useAppSelector } from "../../../core/data/redux/store";
import { SocialFeed } from "./social-feed";
import CommonFooter from "@/core/common/commonFooter/footer";

const EmployeeDashboard = () => {
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [upcomingHoliday, setUpcomingHoliday] = useState<any>(null);
  const [onLeaveToday, setOnLeaveToday] = useState<any[]>([]);
  const { user } = useAppSelector((state) => state.auth);
  
  const [currentTime, setCurrentTime] = useState(moment());

  const fetchData = async () => {
    try {
      const [empRes, statusRes, balancesRes, holidaysRes, onLeaveRes] = await Promise.all([
        apiClient.get('/employees/me').catch(() => ({ data: null })),
        apiClient.get('/attendance/today').catch(() => ({ data: null })),
        apiClient.get('/leaves/balances').catch(() => ({ data: [] })),
        apiClient.get('/holidays').catch(() => ({ data: [] })),
        apiClient.get('/leaves/on-leave-today').catch(() => ({ data: [] }))
      ]);
      setEmployeeData(empRes.data);
      setAttendanceStatus(statusRes.data);
      setLeaveBalances(balancesRes.data || []);
      setOnLeaveToday(onLeaveRes.data || []);
      
      const holidayData = holidaysRes.data || [];
      setHolidays(holidayData);
      
      // Find upcoming holiday
      const today = moment().startOf('day');
      const upcoming = holidayData
        .filter((h: any) => moment(h.holidayDate).isSameOrAfter(today))
        .sort((a: any, b: any) => moment(a.holidayDate).valueOf() - moment(b.holidayDate).valueOf());
      
      setUpcomingHoliday(upcoming.length > 0 ? upcoming[0] : null);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);
    return () => clearInterval(timer);
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

  const currentHour = moment().hour();
  let greeting = "Welcome";
  if (currentHour < 12) greeting = "Good Morning";
  else if (currentHour < 18) greeting = "Good Afternoon";
  else greeting = "Good Evening";

  const displayName = employeeData?.firstName || user?.name || "Employee";

  return (
    <div className="page-wrapper">
      <div className="content">
        
        {/* Welcome Banner */}
        <div className="row mb-4">
          <div className="col-12">
            <div 
              className="card border-0 text-white rounded-3 overflow-hidden shadow-sm"
              style={{
                background: "linear-gradient(135deg, #4b2a85 0%, #2b1254 100%)",
                minHeight: "100px",
                position: "relative"
              }}
            >
              <div 
                className="card-body d-flex align-items-center position-relative"
                style={{ zIndex: 2 }}
              >
                <h3 className="text-white mb-0 fw-semibold">
                  {greeting} {displayName}!
                </h3>
              </div>
              {/* Abstract decorative background */}
              <div 
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "50%",
                  height: "100%",
                  opacity: 0.2,
                  backgroundImage: "url('/assets/img/bg/bg-abstract.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  zIndex: 1
                }}
              />
            </div>
          </div>
        </div>

        <div className="row">
          {/* Quick Access Column (Left) */}
          <div className="col-xl-3 col-lg-4 col-md-12 d-flex flex-column gap-3">
            <h6 className="text-muted fw-semibold mb-2">Quick Access</h6>

            {/* Inbox Widget */}
            <div className="card shadow-sm border-0 rounded-3">
              <div className="card-body">
                <h6 className="card-title fw-semibold text-muted mb-3">Inbox</h6>
                <div className="d-flex align-items-start justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <h2 className="mb-0 fw-bold" style={{ fontSize: "2.5rem" }}>0</h2>
                    <p className="text-muted mb-0 small" style={{ lineHeight: "1.2", maxWidth: "120px" }}>
                      Tasks waiting for your approval. Please click on take action for more details.
                    </p>
                  </div>
                  <button className="btn btn-sm text-white rounded-pill px-3" style={{ backgroundColor: "#4b2a85" }}>
                    Take Action
                  </button>
                </div>
              </div>
            </div>

            {/* Holidays Widget */}
            <div className="card shadow-sm border-0 rounded-3 position-relative overflow-hidden">
              <div className="card-body">
                <h6 className="card-title fw-semibold text-muted mb-4">Holidays</h6>
                {upcomingHoliday ? (
                  <>
                    <h5 className="mb-1 text-primary">{upcomingHoliday.title}</h5>
                    <p className="mb-0 text-muted small">{moment(upcomingHoliday.holidayDate).format("dddd, DD MMM YYYY")}</p>
                  </>
                ) : (
                  <h5 className="mb-2">No upcoming holidays</h5>
                )}
              </div>
              {/* Confetti decoration */}
              <div 
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "50px",
                  backgroundImage: "radial-gradient(#4b2a85 20%, transparent 20%), radial-gradient(#ff0000 20%, transparent 20%), radial-gradient(#00a651 20%, transparent 20%)",
                  backgroundSize: "10px 10px",
                  backgroundPosition: "0 0, 5px 5px, 2px 7px",
                  opacity: 0.1
                }}
              />
            </div>

            {/* On Leave Today Widget */}
            <div className="card shadow-sm border-0 rounded-3">
              <div className="card-body">
                <h6 className="card-title fw-semibold text-muted mb-4">On Leave Today</h6>
                {onLeaveToday.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {onLeaveToday.map((leave: any, idx: number) => (
                      <div key={idx} className="d-flex align-items-center gap-2 mb-2 w-100">
                        <img 
                          src={leave.employee?.profilePhotoUrl ? `${APP_CONFIG.getBackendUrl()}${leave.employee.profilePhotoUrl}` : "/assets/img/profiles/avatar-02.jpg"} 
                          alt="avatar" 
                          className="rounded-circle"
                          width="35" 
                          height="35" 
                          style={{ objectFit: "cover" }}
                        />
                        <div>
                          <h6 className="mb-0 small fw-semibold">{leave.employee?.user?.name || "Employee"}</h6>
                          <p className="mb-0 text-muted" style={{ fontSize: "10px" }}>{leave.leaveType?.name || "On Leave"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-1">Everyone is working today!</h6>
                      <p className="text-muted mb-0 small">No one is on leave today.</p>
                    </div>
                    <div className="text-primary opacity-25">
                      <i className="ti ti-check-circle" style={{ fontSize: "3rem" }}></i>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Time Today Widget */}
            <div className="card shadow-sm border-0 rounded-3 text-white overflow-hidden" style={{ backgroundColor: "#8263b6" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="card-title fw-semibold mb-0 text-white">
                    Time Today - {moment().format("ddd, DD MMM YYYY")}
                  </h6>
                  <span className="small text-white-50 cursor-pointer">View All</span>
                </div>
                <p className="small text-white-50 mb-1">CURRENT TIME</p>
                <div className="d-flex justify-content-between align-items-end">
                  <h1 className="display-4 fw-bold mb-0 text-white">
                    {currentTime.format("hh:mm")}
                    <span className="fs-5 fw-normal ms-1 text-white-50">{currentTime.format(".ss A")}</span>
                  </h1>
                  <button 
                    onClick={handlePunch}
                    className="btn btn-sm text-white rounded-pill px-3 shadow" 
                    style={{ backgroundColor: attendanceStatus?.isCheckedIn ? "#dc3545" : "#fd7e14" }}
                  >
                    {attendanceStatus?.isCheckedIn ? "Punch out" : "Punch in"}
                  </button>
                </div>

                <div className="mt-4 d-flex justify-content-between align-items-center text-white-50 small border-top border-white-10 pt-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <div>
                    <i className="ti ti-clock me-1"></i>
                    Punch In at <span className="text-white fw-medium">{attendanceStatus?.record?.checkIn ? moment(attendanceStatus.record.checkIn).format("hh:mm A") : "--:--"}</span>
                  </div>
                  <div>
                    <i className="ti ti-clock me-1"></i>
                    Punch Out at <span className="text-white fw-medium">{attendanceStatus?.record?.checkOut ? moment(attendanceStatus.record.checkOut).format("hh:mm A") : "--:--"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Balances Widget */}
            <div className="card shadow-sm border-0 rounded-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h6 className="card-title fw-semibold text-muted mb-0">Leave Balances</h6>
                  <Link to={all_routes.leaveemployee} className="small text-primary text-decoration-none">
                    Request Leave<br/>View All Balances
                  </Link>
                </div>
                
                <div className="d-flex flex-nowrap justify-content-between gap-3 align-items-start px-2 overflow-x-auto" style={{ paddingBottom: '0.5rem' }}>
                  {leaveBalances.length > 0 ? (
                    leaveBalances.slice(0, 4).map((balance: any, idx: number) => {
                      const percentage = balance.totalDays > 0 ? (balance.usedDays / balance.totalDays) * 100 : 0;
                      const radius = 24;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - (percentage / 100) * circumference;

                      return (
                        <div className="text-center flex-shrink-0" key={idx} style={{ width: "75px" }}>
                          <div className="position-relative mb-2 mx-auto" style={{ width: "65px", height: "65px" }}>
                            <svg width="65" height="65" viewBox="0 0 65 65" style={{ transform: "rotate(-90deg)" }}>
                              <circle 
                                cx="32.5" cy="32.5" r={radius} 
                                fill="transparent" 
                                stroke="#e9ecef" 
                                strokeWidth="5" 
                              />
                              <circle 
                                cx="32.5" cy="32.5" r={radius} 
                                fill="transparent" 
                                stroke="#0dcaf0" 
                                strokeWidth="5" 
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                              />
                            </svg>
                            <div className="position-absolute top-50 start-50 translate-middle w-100 d-flex flex-column align-items-center justify-content-center">
                              <span className="fw-bolder text-dark" style={{ fontSize: "14px", lineHeight: "1" }}>{balance.remainingDays}</span>
                            </div>
                          </div>
                          <span className="text-muted fw-bold text-uppercase d-block" style={{ fontSize: "10px", lineHeight: "1.2", wordWrap: "break-word" }}>
                            {balance.leaveTypeName}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center w-100 py-3 text-muted small">
                      No leave balances found.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>

          {/* Main Content Area (Right) */}
          <div className="col-xl-9 col-lg-8 col-md-12 d-flex flex-column gap-3">
            
            {/* Tabs */}
            <ul className="nav nav-pills gap-2 mb-2">
              <li className="nav-item">
                <a className="nav-link active bg-white text-dark shadow-sm rounded-pill px-4 fw-semibold border" href="#">Organization</a>
              </li>
              <li className="nav-item">
                <a className="nav-link bg-white text-muted shadow-sm rounded-pill px-4 border" href="#">
                  Operations &gt; {employeeData?.designation?.name || "Web Design"}
                </a>
              </li>
            </ul>

            {/* Social Feed & Organization Content */}
            <div className="tab-content w-100">
              <div className="tab-pane fade show active" id="organization" role="tabpanel">
                <div className="row">
                  <div className="col-xl-8 col-lg-9 col-md-12">
                    <SocialFeed />
                  </div>
                  <div className="col-xl-4 col-lg-3 d-none d-lg-block">
                    {/* Blank space for right side */}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      <CommonFooter />
    </div>
  );
};

export default EmployeeDashboard;
