import React, { useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";

const ClearCache: React.FC = () => {
  const routes = all_routes;

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const userRole = (currentUser?.role || localStorage.getItem("userRole") || "").toUpperCase();
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const [loading, setLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);
  const [lastCleared, setLastCleared] = useState<string | null>(
    localStorage.getItem("lastCacheClearedTime") || null
  );

  const handleClearCache = async () => {
    try {
      setLoading(true);
      setAlert(null);

      const res = await apiClient.post("/other-settings/cache/clear", {
        clearType: isSuperAdmin ? "ALL" : "COMPANY"
      });

      if (res?.data?.success) {
        // Clear non-auth client session caches
        sessionStorage.clear();
        const now = new Date().toLocaleString();
        localStorage.setItem("lastCacheClearedTime", now);
        setLastCleared(now);

        setAlert({
          type: "success",
          message:
            res.data.message ||
            "System cache flushed successfully. Application performance and configs refreshed."
        });
      }
    } catch (err: any) {
      console.error("Clear cache error:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to clear cache. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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
                  <li className="breadcrumb-item">Other Settings</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Clear Cache
                  </li>
                </ol>
              </nav>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Settings Tabs */}
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
              <Link className="nav-link" to={routes.emailSettings}>
                <i className="ti ti-server-cog me-2" />
                System Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to={routes.clearcache}>
                <i className="ti ti-settings-2 me-2" />
                Other Settings
              </Link>
            </li>
          </ul>

          <div className="row">
            <div className="col-xl-3 theiaStickySidebar">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex flex-column list-group settings-list">
                    <Link
                      to={routes.banIpAddress}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      Ban IP Address
                    </Link>
                    <Link
                      to={routes.storage}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      Storage
                    </Link>
                    <Link
                      to={routes.backup}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      Backup
                    </Link>
                    <Link
                      to={routes.clearcache}
                      className="d-inline-flex align-items-center rounded active py-2 px-3"
                    >
                      <i className="ti ti-arrow-badge-right me-2" />
                      Clear Cache
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-9">
              {/* Alert Notification */}
              {alert && (
                <div
                  className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center mb-3`}
                  role="alert"
                >
                  <i
                    className={`ti ${
                      alert.type === "success" ? "ti-circle-check" : "ti-alert-circle"
                    } fs-20 me-2`}
                  />
                  <div>{alert.message}</div>
                  <button
                    type="button"
                    className="btn-close ms-auto"
                    onClick={() => setAlert(null)}
                    aria-label="Close"
                  />
                </div>
              )}

              <div className="card">
                <div className="card-header px-3">
                  <h4 className="mb-1">Clear Application &amp; System Cache</h4>
                  <p className="text-muted fs-13 mb-0">
                    Purge temporary data, compiled configurations, and transient buffers to optimize system responsiveness.
                  </p>
                </div>
                <div className="card-body">
                  <div className="alert alert-warning d-flex align-items-center p-3 mb-4">
                    <i className="ti ti-alert-triangle fs-24 me-3 text-warning" />
                    <div>
                      <h6 className="alert-heading mb-1 text-dark">Important Information</h6>
                      <p className="mb-0 fs-13 text-muted">
                        Clearing the cache removes temporary query caches, session buffers, and
                        cached settings. Active user logins and permanent records will{" "}
                        <strong>NOT</strong> be deleted.
                      </p>
                    </div>
                  </div>

                  <div className="row mb-4 g-3">
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light-subtle h-100">
                        <div className="d-flex align-items-center mb-2">
                          <i className="ti ti-server-2 text-primary fs-20 me-2" />
                          <h6 className="mb-0">
                            {isSuperAdmin ? "Global Cache Scope" : "Company Cache Scope"}
                          </h6>
                        </div>
                        <p className="fs-13 text-muted mb-0">
                          {isSuperAdmin
                            ? "All tenants, platform microservices, and global system configurations."
                            : "Your company's cached settings, localization states, and query snapshots."}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="border rounded p-3 bg-light-subtle h-100">
                        <div className="d-flex align-items-center mb-2">
                          <i className="ti ti-clock-check text-success fs-20 me-2" />
                          <h6 className="mb-0">Last Cache Flush</h6>
                        </div>
                        <p className="fs-13 text-muted mb-0 font-monospace">
                          {lastCleared ? lastCleared : "Never cleared in this session"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-end gap-2 border-top pt-3">
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center"
                      onClick={handleClearCache}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Clearing Cache...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-trash me-2" />
                          Flush Cache Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR.</p>
        </div>
      </div>
    </div>
  );
};

export default ClearCache;
