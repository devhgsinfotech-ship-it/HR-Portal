import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";
import { applyDynamicSeo, resolveImageUrl, SeoData } from "../../../core/utils/dynamicSeo";

const Seosettings: React.FC = () => {
  const routes = all_routes;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  // Form Fields
  const [metaTitle, setMetaTitle] = useState<string>("");
  const [metaKeywords, setMetaKeywords] = useState<string>("");
  const [metaDescription, setMetaDescription] = useState<string>("");
  const [canonicalUrl, setCanonicalUrl] = useState<string>("");
  const [ogTitle, setOgTitle] = useState<string>("");
  const [ogDescription, setOgDescription] = useState<string>("");
  
  // Image State
  const [existingOgImage, setExistingOgImage] = useState<string | null>(null);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [previewOgImage, setPreviewOgImage] = useState<string | null>(null);
  const [removeOgImage, setRemoveOgImage] = useState<boolean>(false);

  // Original saved values for Cancel / Reset
  const [savedData, setSavedData] = useState<SeoData | null>(null);

  // Active preview tab: 'search' | 'social'
  const [previewTab, setPreviewTab] = useState<"search" | "social">("search");

  // Fetch current SEO settings
  const fetchSeoSettings = async () => {
    try {
      setLoading(true);
      setAlert(null);
      const res = await apiClient.get("/seo-settings");
      if (res?.data?.success && res.data.seo) {
        const seo: SeoData = res.data.seo;
        setSavedData(seo);
        setMetaTitle(seo.metaTitle || "");
        setMetaKeywords(seo.metaKeywords || "");
        setMetaDescription(seo.metaDescription || "");
        setCanonicalUrl(seo.canonicalUrl || "");
        setOgTitle(seo.ogTitle || "");
        setOgDescription(seo.ogDescription || "");
        setExistingOgImage(seo.ogImage || null);
        setPreviewOgImage(seo.ogImage ? resolveImageUrl(seo.ogImage) : null);
        setOgImageFile(null);
        setRemoveOgImage(false);

        // Apply dynamically to browser document
        applyDynamicSeo(seo);
      }
    } catch (err: any) {
      console.error("Failed to load SEO settings:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to load SEO settings from server.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoSettings();
  }, []);

  // Handle OG Image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOgImageFile(file);
      setPreviewOgImage(URL.createObjectURL(file));
      setRemoveOgImage(false);
      setAlert(null);
    }
  };

  // Clear / Remove image
  const handleRemoveImage = () => {
    setOgImageFile(null);
    setPreviewOgImage(null);
    setExistingOgImage(null);
    setRemoveOgImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Revert back to saved values
  const handleCancel = () => {
    if (savedData) {
      setMetaTitle(savedData.metaTitle || "");
      setMetaKeywords(savedData.metaKeywords || "");
      setMetaDescription(savedData.metaDescription || "");
      setCanonicalUrl(savedData.canonicalUrl || "");
      setOgTitle(savedData.ogTitle || "");
      setOgDescription(savedData.ogDescription || "");
      setExistingOgImage(savedData.ogImage || null);
      setPreviewOgImage(savedData.ogImage ? resolveImageUrl(savedData.ogImage) : null);
      setOgImageFile(null);
      setRemoveOgImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAlert(null);
    }
  };

  // Save SEO settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setAlert(null);

      const formData = new FormData();
      formData.append("metaTitle", metaTitle);
      formData.append("metaKeywords", metaKeywords);
      formData.append("metaDescription", metaDescription);
      formData.append("canonicalUrl", canonicalUrl);
      formData.append("ogTitle", ogTitle);
      formData.append("ogDescription", ogDescription);

      if (ogImageFile) {
        formData.append("ogImage", ogImageFile);
      } else if (removeOgImage) {
        formData.append("removeOgImage", "true");
      }

      const res = await apiClient.put("/seo-settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.success) {
        const updated: SeoData = res.data.seo;
        setSavedData(updated);
        setExistingOgImage(updated.ogImage || null);
        setPreviewOgImage(updated.ogImage ? resolveImageUrl(updated.ogImage) : null);
        setOgImageFile(null);
        setRemoveOgImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Dynamically update document head immediately
        applyDynamicSeo(updated);

        setAlert({
          type: "success",
          message: "Dynamic SEO settings saved and applied to your portal successfully!",
        });
      }
    } catch (err: any) {
      console.error("Failed to save SEO settings:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to save SEO settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper for current preview values
  const currentTitle = metaTitle.trim() || "HR Portal - Modern Cloud HRMS";
  const currentDesc = metaDescription.trim() || "Complete cloud HRMS and payroll solution for modern enterprises.";
  const currentDomain = canonicalUrl.trim() || (typeof window !== "undefined" ? window.location.origin : "https://aaups.com");
  const displayOgTitle = ogTitle.trim() || currentTitle;
  const displayOgDesc = ogDescription.trim() || currentDesc;

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1 text-dark fw-bold">Settings</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" /> Dashboard
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Website Settings</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    SEO Settings
                  </li>
                </ol>
              </nav>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>

          {/* Navigation Tabs */}
          <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3">
            <li className="nav-item">
              <Link className="nav-link" to={routes.profilesettings}>
                <i className="ti ti-settings me-2" />
                General Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to={routes.businessSettings}>
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

          <div className="row">
            {/* Settings Sub-Sidebar */}
            <div className="col-xl-3 theiaStickySidebar">
              <div className="card shadow-sm border">
                <div className="card-body">
                  <div className="d-flex flex-column list-group settings-list">
                    <Link
                      to={routes.companySettings}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      Company Settings
                    </Link>
                    <Link
                      to={routes.seoSettings}
                      className="d-inline-flex align-items-center rounded active py-2 px-3 fw-semibold text-primary"
                    >
                      <i className="ti ti-arrow-badge-right me-2" />
                      SEO Settings
                    </Link>
                    <Link
                      to={routes.localizationSettings}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      Localization
                    </Link>
                    <Link
                      to={routes.authenticationSettings}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      Authentication Settings
                    </Link>
                    <Link
                      to={routes.aiSettings}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      AI Settings
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-xl-9">
              {/* Alert Notification */}
              {alert && (
                <div
                  className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center mb-3`}
                  role="alert"
                >
                  <i
                    className={`ti ${
                      alert.type === "success" ? "ti-circle-check text-success" : "ti-alert-triangle text-danger"
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

              <div className="card shadow-sm border mb-4">
                <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="card-title mb-1 fw-bold">Dynamic SEO &amp; Meta Settings</h4>
                    <p className="card-subtitle text-muted fs-12 mb-0">
                      Configure search engine optimization, meta tags, and social media preview cards for your portal.
                    </p>
                  </div>
                  <span className="badge bg-primary-transparent text-primary fw-medium px-2 py-1">
                    <i className="ti ti-world me-1" /> Live Head Sync
                  </span>
                </div>

                <div className="card-body">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading SEO settings...</span>
                      </div>
                      <p className="text-muted mt-2 mb-0">Loading dynamic SEO settings...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="border-bottom mb-4 pb-2">
                        {/* Meta Title */}
                        <div className="row align-items-center mb-3">
                          <div className="col-xxl-2 col-md-3">
                            <label className="form-label fw-semibold mb-md-0 text-dark">
                              Meta Title <span className="text-danger">*</span>
                            </label>
                          </div>
                          <div className="col-xxl-10 col-md-9">
                            <input
                              type="text"
                              className="form-control"
                              value={metaTitle}
                              onChange={(e) => setMetaTitle(e.target.value)}
                              placeholder="e.g. HGS Infotech - Cloud HRMS & Payroll Management"
                              maxLength={100}
                              required
                            />
                            <div className="d-flex justify-content-between mt-1 fs-12 text-muted">
                              <span>Recommended: 50–60 characters. Appears as the main title in Google search results.</span>
                              <span className={metaTitle.length > 60 ? "text-warning fw-semibold" : "text-muted"}>
                                {metaTitle.length} / 60
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Meta Keywords */}
                        <div className="row align-items-center mb-3">
                          <div className="col-xxl-2 col-md-3">
                            <label className="form-label fw-semibold mb-md-0 text-dark">
                              Meta Keywords
                            </label>
                          </div>
                          <div className="col-xxl-10 col-md-9">
                            <input
                              type="text"
                              className="form-control"
                              value={metaKeywords}
                              onChange={(e) => setMetaKeywords(e.target.value)}
                              placeholder="e.g. HRMS, HR Portal, Payroll, Attendance, Employees, Leaves"
                            />
                            <div className="fs-12 text-muted mt-1">
                              Comma-separated search keywords for search indexing.
                            </div>
                          </div>
                        </div>

                        {/* Meta Description */}
                        <div className="row align-items-start mb-3">
                          <div className="col-xxl-2 col-md-3">
                            <label className="form-label fw-semibold mb-md-0 text-dark pt-1">
                              Meta Description
                            </label>
                          </div>
                          <div className="col-xxl-10 col-md-9">
                            <textarea
                              className="form-control"
                              rows={3}
                              value={metaDescription}
                              onChange={(e) => setMetaDescription(e.target.value)}
                              placeholder="Provide a compelling summary of your portal (150–160 characters recommended)."
                              maxLength={300}
                            />
                            <div className="d-flex justify-content-between mt-1 fs-12 text-muted">
                              <span>Brief description shown beneath your title on Google &amp; search engines.</span>
                              <span className={metaDescription.length > 160 ? "text-warning fw-semibold" : "text-muted"}>
                                {metaDescription.length} / 160
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Canonical URL */}
                        <div className="row align-items-center mb-3">
                          <div className="col-xxl-2 col-md-3">
                            <label className="form-label fw-semibold mb-md-0 text-dark">
                              Canonical URL
                            </label>
                          </div>
                          <div className="col-xxl-10 col-md-9">
                            <input
                              type="url"
                              className="form-control"
                              value={canonicalUrl}
                              onChange={(e) => setCanonicalUrl(e.target.value)}
                              placeholder="e.g. https://aaups.com"
                            />
                            <div className="fs-12 text-muted mt-1">
                              The preferred URL that search engines should treat as authoritative for this portal.
                            </div>
                          </div>
                        </div>

                        {/* Section Divider: Social & OpenGraph */}
                        <div className="py-2 mb-3 mt-4 border-top">
                          <h6 className="fw-bold text-dark mb-1">
                            <i className="ti ti-share me-1 text-primary" /> Open Graph &amp; Social Share Metadata
                          </h6>
                          <p className="fs-12 text-muted mb-0">
                            Controls how your link appears when shared on WhatsApp, Facebook, LinkedIn, Twitter/X, and Slack.
                          </p>
                        </div>

                        {/* OG Title */}
                        <div className="row align-items-center mb-3">
                          <div className="col-xxl-2 col-md-3">
                            <label className="form-label fw-semibold mb-md-0 text-dark">
                              OG Title
                            </label>
                          </div>
                          <div className="col-xxl-10 col-md-9">
                            <input
                              type="text"
                              className="form-control"
                              value={ogTitle}
                              onChange={(e) => setOgTitle(e.target.value)}
                              placeholder="Defaults to Meta Title if left empty"
                              maxLength={100}
                            />
                          </div>
                        </div>

                        {/* OG Description */}
                        <div className="row align-items-start mb-3">
                          <div className="col-xxl-2 col-md-3">
                            <label className="form-label fw-semibold mb-md-0 text-dark pt-1">
                              OG Description
                            </label>
                          </div>
                          <div className="col-xxl-10 col-md-9">
                            <textarea
                              className="form-control"
                              rows={3}
                              value={ogDescription}
                              onChange={(e) => setOgDescription(e.target.value)}
                              placeholder="Defaults to Meta Description if left empty"
                              maxLength={300}
                            />
                          </div>
                        </div>

                        {/* OG Image Upload */}
                        <div className="row align-items-start mb-3">
                          <div className="col-xxl-2 col-md-3">
                            <label className="form-label fw-semibold mb-md-0 text-dark pt-2">
                              OG Image
                            </label>
                          </div>
                          <div className="col-xxl-10 col-md-9">
                            <div className="d-flex align-items-center flex-wrap gap-3 bg-light w-100 rounded-3 p-3 border">
                              {/* Thumbnail preview */}
                              <div
                                className="d-flex align-items-center justify-content-center bg-white rounded border overflow-hidden flex-shrink-0"
                                style={{
                                  width: "110px",
                                  height: "70px",
                                  borderStyle: previewOgImage ? "solid" : "dashed",
                                }}
                              >
                                {previewOgImage ? (
                                  <img
                                    src={previewOgImage}
                                    alt="OG Preview"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <div className="text-center text-muted">
                                    <i className="ti ti-photo fs-24 text-gray-4" />
                                    <div className="fs-10 text-muted">No Image</div>
                                  </div>
                                )}
                              </div>

                              {/* Upload Controls */}
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-bold text-dark">Social Share Thumbnail (OG Image)</h6>
                                <p className="fs-12 text-muted mb-2">
                                  Recommended size: <strong>1200 x 630 px</strong> (JPG, PNG, or WEBP, max 5MB).
                                </p>
                                <div className="d-flex align-items-center gap-2">
                                  <label className="btn btn-sm btn-primary mb-0 cursor-pointer">
                                    <i className="ti ti-upload me-1" /> Upload Image
                                    <input
                                      type="file"
                                      ref={fileInputRef}
                                      onChange={handleImageChange}
                                      accept="image/png, image/jpeg, image/jpg, image/webp"
                                      style={{ display: "none" }}
                                    />
                                  </label>
                                  {(previewOgImage || existingOgImage || ogImageFile) && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={handleRemoveImage}
                                    >
                                      <i className="ti ti-trash me-1" /> Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Live Preview Box */}
                      <div className="card bg-light border mb-4">
                        <div className="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between">
                          <span className="fw-bold fs-13 text-dark">
                            <i className="ti ti-eye me-1 text-primary" /> Live Dynamic Preview
                          </span>
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              type="button"
                              className={`btn ${previewTab === "search" ? "btn-primary" : "btn-outline-secondary"}`}
                              onClick={() => setPreviewTab("search")}
                            >
                              <i className="ti ti-brand-google me-1" /> Google Search
                            </button>
                            <button
                              type="button"
                              className={`btn ${previewTab === "social" ? "btn-primary" : "btn-outline-secondary"}`}
                              onClick={() => setPreviewTab("social")}
                            >
                              <i className="ti ti-share me-1" /> Social Card
                            </button>
                          </div>
                        </div>
                        <div className="card-body p-3">
                          {previewTab === "search" ? (
                            /* Google Search Result Preview */
                            <div className="bg-white p-3 rounded border" style={{ maxWidth: "600px" }}>
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="avatar avatar-xs rounded-circle bg-light border text-primary fw-bold fs-10 d-inline-flex align-items-center justify-content-center">
                                  HR
                                </span>
                                <div className="fs-12 text-muted text-truncate">{currentDomain}</div>
                              </div>
                              <div
                                className="fs-18 fw-medium mb-1"
                                style={{
                                  color: "#1a0dab",
                                  lineHeight: 1.3,
                                  cursor: "pointer",
                                }}
                              >
                                {currentTitle}
                              </div>
                              <div className="fs-13 text-muted" style={{ lineHeight: 1.4 }}>
                                {currentDesc}
                              </div>
                            </div>
                          ) : (
                            /* Social Media OpenGraph Card Preview */
                            <div
                              className="bg-white rounded border overflow-hidden shadow-xs"
                              style={{ maxWidth: "480px" }}
                            >
                              <div
                                className="bg-light d-flex align-items-center justify-content-center text-muted"
                                style={{
                                  height: "220px",
                                  backgroundImage: previewOgImage ? `url(${previewOgImage})` : undefined,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }}
                              >
                                {!previewOgImage && (
                                  <div className="text-center p-3">
                                    <i className="ti ti-photo fs-32 text-gray-3 mb-1" />
                                    <div className="fs-12 text-muted">No OG Image uploaded</div>
                                  </div>
                                )}
                              </div>
                              <div className="p-3 border-top">
                                <div className="fs-11 text-uppercase text-muted fw-semibold mb-1">
                                  {currentDomain.replace(/^https?:\/\//, "")}
                                </div>
                                <h6 className="fw-bold mb-1 text-dark fs-14">{displayOgTitle}</h6>
                                <p className="fs-12 text-muted mb-0" style={{ lineHeight: 1.4 }}>
                                  {displayOgDesc}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex align-items-center justify-content-end gap-2 pt-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-4"
                          onClick={handleCancel}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary px-4 fw-semibold"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                              Saving SEO...
                            </>
                          ) : (
                            <>
                              <i className="ti ti-device-floppy me-1" /> Save Dynamic SEO Settings
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Seosettings;
