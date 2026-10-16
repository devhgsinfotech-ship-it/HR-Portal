import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";

interface BannedIpItem {
  id: number;
  companyId: number | null;
  ipAddress: string;
  reason: string | null;
  status: string;
  createdAt: string;
  company?: {
    id: number;
    name: string;
    companyCode?: string;
  } | null;
}

const BanIpAddress: React.FC = () => {
  const routes = all_routes;

  // Current User & Role
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const userRole = (currentUser?.role || localStorage.getItem("userRole") || "").toUpperCase();
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  // State
  const [bannedIps, setBannedIps] = useState<BannedIpItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  // Add Modal State
  const [newIp, setNewIp] = useState<string>("");
  const [newReason, setNewReason] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("Active");
  const [isGlobalBan, setIsGlobalBan] = useState<boolean>(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<BannedIpItem | null>(null);
  const [editIp, setEditIp] = useState<string>("");
  const [editReason, setEditReason] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("Active");

  // Delete State
  const [deletingItem, setDeletingItem] = useState<BannedIpItem | null>(null);

  // Fetch Banned IPs
  const fetchBannedIps = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/other-settings/banned-ips");
      if (res?.data?.success) {
        setBannedIps(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load banned IPs:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to load banned IP addresses."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannedIps();
  }, []);

  // Handle Add IP
  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) {
      setAlert({ type: "danger", message: "Please enter an IP address." });
      return;
    }

    try {
      setActionLoading(true);
      setAlert(null);
      const payload: any = {
        ipAddress: newIp.trim(),
        reason: newReason.trim(),
        status: newStatus,
        isGlobal: isSuperAdmin ? isGlobalBan : false
      };

      const res = await apiClient.post("/other-settings/banned-ips", payload);
      if (res?.data?.success) {
        setAlert({ type: "success", message: res.data.message || "IP address banned successfully." });
        setNewIp("");
        setNewReason("");
        setNewStatus("Active");
        setIsGlobalBan(false);
        // Close modal via data-bs-dismiss or bootstrap
        const modalEl = document.getElementById("add_ban");
        if (modalEl) {
          const closeBtn = modalEl.querySelector<HTMLButtonElement>('[data-bs-dismiss="modal"]');
          closeBtn?.click();
        }
        await fetchBannedIps();
      }
    } catch (err: any) {
      console.error("Error adding banned IP:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to ban IP address."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: BannedIpItem) => {
    setEditingItem(item);
    setEditIp(item.ipAddress);
    setEditReason(item.reason || "");
    setEditStatus(item.status);
  };

  // Handle Edit IP
  const handleUpdateIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setActionLoading(true);
      setAlert(null);
      const res = await apiClient.put(`/other-settings/banned-ips/${editingItem.id}`, {
        ipAddress: editIp.trim(),
        reason: editReason.trim(),
        status: editStatus
      });

      if (res?.data?.success) {
        setAlert({ type: "success", message: "Banned IP updated successfully." });
        const modalEl = document.getElementById("edit_ban");
        if (modalEl) {
          const closeBtn = modalEl.querySelector<HTMLButtonElement>('[data-bs-dismiss="modal"]');
          closeBtn?.click();
        }
        await fetchBannedIps();
      }
    } catch (err: any) {
      console.error("Error updating banned IP:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to update banned IP."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete IP
  const handleDeleteIp = async () => {
    if (!deletingItem) return;

    try {
      setActionLoading(true);
      setAlert(null);
      const res = await apiClient.delete(`/other-settings/banned-ips/${deletingItem.id}`);
      if (res?.data?.success) {
        setAlert({ type: "success", message: res.data.message || "IP unbanned successfully." });
        const modalEl = document.getElementById("delete_modal");
        if (modalEl) {
          const closeBtn = modalEl.querySelector<HTMLButtonElement>('[data-bs-dismiss="modal"]');
          closeBtn?.click();
        }
        setDeletingItem(null);
        await fetchBannedIps();
      }
    } catch (err: any) {
      console.error("Error deleting banned IP:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to unban IP."
      });
    } finally {
      setActionLoading(false);
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
                    Ban IP Address
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
              <Link className="nav-link active" to={routes.banIpAddress}>
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
                      className="d-inline-flex align-items-center rounded active py-2 px-3"
                    >
                      <i className="ti ti-arrow-badge-right me-2" />
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
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
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
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <h4 className="mb-1">Ban IP Address</h4>
                      <p className="text-muted fs-13 mb-0">
                        {isSuperAdmin
                          ? "Restrict access by blacklisting specific IP addresses globally or per company."
                          : "Restrict unauthorized devices or users from logging into your company portal."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm d-flex align-items-center"
                      data-bs-toggle="modal"
                      data-bs-target="#add_ban"
                    >
                      <i className="ti ti-circle-plus me-2" />
                      Add IP Address
                    </button>
                  </div>
                </div>

                <div className="card-body pb-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-muted mt-2">Loading banned IP addresses...</p>
                    </div>
                  ) : bannedIps.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="avatar avatar-xxl bg-light-danger rounded-circle text-danger mb-3 mx-auto">
                        <i className="ti ti-shield-check fs-36" />
                      </div>
                      <h5>No Banned IPs</h5>
                      <p className="text-muted fs-13 mb-3">
                        Currently no IP addresses are blacklisted. Add an IP to block unauthorized access.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#add_ban"
                      >
                        <i className="ti ti-plus me-1" /> Add IP Address
                      </button>
                    </div>
                  ) : (
                    <div className="row">
                      {bannedIps.map((item) => (
                        <div className="col-lg-6 mb-3" key={item.id}>
                          <div className="card border h-100 mb-0 shadow-none">
                            <div className="card-body">
                              <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                                <div className="d-flex align-items-center">
                                  <span className="badge badge-danger-transparent me-2 p-2">
                                    <i className="ti ti-ban fs-16 text-danger" />
                                  </span>
                                  <div>
                                    <h6 className="fs-14 fw-semibold text-dark mb-0 font-monospace">
                                      {item.ipAddress}
                                    </h6>
                                    <small className="text-muted">
                                      {item.company ? (
                                        <span className="badge bg-light text-dark me-1">
                                          {item.company.name}
                                        </span>
                                      ) : (
                                        <span className="badge bg-danger-subtle text-danger me-1">
                                          Global Platform Ban
                                        </span>
                                      )}
                                      <span
                                        className={`badge ${
                                          item.status === "Active"
                                            ? "badge-soft-success"
                                            : "badge-soft-secondary"
                                        }`}
                                      >
                                        {item.status}
                                      </span>
                                    </small>
                                  </div>
                                </div>
                                <div className="d-flex align-items-center">
                                  <button
                                    type="button"
                                    className="btn btn-icon btn-sm btn-light me-2"
                                    title="Edit"
                                    data-bs-toggle="modal"
                                    data-bs-target="#edit_ban"
                                    onClick={() => openEditModal(item)}
                                  >
                                    <i className="ti ti-edit text-primary" />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-icon btn-sm btn-light"
                                    title="Unban IP"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_modal"
                                    onClick={() => setDeletingItem(item)}
                                  >
                                    <i className="ti ti-trash text-danger" />
                                  </button>
                                </div>
                              </div>
                              <p className="fs-13 text-muted mb-1">
                                <i className="ti ti-info-circle me-1" />
                                {item.reason || "No reason specified"}
                              </p>
                              <div className="text-end">
                                <small className="text-muted fs-11">
                                  Banned on: {new Date(item.createdAt).toLocaleDateString()}
                                </small>
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

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR.</p>
        </div>
      </div>

      {/* Add New IP Address Modal */}
      <div className="modal fade" id="add_ban">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Ban New IP Address</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddIp}>
              <div className="modal-body pb-0">
                <div className="mb-3">
                  <label className="form-label">
                    IP Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 192.168.1.100 or 49.36.12.80"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    required
                  />
                  <small className="text-muted">Enter valid IPv4 or IPv6 address to block.</small>
                </div>

                {isSuperAdmin && (
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isGlobalBan"
                        checked={isGlobalBan}
                        onChange={(e) => setIsGlobalBan(e.target.checked)}
                      />
                      <label className="form-check-label fw-medium" htmlFor="isGlobalBan">
                        Global Ban (Block across all companies)
                      </label>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="Active">Active (Blocked)</option>
                    <option value="Inactive">Inactive (Disabled)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Reason for Banning</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Suspicious unauthorized logins, repeated failed attempts, terminated employee device."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Banning...
                    </>
                  ) : (
                    "Ban IP Address"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit IP Address Modal */}
      <div className="modal fade" id="edit_ban">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Banned IP Address</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdateIp}>
              <div className="modal-body pb-0">
                <div className="mb-3">
                  <label className="form-label">IP Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editIp}
                    onChange={(e) => setEditIp(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="Active">Active (Blocked)</option>
                    <option value="Inactive">Inactive (Allowed)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Unban</h4>
              <p className="mb-3 text-muted">
                Are you sure you want to unban IP{" "}
                <strong className="text-dark font-monospace">
                  {deletingItem?.ipAddress}
                </strong>
                ? Users connecting from this IP will regain access immediately.
              </p>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-light me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteIp}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Unbanning..." : "Yes, Unban IP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanIpAddress;
