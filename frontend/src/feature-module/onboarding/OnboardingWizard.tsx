import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { all_routes } from '../../router/all_routes';
import ImageWithBasePath from '../../core/common/imageWithBasePath';
import { APP_CONFIG } from '../../environment';
import { useAppDispatch, useAppSelector } from '../../core/data/redux/store';
import { updateUser } from '../../core/data/redux/authSlice';

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state: any) => state.auth.user);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Personal Details
  const [personal, setPersonal] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfJoining: '',
    profilePhotoUrl: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  // Step 2: Bank Details
  const [bank, setBank] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: ''
  });

  // Step 3: Documents
  const [docs, setDocs] = useState<{ aadhaar: File | null, pan: File | null, resume: File | null }>({
    aadhaar: null,
    pan: null,
    resume: null
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl = APP_CONFIG.getBackendUrl();
        const res = await axios.get(`${apiUrl}/employees/me`, { headers: getAuthHeaders() });
        if (res.data) {
          const emp = res.data;
          
          setPersonal({
            firstName: emp.firstName || emp.user?.name?.split(' ')[0] || '',
            lastName: emp.lastName || emp.user?.name?.split(' ').slice(1).join(' ') || '',
            phone: emp.phone || emp.user?.phone || '',
            dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '',
            profilePhotoUrl: emp.profilePhotoUrl || '',
            dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : '',
            gender: emp.gender || '',
            address: emp.address || '',
            emergencyContactName: emp.emergencyContactName || '',
            emergencyContactPhone: emp.emergencyContactPhone || ''
          });

          if (emp.profilePhotoUrl) {
            const backendUrl = APP_CONFIG.getBackendUrl();
            setPhotoPreview(emp.profilePhotoUrl.startsWith('http') ? emp.profilePhotoUrl : `${backendUrl}${emp.profilePhotoUrl}`);
            dispatch(updateUser({ profilePhotoUrl: emp.profilePhotoUrl }));
          }

          if (emp.bankDetails) {
            setBank({
              bankName: emp.bankDetails.bankName || '',
              accountName: emp.bankDetails.accountName || '',
              accountNumber: emp.bankDetails.accountNumber || '',
              ifscCode: emp.bankDetails.ifscCode || '',
              branchName: emp.bankDetails.branchName || ''
            });
          }

          if (emp.onboardingStatus === 'CORRECTION_REQUESTED' && emp.rejectionReason) {
            setRejectionReason(emp.rejectionReason);
          }
        }
      } catch (err) {
        console.error('Error fetching onboarding profile info:', err);
      }
    };

    fetchProfile();
  }, []);

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const apiUrl = APP_CONFIG.getBackendUrl();
      const formData = new FormData();
      formData.append('firstName', personal.firstName);
      formData.append('lastName', personal.lastName);
      formData.append('phone', personal.phone);
      formData.append('dateOfJoining', personal.dateOfJoining);
      if (personal.dateOfBirth) formData.append('dateOfBirth', personal.dateOfBirth);
      if (personal.gender) formData.append('gender', personal.gender);
      if (personal.address) formData.append('address', personal.address);
      if (personal.emergencyContactName) formData.append('emergencyContactName', personal.emergencyContactName);
      if (personal.emergencyContactPhone) formData.append('emergencyContactPhone', personal.emergencyContactPhone);
      formData.append('profilePhotoUrl', personal.profilePhotoUrl);
      if (photoFile) formData.append('profilePhoto', photoFile);

      const res = await axios.put(`${apiUrl}/employees/onboarding/personal`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.employee?.profilePhotoUrl) {
        dispatch(updateUser({ profilePhotoUrl: res.data.employee.profilePhotoUrl }));
      }

      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save personal details');
    } finally {
      setLoading(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const apiUrl = APP_CONFIG.getBackendUrl();
      await axios.post(`${apiUrl}/employees/onboarding/bank`, bank, { headers: getAuthHeaders() });
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleDocsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      if (docs.aadhaar) formData.append('aadhaar', docs.aadhaar);
      if (docs.pan) formData.append('pan', docs.pan);
      if (docs.resume) formData.append('resume', docs.resume);

      const apiUrl = APP_CONFIG.getBackendUrl();
      const res = await axios.post(`${apiUrl}/employees/onboarding/documents`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
      });

      // Update user onboarding status to COMPLETED (Auto-Approved) via Redux
      dispatch(updateUser({ onboardingStatus: 'COMPLETED' }));
      const role = currentUser?.role || '';

      alert(res.data.message || 'Onboarding completed and account auto-approved successfully!');
      
      // Navigate directly to dashboard
      if (role === 'SUPER_ADMIN') {
        navigate(all_routes.superAdminDashboard);
      } else if (role === 'COMPANY_ADMIN') {
        navigate(all_routes.adminDashboard);
      } else if (role === 'HR') {
        navigate(all_routes.hrDashboard);
      } else {
        navigate(all_routes.employeeDashboard);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="container mt-5">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '800px' }}>
          <div className="card-header bg-primary text-white text-center p-4">
            <h3 className="text-white">Welcome to SmartHR Onboarding</h3>
            <p className="mb-0 text-white-50">Please complete your profile to access your workspace</p>
          </div>

          <div className="card-body p-5">
            {/* Stepper Header */}
            <div className="d-flex justify-content-between mb-5 position-relative">
              <div className="progress position-absolute" style={{ top: '50%', left: '0', right: '0', height: '3px', zIndex: 0 }}>
                <div className="progress-bar bg-primary" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
              </div>
              <div className={`btn btn-sm rounded-circle ${step >= 1 ? 'btn-primary' : 'btn-light'} position-relative z-1`} style={{ width: '40px', height: '40px', lineHeight: '28px' }}>1</div>
              <div className={`btn btn-sm rounded-circle ${step >= 2 ? 'btn-primary' : 'btn-light'} position-relative z-1`} style={{ width: '40px', height: '40px', lineHeight: '28px' }}>2</div>
              <div className={`btn btn-sm rounded-circle ${step >= 3 ? 'btn-primary' : 'btn-light'} position-relative z-1`} style={{ width: '40px', height: '40px', lineHeight: '28px' }}>3</div>
            </div>

            {rejectionReason && (
              <div className="alert alert-danger border-2 border-danger d-flex align-items-start mb-4 p-3 rounded">
                <i className="ti ti-alert-triangle fs-24 me-3 text-danger mt-1"></i>
                <div>
                  <h6 className="alert-heading text-danger fw-semibold mb-1">Correction Requested by Management</h6>
                  <p className="mb-0 text-dark fs-14 fw-medium">{rejectionReason}</p>
                </div>
              </div>
            )}

            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            {/* STEP 1 */}
            {step === 1 && (
              <form onSubmit={handlePersonalSubmit}>
                <h4 className="mb-4">Step 1: Personal Details</h4>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">First Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" required placeholder="Enter first name"
                      value={personal.firstName} onChange={e => setPersonal({ ...personal, firstName: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name</label>
                    <input type="text" className="form-control" placeholder="Enter last name"
                      value={personal.lastName} onChange={e => setPersonal({ ...personal, lastName: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" required placeholder="Enter phone number"
                      value={personal.phone} onChange={e => setPersonal({ ...personal, phone: e.target.value })} />
                    <small className="text-muted fs-11">Auto-filled from HR setup. You can update if needed.</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label d-flex justify-content-between align-items-center mb-1">
                      <span>Date of Joining <span className="text-danger">*</span></span>
                      {currentUser?.role !== 'HR' && currentUser?.role !== 'COMPANY_ADMIN' && currentUser?.role !== 'SUPER_ADMIN' && (
                        <span className="badge bg-secondary-subtle text-secondary fs-11 fw-normal">
                          <i className="ti ti-lock me-1"></i>Assigned by HR Manager
                        </span>
                      )}
                    </label>
                    <input 
                      type="date" 
                      className={`form-control ${currentUser?.role !== 'HR' && currentUser?.role !== 'COMPANY_ADMIN' && currentUser?.role !== 'SUPER_ADMIN' ? 'bg-light text-muted' : ''}`}
                      required
                      readOnly={currentUser?.role !== 'HR' && currentUser?.role !== 'COMPANY_ADMIN' && currentUser?.role !== 'SUPER_ADMIN'}
                      disabled={currentUser?.role !== 'HR' && currentUser?.role !== 'COMPANY_ADMIN' && currentUser?.role !== 'SUPER_ADMIN'}
                      style={currentUser?.role !== 'HR' && currentUser?.role !== 'COMPANY_ADMIN' && currentUser?.role !== 'SUPER_ADMIN' ? { cursor: 'not-allowed' } : {}}
                      value={personal.dateOfJoining} 
                      onChange={e => {
                        if (currentUser?.role === 'HR' || currentUser?.role === 'COMPANY_ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
                          setPersonal({ ...personal, dateOfJoining: e.target.value });
                        }
                      }} 
                    />
                    {currentUser?.role !== 'HR' && currentUser?.role !== 'COMPANY_ADMIN' && currentUser?.role !== 'SUPER_ADMIN' ? (
                      <small className="text-muted fs-11 mt-1 d-block">
                        <i className="ti ti-lock me-1 text-warning"></i>Date of Joining is officially assigned by your HR Manager and cannot be changed.
                      </small>
                    ) : null}
                  </div>
                  <div className="col-md-12 mb-4">
                    <label className="form-label d-block fw-semibold text-dark text-center">Profile Photo</label>
                    <div className="d-flex flex-column align-items-center">
                      <div className="position-relative mb-2" style={{ width: '110px', height: '110px' }}>
                        <div 
                          className="rounded-circle overflow-hidden border border-2 border-primary shadow-xs d-flex align-items-center justify-content-center bg-light"
                          style={{ width: '100%', height: '100%' }}
                        >
                          {photoPreview ? (
                            <img src={photoPreview} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <i className="ti ti-user text-secondary" style={{ fontSize: '48px' }}></i>
                          )}
                        </div>
                        <label 
                          htmlFor="profile-photo-upload" 
                          className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 p-0 d-flex align-items-center justify-content-center shadow"
                          style={{ width: '34px', height: '34px', cursor: 'pointer' }}
                          title="Upload Photo"
                        >
                          <i className="ti ti-camera fs-16 text-white"></i>
                        </label>
                        <input 
                          id="profile-photo-upload"
                          type="file" 
                          className="d-none" 
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setPhotoFile(file);
                              setPhotoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </div>
                      {photoPreview && !photoFile && personal.profilePhotoUrl && (
                        <span className="badge bg-success-subtle text-success fs-11 mb-2">
                          <i className="ti ti-check me-1"></i>Pre-uploaded by HR Manager (Keep or change below)
                        </span>
                      )}
                      <div className="d-flex align-items-center gap-2">
                        <label htmlFor="profile-photo-upload" className="btn btn-outline-primary btn-sm rounded-pill px-3" style={{ cursor: 'pointer' }}>
                          <i className="ti ti-upload me-1"></i> {photoPreview ? "Change Photo" : "Choose Image"}
                        </label>
                        {photoPreview && (
                          <button 
                            type="button" 
                            className="btn btn-outline-danger btn-sm rounded-pill px-3"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview(null);
                              setPersonal({ ...personal, profilePhotoUrl: '' });
                            }}
                          >
                            <i className="ti ti-trash me-1"></i> Remove
                          </button>
                        )}
                      </div>
                      <small className="text-muted mt-2 fs-12">Supported formats: JPG, PNG, WEBP (Max 4MB)</small>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" className="form-control" required
                      value={personal.dateOfBirth} onChange={e => setPersonal({ ...personal, dateOfBirth: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Gender</label>
                    <select className="form-select" required
                      value={personal.gender} onChange={e => setPersonal({ ...personal, gender: e.target.value })}>
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Full Address</label>
                    <textarea className="form-control" rows={3} required
                      value={personal.address} onChange={e => setPersonal({ ...personal, address: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Secondary/Others Contact No.</label>
                    <input type="text" className="form-control" required
                      value={personal.emergencyContactName} onChange={e => setPersonal({ ...personal, emergencyContactName: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Emergency Contact Phone</label>
                    <input type="text" className="form-control" required
                      value={personal.emergencyContactPhone} onChange={e => setPersonal({ ...personal, emergencyContactPhone: e.target.value })} />
                  </div>
                </div>
                <div className="text-end mt-4">
                  <button type="submit" className="btn btn-primary px-5" disabled={loading}>Next <i className="ti ti-arrow-right ms-2"></i></button>
                </div>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form onSubmit={handleBankSubmit}>
                <h4 className="mb-4">Step 2: Bank Details</h4>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Bank Name</label>
                    <input type="text" className="form-control" required
                      value={bank.bankName} onChange={e => setBank({ ...bank, bankName: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Branch Name</label>
                    <input type="text" className="form-control" required
                      value={bank.branchName} onChange={e => setBank({ ...bank, branchName: e.target.value })} />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Account Holder Name</label>
                    <input type="text" className="form-control" required
                      value={bank.accountName} onChange={e => setBank({ ...bank, accountName: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Account Number</label>
                    <input type="text" className="form-control" required
                      value={bank.accountNumber} onChange={e => setBank({ ...bank, accountNumber: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">IFSC Code</label>
                    <input type="text" className="form-control" required
                      value={bank.ifscCode} onChange={e => setBank({ ...bank, ifscCode: e.target.value })} />
                  </div>
                </div>
                <div className="d-flex justify-content-between mt-4">
                  <button type="button" className="btn btn-light px-4" onClick={() => setStep(1)}><i className="ti ti-arrow-left me-2"></i> Back</button>
                  <button type="submit" className="btn btn-primary px-5" disabled={loading}>Next <i className="ti ti-arrow-right ms-2"></i></button>
                </div>
              </form>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={handleDocsSubmit}>
                <h4 className="mb-4">Step 3: Document Uploads</h4>
                <p className="text-muted mb-4">Please upload scanned copies (PDF/Image) of the following documents. These are required for background verification.</p>
                <div className="row">
                  <div className="col-md-12 mb-4">
                    <label className="form-label">Aadhaar Card <span className="text-danger">*</span></label>
                    <input type="file" className="form-control" required accept=".pdf,image/*"
                      onChange={e => setDocs({ ...docs, aadhaar: e.target.files ? e.target.files[0] : null })} />
                  </div>
                  <div className="col-md-12 mb-4">
                    <label className="form-label">PAN Card <span className="text-danger">*</span></label>
                    <input type="file" className="form-control" required accept=".pdf,image/*"
                      onChange={e => setDocs({ ...docs, pan: e.target.files ? e.target.files[0] : null })} />
                  </div>
                  <div className="col-md-12 mb-4">
                    <label className="form-label">Resume / CV (Optional)</label>
                    <input type="file" className="form-control" accept=".pdf,.doc,.docx"
                      onChange={e => setDocs({ ...docs, resume: e.target.files ? e.target.files[0] : null })} />
                  </div>
                </div>
                <div className="d-flex justify-content-between mt-4">
                  <button type="button" className="btn btn-light px-4" onClick={() => setStep(2)}><i className="ti ti-arrow-left me-2"></i> Back</button>
                  <button type="submit" className="btn btn-success px-5" disabled={loading}>Submit & Finish <i className="ti ti-check ms-2"></i></button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
