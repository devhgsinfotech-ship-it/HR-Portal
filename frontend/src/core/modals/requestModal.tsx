import React, { useState, useEffect } from "react";
import CommonSelect from "../common/commonSelect";
import { DatePicker } from "antd";
import apiClient from "../utils/apiClient";
import dayjs from "dayjs";

const RequestModals = () => {
  const userRole = localStorage.getItem("userRole");
  const isAdminOrHR = userRole === "COMPANY_ADMIN" || userRole === "HR" || userRole === "SUPER_ADMIN";
  const isCompanyAdmin = userRole === "COMPANY_ADMIN";

  const defaultEmpLabel = isCompanyAdmin ? "Select Employee" : "Select Employee (Optional)";
  const [employees, setEmployees] = useState<any[]>([{ value: "Select", label: defaultEmpLabel }]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([{ value: "Select", label: "Select Leave Type" }]);
  
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<any>(null);
  const [fromDate, setFromDate] = useState<any>(null);
  const [toDate, setToDate] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const empRes = await apiClient.get('/employees');
      if (empRes.data && Array.isArray(empRes.data)) {
        const empOptions = empRes.data.map((emp: any) => ({
          value: emp.id,
          label: `${emp.firstName} ${emp.lastName}`
        }));
        setEmployees([{ value: "Select", label: defaultEmpLabel }, ...empOptions]);
      }
      
      const typeRes = await apiClient.get('/leaves/types');
      if (typeRes.data && Array.isArray(typeRes.data)) {
        const typeOptions = typeRes.data.map((type: any) => ({
          value: type.id,
          label: type.name
        }));
        setLeaveTypes([{ value: "Select", label: "Select Leave Type" }, ...typeOptions]);
      }
    } catch (err) {
      console.error("Error fetching data for leave modal", err);
    }
  };

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const noOfDays = fromDate && toDate ? Math.max(0, dayjs(toDate).diff(dayjs(fromDate), 'day') + 1) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!selectedLeaveType || selectedLeaveType.value === "Select" || !fromDate || !toDate) {
      setError("Please select a leave type, start date, and end date.");
      return;
    }

    if (isCompanyAdmin && (!selectedEmployee || selectedEmployee.value === "Select")) {
      setError("As a Company Admin, you must select an employee to apply leave for.");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/leaves/apply', {
        employeeId: selectedEmployee && selectedEmployee.value !== "Select" ? selectedEmployee.value : undefined,
        leaveTypeId: selectedLeaveType.value,
        startDate: fromDate.format('YYYY-MM-DD'),
        endDate: toDate.format('YYYY-MM-DD'),
        reason: reason,
        leaveSession: 'FULL_DAY'
      });
      
      setSuccess("Leave request submitted successfully!");
      
      setTimeout(() => {
        // Reset form
        setFromDate(null);
        setToDate(null);
        setReason("");
        setSelectedLeaveType(null);
        setSelectedEmployee(null);
        setSuccess("");
        setError("");
        
        const closeBtn = document.querySelector('#add_leaves .btn-close') as HTMLElement;
        if (closeBtn) closeBtn.click();
        
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Add Leaves */}
      <div className="modal fade" id="add_leaves">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Leave Request</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body pb-0">
                {error && <div className="alert alert-danger mb-3">{error}</div>}
                {success && <div className="alert alert-success mb-3">{success}</div>}
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Employee Name</label>
                      <CommonSelect
                        className="select"
                        options={employees}
                        defaultValue={employees[0]}
                        onChange={(val: any) => setSelectedEmployee(val)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Leave Type <span className="text-danger">*</span></label>
                      <CommonSelect
                        className="select"
                        options={leaveTypes}
                        defaultValue={leaveTypes[0]}
                        onChange={(val: any) => setSelectedLeaveType(val)}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">From <span className="text-danger">*</span></label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format="DD-MM-YYYY"
                          value={fromDate}
                          onChange={(date) => setFromDate(date)}
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
                          format="DD-MM-YYYY"
                          value={toDate}
                          onChange={(date) => setToDate(date)}
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
                      <label className="form-label">No of Days</label>
                      <input type="text" className="form-control" value={noOfDays} disabled />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Remaining Days</label>
                      <input type="text" className="form-control" placeholder="Depends on balance" disabled />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Reason</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Submitting..." : "Add Leaves"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Leaves */}
    </>
  );
};

export default RequestModals;
