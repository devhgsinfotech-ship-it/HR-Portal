import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Table from "../../core/common/dataTable/index";
import { all_routes } from '../../router/all_routes';
import { DatePicker, message, Spin } from "antd";
import dayjs from "dayjs";
import CollapseHeader from '../../core/common/collapse-header/collapse-header';
import apiClient from '@/core/utils/apiClient';
import EmployeeAvatar from '@/core/common/employeeAvatar';

interface ResignationItem {
    id: number;
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    profilePhotoUrl: string | null;
    departmentId: number | null;
    department: string;
    reason: string;
    noticeDate: string | null;
    resignationDate: string | null;
    status: string;
}


const Resignation = () => {
    const user = useSelector((state: any) => state.auth?.user);
    const isEmployee = user?.role === 'EMPLOYEE';

    const [data, setData] = useState<ResignationItem[]>([]);
    const [metadata, setMetadata] = useState<{ employees: any[]; departments: any[]; designations: any[] }>({
        employees: [],
        departments: [],
        designations: []
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedResignation, setSelectedResignation] = useState<ResignationItem | null>(null);

    // Add Form State
    const [addEmployeeId, setAddEmployeeId] = useState<number | ''>('');
    const [addDeptId, setAddDeptId] = useState<number | ''>('');
    const [addNoticeDate, setAddNoticeDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [addResignationDate, setAddResignationDate] = useState<string>(dayjs().add(30, 'day').format('YYYY-MM-DD'));
    const [addReason, setAddReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Edit Form State
    const [editNoticeDate, setEditNoticeDate] = useState<string>('');
    const [editResignationDate, setEditResignationDate] = useState<string>('');
    const [editReason, setEditReason] = useState<string>('');
    const [editStatus, setEditStatus] = useState<string>('PENDING');

    const fetchResignations = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await apiClient.get('/api/lifecycle/resignations');
            setData(res.data || []);
        } catch (error) {
            console.error('Failed to load resignations:', error);
            message.error('Failed to load resignations');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchMetadata = async () => {
        try {
            const res = await apiClient.get('/api/lifecycle/metadata');
            setMetadata(res.data);
        } catch (error) {
            console.error('Failed to load metadata:', error);
        }
    };

    useEffect(() => {
        fetchMetadata();
        fetchResignations();
    }, [fetchResignations]);

    useEffect(() => {
        if (isEmployee && metadata.employees.length > 0) {
            const myEmp = metadata.employees[0];
            setAddEmployeeId(myEmp.id);
            setAddDeptId(myEmp.departmentId || '');
        }
    }, [isEmployee, metadata.employees]);

    const handleEmployeeSelect = (empIdStr: string) => {
        const empId = parseInt(empIdStr, 10);
        setAddEmployeeId(empId || '');
        const emp = metadata.employees.find(e => e.id === empId);
        if (emp) {
            setAddDeptId(emp.departmentId || '');
        } else {
            setAddDeptId('');
        }
    };

    const closeModal = (modalId: string) => {
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
            const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement;
            if (closeBtn) closeBtn.click();
        }
    };

    const handleAddResignation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addEmployeeId || !addNoticeDate || !addResignationDate) {
            message.error('Please select an employee, notice date, and resignation date');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiClient.post('/api/lifecycle/resignations', {
                employeeId: addEmployeeId,
                departmentId: addDeptId || undefined,
                noticeDate: addNoticeDate,
                resignationDate: addResignationDate,
                reason: addReason || 'Personal reasons'
            });

            message.success(isEmployee ? 'Resignation application submitted successfully' : 'Resignation record submitted successfully');
            closeModal('new_resignation');
            if (isEmployee && metadata.employees.length > 0) {
                setAddEmployeeId(metadata.employees[0].id);
                setAddDeptId(metadata.employees[0].departmentId || '');
            } else {
                setAddEmployeeId('');
            }
            setAddReason('');
            fetchResignations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to submit resignation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEdit = (record: ResignationItem) => {
        setSelectedResignation(record);
        setEditNoticeDate(record.noticeDate || '');
        setEditResignationDate(record.resignationDate || '');
        setEditReason(record.reason || '');
        setEditStatus(record.status || 'PENDING');
    };

    const handleEditResignation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedResignation) return;

        try {
            setIsSubmitting(true);
            await apiClient.put(`/api/lifecycle/resignations/${selectedResignation.id}`, {
                noticeDate: editNoticeDate,
                resignationDate: editResignationDate,
                reason: editReason,
                status: editStatus
            });

            message.success('Resignation updated successfully');
            closeModal('edit_resignation');
            fetchResignations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update resignation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickStatus = async (record: ResignationItem, status: 'APPROVED' | 'REJECTED') => {
        try {
            await apiClient.put(`/api/lifecycle/resignations/${record.id}`, { status });
            message.success(`Resignation marked as ${status}`);
            fetchResignations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDeleteResignation = async () => {
        if (!selectedResignation) return;

        try {
            setIsSubmitting(true);
            await apiClient.delete(`/api/lifecycle/resignations/${selectedResignation.id}`);
            message.success('Resignation deleted successfully');
            closeModal('delete_modal');
            fetchResignations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete resignation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredData = data.filter(item => {
        if (!searchText) return true;
        const q = searchText.toLowerCase();
        return (
            item.employeeName.toLowerCase().includes(q) ||
            item.employeeCode.toLowerCase().includes(q) ||
            item.department.toLowerCase().includes(q) ||
            item.reason.toLowerCase().includes(q)
        );
    });

    const columns = [
        {
            title: "Resigning Employee",
            dataIndex: "employeeName",
            render: (_text: string, record: ResignationItem) => (
                <div className="d-flex align-items-center">
                    <EmployeeAvatar
                        url={record.profilePhotoUrl}
                        name={record.employeeName}
                        size={38}
                        className="me-2"
                    />
                    <div>
                        <h6 className="fw-medium mb-0">{record.employeeName}</h6>
                        <span className="fs-12 text-muted">{record.employeeCode}</span>
                    </div>
                </div>
            ),
            sorter: (a: ResignationItem, b: ResignationItem) => a.employeeName.localeCompare(b.employeeName),
        },
        {
            title: "Department",
            dataIndex: "department",
            sorter: (a: ResignationItem, b: ResignationItem) => a.department.localeCompare(b.department),
        },
        {
            title: "Reason",
            dataIndex: "reason",
            render: (text: string) => <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>{text}</span>,
            sorter: (a: ResignationItem, b: ResignationItem) => a.reason.localeCompare(b.reason),
        },
        {
            title: "Notice Date",
            dataIndex: "noticeDate",
            render: (text: string | null) => text || '—',
            sorter: (a: ResignationItem, b: ResignationItem) => (a.noticeDate || "").localeCompare(b.noticeDate || ""),
        },
        {
            title: "Resignation Date",
            dataIndex: "resignationDate",
            render: (text: string | null) => text || '—',
            sorter: (a: ResignationItem, b: ResignationItem) => (a.resignationDate || "").localeCompare(b.resignationDate || ""),
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (status: string) => {
                const s = (status || "").toUpperCase();
                const badgeClass =
                    s === "APPROVED" ? "badge-soft-success" :
                    s === "REJECTED" ? "badge-soft-danger" :
                    "badge-soft-warning";
                return (
                    <span className={`badge ${badgeClass} d-inline-flex align-items-center badge-xs`}>
                        {s}
                    </span>
                );
            },
            sorter: (a: ResignationItem, b: ResignationItem) => a.status.localeCompare(b.status),
        },
        {
            title: "Actions",
            dataIndex: "actions",
            render: (_: any, record: ResignationItem) => (
                <div className="action-icon d-inline-flex align-items-center">
                    {record.status === "PENDING" && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-icon btn-soft-success me-1"
                                title="Approve Resignation"
                                onClick={() => handleQuickStatus(record, "APPROVED")}
                            >
                                <i className="ti ti-check" />
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-icon btn-soft-danger me-1"
                                title="Reject Resignation"
                                onClick={() => handleQuickStatus(record, "REJECTED")}
                            >
                                <i className="ti ti-x" />
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-light me-1"
                        title="Edit Resignation"
                        data-bs-toggle="modal"
                        data-bs-target="#edit_resignation"
                        onClick={() => handleOpenEdit(record)}
                    >
                        <i className="ti ti-edit" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-light text-danger"
                        title="Delete Resignation"
                        data-bs-toggle="modal"
                        data-bs-target="#delete_modal"
                        onClick={() => setSelectedResignation(record)}
                    >
                        <i className="ti ti-trash" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Resignation</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">HRM</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Resignation
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                            <div className="mb-2 me-2">
                                <button
                                    type="button"
                                    className="btn btn-white border d-inline-flex align-items-center"
                                    onClick={fetchResignations}
                                    title="Refresh"
                                >
                                    <i className="ti ti-refresh me-1" />
                                    Refresh
                                </button>
                            </div>
                            <div className="mb-2">
                                <button
                                    type="button"
                                    data-bs-toggle="modal"
                                    data-bs-target="#new_resignation"
                                    className="btn btn-primary d-flex align-items-center"
                                >
                                    <i className="ti ti-circle-plus me-2" />
                                    {isEmployee ? "Apply Resignation" : "Add Resignation"}
                                </button>
                            </div>
                            <div className="ms-2 head-icons">
                                <CollapseHeader />
                            </div>
                        </div>
                    </div>
                    {/* /Breadcrumb */}

                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                            <h5 className="mb-0">Resignation Applications ({filteredData.length})</h5>
                            <div className="position-relative">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Search employee / reason..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    style={{ width: "240px" }}
                                />
                                {searchText && (
                                    <button
                                        type="button"
                                        className="btn-close position-absolute end-0 top-50 translate-middle-y me-2"
                                        style={{ fontSize: "10px" }}
                                        onClick={() => setSearchText("")}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="card-body p-0">
                            {isLoading ? (
                                <div className="text-center py-5">
                                    <Spin size="large" />
                                    <p className="mt-2 text-muted">Loading resignations...</p>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ti ti-user-x fs-36 text-gray-4 d-block mb-2" />
                                    <p className="mb-1 fw-medium">No resignation records found</p>
                                    <small>{isEmployee ? 'You have not submitted any resignation requests' : 'Click "Add Resignation" to record an employee resignation'}</small>
                                </div>
                            ) : (
                                <Table
                                    dataSource={filteredData}
                                    columns={isEmployee ? columns.filter(col => col.dataIndex !== 'actions') : columns}
                                    Selection={false}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="footer d-sm-flex align-items-center justify-content-between bg-white border-top p-3">
                    <p className="mb-0">2014 - 2026 © SmartHR.</p>
                </div>
            </div>

            {/* Add Resignation Modal */}
            <div className="modal fade" id="new_resignation" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">{isEmployee ? "Apply for Resignation" : "Add Resignation"}</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleAddResignation}>
                            <div className="modal-body pb-0">
                                <div className="row">
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">
                                            Resigning Employee <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={addEmployeeId}
                                            onChange={(e) => handleEmployeeSelect(e.target.value)}
                                            disabled={isEmployee}
                                            required
                                        >
                                            <option value="">-- Choose Employee --</option>
                                            {metadata.employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.name} ({emp.employeeCode}) - {emp.departmentName || 'General'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Department</label>
                                        <select
                                            className="form-select"
                                            value={addDeptId}
                                            onChange={(e) => setAddDeptId(parseInt(e.target.value, 10) || '')}
                                        >
                                            <option value="">-- Department --</option>
                                            {metadata.departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            Notice Date <span className="text-danger">*</span>
                                        </label>
                                        <DatePicker
                                            className="form-control"
                                            value={addNoticeDate ? dayjs(addNoticeDate) : null}
                                            onChange={(d) => setAddNoticeDate(d ? d.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            Resignation Date <span className="text-danger">*</span>
                                        </label>
                                        <DatePicker
                                            className="form-control"
                                            value={addResignationDate ? dayjs(addResignationDate) : null}
                                            onChange={(d) => setAddResignationDate(d ? d.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Reason</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            placeholder="Enter reason for resignation..."
                                            value={addReason}
                                            onChange={(e) => setAddReason(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-white border me-2"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Resignation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit Resignation Modal */}
            <div className="modal fade" id="edit_resignation" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Edit Resignation</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleEditResignation}>
                            <div className="modal-body pb-0">
                                {selectedResignation && (
                                    <div className="p-2 mb-3 bg-light rounded">
                                        <h6 className="mb-0 fw-semibold">{selectedResignation.employeeName}</h6>
                                        <small className="text-muted">{selectedResignation.department} &bull; {selectedResignation.employeeCode}</small>
                                    </div>
                                )}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Notice Date</label>
                                        <DatePicker
                                            className="form-control"
                                            value={editNoticeDate ? dayjs(editNoticeDate) : null}
                                            onChange={(d) => setEditNoticeDate(d ? d.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Resignation Date</label>
                                        <DatePicker
                                            className="form-control"
                                            value={editResignationDate ? dayjs(editResignationDate) : null}
                                            onChange={(d) => setEditResignationDate(d ? d.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Approval Status</label>
                                        <select
                                            className="form-select"
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                        >
                                            <option value="PENDING">PENDING</option>
                                            <option value="APPROVED">APPROVED</option>
                                            <option value="REJECTED">REJECTED</option>
                                        </select>
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Reason</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={editReason}
                                            onChange={(e) => setEditReason(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-white border me-2"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <div className="modal fade" id="delete_modal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-body text-center">
                            <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                                <i className="ti ti-trash fs-36" />
                            </span>
                            <h4 className="mb-1">Confirm Delete</h4>
                            <p className="mb-3">
                                Are you sure you want to delete this resignation record for{" "}
                                <strong>{selectedResignation?.employeeName}</strong>?
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
                                    onClick={handleDeleteResignation}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Resignation;
