import React, { useState, useEffect } from 'react';
import apiClient from '../../../core/utils/apiClient';
import { APP_CONFIG } from '../../../environment';

interface VerifyEmployeeModalProps {
  employee: any;
  onSuccess: () => void;
}

const VerifyEmployeeModal: React.FC<VerifyEmployeeModalProps> = ({ employee, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(employee);
  const [uploadingDoc, setUploadingDoc] = useState<'aadhaar' | 'pan' | 'resume' | null>(null);

  useEffect(() => {
    setCurrentEmployee(employee);
  }, [employee]);

  const handleFileChange = async (fieldName: 'aadhaar' | 'pan' | 'resume', file: File) => {
    if (!file) return;
    setUploadingDoc(fieldName);
    const formData = new FormData();
    formData.append(fieldName, file);
    try {
      const res = await apiClient.put(`/employees/${currentEmployee.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updatedEmpData = res.data.employee;
      setCurrentEmployee((prev: any) => ({
        ...prev,
        aadhaarPath: updatedEmpData.aadhaarPath,
        panPath: updatedEmpData.panPath,
        resumePath: updatedEmpData.resumePath,
        raw: {
          ...prev.raw,
          aadhaarPath: updatedEmpData.aadhaarPath,
          panPath: updatedEmpData.panPath,
          resumePath: updatedEmpData.resumePath,
        }
      }));
      alert(`${fieldName === 'aadhaar' ? 'Aadhaar Card' : fieldName === 'pan' ? 'PAN Card' : 'Resume'} updated successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to update ${fieldName}`);
    } finally {
      setUploadingDoc(null);
    }
  };

  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const handleRequestCorrection = async () => {
    if (!showRejectReason) {
      setShowRejectReason(true);
      return;
    }
    if (!rejectReason.trim()) {
      alert('Please enter a reason for the correction request.');
      return;
    }
    setRejectLoading(true);
    try {
      await apiClient.post(`/employees/${currentEmployee.id}/request-correction`, { reason: rejectReason });
      alert('Correction request sent to employee successfully!');
      
      // Close modal
      const modal = document.getElementById('verify_employee_modal');
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
      }
      
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error requesting correction');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this employee? This will fully activate their account.')) {
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/employees/${currentEmployee.id}/approve-onboarding`);
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

  const backendUrl = APP_CONFIG.getBackendUrl();


  return (
    <div className="modal fade" id="verify_employee_modal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title text-white">Review Employee Verification</h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" onClick={() => onSuccess()} />
          </div>
          {currentEmployee ? (
            <>
              <div className="modal-body p-4">
            
            <div className="row mb-4">
              <div className="col-12 border-bottom pb-2 mb-3">
                <h6 className="fw-semibold text-primary"><i className="ti ti-user me-2"></i>Personal Details</h6>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1 fs-13">Full Name</p>
                <p className="fw-medium text-dark">{currentEmployee.raw?.firstName} {currentEmployee.raw?.lastName}</p>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1 fs-13">Date of Birth</p>
                <p className="fw-medium text-dark">{currentEmployee.raw?.dateOfBirth ? new Date(currentEmployee.raw.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1 fs-13">Gender</p>
                <p className="fw-medium text-dark">{currentEmployee.raw?.gender || 'N/A'}</p>
              </div>
              <div className="col-md-6 mb-3">
                <p className="text-muted mb-1 fs-13">Emergency Contact</p>
                <p className="fw-medium text-dark">{currentEmployee.raw?.emergencyContactName} ({currentEmployee.raw?.emergencyContactPhone || 'N/A'})</p>
              </div>
              <div className="col-12 mb-3">
                <p className="text-muted mb-1 fs-13">Full Address</p>
                <p className="fw-medium text-dark">{currentEmployee.raw?.address || 'N/A'}</p>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12 border-bottom pb-2 mb-3">
                <h6 className="fw-semibold text-primary"><i className="ti ti-building-bank me-2"></i>Bank Details</h6>
              </div>
              {currentEmployee.raw?.bankDetails ? (
                <>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">Bank Name</p>
                    <p className="fw-medium text-dark">{currentEmployee.raw.bankDetails.bankName}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">Branch</p>
                    <p className="fw-medium text-dark">{currentEmployee.raw.bankDetails.branchName}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">Account Name</p>
                    <p className="fw-medium text-dark">{currentEmployee.raw.bankDetails.accountName}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">Account Number</p>
                    <p className="fw-medium text-dark">{currentEmployee.raw.bankDetails.accountNumber}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1 fs-13">IFSC Code</p>
                    <p className="fw-medium text-dark">{currentEmployee.raw.bankDetails.ifscCode}</p>
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
                  
                  {/* Aadhaar Card Row */}
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
                    <div className="d-flex align-items-center">
                      <i className="ti ti-file-text text-primary fs-4 me-3"></i>
                      <div>
                        <p className="mb-0 fw-medium">Aadhaar Card</p>
                        {currentEmployee.aadhaarPath ? (
                          <small className="text-success">Uploaded for identity verification</small>
                        ) : (
                          <small className="text-danger">Aadhaar Card missing</small>
                        )}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {currentEmployee.aadhaarPath && (
                        <a href={`${backendUrl}${currentEmployee.aadhaarPath}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                          <i className="ti ti-eye me-1"></i> View
                        </a>
                      )}
                      <label htmlFor="upload-aadhaar-input" className="btn btn-sm btn-outline-secondary mb-0 cursor-pointer">
                        {uploadingDoc === 'aadhaar' ? 'Uploading...' : currentEmployee.aadhaarPath ? 'Replace' : 'Upload'}
                      </label>
                      <input 
                        type="file" 
                        id="upload-aadhaar-input" 
                        style={{ display: 'none' }} 
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange('aadhaar', e.target.files[0]);
                          }
                        }}
                        disabled={uploadingDoc !== null}
                      />
                    </div>
                  </div>

                  {/* PAN Card Row */}
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
                    <div className="d-flex align-items-center">
                      <i className="ti ti-file-text text-primary fs-4 me-3"></i>
                      <div>
                        <p className="mb-0 fw-medium">PAN Card</p>
                        {currentEmployee.panPath ? (
                          <small className="text-success">Uploaded for tax verification</small>
                        ) : (
                          <small className="text-danger">PAN Card missing</small>
                        )}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {currentEmployee.panPath && (
                        <a href={`${backendUrl}${currentEmployee.panPath}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                          <i className="ti ti-eye me-1"></i> View
                        </a>
                      )}
                      <label htmlFor="upload-pan-input" className="btn btn-sm btn-outline-secondary mb-0 cursor-pointer">
                        {uploadingDoc === 'pan' ? 'Uploading...' : currentEmployee.panPath ? 'Replace' : 'Upload'}
                      </label>
                      <input 
                        type="file" 
                        id="upload-pan-input" 
                        style={{ display: 'none' }} 
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange('pan', e.target.files[0]);
                          }
                        }}
                        disabled={uploadingDoc !== null}
                      />
                    </div>
                  </div>

                  {/* Resume / CV Row */}
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
                    <div className="d-flex align-items-center">
                      <i className="ti ti-file-text text-primary fs-4 me-3"></i>
                      <div>
                        <p className="mb-0 fw-medium">Resume / CV</p>
                        {currentEmployee.resumePath ? (
                          <small className="text-success">Uploaded resume</small>
                        ) : (
                          <small className="text-muted">No resume uploaded</small>
                        )}
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {currentEmployee.resumePath && (
                        <a href={`${backendUrl}${currentEmployee.resumePath}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                          <i className="ti ti-eye me-1"></i> View
                        </a>
                      )}
                      <label htmlFor="upload-resume-input" className="btn btn-sm btn-outline-secondary mb-0 cursor-pointer">
                        {uploadingDoc === 'resume' ? 'Uploading...' : currentEmployee.resumePath ? 'Replace' : 'Upload'}
                      </label>
                      <input 
                        type="file" 
                        id="upload-resume-input" 
                        style={{ display: 'none' }} 
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileChange('resume', e.target.files[0]);
                          }
                        }}
                        disabled={uploadingDoc !== null}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="alert alert-warning mb-0">
              <i className="ti ti-info-circle me-2"></i>
              Please carefully review the bank details and documents. Clicking "Approve" will mark this employee's profile as fully active.
            </div>

            {showRejectReason && (
              <div className="mt-3 p-3 bg-light rounded border border-danger">
                <label className="form-label fw-semibold text-danger">Specify Correction Instructions for Employee:</label>
                <textarea 
                  className="form-control border-danger" 
                  rows={3} 
                  placeholder="Tell the employee what they need to fix (e.g. 'Please upload a clear picture of your PAN card. The current one is blurred.')" 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}
            
          </div>
          <div className="modal-footer d-flex justify-content-between">
            <div>
              <button 
                type="button" 
                className={`btn ${showRejectReason ? 'btn-danger' : 'btn-outline-danger'}`} 
                onClick={handleRequestCorrection} 
                disabled={loading || rejectLoading}
              >
                {rejectLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="ti ti-alert-triangle me-2"></i>
                )}
                {showRejectReason ? 'Submit Correction Request' : 'Request Correction'}
              </button>
              {showRejectReason && (
                <button type="button" className="btn btn-link text-muted ms-2" onClick={() => setShowRejectReason(false)}>Cancel</button>
              )}
            </div>
            <div>
              <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Close</button>
              {!showRejectReason && (
                <button type="button" className="btn btn-success" onClick={handleApprove} disabled={loading || rejectLoading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : <i className="ti ti-check me-2"></i>}
                  Approve Verification
                </button>
              )}
            </div>
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
