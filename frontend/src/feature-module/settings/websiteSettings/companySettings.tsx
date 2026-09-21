import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import apiClient from "../../../core/utils/apiClient";

const resolveImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendBase = apiClient.defaults.baseURL || "http://localhost:5000";
  return `${backendBase.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
};

const CompanySettings = () => {
  const routes = all_routes;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subdomain: "",
    address: "",
    industry: "",
    companySize: "",
    logoUrl: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [billingCycleToggle, setBillingCycleToggle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [upgradingPlanId, setUpgradingPlanId] = useState<number | null>(null);

  const fetchAvailablePlans = async () => {
    try {
      const res = await apiClient.get('/super-admin/plans');
      if (Array.isArray(res.data)) {
        setAvailablePlans(res.data.filter((p: any) => p.isActive));
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/auth/company-settings');
        if (res.data?.success && res.data.company) {
          const comp = res.data.company;
          setFormData({
            name: comp.name || "",
            email: comp.email || "",
            phone: comp.phone || "",
            subdomain: comp.subdomain || "",
            address: comp.address || "",
            industry: comp.industry || "",
            companySize: comp.companySize || "",
            logoUrl: comp.logoUrl || "",
          });
          if (comp.logoUrl) {
            setPreviewLogo(comp.logoUrl);
          }
        }

        // Fetch company subscription details
        const subRes = await apiClient.get('/api/subscription/company');
        if (subRes.data) {
          setSubscriptionData(subRes.data);
        }

        fetchAvailablePlans();
      } catch (err: any) {
        console.error("Failed to load company settings:", err);
        setMessage({ type: 'danger', text: err.response?.data?.message || "Failed to load company settings." });
      } finally {
        setLoading(false);
      }
    };
    fetchCompanySettings();
  }, []);

  const handleUpgradePlan = async (targetPlanId: number) => {
    try {
      setUpgradingPlanId(targetPlanId);
      const res = await apiClient.post('/api/subscription/company/change-plan', {
        planId: targetPlanId,
        billingCycle: billingCycleToggle
      });
      alert(res.data?.message || 'Plan upgraded successfully!');
      const subRes = await apiClient.get('/api/subscription/company');
      if (subRes.data) setSubscriptionData(subRes.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upgrade plan');
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("address", formData.address);
      submitData.append("industry", formData.industry);
      submitData.append("companySize", formData.companySize);
      if (logoFile) {
        submitData.append("logo", logoFile);
      }

      const res = await apiClient.put('/auth/company-settings', submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: "Company settings updated and saved successfully!" });
        if (res.data.company?.logoUrl) {
          setFormData(prev => ({ ...prev, logoUrl: res.data.company.logoUrl }));
          setPreviewLogo(res.data.company.logoUrl);
        }
      }
    } catch (err: any) {
      console.error("Failed to save company settings:", err);
      setMessage({ type: 'danger', text: err.response?.data?.message || "Failed to save company settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between border-bottom pb-3">
            <div className="my-auto mb-2">
              <h3 className="page-title mb-1">Website Settings</h3>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/index">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">Website Settings</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Company Settings
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              <div className="pe-1 mb-2">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="tooltip-top">Refresh</Tooltip>}
                >
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-outline-light bg-white btn-icon me-1"
                  >
                    <i className="ti ti-refresh" />
                  </button>
                </OverlayTrigger>
              </div>
            </div>
          </div>

          {message && (
            <div className={`alert alert-${message.type} alert-dismissible fade show mt-3 mb-3`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)} aria-label="Close" />
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading Company Settings...</span>
              </div>
            </div>
          ) : (
            <div className="row">
              <div className="col-xxl-2 col-xl-3">
                <div className="pt-3 d-flex flex-column list-group mb-4">
                  <Link
                    to={routes.companySettings}
                    className="d-block rounded p-2 active"
                  >
                    Company Settings
                  </Link>
                  <Link to={routes.localization} className="d-block rounded p-2">
                    Localization
                  </Link>
                  <Link to={routes.prefixes} className="d-block rounded p-2">
                    Prefixes
                  </Link>
                  <Link to={routes.preference} className="d-block rounded p-2">
                    Preferences
                  </Link>
                  <Link
                    to={routes.socialAuthentication}
                    className="d-block rounded p-2"
                  >
                    Social Authentication
                  </Link>
                  <Link to={routes.language} className="d-block rounded p-2">
                    Language
                  </Link>
                </div>
              </div>
              <div className="col-xxl-10 col-xl-9">
                <div className="flex-fill border-start ps-3">
                  <form onSubmit={handleSubmit}>
                    <div className="d-flex align-items-center justify-content-between flex-wrap border-bottom pt-3 mb-3">
                      <div className="mb-3">
                        <h5>Company Settings</h5>
                        <p>Provide your company information and workspace details</p>
                      </div>
                      <div className="mb-3">
                        <button className="btn btn-light me-2" type="button" onClick={() => window.location.reload()}>
                          Cancel
                        </button>
                        <button className="btn btn-primary" type="submit" disabled={saving}>
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="d-md-flex d-block">
                      <div className="flex-fill">
                        <div className="card">
                          <div className="card-header">
                            <h5>Company Information</h5>
                          </div>
                          <div className="card-body pb-0">
                            <div className="d-block d-xl-flex">
                              <div className="mb-3 flex-fill me-xl-3 me-0">
                                <label className="form-label">Company Name</label>
                                <input
                                  type="text"
                                  name="name"
                                  className="form-control"
                                  placeholder="Enter Company Name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                              <div className="mb-3 flex-fill">
                                <label className="form-label">Phone Number</label>
                                <input
                                  type="text"
                                  name="phone"
                                  className="form-control"
                                  placeholder="Enter Phone Number"
                                  value={formData.phone}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">
                                Company Email Address
                              </label>
                              <input
                                type="email"
                                name="email"
                                className="form-control"
                                placeholder="Enter Email"
                                value={formData.email}
                                onChange={handleChange}
                              />
                            </div>
                            <div className="d-block d-xl-flex">
                              <div className="mb-3 flex-fill me-xl-3 me-0">
                                <label className="form-label">Workspace Subdomain</label>
                                <input
                                  type="text"
                                  name="subdomain"
                                  className="form-control bg-light"
                                  value={formData.subdomain}
                                  disabled
                                  readOnly
                                />
                              </div>
                              <div className="mb-3 flex-fill">
                                <label className="form-label">Industry</label>
                                <input
                                  type="text"
                                  name="industry"
                                  className="form-control"
                                  placeholder="e.g. Technology, Software"
                                  value={formData.industry}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="card">
                          <div className="card-header">
                            <h5>Address Information</h5>
                          </div>
                          <div className="card-body pb-0">
                            <div className="mb-3">
                              <label className="form-label">Address</label>
                              <input
                                type="text"
                                name="address"
                                className="form-control"
                                placeholder="Enter Address"
                                value={formData.address}
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="settings-right-sidebar ms-md-3">
                        <div className="card">
                          <div className="card-header">
                            <h5>Company Logo</h5>
                          </div>
                          <div className="card-body text-center">
                            <div className="border-bottom mb-3 pb-3">
                              <div className="d-flex align-items-center justify-content-center mb-3">
                                <div
                                  className="border rounded-3 p-2 bg-white shadow-sm d-flex align-items-center justify-content-center"
                                  style={{ width: "130px", height: "130px", overflow: "hidden" }}
                                >
                                  {previewLogo ? (
                                    <img
                                      src={resolveImageUrl(previewLogo) || ""}
                                      alt="Company Logo"
                                      style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                                    />
                                  ) : (
                                    <div className="text-center p-2">
                                      <i className="ti ti-building-store fs-32 text-primary mb-1 d-block" />
                                      <span className="fs-12 text-muted fw-medium d-block">{formData.name || "Logo"}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="profile-uploader profile-uploader-two mb-0">
                                <span className="d-block text-center lh-1 fs-24 mb-1">
                                  <i className="ti ti-upload" />
                                </span>
                                <div className="drag-upload-btn bg-transparent me-0 border-0">
                                  <p className="fs-12 mb-2">
                                    <span className="text-primary">Click to Upload</span> Logo File
                                  </p>
                                  <h6>JPG or PNG</h6>
                                </div>
                                <input
                                  type="file"
                                  className="form-control image-sign"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Subscription & Plan Status Card */}
                        {subscriptionData && (
                          <div className="card mt-3">
                            <div className="card-header d-flex align-items-center justify-content-between">
                              <h5 className="mb-0">Workspace Plan</h5>
                              <span className={`badge ${subscriptionData.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'} badge-xs`}>
                                {subscriptionData.status}
                              </span>
                            </div>
                            <div className="card-body">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <span className="fw-bold text-dark fs-16">{subscriptionData.plan?.name}</span>
                                <span className="text-primary fw-medium">${subscriptionData.plan?.priceMonthly}/mo</span>
                              </div>
                              <p className="fs-12 text-muted mb-3">{subscriptionData.plan?.description}</p>
                              
                              {subscriptionData.status === 'TRIAL' && (
                                <div className="alert alert-warning py-2 px-3 fs-12 mb-3">
                                  <i className="ti ti-clock me-1" />
                                  <strong>14-Day Free Trial:</strong> {subscriptionData.trialDaysLeft} days remaining.
                                </div>
                              )}

                              {/* Employee Quota Meter */}
                              <div className="mb-3">
                                <div className="d-flex align-items-center justify-content-between fs-12 mb-1">
                                  <span className="text-muted">Employee Quota:</span>
                                  <span className="fw-medium text-dark">
                                    {subscriptionData.currentEmployeeCount} / {subscriptionData.maxEmployees} Used
                                  </span>
                                </div>
                                <div className="progress" style={{ height: "6px" }}>
                                  <div
                                    className="progress-bar bg-primary"
                                    role="progressbar"
                                    style={{
                                      width: `${Math.min(100, Math.round((subscriptionData.currentEmployeeCount / subscriptionData.maxEmployees) * 100))}%`
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Enabled Features */}
                              <div className="border-top pt-2 mb-3">
                                <h6 className="fs-12 text-muted mb-2">Included Features:</h6>
                                <ul className="list-unstyled mb-0 fs-12">
                                  {subscriptionData.plan?.features?.map((feat: string, idx: number) => (
                                    <li key={idx} className="mb-1 d-flex align-items-center">
                                      <i className="ti ti-circle-check text-success me-2 fs-14" />
                                      {feat}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <button
                                type="button"
                                className="btn btn-primary w-100 btn-sm"
                                data-bs-toggle="modal"
                                data-bs-target="#upgrade_plan_modal"
                              >
                                <i className="ti ti-arrow-up-circle me-1" />
                                Upgrade / Change Plan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Plan Modal */}
        <div className="modal fade" id="upgrade_plan_modal" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title">Upgrade Workspace Plan</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <h4 className="fw-bold mb-2">Choose the Right Plan for Your Business</h4>
                  <p className="text-muted fs-14">Scale your employee headcount, storage, and advanced HRMS capabilities instantly.</p>
                  
                  {/* Billing Cycle Toggle */}
                  <div className="btn-group mt-2" role="group">
                    <button
                      type="button"
                      className={`btn btn-sm ${billingCycleToggle === 'MONTHLY' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setBillingCycleToggle('MONTHLY')}
                    >
                      Monthly Billing
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${billingCycleToggle === 'YEARLY' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setBillingCycleToggle('YEARLY')}
                    >
                      Yearly Billing <span className="badge bg-success ms-1">Save 15%</span>
                    </button>
                  </div>
                </div>

                <div className="row">
                  {availablePlans.map((p) => {
                    const isCurrent = subscriptionData?.plan?.id === p.id && subscriptionData?.status === 'ACTIVE';
                    const price = billingCycleToggle === 'YEARLY' ? p.priceYearly : p.priceMonthly;
                    const isUpgradingThis = upgradingPlanId === p.id;

                    return (
                      <div key={p.id} className="col-md-4 col-sm-12 mb-3">
                        <div className={`card h-100 border ${isCurrent ? 'border-primary shadow' : ''}`}>
                          <div className="card-body d-flex flex-column">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <h5 className="fw-bold mb-0">{p.name}</h5>
                              {isCurrent && <span className="badge bg-success-transparent text-success">Current Plan</span>}
                            </div>
                            <p className="fs-12 text-muted mb-3">{p.description}</p>

                            <div className="mb-3">
                              <h3 className="fw-bold mb-0">
                                ${price} <span className="fs-13 text-muted fw-normal">/{billingCycleToggle === 'YEARLY' ? 'year' : 'month'}</span>
                              </h3>
                              <span className="fs-12 text-primary fw-medium">Max {p.maxEmployees} Employees</span>
                            </div>

                            <div className="border-top pt-3 mb-4 flex-grow-1">
                              <h6 className="fs-12 text-dark mb-2">Features Included:</h6>
                              <ul className="list-unstyled fs-12 mb-0">
                                {(Array.isArray(p.features) ? p.features : []).map((f: string, i: number) => (
                                  <li key={i} className="mb-2 d-flex align-items-center">
                                    <i className="ti ti-check text-success me-2" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <button
                              type="button"
                              className={`btn w-100 ${isCurrent ? 'btn-outline-secondary' : 'btn-primary'}`}
                              disabled={isCurrent || upgradingPlanId !== null}
                              onClick={() => handleUpgradePlan(p.id)}
                            >
                              {isUpgradingThis ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" />
                                  Upgrading...
                                </>
                              ) : isCurrent ? (
                                "Current Active Plan"
                              ) : (
                                `Upgrade to ${p.name}`
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
