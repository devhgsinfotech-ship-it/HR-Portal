import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import CommonSelect, { Option } from "../../core/common/commonSelect";
import apiClient from "../../core/utils/apiClient";
import dayjs from "dayjs";

const PerformanceReview = () => {
  const routes = all_routes;

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [employeeGoals, setEmployeeGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "danger"; text: string } | null>(null);

  // Active Appraisal State
  const [appraisalId, setAppraisalId] = useState<number | null>(null);
  const [appraisalCycle, setAppraisalCycle] = useState("Annual 2026");
  const [selfRating, setSelfRating] = useState<number>(4.0);
  const [managerRating, setManagerRating] = useState<number>(4.0);
  const [finalRating, setFinalRating] = useState<number>(4.0);
  const [competencyScore, setCompetencyScore] = useState<number>(85);
  const [strengths, setStrengths] = useState("");
  const [areasForImprovement, setAreasForImprovement] = useState("");
  const [employeeRemarks, setEmployeeRemarks] = useState("");
  const [managerRemarks, setManagerRemarks] = useState("");
  const [hrRemarks, setHrRemarks] = useState("");
  const [status, setStatus] = useState<string>("REVIEWED");

  // Competency breakdown
  const [technicalScores, setTechnicalScores] = useState({
    codeQuality: "Advanced",
    problemSolving: "Advanced",
    systemDesign: "Intermediate",
    efficiency: "Advanced",
  });

  const [orgScores, setOrgScores] = useState({
    teamwork: "Expert",
    communication: "Advanced",
    ownership: "Advanced",
    integrity: "Expert",
  });

  const competencyLevels: Option[] = [
    { value: "Beginner", label: "Beginner (1.0)" },
    { value: "Intermediate", label: "Intermediate (3.0)" },
    { value: "Advanced", label: "Advanced (4.0)" },
    { value: "Expert", label: "Expert / Leader (5.0)" },
  ];

  const ratingOptions: Option[] = [
    { value: "5.0", label: "5.0 - Outstanding" },
    { value: "4.5", label: "4.5 - Exceeds Expectations" },
    { value: "4.0", label: "4.0 - Consistently Meets Expectations" },
    { value: "3.5", label: "3.5 - Meets Expectations" },
    { value: "3.0", label: "3.0 - Needs Some Development" },
    { value: "2.0", label: "2.0 - Below Expectations" },
  ];

  // Role permissions
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "{}");
    } catch {
      return {};
    }
  })();
  const userRole = (currentUser?.role || "").toUpperCase();
  const canManage = ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER"].includes(userRole);

  // 1. Fetch metadata (employees)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/api/performance/metadata");
        const emps = res.data?.employees || [];
        setEmployees(emps);
        if (emps.length > 0) {
          // If currentUser is an employee, default to their employee record, otherwise first
          const myEmp = emps.find((e: any) => e.userId === currentUser?.id);
          setSelectedEmpId(myEmp ? myEmp.id : emps[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load metadata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  // 2. Fetch employee details, goals, and existing appraisal when selectedEmpId changes
  useEffect(() => {
    if (!selectedEmpId) return;

    const fetchEmpData = async () => {
      try {
        setLoading(true);
        const [goalsRes, appRes] = await Promise.all([
          apiClient.get(`/api/performance/goals?employeeId=${selectedEmpId}`),
          apiClient.get(`/api/performance/appraisals?employeeId=${selectedEmpId}`),
        ]);

        setEmployeeGoals(goalsRes.data || []);

        const apps = appRes.data || [];
        if (apps.length > 0) {
          // Load latest appraisal
          const latest = apps[0];
          setAppraisalId(latest.id);
          setAppraisalCycle(latest.appraisalCycle || "Annual 2026");
          setSelfRating(latest.selfRating || 4.0);
          setManagerRating(latest.managerRating || 4.0);
          setFinalRating(latest.finalRating || 4.0);
          setCompetencyScore(latest.competencyScore || 85);
          setStrengths(latest.strengths || "");
          setAreasForImprovement(latest.areasForImprovement || "");
          setEmployeeRemarks(latest.employeeRemarks || "");
          setManagerRemarks(latest.managerRemarks || "");
          setHrRemarks(latest.hrRemarks || "");
          setStatus(latest.status || "REVIEWED");
        } else {
          // Reset to default new review
          setAppraisalId(null);
          setAppraisalCycle("Annual 2026");
          setSelfRating(4.0);
          setManagerRating(4.0);
          setFinalRating(4.0);
          setCompetencyScore(85);
          setStrengths("");
          setAreasForImprovement("");
          setEmployeeRemarks("");
          setManagerRemarks("");
          setHrRemarks("");
          setStatus("REVIEWED");
        }
      } catch (err: any) {
        console.error("Failed to load employee appraisal data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpData();
  }, [selectedEmpId]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);

  const handleSaveReview = async (newStatus: "DRAFT" | "REVIEWED" | "APPROVED") => {
    if (!selectedEmpId) return;

    try {
      setSubmitting(true);
      const payload = {
        employeeId: selectedEmpId,
        appraisalCycle,
        appraisalDate: dayjs().format("YYYY-MM-DD"),
        selfRating,
        managerRating,
        finalRating,
        competencyScore,
        strengths,
        areasForImprovement,
        employeeRemarks,
        managerRemarks,
        hrRemarks,
        status: newStatus,
      };

      if (appraisalId) {
        await apiClient.put(`/api/performance/appraisals/${appraisalId}`, payload);
      } else {
        const createRes = await apiClient.post("/api/performance/appraisals", payload);
        if (createRes.data?.appraisal?.id) {
          setAppraisalId(createRes.data.appraisal.id);
        }
      }

      setStatus(newStatus);
      setFeedbackMsg({
        type: "success",
        text: `Performance Review saved successfully with status "${newStatus}".`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error("Failed to save review:", err);
      setFeedbackMsg({
        type: "danger",
        text: err.response?.data?.message || "Failed to save performance review",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const empSelectOptions: Option[] = employees.map((e) => ({
    value: String(e.id),
    label: `${e.name} (${e.employeeCode || "EMP"}) - ${e.departmentName || ""}`,
  }));

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Performance Review Evaluation</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Performance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Performance Review
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center me-2">
                <span className="me-2 fw-medium fs-13">Select Employee:</span>
                <div style={{ minWidth: "260px" }}>
                  <CommonSelect
                    className="select"
                    options={empSelectOptions}
                    defaultValue={empSelectOptions.find((o) => o.value === String(selectedEmpId))}
                    onChange={(opt) => setSelectedEmpId(opt?.value ? parseInt(opt.value, 10) : null)}
                  />
                </div>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {feedbackMsg && (
            <div
              className={`alert alert-${feedbackMsg.type} alert-dismissible fade show d-flex align-items-center mb-3`}
              role="alert"
            >
              <i
                className={`ti ${
                  feedbackMsg.type === "success"
                    ? "ti-check-circle text-success"
                    : "ti-alert-circle text-danger"
                } fs-20 me-2`}
              />
              <div className="flex-grow-1">{feedbackMsg.text}</div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setFeedbackMsg(null)}
                aria-label="Close"
              />
            </div>
          )}

          {/* Section 1: Employee Basic Information Card */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-header bg-light d-flex align-items-center justify-content-between">
              <h5 className="mb-0 text-primary">
                <i className="ti ti-user me-2" /> Employee Performance Profile
              </h5>
              <span
                className={`badge ${
                  status === "APPROVED"
                    ? "badge-success"
                    : status === "REVIEWED"
                    ? "badge-info"
                    : "badge-warning"
                } fs-12`}
              >
                Status: {status}
              </span>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status" />
                  <span className="ms-2 text-muted">Loading employee details...</span>
                </div>
              ) : selectedEmployee ? (
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label text-muted fs-12">Full Name</label>
                    <p className="fw-bold mb-0 fs-14 text-dark">{selectedEmployee.name}</p>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted fs-12">Employee Code</label>
                    <p className="fw-bold mb-0 fs-14 text-dark">
                      {selectedEmployee.employeeCode ? `#${selectedEmployee.employeeCode}` : "EMP-N/A"}
                    </p>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted fs-12">Department</label>
                    <p className="fw-bold mb-0 fs-14 text-dark">{selectedEmployee.departmentName}</p>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted fs-12">Designation</label>
                    <p className="fw-bold mb-0 fs-14 text-dark">{selectedEmployee.designationName}</p>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted fs-12">Review Cycle</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={appraisalCycle}
                      onChange={(e) => setAppraisalCycle(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted fs-12">Review Date</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light"
                      value={dayjs().format("DD MMMM YYYY")}
                      disabled
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted fs-12">Evaluation Status</label>
                    <span className="d-block pt-1 fw-semibold text-primary">{status}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0">No employee selected.</p>
              )}
            </div>
          </div>

          {/* Section 2: Goals & OKRs Achievements */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-header bg-light d-flex align-items-center justify-content-between">
              <h5 className="mb-0 text-primary">
                <i className="ti ti-target-arrow me-2" /> Goals &amp; OKRs Assessment ({employeeGoals.length})
              </h5>
              <Link to="/performance/goal-tracking" className="btn btn-outline-primary btn-sm">
                View Goal Tracker
              </Link>
            </div>
            <div className="card-body p-0">
              {employeeGoals.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <i className="ti ti-target fs-28 d-block mb-1 text-muted" />
                  No goals found for this employee yet. You can assign goals from Goal Tracking.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-nowrap mb-0">
                    <thead className="thead-light">
                      <tr>
                        <th>Subject</th>
                        <th>Goal Type</th>
                        <th>Target Achievement</th>
                        <th>Timeline</th>
                        <th>Progress</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeGoals.map((g) => (
                        <tr key={g.id}>
                          <td>
                            <strong className="fs-13">{g.subject}</strong>
                            {g.description && <p className="text-muted fs-12 mb-0">{g.description}</p>}
                          </td>
                          <td>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-12">
                              {g.GoalType || g.goalTypeName || g.goalType || "General"}
                            </span>
                          </td>
                          <td className="fs-13">{g.targetAchievement || "—"}</td>
                          <td className="fs-12 text-muted">
                            {g.startDate ? dayjs(g.startDate).format("DD MMM") : "Start"} &rarr;{" "}
                            {g.endDate ? dayjs(g.endDate).format("DD MMM YYYY") : "Ongoing"}
                          </td>
                          <td style={{ minWidth: "140px" }}>
                            <div className="d-flex justify-content-between align-items-center mb-1 fs-11">
                              <span>{g.progress ?? g.progressValue ?? 0}%</span>
                            </div>
                            <div className="progress" style={{ height: "6px" }}>
                              <div
                                className={`progress-bar ${(g.progress ?? g.progressValue ?? 0) >= 100 ? "bg-success" : "bg-primary"}`}
                                style={{ width: `${g.progress ?? g.progressValue ?? 0}%` }}
                              />
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                (g.status || "").toUpperCase() === "COMPLETED"
                                  ? "badge-success"
                                  : "badge-primary"
                              } badge-xs`}
                            >
                              {g.status || "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Core Competencies Assessment */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0 text-primary">
                <i className="ti ti-medal me-2" /> Competency Ratings Matrix
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 border-end">
                  <h6 className="fw-bold mb-3 text-secondary">
                    <i className="ti ti-code me-1" /> Technical Competencies
                  </h6>
                  <div className="mb-3">
                    <label className="form-label fs-13">Technical Quality &amp; Accuracy</label>
                    <CommonSelect
                      className="select"
                      options={competencyLevels}
                      defaultValue={competencyLevels[2]}
                      onChange={(opt) =>
                        setTechnicalScores({ ...technicalScores, codeQuality: opt?.value || "Advanced" })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fs-13">Problem Solving &amp; Innovation</label>
                    <CommonSelect
                      className="select"
                      options={competencyLevels}
                      defaultValue={competencyLevels[2]}
                      onChange={(opt) =>
                        setTechnicalScores({ ...technicalScores, problemSolving: opt?.value || "Advanced" })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fs-13">Execution &amp; Delivery Speed</label>
                    <CommonSelect
                      className="select"
                      options={competencyLevels}
                      defaultValue={competencyLevels[2]}
                      onChange={(opt) =>
                        setTechnicalScores({ ...technicalScores, efficiency: opt?.value || "Advanced" })
                      }
                    />
                  </div>
                </div>

                <div className="col-md-6 ps-md-4">
                  <h6 className="fw-bold mb-3 text-secondary">
                    <i className="ti ti-users me-1" /> Organizational &amp; Leadership Skills
                  </h6>
                  <div className="mb-3">
                    <label className="form-label fs-13">Team Collaboration &amp; Support</label>
                    <CommonSelect
                      className="select"
                      options={competencyLevels}
                      defaultValue={competencyLevels[3]}
                      onChange={(opt) =>
                        setOrgScores({ ...orgScores, teamwork: opt?.value || "Expert" })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fs-13">Ownership &amp; Accountability</label>
                    <CommonSelect
                      className="select"
                      options={competencyLevels}
                      defaultValue={competencyLevels[2]}
                      onChange={(opt) =>
                        setOrgScores({ ...orgScores, ownership: opt?.value || "Advanced" })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fs-13">Integrity &amp; Work Ethics</label>
                    <CommonSelect
                      className="select"
                      options={competencyLevels}
                      defaultValue={competencyLevels[3]}
                      onChange={(opt) =>
                        setOrgScores({ ...orgScores, integrity: opt?.value || "Expert" })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Performance Ratings & Quantitative Scores */}
          <div className="card mb-4 border-0 shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0 text-primary">
                <i className="ti ti-star-filled me-2 text-warning" /> Overall Performance Evaluation &amp; Scores
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-medium">Self Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    className="form-control"
                    value={selfRating}
                    onChange={(e) => setSelfRating(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-medium">Manager Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    className="form-control"
                    value={managerRating}
                    onChange={(e) => setManagerRating(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-medium">Final Consolidated Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    className="form-control fw-bold text-primary"
                    value={finalRating}
                    onChange={(e) => setFinalRating(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-medium">Overall Competency %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={competencyScore}
                    onChange={(e) => setCompetencyScore(parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className="col-md-6 mt-3">
                  <label className="form-label fw-medium">Key Achievements &amp; Strengths</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Core strengths demonstrated during this evaluation cycle"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mt-3">
                  <label className="form-label fw-medium">Areas for Growth &amp; Development</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Specific growth areas and recommended training"
                    value={areasForImprovement}
                    onChange={(e) => setAreasForImprovement(e.target.value)}
                  />
                </div>

                <div className="col-md-4 mt-3">
                  <label className="form-label fw-medium">Employee Remarks / Feedback</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Self-reflection and feedback"
                    value={employeeRemarks}
                    onChange={(e) => setEmployeeRemarks(e.target.value)}
                  />
                </div>
                <div className="col-md-4 mt-3">
                  <label className="form-label fw-medium">Manager Assessment</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Manager evaluation and justification"
                    value={managerRemarks}
                    onChange={(e) => setManagerRemarks(e.target.value)}
                  />
                </div>
                <div className="col-md-4 mt-3">
                  <label className="form-label fw-medium">HR Review &amp; Committee Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="HR alignment and promotion recommendation"
                    value={hrRemarks}
                    onChange={(e) => setHrRemarks(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="card-footer bg-white d-flex justify-content-end gap-2 p-3">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => handleSaveReview("DRAFT")}
                disabled={submitting}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSaveReview("REVIEWED")}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" />
                    Saving...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
              {canManage && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleSaveReview("APPROVED")}
                  disabled={submitting}
                >
                  <i className="ti ti-check me-1" /> Approve Appraisal
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2026 © SmartHR - Performance Review &amp; Appraisals.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default PerformanceReview;
