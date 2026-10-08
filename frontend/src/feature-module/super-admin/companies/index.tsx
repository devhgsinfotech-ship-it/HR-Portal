import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Table from "../../../core/common/dataTable/index";
import ReactApexChart from 'react-apexcharts';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import React from 'react';
import apiClient from '../../../core/utils/apiClient';

type PasswordField = "password" | "confirmPassword";

const Companies = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    pendingDomains: 0
  });
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);

  // Modal selections
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // Forms
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    subdomain: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    planId: '',
    billingCycle: 'MONTHLY',
    status: 'ACTIVE'
  });

  const [editForm, setEditForm] = useState({
    id: 0,
    name: '',
    email: '',
    subdomain: '',
    phone: '',
    address: '',
    isActive: true
  });

  const [upgradeForm, setUpgradeForm] = useState({
    companyId: 0,
    companyName: '',
    currentPlanName: '',
    planId: '',
    billingCycle: 'MONTHLY',
    amount: '0'
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/subscriptions/companies');
      if (res.data) {
        setCompanies(res.data.companies || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err: any) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await apiClient.get('/subscriptions/plans');
      if (res.data && Array.isArray(res.data)) {
        setPlans(res.data);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchPlans();
  }, []);

  const handleAddCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addForm.password && addForm.password !== addForm.confirmPassword) {
      setMessage({ type: 'danger', text: 'Passwords do not match!' });
      return;
    }
    try {
      const res = await apiClient.post('/subscriptions/companies', addForm);
      setMessage({ type: 'success', text: res.data?.message || 'Company created successfully!' });
      fetchCompanies();
      setAddForm({
        name: '', email: '', subdomain: '', phone: '', password: '', confirmPassword: '', address: '', planId: '', billingCycle: 'MONTHLY', status: 'ACTIVE'
      });
      // Close modal programmatically
      const closeBtn = document.getElementById('close-add-modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to create company' });
    }
  };

  const handleEditCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.put(`/subscriptions/companies/${editForm.id}`, editForm);
      setMessage({ type: 'success', text: res.data?.message || 'Company updated successfully!' });
      fetchCompanies();
      const closeBtn = document.getElementById('close-edit-modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update company' });
    }
  };

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetPlanId = upgradeForm.planId || (plans[0]?.id ? String(plans[0].id) : '');
      const res = await apiClient.post(`/subscriptions/companies/${upgradeForm.companyId}/change-plan`, {
        planId: targetPlanId,
        billingCycle: upgradeForm.billingCycle
      });
      setMessage({ type: 'success', text: res.data?.message || 'Plan upgraded successfully!' });
      fetchCompanies();
      const closeBtn = document.getElementById('close-upgrade-modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to upgrade plan' });
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedCompany) return;
    try {
      const res = await apiClient.delete(`/subscriptions/companies/${selectedCompany.id}`);
      setMessage({ type: 'success', text: res.data?.message || 'Company deactivated successfully!' });
      fetchCompanies();
      const closeBtn = document.getElementById('close-delete-modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to delete company' });
    }
  };

  const openUpgradeModal = (record: any) => {
    setSelectedCompany(record);
    setUpgradeForm({
      companyId: record.id,
      companyName: record.name,
      currentPlanName: record.planName || 'Starter',
      planId: record.planId ? String(record.planId) : (plans[0]?.id ? String(plans[0].id) : ''),
      billingCycle: record.billingCycle || 'MONTHLY',
      amount: '200'
    });
  };

  const openEditModal = (record: any) => {
    setSelectedCompany(record);
    setEditForm({
      id: record.id,
      name: record.name,
      email: record.email,
      subdomain: record.subdomain,
      phone: record.phone || '',
      address: record.address || '',
      isActive: record.isActive
    });
  };

  const columns = [
    {
      title: "Company Name",
      dataIndex: "name",
      render: (_text: String, record: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link to="#" className="avatar avatar-md border rounded-circle">
            <ImageWithBasePath
              src={record.logoUrl || "assets/img/company/company-01.svg"}
              className="img-fluid"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#" onClick={() => setSelectedCompany(record)} data-bs-toggle="modal" data-bs-target="#company_detail">
                {record.name}
              </Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a: any, b: any) => a.email.localeCompare(b.email),
    },
    {
      title: "Company Domain",
      dataIndex: "accountUrl",
      render: (text: string, record: any) => (
        <div>
          <span className="text-primary">{text}</span>
          {record.companyCode && (
            <div>
              <span className="badge badge-soft-info border fs-11 mt-1">{record.companyCode}</span>
            </div>
          )}
        </div>
      ),
      sorter: (a: any, b: any) => (a.accountUrl || '').localeCompare(b.accountUrl || ''),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      render: (_text: String, record: any) => (
        <div className="d-flex align-items-center justify-content-between">
          <p className="mb-0 me-2">{record.plan}</p>
          <button
            type="button"
            className="btn badge badge-purple badge-xs border-0"
            data-bs-toggle="modal"
            data-bs-target="#upgrade_info"
            onClick={() => openUpgradeModal(record)}
          >
            Upgrade
          </button>
        </div>
      ),
      sorter: (a: any, b: any) => a.plan.localeCompare(b.plan),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (text: string) => text ? new Date(text).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span className={`badge ${text === 'Active' ? 'badge-success' : 'badge-danger'} d-inline-flex align-items-center badge-xs`}>
          <i className="ti ti-point-filled me-1" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: any) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#company_detail"
            onClick={() => setSelectedCompany(record)}
          >
            <i className="ti ti-eye" />
          </Link>
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_company"
            onClick={() => openEditModal(record)}
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            onClick={() => setSelectedCompany(record)}
          >
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
    },
  ];

  const chartConfig = {
    series: [{ name: "Companies", data: [25, 40, 35, 50, 60, 75, 90] }],
    fill: { type: 'gradient', gradient: { opacityFrom: 0, opacityTo: 0 } },
    chart: { foreColor: '#fff', type: "area", width: 50, sparkline: { enabled: true } },
    stroke: { show: true, width: 2.5, curve: "smooth" },
    colors: ["#F26522"]
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {message && (
            <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
            </div>
          )}

          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Companies</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Super Admin</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Companies List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_company"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Company
                </Link>
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          <div className="row">
            {/* Total Companies */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="avatar avatar-lg bg-primary flex-shrink-0">
                      <i className="ti ti-building fs-16" />
                    </span>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">Total Companies</p>
                      <h4>{stats.totalCompanies}</h4>
                    </div>
                  </div>
                  <ReactApexChart options={chartConfig as any} series={chartConfig.series} type="area" width={50} />
                </div>
              </div>
            </div>

            {/* Active Companies */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="avatar avatar-lg bg-success flex-shrink-0">
                      <i className="ti ti-building-check fs-16" />
                    </span>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">Active Companies</p>
                      <h4>{stats.activeCompanies}</h4>
                    </div>
                  </div>
                  <ReactApexChart options={chartConfig as any} series={chartConfig.series} type="area" width={50} />
                </div>
              </div>
            </div>

            {/* Inactive Companies */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="avatar avatar-lg bg-danger flex-shrink-0">
                      <i className="ti ti-building-x fs-16" />
                    </span>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">Inactive Companies</p>
                      <h4>{stats.inactiveCompanies}</h4>
                    </div>
                  </div>
                  <ReactApexChart options={chartConfig as any} series={chartConfig.series} type="area" width={50} />
                </div>
              </div>
            </div>

            {/* Pending Domains */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="avatar avatar-lg bg-info flex-shrink-0">
                      <i className="ti ti-world fs-16" />
                    </span>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">Pending Domains</p>
                      <h4>{stats.pendingDomains}</h4>
                    </div>
                  </div>
                  <ReactApexChart options={chartConfig as any} series={chartConfig.series} type="area" width={50} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Companies List</h5>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center">Loading companies...</div>
              ) : (
                <Table dataSource={companies} columns={columns} Selection={true} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Company Modal */}
      <div className="modal fade" id="add_company">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Company</h4>
              <button
                id="close-add-modal"
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddCompanySubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Company Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Subdomain (e.g. 'mycompany')</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Leave blank to auto-generate"
                        value={addForm.subdomain}
                        onChange={(e) => setAddForm({ ...addForm, subdomain: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.phone}
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={addForm.address}
                        onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Password</label>
                      <div className="pass-group">
                        <input
                          type={passwordVisibility.password ? "text" : "password"}
                          className="pass-input form-control"
                          value={addForm.password}
                          onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                        />
                        <span
                          className={`ti toggle-passwords ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"}`}
                          onClick={() => togglePasswordVisibility("password")}
                        ></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Confirm Password</label>
                      <div className="pass-group">
                        <input
                          type={passwordVisibility.confirmPassword ? "text" : "password"}
                          className="pass-input form-control"
                          value={addForm.confirmPassword}
                          onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                        />
                        <span
                          className={`ti toggle-passwords ${passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"}`}
                          onClick={() => togglePasswordVisibility("confirmPassword")}
                        ></span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Subscription Plan</label>
                      <select
                        className="form-select"
                        value={addForm.planId}
                        onChange={(e) => setAddForm({ ...addForm, planId: e.target.value })}
                      >
                        <option value="">Default (Starter Plan)</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Billing Cycle</label>
                      <select
                        className="form-select"
                        value={addForm.billingCycle}
                        onChange={(e) => setAddForm({ ...addForm, billingCycle: e.target.value })}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Company</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Company Modal */}
      <div className="modal fade" id="edit_company">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Company</h4>
              <button
                id="close-edit-modal"
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEditCompanySubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Subdomain</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.subdomain}
                        onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={editForm.isActive ? 'active' : 'inactive'}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Upgrade Package Modal */}
      <div className="modal fade" id="upgrade_info">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Upgrade Company Plan</h4>
              <button
                id="close-upgrade-modal"
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="p-3 mb-1">
              <div className="rounded bg-light p-3">
                <h5 className="mb-3">Current Company</h5>
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <p className="fs-12 mb-0">Company Name</p>
                    <p className="text-gray-9 fw-semibold">{upgradeForm.companyName || selectedCompany?.name}</p>
                  </div>
                  <div className="col-md-6">
                    <p className="fs-12 mb-0">Current Plan</p>
                    <p className="text-gray-9 fw-semibold">{selectedCompany?.plan || upgradeForm.currentPlanName}</p>
                  </div>
                </div>
              </div>
            </div>
            <form onSubmit={handleUpgradeSubmit}>
              <div className="modal-body pb-0">
                <h5 className="mb-4">Select New Plan</h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Target Plan <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={upgradeForm.planId}
                        onChange={(e) => setUpgradeForm({ ...upgradeForm, planId: e.target.value })}
                        required
                      >
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Billing Cycle <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={upgradeForm.billingCycle}
                        onChange={(e) => setUpgradeForm({ ...upgradeForm, billingCycle: e.target.value })}
                      >
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Company Detail Modal */}
      <div className="modal fade" id="company_detail">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Company Detail</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              {selectedCompany ? (
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <strong>Company Name:</strong>
                    <div>{selectedCompany.name}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Email:</strong>
                    <div>{selectedCompany.email}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Company Domain:</strong>
                    <div className="text-primary">{selectedCompany.accountUrl}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Subscription Plan:</strong>
                    <div>{selectedCompany.plan}</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Status:</strong>
                    <div>
                      <span className={`badge ${selectedCompany.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {selectedCompany.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong>Created At:</strong>
                    <div>{new Date(selectedCompany.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div>No company selected</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete / Deactivate Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <i className="ti ti-trash fs-48 text-danger mb-3" />
              <h5>Deactivate Company?</h5>
              <p className="text-muted">Are you sure you want to deactivate "{selectedCompany?.name}"?</p>
              <div className="d-flex justify-content-center mt-3">
                <button id="close-delete-modal" type="button" className="btn btn-light me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteSubmit}>Deactivate</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Companies;