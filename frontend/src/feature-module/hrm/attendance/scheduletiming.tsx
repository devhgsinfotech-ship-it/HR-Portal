import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";

interface ShiftScheduleItem {
  id: number;
  scheduleId: number | null;
  employeeId: number;
  employeeCode: string;
  name: string;
  profilePhotoUrl: string | null;
  departmentId: number | null;
  department: string;
  designation: string;
  shiftPolicyId: number | null;
  shiftName: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  isAssignedSchedule: boolean;
}

interface MetadataEmployee {
  id: number;
  employeeCode: string;
  name: string;
  departmentId: number | null;
  departmentName: string;
  currentShift: string;
}

interface MetadataDepartment {
  id: number;
  name: string;
}

interface ShiftPolicy {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
}

const ScheduleTiming = () => {
  const [schedules, setSchedules] = useState<ShiftScheduleItem[]>([]);
  const [departments, setDepartments] = useState<MetadataDepartment[]>([]);
  const [employees, setEmployees] = useState<MetadataEmployee[]>([]);
  const [shiftPolicies, setShiftPolicies] = useState<ShiftPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [selectedShiftFilter, setSelectedShiftFilter] = useState("all");

  // Form State for Assigning Shift
  const [assignmentType, setAssignmentType] = useState<"employee" | "department">("employee");
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedShiftPolicyId, setSelectedShiftPolicyId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Role Scoping
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "{}");
    } catch {
      return {};
    }
  })();
  const userRole = (currentUser?.role || "").toUpperCase();
  const isEmployee = userRole === "EMPLOYEE";
  const canManage = ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER"].includes(userRole);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [schedRes, metaRes] = await Promise.all([
        apiClient.get("/api/shifts/schedules"),
        apiClient.get("/api/shifts/metadata"),
      ]);

      setSchedules(schedRes.data || []);
      if (metaRes.data) {
        setDepartments(metaRes.data.departments || []);
        setEmployees(metaRes.data.employees || []);
        setShiftPolicies(metaRes.data.shiftPolicies || []);

        if (metaRes.data.shiftPolicies?.length > 0 && !selectedShiftPolicyId) {
          setSelectedShiftPolicyId(String(metaRes.data.shiftPolicies[0].id));
        }
      }
    } catch (err: any) {
      console.error("Failed to load shift schedule data:", err);
      setErrorMsg(err.response?.data?.message || "Failed to load shift schedule data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered List
  const filteredData = useMemo(() => {
    return schedules.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.designation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDeptFilter === "all" ||
        (item.departmentId && String(item.departmentId) === selectedDeptFilter);

      const matchesShift =
        selectedShiftFilter === "all" ||
        (item.shiftPolicyId && String(item.shiftPolicyId) === selectedShiftFilter);

      return matchesSearch && matchesDept && matchesShift;
    });
  }, [schedules, searchQuery, selectedDeptFilter, selectedShiftFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const total = schedules.length;
    const morning = schedules.filter((s) => s.shiftName.toLowerCase().includes("morning")).length;
    const general = schedules.filter((s) => s.shiftName.toLowerCase().includes("general")).length;
    const nightEvening = schedules.filter(
      (s) => s.shiftName.toLowerCase().includes("night") || s.shiftName.toLowerCase().includes("evening")
    ).length;
    return { total, morning, general, nightEvening };
  }, [schedules]);

  // Unique shift policies to avoid any duplicate rendering
  const uniqueShiftPolicies = useMemo(() => {
    const map = new Map<string, ShiftPolicy>();
    for (const sp of shiftPolicies) {
      const key = sp.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, sp);
      }
    }
    return Array.from(map.values());
  }, [shiftPolicies]);

  // Handle Form Submission (Assign Shift)
  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftPolicyId) {
      setErrorMsg("Please select a shift policy.");
      return;
    }
    if (assignmentType === "employee" && !selectedEmpId) {
      setErrorMsg("Please select an employee.");
      return;
    }
    if (assignmentType === "department" && !selectedDeptId) {
      setErrorMsg("Please select a department.");
      return;
    }
    if (!startDate) {
      setErrorMsg("Start date is required.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      await apiClient.post("/api/shifts/schedules", {
        employeeId: assignmentType === "employee" ? selectedEmpId : undefined,
        departmentId: assignmentType === "department" ? selectedDeptId : undefined,
        shiftPolicyId: selectedShiftPolicyId,
        startDate,
        endDate: endDate || null,
        notes: notes || null,
      });

      setSuccessMsg("Shift scheduled successfully!");
      // Reset form
      setStartDate("");
      setEndDate("");
      setNotes("");
      setSelectedEmpId("");
      setSelectedDeptId("");

      // Close modal
      document.getElementById("close_schedule_modal")?.click();
      fetchAllData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Error creating shift schedule:", err);
      setErrorMsg(err.response?.data?.message || "Failed to schedule shift");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Pre-fill for Row Action
  const handleOpenAssignForEmp = (emp: ShiftScheduleItem) => {
    setAssignmentType("employee");
    setSelectedEmpId(String(emp.employeeId));
    if (emp.shiftPolicyId) {
      setSelectedShiftPolicyId(String(emp.shiftPolicyId));
    }
  };

  // Handle Delete Custom Schedule
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!window.confirm("Are you sure you want to remove this schedule assignment?")) return;
    try {
      await apiClient.delete(`/api/shifts/schedules/${scheduleId}`);
      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete schedule");
    }
  };

  const columns = [
    {
      title: "Employee",
      dataIndex: "name",
      render: (_text: string, record: ShiftScheduleItem) => (
        <div className="d-flex align-items-center file-name-icon">
          <span className="avatar avatar-md border avatar-rounded bg-light text-primary fw-bold d-flex align-items-center justify-content-center overflow-hidden">
            {record.profilePhotoUrl ? (
              <img
                src={
                  record.profilePhotoUrl.startsWith("http")
                    ? record.profilePhotoUrl
                    : `${apiClient.defaults.baseURL || APP_CONFIG.getBackendUrl()}${record.profilePhotoUrl}`
                }
                className="img-fluid"
                alt={`${record.name} Profile`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              record.name?.substring(0, 2).toUpperCase() || "EM"
            )}
          </span>
          <div className="ms-2">
            <h6 className="fw-medium mb-0">{record.name}</h6>
            <span className="fs-12 text-muted">{record.employeeCode}</span>
          </div>
        </div>
      ),
      sorter: (a: ShiftScheduleItem, b: ShiftScheduleItem) => a.name.localeCompare(b.name),
    },
    {
      title: "Department & Role",
      dataIndex: "department",
      render: (_text: string, record: ShiftScheduleItem) => (
        <div>
          <span className="fw-medium text-dark d-block">{record.department}</span>
          <span className="fs-12 text-muted">{record.designation}</span>
        </div>
      ),
      sorter: (a: ShiftScheduleItem, b: ShiftScheduleItem) => a.department.localeCompare(b.department),
    },
    {
      title: "Assigned Shift",
      dataIndex: "shiftName",
      render: (_text: string, record: ShiftScheduleItem) => {
        let badgeClass = "badge-soft-primary";
        if (record.shiftName.toLowerCase().includes("morning")) badgeClass = "badge-soft-info";
        else if (record.shiftName.toLowerCase().includes("night")) badgeClass = "badge-soft-purple";
        else if (record.shiftName.toLowerCase().includes("evening")) badgeClass = "badge-soft-warning";

        return (
          <div>
            <span className={`badge ${badgeClass} d-inline-flex align-items-center mb-1`}>
              <i className="ti ti-clock me-1"></i>
              {record.shiftName}
            </span>
            <div className="fs-12 text-muted fw-semibold">
              {record.startTime} - {record.endTime}
            </div>
          </div>
        );
      },
      sorter: (a: ShiftScheduleItem, b: ShiftScheduleItem) => a.shiftName.localeCompare(b.shiftName),
    },
    {
      title: "Schedule Range",
      dataIndex: "startDate",
      render: (_text: string, record: ShiftScheduleItem) => (
        <div>
          {record.startDate ? (
            <div>
              <span className="text-dark fw-medium">{record.startDate}</span>
              {record.endDate && <span className="text-muted"> to {record.endDate}</span>}
            </div>
          ) : (
            <span className="badge badge-soft-success">Default / Ongoing</span>
          )}
          {record.notes && <div className="fs-11 text-muted fst-italic mt-1">{record.notes}</div>}
        </div>
      ),
    },
    {
      title: "Grace Period",
      dataIndex: "gracePeriod",
      render: (text: number) => <span className="fs-13">{text || 15} mins</span>,
    },
    {
      title: canManage ? "Action" : "",
      dataIndex: "actions",
      render: (_text: string, record: ShiftScheduleItem) => {
        if (!canManage) return null;
        return (
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              data-bs-toggle="modal"
              data-bs-target="#schedule_timing"
              onClick={() => handleOpenAssignForEmp(record)}
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center"
              title="Assign or Change Shift"
            >
              <i className="ti ti-calendar-time me-1" />
              Assign
            </button>
            {record.scheduleId && (
              <button
                type="button"
                onClick={() => handleDeleteSchedule(record.scheduleId!)}
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                title="Remove Custom Schedule"
              >
                <i className="ti ti-trash" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Shift &amp; Schedule Timing</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Schedule Timing
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              {canManage && (
                <button
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#schedule_timing"
                  className="btn btn-primary d-inline-flex align-items-center"
                  onClick={() => {
                    setAssignmentType("employee");
                    setSelectedEmpId("");
                    setSelectedDeptId("");
                  }}
                >
                  <i className="ti ti-plus me-1" />
                  Assign Shift Schedule
                </button>
              )}
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {successMsg && (
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
              <i className="ti ti-circle-check fs-18 me-2" />
              <div>{successMsg}</div>
              <button type="button" className="btn-close" onClick={() => setSuccessMsg("")} />
            </div>
          )}
          {errorMsg && (
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
              <i className="ti ti-alert-triangle fs-18 me-2" />
              <div>{errorMsg}</div>
              <button type="button" className="btn-close" onClick={() => setErrorMsg("")} />
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="row mb-3">
            <div className="col-xl-3 col-sm-6 mb-3 mb-xl-0">
              <div className="card shadow-none border mb-0">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md bg-primary-subtle text-primary rounded-circle me-3">
                      <i className="ti ti-users fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">Total Tracked</p>
                      <h4 className="fw-bold mb-0">{kpis.total}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-3 mb-xl-0">
              <div className="card shadow-none border mb-0">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md bg-info-subtle text-info rounded-circle me-3">
                      <i className="ti ti-sun fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">Morning Shift</p>
                      <h4 className="fw-bold mb-0">{kpis.morning}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-3 mb-xl-0">
              <div className="card shadow-none border mb-0">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md bg-success-subtle text-success rounded-circle me-3">
                      <i className="ti ti-briefcase fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">General Shift</p>
                      <h4 className="fw-bold mb-0">{kpis.general}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 mb-3 mb-xl-0">
              <div className="card shadow-none border mb-0">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="avatar avatar-md bg-warning-subtle text-warning rounded-circle me-3">
                      <i className="ti ti-moon fs-20" />
                    </div>
                    <div>
                      <p className="text-muted mb-0 fs-13">Evening / Night Shift</p>
                      <h4 className="fw-bold mb-0">{kpis.nightEvening}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Card with Filters & Table */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0">
                {isEmployee ? "My Shift Schedule" : "Employee Shift Schedules"}
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                {/* Search */}
                <div className="input-icon position-relative">
                  <span className="input-icon-addon">
                    <i className="ti ti-search" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search employee, dept..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ minWidth: "220px" }}
                  />
                </div>

                {/* Dept Filter */}
                {!isEmployee && departments.length > 0 && (
                  <select
                    className="form-select"
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    style={{ minWidth: "160px" }}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Shift Filter */}
                {uniqueShiftPolicies.length > 0 && (
                  <select
                    className="form-select"
                    value={selectedShiftFilter}
                    onChange={(e) => setSelectedShiftFilter(e.target.value)}
                    style={{ minWidth: "150px" }}
                  >
                    <option value="all">All Shifts</option>
                    {uniqueShiftPolicies.map((sp) => (
                      <option key={sp.id} value={String(sp.id)}>
                        {sp.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading schedules from database...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-calendar-off fs-36 text-muted mb-2 d-block" />
                  <h6 className="fw-semibold">No shift schedules found</h6>
                  <p className="text-muted fs-13">
                    {searchQuery
                      ? "No records matching your search query."
                      : "No shift schedules assigned yet."}
                  </p>
                </div>
              ) : (
                <div className="custom-datatable-filter table-responsive">
                  <Table dataSource={filteredData} columns={columns} Selection={false} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2026 © SmartHR - Work Arrangement Module</p>
        </div>
      </div>

      {/* Modal for Assigning Shift Schedule */}
      {canManage && (
        <div id="schedule_timing" className="modal custom-modal fade" role="dialog" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ti ti-calendar-time me-2 text-primary" />
                  Assign Shift Schedule
                </h5>
                <button
                  id="close_schedule_modal"
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleAssignShift}>
                <div className="modal-body">
                  <div className="row g-3">
                    {/* Assignment Target */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">Target Assignment</label>
                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="assignType"
                            id="assignEmp"
                            checked={assignmentType === "employee"}
                            onChange={() => setAssignmentType("employee")}
                          />
                          <label className="form-check-label" htmlFor="assignEmp">
                            Individual Employee
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="assignType"
                            id="assignDept"
                            checked={assignmentType === "department"}
                            onChange={() => setAssignmentType("department")}
                          />
                          <label className="form-check-label" htmlFor="assignDept">
                            Entire Department
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Employee Picker */}
                    {assignmentType === "employee" ? (
                      <div className="col-md-12">
                        <label className="form-label">
                          Select Employee <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={selectedEmpId}
                          onChange={(e) => setSelectedEmpId(e.target.value)}
                          required
                        >
                          <option value="">-- Choose Employee --</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={String(emp.id)}>
                              {emp.name} ({emp.employeeCode}) - {emp.departmentName} [Current:{" "}
                              {emp.currentShift}]
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="col-md-12">
                        <label className="form-label">
                          Select Department <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                          required
                        >
                          <option value="">-- Choose Department --</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={String(dept.id)}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Shift Policy Selection */}
                    <div className="col-md-12">
                      <label className="form-label">
                        Shift Policy <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={selectedShiftPolicyId}
                        onChange={(e) => setSelectedShiftPolicyId(e.target.value)}
                        required
                      >
                        <option value="">-- Select Shift Policy --</option>
                        {uniqueShiftPolicies.map((sp) => (
                          <option key={sp.id} value={String(sp.id)}>
                            {sp.name} ({sp.startTime} - {sp.endTime}) | Grace: {sp.gracePeriod}m
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Date */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Effective From Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>

                    {/* End Date */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Effective To Date <span className="text-muted">(Optional / Ongoing)</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                      />
                    </div>

                    {/* Notes */}
                    <div className="col-12">
                      <label className="form-label">Assignment Notes</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Reason or operational instructions for this schedule..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Saving Schedule...
                      </>
                    ) : (
                      "Confirm & Apply Shift"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScheduleTiming;
