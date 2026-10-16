import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";

interface EmailTemplate {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  subject: string;
  body: string;
  tags: string;
  defaultSubject: string;
  defaultBody: string;
  isCustomized: boolean;
  status: string;
  updatedAt: string;
}

const getSampleData = (slug?: string): Record<string, string> => {
  const origin = APP_CONFIG.getFrontendUrl();

  let actionPath = `${origin}/action-link-demo`;
  if (slug === "password-reset") {
    actionPath = `${origin}/reset-password?token=sample-reset-token-123`;
  } else if (slug === "employee-invite") {
    actionPath = `${origin}/invite/sample-invite-token-123`;
  } else if (slug === "email-verification") {
    actionPath = `${origin}/email-verification?token=sample-verify-token-123`;
  } else if (slug === "hr-onboarding") {
    actionPath = `${origin}/verify-onboarding?token=sample-onboarding-token-123`;
  } else if (slug === "correction-request") {
    actionPath = `${origin}/login`;
  } else if (slug === "offer-letter") {
    actionPath = `${origin}/offer-letter/sample-offer-token-123`;
  }

  return {
    employeeName: "Rahul Sharma",
    userName: "Vikramjeet Singh",
    hrName: "Priya Verma",
    candidateName: "Amit Patel",
    candidateEmail: "amit.patel@example.com",
    candidatePhone: "+91 98765 43210",
    companyName: "HGS Infotech",
    actionUrl: actionPath,
    verifyUrl: actionPath,
    resetUrl: actionPath,
    jobTitle: "Senior Full Stack Developer",
    roundTitle: "Technical Architecture Interview",
    interviewDate: "Friday, 18 Oct 2026 at 03:30 PM (IST)",
    locationOrLink: "https://meet.google.com/xyz-abcd-efg",
    annualCtc: "₹ 18,50,000 / year",
    joiningDate: "01 Nov 2026",
    tempPassword: "Pass@Secure2026!",
    notes: "Please re-upload a clear front photo of your PAN Card and Bank Passbook.",
    logoUrl: `${origin}/assets/img/logo.png`,
  };
};

function renderPreview(text: string, data: Record<string, string>): string {
  if (!text) return "";
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

const Emailtemplates: React.FC = () => {
  const routes = all_routes;

  const [loading, setLoading] = useState<boolean>(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    message: string;
  } | null>(null);

  // Active template being edited in modal
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState<string>("");
  const [editBody, setEditBody] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("Active");
  const [modalTab, setModalTab] = useState<"editor" | "preview">("editor");
  const [saving, setSaving] = useState<boolean>(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Standalone Quick Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/system-settings/email-templates");
      if (res.data?.success) {
        setTemplates(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch email templates:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to load email templates.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditBody(template.body);
    setEditStatus(template.status);
    setModalTab("editor");
    setCopiedTag(null);
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    if (!editSubject.trim()) {
      setAlert({ type: "danger", message: "Subject line cannot be empty." });
      return;
    }
    if (!editBody.trim()) {
      setAlert({ type: "danger", message: "Email body content cannot be empty." });
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.put(
        `/system-settings/email-templates/${editingTemplate.id}`,
        {
          subject: editSubject,
          body: editBody,
          status: editStatus,
        }
      );

      if (res.data?.success) {
        setAlert({
          type: "success",
          message: res.data.message || "Template saved successfully!",
        });
        // Update local state
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingTemplate.id ? res.data.data : t))
        );
        // Close bootstrap modal programmatically
        const modalEl = document.getElementById("edittemplate");
        if (modalEl) {
          const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
          if (bsModal) bsModal.hide();
        }
      } else {
        setAlert({
          type: "danger",
          message: res.data?.message || "Failed to save template.",
        });
      }
    } catch (err: any) {
      setAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to update template.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async (templateId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to reset this email template to the original factory default? Any custom changes will be discarded."
      )
    ) {
      return;
    }

    try {
      const res = await apiClient.post(
        `/system-settings/email-templates/${templateId}/reset`
      );
      if (res.data?.success) {
        setAlert({
          type: "success",
          message: res.data.message || "Template restored to original default!",
        });
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? res.data.data : t))
        );
        if (editingTemplate && editingTemplate.id === templateId) {
          setEditSubject(res.data.data.subject);
          setEditBody(res.data.data.body);
          setEditingTemplate(res.data.data);
        }
      }
    } catch (err: any) {
      setAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to reset template.",
      });
    }
  };

  // Filter templates
  const categories = ["All", "Onboarding", "Authentication", "Recruitment"];
  const filteredTemplates = templates.filter((t) => {
    const matchesCategory =
      selectedCategory === "All" ||
      t.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case "onboarding":
        return "bg-primary-subtle text-primary border border-primary-subtle";
      case "authentication":
        return "bg-purple-subtle text-purple border border-purple-subtle";
      case "recruitment":
        return "bg-success-subtle text-success border border-success-subtle";
      default:
        return "bg-secondary-subtle text-secondary border";
    }
  };

  const parseTags = (tagsStr: string): string[] => {
    if (!tagsStr) return [];
    return tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumb */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Settings</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">System Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Email Templates
                </li>
              </ol>
            </nav>
          </div>
          <div className="head-icons ms-2">
            <CollapseHeader />
          </div>
        </div>
        {/* /Breadcrumb */}

        {/* Global Settings Top Tabs */}
        <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3">
          <li className="nav-item">
            <Link className="nav-link" to={routes.profilesettings}>
              <i className="ti ti-settings me-2" />
              General Settings
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to={routes.businessSettings}>
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
            <Link className="nav-link active" to={routes.emailSettings}>
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
          {/* Inner Left Tabs */}
          <div className="col-xl-3 theiaStickySidebar">
            <div className="card">
              <div className="card-body">
                <div className="d-flex flex-column list-group settings-list">
                  <Link
                    to={routes.emailSettings}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
                    Email Settings
                  </Link>
                  <Link
                    to={routes.emailTemplates}
                    className="d-inline-flex align-items-center rounded active py-2 px-3"
                  >
                    <i className="ti ti-arrow-badge-right me-2" />
                    Email Templates
                  </Link>
                  <Link
                    to={routes.smsSettings}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
                    SMS Settings
                  </Link>
                  <Link
                    to={routes.smsTemplate}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
                    SMS Templates
                  </Link>
                  <Link
                    to={routes.otpSettings}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
                    OTP
                  </Link>
                  <Link
                    to={routes.gdprCookies}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
                    GDPR Cookies
                  </Link>
                  <Link
                    to={routes.maintenanceMode}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
                    Maintenance Mode
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="col-xl-9">
            <div className="card shadow-sm border mb-4">
              <div className="card-body p-4">
                {/* Header & Subtitle */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom pb-3 mb-4">
                  <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                      <i className="ti ti-template text-primary fs-20" />
                      Dynamic Email Templates
                    </h4>
                    <p className="text-muted mb-0 small">
                      Customize subjects, email bodies, and dynamic merge tags for all automated system emails.
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-light text-dark border px-3 py-2 fs-13">
                      Total: {templates.length} Active System Templates
                    </span>
                  </div>
                </div>

                {/* Feedback Alert */}
                {alert && (
                  <div
                    className={`alert alert-${alert.type} alert-dismissible fade show mb-4`}
                    role="alert"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i
                        className={`ti ${
                          alert.type === "success"
                            ? "ti-circle-check fs-18 text-success"
                            : "ti-alert-circle fs-18 text-danger"
                        }`}
                      />
                      <div>{alert.message}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setAlert(null)}
                    />
                  </div>
                )}

                {/* Filter and Search Bar */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
                  {/* Category Filter Pills */}
                  <div className="btn-group" role="group">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`btn btn-sm ${
                          selectedCategory === cat
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                        {cat !== "All" && (
                          <span className="badge bg-white text-dark ms-1">
                            {
                              templates.filter(
                                (t) =>
                                  t.category.toLowerCase() === cat.toLowerCase()
                              ).length
                            }
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="input-group" style={{ maxWidth: "280px" }}>
                    <span className="input-group-text bg-light border-end-0">
                      <i className="ti ti-search text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Loading state */}
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading templates...</span>
                    </div>
                    <p className="text-muted mt-2 small">
                      Loading dynamic email templates from database...
                    </p>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-5 border rounded bg-light">
                    <i className="ti ti-mail-off fs-40 text-muted d-block mb-2" />
                    <h6 className="fw-semibold text-dark">No Templates Found</h6>
                    <p className="text-muted small mb-0">
                      No email templates matched your filter or search query.
                    </p>
                  </div>
                ) : (
                  /* Cards Grid */
                  <div className="row g-3">
                    {filteredTemplates.map((template) => (
                      <div className="col-md-6 col-lg-6" key={template.id}>
                        <div className="card border h-100 shadow-sm transition-all hover-shadow">
                          <div className="card-body p-3 d-flex flex-column justify-content-between">
                            <div>
                              {/* Header Badges */}
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <span
                                  className={`badge px-2 py-1 fs-12 fw-medium ${getCategoryBadgeClass(
                                    template.category
                                  )}`}
                                >
                                  {template.category}
                                </span>
                                <div className="d-flex align-items-center gap-1">
                                  {template.isCustomized ? (
                                    <span
                                      className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 fs-11"
                                      title="This template has been customized by Admin"
                                    >
                                      Customized
                                    </span>
                                  ) : (
                                    <span
                                      className="badge bg-light text-muted border px-2 py-1 fs-11"
                                      title="Default factory template"
                                    >
                                      Default
                                    </span>
                                  )}
                                  <span
                                    className={`badge px-2 py-1 fs-11 ${
                                      template.status === "Active"
                                        ? "bg-success-subtle text-success"
                                        : "bg-danger-subtle text-danger"
                                    }`}
                                  >
                                    {template.status}
                                  </span>
                                </div>
                              </div>

                              {/* Title */}
                              <h5 className="fw-bold text-dark fs-15 mb-2">
                                {template.name}
                              </h5>

                              {/* Subject Line Preview */}
                              <div className="p-2 rounded bg-light border mb-3">
                                <span className="text-muted small d-block mb-1 fw-semibold">
                                  Subject Line:
                                </span>
                                <span
                                  className="text-dark small d-block text-truncate fw-medium"
                                  title={template.subject}
                                >
                                  {template.subject}
                                </span>
                              </div>

                              {/* Tags Chips */}
                              <div className="mb-3">
                                <span className="text-muted small d-block mb-1">
                                  Merge Tags:
                                </span>
                                <div className="d-flex flex-wrap gap-1">
                                  {parseTags(template.tags).map((tag, i) => (
                                    <span
                                      key={i}
                                      className="badge bg-light text-secondary border font-monospace fs-11"
                                      style={{ fontWeight: "normal" }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="pt-2 border-top d-flex align-items-center justify-content-between mt-2">
                              <span className="text-muted fs-11">
                                Updated:{" "}
                                {new Date(template.updatedAt).toLocaleDateString(
                                  "en-IN"
                                )}
                              </span>
                              <div className="d-flex align-items-center gap-1">
                                {/* Quick Preview Button */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                                  data-bs-toggle="modal"
                                  data-bs-target="#previewModal"
                                  onClick={() => setPreviewTemplate(template)}
                                  title="Quick View Rendered Email"
                                >
                                  <i className="ti ti-eye" />
                                  Preview
                                </button>

                                {/* Reset to Default Button */}
                                <button
                                  type="button"
                                  className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                                    template.isCustomized
                                      ? "btn-outline-warning text-dark fw-medium"
                                      : "btn-outline-light text-muted border"
                                  }`}
                                  onClick={() => handleResetToDefault(template.id)}
                                  title={
                                    template.isCustomized
                                      ? "Click to revert custom edits back to factory default"
                                      : "Template is currently on factory default"
                                  }
                                >
                                  <i className="ti ti-rotate" />
                                  Reset
                                </button>

                                {/* Edit Button */}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                                  data-bs-toggle="modal"
                                  data-bs-target="#edittemplate"
                                  onClick={() => openEditModal(template)}
                                >
                                  <i className="ti ti-edit" />
                                  Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Template Modal */}
      <div className="modal fade" id="edittemplate" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <div>
                <h4 className="modal-title fw-bold mb-1">
                  Edit Template: {editingTemplate?.name}
                </h4>
                <div className="d-flex align-items-center gap-2">
                  <span
                    className={`badge ${getCategoryBadgeClass(
                      editingTemplate?.category || ""
                    )}`}
                  >
                    {editingTemplate?.category}
                  </span>
                  <span className="text-muted small">
                    Slug: <code>{editingTemplate?.slug}</code>
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body p-4">
                {/* Available Merge Tags Pill Bar */}
                <div className="p-3 border rounded bg-light mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-semibold text-dark small d-flex align-items-center gap-1">
                      <i className="ti ti-tag text-primary" />
                      Click any merge tag below to copy and paste it into your Subject or Content:
                    </span>
                    {copiedTag && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                        Copied: {copiedTag}
                      </span>
                    )}
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {parseTags(editingTemplate?.tags || "").map((tag, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-sm btn-white border font-monospace text-primary fs-12 px-2 py-1"
                        onClick={() => handleCopyTag(tag)}
                        title="Click to copy tag"
                      >
                        {tag} <i className="ti ti-copy ms-1 text-muted fs-11" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Line */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    Email Subject Line <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter email subject with tags (e.g. Welcome to {{companyName}})..."
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    required
                  />
                  <div className="form-text small text-muted">
                    Subject preview with sample data:{" "}
                    <strong>{renderPreview(editSubject, getSampleData(editingTemplate?.slug))}</strong>
                  </div>
                </div>

                {/* Content Tabs (Editor vs Rendered Preview) */}
                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          modalTab === "editor"
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => setModalTab("editor")}
                      >
                        <i className="ti ti-code me-1" />
                        HTML Template Source
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          modalTab === "preview"
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => setModalTab("preview")}
                      >
                        <i className="ti ti-device-desktop me-1" />
                        Live Rendered Preview
                      </button>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <label className="form-label mb-0 small text-muted">
                        Template Status:
                      </label>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: "110px" }}
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {modalTab === "editor" ? (
                    <div>
                      <textarea
                        className="form-control font-monospace text-dark p-3"
                        style={{
                          height: "380px",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          backgroundColor: "#fcfcfc",
                        }}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        placeholder="Write responsive HTML email body with {{tags}}..."
                        required
                      />
                      <div className="form-text small text-muted mt-1">
                        HTML email templates support inline CSS styles, tables, and standard HTML elements.
                      </div>
                    </div>
                  ) : (
                    /* Live Rendered Preview */
                    <div
                      className="border rounded p-4 bg-light"
                      style={{ minHeight: "380px", overflowY: "auto" }}
                    >
                      <div
                        className="bg-white p-4 rounded shadow-sm border mx-auto"
                        style={{ maxWidth: "650px" }}
                      >
                        <div className="border-bottom pb-2 mb-3">
                          <span className="text-muted small d-block">
                            Subject:
                          </span>
                          <h6 className="fw-bold text-dark mb-0">
                            {renderPreview(editSubject, getSampleData(editingTemplate?.slug))}
                          </h6>
                        </div>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: renderPreview(editBody, getSampleData(editingTemplate?.slug)),
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-top d-flex align-items-center justify-content-between">
                <div>
                  <button
                    type="button"
                    className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                      editingTemplate?.isCustomized
                        ? "btn-outline-warning text-dark fw-medium"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() =>
                      editingTemplate &&
                      handleResetToDefault(editingTemplate.id)
                    }
                    title="Reset this email template to system factory default"
                  >
                    <i className="ti ti-rotate" />
                    Restore Factory Default
                  </button>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-light border"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary d-inline-flex align-items-center gap-1"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-1"
                          role="status"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-check" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Standalone Quick Preview Modal */}
      <div className="modal fade" id="previewModal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <div>
                <h5 className="modal-title fw-bold mb-1">
                  Preview: {previewTemplate?.name}
                </h5>
                <span className="text-muted small">
                  Simulated preview rendered with sample runtime variables
                </span>
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body p-4 bg-light">
              <div
                className="bg-white p-4 rounded shadow-sm border mx-auto"
                style={{ maxWidth: "650px" }}
              >
                <div className="border-bottom pb-2 mb-3">
                  <span className="text-muted small d-block">Simulated Subject:</span>
                  <h6 className="fw-bold text-dark mb-0">
                    {previewTemplate &&
                      renderPreview(previewTemplate.subject, getSampleData(previewTemplate.slug))}
                  </h6>
                </div>
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      (previewTemplate &&
                        renderPreview(previewTemplate.body, getSampleData(previewTemplate.slug))) ||
                      "",
                  }}
                />
              </div>
            </div>
            <div className="modal-footer border-top">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2014 - 2026 © SmartHR.</p>
        <p className="mb-0">
          Designed &amp; Developed By{" "}
          <Link to="#" className="text-primary">
            HGS Infotech
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Emailtemplates;
