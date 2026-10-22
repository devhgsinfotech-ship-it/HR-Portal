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

interface TerminationItem {
    id: number;
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    profilePhotoUrl: string | null;
    departmentId: number | null;
    department: string;
    terminationType: string;
    noticeDate: string | null;
    terminationDate: string | null;
    reason: string;
    status: string;
}

const TERMINATION_TYPES = [
    'Performance Issues',
    'Misconduct',
    'Redundancy / Downsizing',
    'Violation of Company Policy',
    'Contract Non-Renewal',
    'Probation Failure',
    'Other'
];


const Termination = () => {
    const user = useSelector((state: any) => state.auth?.user);
    const isEmployee = user?.role === 'EMPLOYEE';

    const [data, setData] = useState<TerminationItem[]>([]);
    const [metadata, setMetadata] = useState<{ employees: any[]; departments: any[]; designations: any[] }>({
        employees: [],
        departments: [],
        designations: []
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedTermination, setSelectedTermination] = useState<TerminationItem | null>(null);

    // Add Form State
    const [addEmployeeId, setAddEmployeeId] = useState<number | ''>('');
    const [addDeptId, setAddDeptId] = useState<number | ''>('');
    const [addType, setAddType] = useState<string>(TERMINATION_TYPES[0]);
    const [addNoticeDate, setAddNoticeDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [addTerminationDate, setAddTerminationDate] = useState<string>(dayjs().add(15, 'day').format('YYYY-MM-DD'));
    const [addReason, setAddReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Edit Form State
    const [editType, setEditType] = useState<string>('');
    const [editNoticeDate, setEditNoticeDate] = useState<string>('');
    const [editTerminationDate, setEditTerminationDate] = useState<string>('');
    const [editReason, setEditReason] = useState<string>('');
    const [editStatus, setEditStatus] = useState<string>('PENDING');

    const fetchTerminations = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await apiClient.get('/api/lifecycle/terminations');
            setData(res.data || []);
        } catch (error) {
            console.error('Failed to load terminations:', error);
            message.error('Failed to load terminations');
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
        fetchTerminations();
    }, [fetchTerminations]);

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

    const handleAddTermination = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addEmployeeId || !addNoticeDate || !addTerminationDate) {
            message.error('Please select an employee, notice date, and termination date');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiClient.post('/api/lifecycle/terminations', {
                employeeId: addEmployeeId,
                departmentId: addDeptId || undefined,
                terminationType: addType,
                noticeDate: addNoticeDate,
                terminationDate: addTerminationDate,
                reason: addReason || 'Management decision'
            });

            message.success('Termination record created successfully');
            closeModal('new_termination');
            setAddEmployeeId('');
            setAddReason('');
            fetchTerminations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to submit termination');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenEdit = (record: TerminationItem) => {
        setSelectedTermination(record);
        setEditType(record.terminationType || TERMINATION_TYPES[0]);
        setEditNoticeDate(record.noticeDate || '');
        setEditTerminationDate(record.terminationDate || '');
        setEditReason(record.reason || '');
        setEditStatus(record.status || 'PENDING');
    };

    const handleEditTermination = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTermination) return;

        try {
            setIsSubmitting(true);
            await apiClient.put(`/api/lifecycle/terminations/${selectedTermination.id}`, {
                terminationType: editType,
                noticeDate: editNoticeDate,
                terminationDate: editTerminationDate,
                reason: editReason,
                status: editStatus
            });

            message.success('Termination updated successfully');
            closeModal('edit_termination');
            fetchTerminations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update termination');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickStatus = async (record: TerminationItem, status: 'APPROVED' | 'REJECTED') => {
        try {
            await apiClient.put(`/api/lifecycle/terminations/${record.id}`, { status });
            message.success(
                status === 'APPROVED'
                    ? 'Termination approved. Employee account deactivated.'
                    : `Termination marked as ${status}`
            );
            fetchTerminations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDeleteTermination = async () => {
        if (!selectedTermination) return;

        try {
            setIsSubmitting(true);
            await apiClient.delete(`/api/lifecycle/terminations/${selectedTermination.id}`);
            message.success('Termination deleted successfully');
            closeModal('delete_modal');
            fetchTerminations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete termination');
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
            item.terminationType.toLowerCase().includes(q) ||
            item.reason.toLowerCase().includes(q)
        );
    });

    const columns = [
        {
            title: "Employee",
            dataIndex: "employeeName",
            render: (_text: string, record: TerminationItem) => (
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
            sorter: (a: TerminationItem, b: TerminationItem) => a.employeeName.localeCompare(b.employeeName),
        },
        {
            title: "Department",
            dataIndex: "department",
            sorter: (a: TerminationItem, b: TerminationItem) => a.department.localeCompare(b.department),
        },
        {
            title: "Termination Type",
            dataIndex: "terminationType",
            render: (text: string) => <span className="badge badge-soft-dark">{text}</span>,
            sorter: (a: TerminationItem, b: TerminationItem) => a.terminationType.localeCompare(b.terminationType),
        },
        {
            title: "Notice Date",
            dataIndex: "noticeDate",
            render: (text: string | null) => text || '—',
            sorter: (a: TerminationItem, b: TerminationItem) => (a.noticeDate || "").localeCompare(b.noticeDate || ""),
        },
        {
            title: "Termination Date",
            dataIndex: "terminationDate",
            render: (text: string | null) => text || '—',
            sorter: (a: TerminationItem, b: TerminationItem) => (a.terminationDate || "").localeCompare(b.terminationDate || ""),
        },
        {
            title: "Reason",
            dataIndex: "reason",
            render: (text: string) => <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>{text}</span>,
            sorter: (a: TerminationItem, b: TerminationItem) => a.reason.localeCompare(b.reason),
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
            sorter: (a: TerminationItem, b: TerminationItem) => a.status.localeCompare(b.status),
        },
        {
            title: "Actions",
            dataIndex: "actions",
            render: (_: any, record: TerminationItem) => (
                <div className="action-icon d-inline-flex align-items-center">
                    {record.status === "PENDING" && (
                        <>
                            <button
                                type="button"
                                className="btn btn-sm btn-icon btn-soft-success me-1"
                                title="Approve Termination & Deactivate Account"
                                onClick={() => handleQuickStatus(record, "APPROVED")}
                            >
                                <i className="ti ti-check" />
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-icon btn-soft-danger me-1"
                                title="Reject Termination"
                                onClick={() => handleQuickStatus(record, "REJECTED")}
                            >
                                <i className="ti ti-x" />
                            </button>
                        </>
                    )}
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-light me-1"
                        title="Edit Termination"
                        data-bs-toggle="modal"
                        data-bs-target="#edit_termination"
                        onClick={() => handleOpenEdit(record)}
                    >
                        <i className="ti ti-edit" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-light text-danger"
                        title="Delete Termination"
                        data-bs-toggle="modal"
                        data-bs-target="#delete_modal"
                        onClick={() => setSelectedTermination(record)}
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
                            <h2 className="mb-1">Termination</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">HRM</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Termination
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                            <div className="mb-2 me-2">
                                <button
                                    type="button"
                                    className="btn btn-white border d-inline-flex align-items-center"
                                    onClick={fetchTerminations}
                                    title="Refresh"
                                >
                                    <i className="ti ti-refresh me-1" />
                                    Refresh
                                </button>
                            </div>
                            {!isEmployee && (
                                <div className="mb-2">
                                    <button
                                        type="button"
                                        data-bs-toggle="modal"
                                        data-bs-target="#new_termination"
                                        className="btn btn-primary d-flex align-items-center"
                                    >
                                        <i className="ti ti-circle-plus me-2" />
                                        Add Termination
                                    </button>
                                </div>
                            )}
                            <div className="ms-2 head-icons">
                                <CollapseHeader />
                            </div>
                        </div>
                    </div>
                    {/* /Breadcrumb */}

                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                            <h5 className="mb-0">Termination Records ({filteredData.length})</h5>
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
                                    <p className="mt-2 text-muted">Loading terminations...</p>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ti ti-user-cancel fs-36 text-gray-4 d-block mb-2" />
                                    <p className="mb-1 fw-medium">No termination records found</p>
                                    <small>{isEmployee ? 'You have no termination records' : 'Click "Add Termination" to record an employee termination'}</small>
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

            {/* Add Termination Modal */}
            <div className="modal fade" id="new_termination" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Add Termination</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleAddTermination}>
                            <div className="modal-body pb-0">
                                <div className="row">
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">
                                            Terminated Employee <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={addEmployeeId}
                                            onChange={(e) => handleEmployeeSelect(e.target.value)}
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

                                    <div className="col-md-6 mb-3">
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
                                        <label className="form-label">Termination Type <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            value={addType}
                                            onChange={(e) => setAddType(e.target.value)}
                                            required
                                        >
                                            {TERMINATION_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
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
                                            Termination Date <span className="text-danger">*</span>
                                        </label>
                                        <DatePicker
                                            className="form-control"
                                            value={addTerminationDate ? dayjs(addTerminationDate) : null}
                                            onChange={(d) => setAddTerminationDate(d ? d.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Reason / Notes</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            placeholder="Enter reason for termination..."
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
                                    {isSubmitting ? 'Submitting...' : 'Submit Termination'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit Termination Modal */}
            <div className="modal fade" id="edit_termination" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Edit Termination</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleEditTermination}>
                            <div className="modal-body pb-0">
                                {selectedTermination && (
                                    <div className="p-2 mb-3 bg-light rounded">
                                        <h6 className="mb-0 fw-semibold">{selectedTermination.employeeName}</h6>
                                        <small className="text-muted">{selectedTermination.department} &bull; {selectedTermination.employeeCode}</small>
                                    </div>
                                )}
                                <div className="row">
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Termination Type</label>
                                        <select
                                            className="form-select"
                                            value={editType}
                                            onChange={(e) => setEditType(e.target.value)}
                                        >
                                            {TERMINATION_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>

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
                                        <label className="form-label">Termination Date</label>
                                        <DatePicker
                                            className="form-control"
                                            value={editTerminationDate ? dayjs(editTerminationDate) : null}
                                            onChange={(d) => setEditTerminationDate(d ? d.format('YYYY-MM-DD') : '')}
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
                                            <option value="APPROVED">APPROVED (Deactivates Account)</option>
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
                                Are you sure you want to delete this termination record for{" "}
                                <strong>{selectedTermination?.employeeName}</strong>?
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
                                    onClick={handleDeleteTermination}
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

export default Termination;
