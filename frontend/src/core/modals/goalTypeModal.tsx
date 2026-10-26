import React, { useState, useEffect, useRef } from "react";
import CommonSelect, { Option } from "../common/commonSelect";
import apiClient from "../utils/apiClient";

export interface GoalTypeItem {
  id: number;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  goalsCount?: number;
}

interface GoalTypeModalProps {
  selectedGoalType?: GoalTypeItem | null;
  onSaved: () => void;
}

const statusOptions: Option[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const GoalTypeModal: React.FC<GoalTypeModalProps> = ({ selectedGoalType, onSaved }) => {
  // Add State
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addStatus, setAddStatus] = useState<string>("ACTIVE");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit State
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<string>("ACTIVE");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const closeAddBtnRef = useRef<HTMLButtonElement>(null);
  const closeEditBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedGoalType) {
      setEditName(selectedGoalType.name || "");
      setEditDescription(selectedGoalType.description || "");
      setEditStatus(selectedGoalType.status || "ACTIVE");
      setEditError(null);
    }
  }, [selectedGoalType]);

  const handleCreateGoalType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setAddError("Please enter a Goal Type name.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);
      await apiClient.post("/api/performance/goal-types", {
        name: addName.trim(),
        description: addDescription.trim(),
        status: addStatus,
      });

      setAddName("");
      setAddDescription("");
      setAddStatus("ACTIVE");
      closeAddBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to create goal type:", err);
      setAddError(err.response?.data?.message || "Failed to create Goal Type");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateGoalType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalType) return;
    if (!editName.trim()) {
      setEditError("Please enter a Goal Type name.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);
      await apiClient.put(`/api/performance/goal-types/${selectedGoalType.id}`, {
        name: editName.trim(),
        description: editDescription.trim(),
        status: editStatus,
      });

      closeEditBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to update goal type:", err);
      setEditError(err.response?.data?.message || "Failed to update Goal Type");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      {/* Add Goal Type */}
      <div className="modal fade" id="add_goal_type" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Goal Type</h4>
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
            <form onSubmit={handleCreateGoalType}>
              <div className="modal-body pb-0">
                {addError && (
                  <div className="alert alert-danger py-2 px-3 fs-13 mb-3">
                    <i className="ti ti-alert-circle me-1" />
                    {addError}
                  </div>
                )}
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Goal Type <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Quarterly Objectives, Skill Development"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Purpose and scope of this goal type"
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
                      Saving...
                    </>
                  ) : (
                    "Add Goal Type"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Goal Type */}

      {/* Edit Goal Type */}
      <div className="modal fade" id="edit_goal_type" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Goal Type</h4>
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
            <form onSubmit={handleUpdateGoalType}>
              <div className="modal-body pb-0">
                {editError && (
                  <div className="alert alert-danger py-2 px-3 fs-13 mb-3">
                    <i className="ti ti-alert-circle me-1" />
                    {editError}
                  </div>
                )}
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Goal Type <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
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
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={statusOptions}
                        defaultValue={statusOptions.find((o) => o.value === editStatus) || statusOptions[0]}
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
      {/* /Edit Goal Type */}
    </>
  );
};

export default GoalTypeModal;
