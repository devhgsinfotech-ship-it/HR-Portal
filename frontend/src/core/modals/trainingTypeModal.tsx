import React, { useState, useEffect, useRef } from "react";
import CommonSelect, { Option } from "../common/commonSelect";
import apiClient from "../utils/apiClient";

export interface TrainingTypeItem {
  id: number;
  type: string;
  description: string | null;
  status: string;
  createdAt?: string;
  _count?: {
    trainingPrograms: number;
  };
}

interface TrainingTypeModalProps {
  selectedType?: TrainingTypeItem | null;
  typeToDelete?: TrainingTypeItem | null;
  onSaved: () => void;
}

const statusOptions: Option[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const TrainingTypeModal: React.FC<TrainingTypeModalProps> = ({
  selectedType,
  typeToDelete,
  onSaved,
}) => {
  // Add form state
  const [addType, setAddType] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addStatus, setAddStatus] = useState("ACTIVE");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit form state
  const [editType, setEditType] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);

  const closeAddBtnRef = useRef<HTMLButtonElement>(null);
  const closeEditBtnRef = useRef<HTMLButtonElement>(null);
  const closeDeleteBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedType) {
      setEditType(selectedType.type || "");
      setEditDescription(selectedType.description || "");
      setEditStatus(selectedType.status || "ACTIVE");
      setEditError(null);
    }
  }, [selectedType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addType.trim()) {
      setAddError("Please enter a training type name.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);
      await apiClient.post("/api/training/types", {
        type: addType.trim(),
        description: addDescription.trim(),
        status: addStatus,
      });

      setAddType("");
      setAddDescription("");
      setAddStatus("ACTIVE");
      closeAddBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to create training type:", err);
      setAddError(err.response?.data?.message || "Failed to create training type");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    if (!editType.trim()) {
      setEditError("Please enter a training type name.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);
      await apiClient.put(`/api/training/types/${selectedType.id}`, {
        type: editType.trim(),
        description: editDescription.trim(),
        status: editStatus,
      });

      closeEditBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to update training type:", err);
      setEditError(err.response?.data?.message || "Failed to update training type");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/api/training/types/${typeToDelete.id}`);
      closeDeleteBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to delete training type:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Add Training Type */}
      <div className="modal fade" id="add_training_type" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Training Type</h4>
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
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Type <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Git Training, React Architecture"
                        value={addType}
                        onChange={(e) => setAddType(e.target.value)}
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
                        placeholder="Brief summary of skills and objectives covered"
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
                      Adding...
                    </>
                  ) : (
                    "Add Training Type"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Training Type */}

      {/* Edit Training Type */}
      <div className="modal fade" id="edit_training_type" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Training Type</h4>
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
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Type <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
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
                        defaultValue={
                          statusOptions.find((o) => o.value === editStatus) ||
                          statusOptions[0]
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
      {/* /Edit Training Type */}

      {/* Delete Training Type Modal */}
      <div className="modal fade" id="delete_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3 text-muted">
                Are you sure you want to delete{" "}
                <strong>{typeToDelete?.type || "this item"}</strong>? This action cannot be
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
      {/* /Delete Training Type Modal */}
    </>
  );
};

export default TrainingTypeModal;
