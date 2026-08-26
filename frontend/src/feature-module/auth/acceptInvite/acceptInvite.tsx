import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { all_routes } from '../../../router/all_routes';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { APP_CONFIG } from '../../../environment';
import apiClient, { getSubdomain } from '../../../core/utils/apiClient';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const subdomain = getSubdomain();
  const [resolvedLogo, setResolvedLogo] = useState<string | null>(null);
  const [resolvedCompanyName, setResolvedCompanyName] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const fetchSubdomainLogo = async () => {
      if (!subdomain) return;
      try {
        setLogoError(false);
        const res = await apiClient.get(`/auth/company-logo?subdomain=${subdomain}`);
        if (res.data?.success) {
          setResolvedLogo(res.data.logoUrl);
          setResolvedCompanyName(res.data.companyName);
        }
      } catch (err) {
        console.error("Failed to fetch subdomain logo:", err);
      }
    };
    fetchSubdomainLogo();
  }, [subdomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      return setErrorMsg('Passwords do not match');
    }

    if (password.length < 8) {
      return setErrorMsg('Password must be at least 8 characters long');
    }

    setLoading(true);
    try {
      // Get the correct backend URL
      const apiUrl = APP_CONFIG.getBackendUrl();
      const res = await axios.post(`${apiUrl}/auth/accept-invite`, {
        token,
        password
      });

      setSuccessMsg(res.data.message || 'Account set up successfully! You can now login.');
      setTimeout(() => {
        navigate(all_routes.login);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to set up account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="container-fuild">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
          <div className="row">
            <div className="col-lg-5">
              <div className="d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100 bg-primary-transparent">
                <div>
                  <ImageWithBasePath src="assets/img/bg/authentication-bg-06.svg" alt="Img" />
                </div>
              </div>
            </div>
            <div className="col-lg-7 col-md-12 col-sm-12">
              <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
                <div className="col-md-7 mx-auto vh-100">
                  <form onSubmit={handleSubmit} className="vh-100">
                    <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                      <div className="mx-auto mb-5 text-center">
                        {resolvedLogo && !logoError ? (
                          <img 
                            src={resolvedLogo.startsWith('http') ? resolvedLogo : `${apiClient.defaults.baseURL || 'https://api.aaups.com'}${resolvedLogo}`} 
                            alt={resolvedCompanyName || "Logo"} 
                            className="img-fluid" 
                            style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain' }}
                            onError={() => setLogoError(true)}
                          />
                        ) : (
                          <h2 className="mb-0 text-primary fw-bold" style={{ letterSpacing: '0.5px' }}>
                            {resolvedCompanyName || "HGS-HRMS"}
                          </h2>
                        )}
                      </div>
                      <div>
                        <div className="text-center mb-3">
                          <h2 className="mb-2">Accept Invitation</h2>
                          <p className="mb-0">Please set your password to activate your account.</p>
                        </div>
                        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                        {successMsg && <div className="alert alert-success">{successMsg}</div>}
                        
                        <div className="mb-3">
                          <label className="form-label">New Password</label>
                          <div className="pass-group">
                            <input 
                              type="password" 
                              className="form-control" 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required 
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Confirm Password</label>
                          <div className="pass-group">
                            <input 
                              type="password" 
                              className="form-control" 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required 
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Setting up...' : 'Setup Account'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-5 pb-4 text-center">
                        <p className="mb-0 text-gray-9">@HGS HR Management</p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvite;
