import React, { useState, useEffect, useRef } from "react";
import CommonSelect, { Option } from "../common/commonSelect";
import apiClient from "../utils/apiClient";

export interface IndicatorRecord {
  id: number;
  departmentId: number | null;
  designationId: number | null;
  departmentName?: string;
  designationName?: string;
  addedByName?: string;
  addedByAvatar?: string | null;
  customerExperience: string | null;
  marketing: string | null;
  management: string | null;
  administration: string | null;
  presentationSkills: string | null;
  qualityOfWork: string | null;
  efficiency: string | null;
  integrity: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

interface PerformanceIndicatorModalProps {
  selectedIndicator?: IndicatorRecord | null;
  departments: any[];
  designations: any[];
  onSaved: () => void;
}

const competencyOptions: Option[] = [
  { value: "None", label: "None" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Expert", label: "Expert / Leader" },
];

const statusOptions: Option[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const PerformanceIndicatorModal: React.FC<PerformanceIndicatorModalProps> = ({
  selectedIndicator,
  departments,
  designations,
  onSaved,
}) => {
  // Add State
  const [addDeptId, setAddDeptId] = useState<number | null>(null);
  const [addDesigId, setAddDesigId] = useState<number | null>(null);
  const [addCustExp, setAddCustExp] = useState("Intermediate");
  const [addMarketing, setAddMarketing] = useState("Intermediate");
  const [addManagement, setAddManagement] = useState("Intermediate");
  const [addAdmin, setAddAdmin] = useState("Intermediate");
  const [addPresSkills, setAddPresSkills] = useState("Intermediate");
  const [addQuality, setAddQuality] = useState("Advanced");
  const [addEfficiency, setAddEfficiency] = useState("Advanced");
  const [addIntegrity, setAddIntegrity] = useState("Expert");
  const [addStatus, setAddStatus] = useState("ACTIVE");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit State
  const [editDeptId, setEditDeptId] = useState<number | null>(null);
  const [editDesigId, setEditDesigId] = useState<number | null>(null);
  const [editCustExp, setEditCustExp] = useState("Intermediate");
  const [editMarketing, setEditMarketing] = useState("Intermediate");
  const [editManagement, setEditManagement] = useState("Intermediate");
  const [editAdmin, setEditAdmin] = useState("Intermediate");
  const [editPresSkills, setEditPresSkills] = useState("Intermediate");
  const [editQuality, setEditQuality] = useState("Advanced");
  const [editEfficiency, setEditEfficiency] = useState("Advanced");
  const [editIntegrity, setEditIntegrity] = useState("Expert");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const closeAddBtnRef = useRef<HTMLButtonElement>(null);
  const closeEditBtnRef = useRef<HTMLButtonElement>(null);

  const departmentOptions: Option[] = [
    { value: "", label: "Select Department" },
    ...departments.map((d) => ({ value: String(d.id), label: d.name })),
  ];

  const designationOptions: Option[] = [
    { value: "", label: "Select Designation" },
    ...designations.map((d) => ({ value: String(d.id), label: d.name })),
  ];

  useEffect(() => {
    if (selectedIndicator) {
      setEditDeptId(selectedIndicator.departmentId);
      setEditDesigId(selectedIndicator.designationId);
      setEditCustExp(selectedIndicator.customerExperience || "Intermediate");
      setEditMarketing(selectedIndicator.marketing || "Intermediate");
      setEditManagement(selectedIndicator.management || "Intermediate");
      setEditAdmin(selectedIndicator.administration || "Intermediate");
      setEditPresSkills(selectedIndicator.presentationSkills || "Intermediate");
      setEditQuality(selectedIndicator.qualityOfWork || "Advanced");
      setEditEfficiency(selectedIndicator.efficiency || "Advanced");
      setEditIntegrity(selectedIndicator.integrity || "Expert");
      setEditStatus(selectedIndicator.status || "ACTIVE");
      setEditError(null);
    }
  }, [selectedIndicator]);

  const handleCreateIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDesigId) {
      setAddError("Please select a Designation for this Indicator.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);

      await apiClient.post("/api/performance/indicators", {
        departmentId: addDeptId || null,
        designationId: addDesigId,
        customerExperience: addCustExp,
        marketing: addMarketing,
        management: addManagement,
        administration: addAdmin,
        presentationSkills: addPresSkills,
        qualityOfWork: addQuality,
        efficiency: addEfficiency,
        integrity: addIntegrity,
        status: addStatus,
      });

      closeAddBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to create indicator:", err);
      setAddError(err.response?.data?.message || "Failed to create Performance Indicator");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndicator) return;
    if (!editDesigId) {
      setEditError("Please select a Designation for this Indicator.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);

      await apiClient.put(`/api/performance/indicators/${selectedIndicator.id}`, {
        departmentId: editDeptId || null,
        designationId: editDesigId,
        customerExperience: editCustExp,
        marketing: editMarketing,
        management: editManagement,
        administration: editAdmin,
        presentationSkills: editPresSkills,
        qualityOfWork: editQuality,
        efficiency: editEfficiency,
        integrity: editIntegrity,
        status: editStatus,
      });

      closeEditBtnRef.current?.click();
      onSaved();
    } catch (err: any) {
      console.error("Failed to update indicator:", err);
      setEditError(err.response?.data?.message || "Failed to update Performance Indicator");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <>
      {/* Add Indicator */}
      <div className="modal fade" id="add_performance_indicator" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Performance Indicator</h4>
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
            <form onSubmit={handleCreateIndicator}>
              <div className="modal-body pb-0">
                {addError && (
                  <div className="alert alert-danger py-2 px-3 fs-13 mb-3">
                    <i className="ti ti-alert-circle me-1" />
                    {addError}
                  </div>
                )}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Designation <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={designationOptions}
                        defaultValue={designationOptions[0]}
                        onChange={(opt) =>
                          setAddDesigId(opt?.value ? parseInt(opt.value, 10) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Department</label>
                      <CommonSelect
                        className="select"
                        options={departmentOptions}
                        defaultValue={departmentOptions[0]}
                        onChange={(opt) =>
                          setAddDeptId(opt?.value ? parseInt(opt.value, 10) : null)
                        }
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <h6 className="fw-bold text-primary mt-2 mb-3 border-bottom pb-2">
                      <i className="ti ti-tool me-1" /> Technical Competencies
                    </h6>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Customer Experience</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={competencyOptions[2]}
                        onChange={(opt) => setAddCustExp(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Marketing</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={competencyOptions[2]}
                        onChange={(opt) => setAddMarketing(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Management</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={competencyOptions[2]}
                        onChange={(opt) => setAddManagement(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Administration</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={competencyOptions[2]}
                        onChange={(opt) => setAddAdmin(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <h6 className="fw-bold text-primary mt-2 mb-3 border-bottom pb-2">
                      <i className="ti ti-briefcase me-1" /> Organizational &amp; Professional Competencies
                    </h6>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Presentation Skills</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={competencyOptions[2]}
                        onChange={(opt) => setAddPresSkills(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Quality of Work</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={competencyOptions[3]}
                        onChange={(opt) => setAddQuality(opt?.value || "Advanced")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Efficiency</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={competencyOptions[3]}
                        onChange={(opt) => setAddEfficiency(opt?.value || "Advanced")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Integrity</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={competencyOptions[4]}
                        onChange={(opt) => setAddIntegrity(opt?.value || "Expert")}
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
                    "Add Indicator"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Indicator */}

      {/* Edit Indicator */}
      <div className="modal fade" id="edit_performance-indicator" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Performance Indicator</h4>
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
            <form onSubmit={handleUpdateIndicator}>
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
                      <label className="form-label">
                        Designation <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={designationOptions}
                        defaultValue={
                          designationOptions.find((d) => d.value === String(editDesigId)) ||
                          designationOptions[0]
                        }
                        onChange={(opt) =>
                          setEditDesigId(opt?.value ? parseInt(opt.value, 10) : null)
                        }
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Department</label>
                      <CommonSelect
                        className="select"
                        options={departmentOptions}
                        defaultValue={
                          departmentOptions.find((d) => d.value === String(editDeptId)) ||
                          departmentOptions[0]
                        }
                        onChange={(opt) =>
                          setEditDeptId(opt?.value ? parseInt(opt.value, 10) : null)
                        }
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <h6 className="fw-bold text-primary mt-2 mb-3 border-bottom pb-2">
                      <i className="ti ti-tool me-1" /> Technical Competencies
                    </h6>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Customer Experience</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={
                          competencyOptions.find((o) => o.value === editCustExp) || competencyOptions[2]
                        }
                        onChange={(opt) => setEditCustExp(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Marketing</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={
                          competencyOptions.find((o) => o.value === editMarketing) || competencyOptions[2]
                        }
                        onChange={(opt) => setEditMarketing(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Management</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={
                          competencyOptions.find((o) => o.value === editManagement) || competencyOptions[2]
                        }
                        onChange={(opt) => setEditManagement(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Administration</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={
                          competencyOptions.find((o) => o.value === editAdmin) || competencyOptions[2]
                        }
                        onChange={(opt) => setEditAdmin(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <h6 className="fw-bold text-primary mt-2 mb-3 border-bottom pb-2">
                      <i className="ti ti-briefcase me-1" /> Organizational &amp; Professional Competencies
                    </h6>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Presentation Skills</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={
                          competencyOptions.find((o) => o.value === editPresSkills) || competencyOptions[2]
                        }
                        onChange={(opt) => setEditPresSkills(opt?.value || "Intermediate")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Quality of Work</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={
                          competencyOptions.find((o) => o.value === editQuality) || competencyOptions[3]
                        }
                        onChange={(opt) => setEditQuality(opt?.value || "Advanced")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Efficiency</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={
                          competencyOptions.find((o) => o.value === editEfficiency) || competencyOptions[3]
                        }
                        onChange={(opt) => setEditEfficiency(opt?.value || "Advanced")}
                      />
                    </div>
                  </div>
                  <div className="col-md-3 col-sm-6">
                    <div className="mb-3">
                      <label className="form-label fs-13">Integrity</label>
                      <CommonSelect
                        className="select"
                        options={competencyOptions}
                        defaultValue={
                          competencyOptions.find((o) => o.value === editIntegrity) || competencyOptions[4]
                        }
                        onChange={(opt) => setEditIntegrity(opt?.value || "Expert")}
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
      {/* /Edit Indicator */}
    </>
  );
};

export default PerformanceIndicatorModal;
