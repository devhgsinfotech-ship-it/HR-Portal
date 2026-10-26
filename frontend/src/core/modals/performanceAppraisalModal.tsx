import React, { useState, useEffect, useRef } from "react";
import CommonSelect, { Option } from "../common/commonSelect";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import apiClient from "../utils/apiClient";

export interface AppraisalRecord {
  id: number;
  employeeId: number;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
  profilePhotoUrl?: string | null;
  reviewerId: number | null;
  reviewerName?: string;
  appraisalCycle: string | null;
  appraisalDate: string | null;
  selfRating: number | null;
  managerRating: number | null;
  finalRating: number | null;
  competencyScore: number | null;
  strengths: string | null;
  areasForImprovement: string | null;
  employeeRemarks: string | null;
  managerRemarks: string | null;
  hrRemarks: string | null;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED";
  createdAt: string;
}

interface PerformanceAppraisalModalProps {
  selectedAppraisal?: AppraisalRecord | null;
  employees: any[];
  canManage: boolean;
  onSaved: () => void;
}

const statusOptions: Option[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "APPROVED", label: "Approved" },
];

const PerformanceAppraisalModal: React.FC<PerformanceAppraisalModalProps> = ({
  selectedAppraisal,
  employees,
  canManage,
  onSaved,
}) => {
  // Add State
  const [addEmpId, setAddEmpId] = useState<number | null>(null);
  const [addRevId, setAddRevId] = useState<number | null>(null);
  const [addCycle, setAddCycle] = useState("Annual 2026");
  const [addDate, setAddDate] = useState<Dayjs | null>(dayjs());
  const [addSelfRating, setAddSelfRating] = useState("4.0");
  const [addManagerRating, setAddManagerRating] = useState("4.0");
  const [addFinalRating, setAddFinalRating] = useState("4.0");
  const [addCompetencyScore, setAddCompetencyScore] = useState("85");
  const [addStrengths, setAddStrengths] = useState("");
  const [addImprovements, setAddImprovements] = useState("");
  const [addEmpRemarks, setAddEmpRemarks] = useState("");
  const [addMgrRemarks, setAddMgrRemarks] = useState("");
  const [addHrRemarks, setAddHrRemarks] = useState("");
  const [addStatus, setAddStatus] = useState("SUBMITTED");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit State
  const [editEmpId, setEditEmpId] = useState<number | null>(null);
  const [editRevId, setEditRevId] = useState<number | null>(null);
  const [editCycle, setEditCycle] = useState("");
  const [editDate, setEditDate] = useState<Dayjs | null>(null);
  const [editSelfRating, setEditSelfRating] = useState("4.0");
  const [editManagerRating, setEditManagerRating] = useState("4.0");
  const [editFinalRating, setEditFinalRating] = useState("4.0");
  const [editCompetencyScore, setEditCompetencyScore] = useState("85");
  const [editStrengths, setEditStrengths] = useState("");
  const [editImprovements, setEditImprovements] = useState("");
  const [editEmpRemarks, setEditEmpRemarks] = useState("");
  const [editMgrRemarks, setEditMgrRemarks] = useState("");
  const [editHrRemarks, setEditHrRemarks] = useState("");
  const [editStatus, setEditStatus] = useState("DRAFT");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const closeAddBtnRef = useRef<HTMLButtonElement>(null);
  const closeEditBtnRef = useRef<HTMLButtonElement>(null);

  const employeeOptions: Option[] = [
    { value: "", label: "Select Employee" },
    ...employees.map((e) => ({
      value: String(e.id),
      label: `${e.name} (${e.employeeCode || "EMP"}) - ${e.departmentName || ""}`,
    })),
  ];

  const reviewerOptions: Option[] = [
    { value: "", label: "Select Reviewer / Manager" },
    ...employees.map((e) => ({
      value: String(e.id),
      label: `${e.name} (${e.designationName || "Manager"})`,
    })),
  ];

  useEffect(() => {
    if (selectedAppraisal) {
      setEditEmpId(selectedAppraisal.employeeId);
      setEditRevId(selectedAppraisal.reviewerId);
      setEditCycle(selectedAppraisal.appraisalCycle || "Annual 2026");
      setEditDate(selectedAppraisal.appraisalDate ? dayjs(selectedAppraisal.appraisalDate) : null);
      setEditSelfRating(selectedAppraisal.selfRating ? String(selectedAppraisal.selfRating) : "4.0");
      setEditManagerRating(selectedAppraisal.managerRating ? String(selectedAppraisal.managerRating) : "4.0");
      setEditFinalRating(selectedAppraisal.finalRating ? String(selectedAppraisal.finalRating) : "4.0");
      setEditCompetencyScore(selectedAppraisal.competencyScore ? String(selectedAppraisal.competencyScore) : "85");
      setEditStrengths(selectedAppraisal.strengths || "");
      setEditImprovements(selectedAppraisal.areasForImprovement || "");
      setEditEmpRemarks(selectedAppraisal.employeeRemarks || "");
      setEditMgrRemarks(selectedAppraisal.managerRemarks || "");
      setEditHrRemarks(selectedAppraisal.hrRemarks || "");
      setEditStatus(selectedAppraisal.status || "DRAFT");
      setEditError(null);
    }
  }, [selectedAppraisal]);

  const handleCreateAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmpId && canManage) {
      setAddError("Please select an Employee for the appraisal.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);

      await apiClient.post("/api/performance/appraisals", {
        employeeId: addEmpId || undefined,
        reviewerId: addRevId || undefined,
        appraisalCycle: addCycle.trim(),
        appraisalDate: addDate ? addDate.format("YYYY-MM-DD") : null,
        selfRating: parseFloat(addSelfRating) || null,
        managerRating: parseFloat(addManagerRating) || null,
        finalRating: parseFloat(addFinalRating) || null,
        competencyScore: parseFloat(addCompetencyScore) || null,
        strengths: addStrengths.trim(),
        areasForImprovement: addImprovements.trim(),
        employeeRemarks: addEmpRemarks.trim(),
        managerRemarks: addMgrRemarks.trim(),
        hrRemarks: addHrRemarks.trim(),
        status: addStatus,
      });

      closeAddBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to create appraisal:", err);
      setAddError(err.response?.data?.message || "Failed to create Appraisal");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppraisal) return;

    try {
      setEditLoading(true);
      setEditError(null);

      await apiClient.put(`/api/performance/appraisals/${selectedAppraisal.id}`, {
        reviewerId: editRevId || null,
        appraisalCycle: editCycle.trim(),
        appraisalDate: editDate ? editDate.format("YYYY-MM-DD") : null,
        selfRating: parseFloat(editSelfRating) || null,
        managerRating: parseFloat(editManagerRating) || null,
        finalRating: parseFloat(editFinalRating) || null,
        competencyScore: parseFloat(editCompetencyScore) || null,
        strengths: editStrengths.trim(),
        areasForImprovement: editImprovements.trim(),
        employeeRemarks: editEmpRemarks.trim(),
        managerRemarks: editMgrRemarks.trim(),
        hrRemarks: editHrRemarks.trim(),
        status: editStatus,
      });

      closeEditBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to update appraisal:", err);
      setEditError(err.response?.data?.message || "Failed to update Appraisal");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      {/* Add Appraisal Modal */}
      <div className="modal fade" id="add_performance_appraisal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Create Performance Appraisal</h4>
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
            <form onSubmit={handleCreateAppraisal}>
              <div className="modal-body pb-0">
                {addError && (
                  <div className="alert alert-danger py-2 px-3 fs-13 mb-3">
                    <i className="ti ti-alert-circle me-1" />
                    {addError}
                  </div>
                )}
                <div className="row">
                  {canManage && (
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Employee <span className="text-danger">*</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={employeeOptions}
                          defaultValue={employeeOptions[0]}
                          onChange={(opt) =>
                            setAddEmpId(opt?.value ? parseInt(opt.value, 10) : null)
                          }
                        />
                      </div>
                    </div>
                  )}
                  <div className={canManage ? "col-md-6" : "col-md-6"}>
                    <div className="mb-3">
                      <label className="form-label">Reviewer / Lead</label>
                      <CommonSelect
                        className="select"
                        options={reviewerOptions}
                        defaultValue={reviewerOptions[0]}
                        onChange={(opt) =>
                          setAddRevId(opt?.value ? parseInt(opt.value, 10) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Appraisal Cycle</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Q1 2026, Mid-Year 2026, Annual 2026"
                        value={addCycle}
                        onChange={(e) => setAddCycle(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Appraisal Date</label>
                      <DatePicker
                        className="form-control datetimepicker"
                        format="YYYY-MM-DD"
                        value={addDate}
                        onChange={(d) => setAddDate(d)}
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <h6 className="fw-bold text-primary mt-2 mb-2 border-bottom pb-2">
                      <i className="ti ti-star me-1" /> Ratings &amp; Scores (1.0 to 5.0)
                    </h6>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Self Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        className="form-control"
                        value={addSelfRating}
                        onChange={(e) => setAddSelfRating(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Manager Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        className="form-control"
                        value={addManagerRating}
                        onChange={(e) => setAddManagerRating(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Final Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        className="form-control"
                        value={addFinalRating}
                        onChange={(e) => setAddFinalRating(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Competency %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-control"
                        value={addCompetencyScore}
                        onChange={(e) => setAddCompetencyScore(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Key Strengths</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Core achievements, exceptional contributions"
                        value={addStrengths}
                        onChange={(e) => setAddStrengths(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Areas for Improvement</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Skill gaps, coaching needs, development focus"
                        value={addImprovements}
                        onChange={(e) => setAddImprovements(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Manager Remarks</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={addMgrRemarks}
                        onChange={(e) => setAddMgrRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">HR / Committee Remarks</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={addHrRemarks}
                        onChange={(e) => setAddHrRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={statusOptions}
                        defaultValue={statusOptions[1]}
                        onChange={(opt) => setAddStatus(opt?.value || "SUBMITTED")}
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
                    "Save Appraisal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Appraisal Modal */}

      {/* Edit Appraisal Modal */}
      <div className="modal fade" id="edit_performance_appraisal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Performance Appraisal</h4>
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
            <form onSubmit={handleUpdateAppraisal}>
              <div className="modal-body pb-0">
                {editError && (
                  <div className="alert alert-danger py-2 px-3 fs-13 mb-3">
                    <i className="ti ti-alert-circle me-1" />
                    {editError}
                  </div>
                )}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Reviewer / Lead</label>
                      <CommonSelect
                        className="select"
                        options={reviewerOptions}
                        defaultValue={
                          reviewerOptions.find((r) => r.value === String(editRevId)) ||
                          reviewerOptions[0]
                        }
                        onChange={(opt) =>
                          setEditRevId(opt?.value ? parseInt(opt.value, 10) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Appraisal Cycle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editCycle}
                        onChange={(e) => setEditCycle(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Appraisal Date</label>
                      <DatePicker
                        className="form-control datetimepicker"
                        format="YYYY-MM-DD"
                        value={editDate}
                        onChange={(d) => setEditDate(d)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={statusOptions}
                        defaultValue={
                          statusOptions.find((s) => s.value === editStatus) || statusOptions[0]
                        }
                        onChange={(opt) => setEditStatus(opt?.value || "DRAFT")}
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <h6 className="fw-bold text-primary mt-2 mb-2 border-bottom pb-2">
                      <i className="ti ti-star me-1" /> Ratings &amp; Scores
                    </h6>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Self Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        className="form-control"
                        value={editSelfRating}
                        onChange={(e) => setEditSelfRating(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Manager Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        className="form-control"
                        value={editManagerRating}
                        onChange={(e) => setEditManagerRating(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Final Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        className="form-control"
                        value={editFinalRating}
                        onChange={(e) => setEditFinalRating(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Competency %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-control"
                        value={editCompetencyScore}
                        onChange={(e) => setEditCompetencyScore(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Key Strengths</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={editStrengths}
                        onChange={(e) => setEditStrengths(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Areas for Improvement</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={editImprovements}
                        onChange={(e) => setEditImprovements(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Manager Remarks</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={editMgrRemarks}
                        onChange={(e) => setEditMgrRemarks(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">HR / Committee Remarks</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={editHrRemarks}
                        onChange={(e) => setEditHrRemarks(e.target.value)}
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
      {/* /Edit Appraisal Modal */}
    </>
  );
};

export default PerformanceAppraisalModal;
