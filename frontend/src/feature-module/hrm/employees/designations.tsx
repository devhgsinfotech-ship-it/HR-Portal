import React, { useState, useEffect } from 'react';
import { all_routes } from '../../../router/all_routes'
import { Link } from 'react-router-dom'
import Table from "../../../core/common/dataTable/index";
import apiClient from "../../../core/utils/apiClient";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';

// Add type for designation data
interface DesignationData {
  id: number;
  Designation: string;
  NoOfEmployees: string;
  Status: string;
  actions?: string;
}

const Designations = () => {
  const [designations, setDesignations] = useState<DesignationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [newDesigName, setNewDesigName] = useState("");
  const [editDesigId, setEditDesigId] = useState<number | null>(null);
  const [editDesigName, setEditDesigName] = useState("");
  const [deleteDesigId, setDeleteDesigId] = useState<number | null>(null);

  const defaultDesignations = [
    { id: 1, Designation: "WordPress Integrator III", NoOfEmployees: "6", Status: "Active" },
    { id: 2, Designation: "Frontend Developer", NoOfEmployees: "10", Status: "Active" },
    { id: 3, Designation: "UI/UX Designer", NoOfEmployees: "4", Status: "Active" },
    { id: 4, Designation: "HR Executive", NoOfEmployees: "3", Status: "Active" }
  ];

  const fetchDesignations = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/designations');
      
      if (response.data && response.data.length > 0) {
        const formattedData = response.data.map((desig: any) => ({
          id: desig.id,
          Designation: desig.name,
          NoOfEmployees: desig._count?.employees?.toString() || "0",
          Status: "Active",
        }));
        setDesignations(formattedData);
      } else {
        setDesignations(defaultDesignations);
      }
    } catch (error) {
      console.error("Failed to fetch designations", error);
      setDesignations(defaultDesignations);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  const handleAddDesignation = async () => {
    if (!newDesigName) return;
    try {
      await apiClient.post('/designations', { name: newDesigName });
      setNewDesigName("");
      fetchDesignations();
    } catch (error) {
      console.error("Failed to add designation", error);
      alert("Failed to add designation");
    }
  };

  const handleEditDesignation = async () => {
    if (!editDesigId || !editDesigName) return;
    try {
      await apiClient.put(`/designations/${editDesigId}`, { name: editDesigName });
      setEditDesigId(null);
      setEditDesigName("");
      fetchDesignations();
    } catch (error) {
      console.error("Failed to update designation", error);
      alert("Failed to update designation");
    }
  };

  const handleDeleteDesignation = async () => {
    if (!deleteDesigId) return;
    try {
      await apiClient.delete(`/designations/${deleteDesigId}`);
      setDeleteDesigId(null);
      fetchDesignations();
    } catch (error: any) {
      console.error("Failed to delete designation", error);
      alert(error.response?.data?.message || "Failed to delete designation");
    }
  };
  const columns = [
    {
      title: "Designation",
      dataIndex: "Designation",
      render: (text: string, _record: DesignationData) => (
        <h6 className="fw-medium fs-14 text-dark">{text}</h6>
      ),
      sorter: (a: DesignationData, b: DesignationData) => a.Designation.length - b.Designation.length,
    },
    // Removed Department column as per schema
    {
      title: "No of Employees",
      dataIndex: "NoOfEmployees",
      sorter: (a: DesignationData, b: DesignationData) => a.NoOfEmployees.length - b.NoOfEmployees.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, _record: DesignationData) => (
        <span className={`badge ${text === 'Active' ? 'badge-success' : 'badge-danger'} d-inline-flex align-items-center badge-xs`}>
          <i className="ti ti-point-filled me-1" />
          {text}
        </span>
      ),
      sorter: (a: DesignationData, b: DesignationData) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: (text: string, _record: DesignationData) => (
        <div className="action-icon d-inline-flex">
          <button
            type="button"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_designation"
            aria-label="Edit designation"
            onClick={() => {
              setEditDesigId(_record.id);
              setEditDesigName(_record.Designation);
            }}
          >
            <i className="ti ti-edit" />
          </button>
          <button
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#delete_modal"
            aria-label="Delete designation"
            onClick={() => setDeleteDesigId(_record.id)}
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
              <h2 className="mb-1">Designations</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Employee</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Designations
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
                  data-bs-target="#add_designation"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Designation
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
              <h5>Designation List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown me-3">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Department
                  </button>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Finance
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item rounded-1"
                      >
                        Application Development
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="dropdown me-3">
                  <button
                    type="button"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
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
                <div className="p-4 text-center">Loading designations...</div>
              ) : (
                <Table dataSource={designations} columns={columns} Selection={true} />
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
      {/* Add Designation */}
      <div className="modal fade" id="add_designation">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Designation</h4>
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
                      <label className="form-label">Designation Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={newDesigName}
                        onChange={(e) => setNewDesigName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    {/* Status and Department inputs removed */}
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
                <button 
                  type="button" 
                  data-bs-dismiss="modal" 
                  className="btn btn-primary"
                  onClick={handleAddDesignation}
                >
                  Add Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Designation */}
      {/* Edit Designation */}
      <div className="modal fade" id="edit_designation">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Designation</h4>
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
                      <label className="form-label">Designation Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editDesigName}
                        onChange={(e) => setEditDesigName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    {/* Status and Department inputs removed */}
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
                <button 
                  type="button" 
                  data-bs-dismiss="modal" 
                  className="btn btn-primary"
                  onClick={handleEditDesignation}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Designation */}
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
                Are you sure you want to delete this designation? This action cannot be undone.
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
                  onClick={handleDeleteDesignation}
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

export default Designations
