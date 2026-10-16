import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";

interface BackupItem {
  id: number;
  companyId: number | null;
  backupType: string;
  fileName: string;
  fileSize: string;
  recordCount: number;
  status: string;
  createdAt: string;
  company?: {
    id: number;
    name: string;
    companyCode?: string;
  } | null;
}

interface CompanyItem {
  id: number;
  name: string;
  companyCode?: string;
}

interface RestoreSummary {
  companyName?: string;
  settingsRestored?: boolean;
  departments?: number;
  designations?: number;
  companyRoles?: number;
  leaveTypes?: number;
  holidays?: number;
  clients?: number;
  projects?: number;
  tasks?: number;
  announcements?: number;
  assets?: number;
  employeesMatched?: number;
  attendanceRestored?: number;
  leavesRestored?: number;
  totalCompaniesRestored?: number;
  details?: any[];
}

const Backup: React.FC = () => {
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
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger" | "info"; message: string } | null>(null);

  // Filters
  const [filterTab, setFilterTab] = useState<"ALL" | "SYSTEM_ALL" | "COMPANY">("ALL");
  const [filterDate, setFilterDate] = useState<string>("");

  // Generate Options (for Super Admin)
  const [backupScope, setBackupScope] = useState<"COMPANY" | "SYSTEM_ALL">(
    isSuperAdmin ? "SYSTEM_ALL" : "COMPANY"
  );
  const [targetCompanyId, setTargetCompanyId] = useState<string>("");

  // Delete State
  const [deletingBackup, setDeletingBackup] = useState<BackupItem | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Restore State
  const [restoreTab, setRestoreTab] = useState<"DATE_SELECT" | "UPLOAD_FILE">("DATE_SELECT");
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupItem | null>(null);
  const [restoreDateInput, setRestoreDateInput] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<any | null>(null);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [restoreResult, setRestoreResult] = useState<{
    fileName: string;
    summary: RestoreSummary;
  } | null>(null);

  // Quick feedback for copied file name
  const [copiedFileId, setCopiedFileId] = useState<number | null>(null);

  // Helper to open/close bootstrap modals
  const triggerModal = (id: string, action: "show" | "hide") => {
    const el = document.getElementById(id);
    if (!el) return;
    if ((window as any).bootstrap?.Modal) {
      const modal = (window as any).bootstrap.Modal.getOrCreateInstance(el);
      if (action === "show") modal.show();
      else modal.hide();
    } else {
      if (action === "show") {
        el.classList.add("show");
        el.style.display = "block";
        document.body.classList.add("modal-open");
      } else {
        el.classList.remove("show");
        el.style.display = "none";
        document.body.classList.remove("modal-open");
      }
    }
  };

  // Fetch Backups
  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/other-settings/backups");
      if (res?.data?.success) {
        const list: BackupItem[] = res.data.data || [];
        setBackups(list);
        if (list.length > 0 && !selectedBackupForRestore) {
          setSelectedBackupForRestore(list[0]);
        }
      }
    } catch (err: any) {
      console.error("Failed to load backups:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to load backups."
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Companies (for Super Admin dropdown)
  const fetchCompanies = async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await apiClient.get("/super-admin/companies");
      const list = res?.data?.companies || res?.data?.data || [];
      if (Array.isArray(list)) {
        setCompanies(list);
      }
    } catch (err) {
      console.error("Failed to load companies for backup:", err);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchCompanies();
  }, [isSuperAdmin]);

  // Generate Backup
  const handleGenerateBackup = async () => {
    try {
      setGenerating(true);
      setAlert(null);

      const payload: any = {
        backupType: isSuperAdmin ? backupScope : "COMPANY",
        targetCompanyId: isSuperAdmin && backupScope === "COMPANY" ? targetCompanyId : undefined
      };

      if (isSuperAdmin && backupScope === "COMPANY" && !targetCompanyId) {
        setAlert({ type: "danger", message: "Please select a company to generate its backup." });
        setGenerating(false);
        return;
      }

      const res = await apiClient.post("/other-settings/backups/generate", payload);
      if (res?.data?.success) {
        setAlert({
          type: "success",
          message: res.data.message || "Backup created successfully."
        });

        triggerModal("generate_backup", "hide");
        await fetchBackups();
      }
    } catch (err: any) {
      console.error("Failed to generate backup:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to generate database backup."
      });
    } finally {
      setGenerating(false);
    }
  };

  // Download Backup
  const handleDownload = async (item: BackupItem) => {
    try {
      setAlert({ type: "info", message: `Downloading backup archive "${item.fileName}"...` });
      const response = await apiClient.get(`/other-settings/backups/${item.id}/download`, {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", item.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setAlert({ type: "success", message: `Backup "${item.fileName}" downloaded successfully!` });
    } catch (err: any) {
      console.error("Download error:", err);
      setAlert({ type: "danger", message: "Failed to download backup file." });
    }
  };

  // Delete Backup
  const handleDeleteBackup = async () => {
    if (!deletingBackup) return;

    try {
      setActionLoading(true);
      setAlert(null);
      const res = await apiClient.delete(`/other-settings/backups/${deletingBackup.id}`);
      if (res?.data?.success) {
        setAlert({ type: "success", message: res.data.message || "Backup deleted successfully." });
        triggerModal("delete_modal", "hide");
        setDeletingBackup(null);
        await fetchBackups();
      }
    } catch (err: any) {
      console.error("Error deleting backup:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to delete backup file."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Restore Modal for a specific row/item
  const handleOpenRestoreSpecific = (item: BackupItem) => {
    setSelectedBackupForRestore(item);
    setRestoreTab("DATE_SELECT");
    const dStr = new Date(item.createdAt).toISOString().split("T")[0];
    setRestoreDateInput(dStr);
    triggerModal("restore_modal", "show");
  };

  // Open General Restore Modal from Top Button
  const handleOpenGeneralRestore = () => {
    if (backups.length > 0 && !selectedBackupForRestore) {
      setSelectedBackupForRestore(backups[0]);
    }
    triggerModal("restore_modal", "show");
  };

  // Handle Restore Execution
  const handleExecuteRestore = async () => {
    try {
      setRestoring(true);
      setAlert(null);

      if (restoreTab === "DATE_SELECT") {
        if (!selectedBackupForRestore) {
          setAlert({ type: "danger", message: "Please choose a backup snapshot to restore." });
          setRestoring(false);
          return;
        }

        const res = await apiClient.post(`/other-settings/backups/${selectedBackupForRestore.id}/restore`);
        if (res?.data?.success) {
          triggerModal("restore_modal", "hide");
          setRestoreResult({
            fileName: selectedBackupForRestore.fileName,
            summary: res.data.data || {}
          });
          triggerModal("restore_result_modal", "show");
          await fetchBackups();
        }
      } else {
        // Upload File Restore
        if (!uploadedFile) {
          setAlert({ type: "danger", message: "Please select a .json backup file to upload." });
          setRestoring(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", uploadedFile);
        if (isSuperAdmin && targetCompanyId) {
          formData.append("targetCompanyId", targetCompanyId);
        }

        const res = await apiClient.post("/other-settings/backups/restore-upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (res?.data?.success) {
          triggerModal("restore_modal", "hide");
          setRestoreResult({
            fileName: uploadedFile.name,
            summary: res.data.data || {}
          });
          triggerModal("restore_result_modal", "show");
          setUploadedFile(null);
          setFileDetails(null);
          await fetchBackups();
        }
      }
    } catch (err: any) {
      console.error("Restore failed:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to restore backup snapshot."
      });
    } finally {
      setRestoring(false);
    }
  };

  // Handle Local File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setAlert({ type: "danger", message: "Invalid file format. Please upload a valid .json backup archive." });
      return;
    }

    setUploadedFile(file);

    // Read and parse metadata preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setFileDetails({
          title: json.metadata?.title || "Company Backup File",
          generatedAt: json.metadata?.generatedAt || "Unknown date",
          companyName: json.metadata?.companyName || json.companyInfo?.name || "Single Company",
          totalRecords: json.metadata?.totalRecords ?? "Multiple records",
          backupType: json.metadata?.backupType || "COMPANY",
          version: json.metadata?.version || "2.0.0"
        });
      } catch (pErr) {
        setFileDetails(null);
        setAlert({ type: "danger", message: "The chosen file is not a valid JSON archive." });
      }
    };
    reader.readAsText(file);
  };

  // Filter Backups list
  const filteredBackups = backups.filter((b) => {
    // Type filter
    if (filterTab === "SYSTEM_ALL" && b.backupType !== "SYSTEM_ALL") return false;
    if (filterTab === "COMPANY" && b.backupType === "SYSTEM_ALL") return false;

    // Date filter
    if (filterDate) {
      const bDateStr = new Date(b.createdAt).toISOString().split("T")[0];
      const localDateStr = new Date(b.createdAt).toLocaleDateString();
      if (!bDateStr.includes(filterDate) && !localDateStr.includes(filterDate)) {
        return false;
      }
    }
    return true;
  });

  // Filtered backups available for the restore modal dropdown
  const restoreCandidateBackups = restoreDateInput
    ? backups.filter((b) => {
        const bDateStr = new Date(b.createdAt).toISOString().split("T")[0];
        return bDateStr === restoreDateInput;
      })
    : backups;

  // Summary Metrics
  const systemAllCount = backups.filter((b) => b.backupType === "SYSTEM_ALL").length;
  const companyCount = backups.filter((b) => b.backupType !== "SYSTEM_ALL").length;
  const latestBackup = backups[0]?.createdAt
    ? new Date(backups[0].createdAt).toLocaleDateString()
    : "None";

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">
                {isSuperAdmin ? "System & Multi-Company Backup" : "Company Data Backup"}
              </h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={isSuperAdmin ? routes.superAdminDashboard : routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">
                    {isSuperAdmin ? "Super Admin" : "Settings"}
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Backup Management
                  </li>
                </ol>
              </nav>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Quick Metrics Bar */}
          <div className="row mb-3 g-3">
            <div className="col-sm-6 col-xl-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body p-3 d-flex align-items-center">
                  <div className="avatar avatar-lg rounded-circle bg-primary-transparent text-primary me-3 d-flex align-items-center justify-content-center">
                    <i className="ti ti-database fs-22" />
                  </div>
                  <div>
                    <span className="text-muted fs-12 d-block">Total Archives</span>
                    <h4 className="mb-0 fw-bold">{backups.length}</h4>
                  </div>
                </div>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="col-sm-6 col-xl-3">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body p-3 d-flex align-items-center">
                    <div className="avatar avatar-lg rounded-circle bg-info-transparent text-info me-3 d-flex align-items-center justify-content-center">
                      <i className="ti ti-server fs-22" />
                    </div>
                    <div>
                      <span className="text-muted fs-12 d-block">All-Companies Masters</span>
                      <h4 className="mb-0 fw-bold">{systemAllCount}</h4>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="col-sm-6 col-xl-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body p-3 d-flex align-items-center">
                  <div className="avatar avatar-lg rounded-circle bg-success-transparent text-success me-3 d-flex align-items-center justify-content-center">
                    <i className="ti ti-building fs-22" />
                  </div>
                  <div>
                    <span className="text-muted fs-12 d-block">
                      {isSuperAdmin ? "Single Company Archives" : "My Company Backups"}
                    </span>
                    <h4 className="mb-0 fw-bold">{companyCount}</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body p-3 d-flex align-items-center">
                  <div className="avatar avatar-lg rounded-circle bg-warning-transparent text-warning me-3 d-flex align-items-center justify-content-center">
                    <i className="ti ti-clock-check fs-22" />
                  </div>
                  <div>
                    <span className="text-muted fs-12 d-block">Latest Snapshot</span>
                    <h4 className="mb-0 fw-bold fs-15">{latestBackup}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Tabs for non-superadmin */}
          {!isSuperAdmin && (
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
                <Link className="nav-link active" to={routes.backup}>
                  <i className="ti ti-settings-2 me-2" />
                  Other Settings
                </Link>
              </li>
            </ul>
          )}

          <div className="row">
            {/* Left sidebar only for Company Admin settings tabs */}
            {!isSuperAdmin && (
              <div className="col-xl-3 theiaStickySidebar">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex flex-column list-group settings-list">
                      <Link
                        to={routes.storage}
                        className="d-inline-flex align-items-center rounded py-2 px-3"
                      >
                        Storage
                      </Link>
                      <Link
                        to={routes.backup}
                        className="d-inline-flex align-items-center rounded active py-2 px-3"
                      >
                        <i className="ti ti-arrow-badge-right me-2" />
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
            )}

            <div className={isSuperAdmin ? "col-12" : "col-xl-9"}>
              {/* Alert Notification */}
              {alert && (
                <div
                  className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center mb-3 shadow-sm`}
                  role="alert"
                >
                  <i
                    className={`ti ${
                      alert.type === "success"
                        ? "ti-circle-check"
                        : alert.type === "info"
                        ? "ti-info-circle"
                        : "ti-alert-circle"
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

              {/* Action Header Card with Restore & Generate */}
              <div className="card mb-3 shadow-sm border">
                <div className="card-body py-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div>
                      <h4 className="mb-1 d-flex align-items-center gap-2">
                        {isSuperAdmin ? (
                          <>
                            <i className="ti ti-server-cog text-primary" />
                            Multi-Company &amp; Platform Data Backups
                          </>
                        ) : (
                          <>
                            <i className="ti ti-building text-primary" />
                            Company Data Backup &amp; Archive
                          </>
                        )}
                      </h4>
                      <p className="text-muted fs-13 mb-0">
                        {isSuperAdmin
                          ? "Super Admin can generate master archives of all companies, download raw JSON snapshots, and restore the database from any specific snapshot date."
                          : "Generate, download, and restore complete JSON archives containing all your company records (Employees, Attendance, Leaves, Payroll, Projects, Tasks, etc.)."}
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-success d-flex align-items-center px-3 py-2 fw-medium shadow-sm"
                        onClick={handleOpenGeneralRestore}
                      >
                        <i className="ti ti-history me-2 fs-18" />
                        Restore Backup
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary d-flex align-items-center px-3 py-2 fw-medium shadow-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#generate_backup"
                      >
                        <i className="ti ti-database-export me-2 fs-18" />
                        Generate New Backup
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Tabs & Specific Date Filter */}
              <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {isSuperAdmin && (
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className={`btn btn-sm ${filterTab === "ALL" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setFilterTab("ALL")}
                      >
                        All Archives ({backups.length})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${filterTab === "SYSTEM_ALL" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setFilterTab("SYSTEM_ALL")}
                      >
                        🌐 All Companies ({systemAllCount})
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${filterTab === "COMPANY" ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setFilterTab("COMPANY")}
                      >
                        🏢 Single Company ({companyCount})
                      </button>
                    </div>
                  )}

                  {/* Date Filter Input */}
                  <div className="d-flex align-items-center gap-1 bg-white p-1 rounded border shadow-xs">
                    <i className="ti ti-calendar text-muted ms-2 fs-15" />
                    <input
                      type="date"
                      className="form-control form-control-sm border-0 shadow-none"
                      style={{ width: "145px" }}
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      title="Filter archives by specific date"
                    />
                    {filterDate && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 me-2 text-decoration-none"
                        title="Clear date filter"
                        onClick={() => setFilterDate("")}
                      >
                        <i className="ti ti-x" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {filterDate && (
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fs-12">
                      Filtered by date: {new Date(filterDate).toLocaleDateString()}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary d-flex align-items-center"
                    onClick={() => fetchBackups()}
                    disabled={loading}
                  >
                    <i className={`ti ti-refresh me-1 ${loading ? "ti-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Backup Records Table Card */}
              <div className="card shadow-sm border">
                <div className="card-header bg-white px-3 py-3 d-flex align-items-center justify-content-between border-bottom flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="mb-0 fw-bold">
                      {isSuperAdmin ? "Multi-Company Archive Repository" : "Company Backup Archives"}
                    </h5>
                    {filterDate && (
                      <span className="badge bg-warning-subtle text-warning border px-2 py-1 fs-11">
                        Date: {filterDate}
                      </span>
                    )}
                  </div>
                  <span className="badge bg-light text-dark fs-12 px-2 py-1 border">
                    Showing {filteredBackups.length} of {backups.length} Archives
                  </span>
                </div>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-muted mt-2 mb-0">Loading backup archives...</p>
                    </div>
                  ) : filteredBackups.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="avatar avatar-xxl bg-light-primary rounded-circle text-primary mb-3 mx-auto">
                        <i className="ti ti-database-off fs-36" />
                      </div>
                      <h5>No Backups Found</h5>
                      <p className="text-muted fs-13 mb-3">
                        {filterDate
                          ? `No backup snapshot was created on ${filterDate}. Try clearing the date filter.`
                          : filterTab !== "ALL"
                          ? "No archives match the selected filter tab."
                          : "No backup snapshots have been generated yet. Create your first archive now."}
                      </p>
                      <div className="d-flex justify-content-center gap-2">
                        {filterDate && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm px-3"
                            onClick={() => setFilterDate("")}
                          >
                            <i className="ti ti-x me-1" /> Clear Date Filter
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary btn-sm px-3"
                          data-bs-toggle="modal"
                          data-bs-target="#generate_backup"
                        >
                          <i className="ti ti-plus me-1" /> Generate Backup Now
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ overflowX: "auto" }}>
                      <table className="table table-hover align-middle mb-0" style={{ minWidth: "960px" }}>
                        <thead className="thead-light">
                          <tr>
                            <th style={{ width: "180px" }}>Backup Scope</th>
                            <th style={{ width: "260px" }}>File Name</th>
                            <th style={{ width: "95px" }}>Size</th>
                            <th style={{ width: "100px" }}>Records</th>
                            <th style={{ width: "115px" }}>Status</th>
                            <th style={{ width: "175px" }}>Created Date</th>
                            <th
                              className="text-end"
                              style={{
                                width: "235px",
                                position: "sticky",
                                right: 0,
                                backgroundColor: "#f8f9fa",
                                zIndex: 2,
                                boxShadow: "-4px 0 6px rgba(0,0,0,0.04)"
                              }}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBackups.map((item) => (
                            <tr key={item.id}>
                              <td>
                                {item.backupType === "SYSTEM_ALL" ? (
                                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle py-1 px-2 d-inline-flex align-items-center">
                                    <i className="ti ti-server me-1" />
                                    All Companies (Master)
                                  </span>
                                ) : (
                                  <span className="badge bg-info-subtle text-info border border-info-subtle py-1 px-2 d-inline-flex align-items-center">
                                    <i className="ti ti-building me-1" />
                                    {item.company?.name || `Company #${item.companyId}`}
                                    {item.company?.companyCode ? ` (${item.company.companyCode})` : ""}
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="d-flex align-items-center" style={{ maxWidth: "250px" }}>
                                  <i className="ti ti-file-code fs-18 text-warning me-2 flex-shrink-0" />
                                  <span
                                    className="fw-medium font-monospace fs-13 text-dark text-truncate"
                                    title={item.fileName}
                                  >
                                    {item.fileName}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0 ms-1 text-muted flex-shrink-0"
                                    title="Copy filename"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.fileName);
                                      setCopiedFileId(item.id);
                                      setTimeout(() => setCopiedFileId(null), 1500);
                                    }}
                                  >
                                    <i
                                      className={`ti ${
                                        copiedFileId === item.id ? "ti-check text-success" : "ti-copy"
                                      } fs-14`}
                                    />
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark fw-medium border">
                                  {item.fileSize}
                                </span>
                              </td>
                              <td>
                                <span className="fs-13 text-muted">
                                  {item.recordCount.toLocaleString()} items
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-success-subtle text-success py-1 px-2">
                                  <i className="ti ti-check me-1" />
                                  {item.status}
                                </span>
                              </td>
                              <td className="fs-13 text-dark">
                                <div className="fw-medium">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-muted fs-11">
                                  {new Date(item.createdAt).toLocaleTimeString()}
                                </div>
                              </td>
                              <td
                                className="text-end"
                                style={{
                                  position: "sticky",
                                  right: 0,
                                  backgroundColor: "#fff",
                                  zIndex: 1,
                                  boxShadow: "-4px 0 6px rgba(0,0,0,0.04)"
                                }}
                              >
                                <div className="d-inline-flex gap-1">
                                  {/* Download Option */}
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center px-2 py-1"
                                    title="Download Backup JSON archive to your computer"
                                    onClick={() => handleDownload(item)}
                                  >
                                    <i className="ti ti-download me-1" />
                                    Download
                                  </button>

                                  {/* Restore Option */}
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success d-inline-flex align-items-center px-2 py-1"
                                    title={`Restore database to snapshot from ${new Date(item.createdAt).toLocaleDateString()}`}
                                    onClick={() => handleOpenRestoreSpecific(item)}
                                  >
                                    <i className="ti ti-rotate-clockwise me-1" />
                                    Restore
                                  </button>

                                  {/* Delete Option */}
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger px-2 py-1"
                                    title="Delete Backup File"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_modal"
                                    onClick={() => setDeletingBackup(item)}
                                  >
                                    <i className="ti ti-trash" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR Platform.</p>
        </div>
      </div>

      {/* ==================================================== */}
      {/* RESTORE BACKUP MODAL (By Specific Date or Upload)     */}
      {/* ==================================================== */}
      <div className="modal fade" id="restore_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-success-transparent border-bottom py-3">
              <h4 className="modal-title d-flex align-items-center gap-2 text-success">
                <i className="ti ti-history fs-24" />
                Restore Database Backup
              </h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <div className="modal-body p-4">
              {/* Tab selector */}
              <ul className="nav nav-pills nav-fill mb-4 bg-light p-1 rounded">
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link py-2 fs-14 fw-medium ${
                      restoreTab === "DATE_SELECT" ? "active bg-success text-white" : "text-muted"
                    }`}
                    onClick={() => setRestoreTab("DATE_SELECT")}
                  >
                    <i className="ti ti-calendar me-2" />
                    Restore by Snapshot Date ({backups.length} available)
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link py-2 fs-14 fw-medium ${
                      restoreTab === "UPLOAD_FILE" ? "active bg-success text-white" : "text-muted"
                    }`}
                    onClick={() => setRestoreTab("UPLOAD_FILE")}
                  >
                    <i className="ti ti-upload me-2" />
                    Upload &amp; Restore Backup File (.json)
                  </button>
                </li>
              </ul>

              {restoreTab === "DATE_SELECT" ? (
                <div>
                  <div className="row g-3 mb-3">
                    {/* Specific Date Filter input */}
                    <div className="col-md-5">
                      <label className="form-label fw-bold fs-13">
                        <i className="ti ti-calendar-event me-1 text-primary" />
                        Filter by Snapshot Date:
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={restoreDateInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRestoreDateInput(val);
                          if (val) {
                            const found = backups.find((b) =>
                              new Date(b.createdAt).toISOString().startsWith(val)
                            );
                            if (found) setSelectedBackupForRestore(found);
                          }
                        }}
                      />
                      {restoreDateInput && (
                        <div className="mt-1 d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {restoreCandidateBackups.length} snapshot(s) found on this date
                          </small>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                            onClick={() => setRestoreDateInput("")}
                          >
                            Show all dates
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Snapshot Selection Dropdown */}
                    <div className="col-md-7">
                      <label className="form-label fw-bold fs-13">
                        <i className="ti ti-database me-1 text-success" />
                        Choose Archive Snapshot: <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={selectedBackupForRestore?.id || ""}
                        onChange={(e) => {
                          const id = parseInt(e.target.value);
                          const item = backups.find((b) => b.id === id) || null;
                          setSelectedBackupForRestore(item);
                        }}
                      >
                        {restoreCandidateBackups.length === 0 ? (
                          <option value="">No snapshots found for this date</option>
                        ) : (
                          restoreCandidateBackups.map((item) => (
                            <option key={item.id} value={item.id}>
                              📅 {new Date(item.createdAt).toLocaleDateString()} at{" "}
                              {new Date(item.createdAt).toLocaleTimeString()} —{" "}
                              {item.backupType === "SYSTEM_ALL"
                                ? "All Companies Master"
                                : item.company?.name || `Company #${item.companyId}`}{" "}
                              ({item.fileSize}, {item.recordCount} items)
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Selected Snapshot Details Preview Card */}
                  {selectedBackupForRestore ? (
                    <div className="card bg-light border p-3 mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                        <div className="fw-bold fs-14 text-dark d-flex align-items-center gap-2">
                          <i className="ti ti-file-check fs-20 text-success" />
                          Selected Snapshot Details
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center"
                          onClick={() => handleDownload(selectedBackupForRestore)}
                        >
                          <i className="ti ti-download me-1" />
                          Download Copy First
                        </button>
                      </div>

                      <div className="row g-2 fs-13">
                        <div className="col-sm-6">
                          <span className="text-muted d-block">Snapshot Created Date:</span>
                          <span className="fw-bold text-dark">
                            {new Date(selectedBackupForRestore.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted d-block">Scope:</span>
                          <span className="fw-bold text-dark">
                            {selectedBackupForRestore.backupType === "SYSTEM_ALL"
                              ? "Full System All Companies"
                              : selectedBackupForRestore.company?.name || `Company #${selectedBackupForRestore.companyId}`}
                          </span>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted d-block">File Name:</span>
                          <span className="font-monospace text-dark text-truncate d-block">
                            {selectedBackupForRestore.fileName}
                          </span>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted d-block">Archive Size &amp; Records:</span>
                          <span className="badge bg-secondary-subtle text-secondary me-2">
                            {selectedBackupForRestore.fileSize}
                          </span>
                          <span className="badge bg-primary-subtle text-primary">
                            {selectedBackupForRestore.recordCount} records
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-warning fs-13 mb-3">
                      Please pick a backup archive snapshot from the list above.
                    </div>
                  )}

                  {/* Security & Data Integrity Warning */}
                  <div className="alert alert-warning d-flex align-items-start p-3 mb-0">
                    <i className="ti ti-alert-triangle fs-22 me-2 text-warning flex-shrink-0 mt-1" />
                    <div className="fs-13">
                      <strong>Important Notice:</strong> Restoring this backup will safely populate and
                      synchronize records (settings, departments, designations, roles, holidays, leave types,
                      employees, attendance records, leaves, projects, tasks, etc.) to match the state saved
                      on <strong>{selectedBackupForRestore ? new Date(selectedBackupForRestore.createdAt).toLocaleDateString() : "this date"}</strong>.
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Upload File */
                <div>
                  <div className="mb-3">
                    <label className="form-label fw-bold fs-13">
                      Select Backup File (.json): <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className="form-control form-control-lg"
                      accept=".json"
                      onChange={handleFileChange}
                    />
                    <small className="text-muted mt-1 d-block">
                      Upload an official JSON backup file previously downloaded from this portal.
                    </small>
                  </div>

                  {fileDetails && (
                    <div className="card bg-light border p-3 mb-3">
                      <div className="fw-bold fs-14 text-dark mb-2 d-flex align-items-center gap-2">
                        <i className="ti ti-check fs-18 text-success" />
                        Verified Backup File
                      </div>
                      <div className="row g-2 fs-13">
                        <div className="col-sm-6">
                          <span className="text-muted d-block">Archive Title:</span>
                          <span className="fw-bold text-dark">{fileDetails.title}</span>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted d-block">Target Scope:</span>
                          <span className="fw-bold text-dark">{fileDetails.companyName}</span>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted d-block">Backup Snapshot Date:</span>
                          <span className="fw-bold text-dark">{fileDetails.generatedAt}</span>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted d-block">Records in Archive:</span>
                          <span className="badge bg-success-subtle text-success">
                            {fileDetails.totalRecords}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="alert alert-info d-flex align-items-start p-3 mb-0">
                    <i className="ti ti-info-circle fs-22 me-2 text-info flex-shrink-0 mt-1" />
                    <div className="fs-13">
                      The uploaded file will be verified and its data safely restored to your company.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer border-top py-3">
              <button
                type="button"
                className="btn btn-light me-2"
                data-bs-dismiss="modal"
                disabled={restoring}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success d-flex align-items-center px-4"
                onClick={handleExecuteRestore}
                disabled={restoring || (restoreTab === "DATE_SELECT" && !selectedBackupForRestore) || (restoreTab === "UPLOAD_FILE" && !uploadedFile)}
              >
                {restoring ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Restoring Data...
                  </>
                ) : (
                  <>
                    <i className="ti ti-rotate-clockwise me-2 fs-16" />
                    {restoreTab === "DATE_SELECT"
                      ? `Restore Snapshot (${selectedBackupForRestore ? new Date(selectedBackupForRestore.createdAt).toLocaleDateString() : ""})`
                      : "Restore Uploaded File"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* RESTORE RESULT SUMMARY MODAL                          */}
      {/* ==================================================== */}
      <div className="modal fade" id="restore_result_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-body text-center p-4">
              <div className="avatar avatar-xxl bg-success-transparent text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
                <i className="ti ti-circle-check fs-42" />
              </div>

              <h4 className="fw-bold mb-1">Restore Completed Successfully!</h4>
              <p className="text-muted fs-13 mb-3">
                Data records from archive{" "}
                <span className="fw-medium font-monospace text-dark">
                  {restoreResult?.fileName}
                </span>{" "}
                have been restored and synchronized.
              </p>

              {restoreResult?.summary && (
                <div className="card bg-light border p-3 text-start mb-3">
                  <h6 className="fw-bold fs-13 mb-2 border-bottom pb-1">
                    Restoration Summary Report:
                  </h6>
                  <div className="row g-2 fs-12">
                    <div className="col-6">
                      <span className="text-muted">Settings Updated:</span>{" "}
                      <strong>{restoreResult.summary.settingsRestored ? "Yes" : "Preserved"}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Departments:</span>{" "}
                      <strong>{restoreResult.summary.departments ?? 0} restored</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Designations:</span>{" "}
                      <strong>{restoreResult.summary.designations ?? 0} restored</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Company Roles:</span>{" "}
                      <strong>{restoreResult.summary.companyRoles ?? 0} restored</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Leave Types:</span>{" "}
                      <strong>{restoreResult.summary.leaveTypes ?? 0} restored</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Holidays:</span>{" "}
                      <strong>{restoreResult.summary.holidays ?? 0} restored</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Employees Matched:</span>{" "}
                      <strong>{restoreResult.summary.employeesMatched ?? 0} linked</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Attendance Punches:</span>{" "}
                      <strong>{restoreResult.summary.attendanceRestored ?? 0} restored</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Leave Requests:</span>{" "}
                      <strong>{restoreResult.summary.leavesRestored ?? 0} restored</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Projects &amp; Tasks:</span>{" "}
                      <strong>
                        {(restoreResult.summary.projects ?? 0) + (restoreResult.summary.tasks ?? 0)} restored
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary px-4"
                data-bs-dismiss="modal"
                onClick={() => setRestoreResult(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* GENERATE BACKUP MODAL                                */}
      {/* ==================================================== */}
      <div className="modal fade" id="generate_backup" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom py-3">
              <h4 className="modal-title d-flex align-items-center gap-2">
                <i className="ti ti-database-export text-primary" />
                {isSuperAdmin ? "Generate Platform or Company Backup" : "Generate Company Backup Archive"}
              </h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body p-4">
              {isSuperAdmin ? (
                <>
                  <p className="text-muted fs-14 mb-3">
                    As a <strong>Super Admin</strong>, you can create a master archive of the entire system (all companies), or generate an isolated backup for any specific tenant:
                  </p>

                  <div className="mb-4">
                    <label className="form-label fw-bold mb-2">Select Backup Scope</label>
                    <div className="row g-3">
                      {/* Option 1: Full System All Companies */}
                      <div className="col-md-6">
                        <label
                          htmlFor="scopeSystemAll"
                          className={`card h-100 p-3 border cursor-pointer transition ${
                            backupScope === "SYSTEM_ALL" ? "border-primary bg-primary-transparent shadow-xs" : "bg-light"
                          }`}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <input
                              className="form-check-input mt-1"
                              type="radio"
                              name="backupScope"
                              id="scopeSystemAll"
                              value="SYSTEM_ALL"
                              checked={backupScope === "SYSTEM_ALL"}
                              onChange={() => setBackupScope("SYSTEM_ALL")}
                            />
                            <div>
                              <div className="fw-bold text-dark fs-15 mb-1">
                                🌐 Full Platform Backup
                              </div>
                              <span className="badge bg-primary text-white mb-2 fs-11">All Companies</span>
                              <p className="text-muted fs-12 mb-0">
                                Exports <strong>ALL tenant companies</strong>, users, subscriptions, attendance records, leaves, payrolls, and system configs into a single master snapshot.
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Option 2: Specific Company */}
                      <div className="col-md-6">
                        <label
                          htmlFor="scopeCompany"
                          className={`card h-100 p-3 border cursor-pointer transition ${
                            backupScope === "COMPANY" ? "border-primary bg-primary-transparent shadow-xs" : "bg-light"
                          }`}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <input
                              className="form-check-input mt-1"
                              type="radio"
                              name="backupScope"
                              id="scopeCompany"
                              value="COMPANY"
                              checked={backupScope === "COMPANY"}
                              onChange={() => setBackupScope("COMPANY")}
                            />
                            <div>
                              <div className="fw-bold text-dark fs-15 mb-1">
                                🏢 Single Company Backup
                              </div>
                              <span className="badge bg-info text-white mb-2 fs-11">Targeted Tenant</span>
                              <p className="text-muted fs-12 mb-0">
                                Choose one specific company from the list to export only that company's isolated dataset.
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {backupScope === "COMPANY" && (
                    <div className="mb-3 p-3 bg-light rounded border">
                      <label className="form-label fw-bold">
                        Select Target Company <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-lg"
                        value={targetCompanyId}
                        onChange={(e) => setTargetCompanyId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Company from List ({companies.length} companies available) --</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.companyCode ? `(${c.companyCode})` : ""}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted mt-1 d-block">
                        The generated file will be labeled specifically with the company code and name.
                      </small>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="alert alert-info d-flex align-items-center py-3 px-3 mb-3">
                    <i className="ti ti-info-circle fs-24 me-2 text-info" />
                    <div className="fs-13">
                      This will generate an official JSON data archive of your company. It includes all
                      departments, employees, attendance punches, leave requests, approved holidays,
                      payroll slips, projects, tasks, and company settings.
                    </div>
                  </div>
                  <p className="text-dark fw-medium mb-0">
                    Are you ready to initiate the backup snapshot for your company now?
                  </p>
                </>
              )}
            </div>
            <div className="modal-footer border-top py-3">
              <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center"
                onClick={handleGenerateBackup}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Generating Snapshot...
                  </>
                ) : (
                  <>
                    <i className="ti ti-download me-1" />
                    {isSuperAdmin && backupScope === "SYSTEM_ALL"
                      ? "Start All-Companies Backup"
                      : "Start Company Backup"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* DELETE CONFIRMATION MODAL                            */}
      {/* ==================================================== */}
      <div className="modal fade" id="delete_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Deletion</h4>
              <p className="mb-3 text-muted">
                Are you sure you want to permanently delete backup archive{" "}
                <strong className="text-dark font-monospace">
                  {deletingBackup?.fileName}
                </strong>
                ? The stored file will be removed from the server.
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
                  onClick={handleDeleteBackup}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Deleting..." : "Yes, Delete File"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backup;
