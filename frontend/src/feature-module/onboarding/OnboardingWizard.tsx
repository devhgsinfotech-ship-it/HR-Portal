import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { all_routes } from '../../router/all_routes';
import ImageWithBasePath from '../../core/common/imageWithBasePath';
import { APP_CONFIG } from '../../environment';

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Personal Details
  const [personal, setPersonal] = useState({
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const apiUrl = APP_CONFIG.getBackendUrl();
      await axios.put(`${apiUrl}/employees/onboarding/personal`, personal, { headers: getAuthHeaders() });
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

      // Update local storage user onboarding status
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.onboardingStatus = 'DOCS_SUBMITTED';
        localStorage.setItem('user', JSON.stringify(user));
      }

      alert(res.data.message);
      // Send them to a "Waiting for HR Approval" screen or just dashboard which will block them
      navigate(all_routes.employeeDashboard);
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

            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            {/* STEP 1 */}
            {step === 1 && (
              <form onSubmit={handlePersonalSubmit}>
                <h4 className="mb-4">Step 1: Personal Details</h4>
                <div className="row">
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
