import ImageWithBasePath from "@/core/common/imageWithBasePath";
import { all_routes } from "@/router/all_routes";
import { Link } from "react-router";
import HiringTimelineChart from "./charts/hiringTimelineChart";
import PipelineOverviewChart from "./charts/pipelineOverviewChart";
import StatisticsChart from "./charts/statisticsChart";
import BudgetAllocationChart from "./charts/budgetAllocationChart";
import RoleDemandChart from "./charts/roleDemandChart";

const AiHiringForecast = () => {
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">AI Hiring Forecast</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">AI Center</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    AI Hiring Forecast
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-3">
              <div className="dropdown">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  {" "}
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
              <Link
                to="#"
                className="btn btn-primary-gradient d-inline-flex align-items-center gap-2"
              >
                {" "}
                <i className="ti ti-repeat" /> Update Forecast
              </Link>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* start row */}
          <div className="row row-gap-4 mb-4">
            {/* Start Hiring Timeline Forecast */}
            <div className="col-lg-12">
              <div className="card mb-0">
                <div className="card-body pb-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                    <h2 className="mb-0 card-title">
                      Hiring Timeline Forecast
                    </h2>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="border btn btn-white btn-md d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1 fs-14" />
                        2026
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            2026
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            2025
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            2024
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
                    <div className="d-flex align-items-center gap-sm-4 gap-2 flex-wrap">
                      <div className="border rounded p-3">
                        <p className="mb-2">Avaerage Actual Hire </p>
                        <h3 className="mb-0 fs-20 fw-semibold text-primary">
                          169
                        </h3>
                      </div>
                      <div className="border rounded p-3">
                        <p className="mb-2">Average Predicted Hire</p>
                        <h3 className="mb-0 fs-20 fw-semibold text-secondary">
                          215
                        </h3>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <p className="d-flex align-items-center gap-1 text-dark mb-0">
                        <i className="ti ti-circle-filled text-primary fs-13" />{" "}
                        Actual Hires
                      </p>
                      <p className="d-flex align-items-center gap-1 text-dark mb-0">
                        <i className="ti ti-square-rounded-filled text-secondary fs-13" />
                        Predicted Hires
                      </p>
                    </div>
                  </div>
                  {/* Hiring chart */}
                  <div id="hiring-timline-chart">
                    <HiringTimelineChart />
                  </div>
                </div>
              </div>
            </div>
            {/* End Hiring Timeline Forecast */}
            {/* Start Hiring Statistics */}
            <div className="col-xxl-7 col-xl-8 d-flex">
              <div className="card mb-0 flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                    <h2 className="mb-0 card-title">Hiring Statistics</h2>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="border btn btn-white btn-md d-inline-flex align-items-center gap-2"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-chart-arrows-vertical" />
                        Q3
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Q3
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Q2
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Q1
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* start row */}
                  <div className="row row-gap-4">
                    {/* Item 1 */}
                    <div className="col-sm-6">
                      <div className="card mb-0">
                        <div className="card-body">
                          <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
                            <div className="avatar avatar-lg bg-primary rounded-circle flex-shrink-0">
                              <i className="ti ti-users-group text-white fs-24" />
                            </div>
                            <div>
                              <p className="mb-1">Q3 Headcount Need</p>
                              <div className="d-flex align-items-center gap-2">
                                <h3 className="text-dark mb-0">+23 </h3>
                                <div className="d-inline-flex align-items-center bg-light border rounded-pill text-dark p-1 ps-2">
                                  {" "}
                                  +4
                                  <span className="bg-success btn-icon btn-sm rounded-circle d-flex align-items-center justify-content-center ms-1">
                                    <i className="ti ti-arrow-up-right fs-20" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div id="statistics-chart">
                            <StatisticsChart
                              color="#F26522"
                              data={[2, 18, 20, 22, 22, 38, 42, 42]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Item 2 */}
                    <div className="col-sm-6">
                      <div className="card mb-0">
                        <div className="card-body">
                          <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
                            <div className="avatar avatar-lg bg-secondary rounded-circle flex-shrink-0">
                              <i className="ti ti-info-octagon text-white fs-24" />
                            </div>
                            <div>
                              <p className="mb-1">Attrition Risk</p>
                              <div className="d-flex align-items-center gap-2">
                                <h3 className="text-dark mb-0">7.2% </h3>
                                <div className="d-inline-flex align-items-center bg-light border rounded-pill text-dark p-1 ps-2">
                                  {" "}
                                  +18%
                                  <span className="bg-success btn-icon btn-sm rounded-circle d-flex align-items-center justify-content-center ms-1">
                                    <i className="ti ti-arrow-up-right fs-20" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div id="statistics-chart-two">
                            <StatisticsChart
                              color="#0C4B5E"
                              data={[4, 16, 18, 30, 32, 40, 38, 42]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Item 3 */}
                    <div className="col-sm-6">
                      <div className="card mb-0">
                        <div className="card-body">
                          <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
                            <div className="avatar avatar-lg bg-purple rounded-circle flex-shrink-0">
                              <i className="ti ti-briefcase text-white fs-24" />
                            </div>
                            <div>
                              <p className="mb-1">Open Roles</p>
                              <div className="d-flex align-items-center gap-2">
                                <h3 className="text-dark mb-0">18 </h3>
                                <div className="d-inline-flex align-items-center bg-light border rounded-pill text-dark p-1 ps-2">
                                  -16%
                                  <span className="bg-danger btn-icon btn-sm rounded-circle d-flex align-items-center justify-content-center ms-1">
                                    <i className="ti ti-arrow-down-right fs-20" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div id="statistics-chart-three">
                            <StatisticsChart
                              color="#AB47BC"
                              data={[4, 20, 30, 35, 20, 25, 38, 42]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Item 4 */}
                    <div className="col-sm-6">
                      <div className="card mb-0">
                        <div className="card-body">
                          <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
                            <div className="avatar avatar-lg bg-info rounded-circle flex-shrink-0">
                              <i className="ti ti-file-search text-white fs-24" />
                            </div>
                            <div>
                              <p className="mb-1">Offer Accept Rate</p>
                              <div className="d-flex align-items-center gap-2">
                                <h3 className="text-dark mb-0">83% </h3>
                                <div className="d-inline-flex align-items-center bg-light border rounded-pill text-dark p-1 ps-2">
                                  {" "}
                                  +8%
                                  <span className="bg-success btn-icon btn-sm rounded-circle d-flex align-items-center justify-content-center ms-1">
                                    <i className="ti ti-arrow-up-right fs-20" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div id="statistics-chart-four">
                            <StatisticsChart
                              color="#1B84FF"
                              data={[8, 22, 34, 33, 25, 32, 38, 50]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* End Hiring Statistics */}
            {/* Start Pipeline Overview */}
            <div className="col-xxl-5 col-xl-4 d-flex">
              <div className="card mb-0 flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                    <h2 className="mb-0 card-title">
                      Hiring Pipeline Overview
                    </h2>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="border btn btn-light btn-icon btn-sm d-inline-flex align-items-center justify-content-center rounded-circle"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-dots-vertical fs-16" />
                      </Link>
                      <ul className="dropdown-menu mt-2 p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Monthly
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
                            Today
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div id="pipeline-overview-chart">
                    <PipelineOverviewChart />
                  </div>
                  <div className="pipeline-value">
                    <div className="value position-relative d-flex align-items-center justify-content-between text-dark">
                      <p className="d-flex align-items-center gap-2 mb-0">
                        <span className="bg-primary line" /> Applied{" "}
                      </p>
                      <span className="fs-20 fw-semibold">59%</span>
                    </div>
                    <div className="value position-relative d-flex align-items-center justify-content-between text-dark">
                      <p className="d-flex align-items-center gap-2 mb-0">
                        <span className="bg-secondary line" /> Screening{" "}
                      </p>
                      <span className="fs-20 fw-semibold">21%</span>
                    </div>
                    <div className="value position-relative d-flex align-items-center justify-content-between text-dark">
                      <p className="d-flex align-items-center gap-2 mb-0">
                        <span className="bg-warning line" /> Interview{" "}
                      </p>
                      <span className="fs-20 fw-semibold">12%</span>
                    </div>
                    <div className="value position-relative d-flex align-items-center justify-content-between text-dark">
                      <p className="d-flex align-items-center gap-2 mb-0">
                        <span className="bg-success line" /> Accepted{" "}
                      </p>
                      <span className="fs-20 fw-semibold">8%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* End Pipeline Overview */}
            {/* Start Open Role Pipeline */}
            <div className="col-xxl-8 col-xl-12 d-flex">
              <div className="card mb-0 flex-fill">
                <div className="card-body p-0">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 my-3 px-4">
                    <h2 className="mb-0 card-title">Open Role Pipeline</h2>
                    <Link
                      to="#"
                      className="border btn btn-light btn-icon btn-sm d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="ti ti-arrow-up-right fs-16" />
                    </Link>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-nowrap mb-0">
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>Department</th>
                          <th>Urgency</th>
                          <th>Openings</th>
                          <th>Pipeline fill</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <p className="fw-semibold mb-0">
                              <Link to={all_routes.projectdetails}>
                                Office Management App
                              </Link>
                            </p>
                          </td>
                          <td>
                            <p className="fw-medium mb-0">Engineering</p>
                          </td>
                          <td>
                            <span className="badge bg-outline-danger d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Critical
                            </span>
                          </td>
                          <td>2</td>
                          <td>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={40}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary progress-bar-striped"
                                style={{ width: "90%" }}
                              />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p className="fw-semibold mb-0">
                              <Link to={all_routes.projectdetails}>
                                Sales Executive
                              </Link>
                            </p>
                          </td>
                          <td>
                            <p className="fw-medium mb-0">Sales</p>
                          </td>
                          <td>
                            <span className="badge bg-outline-purple d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              High
                            </span>
                          </td>
                          <td>5</td>
                          <td>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={40}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-purple progress-bar-striped"
                                style={{ width: "60%" }}
                              />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p className="fw-semibold mb-0">
                              <Link to={all_routes.projectdetails}>
                                Product Designer
                              </Link>
                            </p>
                          </td>
                          <td>
                            <p className="fw-medium mb-0">Product</p>
                          </td>
                          <td>
                            <span className="badge bg-outline-info d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Planned
                            </span>
                          </td>
                          <td>3</td>
                          <td>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={40}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-info progress-bar-striped"
                                style={{ width: "78%" }}
                              />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p className="fw-semibold mb-0">
                              <Link to={all_routes.projectdetails}>
                                Data Analyst
                              </Link>
                            </p>
                          </td>
                          <td>
                            <p className="fw-medium mb-0">Operations</p>
                          </td>
                          <td>
                            <span className="badge bg-outline-purple d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              High
                            </span>
                          </td>
                          <td>6</td>
                          <td>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={40}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-purple progress-bar-striped"
                                style={{ width: "85%" }}
                              />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p className="fw-semibold mb-0">
                              <Link to={all_routes.projectdetails}>
                                HR Business Partner
                              </Link>
                            </p>
                          </td>
                          <td>
                            <p className="fw-medium mb-0">HR &amp; Admin</p>
                          </td>
                          <td>
                            <span className="badge bg-outline-success d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Low
                            </span>
                          </td>
                          <td>3</td>
                          <td>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={40}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-success progress-bar-striped"
                                style={{ width: "95%" }}
                              />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p className="fw-semibold mb-0">
                              <Link to={all_routes.projectdetails}>
                                Digital Marketing Specialist
                              </Link>
                            </p>
                          </td>
                          <td>
                            <p className="fw-medium mb-0">Marketing</p>
                          </td>
                          <td>
                            <span className="badge bg-outline-danger d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Critical
                            </span>
                          </td>
                          <td>2</td>
                          <td>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={40}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary progress-bar-striped"
                                style={{ width: "90%" }}
                              />
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p className="fw-semibold mb-0">
                              <Link to={all_routes.projectdetails}>
                                Business Analyst
                              </Link>
                            </p>
                          </td>
                          <td>
                            <p className="fw-medium mb-0">Operations</p>
                          </td>
                          <td>
                            <span className="badge bg-outline-info d-inline-flex align-items-center badge-xs">
                              <i className="ti ti-point-filled me-1" />
                              Planned
                            </span>
                          </td>
                          <td>5</td>
                          <td>
                            <div
                              className="progress progress-xs w-100"
                              role="progressbar"
                              aria-valuenow={40}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-info progress-bar-striped"
                                style={{ width: "95%" }}
                              />
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            {/* End Open Role Pipeline */}
            {/* Start Budget Allocation by Department */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card mb-0 flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                    <h2 className="mb-0 card-title">
                      Budget Allocation by Department
                    </h2>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="border btn btn-light btn-icon btn-sm d-inline-flex align-items-center justify-content-center rounded-circle"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-dots-vertical fs-16" />
                      </Link>
                      <ul className="dropdown-menu mt-2 p-3">
                        <li>
                          <Link
                            to="#"
                            className="dropdown-item rounded-1"
                          >
                            Monthly
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
                            Today
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <p className="d-flex align-items-center gap-1 text-dark mb-0">
                      <i className="ti ti-square-rounded-filled text-primary fs-13" />{" "}
                      Used
                    </p>
                    <p className="d-flex align-items-center gap-1 text-dark mb-0">
                      <i className="ti ti-square-rounded-filled text-light fs-13" />
                      Available&nbsp;
                    </p>
                  </div>
                  <div id="budget-allocation-chart">
                    <BudgetAllocationChart/>
                  </div>
                </div>
              </div>
            </div>
            {/* End Budget Allocation by Department */}
            {/* Start Role Demand Forecast */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card mb-0 flex-fill">
                <div className="card-body">
                  <div className="mb-4">
                    <h2 className="mb-0 card-title">Role Demand Forecast</h2>
                  </div>
                  <div id="role-demand-chart">
                    <RoleDemandChart/>
                  </div>
                  <p className="d-flex align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom-dashed">
                    Backend Dev <span className="badge bg-success">32%</span>
                  </p>
                  <p className="d-flex align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom-dashed">
                    Sales Rep <span className="badge bg-purple">24%</span>
                  </p>
                  <p className="d-flex align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom-dashed">
                    Designer <span className="badge bg-warning">24%</span>
                  </p>
                  <p className="d-flex align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom-dashed">
                    Support <span className="badge bg-info">20%</span>
                  </p>
                  <p className="d-flex align-items-center justify-content-between gap-2 mb-0 pb-0">
                    Engineer <span className="badge bg-primary">10%</span>
                  </p>
                </div>
              </div>
            </div>
            {/* End Role Demand Forecast */}
            {/* Start AI Hiring Predictions */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card mb-0 flex-fill">
                <div className="card-body">
                  <div className="mb-4">
                    <h2 className="mb-0 card-title">AI Hiring Predictions</h2>
                  </div>
                  {/* Item 1 */}
                  <div className="card bg-info border-info mb-4">
                    <div className="card-body">
                      <h3 className="fs-16 fw-semibold text-white mb-2">
                        High-Demand Alert: Frontend Developers
                      </h3>
                      <p className="fs-13 mb-4 text-white">
                        Predicted need for 6 frontend developers by Q3. Market
                        competition increasing. Recommend starting recruitment
                        now
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-white p-2 text-dark">
                          Manager Action Needed
                        </span>
                        <span className="badge bg-white p-2 text-dark">
                          30-day trend
                        </span>
                      </div>
                    </div>
                    <ImageWithBasePath
                      src="assets/img/icons/star.svg"
                      alt="star-icon"
                      className="img-fluid w-25 position-absolute bottom-0 end-0"
                    />
                  </div>
                  {/* Item 2 */}
                  <div className="card bg-purple border-purple mb-0">
                    <div className="card-body">
                      <h3 className="fs-16 fw-semibold text-white mb-2">
                        Budget Optimization
                      </h3>
                      <p className="fs-13 mb-4 text-white">
                        Development budget under-utilized by $35K. Recommend
                        accelerating senior engineer hiring or increasing
                        referral bonuses.
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-white p-2 text-dark">
                          High Priority
                        </span>
                        <span className="badge bg-white p-2 text-dark">
                          Actionable
                        </span>
                      </div>
                    </div>
                    <ImageWithBasePath
                      src="assets/img/icons/star.svg"
                      alt="star-icon"
                      className="img-fluid w-25 position-absolute bottom-0 end-0"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* End AI Hiring Predictions */}
            {/* Start Active Position */}
            <div className="col-xxl-4 col-xl-6 d-flex">
              <div className="card mb-0 flex-fill">
                <div className="card-body">
                  <div className="mb-4">
                    <h2 className="mb-0 card-title">Active Position</h2>
                  </div>
                  {/* Item 1 */}
                  <div className="bg-success-gradient-100 rounded p-2 d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
                    <div>
                      <h3 className="fs-14 mb-2">Product Manager</h3>
                      <div className="d-flex align-items-center gap-2">
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-users fw-medium text-gray-7" />
                          15 Applicants
                        </p>
                        <span className="inner-line" />
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-clock-edit fw-medium text-gray-7" />
                          3 Interview
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-success d-inline-flex align-items-center">
                      <i className="ti ti-point-filled me-1" />
                      Active
                    </span>
                  </div>
                  {/* Item 2 */}
                  <div className="bg-success-gradient-100 rounded p-2 d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
                    <div>
                      <h3 className="fs-14 mb-2">QA Analyst</h3>
                      <div className="d-flex align-items-center gap-2">
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-users fw-medium text-gray-7" />
                          12 Applicants
                        </p>
                        <span className="inner-line" />
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-clock-edit fw-medium text-gray-7" />
                          2 Interview
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-success d-inline-flex align-items-center">
                      <i className="ti ti-point-filled me-1" />
                      Active
                    </span>
                  </div>
                  {/* Item 3 */}
                  <div className="bg-success-gradient-100 rounded p-2 d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
                    <div>
                      <h3 className="fs-14 mb-2">DevOps Engineer</h3>
                      <div className="d-flex align-items-center gap-2">
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-users fw-medium text-gray-7" />
                          16 Applicants
                        </p>
                        <span className="inner-line" />
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-clock-edit fw-medium text-gray-7" />
                          5 Interview
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-success d-inline-flex align-items-center">
                      <i className="ti ti-point-filled me-1" />
                      Active
                    </span>
                  </div>
                  {/* Item 4 */}
                  <div className="bg-danger-gradient-100 rounded p-2 d-flex align-items-center justify-content-between gap-2 flex-wrap mb-3">
                    <div>
                      <h3 className="fs-14 mb-2">Data Scientist</h3>
                      <div className="d-flex align-items-center gap-2">
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-users fw-medium text-gray-7" />
                          18 Applicants
                        </p>
                        <span className="inner-line" />
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-clock-edit fw-medium text-gray-7" />
                          4 Interview
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-danger d-inline-flex align-items-center">
                      <i className="ti ti-point-filled me-1" />
                      Closed
                    </span>
                  </div>
                  {/* Item 5 */}
                  <div className="bg-success-gradient-100 rounded p-2 d-flex align-items-center justify-content-between gap-2 flex-wrap">
                    <div>
                      <h3 className="fs-14 mb-2">UX Designer</h3>
                      <div className="d-flex align-items-center gap-2">
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-users fw-medium text-gray-7" />
                          22 Applicants
                        </p>
                        <span className="inner-line" />
                        <p className="mb-0 d-flex align-items-center gap-1">
                          {" "}
                          <i className="ti ti-clock-edit fw-medium text-gray-7" />
                          6 Interview
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-purple d-inline-flex align-items-center">
                      <i className="ti ti-point-filled me-1" />
                      Interview
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* End Active Position */}
          </div>
          {/* end row */}
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

export default AiHiringForecast;
