import React, { useState, useEffect } from 'react';
import { DatePicker, message } from "antd";
import dayjs from "dayjs";
import apiClient from '@/core/utils/apiClient';
import EmployeeAvatar from '@/core/common/employeeAvatar';

interface Metadata {
    employees: Array<{
        id: number;
        name: string;
        employeeCode: string;
        profilePhotoUrl: string | null;
        dateOfJoining: string | null;
        departmentId: number | null;
        departmentName: string;
        designationId: number | null;
        designationName: string;
        managerName: string;
        probationStatus: string | null;
        probationEndDate: string | null;
        probationDurationMonths: number;
    }>;
    departments: Array<{ id: number; name: string }>;
    designations: Array<{ id: number; name: string }>;
}

interface ProbationManagementModalProps {
    selectedRecord: any | null;
    metadata: Metadata;
    onSuccess: () => void;
}


const ProbationManagementModal: React.FC<ProbationManagementModalProps> = ({
    selectedRecord,
    metadata,
    onSuccess
}) => {
    // Add form state
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
    const [joiningDate, setJoiningDate] = useState<string>('');
    const [probationEndDate, setProbationEndDate] = useState<string>('');
    const [probationMonths, setProbationMonths] = useState<number>(3);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit form state
    const [editStatus, setEditStatus] = useState<string>('ON_PROBATION');
    const [editExtensionMonths, setEditExtensionMonths] = useState<number>(3);
    const [editEndDate, setEditEndDate] = useState<string>('');

    // Prepopulate Edit form when selectedRecord changes
    useEffect(() => {
        if (selectedRecord) {
            setEditStatus(selectedRecord.probationStatus || 'ON_PROBATION');
            setEditEndDate(selectedRecord.probationEndDate || '');
            setEditExtensionMonths(3);
        }
    }, [selectedRecord]);

    // Handle employee change in Add modal
    const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const empId = parseInt(e.target.value, 10);
        setSelectedEmployeeId(empId || '');

        if (!empId) {
            setJoiningDate('');
            setProbationEndDate('');
            return;
        }

        const emp = metadata.employees.find(item => item.id === empId);
        if (emp) {
            const joinDate = emp.dateOfJoining ? dayjs(emp.dateOfJoining).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
            setJoiningDate(joinDate);
            const months = emp.probationDurationMonths || probationMonths || 3;
            setProbationMonths(months);
            const calculatedEnd = dayjs(joinDate).add(months, 'month').format('YYYY-MM-DD');
            setProbationEndDate(calculatedEnd);
        }
    };

    const handleDurationChange = (months: number) => {
        setProbationMonths(months);
        const base = joiningDate || dayjs().format('YYYY-MM-DD');
        setProbationEndDate(dayjs(base).add(months, 'month').format('YYYY-MM-DD'));
    };

    const handleJoiningDateChange = (date: dayjs.Dayjs | null) => {
        const dStr = date ? date.format('YYYY-MM-DD') : '';
        setJoiningDate(dStr);
        if (dStr) {
            setProbationEndDate(dayjs(dStr).add(probationMonths, 'month').format('YYYY-MM-DD'));
        }
    };

    // Close modal helper
    const closeModal = (modalId: string) => {
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
            const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement;
            if (closeBtn) closeBtn.click();
        }
    };

    // Handle Add / Set Probation Submit
    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeId) {
            message.error('Please select an employee');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiClient.put(`/api/lifecycle/probations/${selectedEmployeeId}/status`, {
                status: 'ON_PROBATION',
                joiningDate: joiningDate || undefined,
                probationDurationMonths: probationMonths,
                probationEndDate: probationEndDate || undefined
            });
            message.success('Employee probation successfully assigned');
            closeModal('add_modal');
            setSelectedEmployeeId('');
            setJoiningDate('');
            setProbationEndDate('');
            onSuccess();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to add probation');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Edit Submit
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecord) return;

        try {
            setIsSubmitting(true);
            await apiClient.put(`/api/lifecycle/probations/${selectedRecord.id}/status`, {
                status: editStatus,
                extensionMonths: editStatus === 'EXTENDED' ? editExtensionMonths : undefined,
                probationEndDate: editEndDate || undefined
            });
            message.success('Probation updated successfully');
            closeModal('edit_modal');
            onSuccess();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update probation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedEmployeeMeta = metadata.employees.find(e => e.id === Number(selectedEmployeeId));

    return (
        <>
            {/* Add / Set Probation Modal */}
            <div className="modal fade" id="add_modal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Set Employee Probation</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="modal-body pb-0">
                                <div className="row">
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">
                                            Select Employee <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedEmployeeId}
                                            onChange={handleEmployeeChange}
                                            required
                                        >
                                            <option value="">-- Choose Employee --</option>
                                            {metadata.employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.name} ({emp.employeeCode}) - {emp.designationName || 'Employee'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedEmployeeMeta && (
                                        <div className="col-md-12 mb-3">
                                            <div className="p-2 bg-light rounded d-flex justify-content-between align-items-center">
                                                <div>
                                                    <span className="text-muted d-block fs-12">Department:</span>
                                                    <span className="fw-medium">{selectedEmployeeMeta.departmentName || 'General'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted d-block fs-12">Designation:</span>
                                                    <span className="fw-medium">{selectedEmployeeMeta.designationName || 'Employee'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted d-block fs-12">Reviewer:</span>
                                                    <span className="fw-medium">{selectedEmployeeMeta.managerName || 'HR Admin'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Joining Date</label>
                                        <DatePicker
                                            className="form-control"
                                            value={joiningDate ? dayjs(joiningDate) : null}
                                            onChange={handleJoiningDateChange}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Probation Duration</label>
                                        <select
                                            className="form-select"
                                            value={probationMonths}
                                            onChange={(e) => handleDurationChange(parseInt(e.target.value, 10))}
                                        >
                                            <option value={1}>1 Month</option>
                                            <option value={2}>2 Months</option>
                                            <option value={3}>3 Months</option>
                                            <option value={6}>6 Months</option>
                                            <option value={12}>1 Year</option>
                                        </select>
                                    </div>

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">
                                            Probation End Date <span className="text-danger">*</span>
                                        </label>
                                        <DatePicker
                                            className="form-control"
                                            value={probationEndDate ? dayjs(probationEndDate) : null}
                                            onChange={(date) => setProbationEndDate(date ? date.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
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
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Set Probation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit / Extend Probation Modal */}
            <div className="modal fade" id="edit_modal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Update Probation Status</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body pb-0">
                                {selectedRecord && (
                                    <div className="p-2 mb-3 bg-light rounded d-flex align-items-center">
                                        <EmployeeAvatar
                                            url={selectedRecord.profilePhotoUrl}
                                            name={selectedRecord.name}
                                            size={42}
                                            className="me-2"
                                        />
                                        <div>
                                            <h6 className="mb-0 fw-semibold">{selectedRecord.name}</h6>
                                            <span className="text-muted fs-12">{selectedRecord.designation} &bull; {selectedRecord.employeeCode}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="row">
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">
                                            Probation Status <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                            required
                                        >
                                            <option value="ON_PROBATION">On Probation</option>
                                            <option value="CONFIRMED">Confirmed / Completed</option>
                                            <option value="EXTENDED">Extend Probation</option>
                                            <option value="FAILED">Failed / Discontinue</option>
                                        </select>
                                    </div>

                                    {editStatus === 'EXTENDED' && (
                                        <div className="col-md-12 mb-3">
                                            <label className="form-label">Extension Duration</label>
                                            <select
                                                className="form-select"
                                                value={editExtensionMonths}
                                                onChange={(e) => setEditExtensionMonths(parseInt(e.target.value, 10))}
                                            >
                                                <option value={1}>Extend by 1 Month</option>
                                                <option value={2}>Extend by 2 Months</option>
                                                <option value={3}>Extend by 3 Months</option>
                                                <option value={6}>Extend by 6 Months</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">Probation End Date</label>
                                        <DatePicker
                                            className="form-control"
                                            value={editEndDate ? dayjs(editEndDate) : null}
                                            onChange={(date) => setEditEndDate(date ? date.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
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
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Details Offcanvas */}
            <div
                className="offcanvas offcanvas-end offcanvas-medium"
                tabIndex={-1}
                id="probation_details"
            >
                <div className="offcanvas-header border-bottom">
                    <h4 className="d-flex align-items-center mb-0">Probation Details</h4>
                    <button
                        type="button"
                        className="btn-close custom-btn-close"
                        data-bs-dismiss="offcanvas"
                        aria-label="Close"
                    >
                        <i className="ti ti-x" />
                    </button>
                </div>
                <div className="offcanvas-body">
                    {selectedRecord ? (
                        <>
                            <div className="card bg-light">
                                <div className="card-body">
                                    <div className="d-flex align-items-center">
                                        <EmployeeAvatar
                                            url={selectedRecord.profilePhotoUrl}
                                            name={selectedRecord.name}
                                            size={64}
                                            className="me-3"
                                        />
                                        <div>
                                            <h5 className="mb-1 text-dark fw-semibold">
                                                {selectedRecord.name}
                                            </h5>
                                            <span className="badge badge-soft-dark text-dark d-inline-flex align-items-center badge-xs">
                                                <i className="ti ti-point-filled me-1" />
                                                {selectedRecord.designation}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4 pb-4 border-bottom">
                                <div className="fs-14 fw-semibold text-dark mb-3">
                                    Basic Information
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="text-muted">
                                        <i className="ti ti-id me-1" />
                                        Employee ID
                                    </span>
                                    <p className="fs-13 text-dark fw-medium mb-0">{selectedRecord.employeeCode}</p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="text-muted">
                                        <i className="ti ti-building me-1" />
                                        Department
                                    </span>
                                    <p className="fs-13 text-dark fw-medium mb-0">{selectedRecord.department}</p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="text-muted">
                                        <i className="ti ti-calendar-check me-1" />
                                        Date of Join
                                    </span>
                                    <p className="fs-13 text-dark fw-medium mb-0">{selectedRecord.joiningDate || 'N/A'}</p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-0">
                                    <span className="text-muted">
                                        <i className="ti ti-user-check me-1" />
                                        Reviewer
                                    </span>
                                    <p className="fs-13 text-dark fw-medium mb-0">{selectedRecord.reviewer}</p>
                                </div>
                            </div>
                            <div>
                                <div className="fs-14 fw-semibold text-dark mb-3">Probation Timeline</div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="text-muted">
                                        <i className="ti ti-calendar me-1" />
                                        Probation End Date
                                    </span>
                                    <p className="fs-13 text-dark fw-medium mb-0">{selectedRecord.probationEndDate || 'Not set'}</p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="text-muted">
                                        <i className="ti ti-calendar-stats me-1" />
                                        Probation Duration
                                    </span>
                                    <p className="fs-13 text-dark fw-medium mb-0">{selectedRecord.probationDurationMonths} months</p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="text-muted">
                                        <i className="ti ti-clock me-1" />
                                        Days Remaining
                                    </span>
                                    <p className="fs-13 fw-semibold mb-0 text-primary">
                                        {selectedRecord.daysRemaining !== null
                                            ? (selectedRecord.daysRemaining >= 0 ? `${selectedRecord.daysRemaining} days left` : `Ended ${Math.abs(selectedRecord.daysRemaining)} days ago`)
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-0">
                                    <span className="text-muted">
                                        <i className="ti ti-user-edit me-1" />
                                        Current Status
                                    </span>
                                    <span className={`badge ${
                                        selectedRecord.probationStatus === 'CONFIRMED' ? 'badge-soft-success' :
                                        selectedRecord.probationStatus === 'EXTENDED' ? 'badge-soft-purple' :
                                        selectedRecord.probationStatus === 'FAILED' ? 'badge-soft-danger' :
                                        'badge-soft-info'
                                    }`}>
                                        {selectedRecord.probationStatus}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="ti ti-user-search fs-36 d-block mb-2 text-gray-4" />
                            No employee selected
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProbationManagementModal;