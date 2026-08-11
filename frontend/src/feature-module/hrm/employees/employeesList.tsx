import { useState, useMemo, useCallback } from "react";
import { all_routes } from "../../../router/all_routes";
import { Link } from "react-router-dom";
import { getSubdomain } from "../../../core/utils/apiClient";
import apiClient from "../../../core/utils/apiClient";
import { useEffect } from "react";
import Table from "../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import PredefinedDateRanges from "../../../core/common/datePicker";
import { employee_list_details } from "../../../core/data/json/employees_list_details";
import { DatePicker } from "antd";
import CommonSelect from "../../../core/common/commonSelect";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import dayjs from "dayjs";
import VerifyEmployeeModal from "./VerifyEmployeeModal";

type PasswordField = "password" | "confirmPassword";

// Define an interface for employee data
interface Employee {
  id?: string | number;
  raw?: any;
  EmpId: string;
  Name: string;
  Image: string;
  CurrentRole: string;
  Email: string;
  Phone: string;
  Designation: string;
  JoiningDate: string;
  Status: string;
  onboardingStatus?: string;
  aadhaarPath?: string;
  panPath?: string;
  resumePath?: string;
}

const PAGE_SIZE = 50; // Number of employees to load per page

const EmployeeList = () => {
  const [allData] = useState<Employee[]>(employee_list_details);
  const [visibleData, setVisibleData] = useState<Employee[]>(
    allData.slice(0, PAGE_SIZE)
  );
  const [hasMore, setHasMore] = useState<boolean>(allData.length > PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [verifyEmp, setVerifyEmp] = useState<any>(null);
  
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbDesignations, setDbDesignations] = useState<any[]>([]);
  const [newEmp, setNewEmp] = useState({ 
    firstName: '', lastName: '', email: '', phone: '', departmentId: '', designationId: '', dateOfJoining: '', role: 'EMPLOYEE', reportingManagerId: '',
    basic: 0, hra: 0, conveyance: 0, medicalAllowance: 0, specialAllowance: 0,
    pfDeduction: 0, professionalTax: 0, otherDeductions: 0,
    grossSalary: 0, netSalary: 0
  });
  const [editEmp, setEditEmp] = useState<any>({ id: '', firstName: '', lastName: '', email: '', phone: '', departmentId: '', designationId: '', dateOfJoining: '', profilePhotoUrl: '', employeeCode: '', username: '', company: '', password: '', confirmPassword: '', role: 'EMPLOYEE', reportingManagerId: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [newEmpFile, setNewEmpFile] = useState<File | null>(null);
  const [editEmpFile, setEditEmpFile] = useState<File | null>(null);
  const [deleteEmpId, setDeleteEmpId] = useState<string | number | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ available?: boolean, suggestion?: string, checking?: boolean }>({});
  const [isEmailEdited, setIsEmailEdited] = useState(false);

  useEffect(() => {
    if (!newEmp.email) {
      setEmailStatus({});
      return;
    }
    const timer = setTimeout(async () => {
      setEmailStatus({ checking: true });
      try {
        const res = await apiClient.get(`/employees/check-email?email=${newEmp.email}`);
        setEmailStatus({ available: res.data.available, suggestion: res.data.suggestion, checking: false });
      } catch (err) {
        setEmailStatus({ checking: false });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [newEmp.email]);

  const fetchData = async () => {
    try {
      const [empRes, deptRes, desigRes] = await Promise.all([
        apiClient.get('/employees'),
        apiClient.get('/departments'),
        apiClient.get('/designations')
      ]);
      const mappedEmployees = empRes.data.map((emp: any) => ({
        key: emp.id,
        id: emp.id,
        EmpId: emp.employeeCode || emp.employeeId || 'N/A',
        Name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        Image: emp.profilePhotoUrl || 'avatar-20.jpg',
        CurrentRole: emp.designation?.name || 'N/A',
        Email: emp.user?.email || emp.email || 'N/A',
        Phone: emp.phone || 'N/A',
        Designation: emp.designation?.name || 'N/A',
        JoiningDate: emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : 'N/A',
        Status: emp.onboardingStatus === 'DOCS_SUBMITTED' ? 'Pending Verification' : emp.onboardingStatus === 'COMPLETED' ? 'Active' : emp.onboardingStatus,
        onboardingStatus: emp.onboardingStatus,
        aadhaarPath: emp.aadhaarPath,
        panPath: emp.panPath,
        resumePath: emp.resumePath,
        raw: emp
      }));
      setDbEmployees(mappedEmployees);
      setDbDepartments(deptRes.data.map((d: any) => ({ value: d.id, label: d.name })));
      setDbDesignations(desigRes.data.map((d: any) => ({ value: d.id, label: d.name })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmployee = async (e: any) => {
    e.preventDefault();
    if (emailStatus.available === false) {
      setErrorMsg('Please choose an available email address.');
      return;
    }
    try {
      const formData = new FormData();
      Object.entries(newEmp).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      if (newEmpFile) formData.append('profileImage', newEmpFile);

      await apiClient.post('/employees', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Close modal programmatically
      const modal = document.getElementById('add_employee');
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
      }
      fetchData();
      setNewEmp({ 
        firstName: '', lastName: '', email: '', phone: '', departmentId: '', designationId: '', dateOfJoining: '', role: 'EMPLOYEE', reportingManagerId: '',
        basic: 0, hra: 0, conveyance: 0, medicalAllowance: 0, specialAllowance: 0, pfDeduction: 0, professionalTax: 0, otherDeductions: 0, grossSalary: 0, netSalary: 0
      });
      setNewEmpFile(null);
      setEmailStatus({});
      setIsEmailEdited(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error adding employee');
    }
  };

  const handleEditEmployee = async (e: any) => {
    e.preventDefault();
    if (editEmp.password && editEmp.password !== editEmp.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    try {
      const formData = new FormData();
      Object.entries(editEmp).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'confirmPassword') {
          formData.append(key, String(value));
        }
      });
      if (editEmpFile) formData.append('profileImage', editEmpFile);

      await apiClient.put(`/employees/${editEmp.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Close modal programmatically
      const modal = document.getElementById('edit_employee');
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
      }
      fetchData();
      setEditEmpFile(null);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error updating employee');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteEmpId) return;
    try {
      await apiClient.delete(`/employees/${deleteEmpId}`);
      const modal = document.getElementById('delete_employee_modal');
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
      }
      fetchData();
      setDeleteEmpId(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error deleting employee');
    }
  };


  const columns = [
    {
      title: "Emp ID",
      dataIndex: "EmpId",
      render: (text: string) => (
        <Link to={all_routes.employeedetails}>{text}</Link>
      ),
      sorter: (a: Employee, b: Employee) => a.EmpId.length - b.EmpId.length,
    },
    {
      title: "Name",
      dataIndex: "Name",
      render: (_text: string, record: Employee) => (
        <div className="d-flex align-items-center">
          <Link
            to={all_routes.employeedetails}
            className="avatar avatar-md"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#view_details"
          >
            {record.Image && (record.Image.startsWith('/') || record.Image.startsWith('http')) ? (
              <img
                src={record.Image.startsWith('http') ? record.Image : `${apiClient.defaults.baseURL}${record.Image}`}
                className="img-fluid rounded-circle"
                alt={`${record.Name}'s profile image`}
                style={{ width: "36px", height: "36px", objectFit: "cover" }}
              />
            ) : (
              <ImageWithBasePath
                src={`assets/img/users/${record.Image || 'avatar-20.jpg'}`}
                className="img-fluid rounded-circle"
                alt={`${record.Name}'s profile image`}
              />
            )}
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0">
              <Link
                to={all_routes.employeedetails}
                data-bs-toggle="modal"
                data-inert={true}
                data-bs-target="#view_details"
              >
                {record.Name}
              </Link>
            </p>
            <span className="fs-12">{record.CurrentRole}</span>
          </div>
        </div>
      ),
      sorter: (a: Employee, b: Employee) => a.Name.length - b.Name.length,
    },
    {
      title: "Email",
      dataIndex: "Email",
      sorter: (a: Employee, b: Employee) => a.Email.length - b.Email.length,
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      sorter: (a: Employee, b: Employee) => a.Phone.length - b.Phone.length,
    },
    {
      title: "Designation",
      dataIndex: "Designation",
      render: (_text: string, record: Employee) => (
        <div className="dropdown me-3">
          <Link
            to="#"
            className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
            data-bs-toggle="dropdown"
          >
            {record.Designation}
          </Link>
          <ul className="dropdown-menu  dropdown-menu-end p-3">
            <li>
              <Link to="#" className="dropdown-item rounded-1">
                Finance
              </Link>
            </li>
            <li>
              <Link to="#" className="dropdown-item rounded-1">
                Executive
              </Link>
            </li>
            <li>
              <Link to="#" className="dropdown-item rounded-1">
                Developer
              </Link>
            </li>
            <li>
              <Link to="#" className="dropdown-item rounded-1">
                Manager
              </Link>
            </li>
          </ul>
        </div>
      ),
      sorter: (a: Employee, b: Employee) =>
        a.Designation.length - b.Designation.length,
    },
    {
      title: "Joining Date",
      dataIndex: "JoiningDate",
      sorter: (a: Employee, b: Employee) =>
        a.JoiningDate.length - b.JoiningDate.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        let badgeClass = "badge-danger";
        if (text === "Active" || text === "COMPLETED") badgeClass = "badge-success";
        else if (text === "Pending Verification") badgeClass = "badge-warning";
        else if (text === "INVITED") badgeClass = "badge-info";

        return (
          <span className={`badge ${badgeClass} d-inline-flex align-items-center badge-xs`}>
            <i className="ti ti-point-filled me-1" />
            {text}
          </span>
        );
      },
      sorter: (a: Employee, b: Employee) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: (_text: any, record: Employee) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#edit_employee"
            onClick={() => setEditEmp({
              id: record.id,
              firstName: record.raw?.firstName || '',
              lastName: record.raw?.lastName || '',
              email: record.raw?.user?.email || record.raw?.email || '',
              phone: record.raw?.phone || '',
              departmentId: record.raw?.departmentId || '',
              designationId: record.raw?.designationId || '',
              dateOfJoining: record.raw?.dateOfJoining ? new Date(record.raw.dateOfJoining).toISOString().split('T')[0] : '',
              profilePhotoUrl: record.raw?.profilePhotoUrl || '',
              employeeCode: record.raw?.employeeCode || '',
              username: record.raw?.user?.name || '',
              company: record.raw?.user?.company?.name || '',
              role: record.raw?.user?.role || 'EMPLOYEE',
              reportingManagerId: record.raw?.reportingManagerId || '',
              password: '',
              confirmPassword: '',
              basic: record.raw?.salaryStructure?.basic || 0,
              hra: record.raw?.salaryStructure?.hra || 0,
              conveyance: record.raw?.salaryStructure?.conveyance || 0,
              medicalAllowance: record.raw?.salaryStructure?.medicalAllowance || 0,
              specialAllowance: record.raw?.salaryStructure?.specialAllowance || 0,
              pfDeduction: record.raw?.salaryStructure?.pfDeduction || 0,
              professionalTax: record.raw?.salaryStructure?.professionalTax || 0,
              otherDeductions: record.raw?.salaryStructure?.otherDeductions || 0,
              grossSalary: record.raw?.salaryStructure?.grossSalary || 0,
              netSalary: record.raw?.salaryStructure?.netSalary || 0
            })}
          >
            <i className="ti ti-edit" />
          </Link>
          {record.onboardingStatus === 'DOCS_SUBMITTED' && (
            <Link
              to="#"
              className="ms-2 text-warning"
              title="Review & Approve Onboarding"
              onClick={(e) => {
                e.preventDefault();
                setVerifyEmp(record);
                // Force open the modal using standard Bootstrap API
                const modalEl = document.getElementById('verify_employee_modal');
                if (modalEl) {
                  // @ts-ignore
                  const modal = window.bootstrap?.Modal?.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
                  modal.show();
                }
              }}
            >
              <i className="ti ti-check" />
            </Link>
          )}
          <Link
            to="#"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#delete_employee_modal"
            onClick={() => setDeleteEmpId(record.id || null)}
          >
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
    },
  ];

  // Infinite scroll load more handler
  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    setTimeout(() => {
      setVisibleData((prev) => {
        const next = allData.slice(prev.length, prev.length + PAGE_SIZE);
        if (next.length < PAGE_SIZE) setHasMore(false);
        return [...prev, ...next];
      });
      setLoading(false);
    }, 500); // Simulate network delay
  }, [loading, hasMore, allData]);


  const department = [
    { value: "Select", label: "Select" },
    { value: "All Department", label: "All Department" },
    { value: "Finance", label: "Finance" },
    { value: "Developer", label: "Developer" },
    { value: "Executive", label: "Executive" },
  ];
  const designation = [
    { value: "Select", label: "Select" },
    { value: "Finance", label: "Finance" },
    { value: "Developer", label: "Developer" },
    { value: "Executive", label: "Executive" },
  ];

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

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

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Employee</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Employee</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Employee List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={all_routes.employeeList}
                    className="btn btn-icon btn-sm active bg-primary text-white me-1"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={all_routes.employeeGrid}
                    className="btn btn-icon btn-sm"
                  >
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
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
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
                  data-inert={true}
                  data-bs-target="#add_employee"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Employee
                </Link>
              </div>
              <div className="head-icons ms-2">
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
                      <span className="avatar avatar-lg bg-dark rounded-circle">
                        <i className="ti ti-users" />
                      </span>
                    </div>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Total Employee
                      </p>
                      <h4>1007</h4>
                    </div>
                  </div>
                  <div>
                    <span className="badge badge-soft-purple badge-sm fw-normal">
                      <i className="ti ti-arrow-wave-right-down" />
                      +19.01%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Total Plans */}
            {/* Total Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <span className="avatar avatar-lg bg-success rounded-circle">
                        <i className="ti ti-user-share" />
                      </span>
                    </div>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        Active
                      </p>
                      <h4>1007</h4>
                    </div>
                  </div>
                  <div>
                    <span className="badge badge-soft-primary badge-sm fw-normal">
                      <i className="ti ti-arrow-wave-right-down" />
                      +19.01%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* /Total Plans */}
            {/* Inactive Plans */}
            <div className="col-lg-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center overflow-hidden">
                    <div>
                      <span className="avatar avatar-lg bg-danger rounded-circle">
                        <i className="ti ti-user-pause" />
                      </span>
                    </div>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        InActive
                      </p>
                      <h4>1007</h4>
                    </div>
                  </div>
                  <div>
                    <span className="badge badge-soft-dark badge-sm fw-normal">
                      <i className="ti ti-arrow-wave-right-down" />
                      +19.01%
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
                      <span className="avatar avatar-lg bg-info rounded-circle">
                        <i className="ti ti-user-plus" />
                      </span>
                    </div>
                    <div className="ms-2 overflow-hidden">
                      <p className="fs-12 fw-medium mb-1 text-truncate">
                        New Joiners
                      </p>
                      <h4>67</h4>
                    </div>
                  </div>
                  <div>
                    <span className="badge badge-soft-secondary badge-sm fw-normal">
                      <i className="ti ti-arrow-wave-right-down" />
                      +19.01%
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
                    Designation
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Finance
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Developer
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Executive
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Manager
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
                      <Link to="#" className="dropdown-item rounded-1">
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
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
                      <Link to="#" className="dropdown-item rounded-1">
                        Ascending
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <Table columns={columns} dataSource={dbEmployees} Selection={false} />
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
      
      {/* Modals */}
      <VerifyEmployeeModal employee={verifyEmp} onSuccess={() => {
        fetchData();
        setVerifyEmp(null);
      }} />
      <div className="modal fade" id="delete_employee_modal" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center p-4">
              <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                <i className="ti ti-trash-x fs-36" />
              </span>
              <h4 className="mb-1">Confirm Delete</h4>
              <p className="mb-3">
                Are you sure you want to delete this employee? This action cannot be undone.
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
                  data-bs-dismiss="modal"
                  className="btn btn-danger"
                  onClick={handleDeleteEmployee}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Employee Modal */}
      
      {/* Add Employee */}
      <div className="modal fade" id="add_employee">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div className="d-flex align-items-center">
                <h4 className="modal-title me-2">Add New Employee</h4>
                <span>Employee ID : EMP -0024</span>
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee}>
              <div className="contact-grids-tab">
                <ul className="nav nav-underline" id="myTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="info-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#basic-info"
                      type="button"
                      role="tab"
                      aria-selected="true"
                    >
                      Basic Information
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="address-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#address"
                      type="button"
                      role="tab"
                      aria-selected="false"
                    >
                      Permissions
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="salary-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#salary"
                      type="button"
                      role="tab"
                      aria-selected="false"
                    >
                      Salary Details
                    </button>
                  </li>
                </ul>
              </div>
              <div className="tab-content" id="myTabContent">
                <div
                  className="tab-pane fade show active"
                  id="basic-info"
                  role="tabpanel"
                  aria-labelledby="info-tab"
                  tabIndex={0}
                >
                  <div className="modal-body pb-0 ">
{errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                    <div className="row">
                      <div className="col-md-12">
                        <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                          <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                            {newEmpFile ? (
                              <img src={URL.createObjectURL(newEmpFile)} alt="profile" className="rounded-circle" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <i className="ti ti-photo text-gray-2 fs-16" />
                            )}
                          </div>
                          <div className="profile-upload">
                            <div className="mb-2">
                              <h6 className="mb-1">Upload Profile Image</h6>
                              <p className="fs-12">
                                Image should be below 4 mb
                              </p>
                            </div>
                            <div className="profile-uploader d-flex align-items-center">
                              <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                                Upload
                                <input
                                  type="file"
                                  className="form-control image-sign"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      setNewEmpFile(e.target.files[0]);
                                    }
                                  }}
                                />
                              </div>
                              <Link to="#" className="btn btn-light btn-sm">
                                Cancel
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            First Name <span className="text-danger"> *</span>
                          </label>
                          <input type="text" className="form-control" value={newEmp.firstName} onChange={(e) => {
                            const firstName = e.target.value;
                            if (!isEmailEdited) {
                              setNewEmp({...newEmp, firstName, email: `${firstName.toLowerCase().replace(/\s+/g, '')}@${getSubdomain() || 'hgs'}.com`})
                            } else {
                              setNewEmp({...newEmp, firstName})
                            }
                          }} required />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Last Name</label>
                          <input type="text" className="form-control" value={newEmp.lastName} onChange={(e) => setNewEmp({...newEmp, lastName: e.target.value})} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Employee ID <span className="text-danger"> *</span>
                          </label>
                          <input type="text" className="form-control" value="Auto-generated" readOnly disabled />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Joining Date <span className="text-danger"> *</span>
                          </label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              format="DD-MM-YYYY"
                              getPopupContainer={getModalContainer}
                              placeholder="DD-MM-YYYY"
                              value={newEmp.dateOfJoining ? dayjs(newEmp.dateOfJoining) : null}
                              onChange={(_date: any, dateString: any) =>
                                setNewEmp({ ...newEmp, dateOfJoining: typeof dateString === 'string' ? dateString.split('-').reverse().join('-') : '' })
                              }
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-calendar text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Username <span className="text-danger"> *</span>
                          </label>
                          <input type="text" className="form-control" value={`${newEmp.firstName} ${newEmp.lastName}`.trim() || 'Auto-generated'} readOnly disabled />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Email <span className="text-danger"> *</span>
                          </label>
                          <input type="email" className={`form-control ${emailStatus.available === false ? 'is-invalid' : ''} ${emailStatus.available === true ? 'is-valid' : ''}`} value={newEmp.email} onChange={(e) => {
                            setIsEmailEdited(true);
                            setNewEmp({...newEmp, email: e.target.value});
                          }} required />
                          {emailStatus.checking && <div className="form-text text-muted">Checking availability...</div>}
                          {emailStatus.available === false && (
                            <div className="invalid-feedback d-block">
                              This email is already in use. 
                              {emailStatus.suggestion && (
                                <span> Suggestion: <a href="#" onClick={(e) => { e.preventDefault(); setNewEmp({...newEmp, email: emailStatus.suggestion!}); setIsEmailEdited(true); }}>{emailStatus.suggestion}</a></span>
                              )}
                            </div>
                          )}
                          {emailStatus.available === true && <div className="valid-feedback d-block">Email is available!</div>}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3 ">
                          <label className="form-label">
                            Password <span className="text-danger"> *</span>
                          </label>
                          <div className="pass-group">
                            <input
                              type={
                                passwordVisibility.password
                                  ? "text"
                                  : "password"
                              }
                              className="pass-input form-control"
                              value="Password@123"
                              readOnly
                              disabled
                            />
                            <span
                              className={`ti toggle-passwords ${passwordVisibility.password
                                  ? "ti-eye"
                                  : "ti-eye-off"
                                }`}
                              onClick={() =>
                                togglePasswordVisibility("password")
                              }
                            ></span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3 ">
                          <label className="form-label">
                            Confirm Password{" "}
                            <span className="text-danger"> *</span>
                          </label>
                          <div className="pass-group">
                            <input
                              type={
                                passwordVisibility.confirmPassword
                                  ? "text"
                                  : "password"
                              }
                              className="pass-input form-control"
                              value="Password@123"
                              readOnly
                              disabled
                            />
                            <span
                              className={`ti toggle-passwords ${passwordVisibility.confirmPassword
                                  ? "ti-eye"
                                  : "ti-eye-off"
                                }`}
                              onClick={() =>
                                togglePasswordVisibility("confirmPassword")
                              }
                            ></span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Phone Number <span className="text-danger"> *</span>
                          </label>
                          <input type="text" className="form-control" value={newEmp.phone} onChange={(e) => setNewEmp({...newEmp, phone: e.target.value})} />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Company<span className="text-danger"> *</span>
                          </label>
                          <input type="text" className="form-control" value="Auto-assigned to your Company" readOnly disabled />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Department</label>
                          <CommonSelect
                            className="select"
                            options={dbDepartments}
                            onChange={(opt) => setNewEmp({...newEmp, departmentId: opt?.value || ''})}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Designation</label>
                          <CommonSelect
                            className="select"
                            options={dbDesignations}
                            onChange={(opt) => setNewEmp({...newEmp, designationId: opt?.value || ''})}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Role <span className="text-danger">*</span></label>
                          <CommonSelect
                            className="select"
                            options={[
                              { value: 'EMPLOYEE', label: 'Employee' },
                              { value: 'MANAGER', label: 'Manager' },
                              { value: 'HR', label: 'HR' },
                              { value: 'SUPER_ADMIN', label: 'Super Admin' }
                            ]}
                            onChange={(opt) => setNewEmp({...newEmp, role: opt?.value || 'EMPLOYEE'})}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Reporting Manager</label>
                          <CommonSelect
                            className="select"
                            options={[{ value: '', label: '-- None --' }, ...dbEmployees.map((emp: any) => ({ value: String(emp.id), label: emp.Name }))]}
                            onChange={(opt) => setNewEmp({...newEmp, reportingManagerId: opt?.value || ''})}
                          />
                          <small className="text-muted">HR assigns who manages this employee</small>
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            About <span className="text-danger"> *</span>
                          </label>
                          <textarea
                            className="form-control"
                            rows={3}
                            defaultValue={""}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-light border me-2"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Save{" "}
                    </button>
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="salary"
                  role="tabpanel"
                  aria-labelledby="salary-tab"
                  tabIndex={0}
                >
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-12 mb-3">
                        <h6 className="fw-semibold">Allowances (Earnings)</h6>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Basic Salary</label>
                        <input type="number" className="form-control" value={newEmp.basic} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = val + newEmp.hra + newEmp.conveyance + newEmp.medicalAllowance + newEmp.specialAllowance;
                          const net = gross - (newEmp.pfDeduction + newEmp.professionalTax + newEmp.otherDeductions);
                          setNewEmp({...newEmp, basic: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">HRA</label>
                        <input type="number" className="form-control" value={newEmp.hra} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = newEmp.basic + val + newEmp.conveyance + newEmp.medicalAllowance + newEmp.specialAllowance;
                          const net = gross - (newEmp.pfDeduction + newEmp.professionalTax + newEmp.otherDeductions);
                          setNewEmp({...newEmp, hra: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Conveyance</label>
                        <input type="number" className="form-control" value={newEmp.conveyance} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = newEmp.basic + newEmp.hra + val + newEmp.medicalAllowance + newEmp.specialAllowance;
                          const net = gross - (newEmp.pfDeduction + newEmp.professionalTax + newEmp.otherDeductions);
                          setNewEmp({...newEmp, conveyance: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Medical Allowance</label>
                        <input type="number" className="form-control" value={newEmp.medicalAllowance} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = newEmp.basic + newEmp.hra + newEmp.conveyance + val + newEmp.specialAllowance;
                          const net = gross - (newEmp.pfDeduction + newEmp.professionalTax + newEmp.otherDeductions);
                          setNewEmp({...newEmp, medicalAllowance: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Special Allowance</label>
                        <input type="number" className="form-control" value={newEmp.specialAllowance} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = newEmp.basic + newEmp.hra + newEmp.conveyance + newEmp.medicalAllowance + val;
                          const net = gross - (newEmp.pfDeduction + newEmp.professionalTax + newEmp.otherDeductions);
                          setNewEmp({...newEmp, specialAllowance: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>

                      <div className="col-12 mt-3 mb-3">
                        <h6 className="fw-semibold">Deductions</h6>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">PF Deduction</label>
                        <input type="number" className="form-control" value={newEmp.pfDeduction} onChange={(e) => {
                          const val = Number(e.target.value);
                          const net = newEmp.grossSalary - (val + newEmp.professionalTax + newEmp.otherDeductions);
                          setNewEmp({...newEmp, pfDeduction: val, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Professional Tax</label>
                        <input type="number" className="form-control" value={newEmp.professionalTax} onChange={(e) => {
                          const val = Number(e.target.value);
                          const net = newEmp.grossSalary - (newEmp.pfDeduction + val + newEmp.otherDeductions);
                          setNewEmp({...newEmp, professionalTax: val, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Other Deductions</label>
                        <input type="number" className="form-control" value={newEmp.otherDeductions} onChange={(e) => {
                          const val = Number(e.target.value);
                          const net = newEmp.grossSalary - (newEmp.pfDeduction + newEmp.professionalTax + val);
                          setNewEmp({...newEmp, otherDeductions: val, netSalary: net});
                        }} />
                      </div>

                      <div className="col-12 mt-3">
                        <div className="d-flex justify-content-between p-3 bg-light rounded">
                          <div>
                            <span className="text-muted d-block">Gross Salary</span>
                            <h4 className="text-primary mb-0">₹ {newEmp.grossSalary}</h4>
                          </div>
                          <div className="text-end">
                            <span className="text-muted d-block">Net Salary</span>
                            <h4 className="text-success mb-0">₹ {newEmp.netSalary}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-light border me-2"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Save{" "}
                    </button>
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="address"
                  role="tabpanel"
                  aria-labelledby="address-tab"
                  tabIndex={0}
                >
                  <div className="modal-body">
                    <div className="card bg-light-500 shadow-none">
                      <div className="card-body d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                        <h6>Enable Options</h6>
                        <div className="d-flex align-items-center justify-content-end">
                          <div className="form-check form-switch me-2">
                            <label className="form-check-label mt-0">
                              <input
                                className="form-check-input me-2"
                                type="checkbox"
                                role="switch"
                              />
                              Enable all Module
                            </label>
                          </div>
                          <div className="form-check d-flex align-items-center">
                            <label className="form-check-label mt-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                defaultChecked
                              />
                              Select All
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="table-responsive border rounded">
                      <table className="table">
                        <tbody>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                    defaultChecked
                                  />
                                  Holidays
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Leaves
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Clients
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Projects
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Tasks
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Chats
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                    defaultChecked
                                  />
                                  Assets
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Timing Sheets
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-light border me-2"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      data-bs-toggle="modal"
                      data-inert={true}
                      data-bs-target="#success_modal"
                    >
                      Save{" "}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Employee */}
      {/* Edit Employee */}
      <div className="modal fade" id="edit_employee">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div className="d-flex align-items-center">
                <h4 className="modal-title me-2">Edit Employee</h4>
                <span>Employee ID : EMP -0024</span>
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleEditEmployee}>
              <div className="contact-grids-tab">
                <ul className="nav nav-underline" id="myTab2" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="info-tab2"
                      data-bs-toggle="tab"
                      data-bs-target="#basic-info2"
                      type="button"
                      role="tab"
                      aria-selected="true"
                    >
                      Basic Information
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="address-tab2"
                      data-bs-toggle="tab"
                      data-bs-target="#address2"
                      type="button"
                      role="tab"
                      aria-selected="false"
                    >
                      Permissions
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="salary-tab2"
                      data-bs-toggle="tab"
                      data-bs-target="#salary2"
                      type="button"
                      role="tab"
                      aria-selected="false"
                    >
                      Salary Details
                    </button>
                  </li>
                </ul>
              </div>
              <div className="tab-content" id="myTabContent2">
                <div
                  className="tab-pane fade show active"
                  id="basic-info2"
                  role="tabpanel"
                  aria-labelledby="info-tab2"
                  tabIndex={0}
                >
                  <div className="modal-body pb-0 ">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                          <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                            <img
                              src={
                                editEmpFile 
                                  ? URL.createObjectURL(editEmpFile) 
                                  : editEmp.profilePhotoUrl 
                                    ? (editEmp.profilePhotoUrl.startsWith('/') ? `${apiClient.defaults.baseURL}${editEmp.profilePhotoUrl}` : `assets/img/users/${editEmp.profilePhotoUrl}`)
                                    : "assets/img/users/user-13.jpg"
                              }
                              alt="user"
                              className="rounded-circle"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                          <div className="profile-upload">
                            <div className="mb-2">
                              <h6 className="mb-1">Upload Profile Image</h6>
                              <p className="fs-12">
                                Image should be below 4 mb
                              </p>
                            </div>
                            <div className="profile-uploader d-flex align-items-center">
                              <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                                Upload
                                <input
                                  type="file"
                                  className="form-control image-sign"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      setEditEmpFile(e.target.files[0]);
                                    }
                                  }}
                                />
                              </div>
                              <Link to="#" className="btn btn-light btn-sm">
                                Cancel
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            First Name <span className="text-danger"> *</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editEmp.firstName}
                            onChange={(e) => {
                              const firstName = e.target.value;
                              setEditEmp({...editEmp, firstName, email: `${firstName.toLowerCase().replace(/\s+/g, '')}@${getSubdomain() || 'hgs'}.com`})
                            }}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Last Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editEmp.lastName}
                            onChange={(e) => setEditEmp({...editEmp, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Employee ID <span className="text-danger"> *</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editEmp.employeeCode}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Joining Date <span className="text-danger"> *</span>
                          </label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              format="DD-MM-YYYY"
                              getPopupContainer={getModalContainer}
                              placeholder="DD-MM-YYYY"
                              value={editEmp.dateOfJoining ? dayjs(editEmp.dateOfJoining) : null}
                              onChange={(_date: any, dateString: any) =>
                                setEditEmp({ ...editEmp, dateOfJoining: typeof dateString === 'string' ? dateString.split('-').reverse().join('-') : '' })
                              }
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-calendar text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Username <span className="text-danger"> *</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editEmp.username}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Email <span className="text-danger"> *</span>
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            value={editEmp.email}
                            onChange={(e) => setEditEmp({...editEmp, email: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3 ">
                          <label className="form-label">
                            Password
                          </label>
                          <div className="pass-group">
                            <input
                              type={
                                passwordVisibility.password
                                  ? "text"
                                  : "password"
                              }
                              className="pass-input form-control"
                              placeholder="Leave blank to keep current"
                              value={editEmp.password || ''}
                              onChange={(e) => setEditEmp({ ...editEmp, password: e.target.value })}
                            />
                            <span
                              className={`ti toggle-passwords ${passwordVisibility.password
                                  ? "ti-eye"
                                  : "ti-eye-off"
                                }`}
                              onClick={() =>
                                togglePasswordVisibility("password")
                              }
                            ></span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3 ">
                          <label className="form-label">
                            Confirm Password
                          </label>
                          <div className="pass-group">
                            <input
                              type={
                                passwordVisibility.confirmPassword
                                  ? "text"
                                  : "password"
                              }
                              className="pass-input form-control"
                              placeholder="Confirm new password"
                              value={editEmp.confirmPassword || ''}
                              onChange={(e) => setEditEmp({ ...editEmp, confirmPassword: e.target.value })}
                            />
                            <span
                              className={`ti toggle-passwords ${passwordVisibility.confirmPassword
                                  ? "ti-eye"
                                  : "ti-eye-off"
                                }`}
                              onClick={() =>
                                togglePasswordVisibility("confirmPassword")
                              }
                            ></span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Phone Number <span className="text-danger"> *</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editEmp.phone}
                            onChange={(e) => setEditEmp({...editEmp, phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Company<span className="text-danger"> *</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editEmp.company || 'HGS Infotech'}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Department</label>
                          <CommonSelect
                            className="select"
                            options={dbDepartments}
                            onChange={(opt) => setEditEmp({...editEmp, departmentId: opt?.value || ''})}
                            defaultValue={dbDepartments.find(d => d.value === editEmp.departmentId) || dbDepartments[0]}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Designation</label>
                          <CommonSelect
                            className="select"
                            options={dbDesignations}
                            onChange={(opt) => setEditEmp({...editEmp, designationId: opt?.value || ''})}
                            defaultValue={dbDesignations.find(d => d.value === editEmp.designationId) || dbDesignations[0]}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Role <span className="text-danger">*</span></label>
                          <CommonSelect
                            className="select"
                            options={[
                              { value: 'EMPLOYEE', label: 'Employee' },
                              { value: 'MANAGER', label: 'Manager' },
                              { value: 'HR', label: 'HR' },
                              { value: 'SUPER_ADMIN', label: 'Super Admin' }
                            ]}
                            onChange={(opt) => setEditEmp({...editEmp, role: opt?.value || 'EMPLOYEE'})}
                            defaultValue={(() => {
                              const roles = [
                                { value: 'EMPLOYEE', label: 'Employee' },
                                { value: 'MANAGER', label: 'Manager' },
                                { value: 'HR', label: 'HR' },
                                { value: 'SUPER_ADMIN', label: 'Super Admin' }
                              ];
                              return roles.find(r => r.value === editEmp.role) || roles[0];
                            })()}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Reporting Manager</label>
                          <CommonSelect
                            className="select"
                            options={[{ value: '', label: '-- None --' }, ...dbEmployees.filter((emp: any) => emp.id !== editEmp.id).map((emp: any) => ({ value: String(emp.id), label: emp.Name }))]}
                            onChange={(opt) => setEditEmp({...editEmp, reportingManagerId: opt?.value || ''})}
                            defaultValue={(() => {
                              const allOptions = [{ value: '', label: '-- None --' }, ...dbEmployees.map((emp: any) => ({ value: String(emp.id), label: emp.Name }))];
                              return allOptions.find(m => m.value === String(editEmp.reportingManagerId)) || allOptions[0];
                            })()}
                          />
                          <small className="text-muted">HR assigns who manages this employee</small>
                        </div>
                      </div>

                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            About <span className="text-danger"> *</span>
                          </label>
                          <textarea
                            className="form-control"
                            rows={3}
                            defaultValue={""}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-light border me-2"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Save{" "}
                    </button>
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="salary2"
                  role="tabpanel"
                  aria-labelledby="salary-tab2"
                  tabIndex={0}
                >
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-12 mb-3">
                        <h6 className="fw-semibold">Allowances (Earnings)</h6>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Basic Salary</label>
                        <input type="number" className="form-control" value={editEmp.basic} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = val + editEmp.hra + editEmp.conveyance + editEmp.medicalAllowance + editEmp.specialAllowance;
                          const net = gross - (editEmp.pfDeduction + editEmp.professionalTax + editEmp.otherDeductions);
                          setEditEmp({...editEmp, basic: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">HRA</label>
                        <input type="number" className="form-control" value={editEmp.hra} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = editEmp.basic + val + editEmp.conveyance + editEmp.medicalAllowance + editEmp.specialAllowance;
                          const net = gross - (editEmp.pfDeduction + editEmp.professionalTax + editEmp.otherDeductions);
                          setEditEmp({...editEmp, hra: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Conveyance</label>
                        <input type="number" className="form-control" value={editEmp.conveyance} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = editEmp.basic + editEmp.hra + val + editEmp.medicalAllowance + editEmp.specialAllowance;
                          const net = gross - (editEmp.pfDeduction + editEmp.professionalTax + editEmp.otherDeductions);
                          setEditEmp({...editEmp, conveyance: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Medical Allowance</label>
                        <input type="number" className="form-control" value={editEmp.medicalAllowance} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = editEmp.basic + editEmp.hra + editEmp.conveyance + val + editEmp.specialAllowance;
                          const net = gross - (editEmp.pfDeduction + editEmp.professionalTax + editEmp.otherDeductions);
                          setEditEmp({...editEmp, medicalAllowance: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Special Allowance</label>
                        <input type="number" className="form-control" value={editEmp.specialAllowance} onChange={(e) => {
                          const val = Number(e.target.value);
                          const gross = editEmp.basic + editEmp.hra + editEmp.conveyance + editEmp.medicalAllowance + val;
                          const net = gross - (editEmp.pfDeduction + editEmp.professionalTax + editEmp.otherDeductions);
                          setEditEmp({...editEmp, specialAllowance: val, grossSalary: gross, netSalary: net});
                        }} />
                      </div>

                      <div className="col-12 mt-3 mb-3">
                        <h6 className="fw-semibold">Deductions</h6>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">PF Deduction</label>
                        <input type="number" className="form-control" value={editEmp.pfDeduction} onChange={(e) => {
                          const val = Number(e.target.value);
                          const net = editEmp.grossSalary - (val + editEmp.professionalTax + editEmp.otherDeductions);
                          setEditEmp({...editEmp, pfDeduction: val, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Professional Tax</label>
                        <input type="number" className="form-control" value={editEmp.professionalTax} onChange={(e) => {
                          const val = Number(e.target.value);
                          const net = editEmp.grossSalary - (editEmp.pfDeduction + val + editEmp.otherDeductions);
                          setEditEmp({...editEmp, professionalTax: val, netSalary: net});
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Other Deductions</label>
                        <input type="number" className="form-control" value={editEmp.otherDeductions} onChange={(e) => {
                          const val = Number(e.target.value);
                          const net = editEmp.grossSalary - (editEmp.pfDeduction + editEmp.professionalTax + val);
                          setEditEmp({...editEmp, otherDeductions: val, netSalary: net});
                        }} />
                      </div>

                      <div className="col-12 mt-3">
                        <div className="d-flex justify-content-between p-3 bg-light rounded">
                          <div>
                            <span className="text-muted d-block">Gross Salary</span>
                            <h4 className="text-primary mb-0">₹ {editEmp.grossSalary}</h4>
                          </div>
                          <div className="text-end">
                            <span className="text-muted d-block">Net Salary</span>
                            <h4 className="text-success mb-0">₹ {editEmp.netSalary}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-light border me-2"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Save{" "}
                    </button>
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="address2"
                  role="tabpanel"
                  aria-labelledby="address-tab2"
                  tabIndex={0}
                >
                  <div className="modal-body">
                    <div className="card bg-light-500 shadow-none">
                      <div className="card-body d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                        <h6>Enable Options</h6>
                        <div className="d-flex align-items-center justify-content-end">
                          <div className="form-check form-switch me-2">
                            <label className="form-check-label mt-0">
                              <input
                                className="form-check-input me-2"
                                type="checkbox"
                                role="switch"
                              />
                              Enable all Module
                            </label>
                          </div>
                          <div className="form-check d-flex align-items-center">
                            <label className="form-check-label mt-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                defaultChecked
                              />
                              Select All
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="table-responsive border rounded">
                      <table className="table">
                        <tbody>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                    defaultChecked
                                  />
                                  Holidays
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Leaves
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Clients
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Projects
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Tasks
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Chats
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                    defaultChecked
                                  />
                                  Assets
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch me-2">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    role="switch"
                                  />
                                  Timing Sheets
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Read
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Write
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Create
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Delete
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Import
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="form-check d-flex align-items-center">
                                <label className="form-check-label mt-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                  Export
                                </label>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-light border me-2"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      data-bs-toggle="modal"
                      data-inert={true}
                      data-bs-target="#success_modal"
                    >
                      Save{" "}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Employee */}
      {/* Add Employee Success */}
      <div className="modal fade" id="success_modal" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body">
              <div className="text-center p-3">
                <span className="avatar avatar-lg avatar-rounded bg-success mb-3">
                  <i className="ti ti-check fs-24" />
                </span>
                <h5 className="mb-2">Employee Added Successfully</h5>
                <p className="mb-3">
                  Stephan Peralt has been added with Client ID :{" "}
                  <span className="text-primary">#EMP - 0001</span>
                </p>
                <div>
                  <div className="row g-2">
                    <div className="col-6">
                      <Link
                        to={all_routes.employeeList}
                        className="btn btn-dark w-100"
                      >
                        Back to List
                      </Link>
                    </div>
                    <div className="col-6">
                      <Link
                        to={all_routes.employeedetails}
                        className="btn btn-primary w-100"
                      >
                        Detail Page
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default EmployeeList;
