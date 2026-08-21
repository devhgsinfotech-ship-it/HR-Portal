import { useState, useEffect } from 'react';
import { all_routes } from '../../../router/all_routes';
import { Link, useSearchParams } from 'react-router-dom';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import apiClient from '../../../core/utils/apiClient';

interface RolePermission {
    id?: number;
    companyRoleId?: number;
    module: string;
    canRead: boolean;
    canWrite: boolean;
    canCreate: boolean;
    canDelete: boolean;
    canImport: boolean;
    canExport: boolean;
}

interface CompanyRole {
    id: number;
    name: string;
    description: string | null;
    permissions: RolePermission[];
}

const PermissionPage = () => {
    const [searchParams] = useSearchParams();
    const roleIdStr = searchParams.get('id');
    const roleId = roleIdStr ? Number(roleIdStr) : null;

    const [role, setRole] = useState<CompanyRole | null>(null);
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // Load role permissions on mount
    useEffect(() => {
        const loadRolePermissions = async () => {
            if (!roleId) return;
            try {
                setLoading(true);
                const response = await apiClient.get(`/api/roles/${roleId}`);
                if (response.data?.success) {
                    setRole(response.data.data);
                    setPermissions(response.data.data.permissions || []);
                }
            } catch (err) {
                console.error('Failed to load permissions:', err);
            } finally {
                setLoading(false);
            }
        };
        loadRolePermissions();
    }, [roleId]);

    // Handle check/uncheck for specific checkbox
    const handleCheckboxChange = (moduleName: string, field: keyof RolePermission, checked: boolean) => {
        setPermissions((prev) =>
            prev.map((perm) => {
                if (perm.module === moduleName) {
                    return { ...perm, [field]: checked };
                }
                return perm;
            })
        );
    };

    // Handle check/uncheck all fields for a module
    const handleAllowAllChange = (moduleName: string, checked: boolean) => {
        setPermissions((prev) =>
            prev.map((perm) => {
                if (perm.module === moduleName) {
                    return {
                        ...perm,
                        canRead: checked,
                        canWrite: checked,
                        canCreate: checked,
                        canDelete: checked,
                        canImport: checked,
                        canExport: checked,
                    };
                }
                return perm;
            })
        );
    };

    // Save full permission matrix
    const handleSavePermissions = async () => {
        if (!roleId) return;
        try {
            setSaving(true);
            setMessage("");
            const response = await apiClient.put(`/api/roles/${roleId}/permissions`, {
                permissions
            });
            if (response.data?.success) {
                setMessage("Permissions saved successfully!");
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (err) {
            console.error('Failed to save permissions:', err);
            setMessage("Failed to save permissions.");
        } finally {
            setSaving(false);
        }
    };

    // Human readable names mapping for modules
    const getModuleLabel = (moduleName: string) => {
        const labels: Record<string, string> = {
            EMPLOYEES: "Employees Management",
            ATTENDANCE: "Attendance Tracking",
            LEAVES: "Leave & Holiday Management",
            PAYROLL: "Payroll & Salary Structures",
            PROJECTS: "Projects Configuration",
            TASKS: "Task Boards & Milestones",
            TIMESHEETS: "Timesheets Submission & Approvals",
            CLIENTS: "Clients Directory",
            FINANCE: "Finance & Project Budgets",
            ASSETS: "Assets & Inventory",
            DOCUMENTS: "Documents Storage",
            REPORTS: "System Reports",
            SETTINGS: "Company Settings"
        };
        return labels[moduleName] || moduleName;
    };

    if (!roleId) {
        return (
            <div className="page-wrapper">
                <div className="content">
                    <div className="alert alert-warning">No role ID specified. Please go back to the Roles page.</div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Permissions</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Administration</li>
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.rolePermission}>Roles</Link>
                                    </li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Permissions
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
                            <div className="head-icons ms-2">
                                <CollapseHeader />
                            </div>
                        </div>
                    </div>
                    {/* /Breadcrumb */}

                    {message && (
                        <div className={`alert ${message.includes("success") ? "alert-success" : "alert-danger"} mb-3`}>
                            {message}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading permission matrix...</p>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                                <h5>Role Permissions Matrix</h5>
                                <p className="mb-0">
                                    Configuring permissions for: <span className="text-primary fw-medium fs-16">{role?.name}</span>
                                </p>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-striped table-hover align-middle mb-0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th className="no-sort">Modules</th>
                                                <th>Allow All</th>
                                                <th>Read</th>
                                                <th>Write</th>
                                                <th>Create</th>
                                                <th>Delete</th>
                                                <th>Import</th>
                                                <th>Export</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {permissions.map((perm) => {
                                                const allChecked = perm.canRead && perm.canWrite && perm.canCreate && perm.canDelete && perm.canImport && perm.canExport;
                                                return (
                                                    <tr key={perm.module}>
                                                        <td className="text-gray-9 fw-medium">{getModuleLabel(perm.module)}</td>
                                                        <td>
                                                            <div className="form-check form-check-md">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={allChecked}
                                                                    onChange={(e) => handleAllowAllChange(perm.module, e.target.checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="form-check form-check-md">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={perm.canRead}
                                                                    onChange={(e) => handleCheckboxChange(perm.module, 'canRead', e.target.checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="form-check form-check-md">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={perm.canWrite}
                                                                    onChange={(e) => handleCheckboxChange(perm.module, 'canWrite', e.target.checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="form-check form-check-md">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={perm.canCreate}
                                                                    onChange={(e) => handleCheckboxChange(perm.module, 'canCreate', e.target.checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="form-check form-check-md">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={perm.canDelete}
                                                                    onChange={(e) => handleCheckboxChange(perm.module, 'canDelete', e.target.checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="form-check form-check-md">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={perm.canImport}
                                                                    onChange={(e) => handleCheckboxChange(perm.module, 'canImport', e.target.checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="form-check form-check-md">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={perm.canExport}
                                                                    onChange={(e) => handleCheckboxChange(perm.module, 'canExport', e.target.checked)}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="card-footer text-end p-3 bg-white border-top">
                                <Link to={all_routes.rolePermission} className="btn btn-light me-2">
                                    Cancel
                                </Link>
                                <button
                                    onClick={handleSavePermissions}
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Saving Changes..." : "Save Permissions"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* /Page Wrapper */}
        </>
    );
};

export default PermissionPage;
