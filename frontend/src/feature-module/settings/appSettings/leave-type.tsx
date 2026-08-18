import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";

const LeaveType = () => {
    const routes = all_routes;
    const [dbLeaveTypes, setDbLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // Add Leave Type Form State
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeDays, setNewTypeDays] = useState('12');
    const [newTypeIsPaid, setNewTypeIsPaid] = useState(true);

    // Edit Leave Type Form State
    const [editTypeId, setEditTypeId] = useState<number | null>(null);
    const [editTypeName, setEditTypeName] = useState('');
    const [editTypeDays, setEditTypeDays] = useState('');
    const [editTypeIsPaid, setEditTypeIsPaid] = useState(true);

    // Delete State
    const [deleteTypeId, setDeleteTypeId] = useState<number | null>(null);

    const fetchLeaveTypes = async () => {
        try {
            const res = await apiClient.get('/leaves/types');
            setDbLeaveTypes(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching leave types:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const handleAddLeaveType = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/leaves/types', {
                name: newTypeName,
                totalDaysPerYear: parseFloat(newTypeDays),
                isPaid: newTypeIsPaid
            });
            // Reset
            setNewTypeName('');
            setNewTypeDays('12');
            setNewTypeIsPaid(true);
            setErrorMsg('');
            
            // Close modal
            const closeBtn = document.querySelector('#add_leaves .btn-close') as HTMLButtonElement;
            if (closeBtn) closeBtn.click();
            
            fetchLeaveTypes();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Error adding leave type');
        }
    };

    const handleEditLeaveType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTypeId) return;
        try {
            await apiClient.put(`/leaves/types/${editTypeId}`, {
                name: editTypeName,
                totalDaysPerYear: parseFloat(editTypeDays),
                isPaid: editTypeIsPaid
            });
            setErrorMsg('');
            
            // Close modal
            const closeBtn = document.querySelector('#edit_leaves .btn-close') as HTMLButtonElement;
            if (closeBtn) closeBtn.click();
            
            fetchLeaveTypes();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Error updating leave type');
        }
    };

    const handleDeleteLeaveType = async () => {
        if (!deleteTypeId) return;
        try {
            await apiClient.delete(`/leaves/types/${deleteTypeId}`);
            
            // Close modal
            const closeBtn = document.querySelector('#delete_modal .btn-light') as HTMLButtonElement;
            if (closeBtn) closeBtn.click();
            
            fetchLeaveTypes();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error deleting leave type');
        }
    };

    return (
        <div>
            <>
                {/* Page Wrapper */}
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
                                        <li className="breadcrumb-item">App Settings</li>
                                        <li className="breadcrumb-item active" aria-current="page">
                                            Leave Settings
                                        </li>
                                    </ol>
                                </nav>
                            </div>
                            <div className="head-icons ms-2">
                                <CollapseHeader />
                            </div>
                        </div>
                        {/* /Breadcrumb */}
                        <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3">
                            <li className="nav-item">
                                <Link className="nav-link " to={routes.profilesettings}>
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
                                <Link className="nav-link active" to={routes.salarySettings}>
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
                                <Link className="nav-link" to={routes.customCss}>
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
                                                to={routes.salarySettings}
                                                className="d-inline-flex align-items-center rounded  py-2 px-3"
                                            >
                                                Salary Settings
                                            </Link>
                                            <Link
                                                to={routes.approvalSettings}
                                                className="d-inline-flex align-items-center rounded py-2 px-3"
                                            >

                                                Approval Settings
                                            </Link>
                                            <Link
                                                to={routes.approvalSettings}
                                                className="d-inline-flex align-items-center rounded py-2 px-3"
                                            >
                                                Invoice Settings
                                            </Link>
                                            <Link
                                                to={routes.leaveType}
                                                className="d-inline-flex align-items-center rounded active py-2 px-3"
                                            >
                                                <i className="ti ti-arrow-badge-right me-2" />
                                                Leave Type
                                            </Link>
                                            <Link
                                                to={routes.customFields}
                                                className="d-inline-flex align-items-center rounded py-2 px-3"
                                            >
                                                Custom Fields
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-9">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="border-bottom d-flex align-items-center justify-content-between pb-3 mb-3">
                                            <h4>Leave Type</h4>
                                            <div>
                                                <Link
                                                    to="#"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#add_leaves"
                                                    className="btn btn-primary d-flex align-items-center"
                                                >
                                                    <i className="ti ti-circle-plus me-2" />
                                                    Add Leave Type
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="card-body p-0">
                                            <div className="card mb-0">
                                                <div className="card-header d-flex align-items-center justify-content-between">
                                                    <h6>Leave Type List</h6>
                                                </div>
                                                <div className="table-responsive">
                                                    <table className="table">
                                                        <thead className="thead-light">
                                                            <tr>
                                                                <th>Leave Type</th>
                                                                <th>Leave Days</th>
                                                                <th>Status</th>
                                                                <th />
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {loading ? (
                                                                <tr>
                                                                    <td colSpan={4} className="text-center py-4">
                                                                        <div className="spinner-border spinner-border-sm text-primary" role="status" />
                                                                    </td>
                                                                </tr>
                                                            ) : dbLeaveTypes.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={4} className="text-center py-4 text-muted">
                                                                        No custom leave types created yet. Click Add Leave Type to create one.
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                dbLeaveTypes.map((type) => (
                                                                    <tr key={type.id}>
                                                                        <td className="text-dark fw-medium">{type.name}</td>
                                                                        <td>{Number(type.totalDaysPerYear)} days</td>
                                                                        <td>
                                                                            <span className={`badge ${type.isPaid ? 'badge-success' : 'badge-danger'}`}>
                                                                                <i className="ti ti-point-filled" />
                                                                                {type.isPaid ? 'Paid' : 'Unpaid'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <div className="action-icon d-inline-flex">
                                                                                <Link
                                                                                    to="#"
                                                                                    className="me-2"
                                                                                    data-bs-toggle="modal"
                                                                                    data-bs-target="#edit_leaves"
                                                                                    onClick={() => {
                                                                                        setEditTypeId(type.id);
                                                                                        setEditTypeName(type.name);
                                                                                        setEditTypeDays(String(type.totalDaysPerYear));
                                                                                        setEditTypeIsPaid(type.isPaid);
                                                                                    }}
                                                                                >
                                                                                    <i className="ti ti-edit" />
                                                                                </Link>
                                                                                <Link
                                                                                    to="#"
                                                                                    data-bs-toggle="modal"
                                                                                    data-bs-target="#delete_modal"
                                                                                    onClick={() => setDeleteTypeId(type.id)}
                                                                                >
                                                                                    <i className="ti ti-trash" />
                                                                                </Link>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
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
                        <p>
                            Designed &amp; Developed By{" "}
                            <Link to="#" className="text-primary">
                                Dreams
                            </Link>
                        </p>
                    </div>
                </div>
                {/* /Page Wrapper */}
            </>

            <>
                {/* Add Leaves */}
                <div className="modal fade" id="add_leaves">
                    <div className="modal-dialog modal-dialog-centered modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">Add Leave Type</h4>
                                <button
                                    type="button"
                                    className="btn-close custom-btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                >
                                    <i className="ti ti-x" />
                                </button>
                            </div>
                            <form onSubmit={handleAddLeaveType}>
                                <div className="modal-body pb-0">
                                    {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Leave Type <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    required
                                                    placeholder="e.g. Casual Leave"
                                                    value={newTypeName}
                                                    onChange={(e) => setNewTypeName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Number of days <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    required
                                                    value={newTypeDays}
                                                    onChange={(e) => setNewTypeDays(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label">Type</label>
                                                <div className="d-flex gap-3">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="newTypeIsPaid"
                                                            id="newPaid"
                                                            checked={newTypeIsPaid}
                                                            onChange={() => setNewTypeIsPaid(true)}
                                                        />
                                                        <label className="form-check-label" htmlFor="newPaid">
                                                            Paid Leave
                                                        </label>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="newTypeIsPaid"
                                                            id="newUnpaid"
                                                            checked={!newTypeIsPaid}
                                                            onChange={() => setNewTypeIsPaid(false)}
                                                        />
                                                        <label className="form-check-label" htmlFor="newUnpaid">
                                                            Unpaid Leave
                                                        </label>
                                                    </div>
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
                                    <button type="submit" className="btn btn-primary">
                                        Add Leave
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                {/* /Add Leaves */}
                {/* Edit Leaves */}
                <div className="modal fade" id="edit_leaves">
                    <div className="modal-dialog modal-dialog-centered modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h4 className="modal-title">Edit Leave Type</h4>
                                <button
                                    type="button"
                                    className="btn-close custom-btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                >
                                    <i className="ti ti-x" />
                                </button>
                            </div>
                            <form onSubmit={handleEditLeaveType}>
                                <div className="modal-body pb-0">
                                    {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Leave Type <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    required
                                                    value={editTypeName}
                                                    onChange={(e) => setEditTypeName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Number of days <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    required
                                                    value={editTypeDays}
                                                    onChange={(e) => setEditTypeDays(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <label className="form-label">Type</label>
                                                <div className="d-flex gap-3">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="editTypeIsPaid"
                                                            id="editPaid"
                                                            checked={editTypeIsPaid}
                                                            onChange={() => setEditTypeIsPaid(true)}
                                                        />
                                                        <label className="form-check-label" htmlFor="editPaid">
                                                            Paid Leave
                                                        </label>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="editTypeIsPaid"
                                                            id="editUnpaid"
                                                            checked={!editTypeIsPaid}
                                                            onChange={() => setEditTypeIsPaid(false)}
                                                        />
                                                        <label className="form-check-label" htmlFor="editUnpaid">
                                                            Unpaid Leave
                                                        </label>
                                                    </div>
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
                                    <button type="submit" className="btn btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                {/* /Edit Leaves */}
                {/* Delete Modal */}
                <div className="modal fade" id="delete_modal">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-body text-center p-4">
                                <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                                    <i className="ti ti-trash-x fs-36" />
                                </span>
                                <h4 className="mb-1">Confirm Delete</h4>
                                <p className="mb-3">
                                    Are you sure you want to delete this leave type? This action cannot be undone.
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
                                        data-bs-dismiss="modal"
                                        onClick={handleDeleteLeaveType}
                                    >
                                        Yes, Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* /Delete Modal */}
            </>
        </div>
    );
};

export default LeaveType;
