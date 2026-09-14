import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { all_routes } from '../../../../router/all_routes';
import Table from "../../../../core/common/dataTable/index";
import CommonSelect from '../../../../core/common/commonSelect';
import PredefinedDateRanges from '../../../../core/common/datePicker';
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import apiClient from '../../../../core/utils/apiClient';
import { leaveemployee_details } from '../../../../core/data/json/leaveemployee_details';
import CollapseHeader from '../../../../core/common/collapse-header/collapse-header';

// Add type for leave employee data
interface LeaveEmployeeData {
  LeaveType: string;
  From: string;
  ApprovedBy: string;
  Image: string;
  Roll: string;
  To: string;
  NoOfDays: string;
  Status: string;
  actions?: string;
}

const LeaveEmployee = () => {
  const [dbTypes, setDbTypes] = useState<any[]>([]);
  const [dbBalances, setDbBalances] = useState<any[]>([]);
  const [dbRequests, setDbRequests] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newLeave, setNewLeave] = useState<any>({ leaveTypeId: '', startDate: null, endDate: null, reason: '', leaveSession: 'FULL_DAY' });
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [editLeave, setEditLeave] = useState<any>({ leaveTypeId: '', startDate: null, endDate: null, reason: '', leaveSession: 'FULL_DAY' });
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const fetchLeaveData = async () => {
    try {
      const [typesRes, balRes, reqRes] = await Promise.all([
        apiClient.get('/leaves/types'),
        apiClient.get('/leaves/balances'),
        apiClient.get('/leaves/requests?mine=true')
      ]);
      setDbTypes(typesRes.data);
      setDbBalances(balRes.data);
      const mapped = reqRes.data.map((r: any) => ({
        key: r.id,
        id: r.id,
        leaveTypeId: r.leaveTypeId,
        rawStartDate: r.startDate,
        rawEndDate: r.endDate,
        rawReason: r.reason || '',
        rawStatus: r.status,
        rawLeaveSession: r.leaveSession || 'FULL_DAY',
        LeaveType: r.leaveType?.name || 'Leave',
        From: new Date(r.startDate).toLocaleDateString(),
        To: new Date(r.endDate).toLocaleDateString(),
        NoOfDays: `${r.totalDays} Days`,
        Status: r.status === 'APPROVED' ? 'Approved' : r.status === 'REJECTED' ? 'Declined' : 'New',
        ApprovedBy: r.reviewedById ? 'Manager/HR' : 'Pending Review',
        Image: 'user-01.jpg',
        Roll: 'HR Admin'
      }));
      setDbRequests(mapped);
      setIsLoaded(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleApplyLeave = async (e: any) => {
    e.preventDefault();
    if (!newLeave.leaveTypeId || !newLeave.startDate || !newLeave.endDate) {
      setErrorMsg('Please select leave type, start date, and end date.');
      return;
    }
    try {
      await apiClient.post('/leaves/apply', {
        leaveTypeId: newLeave.leaveTypeId,
        startDate: newLeave.startDate.format('YYYY-MM-DD'),
        endDate: newLeave.endDate.format('YYYY-MM-DD'),
        reason: newLeave.reason,
        leaveSession: newLeave.leaveSession
      });
      const closeBtn = document.querySelector('#add_employee_leaves .btn-close') as HTMLButtonElement;
      if (closeBtn) closeBtn.click();
      fetchLeaveData();
      setNewLeave({ leaveTypeId: '', startDate: null, endDate: null, reason: '', leaveSession: 'FULL_DAY' });
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error applying for leave');
    }
  };

  const handleUpdateLeave = async (e: any) => {
    e.preventDefault();
    if (!selectedLeave || !editLeave.leaveTypeId || !editLeave.startDate || !editLeave.endDate) {
      setEditErrorMsg('Please fill all required fields.');
      return;
    }
    try {
      await apiClient.put(`/leaves/requests/${selectedLeave.id}`, {
        leaveTypeId: editLeave.leaveTypeId,
        startDate: editLeave.startDate.format('YYYY-MM-DD'),
        endDate: editLeave.endDate.format('YYYY-MM-DD'),
        reason: editLeave.reason,
        leaveSession: editLeave.leaveSession
      });
      const closeBtn = document.querySelector('#edit_employee_leaves .btn-close') as HTMLButtonElement;
      if (closeBtn) closeBtn.click();
      fetchLeaveData();
      setEditErrorMsg('');
    } catch (err: any) {
      setEditErrorMsg(err.response?.data?.message || 'Error updating leave request');
    }
  };

  const data: LeaveEmployeeData[] = isLoaded ? dbRequests : [];

  const leaveTypeOptions = dbTypes.length > 0
    ? dbTypes.map((t: any) => ({ value: String(t.id), label: t.name }))
    : [
        { value: "1", label: "Casual Leave" },
        { value: "2", label: "Sick Leave" },
        { value: "3", label: "Earned Leave" },
        { value: "4", label: "Unpaid Leave" }
      ];
  const columns = [
    {
      title: "Leave Type",
      dataIndex: "LeaveType",
      render: (_text: string, record: LeaveEmployeeData) => (
        <div className="d-flex align-items-center">
          <p className="fs-14 fw-medium d-flex align-items-center mb-0">
            {record.LeaveType}
          </p>
          <button
            type="button"
            className="ms-2 btn btn-link p-0 text-info"
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title="I am currently experiencing a fever and feeling unwell."
            aria-label="Leave type info"
          >
            <i className="ti ti-info-circle" />
          </button>
        </div>
      ),
      sorter: (a: LeaveEmployeeData, b: LeaveEmployeeData) => a.LeaveType.length - b.LeaveType.length,
    },
    {
      title: "From",
      dataIndex: "From",
      sorter: (a: LeaveEmployeeData, b: LeaveEmployeeData) => a.From.length - b.From.length,
    },
    {
      title: "Approved By",
      dataIndex: "ApprovedBy",
      render: (_text: string, record: LeaveEmployeeData) => (
        <div className="d-flex align-items-center file-name-icon">
          <span className="avatar avatar-md border avatar-rounded">
            <ImageWithBasePath src={`assets/img/users/${record.Image}`} className="img-fluid" alt={`${record.ApprovedBy} Profile`} />
          </span>
          <div className="ms-2">
            <h6 className="fw-medium">{record.ApprovedBy}</h6>
            <span className="fs-12 fw-normal ">{record.Roll}</span>
          </div>
        </div>
      ),
      sorter: (a: LeaveEmployeeData, b: LeaveEmployeeData) => a.ApprovedBy.length - b.ApprovedBy.length,
    },
    {
      title: "To",
      dataIndex: "To",
      sorter: (a: LeaveEmployeeData, b: LeaveEmployeeData) => a.To.length - b.To.length,
    },
    {
      title: "No of Days",
      dataIndex: "NoOfDays",
      sorter: (a: LeaveEmployeeData, b: LeaveEmployeeData) => a.NoOfDays.length - b.NoOfDays.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, _record: LeaveEmployeeData) => (
        <div className="dropdown">
          <button
            type="button"
            className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
            data-bs-toggle="dropdown"
          >
            <span className={`rounded-circle ${text === 'Approved' ? 'bg-transparent-success' : text === 'New' ? 'bg-transparent-purple' : 'bg-transparent-danger'} d-flex justify-content-center align-items-center me-2`}>
              <i className={`ti ti-point-filled ${text === 'Approved' ? 'text-success' : text === 'New' ? 'text-purple' : 'text-danger'}`} />
            </span>
            {text}
          </button>
          <ul className="dropdown-menu  dropdown-menu-end p-3">
            <li>
              <button
                type="button"
                className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"
              >
                <span className="rounded-circle bg-transparent-success d-flex justify-content-center align-items-center me-2">
                  <i className="ti ti-point-filled text-success" />
                </span>
                Approved
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"
              >
                <span className="rounded-circle bg-transparent-danger d-flex justify-content-center align-items-center me-2">
                  <i className="ti ti-point-filled text-danger" />
                </span>
                Declined
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"
              >
                <span className="rounded-circle bg-transparent-purple d-flex justify-content-center align-items-center me-2">
                  <i className="ti ti-point-filled text-purple" />
                </span>
                New
              </button>
            </li>
          </ul>
        </div>
      ),
      sorter: (a: LeaveEmployeeData, b: LeaveEmployeeData) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: (_: any, record: any) => (
        <div className="action-icon d-inline-flex">
          {record.rawStatus === 'PENDING' && (
            <button
              type="button"
              className="me-2"
              data-bs-toggle="modal"
              data-bs-target="#edit_employee_leaves"
              aria-label="Edit leave"
              onClick={() => {
                setSelectedLeave(record);
                setEditLeave({
                  leaveTypeId: String(record.leaveTypeId),
                  startDate: dayjs(record.rawStartDate),
                  endDate: dayjs(record.rawEndDate),
                  reason: record.rawReason,
                  leaveSession: record.rawLeaveSession || 'FULL_DAY'
                });
                setEditErrorMsg('');
              }}
            >
              <i className="ti ti-edit" />
            </button>
          )}
          <button
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            aria-label="Delete leave"
          >
            <i className="ti ti-trash" />
          </button>
        </div>
      ),
    },
  ]

  const leavetype = [
    { value: "Select", label: "Select" },
    { value: "Medical Leave", label: "Medical Leave" },
    { value: "Casual Leave", label: "Casual Leave" },
    { value: "Annual Leave", label: "Annual Leave" },
  ];
  const selectChoose = [
    { value: "Select", label: "Select" },
    { value: "Full Day", label: "Full Day" },
    { value: "First Half", label: "First Half" },
    { value: "Second Half", label: "Second Half" },
  ];

  const getModalContainer = () => {
    const modalElement = document.getElementById('modal-datepicker');
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Leaves</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Leaves
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="dropdown">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <button
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#add_employee_leaves"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Leave
                </button>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Leaves Info */}
          <div className="row">
            {dbBalances.length === 0 ? (
              <div className="col-12 text-center py-4 text-muted fs-14">
                No leave balances available.
              </div>
            ) : (
              dbBalances.map((bal, idx) => (
                <div className="col-xl-3 col-md-6" key={bal.leaveTypeId || idx}>
                  <div className={`card ${idx % 4 === 0 ? 'bg-black-le' : idx % 4 === 1 ? 'bg-blue-le' : idx % 4 === 2 ? 'bg-purple-le' : 'bg-pink-le'}`}>
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="text-start">
                          <p className="mb-1">{bal.leaveTypeName}</p>
                          <h4>{String(bal.usedDays).padStart(2, '0')}</h4>
                        </div>
                        <div className="d-flex">
                          <div className="flex-shrink-0 me-2">
                            <span className="avatar avatar-md d-flex">
                              <i className="ti ti-calendar-event fs-32" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="badge bg-secondary-transparent">
                        Remaining Leaves : {String(bal.remainingDays).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* /Leaves Info */}
          {/* Leaves list */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="d-flex">
                <h5 className="me-2">Leave List</h5>
                <span className="badge bg-primary-transparent me-2">
                  Total Leaves : {dbBalances.reduce((acc, bal) => acc + Number(bal.totalDays), 0)}
                </span>
                <span className="badge bg-secondary-transparent">
                  Total Remaining Leaves : {dbBalances.reduce((acc, bal) => acc + Number(bal.remainingDays), 0)}
                </span>
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-3">
                  <div className="input-icon position-relative">
                    <PredefinedDateRanges />
                  </div>
                </div>
                <div className="dropdown me-3">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Leave Type
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Medical Leave
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Casual Leave
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Annual Leave
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="dropdown me-3">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Approved By
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Doglas Martini
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Warren Morales
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Doglas Martini
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="dropdown me-3">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"
                      >
                        <span className="rounded-circle bg-transparent-success d-flex justify-content-center align-items-center me-2">
                          <i className="ti ti-point-filled text-success" />
                        </span>
                        Approved
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"
                      >
                        <span className="rounded-circle bg-transparent-danger d-flex justify-content-center align-items-center me-2">
                          <i className="ti ti-point-filled text-danger" />
                        </span>
                        Declined
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"
                      >
                        <span className="rounded-circle bg-transparent-purple d-flex justify-content-center align-items-center me-2">
                          <i className="ti ti-point-filled text-purple" />
                        </span>
                        New
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Recently Added
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Ascending
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Descending
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Last Month
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Last 7 Days
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <Table dataSource={data} columns={columns} Selection={true} />
            </div>
          </div>
          {/* /Leaves list */}
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
      {/* Add Leaves */}
      <div className="modal fade" id="add_employee_leaves">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Leave</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleApplyLeave}>
              <div className="modal-body pb-0">
                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Leave Type</label>
                      <CommonSelect
                        className='select'
                        options={leaveTypeOptions}
                        onChange={(opt) => setNewLeave({ ...newLeave, leaveTypeId: opt?.value || '' })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">From </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          value={newLeave.startDate}
                          onChange={(date) => setNewLeave({ ...newLeave, startDate: date })}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">To </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                          value={newLeave.endDate}
                          onChange={(date) => setNewLeave({ ...newLeave, endDate: date })}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Leave Duration</label>
                      <div className="d-flex align-items-center gap-3 mt-1">
                        {[
                          { value: 'FULL_DAY', label: 'Full Day' },
                          { value: 'FIRST_HALF', label: 'First Half' },
                          { value: 'SECOND_HALF', label: 'Second Half' },
                        ].map((opt) => (
                          <div className="form-check me-2" key={opt.value}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="newLeaveSession"
                              id={`new_${opt.value}`}
                              value={opt.value}
                              checked={newLeave.leaveSession === opt.value}
                              onChange={() => setNewLeave((prev: any) => ({ ...prev, leaveSession: opt.value }))}
                            />
                            <label className="form-check-label" htmlFor={`new_${opt.value}`}>
                              {opt.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Reason</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={newLeave.reason}
                        onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
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
      <div className="modal fade" id="edit_employee_leaves">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Leave</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdateLeave}>
              <div className="modal-body pb-0">
                {editErrorMsg && <div className="alert alert-danger py-2 fs-13">{editErrorMsg}</div>}
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Leave Type <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={editLeave.leaveTypeId}
                        onChange={(e) => setEditLeave((prev: any) => ({ ...prev, leaveTypeId: e.target.value }))}
                      >
                        <option value="">Select Leave Type</option>
                        {dbTypes.map((t: any) => (
                          <option key={t.id} value={String(t.id)}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">From <span className="text-danger">*</span></label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{ format: "DD-MM-YYYY", type: "mask" }}
                          value={editLeave.startDate}
                          onChange={(date) => setEditLeave((prev: any) => ({ ...prev, startDate: date }))}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">To <span className="text-danger">*</span></label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{ format: "DD-MM-YYYY", type: "mask" }}
                          value={editLeave.endDate}
                          onChange={(date) => setEditLeave((prev: any) => ({ ...prev, endDate: date }))}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Leave Duration</label>
                      <div className="d-flex align-items-center gap-3 mt-1">
                        {[
                          { value: 'FULL_DAY', label: 'Full Day' },
                          { value: 'FIRST_HALF', label: 'First Half' },
                          { value: 'SECOND_HALF', label: 'Second Half' },
                        ].map((opt) => (
                          <div className="form-check me-2" key={opt.value}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="editLeaveSession"
                              id={`edit_${opt.value}`}
                              value={opt.value}
                              checked={editLeave.leaveSession === opt.value}
                              onChange={() => setEditLeave((prev: any) => ({ ...prev, leaveSession: opt.value }))}
                            />
                            <label className="form-check-label" htmlFor={`edit_${opt.value}`}>
                              {opt.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Reason</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editLeave.reason}
                        onChange={(e) => setEditLeave((prev: any) => ({ ...prev, reason: e.target.value }))}
                        placeholder="Reason for leave (optional)"
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
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Leaves */}
    </>



  )
}

export default LeaveEmployee
