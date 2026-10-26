import React, { useState, useEffect, useRef } from "react";
import CommonSelect, { Option } from "../common/commonSelect";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import apiClient from "../utils/apiClient";

export interface GoalRecord {
  id: number;
  companyId?: number;
  employeeId?: number;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
  profilePhotoUrl?: string | null;
  goalTypeId: number | null;
  GoalType?: string;
  goalTypeName?: string;
  Subject?: string;
  subject?: string;
  TargetAchievement?: string | null;
  targetAchievement?: string | null;
  StartDate?: string | null;
  startDate?: string | null;
  EndDate?: string | null;
  endDate?: string | null;
  Description?: string | null;
  description?: string | null;
  Status?: string;
  status?: string;
  Progress?: string;
  progressValue?: number;
  progress?: number;
  isCompleted?: boolean;
}

interface GoalTrackingModalProps {
  selectedGoal?: GoalRecord | null;
  employees?: any[];
  goalTypes?: any[];
  canManage?: boolean;
  onSaved: () => void;
}

const statusOptions: Option[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const GoalTrackingModal: React.FC<GoalTrackingModalProps> = ({
  selectedGoal,
  employees = [],
  goalTypes = [],
  canManage = true,
  onSaved,
}) => {
  // Add State
  const [addEmployeeId, setAddEmployeeId] = useState<number | null>(null);
  const [addGoalTypeId, setAddGoalTypeId] = useState<number | null>(null);
  const [addSubject, setAddSubject] = useState("");
  const [addTargetAchievement, setAddTargetAchievement] = useState("");
  const [addStartDate, setAddStartDate] = useState<Dayjs | null>(null);
  const [addEndDate, setAddEndDate] = useState<Dayjs | null>(null);
  const [addDescription, setAddDescription] = useState("");
  const [addProgress, setAddProgress] = useState<number>(0);
  const [addStatus, setAddStatus] = useState<string>("Active");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit State
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null);
  const [editGoalTypeId, setEditGoalTypeId] = useState<number | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editTargetAchievement, setEditTargetAchievement] = useState("");
  const [editStartDate, setEditStartDate] = useState<Dayjs | null>(null);
  const [editEndDate, setEditEndDate] = useState<Dayjs | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>("Active");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const closeAddBtnRef = useRef<HTMLButtonElement>(null);
  const closeEditBtnRef = useRef<HTMLButtonElement>(null);

  const goalTypeOptions: Option[] = [
    { value: "", label: "Select Goal Type" },
    ...goalTypes.map((gt) => ({ value: String(gt.id), label: gt.name })),
  ];

  const employeeOptions: Option[] = [
    { value: "", label: "Select Employee" },
    ...employees.map((emp) => ({
      value: String(emp.id),
      label: `${emp.name} (${emp.employeeCode || "EMP"}) - ${emp.designationName || ""}`,
    })),
  ];

  useEffect(() => {
    if (selectedGoal) {
      setEditEmployeeId(selectedGoal.employeeId || null);
      setEditGoalTypeId(selectedGoal.goalTypeId || null);
      setEditSubject(selectedGoal.subject || selectedGoal.Subject || "");
      setEditTargetAchievement(selectedGoal.targetAchievement || selectedGoal.TargetAchievement || "");
      
      const rawStart = selectedGoal.startDate || selectedGoal.StartDate;
      setEditStartDate(rawStart ? dayjs(rawStart) : null);
      
      const rawEnd = selectedGoal.endDate || selectedGoal.EndDate;
      setEditEndDate(rawEnd ? dayjs(rawEnd) : null);
      
      setEditDescription(selectedGoal.description || selectedGoal.Description || "");
      
      const prog =
        selectedGoal.progress !== undefined && selectedGoal.progress !== null
          ? selectedGoal.progress
          : selectedGoal.progressValue !== undefined && selectedGoal.progressValue !== null
          ? selectedGoal.progressValue
          : parseInt(String(selectedGoal.Progress || "").replace(/[^0-9]/g, "")) || 0;
      setEditProgress(prog);

      setEditStatus(selectedGoal.status || selectedGoal.Status || "Active");
      setEditError(null);
    }
  }, [selectedGoal]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSubject.trim()) {
      setAddError("Please provide a Goal Subject.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);

      // Auto-assign first employee if employeeId not selected
      const empId = addEmployeeId || (employees.length > 0 ? employees[0].id : undefined);

      await apiClient.post("/api/performance/goals", {
        employeeId: empId,
        goalTypeId: addGoalTypeId || undefined,
        subject: addSubject.trim(),
        targetAchievement: addTargetAchievement.trim(),
        startDate: addStartDate ? addStartDate.format("YYYY-MM-DD") : null,
        endDate: addEndDate ? addEndDate.format("YYYY-MM-DD") : null,
        description: addDescription.trim(),
        progress: addProgress,
        status: addProgress >= 100 ? "COMPLETED" : addStatus.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      });

      // Reset
      setAddEmployeeId(null);
      setAddGoalTypeId(null);
      setAddSubject("");
      setAddTargetAchievement("");
      setAddStartDate(null);
      setAddEndDate(null);
      setAddDescription("");
      setAddProgress(0);
      setAddStatus("Active");

      closeAddBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to create goal:", err);
      setAddError(err.response?.data?.message || "Failed to create Goal");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    if (!editSubject.trim()) {
      setEditError("Please provide a Goal Subject.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);

      await apiClient.put(`/api/performance/goals/${selectedGoal.id}`, {
        goalTypeId: editGoalTypeId || null,
        subject: editSubject.trim(),
        targetAchievement: editTargetAchievement.trim(),
        startDate: editStartDate ? editStartDate.format("YYYY-MM-DD") : null,
        endDate: editEndDate ? editEndDate.format("YYYY-MM-DD") : null,
        description: editDescription.trim(),
        progress: editProgress,
        status: editProgress >= 100 ? "COMPLETED" : editStatus.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        isCompleted: editProgress >= 100,
      });

      closeEditBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to update goal:", err);
      setEditError(err.response?.data?.message || "Failed to update Goal");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      {/* Add Goal Tracking */}
      <div className="modal fade" id="add_goal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Goal Tracking</h4>
              <button
                ref={closeAddBtnRef}
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleCreateGoal}>
              <div className="modal-body pb-0">
                {addError && (
                  <div className="alert alert-danger py-2 px-3 fs-13 mb-3">
                    <i className="ti ti-alert-circle me-1" />
                    {addError}
                  </div>
                )}
                <div className="row">
                  {employees.length > 1 && canManage && (
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Employee</label>
                        <CommonSelect
                          className="select"
                          options={employeeOptions}
                          defaultValue={employeeOptions[0]}
                          onChange={(opt) =>
                            setAddEmployeeId(opt?.value ? parseInt(opt.value, 10) : null)
                          }
                        />
                      </div>
                    </div>
                  )}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Goal Type</label>
                      <CommonSelect
                        className="select"
                        options={goalTypeOptions}
                        defaultValue={goalTypeOptions[0]}
                        onChange={(opt) =>
                          setAddGoalTypeId(opt?.value ? parseInt(opt.value, 10) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Subject <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Programming Skills"
                        value={addSubject}
                        onChange={(e) => setAddSubject(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Target Achievement</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Complete a HTML course"
                        value={addTargetAchievement}
                        onChange={(e) => setAddTargetAchievement(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Start Date </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          value={addStartDate}
                          onChange={(d) => setAddStartDate(d)}
                          placeholder="DD-MM-YYYY"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">End Date </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          value={addEndDate}
                          onChange={(d) => setAddEndDate(d)}
                          placeholder="DD-MM-YYYY"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Improve proficiency"
                        value={addDescription}
                        onChange={(e) => setAddDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label mb-0">Progress ({addProgress}%)</label>
                        <span className="fs-12 text-primary fw-bold">{addProgress}%</span>
                      </div>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        step="5"
                        value={addProgress}
                        onChange={(e) => setAddProgress(parseInt(e.target.value, 10))}
                      />
                      <div className="progress mt-1" style={{ width: "100%", height: "6px" }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${addProgress}%` }}
                          role="progressbar"
                          aria-valuenow={addProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={statusOptions}
                        defaultValue={statusOptions[0]}
                        onChange={(opt) => setAddStatus(opt?.value || "Active")}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                      Saving...
                    </>
                  ) : (
                    "Add Goal Tracking"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Goal Tracking */}

      {/* Edit Goal Tracking */}
      <div className="modal fade" id="edit_goal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Goal Tracking</h4>
              <button
                ref={closeEditBtnRef}
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdateGoal}>
              <div className="modal-body pb-0">
                {editError && (
                  <div className="alert alert-danger py-2 px-3 fs-13 mb-3">
                    <i className="ti ti-alert-circle me-1" />
                    {editError}
                  </div>
                )}
                <div className="row">
                  {selectedGoal?.employeeName && (
                    <div className="col-md-12">
                      <div className="mb-3 p-2 bg-light rounded d-flex align-items-center">
                        <i className="ti ti-user-check me-2 text-primary fs-18" />
                        <div>
                          <span className="fs-11 text-muted d-block">Assigned Team Member</span>
                          <strong className="fs-13 text-dark">{selectedGoal.employeeName}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Goal Type</label>
                      <CommonSelect
                        className="select"
                        options={goalTypeOptions}
                        defaultValue={
                          goalTypeOptions.find((g) => g.value === String(editGoalTypeId)) ||
                          goalTypeOptions[0]
                        }
                        onChange={(opt) =>
                          setEditGoalTypeId(opt?.value ? parseInt(opt.value, 10) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Subject <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Target Achievement</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editTargetAchievement}
                        onChange={(e) => setEditTargetAchievement(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Start Date </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          value={editStartDate}
                          onChange={(d) => setEditStartDate(d)}
                          placeholder="DD-MM-YYYY"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">End Date </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          value={editEndDate}
                          onChange={(d) => setEditEndDate(d)}
                          placeholder="DD-MM-YYYY"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label mb-0">Progress ({editProgress}%)</label>
                        <span className="fs-12 text-primary fw-bold">{editProgress}%</span>
                      </div>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        step="5"
                        value={editProgress}
                        onChange={(e) => setEditProgress(parseInt(e.target.value, 10))}
                      />
                      <div className="progress mt-1" style={{ width: "100%", height: "6px" }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${editProgress}%` }}
                          role="progressbar"
                          aria-valuenow={editProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={statusOptions}
                        defaultValue={
                          statusOptions.find((o) => o.value.toLowerCase() === editStatus.toLowerCase()) ||
                          statusOptions[0]
                        }
                        onChange={(opt) => setEditStatus(opt?.value || "Active")}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Goal Tracking */}
    </>
  );
};

export default GoalTrackingModal;
