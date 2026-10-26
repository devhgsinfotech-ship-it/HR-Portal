import React, { useState, useEffect, useRef } from "react";
import CommonSelect, { Option } from "../common/commonSelect";
import apiClient from "../utils/apiClient";

export interface TrainerRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  trainerType?: string;
  status: string;
  profilePhotoUrl?: string | null;
  description?: string | null;
  _count?: {
    trainingPrograms: number;
  };
}

interface TrainersModalProps {
  selectedTrainer?: TrainerRecord | null;
  trainerToDelete?: TrainerRecord | null;
  onSaved: () => void;
}

const statusOptions: Option[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const trainerTypeOptions: Option[] = [
  { value: "INTERNAL", label: "Internal" },
  { value: "EXTERNAL", label: "External" },
];

const avatarPresets = [
  "user-32.jpg",
  "user-09.jpg",
  "user-01.jpg",
  "user-33.jpg",
  "user-34.jpg",
  "user-35.jpg",
];

const TrainersModal: React.FC<TrainersModalProps> = ({
  selectedTrainer,
  trainerToDelete,
  onSaved,
}) => {
  // Add Trainer State
  const [addFirstName, setAddFirstName] = useState("");
  const [addLastName, setAddLastName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addRole, setAddRole] = useState("");
  const [addTrainerType, setAddTrainerType] = useState("INTERNAL");
  const [addStatus, setAddStatus] = useState("ACTIVE");
  const [addPhoto, setAddPhoto] = useState("user-32.jpg");
  const [addDescription, setAddDescription] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Trainer State
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editTrainerType, setEditTrainerType] = useState("INTERNAL");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editPhoto, setEditPhoto] = useState("user-32.jpg");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete State
  const [deleteLoading, setDeleteLoading] = useState(false);

  const closeAddBtnRef = useRef<HTMLButtonElement>(null);
  const closeEditBtnRef = useRef<HTMLButtonElement>(null);
  const closeDeleteBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedTrainer) {
      setEditFirstName(selectedTrainer.firstName || "");
      setEditLastName(selectedTrainer.lastName || "");
      setEditEmail(selectedTrainer.email || "");
      setEditPhone(selectedTrainer.phone || "");
      setEditRole(selectedTrainer.role || "");
      setEditTrainerType(selectedTrainer.trainerType || "INTERNAL");
      setEditStatus(selectedTrainer.status || "ACTIVE");
      setEditPhoto(selectedTrainer.profilePhotoUrl || "user-32.jpg");
      setEditDescription(selectedTrainer.description || "");
      setEditError(null);
    }
  }, [selectedTrainer]);

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName.trim() || !addLastName.trim() || !addEmail.trim()) {
      setAddError("First name, last name, and email are required.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);
      await apiClient.post("/api/training/trainers", {
        firstName: addFirstName.trim(),
        lastName: addLastName.trim(),
        email: addEmail.trim(),
        phone: addPhone.trim(),
        role: addRole.trim(),
        trainerType: addTrainerType,
        status: addStatus,
        profilePhotoUrl: addPhoto,
        description: addDescription.trim(),
      });

      // Reset
      setAddFirstName("");
      setAddLastName("");
      setAddEmail("");
      setAddPhone("");
      setAddRole("");
      setAddDescription("");
      closeAddBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to create trainer:", err);
      setAddError(err.response?.data?.message || "Failed to create trainer");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer) return;
    if (!editFirstName.trim() || !editLastName.trim() || !editEmail.trim()) {
      setEditError("First name, last name, and email are required.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);
      await apiClient.put(`/api/training/trainers/${selectedTrainer.id}`, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        role: editRole.trim(),
        trainerType: editTrainerType,
        status: editStatus,
        profilePhotoUrl: editPhoto,
        description: editDescription.trim(),
      });

      closeEditBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to update trainer:", err);
      setEditError(err.response?.data?.message || "Failed to update trainer");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTrainer = async () => {
    if (!trainerToDelete) return;
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/api/training/trainers/${trainerToDelete.id}`);
      closeDeleteBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to delete trainer:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Add Trainer */}
      <div className="modal fade" id="add_trainer" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Trainer</h4>
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
            <form onSubmit={handleCreateTrainer}>
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
                        First Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Anthony"
                        value={addFirstName}
                        onChange={(e) => setAddFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Last Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Lewis"
                        value={addLastName}
                        onChange={(e) => setAddLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. anthony.lewis@example.com"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. (555) 234-8291"
                        value={addPhone}
                        onChange={(e) => setAddPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Role / Expertise</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Senior Cloud Architect"
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Trainer Type</label>
                      <CommonSelect
                        className="select"
                        options={trainerTypeOptions}
                        defaultValue={trainerTypeOptions[0]}
                        onChange={(opt) => setAddTrainerType(opt?.value || "INTERNAL")}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
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
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Profile Avatar</label>
                      <select
                        className="form-select"
                        value={addPhoto}
                        onChange={(e) => setAddPhoto(e.target.value)}
                      >
                        {avatarPresets.map((p, idx) => (
                          <option key={p} value={p}>
                            Avatar Preset {idx + 1} ({p})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description / Bio</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Brief background and expertise summary"
                        value={addDescription}
                        onChange={(e) => setAddDescription(e.target.value)}
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
                    "Add Trainer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Trainer */}

      {/* Edit Trainer */}
      <div className="modal fade" id="edit_trainer" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Trainer</h4>
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
            <form onSubmit={handleUpdateTrainer}>
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
                        First Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Last Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Role / Expertise</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Trainer Type</label>
                      <CommonSelect
                        className="select"
                        options={trainerTypeOptions}
                        defaultValue={
                          trainerTypeOptions.find((o) => o.value === editTrainerType) ||
                          trainerTypeOptions[0]
                        }
                        onChange={(opt) => setEditTrainerType(opt?.value || "INTERNAL")}
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
                          statusOptions.find((o) => o.value === editStatus) ||
                          statusOptions[0]
                        }
                        onChange={(opt) => setEditStatus(opt?.value || "ACTIVE")}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Profile Avatar</label>
                      <select
                        className="form-select"
                        value={editPhoto}
                        onChange={(e) => setEditPhoto(e.target.value)}
                      >
                        {avatarPresets.map((p, idx) => (
                          <option key={p} value={p}>
                            Avatar Preset {idx + 1} ({p})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description / Bio</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
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
      {/* /Edit Trainer */}

      {/* Delete Trainer Modal */}
      <div className="modal fade" id="delete_trainer_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3 text-muted">
                Are you sure you want to delete trainer{" "}
                <strong>
                  {trainerToDelete ? `${trainerToDelete.firstName} ${trainerToDelete.lastName}` : "this item"}
                </strong>
                ? This action cannot be undone.
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
                  onClick={handleDeleteTrainer}
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
      {/* /Delete Trainer Modal */}
    </>
  );
};

export default TrainersModal;
