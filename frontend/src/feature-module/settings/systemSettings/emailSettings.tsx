import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";

interface EmailStatus {
  isConfigured: boolean;
  mode: string;
  host: string;
  port: string;
  secure: boolean;
  senderEmail: string;
  managedVia: string;
}

const EmailSettings: React.FC = () => {
  const routes = all_routes;
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<EmailStatus | null>(null);

  // Test email state
  const [testEmail, setTestEmail] = useState<string>("");
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    message: string;
    previewUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    fetchEmailStatus();
  }, []);

  const fetchEmailStatus = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/system-settings/email-status");
      if (res.data?.success) {
        setStatus(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch email status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes("@")) {
      setAlert({
        type: "danger",
        message: "Please enter a valid recipient email address.",
      });
      return;
    }

    setSendingTest(true);
    setAlert(null);
    try {
      const res = await apiClient.post("/system-settings/send-test-email", {
        targetEmail: testEmail,
      });
      if (res.data?.success) {
        setAlert({
          type: "success",
          message: res.data.message || `Test email dispatched to ${testEmail}!`,
          previewUrl: res.data.previewUrl,
        });
      } else {
        setAlert({
          type: "danger",
          message: res.data?.message || "Failed to send test email.",
        });
      }
    } catch (err: any) {
      setAlert({
        type: "danger",
        message:
          err.response?.data?.message ||
          err.message ||
          "Network error while sending test email.",
      });
    } finally {
      setSendingTest(false);
    }
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
                  Email Settings
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
            <Link className="nav-link" to={routes.customCss}>
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
                    className="d-inline-flex align-items-center rounded active py-2 px-3"
                  >
                    <i className="ti ti-arrow-badge-right me-2" />
                    Email Settings
                  </Link>
                  <Link
                    to={routes.emailTemplates}
                    className="d-inline-flex align-items-center rounded py-2 px-3"
                  >
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
            {/* Header info */}
            <div className="card shadow-sm border mb-4">
              <div className="card-body p-4">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom pb-3 mb-4">
                  <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
                      <i className="ti ti-mail text-primary fs-20" />
                      Email Delivery Service
                    </h4>
                    <p className="text-muted mb-0 small">
                      System-wide email dispatch configuration powering invitations, verifications, alerts, and notifications.
                    </p>
                  </div>
                  <div>
                    {loading ? (
                      <span className="badge bg-secondary p-2">Checking Status...</span>
                    ) : status?.isConfigured ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fs-13 d-inline-flex align-items-center gap-2">
                        <span
                          className="rounded-circle bg-success d-inline-block"
                          style={{ width: "8px", height: "8px" }}
                        />
                        Production SMTP Active
                      </span>
                    ) : (
                      <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 fs-13 d-inline-flex align-items-center gap-2">
                        <span
                          className="rounded-circle bg-info d-inline-block"
                          style={{ width: "8px", height: "8px" }}
                        />
                        Sandbox Mode (Local Dev)
                      </span>
                    )}
                  </div>
                </div>

                {/* Security & Management Banner */}
                <div className="alert alert-light border border-primary-subtle bg-primary-subtle bg-opacity-10 rounded-3 p-3 mb-4">
                  <div className="d-flex align-items-start gap-3">
                    <div className="avatar avatar-md rounded bg-primary text-white flex-shrink-0 d-flex align-items-center justify-content-center">
                      <i className="ti ti-shield-lock fs-18" />
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-1 text-primary">
                        Managed via Server Environment Variables
                      </h6>
                      <p className="small text-muted mb-0">
                        For enterprise security, SMTP credentials (Host, Username, Password, Port) are securely managed through your server environment (<strong>Hostinger hPanel</strong> on Production and <code>.env</code> on Localhost). Sensitive mail passwords are never stored in the database or exposed to client browsers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration Overview Grid */}
                <h6 className="fw-bold text-dark mb-3">Active Mail Server Parameters</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 border rounded bg-light-subtle h-100">
                      <span className="text-muted small d-block mb-1">Mail Protocol</span>
                      <span className="fw-bold text-dark fs-14 d-flex align-items-center gap-1">
                        <i className="ti ti-server text-secondary" /> SMTP (Nodemailer)
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 border rounded bg-light-subtle h-100">
                      <span className="text-muted small d-block mb-1">SMTP Host</span>
                      <span className="fw-bold text-dark fs-14 text-truncate d-block" title={status?.host}>
                        {status?.host || "Loading..."}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 border rounded bg-light-subtle h-100">
                      <span className="text-muted small d-block mb-1">Port & Security</span>
                      <span className="fw-bold text-dark fs-14">
                        Port {status?.port || "587"} ({status?.secure ? "SSL" : "TLS"})
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="p-3 border rounded bg-light-subtle h-100">
                      <span className="text-muted small d-block mb-1">Sender Email</span>
                      <span className="fw-bold text-dark fs-14 text-truncate d-block" title={status?.senderEmail}>
                        {status?.senderEmail || "noreply@hgsinfotech.com"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Send Test Email Card */}
                <div className="card border bg-light p-3 p-md-4 mb-4">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <i className="ti ti-send text-primary" />
                    Verify Email Delivery (Send Test Email)
                  </h6>
                  <p className="text-muted small mb-3">
                    Dispatch an instant verification email to any inbox to confirm that your SMTP server is actively delivering messages without delivery errors or spam rejections.
                  </p>

                  {alert && (
                    <div
                      className={`alert alert-${alert.type} alert-dismissible fade show mb-3`}
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
                      {alert.previewUrl && (
                        <div className="mt-2 pt-2 border-top">
                          <a
                            href={alert.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-info"
                          >
                            <i className="ti ti-external-link me-1" />
                            View Ethereal Test Inbox Message
                          </a>
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setAlert(null)}
                      />
                    </div>
                  )}

                  <form onSubmit={handleSendTest} className="row g-2 align-items-center">
                    <div className="col-sm-8 col-md-9">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter recipient email (e.g. your_email@domain.com)..."
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        required
                        disabled={sendingTest}
                      />
                    </div>
                    <div className="col-sm-4 col-md-3">
                      <button
                        type="submit"
                        className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-1"
                        disabled={sendingTest}
                      >
                        {sendingTest ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <i className="ti ti-send" />
                            Send Test Mail
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Automated Triggers Info */}
                <h6 className="fw-bold text-dark mb-3">Active Automated System Triggers</h6>
                <div className="row g-3">
                  <div className="col-md-6 col-lg-4">
                    <div className="p-3 border rounded h-100 bg-white">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-primary-subtle text-primary p-2">
                          <i className="ti ti-user-plus" />
                        </span>
                        <span className="fw-semibold fs-13">Employee Onboarding</span>
                      </div>
                      <p className="text-muted small mb-0">
                        Sends instant account invite with secure activation token and workspace link.
                      </p>
                    </div>
                  </div>

                  <div className="col-md-6 col-lg-4">
                    <div className="p-3 border rounded h-100 bg-white">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-danger-subtle text-danger p-2">
                          <i className="ti ti-key" />
                        </span>
                        <span className="fw-semibold fs-13">Password Reset</span>
                      </div>
                      <p className="text-muted small mb-0">
                        Dispatches time-sensitive cryptographic tokens for secure password recovery.
                      </p>
                    </div>
                  </div>

                  <div className="col-md-6 col-lg-4">
                    <div className="p-3 border rounded h-100 bg-white">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-success-subtle text-success p-2">
                          <i className="ti ti-file-certificate" />
                        </span>
                        <span className="fw-semibold fs-13">Offers & Interviews</span>
                      </div>
                      <p className="text-muted small mb-0">
                        Delivers interview schedules, candidate invites, and formal offer letters.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

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

export default EmailSettings;
