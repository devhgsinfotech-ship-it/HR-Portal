import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table from '../../../core/common/dataTable/index';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import { all_routes } from '../../../router/all_routes';
import apiClient from '../../../core/utils/apiClient';
import { useAppSelector } from '../../../core/data/redux/store';

interface AssetItem {
  id: number;
  name: string;
  assetCode: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'RETURN_REQUESTED' | 'MAINTENANCE' | 'RETIRED' | string;
  categoryId: number | null;
  categoryName: string;
  purchaseDate: string | null;
  description: string;
  assignedTo: {
    employeeId: number;
    employeeCode: string;
    name: string;
    email: string;
    avatarUrl?: string;
    assignedAt: string;
  } | null;
}

interface MyAssetItem {
  assignmentId: number;
  assetId: number;
  name: string;
  assetCode: string;
  status: string;
  categoryName: string;
  assignedAt: string;
  returnedAt: string | null;
  isCurrentlyAssigned: boolean;
  notes: string | null;
}

const Assets = () => {
  const user = useAppSelector((state: any) => state.auth.user);
  const userRole = user?.role || 'EMPLOYEE';
  const isEmployee = userRole === 'EMPLOYEE';

  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [myAssets, setMyAssets] = useState<MyAssetItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>(isEmployee ? 'my' : 'all');

  // Form State for New Asset
  const [newAsset, setNewAsset] = useState({
    name: '',
    assetCode: '',
    categoryId: '',
    purchaseDate: '',
    status: 'AVAILABLE',
    description: ''
  });

  // Assign Asset Modal State
  const [selectedAssetForAssign, setSelectedAssetForAssign] = useState<AssetItem | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');

  // Return Asset Modal State (Admin / HR Accept Return)
  const [selectedAssetForReturn, setSelectedAssetForReturn] = useState<AssetItem | null>(null);
  const [returnCondition, setReturnCondition] = useState<'GOOD' | 'DAMAGED'>('GOOD');
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Request Return Modal State (Employee Action)
  const [selectedAssetForReturnRequest, setSelectedAssetForReturnRequest] = useState<any | null>(null);
  const [requestReason, setRequestReason] = useState<string>('No longer required');
  const [requestNotes, setRequestNotes] = useState<string>('');

  const fetchAssetsData = async () => {
    try {
      setLoading(true);
      const [assetsRes, catRes, empRes, myAssetsRes] = await Promise.all([
        apiClient.get('/assets').catch(() => ({ data: [] })),
        apiClient.get('/assets/categories').catch(() => ({ data: [] })),
        apiClient.get('/employees').catch(() => ({ data: [] })),
        apiClient.get('/assets/my-assets').catch(() => ({ data: [] }))
      ]);

      if (Array.isArray(assetsRes.data)) setAssets(assetsRes.data);
      if (Array.isArray(catRes.data)) setCategories(catRes.data);
      if (Array.isArray(empRes.data)) setEmployees(empRes.data);
      if (Array.isArray(myAssetsRes.data)) setMyAssets(myAssetsRes.data);
    } catch (err) {
      console.error('Error loading assets module data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetsData();
  }, []);

  const handleCreateAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name.trim()) {
      alert('Asset Name is required');
      return;
    }
    try {
      await apiClient.post('/assets', {
        name: newAsset.name,
        assetCode: newAsset.assetCode,
        categoryId: newAsset.categoryId ? Number(newAsset.categoryId) : null,
        purchaseDate: newAsset.purchaseDate || null,
        status: newAsset.status,
        description: newAsset.description
      });
      alert('Asset added to inventory successfully!');
      setNewAsset({
        name: '',
        assetCode: '',
        categoryId: '',
        purchaseDate: '',
        status: 'AVAILABLE',
        description: ''
      });
      fetchAssetsData();
      const closeBtn = document.getElementById('close_add_asset_modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add asset');
    }
  };

  const handleAssignAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForAssign || !assignEmployeeId) {
      alert('Please select an employee to assign this asset');
      return;
    }
    try {
      await apiClient.post(`/assets/${selectedAssetForAssign.id}/assign`, {
        employeeId: assignEmployeeId,
        notes: assignNotes
      });
      alert(`Asset "${selectedAssetForAssign.name}" assigned successfully!`);
      setSelectedAssetForAssign(null);
      setAssignEmployeeId('');
      setAssignNotes('');
      fetchAssetsData();
      const closeBtn = document.getElementById('close_assign_asset_modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign asset');
    }
  };

  const handleReturnAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForReturn) return;
    try {
      await apiClient.post(`/assets/${selectedAssetForReturn.id}/return`, {
        returnCondition,
        notes: returnNotes
      });
      alert(`Asset "${selectedAssetForReturn.name}" return processed successfully!`);
      setSelectedAssetForReturn(null);
      setReturnNotes('');
      fetchAssetsData();
      const closeBtn = document.getElementById('close_return_asset_modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to return asset');
    }
  };

  const handleRequestReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForReturnRequest) return;
    const targetId = selectedAssetForReturnRequest.assetId || selectedAssetForReturnRequest.id;
    try {
      await apiClient.post(`/assets/${targetId}/request-return`, {
        reason: requestReason,
        notes: requestNotes
      });
      alert('Return request raised successfully! HR and Admin have been notified.');
      setSelectedAssetForReturnRequest(null);
      setRequestNotes('');
      fetchAssetsData();
      const closeBtn = document.getElementById('close_request_return_modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to raise return request');
    }
  };

  const handleDeleteAsset = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this asset from inventory?')) return;
    try {
      await apiClient.delete(`/assets/${id}`);
      alert('Asset deleted successfully');
      fetchAssetsData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete asset');
    }
  };

  // All Inventory Columns (Admin / HR View)
  const allColumns = [
    {
      title: "Asset Details",
      dataIndex: "name",
      render: (text: string, record: AssetItem) => (
        <div>
          <h6 className="fs-14 fw-medium text-dark mb-0">{text}</h6>
          <span className="fs-12 text-muted">Code: <strong className="text-primary">{record.assetCode}</strong> | {record.categoryName}</span>
        </div>
      ),
      sorter: (a: AssetItem, b: AssetItem) => a.name.localeCompare(b.name),
    },
    {
      title: "Assigned Employee",
      dataIndex: "assignedTo",
      render: (assignedTo: AssetItem['assignedTo']) => (
        assignedTo ? (
          <div className="d-flex align-items-center">
            <span className="avatar avatar-sm rounded-circle bg-primary-transparent text-primary me-2 fw-bold">
              {assignedTo.name.charAt(0)}
            </span>
            <div>
              <h6 className="fs-13 fw-medium mb-0">{assignedTo.name}</h6>
              <span className="fs-11 text-muted">{assignedTo.employeeCode || assignedTo.email}</span>
            </div>
          </div>
        ) : (
          <span className="badge bg-light text-muted border px-2 py-1 fs-12">Unassigned</span>
        )
      ),
    },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      render: (date: string | null) => date ? new Date(date).toLocaleDateString() : 'N/A',
      sorter: (a: AssetItem, b: AssetItem) => (a.purchaseDate || '').localeCompare(b.purchaseDate || ''),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => {
        let badgeClass = 'bg-success text-white';
        let statusText = status;
        if (status === 'ASSIGNED') badgeClass = 'bg-info text-white';
        if (status === 'RETURN_REQUESTED') {
          badgeClass = 'bg-warning text-dark fw-bold';
          statusText = 'RETURN REQUESTED';
        }
        if (status === 'MAINTENANCE') badgeClass = 'bg-danger text-white';
        if (status === 'RETIRED') badgeClass = 'bg-secondary text-white';

        return (
          <span className={`badge ${badgeClass} d-inline-flex align-items-center px-2 py-1 fs-12`}>
            <i className="ti ti-point-filled me-1" />
            {statusText}
          </span>
        );
      },
      sorter: (a: AssetItem, b: AssetItem) => a.status.localeCompare(b.status),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: AssetItem) => (
        <div className="d-flex align-items-center gap-2">
          {!isEmployee && record.status === 'AVAILABLE' && (
            <button
              type="button"
              className="btn btn-sm btn-primary rounded-pill px-3 py-1 d-inline-flex align-items-center shadow-xs fs-12 fw-medium"
              data-bs-toggle="modal"
              data-bs-target="#assign_asset_modal"
              onClick={() => setSelectedAssetForAssign(record)}
              title="Assign to Employee"
            >
              <i className="ti ti-user-plus me-1 fs-14" />
              Assign
            </button>
          )}

          {!isEmployee && record.status === 'RETURN_REQUESTED' && (
            <button
              type="button"
              className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3 py-1 d-inline-flex align-items-center shadow-xs fs-12"
              data-bs-toggle="modal"
              data-bs-target="#return_asset_modal"
              onClick={() => setSelectedAssetForReturn(record)}
              title="Accept & Confirm Return"
            >
              <i className="ti ti-check me-1 fs-14" />
              Accept Return
            </button>
          )}

          {!isEmployee && record.status === 'ASSIGNED' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-inline-flex align-items-center fs-12 fw-medium"
              data-bs-toggle="modal"
              data-bs-target="#return_asset_modal"
              onClick={() => setSelectedAssetForReturn(record)}
              title="Check In / Return Asset"
            >
              <i className="ti ti-arrow-back-up me-1 fs-14" />
              Return
            </button>
          )}

          {isEmployee && record.status === 'ASSIGNED' && record.assignedTo?.email === user?.email && (
            <button
              type="button"
              className="btn btn-sm btn-outline-warning text-dark fw-medium rounded-pill px-3 py-1 d-inline-flex align-items-center fs-12"
              data-bs-toggle="modal"
              data-bs-target="#request_return_modal"
              onClick={() => setSelectedAssetForReturnRequest(record)}
              title="Raise Return Request"
            >
              <i className="ti ti-arrow-back-up me-1 fs-14" />
              Request Return
            </button>
          )}

          {!isEmployee && (
            <button
              type="button"
              className="btn btn-icon btn-sm btn-light-danger rounded-circle text-danger d-inline-flex align-items-center justify-content-center border-0 p-0 ms-1"
              style={{ width: '30px', height: '30px' }}
              onClick={() => handleDeleteAsset(record.id)}
              title="Delete Asset"
            >
              <i className="ti ti-trash fs-15" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // My Assigned Assets Columns (Employee View)
  const myAssetColumns = [
    {
      title: "Asset Name & Code",
      dataIndex: "name",
      render: (text: string, record: MyAssetItem) => (
        <div>
          <h6 className="fs-14 fw-medium text-dark mb-0">{text}</h6>
          <span className="fs-12 text-muted">Code: <strong className="text-primary">{record.assetCode}</strong> | {record.categoryName}</span>
        </div>
      ),
    },
    {
      title: "Assigned Date",
      dataIndex: "assignedAt",
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string, record: MyAssetItem) => {
        if (!record.isCurrentlyAssigned) {
          return <span className="badge bg-secondary text-white">RETURNED</span>;
        }
        if (status === 'RETURN_REQUESTED') {
          return (
            <span className="badge bg-warning text-dark fw-bold d-inline-flex align-items-center">
              <i className="ti ti-clock me-1" /> Return Requested
            </span>
          );
        }
        return (
          <span className="badge bg-success text-white d-inline-flex align-items-center">
            <i className="ti ti-circle-check me-1" /> Active Assignment
          </span>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "actions",
      render: (_: any, record: MyAssetItem) => {
        if (!record.isCurrentlyAssigned) {
          return <span className="text-muted fs-12">Returned</span>;
        }
        if (record.status === 'RETURN_REQUESTED') {
          return (
            <span className="fs-12 text-warning fw-medium d-inline-flex align-items-center">
              <i className="ti ti-loader me-1 spin" /> Pending HR Confirmation
            </span>
          );
        }
        return (
          <button
            type="button"
            className="btn btn-xs btn-warning text-dark fw-medium d-inline-flex align-items-center"
            data-bs-toggle="modal"
            data-bs-target="#request_return_modal"
            onClick={() => setSelectedAssetForReturnRequest(record)}
          >
            <i className="ti ti-arrow-back-up me-1" />
            Request Return
          </button>
        );
      },
    }
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Assets Management</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Administration</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Assets Inventory
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
              {!isEmployee && (
                <>
                  <div className="mb-2 me-2">
                    <Link to="/administration/asset-category" className="btn btn-outline-secondary">
                      <i className="ti ti-category me-1" />
                      Manage Categories
                    </Link>
                  </div>
                  <div className="mb-2">
                    <button
                      type="button"
                      data-bs-toggle="modal"
                      data-bs-target="#add_asset_modal"
                      className="btn btn-primary d-flex align-items-center"
                    >
                      <i className="ti ti-circle-plus me-2" />
                      Add New Asset
                    </button>
                  </div>
                </>
              )}
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Asset Return Requested Alert Banner for HR / Admin / Manager */}
          {!isEmployee && assets.some(a => a.status === 'RETURN_REQUESTED') && (
            <div className="alert alert-warning d-flex align-items-center justify-content-between mb-3 shadow-sm border-warning">
              <div className="d-flex align-items-center">
                <span className="avatar avatar-sm bg-warning text-dark rounded-circle me-3 flex-shrink-0">
                  <i className="ti ti-bell-ringing fs-16" />
                </span>
                <div>
                  <h6 className="mb-0 text-dark fw-bold">Pending Asset Return Requests</h6>
                  <span className="fs-12 text-muted">
                    There {assets.filter(a => a.status === 'RETURN_REQUESTED').length === 1 ? 'is 1 employee asset return request' : `are ${assets.filter(a => a.status === 'RETURN_REQUESTED').length} employee asset return requests`} awaiting your inspection and acceptance.
                  </span>
                </div>
              </div>
              <button
                className="btn btn-sm btn-warning text-dark fw-bold ms-3 flex-shrink-0"
                onClick={() => setActiveTab('all')}
              >
                Review Requests
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="card mb-3">
            <div className="card-body p-2">
              <ul className="nav nav-pills nav-pills-custom">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'my' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my')}
                  >
                    <i className="ti ti-user-check me-1" />
                    My Assigned Assets ({myAssets.filter(a => a.isCurrentlyAssigned).length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    <i className="ti ti-devices me-1" />
                    Company Asset Inventory ({assets.length})
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Asset Stats Header */}
          <div className="row mb-3">
            <div className="col-lg-3 col-md-6">
              <div className="card">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <span className="fs-12 text-muted fw-medium">Total Assets</span>
                    <h3 className="mb-0 mt-1">{assets.length}</h3>
                  </div>
                  <span className="avatar avatar-md bg-primary-transparent rounded-circle text-primary">
                    <i className="ti ti-devices fs-18" />
                  </span>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="card">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <span className="fs-12 text-muted fw-medium">Available</span>
                    <h3 className="mb-0 mt-1">{assets.filter(a => a.status === 'AVAILABLE').length}</h3>
                  </div>
                  <span className="avatar avatar-md bg-success-transparent rounded-circle text-success">
                    <i className="ti ti-circle-check fs-18" />
                  </span>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="card">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <span className="fs-12 text-muted fw-medium">Assigned</span>
                    <h3 className="mb-0 mt-1">{assets.filter(a => a.status === 'ASSIGNED').length}</h3>
                  </div>
                  <span className="avatar avatar-md bg-info-transparent rounded-circle text-info">
                    <i className="ti ti-user-check fs-18" />
                  </span>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="card">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <span className="fs-12 text-muted fw-medium">Return Requested</span>
                    <h3 className="mb-0 mt-1">{assets.filter(a => a.status === 'RETURN_REQUESTED').length}</h3>
                  </div>
                  <span className="avatar avatar-md bg-warning-transparent rounded-circle text-warning">
                    <i className="ti ti-arrow-back-up fs-18" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assets Table based on Active Tab */}
          {activeTab === 'my' ? (
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
                <h5 className="mb-0">My Assigned Assets</h5>
                <span className="fs-12 text-muted">Assets currently in your possession or returned</span>
              </div>
              <div className="card-body p-0">
                <Table dataSource={myAssets} columns={myAssetColumns} Selection={false} />
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
                <h5 className="mb-0">Company Asset Inventory</h5>
              </div>
              <div className="card-body p-0">
                <Table dataSource={assets} columns={allColumns} Selection={false} />
              </div>
            </div>
          )}
        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR.</p>
        </div>
      </div>

      {/* Add Asset Modal */}
      <div className="modal fade" id="add_asset_modal">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Asset to Inventory</h4>
              <button
                type="button"
                id="close_add_asset_modal"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleCreateAssetSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Asset Name<span className="text-danger"> *</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MacBook Pro M3 Max 16-inch"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Asset Code / Tag No.</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. AST-LAP-001 (auto-generated if empty)"
                      value={newAsset.assetCode}
                      onChange={(e) => setNewAsset({ ...newAsset, assetCode: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Asset Category</label>
                    <select
                      className="form-select"
                      value={newAsset.categoryId}
                      onChange={(e) => setNewAsset({ ...newAsset, categoryId: e.target.value })}
                    >
                      <option value="">Select Category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Purchase Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newAsset.purchaseDate}
                      onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Initial Status</label>
                    <select
                      className="form-select"
                      value={newAsset.status}
                      onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="RETIRED">RETIRED</option>
                    </select>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Description / Specifications</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Serial number, hardware specs, warranty details..."
                      value={newAsset.description}
                      onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Assign Asset Modal */}
      <div className="modal fade" id="assign_asset_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Assign Asset to Employee</h4>
              <button
                type="button"
                id="close_assign_asset_modal"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAssignAssetSubmit}>
              <div className="modal-body">
                {selectedAssetForAssign && (
                  <div className="alert alert-soft-primary mb-3">
                    <strong>Asset:</strong> {selectedAssetForAssign.name} ({selectedAssetForAssign.assetCode})
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Select Employee<span className="text-danger"> *</span></label>
                  <select
                    className="form-select"
                    value={assignEmployeeId}
                    onChange={(e) => setAssignEmployeeId(e.target.value)}
                    required
                  >
                    <option value="">Choose Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Assignment Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="e.g. Issued for remote work..."
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Accept / Process Return Asset Modal (Admin / HR) */}
      <div className="modal fade" id="return_asset_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Check-In / Accept Asset Return</h4>
              <button
                type="button"
                id="close_return_asset_modal"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleReturnAssetSubmit}>
              <div className="modal-body">
                {selectedAssetForReturn && (
                  <div className="alert alert-soft-info mb-3">
                    <strong>Asset:</strong> {selectedAssetForReturn.name}<br />
                    <strong>Currently Assigned To:</strong> {selectedAssetForReturn.assignedTo?.name || 'N/A'}<br />
                    {selectedAssetForReturn.status === 'RETURN_REQUESTED' && (
                      <div className="mt-1 text-warning fw-bold fs-12">
                        <i className="ti ti-info-circle me-1" /> Employee requested return for this asset.
                      </div>
                    )}
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Condition Upon Return</label>
                  <select
                    className="form-select"
                    value={returnCondition}
                    onChange={(e: any) => setReturnCondition(e.target.value)}
                  >
                    <option value="GOOD">Good / Fully Operational (Status → AVAILABLE)</option>
                    <option value="DAMAGED">Damaged / Requires Repair (Status → MAINTENANCE)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Inspection &amp; Return Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="e.g. Returned with laptop bag and power adapter..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-success">Confirm Return &amp; Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Raise Return Request Modal (Employee) */}
      <div className="modal fade" id="request_return_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Raise Asset Return Request</h4>
              <button
                type="button"
                id="close_request_return_modal"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleRequestReturnSubmit}>
              <div className="modal-body">
                {selectedAssetForReturnRequest && (
                  <div className="alert alert-soft-warning mb-3">
                    <strong>Asset:</strong> {selectedAssetForReturnRequest.name} ({selectedAssetForReturnRequest.assetCode})
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Return Reason<span className="text-danger"> *</span></label>
                  <select
                    className="form-select"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    required
                  >
                    <option value="No longer required">No longer required / Project Completed</option>
                    <option value="Hardware Upgrade Needed">Hardware Upgrade / Replacement Needed</option>
                    <option value="Damaged / Malfunctioning">Damaged / Malfunctioning</option>
                    <option value="Offboarding / Resignation">Offboarding / Resignation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Additional Comments / Remarks</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide details about condition or reason for returning this asset..."
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-warning text-dark fw-bold">Submit Return Request</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Assets;
