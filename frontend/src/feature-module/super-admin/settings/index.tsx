import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import apiClient from "../../../core/utils/apiClient";
import { useAppDispatch, useAppSelector } from "../../../core/data/redux/store";
import { updateUser } from "../../../core/data/redux/authSlice";

const POPULAR_CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (Default)" },
  { code: "USD", symbol: "$", name: "US Dollar (Converted)" },
];

const SuperAdminSettings: React.FC = () => {
  const routes = all_routes;
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState<boolean>(true);
  const [savingLogo, setSavingLogo] = useState<boolean>(false);
  const [savingCurrency, setSavingCurrency] = useState<boolean>(false);
  const [savingGeneral, setSavingGeneral] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  // Form State
  const [systemName, setSystemName] = useState<string>("HR Portal");
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [currency, setCurrency] = useState<string>("INR");
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");
  const [allCurrencies, setAllCurrencies] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getFullLogoUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
      return url;
    }
    const base = (apiClient.defaults.baseURL || "http://localhost:5000").replace(/\/+$/, "");
    const clean = url.startsWith("/") ? url : `/${url}`;
    return `${base}${clean}`;
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, currRes] = await Promise.all([
        apiClient.get("/system-settings").catch(() => null),
        apiClient.get("/system-settings/currencies").catch(() => null),
      ]);

      if (settingsRes?.data?.success && settingsRes.data.settings) {
        const s = settingsRes.data.settings;
        setSystemName(s.systemName || "HR Portal");
        setCurrentLogoUrl(s.logoUrl || null);
        setLogoPreview(s.logoUrl ? getFullLogoUrl(s.logoUrl) : null);
        if (s.currency) setCurrency(s.currency);
        if (s.currencySymbol) setCurrencySymbol(s.currencySymbol);
      }

      if (currRes?.data?.success && Array.isArray(currRes.data.currencies)) {
        setAllCurrencies(currRes.data.currencies);
        const def = currRes.data.currencies.find((c: any) => c.isDefault);
        if (def) {
          setCurrency(def.code);
          setCurrencySymbol(def.symbol);
        }
      }
    } catch (err: any) {
      console.error("Failed to load system settings:", err);
      setAlert({ type: "danger", message: "Failed to load system settings from server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setAlert(null);
    }
  };

  const handleSaveLogo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!logoFile && !currentLogoUrl) {
      setAlert({ type: "danger", message: "Please select an image file to upload." });
      return;
    }

    try {
      setSavingLogo(true);
      setAlert(null);
      const formData = new FormData();
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await apiClient.put("/system-settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        const newLogo = res.data.settings?.logoUrl;
        setCurrentLogoUrl(newLogo);
        setLogoFile(null);
        if (newLogo) {
          setLogoPreview(getFullLogoUrl(newLogo));
          dispatch(updateUser({ companyLogoUrl: newLogo }));
          window.dispatchEvent(new CustomEvent("companyLogoUpdated", { detail: newLogo }));
          window.dispatchEvent(new CustomEvent("systemLogoUpdated", { detail: newLogo }));
        }
        setAlert({
          type: "success",
          message: "Super Admin header logo updated successfully! Header and sidebar updated.",
        });
      }
    } catch (err: any) {
      console.error("Failed to save logo:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to update Super Admin logo.",
      });
    } finally {
      setSavingLogo(false);
    }
  };

  const handleSaveCurrency = async (selectedCode?: string, selectedSymbol?: string) => {
    const targetCode = (selectedCode || currency).toUpperCase();
    const targetSymbol = selectedSymbol || currencySymbol;

    try {
      setSavingCurrency(true);
      setAlert(null);

      const res = await apiClient.post("/system-settings/set-default-currency", {
        code: targetCode,
      });

      if (res.data?.success) {
        setCurrency(targetCode);
        setCurrencySymbol(res.data.currency?.symbol || targetSymbol);
        setAlert({
          type: "success",
          message: `Default currency changed to ${targetCode} (${res.data.currency?.symbol || targetSymbol}) successfully!`,
        });
        fetchSettings();
      }
    } catch (err: any) {
      console.error("Failed to update currency:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to update system currency.",
      });
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingGeneral(true);
      setAlert(null);

      const res = await apiClient.put("/system-settings", {
        systemName,
        currency,
        currencySymbol,
      });

      if (res.data?.success) {
        setAlert({
          type: "success",
          message: "Platform settings saved successfully!",
        });
      }
    } catch (err: any) {
      console.error("Failed to save platform settings:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to save settings.",
      });
    } finally {
      setSavingGeneral(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumb Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-4">
          <div className="my-auto mb-2">
            <h2 className="mb-1 text-dark fw-bold">Super Admin Platform Settings</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.superAdminDashboard}>
                    <i className="ti ti-smart-home" /> Dashboard
                  </Link>
                </li>
                <li className="breadcrumb-item">Super Admin</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Platform Settings
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Tenant Isolation Banner */}
        <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
          <i className="ti ti-info-circle fs-20 me-2" />
          <div>
            <strong>Multi-Tenant Isolation:</strong> These settings configure the <strong>Super Admin &amp; Platform</strong> branding (header logo, system currency). Individual companies manage their own logos and company settings independently in their company admin portals.
          </div>
        </div>

        {/* Status Alerts */}
        {alert && (
          <div
            className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center`}
            role="alert"
          >
            <i
              className={`ti ${
                alert.type === "success" ? "ti-circle-check" : "ti-alert-triangle"
              } fs-18 me-2`}
            />
            <div className="flex-grow-1">{alert.message}</div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setAlert(null)}
              aria-label="Close"
            />
          </div>
        )}

        {loading ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading settings...</span>
              </div>
              <p className="text-muted mt-2 mb-0">Loading Super Admin settings...</p>
            </div>
          </div>
        ) : (
          <div className="row">
            {/* Super Admin Header Logo Card */}
            <div className="col-lg-6 mb-4">
              <div className="card h-100 shadow-sm border">
                <div className="card-header bg-white border-bottom py-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h5 className="card-title mb-1 fw-bold">Super Admin Header &amp; Sidebar Logo</h5>
                      <p className="card-subtitle text-muted fs-12 mb-0">
                        Upload the logo displayed in the top header and sidebar for Super Admin.
                      </p>
                    </div>
                    <span className="badge bg-primary-transparent text-primary">Header Branding</span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2">Live Logo Preview</label>
                    <div className="d-flex align-items-center gap-3 p-3 bg-light rounded border">
                      <div
                        className="d-flex align-items-center justify-content-center bg-white rounded border p-2 shadow-xs"
                        style={{ minWidth: "160px", minHeight: "60px" }}
                      >
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Super Admin Logo"
                            style={{ maxHeight: "40px", maxWidth: "150px", objectFit: "contain" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/assets/img/hgs-logo-HR.webp";
                            }}
                          />
                        ) : (
                          <img
                            src="/assets/img/hgs-logo-HR.webp"
                            alt="Default Logo"
                            style={{ maxHeight: "40px", maxWidth: "150px", objectFit: "contain" }}
                          />
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-semibold text-dark fs-13">
                          {logoFile ? logoFile.name : currentLogoUrl ? "Custom System Logo Active" : "Default System Logo"}
                        </div>
                        <div className="text-muted fs-12">
                          PNG, WEBP, SVG, or JPG (Recommended: 140px × 40px)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2">Select Logo Image</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={handleLogoFileChange}
                    />
                    <small className="text-muted d-block mt-1">
                      Uploading replaces the logo in the top navbar and sidebar instantly.
                    </small>
                  </div>

                  <div className="d-flex align-items-center gap-2 pt-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleSaveLogo()}
                      disabled={savingLogo || !logoFile}
                    >
                      {savingLogo ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          Saving Logo...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-upload me-1" /> Upload &amp; Update Header Logo
                        </>
                      )}
                    </button>
                    {logoFile && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(currentLogoUrl ? getFullLogoUrl(currentLogoUrl) : null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Currency Settings Card */}
            <div className="col-lg-6 mb-4">
              <div className="card h-100 shadow-sm border">
                <div className="card-header bg-white border-bottom py-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h5 className="card-title mb-1 fw-bold">Platform Currency Settings</h5>
                      <p className="card-subtitle text-muted fs-12 mb-0">
                        Configure the default billing &amp; display currency for packages and membership plans.
                      </p>
                    </div>
                    <span className="badge bg-success-transparent text-success fw-semibold">
                      Active: {currencySymbol} {currency}
                    </span>
                  </div>
                </div>
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    {/* Current Active Currency Summary */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-muted fs-12 text-uppercase mb-2">
                        Current Active Currency
                      </label>
                      <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border">
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className="avatar avatar-lg rounded-circle text-white fw-bold fs-20 d-flex align-items-center justify-content-center shadow-xs"
                            style={{
                              backgroundColor: currency === "USD" ? "#198754" : "#e65f2b",
                              width: "48px",
                              height: "48px",
                            }}
                          >
                            {currencySymbol}
                          </span>
                          <div>
                            <div className="fw-bold text-dark fs-16">
                              {currency === "USD" ? "USD - US Dollar" : "INR - Indian Rupee"}
                            </div>
                            <div className="fs-12 text-muted">
                              Symbol: {currencySymbol} • {currency === "USD" ? "Live Exchange Converted" : "System Default Base"}
                            </div>
                          </div>
                        </div>
                        <span className="badge bg-success text-white py-1 px-2 fw-medium fs-12">
                          <i className="ti ti-check me-1" /> Active Default
                        </span>
                      </div>
                    </div>

                    {/* Simple Dropdown & Select */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">
                        Select Platform Currency
                      </label>
                      <div className="row g-2">
                        <div className="col-sm-8">
                          <select
                            className="form-select form-select-lg"
                            value={currency}
                            onChange={(e) => {
                              const newCode = e.target.value;
                              setCurrency(newCode);
                              setCurrencySymbol(newCode === "USD" ? "$" : "₹");
                            }}
                          >
                            <option value="INR">Indian Rupee (₹ INR)</option>
                            <option value="USD">US Dollar ($ USD)</option>
                          </select>
                        </div>
                        <div className="col-sm-4">
                          <button
                            type="button"
                            className="btn btn-primary btn-lg w-100 fw-semibold"
                            onClick={() => handleSaveCurrency(currency, currencySymbol)}
                            disabled={savingCurrency}
                          >
                            {savingCurrency ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <i className="ti ti-check me-1" /> Set Active
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="form-text text-muted mt-2 fs-12">
                        Membership plans and SaaS invoices will calculate in this currency.
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-light border py-2 px-3 fs-12 mt-3 mb-0 text-muted">
                    <i className="ti ti-info-circle text-primary me-1" />
                    Only <strong>INR (₹)</strong> and <strong>USD ($)</strong> are supported across the platform. Company admins can choose their display currency in their company settings.
                  </div>
                </div>
              </div>
            </div>

            {/* General Platform Info Card (No Bottom Currency Selection) */}
            <div className="col-12">
              <div className="card shadow-sm border">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="card-title mb-0 fw-bold">Platform Information</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSaveGeneral}>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-8">
                        <label className="form-label fw-semibold">Platform Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={systemName}
                          onChange={(e) => setSystemName(e.target.value)}
                          placeholder="e.g. HR Portal / SaaS HRMS"
                        />
                        <div className="form-text text-muted">
                          The official title displayed across the platform and notification emails.
                        </div>
                      </div>
                      <div className="col-md-4 text-md-end">
                        <button
                          type="submit"
                          className="btn btn-primary px-4 py-2"
                          disabled={savingGeneral}
                        >
                          {savingGeneral ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <i className="ti ti-device-floppy me-1" /> Save Platform Details
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSettings;
