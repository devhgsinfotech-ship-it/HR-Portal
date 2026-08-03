import React, { useState, useEffect } from 'react';
import { all_routes } from '../../../router/all_routes'
import { Link } from 'react-router-dom'
import Table from "../../../core/common/dataTable/index";
import apiClient from "../../../core/utils/apiClient";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';

// Add type for department data
interface DepartmentData {
  id: number;
  Department: string;
  NoOfEmployees: string;
  Status: string;
  actions?: string;
}

const Department = () => {
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [newDeptName, setNewDeptName] = useState("");
  const [editDeptId, setEditDeptId] = useState<number | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/departments');
      
      // Map API response to table format
      const formattedData = response.data.map((dept: any) => ({
        id: dept.id,
        Department: dept.name,
        NoOfEmployees: dept._count?.employees?.toString() || "0",
        Status: "Active", // Future proofing: you could add an isActive flag to the DB
      }));
      setDepartments(formattedData);
    } catch (error) {
      console.error("Failed to fetch departments", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async () => {
    if (!newDeptName) return;
    try {
      await apiClient.post('/departments', { name: newDeptName });
      setNewDeptName("");
      fetchDepartments(); // Refresh list
    } catch (error) {
      console.error("Failed to add department", error);
      alert("Failed to add department");
    }
  };

  const handleEditDepartment = async () => {
    if (!editDeptId || !editDeptName) return;
    try {
      await apiClient.put(`/departments/${editDeptId}`, { name: editDeptName });
      setEditDeptId(null);
      setEditDeptName("");
      fetchDepartments(); // Refresh list
    } catch (error) {
      console.error("Failed to update department", error);
      alert("Failed to update department");
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deleteDeptId) return;
    try {
      await apiClient.delete(`/departments/${deleteDeptId}`);
      setDeleteDeptId(null);
      fetchDepartments(); // Refresh list
    } catch (error: any) {
      console.error("Failed to delete department", error);
      alert(error.response?.data?.message || "Failed to delete department");
    }
  };
  const columns = [
    {
      title: "Department",
      dataIndex: "Department",
      render: (text: string, _record: DepartmentData) => (
        <h6 className="fw-medium">
          {text}
        </h6>
      ),
      sorter: (a: DepartmentData, b: DepartmentData) => a.Department.length - b.Department.length,
    },
    {
      title: "No of Employees",
      dataIndex: "NoOfEmployees",
      sorter: (a: DepartmentData, b: DepartmentData) => a.NoOfEmployees.length - b.NoOfEmployees.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, _record: DepartmentData) => (
        <span className={`badge ${text === 'Active' ? 'badge-success' : 'badge-danger'} d-inline-flex align-items-center badge-xs`}>
          <i className="ti ti-point-filled me-1" />
          {text}
        </span>
      ),
      sorter: (a: DepartmentData, b: DepartmentData) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: (text: string, _record: DepartmentData) => (
        <div className="action-icon d-inline-flex">
          <button
            type="button"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_department"
            aria-label="Edit department"
            onClick={() => {
              setEditDeptId(_record.id);
              setEditDeptName(_record.Department);
            }}
          >
            <i className="ti ti-edit" />
          </button>
          <button
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            aria-label="Delete department"
            onClick={() => setDeleteDeptId(_record.id)}
          >
            <i className="ti ti-trash" />
          </button>
        </div>
      ),
    },
  ]
  const statusChoose = [
    { value: "Select", label: "Select" },
    { value: "All Department", label: "All Department" },
    { value: "Finance", label: "Finance" },
    { value: "Developer", label: "Developer" },
    { value: "Executive", label: "Executive" },
  ];
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Departments</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Employee</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Departments
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
                  data-bs-target="#add_department"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Department
                </button>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Performance Indicator list */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Department List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-3">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Status
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Active
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Inactive
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
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
              {isLoading ? (
                <div className="p-4 text-center">Loading departments...</div>
              ) : (
                <Table dataSource={departments} columns={columns} Selection={true} />
              )}
            </div>
          </div>
          {/* /Performance Indicator list */}
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
      {/* Add Department */}
      <div className="modal fade" id="add_department">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Department</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Department Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Status removed as it's not dynamic yet */}
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
                <button 
                  type="button" 
                  data-bs-dismiss="modal" 
                  className="btn btn-primary"
                  onClick={handleAddDepartment}
                >
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Department */}
      {/* Edit Department */}
      <div className="modal fade" id="edit_department">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Department</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Department Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editDeptName}
                        onChange={(e) => setEditDeptName(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Status removed as it's not dynamic yet */}
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
                <button 
                  type="button" 
                  data-bs-dismiss="modal" 
                  className="btn btn-primary"
                  onClick={handleEditDepartment}
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Department */}

      {/* Delete Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3">
                Are you sure you want to delete this department? This action cannot be undone.
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
                  data-bs-dismiss="modal"
                  onClick={handleDeleteDepartment}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Modal */}
    </>


  )
}

export default Department
