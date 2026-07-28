import ImageWithBasePath from "@/core/common/imageWithBasePath"
import { all_routes } from "@/router/all_routes"
import { Link } from "react-router"
import PerformanceChart from "./chart/performanceChart"
import ProductivityChart from "./chart/productivityChart"
import TeamPerformanceChart from "./chart/teamPerformanceChart"
import EngagementChart from "./chart/engagementChart"
import GoalsChart from "./chart/goalsChart"
import PerformanceProductivityEngagementChart from "./chart/performanceProductivityEngagementChart"
import ProductivityQualityChart from "./chart/productivityQualityChart"
import TeamCollaborationChart from "./chart/teamCollaborationChart"
import GoalCompletionChart from "./chart/goalCompletionChart"
import ProductivityQualityMetricsChart from "./chart/productivityQualityMetricsChart"
import SkillAssessmentChart from "./chart/skillAssessmentChart"


const AiTeamPerformanceInsights = () => {
  return (
   <>
  {/* Page Wrapper */}
  <div className="page-wrapper">
    <div className="content">
      {/* Breadcrumb */}
      <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
        <div className="my-auto mb-2">
          <h2 className="mb-1">AI Team Performance Insights</h2>
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to={all_routes.adminDashboard}>
                  <i className="ti ti-smart-home" />
                </Link>
              </li>
              <li className="breadcrumb-item">AI Center</li>
              <li className="breadcrumb-item active" aria-current="page">
                AI Team Performance Insights
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
            <i className="ti ti-repeat" /> Deep Analysis
          </Link>
        </div>
      </div>
      {/* /Breadcrumb */}
      {/* start row */}
      <div className="row row-gap-4 mb-4">
        {/* Start Overall Performance */}
        <div className="col-xxl-5 col-xl-12 d-flex">
          <div className="card w-100 flex-fill mb-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-4">
                <div>
                  <p className="mb-1">Overall Performance</p>
                  <h3 className="mb-0 fs-24 fw-bold">89.8</h3>
                </div>
                <div className="avatar avatar-lg bg-secondary rounded">
                  <i className="ti ti-users-plus fs-20" />
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between gap-5 flex-lg-nowrap mb-4 pb-4 border-bottom">
                <div className="w-100 d-flex align-items-center justify-content-between gap-2 flex-wrap">
                  <p className="mb-0 d-flex align-items-center justify-content-between gap-2 flex-wrap w-100">
                    Team Average{" "}
                    <span className="fw-semibold fs-16 text-dark">89%</span>{" "}
                  </p>
                  <div className="w-100" id="performance-chart" >
                    <PerformanceChart/>
                  </div>
                </div>
                <div className="d-inline-flex align-items-center bg-light border rounded-pill text-dark p-1 ps-2">
                  {" "}
                  +4%
                  <span className="bg-success btn-icon btn-sm rounded-circle d-flex align-items-center justify-content-center ms-1">
                    <i className="ti ti-arrow-up-right fs-20" />
                  </span>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between gap-lg-2 gap-4 flex-lg-nowrap flex-wrap">
                <div className="text-center">
                  <p className="mb-1">Employees</p>
                  <h4 className="mb-0 fs-24 fw-bold">250</h4>
                </div>
                <div className="text-center">
                  <p className="mb-1">Top Performers</p>
                  <h4 className="mb-0 fs-24 fw-bold">38</h4>
                </div>
                <div className="text-center">
                  <p className="mb-1">Teams Tracked</p>
                  <h4 className="mb-0 fs-24 fw-bold">12</h4>
                </div>
                <div className="text-center">
                  <p className="mb-1">Engagement</p>
                  <h4 className="mb-0 fs-24 fw-bold">4.6/5</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Overall Performance */}
        {/* Start Productivity */}
        <div className="col-xxl-7 col-xl-12 d-flex">
          <div className="card w-100 mb-0">
            <div className="card-body p-0">
              {/* start row */}
              <div className="row g-0">
                <div className="col-lg-6 col-md-6">
                  <div className="bg-white p-4 border-bottom border-end">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                      <div>
                        <p className="mb-1">Team Productivity</p>
                        <h4 className="mb-0 fs-24 fw-bold">94%</h4>
                      </div>
                      <div id="productivity-chart">
                        <ProductivityChart/>
                      </div>
                    </div>
                    <p className="d-flex align-items-center gap-1">
                      <span className="badge bg-success-transparent rounded">
                        2.3%
                        <i className="ti ti-arrow-up-right ms-1" />
                      </span>
                      vs last month
                    </p>
                  </div>
                </div>
                <div className="col-lg-6 col-md-6">
                  <div className="bg-white p-4 border-bottom">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                      <div>
                        <p className="mb-1">Top Performers</p>
                        <h4 className="mb-0 fs-24 fw-bold">94%</h4>
                      </div>
                      <div id="performers-chart">
                        <TeamPerformanceChart/>
                      </div>
                    </div>
                    <p className="d-flex align-items-center gap-1">
                      <span className="badge bg-success-transparent rounded">
                        +5 members
                        <i className="ti ti-arrow-up-right ms-1" />
                      </span>
                      vs last month
                    </p>
                  </div>
                </div>
                <div className="col-lg-6 col-md-6">
                  <div className="bg-white p-4 border-end">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                      <div>
                        <p className="mb-1">Engagement Score</p>
                        <h4 className="mb-0 fs-24 fw-bold">4.6/5</h4>
                      </div>
                      <div id="engagement-chart">
                        <EngagementChart/>
                      </div>
                    </div>
                    <p className="d-flex align-items-center gap-1">
                      <span className="badge bg-success-transparent rounded">
                        +0.3%
                        <i className="ti ti-arrow-up-right ms-1" />
                      </span>
                      vs last month
                    </p>
                  </div>
                </div>
                <div className="col-lg-6 col-md-6">
                  <div className="bg-white p-4">
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                      <div>
                        <p className="mb-1">Goals Completed</p>
                        <h4 className="mb-0 fs-24 fw-bold">94%</h4>
                      </div>
                      <div id="goals-chart">
                        <GoalsChart/>
                      </div>
                    </div>
                    <p className="d-flex align-items-center gap-1">
                      <span className="badge bg-danger-transparent rounded">
                        -12%
                        <i className="ti ti-arrow-down-right ms-1" />
                      </span>
                      vs last month
                    </p>
                  </div>
                </div>
              </div>
              {/* End row */}
            </div>
          </div>
        </div>
        {/* End Productivity */}
        {/* Start Engagement */}
        <div className="col-xxl-12 col-xl-12 d-flex">
          <div className="card w-100 mb-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <h2 className="mb-0 card-title">
                  Performance, Productivity &amp; Engagement
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
              <div id="performance-productivity-engagement-chart">
                <PerformanceProductivityEngagementChart/>
              </div>
            </div>
          </div>
        </div>
        {/* End Engagement */}
        {/* Start AI Hiring Predictions */}
        <div className="col-xxl-12 col-xl-12 d-flex">
          <div className="card w-100 mb-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <h2 className="mb-0 card-title">AI Hiring Predictions</h2>
                <Link
                  to="#"
                  className="border btn btn-light btn-icon btn-sm d-inline-flex align-items-center justify-content-center rounded-circle"
                >
                  <i className="ti ti-arrow-up-right fs-16" />
                </Link>
              </div>
              {/* start row */}
              <div className="row row-gap-4">
                <div className="col-xl-4 col-lg-6 col-md-6">
                  <div className="card mb-0 overflow-hidden position-relative border border-primary border-opacity-10">
                    <div className="card-body position-relative z-1">
                      <div className="fs-16 fw-semibold text-dark mb-1">
                        High-Performance Team
                      </div>
                      <p className="mb-4">
                        Support team consistently exceeds targets. Consider them
                        for complex projects and mentorship roles.
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge badge-primary">
                          Manager Action Needed
                        </span>
                        <span className="badge badge-primary">
                          30-day trend
                        </span>
                      </div>
                    </div>
                    <ImageWithBasePath
                      src="assets/img/icons/shadow-1.svg"
                      alt="shadow"
                      className="img-fluid position-absolute top-0 start-0"
                    />
                    <ImageWithBasePath
                      src="assets/img/icons/shadow-2.svg"
                      alt="shadow"
                      className="img-fluid position-absolute bottom-0 end-0"
                    />
                    <ImageWithBasePath
                      src="assets/img/icons/star-1.svg"
                      alt="shadow"
                      className="img-fluid position-absolute bottom-0 end-0 star-icon"
                    />
                  </div>
                </div>
                <div className="col-xl-4 col-lg-6 col-md-6">
                  <div className="card mb-0 overflow-hidden position-relative border border-primary border-opacity-10">
                    <div className="card-body position-relative z-1">
                      <div className="fs-16 fw-semibold text-dark mb-1">
                        Skills Gap Identified
                      </div>
                      <p className="mb-4">
                        Leadership scores below target. Recommend leadership
                        training for senior team members in Q3.
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge badge-primary">
                          Manager Action Needed
                        </span>
                        <span className="badge badge-primary">
                          30-day trend
                        </span>
                      </div>
                    </div>
                    <ImageWithBasePath
                      src="assets/img/icons/shadow-1.svg"
                      alt="shadow"
                      className="img-fluid position-absolute top-0 start-0"
                    />
                    <ImageWithBasePath
                      src="assets/img/icons/shadow-2.svg"
                      alt="shadow"
                      className="img-fluid position-absolute bottom-0 end-0"
                    />
                    <ImageWithBasePath
                      src="assets/img/icons/star-1.svg"
                      alt="shadow"
                      className="img-fluid position-absolute bottom-0 end-0 star-icon"
                    />
                  </div>
                </div>
                <div className="col-xl-4 col-lg-12 col-md-12">
                  <div className="card mb-0 overflow-hidden position-relative border border-primary border-opacity-10">
                    <div className="card-body position-relative z-1">
                      <div className="fs-16 fw-semibold text-dark mb-1">
                        Goal Achievement Prediction
                      </div>
                      <p className="mb-4">
                        Based on current trajectory, 92% of team goals will
                        month-end. On track for exceptional quarter.
                      </p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge badge-primary">
                          Manager Action Needed
                        </span>
                        <span className="badge badge-primary">
                          30-day trend
                        </span>
                      </div>
                    </div>
                    <ImageWithBasePath
                      src="assets/img/icons/shadow-1.svg"
                      alt="shadow"
                      className="img-fluid position-absolute top-0 start-0"
                    />
                    <ImageWithBasePath
                      src="assets/img/icons/shadow-2.svg"
                      alt="shadow"
                      className="img-fluid position-absolute bottom-0 end-0"
                    />
                    <ImageWithBasePath
                      src="assets/img/icons/star-1.svg"
                      alt="shadow"
                      className="img-fluid position-absolute bottom-0 end-0 star-icon"
                    />
                  </div>
                </div>
              </div>
              {/* end row */}
            </div>
          </div>
        </div>
        {/* End AI Hiring Predictions */}
        {/* Start Productivity & Quality Metrics */}
        <div className="col-xxl-4 col-xl-12 d-flex">
          <div className="card w-100 mb-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <h2 className="mb-0 card-title">
                  Productivity &amp; Quality Metrics
                </h2>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="border btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-chart-arrows-vertical fs-14 me-1" />
                    Q1
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Q1
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
                        Q3
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div id="productivity-quality-chart">
                <ProductivityQualityChart/>
              </div>
              <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                <p className="d-flex align-items-center gap-1 text-dark mb-0">
                  <i className="ti ti-square-rounded-filled text-primary fs-13" />{" "}
                  Tasks Completed
                </p>
                <p className="d-flex align-items-center gap-1 text-dark mb-0">
                  <i className="ti ti-square-rounded-filled text-secondary fs-13" />
                  Quality Score
                </p>
              </div>
              <p className="badge badge-outline-success text-dark bg-success-transparent fs-12 fw-medium mb-0 px-3 py-2 w-100 text-wrap">
                {" "}
                Productivity up 18% while maintaining 94+.
              </p>
            </div>
          </div>
        </div>
        {/* End Productivity & Quality Metrics */}
        {/* Start Team Collaboration Scores */}
        <div className="col-xxl-5 col-xl-6 d-flex">
          <div className="card w-100 mb-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <h2 className="mb-0 card-title">Team Collaboration Scores</h2>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="border btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-calendar fs-14 me-1" />
                    Jan 2026
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Jan 2026
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Feb 2026
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Mar 2026
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3 mb-4">
                <p className="d-flex align-items-center gap-1 text-dark mb-0 border rounded px-2 py-1">
                  <i className="ti ti-circle-filled text-primary fs-12" />{" "}
                  Internal
                </p>
                <p className="d-flex align-items-center gap-1 text-dark mb-0 border rounded px-2 py-1">
                  <i className="ti ti-circle-filled text-secondary fs-12" />
                  Cross-team
                </p>
              </div>
              <div className="mb-4" id="team-collaboration-chart">
                <TeamCollaborationChart/>
              </div>
              <p className="fs-14 mb-0 px-3 py-2 w-100 mb-0 text-dark bg-light-gradient-100 rounded">
                {" "}
                Sales excels in cross-team collaboration (88 score).
              </p>
            </div>
          </div>
        </div>
        {/* End Team Collaboration Scores */}
        {/* Start Goal Completion */}
        <div className="col-xxl-3 col-xl-6 d-flex">
          <div className="card w-100 mb-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <h2 className="mb-0 card-title">Goal Completion</h2>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="border btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-chart-arrows-vertical fs-14 me-1" />
                    Q1
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Q1
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
                        Q3
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div id="goal-completion-chart">
                <GoalCompletionChart/>
              </div>
              <div className="fs-14 fw-medium text-dark mb-4 text-center">
                Total Goals : 695
              </div>
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2 border rounded-pill p-2 px-3">
                  <p className="d-flex align-items-center gap-1 mb-0">
                    <i className="ti ti-square-rounded-filled text-primary fs-10" />
                    Completed
                  </p>
                  <span className="fs-14 fw-semibold mb-0 text-dark">342</span>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2 border rounded-pill p-2 px-3">
                  <p className="d-flex align-items-center gap-1 mb-0">
                    <i className="ti ti-square-rounded-filled text-secondary-700 fs-10" />{" "}
                    In Progress
                  </p>
                  <span className="fs-14 fw-semibold mb-0 text-dark">185</span>
                </div>
                <div className="d-flex align-items-center justify-content-between border rounded-pill p-2 px-3">
                  <p className="d-flex align-items-center gap-1 mb-0">
                    <i className="ti ti-square-rounded-filled text-warning-300 fs-10" />{" "}
                    Not Started
                  </p>
                  <span className="fs-14 fw-semibold mb-0 text-dark">64</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End Goal Completion */}
        {/* Start Productivity & Quality Metrics */}
        <div className="col-xxl-7 col-xl-6 d-flex">
          <div className="card w-100 mb-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <h2 className="mb-0 card-title">
                  Productivity &amp; Quality Metrics
                </h2>
                <div className="d-flex align-items-center gap-3">
                  <p className="d-flex align-items-center gap-1 text-dark mb-0">
                    <i className="ti ti-square-rounded-filled text-secondary fs-13" />{" "}
                    Tasks Completed
                  </p>
                  <p className="d-flex align-items-center gap-1 text-dark mb-0">
                    <i className="ti ti-square-rounded-filled text-primary fs-13" />
                    Quality Score
                  </p>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="border btn btn-white btn-md d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-calendar fs-14 me-1" />
                    Jan 2026
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Jan 2026
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Feb 2026
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Mar 2026
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="mb-0 px-3 py-2 w-100 fs-14 border rounded text-dark">
                {" "}
                Productivity up 18% while maintaining 94+ quality score.
              </p>
              <div id="productivity-quality-metrics-chart">
                <ProductivityQualityMetricsChart/>
              </div>
            </div>
          </div>
        </div>
        {/* End Productivity & Quality Metrics */}
        {/* Start Skill Assesments */}
        <div className="col-xxl-5 col-xl-6 d-flex">
          <div className="card w-100 mb-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <h2 className="mb-0 card-title">Skill Assesments</h2>
              </div>
              <div className="mb-4" id="skill-assesment-chart">
                <SkillAssessmentChart/>
              </div>
              <p className="mb-0 p-2 w-100 fs-12 fw-medium border rounded text-secondary bg-secondary-transparent d-flex align-items-center gap-2">
                {" "}
                <span className="btn-icon btn-sm bg-white rounded d-flex align-items-center justify-content-center">
                  <i className="ti ti-thumb-up-filled fs-16" />
                </span>{" "}
                68% of employees score 80+, Strong Skills.
              </p>
            </div>
          </div>
        </div>
        {/* End Skill Assesments */}
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

  )
}

export default AiTeamPerformanceInsights