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

interface PromotionItem {
    id: number;
    employeeId: number;
    employeeName: string;
    employeeCode: string;
    profilePhotoUrl: string | null;
    departmentId: number | null;
    department: string;
    previousDesignationId: number | null;
    designationFrom: string;
    newDesignationId: number;
    designationTo: string;
    promotionDate: string | null;
    previousSalary: number | null;
    newSalary: number | null;
    description: string | null;
}


const Promotion = () => {
    const user = useSelector((state: any) => state.auth?.user);
    const isEmployee = user?.role === 'EMPLOYEE';

    const [data, setData] = useState<PromotionItem[]>([]);
    const [metadata, setMetadata] = useState<{ employees: any[]; departments: any[]; designations: any[] }>({
        employees: [],
        departments: [],
        designations: []
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedPromotion, setSelectedPromotion] = useState<PromotionItem | null>(null);

    // Add Form State
    const [addEmployeeId, setAddEmployeeId] = useState<number | ''>('');
    const [addDeptId, setAddDeptId] = useState<number | ''>('');
    const [addPrevDesigId, setAddPrevDesigId] = useState<number | ''>('');
    const [addNewDesigId, setAddNewDesigId] = useState<number | ''>('');
    const [addDate, setAddDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [addPrevSalary, setAddPrevSalary] = useState<string>('');
    const [addNewSalary, setAddNewSalary] = useState<string>('');
    const [addDescription, setAddDescription] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Edit Form State
    const [editNewDesigId, setEditNewDesigId] = useState<number | ''>('');
    const [editDate, setEditDate] = useState<string>('');
    const [editNewSalary, setEditNewSalary] = useState<string>('');
    const [editDescription, setEditDescription] = useState<string>('');

    const fetchPromotions = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await apiClient.get('/api/lifecycle/promotions');
            setData(res.data || []);
        } catch (error) {
            console.error('Failed to load promotions:', error);
            message.error('Failed to load promotions');
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
        fetchPromotions();
    }, [fetchPromotions]);

    // Handle employee selection in Add Promotion modal
    const handleEmployeeSelect = (empIdStr: string) => {
        const empId = parseInt(empIdStr, 10);
        setAddEmployeeId(empId || '');

        const emp = metadata.employees.find(e => e.id === empId);
        if (emp) {
            setAddDeptId(emp.departmentId || '');
            setAddPrevDesigId(emp.designationId || '');
            setAddPrevSalary(emp.currentSalary ? String(emp.currentSalary) : '');
        } else {
            setAddDeptId('');
            setAddPrevDesigId('');
            setAddPrevSalary('');
        }
    };

    // Close Bootstrap Modal Helper
    const closeModal = (modalId: string) => {
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
            const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement;
            if (closeBtn) closeBtn.click();
        }
    };

    // Submit Add Promotion
    const handleAddPromotion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addEmployeeId || !addNewDesigId || !addDate) {
            message.error('Please select employee, new designation, and promotion date');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiClient.post('/api/lifecycle/promotions', {
                employeeId: addEmployeeId,
                departmentId: addDeptId || undefined,
                previousDesignationId: addPrevDesigId || undefined,
                newDesignationId: addNewDesigId,
                promotionDate: addDate,
                previousSalary: addPrevSalary ? parseFloat(addPrevSalary) : undefined,
                newSalary: addNewSalary ? parseFloat(addNewSalary) : undefined,
                description: addDescription || undefined
            });

            message.success('Promotion added successfully');
            closeModal('new_promotion');
            // Reset
            setAddEmployeeId('');
            setAddNewDesigId('');
            setAddNewSalary('');
            setAddDescription('');
            fetchPromotions();
            fetchMetadata();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create promotion');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (record: PromotionItem) => {
        setSelectedPromotion(record);
        setEditNewDesigId(record.newDesignationId);
        setEditDate(record.promotionDate || dayjs().format('YYYY-MM-DD'));
        setEditNewSalary(record.newSalary ? String(record.newSalary) : '');
        setEditDescription(record.description || '');
    };

    // Submit Edit Promotion
    const handleEditPromotion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPromotion) return;

        try {
            setIsSubmitting(true);
            await apiClient.put(`/api/lifecycle/promotions/${selectedPromotion.id}`, {
                newDesignationId: editNewDesigId || undefined,
                promotionDate: editDate,
                newSalary: editNewSalary ? parseFloat(editNewSalary) : undefined,
                description: editDescription
            });

            message.success('Promotion updated successfully');
            closeModal('edit_promotion');
            fetchPromotions();
            fetchMetadata();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update promotion');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit Delete Promotion
    const handleDeletePromotion = async () => {
        if (!selectedPromotion) return;

        try {
            setIsSubmitting(true);
            await apiClient.delete(`/api/lifecycle/promotions/${selectedPromotion.id}`);
            message.success('Promotion deleted successfully');
            closeModal('delete_modal');
            fetchPromotions();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete promotion');
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
            item.designationTo.toLowerCase().includes(q)
        );
    });

    const columns = [
        {
            title: "Promoted Employee",
            dataIndex: "employeeName",
            render: (_text: string, record: PromotionItem) => (
                <div className="d-flex align-items-center">
                    <EmployeeAvatar
                        url={record.profilePhotoUrl}
                        name={record.employeeName}
                        size={38}
                        className="me-2"
                    />
                    <div>
                        <h6 className="fw-medium mb-0">
                            {record.employeeName}
                        </h6>
                        <span className="fs-12 text-muted">{record.employeeCode}</span>
                    </div>
                </div>
            ),
            sorter: (a: PromotionItem, b: PromotionItem) => a.employeeName.localeCompare(b.employeeName),
        },
        {
            title: "Department",
            dataIndex: "department",
            sorter: (a: PromotionItem, b: PromotionItem) => a.department.localeCompare(b.department),
        },
        {
            title: "Designation From",
            dataIndex: "designationFrom",
            render: (text: string) => <span className="text-muted">{text}</span>,
            sorter: (a: PromotionItem, b: PromotionItem) => a.designationFrom.localeCompare(b.designationFrom),
        },
        {
            title: "Designation To",
            dataIndex: "designationTo",
            render: (text: string) => <span className="badge badge-soft-success fw-medium fs-12">{text}</span>,
            sorter: (a: PromotionItem, b: PromotionItem) => a.designationTo.localeCompare(b.designationTo),
        },
        {
            title: "Promotion Date",
            dataIndex: "promotionDate",
            render: (text: string | null) => text || '—',
            sorter: (a: PromotionItem, b: PromotionItem) => (a.promotionDate || "").localeCompare(b.promotionDate || ""),
        },
        {
            title: "Actions",
            dataIndex: "actions",
            render: (_: any, record: PromotionItem) => (
                <div className="action-icon d-inline-flex">
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-light me-1"
                        title="Edit Promotion"
                        data-bs-toggle="modal"
                        data-bs-target="#edit_promotion"
                        onClick={() => handleOpenEdit(record)}
                    >
                        <i className="ti ti-edit" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-light text-danger"
                        title="Delete Promotion"
                        data-bs-toggle="modal"
                        data-bs-target="#delete_modal"
                        onClick={() => setSelectedPromotion(record)}
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
                            <h2 className="mb-1">Promotion</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">HRM</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Promotion
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                            <div className="mb-2 me-2">
                                <button
                                    type="button"
                                    className="btn btn-white border d-inline-flex align-items-center"
                                    onClick={fetchPromotions}
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
                                        data-bs-target="#new_promotion"
                                        className="btn btn-primary d-flex align-items-center"
                                    >
                                        <i className="ti ti-circle-plus me-2" />
                                        Add Promotion
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
                            <h5 className="mb-0">Promotion Records ({filteredData.length})</h5>
                            <div className="position-relative">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Search employee / role..."
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
                                    <p className="mt-2 text-muted">Loading promotions...</p>
                                </div>
                            ) : filteredData.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="ti ti-award fs-36 text-gray-4 d-block mb-2" />
                                    <p className="mb-1 fw-medium">No promotion records found</p>
                                    <small>{isEmployee ? 'You have no promotion records' : 'Click "Add Promotion" to record an employee promotion'}</small>
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

            {/* Add Promotion Modal */}
            <div className="modal fade" id="new_promotion" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Add Promotion</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleAddPromotion}>
                            <div className="modal-body pb-0">
                                <div className="row">
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">
                                            Promotion For <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={addEmployeeId}
                                            onChange={(e) => handleEmployeeSelect(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Select Employee --</option>
                                            {metadata.employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.name} ({emp.employeeCode}) - {emp.designationName || 'Current Role'}
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
                                            <option value="">-- Select Department --</option>
                                            {metadata.departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Current Role (From)</label>
                                        <select
                                            className="form-select"
                                            value={addPrevDesigId}
                                            disabled
                                        >
                                            <option value="">-- Current Role --</option>
                                            {metadata.designations.map(des => (
                                                <option key={des.id} value={des.id}>{des.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">
                                            Promoted Role (To) <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={addNewDesigId}
                                            onChange={(e) => setAddNewDesigId(parseInt(e.target.value, 10) || '')}
                                            required
                                        >
                                            <option value="">-- Choose New Designation --</option>
                                            {metadata.designations.map(des => (
                                                <option key={des.id} value={des.id}>{des.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            Promotion Date <span className="text-danger">*</span>
                                        </label>
                                        <DatePicker
                                            className="form-control"
                                            value={addDate ? dayjs(addDate) : null}
                                            onChange={(d) => setAddDate(d ? d.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">New Salary / Package (Optional)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="e.g. 75000"
                                            value={addNewSalary}
                                            onChange={(e) => setAddNewSalary(e.target.value)}
                                        />
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Notes / Justification</label>
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            placeholder="Reason for promotion, appraisal feedback, etc."
                                            value={addDescription}
                                            onChange={(e) => setAddDescription(e.target.value)}
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
                                    {isSubmitting ? 'Saving...' : 'Add Promotion'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit Promotion Modal */}
            <div className="modal fade" id="edit_promotion" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Edit Promotion</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleEditPromotion}>
                            <div className="modal-body pb-0">
                                {selectedPromotion && (
                                    <div className="p-2 mb-3 bg-light rounded">
                                        <h6 className="mb-0 fw-semibold">{selectedPromotion.employeeName}</h6>
                                        <small className="text-muted">{selectedPromotion.department} &bull; Prev: {selectedPromotion.designationFrom}</small>
                                    </div>
                                )}
                                <div className="row">
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Promoted Designation (To)</label>
                                        <select
                                            className="form-select"
                                            value={editNewDesigId}
                                            onChange={(e) => setEditNewDesigId(parseInt(e.target.value, 10) || '')}
                                            required
                                        >
                                            {metadata.designations.map(des => (
                                                <option key={des.id} value={des.id}>{des.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Promotion Date</label>
                                        <DatePicker
                                            className="form-control"
                                            value={editDate ? dayjs(editDate) : null}
                                            onChange={(d) => setEditDate(d ? d.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">New Salary</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={editNewSalary}
                                            onChange={(e) => setEditNewSalary(e.target.value)}
                                        />
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Notes</label>
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
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
                                Are you sure you want to delete this promotion record for{" "}
                                <strong>{selectedPromotion?.employeeName}</strong>? This action cannot be undone.
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
                                    onClick={handleDeletePromotion}
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

export default Promotion;
