import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import CollapseHeader from '../../../core/common/collapse-header/collapse-header'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import CommonSelect from '../../../core/common/commonSelect'
import PredefinedDateRanges from '../../../core/common/datePicker'
import Table from "../../../core/common/dataTable/index";
import React, { useState, useEffect } from 'react';
import apiClient from '../../../core/utils/apiClient';

interface PackageListItem {
  id: number;
  Plan_Name: string;
  Plan_Type: string;
  Total_Subscribers: number;
  Price: string;
  Created_Date: string;
  Status: 'Active' | 'Inactive' | string;
  code: string;
  maxEmployees: number;
}

const Packages = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [newPlan, setNewPlan] = useState({
    name: '',
    code: '',
    description: '',
    priceMonthly: 1999,
    priceYearly: 19990,
    maxEmployees: 25,
    maxStorageGb: 10,
    features: ['Employees', 'Invoices', 'Reports', 'Attendance', 'Payroll'],
    country: 'India',
    state: 'All India',
    currency: 'INR (₹)',
    isActive: true
  });

  const [editingPlan, setEditingPlan] = useState<any>({
    id: 0,
    name: '',
    code: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    maxEmployees: 10,
    maxStorageGb: 5,
    features: [],
    isActive: true
  });

  const [customFeature, setCustomFeature] = useState('');

  const availableModules = [
    'Employees', 'Invoices', 'Reports', 'Contacts',
    'Clients', 'Estimates', 'Goals', 'Deals',
    'Projects', 'Payments', 'Assets', 'Leads',
    'Tickets', 'Taxes', 'Activities', 'Pipelines',
    'Attendance', 'Payroll'
  ];

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/super-admin/plans');
      if (Array.isArray(res.data)) {
        setPlans(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openEditModal = (plan: any) => {
    let enabledFeats: string[] = [];
    if (Array.isArray(plan.features)) {
      enabledFeats = plan.features;
    } else if (plan.features && typeof plan.features === 'object') {
      enabledFeats = Object.keys(plan.features).filter(k => plan.features[k] === true);
    }

    setEditingPlan({
      id: plan.id,
      name: plan.name || '',
      code: plan.code || '',
      description: plan.description || '',
      priceMonthly: plan.priceMonthly || 0,
      priceYearly: plan.priceYearly || 0,
      maxEmployees: plan.maxEmployees || 10,
      maxStorageGb: plan.maxStorageGb || 5,
      features: enabledFeats,
      isActive: plan.isActive ?? true
    });
  };

  const handleModuleToggle = (moduleName: string) => {
    setNewPlan(prev => {
      const exists = prev.features.includes(moduleName);
      const updated = exists
        ? prev.features.filter(f => f !== moduleName)
        : [...prev.features, moduleName];
      return { ...prev, features: updated };
    });
  };

  const handleSelectAllModules = (checked: boolean) => {
    setNewPlan(prev => ({
      ...prev,
      features: checked ? [...availableModules] : []
    }));
  };

  const handleEditModuleToggle = (moduleName: string) => {
    setEditingPlan((prev: any) => {
      const exists = prev.features.includes(moduleName);
      const updated = exists
        ? prev.features.filter((f: string) => f !== moduleName)
        : [...prev.features, moduleName];
      return { ...prev, features: updated };
    });
  };

  const handleEditSelectAllModules = (checked: boolean) => {
    setEditingPlan((prev: any) => ({
      ...prev,
      features: checked ? [...availableModules] : []
    }));
  };

  const handleAddPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name.trim()) {
      alert('Plan Name is required');
      return;
    }
    try {
      const planCode = newPlan.code.trim() || newPlan.name.toUpperCase().replace(/\s+/g, '_');
      
      let featList = [...newPlan.features];
      if (customFeature.trim()) {
        const customArr = customFeature.split(',').map((f: string) => f.trim()).filter(Boolean);
        featList = Array.from(new Set([...featList, ...customArr]));
      }

      const featMap: Record<string, boolean> = {};
      availableModules.forEach(mod => {
        featMap[mod] = featList.includes(mod);
      });

      await apiClient.post('/super-admin/plans', {
        name: newPlan.name,
        code: planCode,
        description: newPlan.description,
        priceMonthly: Number(newPlan.priceMonthly),
        priceYearly: Number(newPlan.priceYearly),
        maxEmployees: Number(newPlan.maxEmployees),
        maxStorageGb: Number(newPlan.maxStorageGb),
        features: featMap,
        isActive: newPlan.isActive
      });

      alert('Plan created successfully!');
      fetchPlans();

      const closeBtn = document.getElementById('close_add_plans_modal');
      if (closeBtn) closeBtn.click();

      setNewPlan({
        name: '',
        code: '',
        description: '',
        priceMonthly: 1999,
        priceYearly: 19990,
        maxEmployees: 25,
        maxStorageGb: 10,
        features: ['Employees', 'Invoices', 'Reports', 'Attendance', 'Payroll'],
        country: 'India',
        state: 'All India',
        currency: 'INR (₹)',
        isActive: true
      });
      setCustomFeature('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create plan');
    }
  };

  const handleEditPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editingPlan.name.trim()) {
      alert('Plan Name is required');
      return;
    }
    try {
      const featMap: Record<string, boolean> = {};
      availableModules.forEach(mod => {
        featMap[mod] = editingPlan.features.includes(mod);
      });

      await apiClient.put(`/super-admin/plans/${editingPlan.id}`, {
        name: editingPlan.name,
        description: editingPlan.description,
        priceMonthly: Number(editingPlan.priceMonthly),
        priceYearly: Number(editingPlan.priceYearly),
        maxEmployees: Number(editingPlan.maxEmployees),
        maxStorageGb: Number(editingPlan.maxStorageGb),
        features: featMap,
        isActive: editingPlan.isActive
      });

      alert('Plan updated successfully!');
      fetchPlans();

      const closeBtn = document.getElementById('close_edit_plans_modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update plan');
    }
  };

  const tableData: PackageListItem[] = plans.map(p => ({
    id: p.id,
    Plan_Name: p.name,
    Plan_Type: 'Monthly / Yearly',
    Total_Subscribers: p.totalSubscribers || 0,
    Price: `₹${p.priceMonthly.toLocaleString('en-IN')}/mo (₹${p.priceYearly.toLocaleString('en-IN')}/yr)`,
    Created_Date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
    Status: p.isActive ? 'Active' : 'Inactive',
    code: p.code,
    maxEmployees: p.maxEmployees
  }));

  const totalPlansCount = plans.length;
  const activePlansCount = plans.filter(p => p.isActive).length;
  const inactivePlansCount = plans.filter(p => !p.isActive).length;

  const columns = [
    {
      title: "Plan Name",
      dataIndex: "Plan_Name",
      render: (text: string, record: PackageListItem) => (
        <div>
          <h6 className="fw-medium mb-0">{text}</h6>
          <span className="fs-12 text-muted">Code: {record.code} | Max {record.maxEmployees} Employees</span>
        </div>
      ),
      sorter: (a: PackageListItem, b: PackageListItem) => a.Plan_Name.localeCompare(b.Plan_Name),
    },
    {
      title: "Plan Type",
      dataIndex: "Plan_Type",
      sorter: (a: PackageListItem, b: PackageListItem) => a.Plan_Type.localeCompare(b.Plan_Type),
    },
    {
      title: "Total Subscribers",
      dataIndex: "Total_Subscribers",
      sorter: (a: PackageListItem, b: PackageListItem) => a.Total_Subscribers - b.Total_Subscribers,
    },
    {
      title: "Price",
      dataIndex: "Price",
      sorter: (a: PackageListItem, b: PackageListItem) => a.Price.localeCompare(b.Price),
    },
    {
      title: "Created Date",
      dataIndex: "Created_Date",
      sorter: (a: PackageListItem, b: PackageListItem) => a.Created_Date.localeCompare(b.Created_Date),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span className={`badge ${text === 'Active' ? 'badge-success' : 'badge-danger'} d-inline-flex align-items-center badge-xs`}>
          <i className="ti ti-point-filled me-1" />
          {text}
        </span>
      ),
      sorter: (a: PackageListItem, b: PackageListItem) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: PackageListItem) => {
        const fullPlan = plans.find(p => p.id === record.id);
        return (
          <div className="action-icon d-inline-flex">
            <Link
              to="#"
              className="me-2"
              data-bs-toggle="modal"
              data-bs-target="#edit_plans"
              onClick={() => openEditModal(fullPlan || record)}
            >
              <i className="ti ti-edit text-primary fs-16" />
            </Link>
          </div>
        );
      }
    }
  ];

  const planName = [
    { value: "Advanced", label: "Advanced" },
    { value: "Basic", label: "Basic" },
    { value: "Enterprise", label: "Enterprise" },
  ];
  const planType = [
    { value: "Monthly", label: "Monthly" },
    { value: "Yearly", label: "Yearly" },
  ];
  const currency = [
    { value: "USD", label: "USD" },
    { value: "Euro", label: "Euro" },
  ];
  const planPosition = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
  ];
  const plancurrency = [
    { value: "Fixed", label: "Fixed" },
    { value: "Percentage", label: "Percentage" },
  ];
  const discountType = [
    { value: "Fixed", label: "Fixed" },
    { value: "Percentage", label: "Percentage" },
  ];
  const status = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Packages</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Super Admin</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Packages List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={all_routes.superAdminPackages}
                    className="btn btn-icon btn-sm active bg-primary text-white me-1"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link to={all_routes.superAdminPackagesGrid} className="btn btn-icon btn-sm">
                    <i className="ti ti-layout-grid" />
                  </Link>
                </div>
              </div>
              <div className="me-2 mb-2">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_plans"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Plan
                </Link>
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="row">
            {/* Total Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Total Plans
                      </p>
                      <h4>{totalPlansCount}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-primary flex-shrink-0">
                      <i className="ti ti-box fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Total Plans */}
            {/* Active Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Active Plans
                      </p>
                      <h4>{activePlansCount}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-success flex-shrink-0">
                      <i className="ti ti-activity-heartbeat fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Active Plans */}
            {/* Inactive Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Inactive Plans
                      </p>
                      <h4>{inactivePlansCount}</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-danger flex-shrink-0">
                      <i className="ti ti-player-pause fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Inactive Companies */}
            {/* No of Plans  */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        No of Plan Types
                      </p>
                      <h4>02</h4>
                    </div>
                  </div>
                  <div>
                    <span className="avatar avatar-lg bg-skyblue flex-shrink-0">
                      <i className="ti ti-mask fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /No of Plans */}
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Plan List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-3">
                  <div className="input-icon position-relative">
                    <PredefinedDateRanges />
                  </div>
                </div>
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Plan
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Monthly
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Yearly
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Inactive
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Descending
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <Table dataSource={tableData} columns={columns} Selection={false} />
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
      {/* Add Plan */}
      <div className="modal fade" id="add_plans">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Plan</h4>
              <button
                type="button"
                id="close_add_plans_modal"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddPlanSubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Plan Name<span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Growth Plan"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Plan Code / Identifier<span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. GROWTH"
                        value={newPlan.code}
                        onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Monthly Price (₹ INR)<span className="text-danger"> *</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="1999"
                          value={newPlan.priceMonthly}
                          onChange={(e) => setNewPlan({ ...newPlan, priceMonthly: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Yearly Price (₹ INR)<span className="text-danger"> *</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="19990"
                          value={newPlan.priceYearly}
                          onChange={(e) => setNewPlan({ ...newPlan, priceYearly: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Max Employees</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="25"
                        value={newPlan.maxEmployees}
                        onChange={(e) => setNewPlan({ ...newPlan, maxEmployees: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Max Storage (GB)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="10"
                        value={newPlan.maxStorageGb}
                        onChange={(e) => setNewPlan({ ...newPlan, maxStorageGb: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Currency</label>
                      <select
                        className="form-select"
                        value={newPlan.currency}
                        onChange={(e) => setNewPlan({ ...newPlan, currency: e.target.value })}
                      >
                        <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Country</label>
                      <select
                        className="form-select"
                        value={newPlan.country}
                        onChange={(e) => setNewPlan({ ...newPlan, country: e.target.value })}
                      >
                        <option value="India">India 🇮🇳</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">State / Region</label>
                      <select
                        className="form-select"
                        value={newPlan.state}
                        onChange={(e) => setNewPlan({ ...newPlan, state: e.target.value })}
                      >
                        <option value="All India">All India</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Rajasthan">Rajasthan</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Status<span className="text-danger"> *</span></label>
                      <select
                        className="form-select"
                        value={newPlan.isActive ? 'Active' : 'Inactive'}
                        onChange={(e) => setNewPlan({ ...newPlan, isActive: e.target.value === 'Active' })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="mb-0">Plan Modules &amp; Features</h6>
                      <div className="form-check d-flex align-items-center">
                        <input
                          className="form-check-input me-1"
                          type="checkbox"
                          id="selectAllModulesCheck"
                          checked={newPlan.features.length === availableModules.length}
                          onChange={(e) => handleSelectAllModules(e.target.checked)}
                        />
                        <label className="form-check-label text-dark fw-medium" htmlFor="selectAllModulesCheck">
                          Select All
                        </label>
                      </div>
                    </div>
                    <div className="row bg-light rounded p-3 mb-3">
                      {availableModules.map((mod) => (
                        <div className="col-lg-3 col-sm-6 mb-2" key={mod}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`mod_${mod}`}
                              checked={newPlan.features.includes(mod)}
                              onChange={() => handleModuleToggle(mod)}
                            />
                            <label className="form-check-label text-dark" htmlFor={`mod_${mod}`}>
                              {mod}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Additional Features (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Custom Domain, Priority HR Support, Audit Logs"
                        value={customFeature}
                        onChange={(e) => setCustomFeature(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Short description of this subscription plan..."
                        value={newPlan.description}
                        onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
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
                  Save &amp; Add Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Plan */}
      {/* Edit Plan */}
      <div className="modal fade" id="edit_plans">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Plan</h4>
              <button
                type="button"
                id="close_edit_plans_modal"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEditPlanSubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Plan Name<span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Starter Plan"
                        value={editingPlan.name}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Plan Code / Identifier
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingPlan.code}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Monthly Price (₹ INR)<span className="text-danger"> *</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          value={editingPlan.priceMonthly}
                          onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Yearly Price (₹ INR)<span className="text-danger"> *</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          value={editingPlan.priceYearly}
                          onChange={(e) => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Max Employees</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editingPlan.maxEmployees}
                        onChange={(e) => setEditingPlan({ ...editingPlan, maxEmployees: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Max Storage (GB)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editingPlan.maxStorageGb}
                        onChange={(e) => setEditingPlan({ ...editingPlan, maxStorageGb: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Status<span className="text-danger"> *</span></label>
                      <select
                        className="form-select"
                        value={editingPlan.isActive ? 'Active' : 'Inactive'}
                        onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.value === 'Active' })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-lg-12">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="mb-0">Plan Modules &amp; Features</h6>
                      <div className="form-check d-flex align-items-center">
                        <input
                          className="form-check-input me-1"
                          type="checkbox"
                          id="editSelectAllModulesCheck"
                          checked={editingPlan.features?.length === availableModules.length}
                          onChange={(e) => handleEditSelectAllModules(e.target.checked)}
                        />
                        <label className="form-check-label text-dark fw-medium" htmlFor="editSelectAllModulesCheck">
                          Select All
                        </label>
                      </div>
                    </div>
                    <div className="row bg-light rounded p-3 mb-3">
                      {availableModules.map((mod) => (
                        <div className="col-lg-3 col-sm-6 mb-2" key={mod}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`edit_mod_${mod}`}
                              checked={editingPlan.features?.includes(mod)}
                              onChange={() => handleEditModuleToggle(mod)}
                            />
                            <label className="form-check-label text-dark" htmlFor={`edit_mod_${mod}`}>
                              {mod}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Description of this subscription plan..."
                        value={editingPlan.description}
                        onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
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
      {/* /Edit Plan */}
    </>
  )
}

export default Packages