import React, { useState } from 'react';
import apiClient from '../../../core/utils/apiClient';

interface VerifyEmployeeModalProps {
  employee: any;
  onSuccess: () => void;
}

const VerifyEmployeeModal: React.FC<VerifyEmployeeModalProps> = ({ employee, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this employee? This will fully activate their account.')) {
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/employees/${employee.id}/approve-onboarding`);
      alert('Employee approved successfully!');
      
      // Close the modal
      const modal = document.getElementById('verify_employee_modal');
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
      }
      
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error approving employee');
    } finally {
      setLoading(false);
    }
  };

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div className="modal fade" id="verify_employee_modal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title text-white">Review Employee Verification</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" onClick={() => onSuccess()} />
          </div>
          {employee ? (
            <>
              <div className="modal-body p-4">
            
            <div className="row mb-4">
              <div className="col-12 border-bottom pb-2 mb-3">
                <h6 className="fw-semibold text-primary"><i className="ti ti-user me-2"></i>Personal Details</h6>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1 fs-13">Full Name</p>
                <p className="fw-medium text-dark">{employee.raw?.firstName} {employee.raw?.lastName}</p>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1 fs-13">Date of Birth</p>
                <p className="fw-medium text-dark">{employee.raw?.dateOfBirth ? new Date(employee.raw.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1 fs-13">Gender</p>
                <p className="fw-medium text-dark">{employee.raw?.gender || 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1 fs-13">Emergency Contact</p>
                <p className="fw-medium text-dark">{employee.raw?.emergencyContactName} ({employee.raw?.emergencyContactPhone || 'N/A'})</p>
              </div>
              <div className="col-12 mb-3">
                <p className="text-muted mb-1 fs-13">Full Address</p>
                <p className="fw-medium text-dark">{employee.raw?.address || 'N/A'}</p>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12 border-bottom pb-2 mb-3">
                <h6 className="fw-semibold text-primary"><i className="ti ti-building-bank me-2"></i>Bank Details</h6>
              </div>
              {employee.raw?.bankDetails ? (
                <>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">Bank Name</p>
                    <p className="fw-medium text-dark">{employee.raw.bankDetails.bankName}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">Branch</p>
                    <p className="fw-medium text-dark">{employee.raw.bankDetails.branchName}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">Account Name</p>
                    <p className="fw-medium text-dark">{employee.raw.bankDetails.accountName}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">Account Number</p>
                    <p className="fw-medium text-dark">{employee.raw.bankDetails.accountNumber}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">IFSC Code</p>
                    <p className="fw-medium text-dark">{employee.raw.bankDetails.ifscCode}</p>
                  </div>
                </>
              ) : (
                <div className="col-12"><p className="text-danger">No bank details provided.</p></div>
              )}
            </div>

            <div className="row mb-4">
              <div className="col-12 border-bottom pb-2 mb-3">
                <h6 className="fw-semibold text-primary"><i className="ti ti-file-description me-2"></i>Uploaded Documents</h6>
              </div>
              <div className="col-12">
                <div className="d-flex flex-column gap-3">
                  {employee.aadhaarPath ? (
                    <div className="d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
                      <div className="d-flex align-items-center">
                        <i className="ti ti-file-text text-primary fs-4 me-3"></i>
                        <div>
                          <p className="mb-0 fw-medium">Aadhaar Card</p>
                          <small className="text-muted">Uploaded for identity verification</small>
                        </div>
                      </div>
                      <a href={`${backendUrl}${employee.aadhaarPath}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                        <i className="ti ti-eye me-1"></i> View
                      </a>
                    </div>
                  ) : (
                    <p className="text-danger mb-0"><i className="ti ti-alert-circle me-1"></i> Aadhaar Card missing</p>
                  )}

                  {employee.panPath ? (
                    <div className="d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
                      <div className="d-flex align-items-center">
                        <i className="ti ti-file-text text-primary fs-4 me-3"></i>
                        <div>
                          <p className="mb-0 fw-medium">PAN Card</p>
                          <small className="text-muted">Uploaded for tax verification</small>
                        </div>
                      </div>
                      <a href={`${backendUrl}${employee.panPath}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                        <i className="ti ti-eye me-1"></i> View
                      </a>
                    </div>
                  ) : (
                    <p className="text-danger mb-0"><i className="ti ti-alert-circle me-1"></i> PAN Card missing</p>
                  )}

                  {employee.resumePath && (
                    <div className="d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
                      <div className="d-flex align-items-center">
                        <i className="ti ti-file-text text-primary fs-4 me-3"></i>
                        <div>
                          <p className="mb-0 fw-medium">Resume / CV</p>
                        </div>
                      </div>
                      <a href={`${backendUrl}${employee.resumePath}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                        <i className="ti ti-eye me-1"></i> View
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="alert alert-warning mb-0">
              <i className="ti ti-info-circle me-2"></i>
              Please carefully review the bank details and documents. Clicking "Approve" will mark this employee's profile as fully active.
            </div>
            
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
            <button type="button" className="btn btn-success" onClick={handleApprove} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : <i className="ti ti-check me-2"></i>}
              Approve Verification
            </button>
          </div>
          </>
          ) : (
            <div className="modal-body p-4 text-center">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmployeeModal;
