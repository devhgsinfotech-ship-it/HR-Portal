import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../../router/all_routes';
import CommonSelect from '../../../../core/common/commonSelect';
import ImageWithBasePath from '../../../../core/common/imageWithBasePath';
import { PickList } from 'primereact/picklist';
import CollapseHeader from '../../../../core/common/collapse-header/collapse-header';
import apiClient from '../../../../core/utils/apiClient';

const LeaveSettings = () => {
  const [dbLeaveTypes, setDbLeaveTypes] = useState<any[]>([]);
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [dbPolicies, setDbPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected leave type for Custom Policy list view & settings modal
  const [selectedType, setSelectedType] = useState<any>(null);

  // Default Settings Modal State
  const [typeDays, setTypeDays] = useState('12');
  const [typeIsPaid, setTypeIsPaid] = useState(true);

  // Add/Edit Custom Policy State
  const [policyName, setPolicyName] = useState('');
  const [policyDays, setPolicyDays] = useState('12');
  const [policyTypeId, setPolicyTypeId] = useState('');
  const [editPolicyId, setEditPolicyId] = useState<number | null>(null);

  // PickList State
  const [sourceEmployees, setSourceEmployees] = useState<any[]>([]);
  const [targetEmployees, setTargetEmployees] = useState<any[]>([]);

  const fetchAllData = async () => {
    try {
      const [typesRes, empRes, policiesRes] = await Promise.all([
        apiClient.get('/leaves/types'),
        apiClient.get('/employees'),
        apiClient.get('/leaves/policies')
      ]);
      setDbLeaveTypes(typesRes.data);
      setDbEmployees(empRes.data);
      setDbPolicies(policiesRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching leave settings data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleUpdateTypeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    try {
      await apiClient.put(`/leaves/types/${selectedType.id}`, {
        name: selectedType.name,
        totalDaysPerYear: parseFloat(typeDays),
        isPaid: typeIsPaid
      });
      
      const closeBtn = document.querySelector('#leave_type_settings_modal .btn-close') as HTMLButtonElement;
      if (closeBtn) closeBtn.click();
      
      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error updating type settings');
    }
  };

  const initAddPolicyModal = () => {
    setEditPolicyId(null);
    setPolicyName('');
    setPolicyDays('12');
    setPolicyTypeId(dbLeaveTypes[0]?.id || '');
    // Reset PickList source and target
    const mapped = dbEmployees.map(emp => ({
      id: emp.id,
      Name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
    }));
    setSourceEmployees(mapped);
    setTargetEmployees([]);
    setErrorMsg('');
  };

  const initEditPolicyModal = (policy: any) => {
    setEditPolicyId(policy.id);
    setPolicyName(policy.name);
    setPolicyDays(String(policy.days));
    setPolicyTypeId(String(policy.leaveTypeId));
    
    // Set target employees (assigned)
    const target = policy.employees.map((emp: any) => ({
      id: emp.id,
      Name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
    }));
    
    // Set source employees (not assigned)
    const assignedIds = new Set(target.map((t: any) => t.id));
    const source = dbEmployees
      .filter(emp => !assignedIds.has(emp.id))
      .map(emp => ({
        id: emp.id,
        Name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
      }));

    setSourceEmployees(source);
    setTargetEmployees(target);
    setErrorMsg('');
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: policyName,
      leaveTypeId: parseInt(policyTypeId, 10),
      days: parseFloat(policyDays),
      employeeIds: targetEmployees.map(t => t.id)
    };

    try {
      if (editPolicyId) {
        await apiClient.put(`/leaves/policies/${editPolicyId}`, payload);
      } else {
        await apiClient.post('/leaves/policies', payload);
      }

      // Close modal
      const closeBtn = document.querySelector('#custom_policy_modal .btn-close') as HTMLButtonElement;
      if (closeBtn) closeBtn.click();
      
      // Close custom policy list modal if open
      const closeListBtn = document.querySelector('#custom_policy_list_modal .btn-close') as HTMLButtonElement;
      if (closeListBtn) closeListBtn.click();

      fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error saving policy');
    }
  };

  const handleDeletePolicy = async (policyId: number) => {
    if (!window.confirm('Are you sure you want to delete this custom policy?')) return;
    try {
      await apiClient.delete(`/leaves/policies/${policyId}`);
      
      const closeListBtn = document.querySelector('#custom_policy_list_modal .btn-close') as HTMLButtonElement;
      if (closeListBtn) closeListBtn.click();

      fetchAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error deleting policy');
    }
  };

  const handleToggleTypeStatus = async (type: any, checked: boolean) => {
    try {
      await apiClient.put(`/leaves/types/${type.id}`, {
        name: type.name,
        totalDaysPerYear: type.totalDaysPerYear,
        isPaid: checked
      });
      fetchAllData();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Leave Settings</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Leave Settings
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="mb-2">
                <button
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#custom_policy_modal"
                  className="btn btn-primary d-flex align-items-center"
                  onClick={initAddPolicyModal}
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Custom Policy
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
            {loading ? (
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : dbLeaveTypes.length === 0 ? (
              <div className="col-12 text-center py-5">
                <h5>No leave types configured. Configure them in <Link to="/app-settings/leave-type">Leave Type Settings</Link>.</h5>
              </div>
            ) : (
              dbLeaveTypes.map((type) => {
                const typePolicies = dbPolicies.filter(p => p.leaveTypeId === type.id);
                return (
                  <div className="col-xl-4 col-md-6" key={type.id}>
                    <div className="card">
                      <div className="card-body d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <div className="form-check form-check-md form-switch me-1">
                            <label className="form-check-label">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                checked={type.isPaid}
                                onChange={(e) => handleToggleTypeStatus(type, e.target.checked)}
                              />
                            </label>
                          </div>
                          <h6 className="d-flex align-items-center mb-0">{type.name}</h6>
                        </div>
                        <div className="d-flex align-items-center">
                          <Link
                            to="#"
                            className="text-decoration-underline me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#custom_policy_list_modal"
                            onClick={() => setSelectedType(type)}
                          >
                            Custom Policy ({typePolicies.length})
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#leave_type_settings_modal"
                            onClick={() => {
                              setSelectedType(type);
                              setTypeDays(String(type.totalDaysPerYear));
                              setTypeIsPaid(type.isPaid);
                            }}
                          >
                            <i className="ti ti-settings" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Leave Type Settings Modal */}
      <div className="modal fade" id="leave_type_settings_modal" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">{selectedType?.name} Settings</h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdateTypeSettings}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">No of Days</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={typeDays}
                    onChange={(e) => setTypeDays(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Paid Status</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="typeIsPaid"
                        id="typePaid"
                        checked={typeIsPaid}
                        onChange={() => setTypeIsPaid(true)}
                      />
                      <label className="form-check-label" htmlFor="typePaid">Paid</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="typeIsPaid"
                        id="typeUnpaid"
                        checked={!typeIsPaid}
                        onChange={() => setTypeIsPaid(false)}
                      />
                      <label className="form-check-label" htmlFor="typeUnpaid">Unpaid</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom Policy List Modal */}
      <div className="modal fade" id="custom_policy_list_modal" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">{selectedType?.name} Custom Policies</h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              {dbPolicies.filter(p => p.leaveTypeId === selectedType?.id).length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No custom policies set for this leave type.
                </div>
              ) : (
                <div className="row">
                  {dbPolicies.filter(p => p.leaveTypeId === selectedType?.id).map((policy) => (
                    <div className="col-md-12 mb-3" key={policy.id}>
                      <div className="card border mb-0">
                        <div className="card-body pb-1">
                          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                            <div>
                              <p className="mb-1 text-muted fs-12">Policy Name</p>
                              <span className="text-dark fw-semibold">{policy.name}</span>
                            </div>
                            <div>
                              <p className="mb-1 text-muted fs-12">Quota</p>
                              <span className="text-dark fw-semibold">{Number(policy.days)} days</span>
                            </div>
                            <div>
                              <p className="mb-1 text-muted fs-12">Employees ({policy.employees.length})</p>
                              <div className="avatar-list-stacked avatar-group-sm">
                                {policy.employees.slice(0, 5).map((emp: any) => (
                                  <span className="avatar border-0 rounded-circle" key={emp.id} title={`${emp.firstName} ${emp.lastName}`}>
                                    {emp.profilePhotoUrl ? (
                                      <img
                                        src={`${apiClient.defaults.baseURL}${emp.profilePhotoUrl}`}
                                        className="rounded-circle"
                                        alt="img"
                                        style={{ objectFit: 'cover', width: '30px', height: '30px' }}
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = '/assets/img/users/user-13.jpg';
                                        }}
                                      />
                                    ) : (
                                      <ImageWithBasePath
                                        src="assets/img/users/user-13.jpg"
                                        className="rounded-circle"
                                        alt="img"
                                      />
                                    )}
                                  </span>
                                ))}
                                {policy.employees.length > 5 && (
                                  <span className="avatar group-counts bg-primary rounded-circle border-0 fs-10 text-white">
                                    +{policy.employees.length - 5}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="action-icon d-inline-flex">
                              <Link
                                to="#"
                                className="me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#custom_policy_modal"
                                onClick={() => initEditPolicyModal(policy)}
                              >
                                <i className="ti ti-edit fs-16 text-primary" />
                              </Link>
                              <Link to="#" onClick={() => handleDeletePolicy(policy.id)}>
                                <i className="ti ti-trash fs-16 text-danger" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Custom Policy Modal */}
      <div id="custom_policy_modal" className="modal fade" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editPolicyId ? 'Edit Custom Policy' : 'Add Custom Policy'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSavePolicy}>
                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Policy Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Standard Developer Leave"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Days <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      value={policyDays}
                      onChange={(e) => setPolicyDays(e.target.value)}
                    />
                  </div>
                  {!editPolicyId && (
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Leave Type <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={policyTypeId}
                        onChange={(e) => setPolicyTypeId(e.target.value)}
                        required
                      >
                        {dbLeaveTypes.map(type => (
                          <option value={type.id} key={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="mb-3 leave-duallist">
                  <label className="form-label">Add Employees to Policy</label>
                  <div className="card p-2 border">
                    <PickList
                      dataKey="id"
                      source={sourceEmployees}
                      target={targetEmployees}
                      onChange={(e) => {
                        setSourceEmployees(e.source);
                        setTargetEmployees(e.target);
                      }}
                      itemTemplate={(item: any) => <span className="fw-medium">{item.Name}</span>}
                      breakpoint="1280px"
                      sourceHeader="Available Employees"
                      targetHeader="Assigned to Policy"
                      sourceStyle={{ height: '18rem' }}
                      targetStyle={{ height: '18rem' }}
                    />
                  </div>
                </div>
                <div className="text-end">
                  <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Policy</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaveSettings;
