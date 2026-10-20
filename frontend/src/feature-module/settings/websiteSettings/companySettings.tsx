import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import apiClient from "../../../core/utils/apiClient";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../../../core/data/redux/authSlice";
import type { AppDispatch } from "../../../core/data/redux/store";

const resolveImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendBase = apiClient.defaults.baseURL || "http://localhost:5000";
  return `${backendBase.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
};

const getFeatureList = (features: any): string[] => {
  if (!features) return [];
  if (Array.isArray(features)) return features;
  if (typeof features === 'object') {
    return Object.keys(features).filter(k => features[k] === true);
  }
  return [];
};

const getPlanDisplayPrice = (plan: any, cycle: 'MONTHLY' | 'YEARLY', targetCurrency: string) => {
  if (!plan) return { symbol: '₹', amount: '0' };
  const isUSD = (targetCurrency || 'INR').toUpperCase() === 'USD';
  const symbol = isUSD ? '$' : '₹';
  const rate = plan.exchangeRate || 84.0;

  // Base price in INR
  const baseMonthly = plan.basePriceMonthly != null 
    ? Number(plan.basePriceMonthly) 
    : (plan.currency === 'USD' ? Number(plan.priceMonthly) * rate : Number(plan.priceMonthly || 0));

  const baseYearly = plan.basePriceYearly != null 
    ? Number(plan.basePriceYearly) 
    : (plan.currency === 'USD' ? Number(plan.priceYearly) * rate : Number(plan.priceYearly || 0));

  let val = cycle === 'YEARLY' ? baseYearly : baseMonthly;

  if (isUSD) {
    if (plan.currency === 'USD' && plan.priceMonthly !== undefined && plan.basePriceMonthly !== undefined) {
      val = cycle === 'YEARLY' ? Number(plan.priceYearly) : Number(plan.priceMonthly);
    } else {
      val = Number((val / rate).toFixed(2));
    }
    const formatted = val.toLocaleString('en-US', {
      minimumFractionDigits: val % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return { symbol, amount: formatted };
  } else {
    val = Math.round(val);
    return { symbol, amount: val.toLocaleString('en-IN') };
  }
};

const CompanySettings = () => {
  const routes = all_routes;
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: any) => state.auth?.user);
  const isSuperAdmin = (user?.role || "").toUpperCase() === "SUPER_ADMIN";
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
    iconUrl: "",
    currency: "INR",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [previewIcon, setPreviewIcon] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [billingCycleToggle, setBillingCycleToggle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [upgradingPlanId, setUpgradingPlanId] = useState<number | null>(null);

  const fetchAvailablePlans = async (currencyCode?: string) => {
    try {
      const activeCurr = currencyCode || formData.currency || 'INR';
      const res = await apiClient.get('/super-admin/plans', {
        params: { currency: activeCurr }
      });
      if (Array.isArray(res.data)) {
        setAvailablePlans(res.data.filter((p: any) => p.isActive));
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      setLoading(false);
      return;
    }
    const fetchCompanySettings = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/auth/company-settings');
        let activeCompCurrency = "INR";
        if (res.data?.success && res.data.company) {
          const comp = res.data.company;
          activeCompCurrency = comp.currency || comp.settings?.currency || "INR";
          const compSymbol = comp.currencySymbol || (activeCompCurrency === "USD" ? "$" : "₹");
          setFormData({
            name: comp.name || "",
            email: comp.email || "",
            phone: comp.phone || "",
            subdomain: comp.subdomain || "",
            address: comp.address || "",
            industry: comp.industry || "",
            companySize: comp.companySize || "",
            logoUrl: comp.logoUrl || "",
            iconUrl: comp.iconUrl || "",
            currency: activeCompCurrency,
          });
          if (comp.logoUrl) {
            setPreviewLogo(comp.logoUrl);
          }
          if (comp.iconUrl) {
            setPreviewIcon(comp.iconUrl);
          }
          dispatch(updateUser({
            companyLogoUrl: comp.logoUrl || null,
            companyIconUrl: comp.iconUrl || null,
            subdomain: comp.subdomain,
            currency: activeCompCurrency,
            currencySymbol: compSymbol
          }));
        }

        // Fetch company subscription details
        const subRes = await apiClient.get('/api/subscription/company');
        if (subRes.data) {
          setSubscriptionData(subRes.data);
        }

        fetchAvailablePlans(activeCompCurrency);
      } catch (err: any) {
        console.error("Failed to load company settings:", err);
        setMessage({ type: 'danger', text: err.response?.data?.message || "Failed to load company settings." });
      } finally {
        setLoading(false);
      }
    };
    fetchCompanySettings();
  }, [dispatch]);

  const handleUpgradePlan = async (targetPlanId: number) => {
    try {
      setUpgradingPlanId(targetPlanId);
      const res = await apiClient.post('/subscriptions/company/change-plan', {
        planId: targetPlanId,
        billingCycle: billingCycleToggle
      });
      alert(res.data?.message || 'Plan updated successfully!');
      const subRes = await apiClient.get('/subscriptions/company');
      if (subRes.data) setSubscriptionData(subRes.data);
      fetchAvailablePlans(formData.currency);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'currency') {
      fetchAvailablePlans(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIconFile(file);
      setPreviewIcon(URL.createObjectURL(file));
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
      submitData.append("currency", formData.currency);
      if (logoFile) {
        submitData.append("logo", logoFile);
      }
      if (iconFile) {
        submitData.append("icon", iconFile);
      }

      const res = await apiClient.put('/auth/company-settings', submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: "Company settings updated and saved successfully!" });
        const updatedLogo = res.data.company?.logoUrl;
        const updatedIcon = res.data.company?.iconUrl;
        const updatedCurrency = res.data.company?.currency || formData.currency;
        const updatedSymbol = res.data.company?.currencySymbol || (updatedCurrency === "USD" ? "$" : "₹");
        if (updatedLogo) {
          setFormData(prev => ({ ...prev, logoUrl: updatedLogo }));
          setPreviewLogo(updatedLogo);
          setLogoFile(null);
          window.dispatchEvent(new CustomEvent('companyLogoUpdated', { detail: updatedLogo }));
        }
        if (updatedIcon) {
          setFormData(prev => ({ ...prev, iconUrl: updatedIcon }));
          setPreviewIcon(updatedIcon);
          setIconFile(null);
          window.dispatchEvent(new CustomEvent('companyIconUpdated', { detail: updatedIcon }));
        }
        dispatch(updateUser({
          companyLogoUrl: updatedLogo || formData.logoUrl,
          companyIconUrl: updatedIcon || formData.iconUrl,
          subdomain: res.data.company?.subdomain || formData.subdomain,
          currency: updatedCurrency,
          currencySymbol: updatedSymbol
        }));
        window.dispatchEvent(new CustomEvent('companyCurrencyUpdated', { detail: { currency: updatedCurrency, currencySymbol: updatedSymbol } }));

        // Refresh subscription & available plans with saved currency
        const subRes = await apiClient.get('/api/subscription/company');
        if (subRes.data) setSubscriptionData(subRes.data);
        fetchAvailablePlans(updatedCurrency);
      }
    } catch (err: any) {
      console.error("Failed to save company settings:", err);
      setMessage({ type: 'danger', text: err.response?.data?.message || "Failed to save company settings." });
    } finally {
      setSaving(false);
    }
  };

  if (isSuperAdmin) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-4">
            <div className="my-auto mb-2">
              <h2 className="mb-1 text-dark fw-bold">Company Settings</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.superAdminDashboard}>
                      <i className="ti ti-smart-home" /> Dashboard
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Settings</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Company Settings
                  </li>
                </ol>
              </nav>
            </div>
          </div>

          <div className="card shadow-sm border p-4 text-center">
            <div
              className="avatar avatar-xxl bg-primary-transparent text-primary mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: "70px", height: "70px" }}
            >
              <i className="ti ti-building fs-36" />
            </div>
            <h4 className="fw-bold mb-2">Multi-Tenant Company Configuration</h4>
            <p className="text-muted mx-auto mb-4" style={{ maxWidth: "600px" }}>
              Each registered company admin configures their own logo, profile, and website settings from their own company dashboard.
              As Super Admin, you configure the platform-wide header logo and system currency from Super Admin Settings.
            </p>
            <div className="d-flex justify-content-center gap-2 flex-wrap">
              <Link to={routes.superAdminSettings} className="btn btn-primary">
                <i className="ti ti-settings me-1" /> Open Super Admin Platform Settings
              </Link>
              <Link to={routes.superAdminCompanies} className="btn btn-outline-secondary">
                <i className="ti ti-building-community me-1" /> View Registered Companies
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Top Settings Nav Tabs */}
          <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3 mt-3">
            <li className="nav-item">
              <Link className="nav-link" to={routes.profilesettings}>
                <i className="ti ti-settings me-2" />
                General Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to={routes.companySettings}>
                <i className="ti ti-world-cog me-2" />
                Website Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.salarySettings}>
                <i className="ti ti-device-ipad-horizontal-cog me-2" />
                App Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.emailSettings}>
                <i className="ti ti-server-cog me-2" />
                System Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.paymentGateways}>
                <i className="ti ti-settings-dollar me-2" />
                Financial Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.cronjob}>
                <i className="ti ti-settings-2 me-2" />
                Other Settings
              </Link>
            </li>
          </ul>

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
                <div className="pt-3 d-flex flex-column list-group mb-4 settings-list">
                  <Link
                    to={routes.companySettings}
                    className="d-block rounded p-2 active"
                  >
                    <i className="ti ti-arrow-badge-right me-2" />
                    Company Settings
                  </Link>
                  <Link to={routes.seoSettings} className="d-block rounded p-2">
                    SEO Settings
                  </Link>
                  <Link to={routes.localizationSettings} className="d-block rounded p-2">
                    Localization
                  </Link>
                  <Link to={routes.authenticationSettings} className="d-block rounded p-2">
                    Authentication Settings
                  </Link>
                  <Link to={routes.aiSettings} className="d-block rounded p-2">
                    AI Settings
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

                        {/* Company Operating Currency Card */}
                        <div className="card">
                          <div className="card-header d-flex align-items-center justify-content-between">
                            <h5 className="mb-0">Company Operating Currency</h5>
                            <span className="badge bg-primary-transparent text-primary fw-semibold">
                              Active: {formData.currency === "USD" ? "$ USD" : "₹ INR"}
                            </span>
                          </div>
                          <div className="card-body">
                            <p className="text-muted fs-12 mb-3">
                              Configure the currency in which your company operates. All employee salary structures, payroll calculations, leave deductions, bonuses, payslips, and project budgets will be computed and displayed in this currency.
                            </p>
                            <div className="row g-3">
                              <div className="col-sm-6">
                                <label className="form-label fw-semibold">Operating Currency</label>
                                <select
                                  name="currency"
                                  className="form-select"
                                  value={formData.currency}
                                  onChange={handleChange}
                                >
                                  <option value="INR">INR (₹) - Indian Rupee</option>
                                  <option value="USD">USD ($) - US Dollar</option>
                                </select>
                              </div>
                              <div className="col-sm-6">
                                <label className="form-label fw-semibold">Currency Symbol</label>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={formData.currency === "USD" ? "$ (USD)" : "₹ (INR)"}
                                  readOnly
                                  disabled
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="settings-right-sidebar ms-md-3">
                        {/* Main Full Logo Card */}
                        <div className="card shadow-sm border mb-3">
                          <div className="card-header bg-transparent d-flex align-items-center justify-content-between py-2">
                            <h6 className="mb-0 fw-semibold text-dark">
                              <i className="ti ti-photo me-1 text-primary"></i> Company Logo
                            </h6>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-10">
                              Full Banner
                            </span>
                          </div>
                          <div className="card-body text-center p-3">
                            <p className="text-muted fs-11 mb-2 text-start">
                              Standard wide brand logo for expanded sidebar, header & emails.
                            </p>
                            <div className="d-flex align-items-center justify-content-center mb-3">
                              <div
                                className="border rounded-3 p-2 bg-white shadow-sm d-flex align-items-center justify-content-center position-relative"
                                style={{ width: "100%", height: "90px", overflow: "hidden", background: "#fbfcfe" }}
                              >
                                {previewLogo ? (
                                  <img
                                    src={resolveImageUrl(previewLogo) || ""}
                                    alt="Company Logo"
                                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                                  />
                                ) : (
                                  <div className="text-center p-2">
                                    <i className="ti ti-building-store fs-28 text-primary mb-1 d-block" />
                                    <span className="fs-11 text-muted fw-medium d-block">{formData.name || "Main Logo"}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="profile-uploader profile-uploader-two mb-0">
                              <span className="d-block text-center lh-1 fs-20 mb-1">
                                <i className="ti ti-upload text-primary" />
                              </span>
                              <div className="drag-upload-btn bg-transparent me-0 border-0 py-1">
                                <p className="fs-12 mb-0">
                                  <span className="text-primary fw-semibold">Upload Full Logo</span> (PNG, JPG, SVG)
                                </p>
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

                        {/* Mini / Square Icon Logo Card */}
                        <div className="card shadow-sm border mb-3">
                          <div className="card-header bg-transparent d-flex align-items-center justify-content-between py-2">
                            <h6 className="mb-0 fw-semibold text-dark">
                              <i className="ti ti-layout-sidebar-left-collapse me-1 text-info"></i> Mini / Icon Logo
                            </h6>
                            <span className="badge bg-info-subtle text-info border border-info-subtle fs-10">
                              1:1 Icon
                            </span>
                          </div>
                          <div className="card-body text-center p-3">
                            <p className="text-muted fs-11 mb-2 text-start">
                              Compact square mark for 72px collapsed mini sidebar & favicon.
                            </p>
                            <div className="d-flex align-items-center justify-content-center mb-3">
                              <div
                                className="border rounded-3 p-2 bg-white shadow-sm d-flex align-items-center justify-content-center position-relative"
                                style={{ width: "76px", height: "76px", overflow: "hidden", background: "#fbfcfe" }}
                              >
                                {previewIcon ? (
                                  <img
                                    src={resolveImageUrl(previewIcon) || ""}
                                    alt="Mini Logo"
                                    style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", borderRadius: "6px" }}
                                  />
                                ) : (
                                  <div className="text-center p-1">
                                    <i className="ti ti-brand-appstore fs-24 text-info mb-1 d-block" />
                                    <span className="fs-10 text-muted fw-medium d-block">Mini Mark</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="profile-uploader profile-uploader-two mb-0">
                              <span className="d-block text-center lh-1 fs-20 mb-1">
                                <i className="ti ti-upload text-info" />
                              </span>
                              <div className="drag-upload-btn bg-transparent me-0 border-0 py-1">
                                <p className="fs-12 mb-0">
                                  <span className="text-info fw-semibold">Upload Mini Icon</span> (Square 1:1)
                                </p>
                              </div>
                              <input
                                type="file"
                                className="form-control image-sign"
                                accept="image/*"
                                onChange={handleIconFileChange}
                              />
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
                                {(() => {
                                  const activePlanPrice = getPlanDisplayPrice(subscriptionData.plan, 'MONTHLY', formData.currency);
                                  return (
                                    <span className="text-primary fw-medium">
                                      {activePlanPrice.symbol}{activePlanPrice.amount}/mo
                                    </span>
                                  );
                                })()}
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
                                  {getFeatureList(subscriptionData.plan?.features).map((feat: string, idx: number) => (
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
                    const planPrice = getPlanDisplayPrice(p, billingCycleToggle, formData.currency);
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
                                {planPrice.symbol}{planPrice.amount} <span className="fs-13 text-muted fw-normal">/{billingCycleToggle === 'YEARLY' ? 'year' : 'month'}</span>
                              </h3>
                              <span className="fs-12 text-primary fw-medium">Max {p.maxEmployees} Employees</span>
                            </div>

                            <div className="border-top pt-3 mb-4 flex-grow-1">
                              <h6 className="fs-12 text-dark mb-2">Features Included:</h6>
                              <ul className="list-unstyled fs-12 mb-0">
                                {(getFeatureList(p.features)).map((f: string, i: number) => (
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
