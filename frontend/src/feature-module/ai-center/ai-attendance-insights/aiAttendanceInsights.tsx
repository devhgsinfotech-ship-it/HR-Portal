import { all_routes } from "@/router/all_routes";
import { Link } from "react-router";
import Modal from "./modal";
import ImageWithBasePath from "@/core/common/imageWithBasePath";
import RateChart from "./charts/rateChart";
import DayChart from "./charts/dayChart";
import WeeklyAttendanceChart from "./charts/weeklyAttendanceChart";
import AttendanceStatisticsChart from "./charts/attendanceStatisticsChart";
import AnalyticsDonutChart from "./charts/analyticsDonutChart";
import DepartmentChart from "./charts/departmentChart";

const AiAttendanceInsights = () => {
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">AI Attendance Insights</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">AI Center</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    AI Attendance Insights
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
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <Link to="#" className="btn btn-primary-gradient mb-2">
                <i className="ti ti-refresh me-2" />
                Run AI Scan
              </Link>
              <div className="ms-2 mb-2 head-icons">
                <Link
                  to="#"
                  className=""
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-bs-original-title="Collapse"
                  id="collapse-header"
                >
                  <i className="ti ti-chevrons-up" />
                </Link>
              </div>
            </div>
          </div>
          {/* End Breadcrumb */}
          <div className="row">
            <div className="col-xxl-6 d-flex flex-column">
              <div className="row flex-fill">
                <div className="col-sm-6 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3">
                        <div className="d-flex align-items-center">
                          <span className="py-2 px-1 rounded-pill bg-primary me-2">
                            <i className="ti ti-users-group fs-16" />
                          </span>
                          <p className="fs-12">Overall Rate</p>
                        </div>
                        <h3 className="card-title mb-0">91.4%</h3>
                      </div>
                      <div id="rate-chart" className="mb-3">
                        <RateChart />
                      </div>
                      <div className="d-flex align-items-center gap-1 flex-wrap">
                        <span className="badge badge-success-transparent">
                          2.3%
                          <i className="ti ti-arrow-up-right ms-1" />
                        </span>
                        <p> vs last month</p>
                      </div>
                    </div>
                  </div>
                </div>{" "}
                {/* end col */}
                <div className="col-sm-6 d-flex">
                  <div className="card flex-fill">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3">
                        <div className="d-flex align-items-center">
                          <span className="py-2 px-1 rounded-pill bg-secondary me-2">
                            <i className="ti ti-user-check fs-16" />
                          </span>
                          <p className="fs-12">Present Today</p>
                        </div>
                        <h3 className="card-title mb-0">774</h3>
                      </div>
                      <div id="day-chart" className="mb-3">
                        <DayChart />
                      </div>
                      <div className="d-flex align-items-center gap-1 flex-wrap">
                        <span className="badge badge-success-transparent">
                          4.2%
                          <i className="ti ti-arrow-up-right ms-1" />
                        </span>
                        <p>of workforce</p>
                      </div>
                    </div>
                  </div>
                </div>{" "}
                {/* end col */}
                <div className="col-sm-6 d-flex">
                  <div className="card bg-dark border-0 z-1 flex-fill">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                          <p className="fw-semibold text-white mb-1">
                            On Leave
                          </p>
                          <h3 className="main-title text-white">42</h3>
                        </div>
                        <span className="avatar rounded-circle bg-primary mb-2">
                          <i className="ti ti-user-cancel fs-20" />
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge badge-danger-transparent">
                          10.1%
                          <i className="ti ti-arrow-down-right ms-1" />
                        </span>
                        <p className="text-white">less vs last month</p>
                      </div>
                      <ImageWithBasePath
                        src="assets/img/bg/card-bg-06.png"
                        alt="bg"
                        className="img-fluid position-absolute top-0 end-0 z-n1 w-autp h-auto"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-sm-6 d-flex">
                  <div className="card bg-secondary border-0 z-1 flex-fill">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                          <p className="fw-semibold text-white mb-1">
                            Late Arrivals
                          </p>
                          <h3 className="main-title text-white">14</h3>
                        </div>
                        <span className="avatar rounded-circle bg-white mb-2">
                          <i className="ti ti-clock-hour-4 text-dark fs-20" />
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="badge badge-danger-transparent">
                          21.1%
                          <i className="ti ti-arrow-down-right ms-1" />
                        </span>
                        <p className="text-white">less vs last month</p>
                      </div>
                      <ImageWithBasePath
                        src="assets/img/bg/card-bg-06.png"
                        alt="bg"
                        className="img-fluid position-absolute top-0 end-0 z-n1 w-autp h-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Widget Info */}
            <div className="col-xxl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body pb-0">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <h3 className="sub-title mb-0">
                      Weekly Attendance Pattern
                    </h3>
                   <div className="dropdown">
                      <Link
                        to="#"
                        className="border btn btn-white btn-md fw-normal d-inline-flex align-items-center justify-content-center rounded gap-1 fw-medium"
                        data-bs-toggle="dropdown"
                      >
                        {" "}
                        <i className="ti ti-calendar fs-14" /> Weekly
                      </Link>
                      <ul className="dropdown-menu mt-2 p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Today
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Weekly
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Monthly
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <p className="text-dark mb-0">
                      <i className="ti ti-circle-filled fs-12 text-secondary me-1" />
                      Present
                    </p>
                    <p className="text-dark mb-0">
                      <i className="ti ti-circle-filled fs-12 text-secondary-500 me-1" />
                      Absent
                    </p>
                    <p className="text-dark mb-0">
                      <i className="ti ti-circle-filled fs-12 text-primary me-1" />
                      Late
                    </p>
                  </div>
                  <div id="weekly-attendance">
                    <WeeklyAttendanceChart/>
                  </div>
                </div>
              </div>
            </div>{" "}
            {/* end col */}
          </div>
          <div className="row">
            <div className="col-xxl-8 col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-body pb-0">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <h3 className="sub-title mb-0">Attendance Statistics</h3>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge border fs-14 fw-normal text-body">
                        <i className="ti ti-square-filled text-primary fs-12 me-1" />
                        Present
                      </span>
                      <span className="badge border fs-14 fw-normal text-body">
                        <i className="ti ti-square-filled text-secondary fs-12 me-1" />
                        Absent
                      </span>
                    </div>
                  <div className="dropdown">
  <a
    href="#"
    className="border btn btn-white btn-md d-inline-flex align-items-center"
    data-bs-toggle="dropdown"
  >
    <i className="ti ti-calendar me-1 fs-14" />
    2026
  </a>
  <ul className="dropdown-menu  dropdown-menu-end p-3">
    <li>
      <a href="#" className="dropdown-item rounded-1">
        2026
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        2025
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        2024
      </a>
    </li>
  </ul>
</div>

                  </div>
                  <div id="attendance-statistics">
                    <AttendanceStatisticsChart/>
                  </div>
                </div>
              </div>
            </div>{" "}
            {/* end col */}
            <div className="col-xxl-4 col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <h3>Detected Irregularities</h3>
                    <div className="dropdown">
  <a
    href="#"
    className="border btn btn-white btn-md d-inline-flex align-items-center"
    data-bs-toggle="dropdown"
  >
    <i className="ti ti-calendar me-1 fs-14" />
    Today
  </a>
  <ul className="dropdown-menu  dropdown-menu-end p-3">
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Today
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Weekly
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Monthly
      </a>
    </li>
  </ul>
</div>

                  </div>
                  <div className="vstack gap-3">
                    <div className="d-flex align-items-sm-center gap-3 ps-2 flex-column flex-sm-row border-start border-3 border-warning">
                      <div className="flex-shrink-0">
                        <p className="fw-medium text-dark mb-0">09:47 AM</p>
                      </div>
                      <div>
                        <p className="fw-semibold text-dark mb-1">
                          Repeated late pattern — R. Mehta
                        </p>
                        <p className="fs-13 mb-0">
                          4th consecutive late arrival this week (&gt;30 min)
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-sm-center gap-3 ps-2 flex-column flex-sm-row border-start border-3 border-danger">
                      <div className="flex-shrink-0">
                        <p className="fw-medium text-dark mb-0">09:47 AM</p>
                      </div>
                      <div>
                        <p className="fw-semibold text-dark mb-1">
                          Early departure cluster — Ops team
                        </p>
                        <p className="fs-13 mb-0">
                          3 members clocked out 2h early yesterday
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-sm-center gap-3 ps-2 flex-column flex-sm-row border-start border-3 border-info">
                      <div className="flex-shrink-0">
                        <p className="fw-medium text-dark mb-0">09:47 AM</p>
                      </div>
                      <div>
                        <p className="fw-semibold text-dark mb-1">
                          Overtime spike — Engineering
                        </p>
                        <p className="fs-13 mb-0">
                          Average 11.2 hrs/day — release week pattern
                        </p>
                      </div>
                    </div>
                    <div className="d-flex align-items-sm-center gap-3 ps-2 flex-column flex-sm-row border-start border-3 border-purple">
                      <div className="flex-shrink-0">
                        <p className="fw-medium text-dark mb-0">09:47 AM</p>
                      </div>
                      <div>
                        <p className="fw-semibold text-dark mb-1">
                          Untracked check-out — 3 employees
                        </p>
                        <p className="fs-13 mb-0">
                          No exit scan recorded on 13 May
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-linear-gradient-100 overflow-hidden border-0 z-1">
            <div className="card-body p-4 p-md-5 d-flex align-items-center justify-content-md-between justify-content-center text-center text-md-start gap-3 flex-column flex-md-row">
              <div>
                <h3 className="text-white mb-1">
                  Real-Time Attendance Dashboard
                </h3>
                <p className="text-white mb-3">
                  Monitor live check-ins, track patterns, and receive instant
                  alerts
                </p>
                <Link
                  to="#"
                  className="border btn btn-white btn-md d-inline-flex align-items-center"
                >
                  View Realtime Dashboard
                  <i className="ti ti-arrow-right ms-2" />
                </Link>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 rounded text-center bg-white-100">
                  <h3 className="text-white mb-1">242</h3>
                  <p className="text-white">Checked In</p>
                </div>
                <div className="p-3 rounded text-center bg-white-100">
                  <h3 className="text-white mb-1">8</h3>
                  <p className="text-white">Pending</p>
                </div>
              </div>
              <ImageWithBasePath
                src="assets/img/bg/card-bg-07.png"
                alt="bg"
                className="img-fluid position-absolute top-0 start-50 translate-middle-x z-n1 w-auto h-auto"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-xxl-6 col-xl-7 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between flex-wrap mb-3 gap-2">
                    <h3 className="sub-title mb-0">Absenteeism Analysis</h3>
                    <div className="dropdown">
  <a
    href="#"
    className="border btn btn-white btn-md fw-normal d-inline-flex align-items-center justify-content-center rounded gap-1 fw-medium"
    data-bs-toggle="dropdown"
  >
    {" "}
    <i className="ti ti-calendar fs-14" /> Weekly
  </a>
  <ul className="dropdown-menu mt-2 p-3">
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Today
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Weekly
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Monthly
      </a>
    </li>
  </ul>
</div>

                  </div>
                  <div className="row align-items-center">
                    <div className="col-sm-6">
                      <div className="vstack gap-3 me-sm-4">
                        <div className="bg-primary-linear-gradient d-flex align-items-center justify-content-between p-2 rounded">
                          <p className="text-dark d-inline-flex align-items-center mb-0">
                            <i className="ti ti-square-filled text-primary fs-16 me-1" />
                            Emergency
                          </p>
                          <span className="badge bg-white  text-dark">
                            42&nbsp;cases
                          </span>
                        </div>
                        <div className="bg-warning-linear-gradient d-flex align-items-center justify-content-between p-2 rounded">
                          <p className="text-dark d-inline-flex align-items-center mb-0">
                            <i className="ti ti-square-filled text-warning fs-16 me-1" />
                            Vacation
                          </p>
                          <span className="badge bg-white  text-dark">
                            28&nbsp;cases
                          </span>
                        </div>
                        <div className="bg-success-linear-gradient d-flex align-items-center justify-content-between p-2 rounded">
                          <p className="text-dark d-inline-flex align-items-center mb-0">
                            <i className="ti ti-square-filled text-success fs-16 me-1" />
                            Personal
                          </p>
                          <span className="badge bg-white  text-dark">
                            42&nbsp;cases
                          </span>
                        </div>
                        <div className="bg-info-linear-gradient d-flex align-items-center justify-content-between p-2 rounded">
                          <p className="text-dark d-inline-flex align-items-center mb-0">
                            <i className="ti ti-square-filled text-info fs-16 me-1" />
                            Sick Leave
                          </p>
                          <span className="badge bg-white  text-dark">
                            42&nbsp;cases
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div id="analytics-chart">
                        <AnalyticsDonutChart/>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded border d-flex align-items-center gap-2 mt-3">
                    <div className="avatar bg-light border avatar-rounded flex-shrink-0">
                      <i className="ti ti-thumb-up-filled fs-24 text-primary" />
                    </div>
                    <div>
                      <p className="mb-1">Absence Reasons Breakdown</p>
                      <p className="text-dark">
                        Sick leave accounts for 38% of absences. Consider
                        wellness programs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-6 col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between flex-wrap mb-3 gap-2">
                    <h3 className="sub-title mb-0">
                      On-Time &amp; Late Department
                    </h3>
                   <div className="dropdown">
  <a
    href="#"
    className="border btn btn-white btn-md d-inline-flex align-items-center"
    data-bs-toggle="dropdown"
  >
    <i className="ti ti-calendar me-1 fs-14" />
    Today
  </a>
  <ul className="dropdown-menu  dropdown-menu-end p-3">
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Today
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Weekly
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Monthly
      </a>
    </li>
  </ul>
</div>

                  </div>
                  <div id="department-chart">
                    <DepartmentChart/>
                  </div>
                  <div className="bg-info-transparent p-2 rounded border border-info">
                    <p className="text-info fw-medium">
                      Support team leads with 97% arrival rate.
                    </p>
                  </div>
                </div>
              </div>
            </div>{" "}
            {/* end col */}
          </div>
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <h3 className="sub-title mb-0">AI Predictions &amp; Alerts</h3>
               <div className="dropdown">
  <a
    href="#"
    className="border btn btn-white btn-md d-inline-flex align-items-center"
    data-bs-toggle="dropdown"
  >
    <i className="ti ti-calendar me-1 fs-14" />
    Today
  </a>
  <ul className="dropdown-menu  dropdown-menu-end p-3">
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Today
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Weekly
      </a>
    </li>
    <li>
      <a href="#" className="dropdown-item rounded-1">
        Monthly
      </a>
    </li>
  </ul>
</div>

              </div>
              <div className="row g-4 justify-content-center">
                <div className="col-xl-4 col-md-6 d-flex">
                  <div className="card border-bottom border-bottom-5 border-bottom-secondary mb-0 flex-fill">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="avatar avatar-xl rounded-circle bg-primary border border-8 border-primary-transparent">
                          <i className="ti ti-refresh fs-20" />
                        </span>
                        <div className="dropdown">
                          <Link
                            to="#"
                            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center p-0 rounded-pill"
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical" />
                          </Link>
                          <ul className="dropdown-menu  dropdown-menu-end p-3">
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                View
                              </Link>
                            </li>
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                Delete
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <h5 className="mb-1">Predicted Absence Spike</h5>
                      <p className="mb-3">
                        15% increase in absences expected next Friday (May 21).
                        Likely due to holiday weekend.
                      </p>
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <span className="badge badge-xs badge-secondary-transparent">
                          85% Confidence
                        </span>
                        <span className="badge badge-xs badge-secondary-transparent">
                          7 days ahead
                        </span>
                      </div>
                    </div>
                  </div>
                </div>{" "}
                {/* enc col */}
                <div className="col-xl-4 col-md-6 d-flex">
                  <div className="card border-bottom border-bottom-5 border-bottom-purple mb-0 flex-fill">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="avatar avatar-xl rounded-circle bg-secondary border border-8 border-secondary-transparent">
                          <i className="ti ti-server-bolt fs-20" />
                        </span>
                        <div className="dropdown">
                          <Link
                            to="#"
                            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center p-0 rounded-pill"
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical" />
                          </Link>
                          <ul className="dropdown-menu  dropdown-menu-end p-3">
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                View
                              </Link>
                            </li>
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                Delete
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <h5 className="mb-1">Optimal Attendance Period</h5>
                      <p className="mb-3">
                        Tuesday-Thursday shows consistently high attendance.
                        Schedule critical meetings window.
                      </p>
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <span className="badge badge-xs badge-purple-transparent">
                          High Priority
                        </span>
                        <span className="badge badge-xs badge-purple-transparent">
                          Actionable
                        </span>
                      </div>
                    </div>
                  </div>
                </div>{" "}
                {/* enc col */}
                <div className="col-xl-4 col-md-6 d-flex">
                  <div className="card border-bottom border-bottom-5 border-bottom-danger mb-0 flex-fill">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="avatar avatar-xl rounded-circle bg-dark border border-8 border-dark-transparent">
                          <i className="ti ti-user-pause fs-20" />
                        </span>
                        <div className="dropdown">
                          <Link
                            to="#"
                            className="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center p-0 rounded-pill"
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical" />
                          </Link>
                          <ul className="dropdown-menu  dropdown-menu-end p-3">
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                View
                              </Link>
                            </li>
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                Delete
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <h5 className="mb-1">Late Arrival Pattern Alert</h5>
                      <p className="mb-3">
                        Development team shows 12% late arrival rate, up from 8%
                        last month. Traffic or scheduling issue?
                      </p>
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <span className="badge badge-xs badge-danger-transparent">
                          Manager Action Needed
                        </span>
                        <span className="badge badge-xs badge-danger-transparent">
                          30-day trend
                        </span>
                      </div>
                    </div>
                  </div>
                </div>{" "}
                {/* enc col */}
              </div>
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
      <Modal />
    </>
  );
};

export default AiAttendanceInsights;
