import { useState, useEffect } from 'react';
import { all_routes } from '../../../router/all_routes';
import { Link } from 'react-router-dom';
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import apiClient from '../../../core/utils/apiClient';

interface CompanyRole {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    _count?: {
        employees: number;
    };
}

interface ColumnType<T> {
    title: string;
    dataIndex: keyof T | string;
    render?: (text: any, record?: T) => React.ReactNode;
    sorter?: (a: T, b: T) => number;
}

const RolesPermission = () => {
    const [roles, setRoles] = useState<CompanyRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDesc, setNewRoleDesc] = useState("");
    const [selectedRole, setSelectedRole] = useState<CompanyRole | null>(null);

    // Fetch all company roles
    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/roles');
            if (response.data?.success) {
                setRoles(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // Create a new role
    const handleAddRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName) return;
        try {
            const response = await apiClient.post('/api/roles', {
                name: newRoleName,
                description: newRoleDesc
            });
            if (response.data?.success) {
                setNewRoleName("");
                setNewRoleDesc("");
                fetchRoles();
            }
        } catch (err) {
            console.error('Failed to create role:', err);
        }
    };

    // Save edited role
    const handleEditRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole || !selectedRole.name) return;
        try {
            const response = await apiClient.put(`/api/roles/${selectedRole.id}`, {
                name: selectedRole.name,
                description: selectedRole.description,
                isActive: selectedRole.isActive
            });
            if (response.data?.success) {
                setSelectedRole(null);
                fetchRoles();
            }
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    };

    // Delete a role
    const handleDeleteRole = async (roleId: number) => {
        try {
            const response = await apiClient.delete(`/api/roles/${roleId}`);
            if (response.data?.success) {
                fetchRoles();
            }
        } catch (err) {
            console.error('Failed to delete role:', err);
        }
    };

    const columns: ColumnType<CompanyRole>[] = [
        {
            title: "Role Name",
            dataIndex: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text: string) => <span className="fw-medium text-gray-9">{text}</span>
        },
        {
            title: "Description",
            dataIndex: "description",
            render: (text: string) => <span>{text || '—'}</span>
        },
        {
            title: "Active Employees",
            dataIndex: "employees",
            render: (_text: any, record?: CompanyRole) => <span>{record?._count?.employees || 0}</span>
        },
        {
            title: "Created Date",
            dataIndex: "createdAt",
            render: (text: string) => <span>{new Date(text).toLocaleDateString()}</span>
        },
        {
            title: "Status",
            dataIndex: "isActive",
            render: (isActive: boolean) => (
                <span
                    className={`badge d-inline-flex align-items-center badge-xs ${isActive ? 'badge-success' : 'badge-danger'}`}
                >
                    <i className="ti ti-point-filled me-1"></i>
                    {isActive ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            title: "Actions",
            dataIndex: "actions",
            render: (_text: any, record?: CompanyRole) => (
                record && (
                    <div className="action-icon d-inline-flex">
                        <Link to={`${all_routes.permissionpage}?id=${record.id}`} className="me-2 text-primary" title="Edit Permissions">
                            <i className="ti ti-shield" />
                        </Link>
                        <Link
                            to="#"
                            className="me-2 text-info"
                            data-bs-toggle="modal"
                            data-bs-target="#edit_role"
                            onClick={() => setSelectedRole(record)}
                            title="Edit Role Details"
                        >
                            <i className="ti ti-edit" />
                        </Link>
                        <Link
                            to="#"
                            className="text-danger"
                            onClick={() => {
                                if (window.confirm("Are you sure you want to delete this role? Employees assigned to this role will be unassigned.")) {
                                    handleDeleteRole(record.id);
                                }
                            }}
                            title="Delete Role"
                        >
                            <i className="ti ti-trash" />
                        </Link>
                    </div>
                )
            ),
        },
    ];

    return (
        <>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Roles & Permissions</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Administration</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Roles
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
                            <div className="mb-2">
                                <Link
                                    to="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#add_role"
                                    className="btn btn-primary d-flex align-items-center"
                                >
                                    <i className="ti ti-circle-plus me-2" />
                                    Add New Role
                                </Link>
                            </div>
                            <div className="head-icons ms-2">
                                <CollapseHeader />
                            </div>
                        </div>
                    </div>

                    {/* Roles List */}
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                            <h5>Roles List</h5>
                        </div>
                        <div className="card-body p-0">
                            <Table dataSource={roles} columns={columns} Selection={false} loading={loading} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Role Modal */}
            <div className="modal fade" id="add_role" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Add Role</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                id="close-add-role"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleAddRole}>
                            <div className="modal-body pb-0">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Role Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. Finance, Project Manager"
                                                value={newRoleName}
                                                onChange={(e) => setNewRoleName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                placeholder="Describe role permissions/scope"
                                                value={newRoleDesc}
                                                onChange={(e) => setNewRoleDesc(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light me-2"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button type="submit" data-bs-dismiss="modal" className="btn btn-primary" disabled={!newRoleName}>
                                    Add Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit Role Modal */}
            <div className="modal fade" id="edit_role" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Edit Role</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleEditRole}>
                            <div className="modal-body pb-0">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Role Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={selectedRole?.name || ""}
                                                onChange={(e) => selectedRole && setSelectedRole({ ...selectedRole, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={selectedRole?.description || ""}
                                                onChange={(e) => selectedRole && setSelectedRole({ ...selectedRole, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-12">
                                        <div className="mb-3">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="edit-role-active"
                                                    checked={selectedRole?.isActive || false}
                                                    onChange={(e) => selectedRole && setSelectedRole({ ...selectedRole, isActive: e.target.checked })}
                                                />
                                                <label className="form-check-label" htmlFor="edit-role-active">
                                                    Active Status
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light me-2"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button type="submit" data-bs-dismiss="modal" className="btn btn-primary" disabled={!selectedRole?.name}>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RolesPermission;
