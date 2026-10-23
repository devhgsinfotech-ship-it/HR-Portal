import React, { useState } from "react";
import apiClient from "@/core/utils/apiClient";

interface MetadataEmployee {
  id: number;
  employeeCode: string;
  name: string;
  departmentName: string;
}

interface WfhModalProps {
  employees: MetadataEmployee[];
  isEmployee: boolean;
  onSuccess: () => void;
}

const WorkFromHomeModal: React.FC<WfhModalProps> = ({
  employees,
  isEmployee,
  onSuccess,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmployee && !selectedEmpId) {
      setErrorMsg("Please select an employee.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("Start date and end date are required.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg("End date cannot be earlier than start date.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      await apiClient.post("/api/shifts/wfh", {
        employeeId: isEmployee ? undefined : selectedEmpId,
        startDate,
        endDate,
        reason,
      });

      // Reset
      setStartDate("");
      setEndDate("");
      setReason("");
      setSelectedEmpId("");

      document.getElementById("close_wfh_modal")?.click();
      onSuccess();
    } catch (err: any) {
      console.error("Error creating WFH request:", err);
      setErrorMsg(err.response?.data?.message || "Failed to submit WFH request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal fade" id="apply_wfh_modal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center">
              <i className="ti ti-home-check me-2 text-primary" />
              Apply Work From Home (WFH)
            </h5>
            <button
              id="close_wfh_modal"
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errorMsg && (
                <div className="alert alert-danger py-2 fs-13 mb-3">{errorMsg}</div>
              )}

              <div className="row g-3">
                {!isEmployee && (
                  <div className="col-12">
                    <label className="form-label">
                      Employee <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedEmpId}
                      onChange={(e) => setSelectedEmpId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={String(emp.id)}>
                          {emp.name} ({emp.employeeCode}) - {emp.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-md-6">
                  <label className="form-label">
                    From Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    To Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Reason for WFH <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide details (e.g. medical reason, travel constraint, remote sprint)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
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
                    Submitting...
                  </>
                ) : (
                  "Submit WFH Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkFromHomeModal;