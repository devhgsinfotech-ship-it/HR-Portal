import React, { useState } from 'react';
import { DatePicker, message } from 'antd';
import dayjs from 'dayjs';
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
    }>;
    departments: Array<{ id: number; name: string }>;
    designations: Array<{ id: number; name: string }>;
}

interface NoticePeriodTrackerModalProps {
    selectedRecord: any | null;
    metadata: Metadata;
    onSuccess: () => void;
}


const NoticePeriodTrackerModal: React.FC<NoticePeriodTrackerModalProps> = ({
    selectedRecord,
    metadata,
    onSuccess
}) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
    const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [noticeDays, setNoticeDays] = useState<number>(30);
    const [endDate, setEndDate] = useState<string>(dayjs().add(30, 'day').format('YYYY-MM-DD'));
    const [exitType, setExitType] = useState<string>('RESIGNATION');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const empId = parseInt(e.target.value, 10);
        setSelectedEmployeeId(empId || '');
    };

    const handleStartDateChange = (date: dayjs.Dayjs | null) => {
        const dStr = date ? date.format('YYYY-MM-DD') : '';
        setStartDate(dStr);
        if (dStr) {
            setEndDate(dayjs(dStr).add(noticeDays, 'day').format('YYYY-MM-DD'));
        }
    };

    const handleDaysChange = (days: number) => {
        setNoticeDays(days);
        if (startDate) {
            setEndDate(dayjs(startDate).add(days, 'day').format('YYYY-MM-DD'));
        }
    };

    const closeModal = (modalId: string) => {
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
            const closeBtn = modalEl.querySelector('[data-bs-dismiss="modal"]') as HTMLButtonElement;
            if (closeBtn) closeBtn.click();
        }
    };

    const handleStartNoticeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeId || !startDate) {
            message.error('Please select an employee and notice start date');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiClient.post('/api/lifecycle/notice-periods/start', {
                employeeId: selectedEmployeeId,
                noticeStartDate: startDate,
                noticeEndDate: endDate,
                noticePeriodDays: noticeDays,
                exitType
            });
            message.success('Notice period started successfully');
            closeModal('add_notice_modal');
            setSelectedEmployeeId('');
            onSuccess();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to start notice period');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedEmployeeMeta = metadata.employees.find(e => e.id === Number(selectedEmployeeId));

    // Calculate percentage for selected record in details offcanvas
    const progressPercent = selectedRecord && selectedRecord.totalDays > 0
        ? Math.min(100, Math.round((selectedRecord.completedDays / selectedRecord.totalDays) * 100))
        : 0;

    return (
        <>
            {/* Add / Initiate Notice Period Modal */}
            <div className="modal fade" id="add_notice_modal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Start Notice Period</h4>
                            <button
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <form onSubmit={handleStartNoticeSubmit}>
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
                                                    <span className="text-muted d-block fs-12">Date Joined:</span>
                                                    <span className="fw-medium">{selectedEmployeeMeta.dateOfJoining ? dayjs(selectedEmployeeMeta.dateOfJoining).format('DD-MM-YYYY') : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Notice Start Date <span className="text-danger">*</span></label>
                                        <DatePicker
                                            className="form-control"
                                            value={startDate ? dayjs(startDate) : null}
                                            onChange={handleStartDateChange}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Notice Duration (Days)</label>
                                        <select
                                            className="form-select"
                                            value={noticeDays}
                                            onChange={(e) => handleDaysChange(parseInt(e.target.value, 10))}
                                        >
                                            <option value={15}>15 Days</option>
                                            <option value={30}>30 Days (1 Month)</option>
                                            <option value={60}>60 Days (2 Months)</option>
                                            <option value={90}>90 Days (3 Months)</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Calculated Last Working Day</label>
                                        <DatePicker
                                            className="form-control"
                                            value={endDate ? dayjs(endDate) : null}
                                            onChange={(date) => setEndDate(date ? date.format('YYYY-MM-DD') : '')}
                                            format="DD-MM-YYYY"
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Exit Category</label>
                                        <select
                                            className="form-select"
                                            value={exitType}
                                            onChange={(e) => setExitType(e.target.value)}
                                        >
                                            <option value="RESIGNATION">Resignation</option>
                                            <option value="TERMINATION">Termination</option>
                                            <option value="RETIREMENT">Retirement</option>
                                            <option value="CONTRACT_END">End of Contract</option>
                                        </select>
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
                                    {isSubmitting ? 'Starting...' : 'Initiate Notice Period'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Notice Period Details Offcanvas */}
            <div
                className="offcanvas offcanvas-end offcanvas-medium"
                tabIndex={-1}
                id="notice_details"
            >
                <div className="offcanvas-header border-bottom">
                    <h4 className="d-flex align-items-center mb-0">Notice Period Tracker Details</h4>
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

                            {/* Progress bar */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                    <span className="fs-13 text-muted">Notice Progress:</span>
                                    <span className="fs-13 fw-semibold text-dark">
                                        {selectedRecord.completedDays} of {selectedRecord.totalDays} Days ({progressPercent}%)
                                    </span>
                                </div>
                                <div className="progress progress-sm">
                                    <div
                                        className={`progress-bar ${
                                            progressPercent >= 100 ? 'bg-success' : progressPercent >= 75 ? 'bg-warning' : 'bg-primary'
                                        }`}
                                        role="progressbar"
                                        style={{ width: `${progressPercent}%` }}
                                        aria-valuenow={progressPercent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    />
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
                                <div className="d-flex align-items-center justify-content-between mb-0">
                                    <span className="text-muted">
                                        <i className="ti ti-logout me-1" />
                                        Exit Category
                                    </span>
                                    <p className="fs-13 text-dark fw-medium mb-0">{selectedRecord.exitType}</p>
                                </div>
                            </div>

                            <div>
                                <div className="fs-14 fw-semibold text-dark mb-3">Notice Schedule</div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="text-muted">
                                        <i className="ti ti-calendar-event me-1" />
                                        Notice Start Date
                                    </span>
                                    <p className="fs-13 text-dark fw-medium mb-0">{selectedRecord.startDate || 'N/A'}</p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="text-muted">
                                        <i className="ti ti-calendar-due me-1" />
                                        Notice End Date
                                    </span>
                                    <p className="fs-13 text-dark fw-medium mb-0">{selectedRecord.endDate || 'N/A'}</p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <span className="text-muted">
                                        <i className="ti ti-hourglass me-1" />
                                        Days Remaining
                                    </span>
                                    <p className="fs-13 fw-semibold mb-0 text-danger">
                                        {selectedRecord.remainingDays} days
                                    </p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-0">
                                    <span className="text-muted">
                                        <i className="ti ti-flag me-1" />
                                        Status
                                    </span>
                                    <span className={`badge ${
                                        selectedRecord.status === 'Completed' ? 'badge-soft-success' :
                                        selectedRecord.status === 'Closing Soon' ? 'badge-soft-danger' :
                                        selectedRecord.status === 'Waived' ? 'badge-soft-info' :
                                        'badge-soft-warning'
                                    }`}>
                                        {selectedRecord.status}
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

export default NoticePeriodTrackerModal;