import React, { useState, useEffect, useRef } from "react";
import CommonSelect, { Option } from "../common/commonSelect";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import apiClient from "../utils/apiClient";
import ImageWithBasePath from "../common/imageWithBasePath";

export interface ParticipantItem {
  id: number;
  employeeId: number;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
    profilePhotoUrl?: string | null;
  };
}

export interface TrainingProgramRecord {
  id: number;
  trainingTypeId: number;
  trainingType?: {
    id: number;
    type: string;
    description?: string | null;
  };
  trainerId?: number | null;
  trainer?: {
    id: number;
    firstName: string;
    lastName: string;
    role?: string | null;
    profilePhotoUrl?: string | null;
  } | null;
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  cost?: number | string | null;
  status: string;
  participants: ParticipantItem[];
}

interface TrainingListModalProps {
  selectedProgram?: TrainingProgramRecord | null;
  programToDelete?: TrainingProgramRecord | null;
  trainingTypes: any[];
  trainers: any[];
  employees: any[];
  onSaved: () => void;
}

const statusOptions: Option[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TrainingListModal: React.FC<TrainingListModalProps> = ({
  selectedProgram,
  programToDelete,
  trainingTypes,
  trainers,
  employees,
  onSaved,
}) => {
  // Add Form State
  const [addTypeId, setAddTypeId] = useState<number | null>(null);
  const [addTrainerId, setAddTrainerId] = useState<number | null>(null);
  const [addTitle, setAddTitle] = useState("");
  const [addEmployeeIds, setAddEmployeeIds] = useState<number[]>([]);
  const [addCost, setAddCost] = useState("");
  const [addStartDate, setAddStartDate] = useState<Dayjs | null>(null);
  const [addEndDate, setAddEndDate] = useState<Dayjs | null>(null);
  const [addDescription, setAddDescription] = useState("");
  const [addStatus, setAddStatus] = useState("ACTIVE");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Form State
  const [editTypeId, setEditTypeId] = useState<number | null>(null);
  const [editTrainerId, setEditTrainerId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editEmployeeIds, setEditEmployeeIds] = useState<number[]>([]);
  const [editCost, setEditCost] = useState("");
  const [editStartDate, setEditStartDate] = useState<Dayjs | null>(null);
  const [editEndDate, setEditEndDate] = useState<Dayjs | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete State
  const [deleteLoading, setDeleteLoading] = useState(false);

  const closeAddBtnRef = useRef<HTMLButtonElement>(null);
  const closeEditBtnRef = useRef<HTMLButtonElement>(null);
  const closeDeleteBtnRef = useRef<HTMLButtonElement>(null);

  // Populate options
  const typeOptions: Option[] = [
    { value: "", label: "Select Training Type" },
    ...trainingTypes.map((t) => ({ value: String(t.id), label: t.type })),
  ];

  const trainerOptions: Option[] = [
    { value: "", label: "Select Trainer" },
    ...trainers.map((tr) => ({
      value: String(tr.id),
      label: `${tr.firstName} ${tr.lastName}${tr.role ? ` (${tr.role})` : ""}`,
    })),
  ];

  useEffect(() => {
    if (selectedProgram) {
      setEditTypeId(selectedProgram.trainingTypeId);
      setEditTrainerId(selectedProgram.trainerId || null);
      setEditTitle(selectedProgram.title || "");
      setEditEmployeeIds(selectedProgram.participants?.map((p) => p.employeeId) || []);
      setEditCost(
        selectedProgram.cost !== null && selectedProgram.cost !== undefined
          ? String(selectedProgram.cost)
          : ""
      );
      setEditStartDate(selectedProgram.startDate ? dayjs(selectedProgram.startDate) : null);
      setEditEndDate(selectedProgram.endDate ? dayjs(selectedProgram.endDate) : null);
      setEditDescription(selectedProgram.description || "");
      setEditStatus(selectedProgram.status || "ACTIVE");
      setEditError(null);
    }
  }, [selectedProgram]);

  const toggleAddEmployee = (empId: number) => {
    setAddEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const toggleEditEmployee = (empId: number) => {
    setEditEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTypeId) {
      setAddError("Please select a training type.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);
      await apiClient.post("/api/training/programs", {
        trainingTypeId: addTypeId,
        trainerId: addTrainerId,
        title: addTitle.trim(),
        employeeIds: addEmployeeIds,
        cost: addCost,
        startDate: addStartDate ? addStartDate.format("YYYY-MM-DD") : null,
        endDate: addEndDate ? addEndDate.format("YYYY-MM-DD") : null,
        description: addDescription.trim(),
        status: addStatus,
      });

      // Reset
      setAddTitle("");
      setAddCost("");
      setAddEmployeeIds([]);
      setAddStartDate(null);
      setAddEndDate(null);
      setAddDescription("");
      closeAddBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to create training program:", err);
      setAddError(err.response?.data?.message || "Failed to create training program");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) return;
    if (!editTypeId) {
      setEditError("Please select a training type.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);
      await apiClient.put(`/api/training/programs/${selectedProgram.id}`, {
        trainingTypeId: editTypeId,
        trainerId: editTrainerId,
        title: editTitle.trim(),
        employeeIds: editEmployeeIds,
        cost: editCost,
        startDate: editStartDate ? editStartDate.format("YYYY-MM-DD") : null,
        endDate: editEndDate ? editEndDate.format("YYYY-MM-DD") : null,
        description: editDescription.trim(),
        status: editStatus,
      });

      closeEditBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to update training program:", err);
      setEditError(err.response?.data?.message || "Failed to update training program");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!programToDelete) return;
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/api/training/programs/${programToDelete.id}`);
      closeDeleteBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to delete training program:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Add Training Program */}
      <div className="modal fade" id="add_training" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Training Program</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ref={closeAddBtnRef}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body pb-0">
                {addError && (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    <i className="ti ti-alert-triangle me-1" />
                    {addError}
                  </div>
                )}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Training Type <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={typeOptions}
                        defaultValue={typeOptions[0]}
                        onChange={(opt) => setAddTypeId(opt?.value ? parseInt(opt.value) : null)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Trainer</label>
                      <CommonSelect
                        className="select"
                        options={trainerOptions}
                        defaultValue={trainerOptions[0]}
                        onChange={(opt) =>
                          setAddTrainerId(opt?.value ? parseInt(opt.value) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Program Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Git Fundamentals Workshop"
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Training Cost ($ / ₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="e.g. 250"
                        value={addCost}
                        onChange={(e) => setAddCost(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Start Date</label>
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
                      <label className="form-label">End Date</label>
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

                  {/* Enrolled Employees Selection */}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label d-flex justify-content-between">
                        <span>Enrolled Team Members ({addEmployeeIds.length} selected)</span>
                        {employees.length > 0 && (
                          <span
                            className="text-primary fs-12 cursor-pointer"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              setAddEmployeeIds(
                                addEmployeeIds.length === employees.length
                                  ? []
                                  : employees.map((e) => e.id)
                              )
                            }
                          >
                            {addEmployeeIds.length === employees.length
                              ? "Clear All"
                              : "Select All"}
                          </span>
                        )}
                      </label>
                      <div
                        className="border rounded p-2"
                        style={{ maxHeight: "140px", overflowY: "auto" }}
                      >
                        {employees.map((emp) => {
                          const isSelected = addEmployeeIds.includes(emp.id);
                          return (
                            <div
                              key={emp.id}
                              className={`d-flex align-items-center justify-content-between p-1 px-2 rounded mb-1 ${
                                isSelected ? "bg-light-primary border border-primary" : "bg-light"
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleAddEmployee(emp.id)}
                            >
                              <div className="d-flex align-items-center">
                                <span className="avatar avatar-xs avatar-rounded me-2 border">
                                  <ImageWithBasePath
                                    src={`assets/img/users/${emp.profilePhotoUrl || "user-32.jpg"}`}
                                    className="img-fluid"
                                    alt="emp avatar"
                                  />
                                </span>
                                <span className="fs-13 fw-medium">
                                  {emp.firstName} {emp.lastName}
                                </span>
                                <small className="text-muted ms-2">({emp.employeeCode})</small>
                              </div>
                              <input
                                type="checkbox"
                                className="form-check-input ms-2"
                                checked={isSelected}
                                onChange={() => {}}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Brief summary of program goals and schedule"
                        value={addDescription}
                        onChange={(e) => setAddDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={statusOptions}
                        defaultValue={statusOptions[0]}
                        onChange={(opt) => setAddStatus(opt?.value || "ACTIVE")}
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
                      Creating...
                    </>
                  ) : (
                    "Add Training"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Training Program */}

      {/* Edit Training Program */}
      <div className="modal fade" id="edit_training" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Training Program</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ref={closeEditBtnRef}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body pb-0">
                {editError && (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    <i className="ti ti-alert-triangle me-1" />
                    {editError}
                  </div>
                )}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Training Type <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={typeOptions}
                        defaultValue={
                          typeOptions.find((o) => o.value === String(editTypeId)) ||
                          typeOptions[0]
                        }
                        onChange={(opt) => setEditTypeId(opt?.value ? parseInt(opt.value) : null)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Trainer</label>
                      <CommonSelect
                        className="select"
                        options={trainerOptions}
                        defaultValue={
                          trainerOptions.find((o) => o.value === String(editTrainerId)) ||
                          trainerOptions[0]
                        }
                        onChange={(opt) =>
                          setEditTrainerId(opt?.value ? parseInt(opt.value) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Program Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Training Cost ($ / ₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Start Date</label>
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
                      <label className="form-label">End Date</label>
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

                  {/* Enrolled Employees Selection */}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label d-flex justify-content-between">
                        <span>Enrolled Team Members ({editEmployeeIds.length} selected)</span>
                        {employees.length > 0 && (
                          <span
                            className="text-primary fs-12 cursor-pointer"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              setEditEmployeeIds(
                                editEmployeeIds.length === employees.length
                                  ? []
                                  : employees.map((e) => e.id)
                              )
                            }
                          >
                            {editEmployeeIds.length === employees.length
                              ? "Clear All"
                              : "Select All"}
                          </span>
                        )}
                      </label>
                      <div
                        className="border rounded p-2"
                        style={{ maxHeight: "140px", overflowY: "auto" }}
                      >
                        {employees.map((emp) => {
                          const isSelected = editEmployeeIds.includes(emp.id);
                          return (
                            <div
                              key={emp.id}
                              className={`d-flex align-items-center justify-content-between p-1 px-2 rounded mb-1 ${
                                isSelected ? "bg-light-primary border border-primary" : "bg-light"
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => toggleEditEmployee(emp.id)}
                            >
                              <div className="d-flex align-items-center">
                                <span className="avatar avatar-xs avatar-rounded me-2 border">
                                  <ImageWithBasePath
                                    src={`assets/img/users/${emp.profilePhotoUrl || "user-32.jpg"}`}
                                    className="img-fluid"
                                    alt="emp avatar"
                                  />
                                </span>
                                <span className="fs-13 fw-medium">
                                  {emp.firstName} {emp.lastName}
                                </span>
                                <small className="text-muted ms-2">({emp.employeeCode})</small>
                              </div>
                              <input
                                type="checkbox"
                                className="form-check-input ms-2"
                                checked={isSelected}
                                onChange={() => {}}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={statusOptions}
                        defaultValue={
                          statusOptions.find((o) => o.value === editStatus) || statusOptions[0]
                        }
                        onChange={(opt) => setEditStatus(opt?.value || "ACTIVE")}
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
      {/* /Edit Training Program */}

      {/* Delete Training Program Modal */}
      <div className="modal fade" id="delete_training_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3 text-muted">
                Are you sure you want to delete training program{" "}
                <strong>{programToDelete?.title || "this item"}</strong>? This action cannot be
                undone.
              </p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                  ref={closeDeleteBtnRef}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn btn-danger"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Training Program Modal */}
    </>
  );
};

export default TrainingListModal;
