import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { DatePicker } from "antd";
import CommonSelect from "../../../core/common/commonSelect";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";
import dayjs from "dayjs";

type PasswordField = "password" | "confirmPassword";

const EmployeeDetails = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const employeeId = searchParams.get('id');

  const currentUser = useSelector((state: any) => state.auth?.user);
  const canEditDocs = ['HR', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '');

  const [emp, setEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState<'aadhaar' | 'pan' | 'resume' | null>(null);

  // Edit state objects
  const [editBasic, setEditBasic] = useState({ phone: '', address: '', gender: '', dateOfBirth: '' });
  const [editPersonal, setEditPersonal] = useState({ passportNo: '', passportExpiry: '', nationality: '', religion: '', maritalStatus: '', spouseEmployed: '', spouseName: '', numberOfChildren: '' });
  const [editEmergency, setEditEmergency] = useState({ emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '' });
  const [editBank, setEditBank] = useState({ bankAccountName: '', bankAccountNumber: '', bankName: '', ifscCode: '', branchName: '' });
  const [editAbout, setEditAbout] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [editExperience, setEditExperience] = useState('');

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

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const getAvatarUrl = (photoUrl: string | null | undefined) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    const apiBase = apiClient.defaults.baseURL || '';
    return `${apiBase}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
  };

  const getAdminCompanyDomain = () => {
    try {
      const userStr = localStorage.getItem('authUser') || localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.email && u.email.includes('@')) {
          const domain = u.email.split('@')[1];
          if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain.toLowerCase())) {
            return domain.toLowerCase();
          }
        }
        if (u.company?.emailDomain) return u.company.emailDomain.toLowerCase();
        if (u.company?.domain) return u.company.domain.toLowerCase();
        if (u.company?.name) {
          const clean = u.company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (clean) return `${clean}.com`;
        }
      }
    } catch {}
    return 'hgsinfotech.com';
  };

  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbDesignations, setDbDesignations] = useState<any[]>([]);
  const [dbRoles, setDbRoles] = useState<any[]>([]);
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);

  const [editEmp, setEditEmp] = useState<any>({
    id: '', firstName: '', lastName: '', email: '', phone: '', departmentId: '', designationId: '', companyRoleId: '', dateOfJoining: '', profilePhotoUrl: '', employeeCode: '', username: '', company: '', password: '', confirmPassword: '', role: 'EMPLOYEE', reportingManagerId: '', about: '',
    basic: 0, hra: 0, conveyance: 0, medicalAllowance: 0, specialAllowance: 0, bonus: 0, pfDeduction: 0, pfEmployer: 0, professionalTax: 0, tdsDeduction: 0, otherDeductions: 0, grossSalary: 0, netSalary: 0
  });
  const [editEmpFile, setEditEmpFile] = useState<File | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState('');

  const initEditEmp = (data: any) => {
    if (!data) return;
    const salary = data.salaryStructure || {};
    setEditEmp({
      id: data.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.user?.email || data.email || '',
      phone: data.phone || '',
      departmentId: data.departmentId ? String(data.departmentId) : '',
      designationId: data.designationId ? String(data.designationId) : '',
      dateOfJoining: data.dateOfJoining ? dayjs(data.dateOfJoining).format('YYYY-MM-DD') : '',
      profilePhotoUrl: data.profilePhotoUrl || '',
      employeeCode: data.employeeCode || '',
      username: data.user?.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      company: data.user?.company?.name || 'HGS Infotech',
      role: data.user?.role || 'EMPLOYEE',
      companyRoleId: data.companyRoleId ? String(data.companyRoleId) : '',
      reportingManagerId: (data.reportingManager?.user?.role === 'COMPANY_ADMIN' || data.reportingManagerId === 'COMPANY_ADMIN')
        ? 'COMPANY_ADMIN'
        : (data.reportingManagerId ? String(data.reportingManagerId) : ((data.user?.role === 'HR' || data.companyRole?.name === 'HR Manager') ? 'COMPANY_ADMIN' : '')),
      about: data.about || '',
      password: '',
      confirmPassword: '',
      basic: salary.basic || 0,
      hra: salary.hra || 0,
      conveyance: salary.conveyance || 0,
      medicalAllowance: salary.medicalAllowance || 0,
      specialAllowance: salary.specialAllowance || 0,
      bonus: salary.bonus || 0,
      pfDeduction: salary.pfDeduction || 0,
      pfEmployer: salary.pfEmployer || 0,
      professionalTax: salary.professionalTax || 0,
      tdsDeduction: salary.tdsDeduction || 0,
      otherDeductions: salary.otherDeductions || 0,
      grossSalary: salary.grossSalary || 0,
      netSalary: salary.netSalary || 0
    });
    setEditEmpFile(null);
    setEditErrorMsg('');
  };

  const calculateSalary = (empState: any, fieldUpdates: any) => {
    const updated = { ...empState, ...fieldUpdates };
    const basic = Number(updated.basic || 0);
    const hra = Number(updated.hra || 0);
    const conveyance = Number(updated.conveyance || 0);
    const medical = Number(updated.medicalAllowance || 0);
    const special = Number(updated.specialAllowance || 0);
    const bonus = Number(updated.bonus || 0);
    
    const pf = Number(updated.pfDeduction || 0);
    const pt = Number(updated.professionalTax || 0);
    const tds = Number(updated.tdsDeduction || 0);
    const other = Number(updated.otherDeductions || 0);

    const grossSalary = basic + hra + conveyance + medical + special + bonus;
    const netSalary = grossSalary - (pf + pt + tds + other);

    return {
      ...updated,
      grossSalary,
      netSalary
    };
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editEmp.password && editEmp.password !== editEmp.confirmPassword) {
      setEditErrorMsg('Password and Confirm Password do not match');
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

      await apiClient.put(`/employees/${editEmp.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Close modal programmatically
      const modal = document.getElementById('edit_employee');
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
      }

      setSaveMsg('Employee updated successfully!');
      setEditEmpFile(null);
      setEditErrorMsg('');
      fetchEmployee();
    } catch (err: any) {
      setEditErrorMsg(err.response?.data?.message || 'Error updating employee');
    }
  };

  const fetchEmployee = async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get(`/employees/${employeeId}`);
      const data = res.data;
      setEmp(data);
      initEditEmp(data);
      // Pre-populate edit states
      setEditBasic({
        phone: data.phone || '',
        address: data.address || '',
        gender: data.gender || '',
        dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth).format('YYYY-MM-DD') : '',
      });
      setEditPersonal({
        passportNo: data.passportNo || '',
        passportExpiry: data.passportExpiry ? dayjs(data.passportExpiry).format('YYYY-MM-DD') : '',
        nationality: data.nationality || '',
        religion: data.religion || '',
        maritalStatus: data.maritalStatus || '',
        spouseEmployed: data.spouseEmployed || '',
        spouseName: data.spouseName || '',
        numberOfChildren: data.numberOfChildren != null ? String(data.numberOfChildren) : '',
      });
      setEditEmergency({
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactPhone: data.emergencyContactPhone || '',
        emergencyContactRelationship: data.emergencyContactRelationship || '',
      });
      setEditBank({
        bankAccountName: data.bankDetails?.accountName || '',
        bankAccountNumber: data.bankDetails?.accountNumber || '',
        bankName: data.bankDetails?.bankName || '',
        ifscCode: data.bankDetails?.ifscCode || '',
        branchName: data.bankDetails?.branchName || '',
      });
      setEditAbout(data.about || '');
      setEditEducation(data.education || '');
      setEditExperience(data.experience || '');
    } catch (err) {
      console.error('Failed to fetch employee', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
    const fetchAuxData = async () => {
      try {
        const [deptRes, desigRes, rolesRes, empRes] = await Promise.allSettled([
          apiClient.get('/departments'),
          apiClient.get('/designations'),
          apiClient.get('/api/roles/'),
          apiClient.get('/employees'),
        ]);
        if (deptRes.status === 'fulfilled' && deptRes.value.data) {
          setDbDepartments(deptRes.value.data.map((d: any) => ({ value: String(d.id), label: d.name })));
        }
        if (desigRes.status === 'fulfilled' && desigRes.value.data) {
          setDbDesignations(desigRes.value.data.map((d: any) => ({ value: String(d.id), label: d.name })));
        }
        if (rolesRes.status === 'fulfilled' && rolesRes.value.data?.success) {
          setDbRoles(rolesRes.value.data.data.map((r: any) => ({ value: String(r.id), label: r.name })));
        }
        if (empRes.status === 'fulfilled' && empRes.value.data) {
          setDbEmployees(empRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load auxiliary dropdown data:', err);
      }
    };
    fetchAuxData();
  }, [employeeId]);

  const handleUploadDoc = async (docType: 'aadhaar' | 'pan' | 'resume', file: File) => {
    if (!file || !employeeId) return;
    setDocUploading(docType);
    const formData = new FormData();
    formData.append(docType, file);
    try {
      const res = await apiClient.put(`/employees/${employeeId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEmp((prev: any) => ({
        ...prev,
        aadhaarPath: res.data.employee.aadhaarPath ?? prev.aadhaarPath,
        panPath: res.data.employee.panPath ?? prev.panPath,
        resumePath: res.data.employee.resumePath ?? prev.resumePath,
      }));
      setSaveMsg(`${docType === 'aadhaar' ? 'Aadhaar Card' : docType === 'pan' ? 'PAN Card' : 'Resume'} updated successfully!`);
    } catch (err: any) {
      setSaveMsg(err.response?.data?.message || `Failed to update ${docType}`);
    } finally {
      setDocUploading(null);
    }
  };

  const saveField = async (fields: Record<string, any>, fileToUpload?: File | null) => {
    if (!employeeId) return;
    try {
      let res;
      if (fileToUpload) {
        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (v !== null && v !== undefined) formData.append(k, String(v));
        });
        formData.append('profileImage', fileToUpload);
        res = await apiClient.put(`/employees/${employeeId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setEditPhotoFile(null);
      } else {
        res = await apiClient.put(`/employees/${employeeId}`, fields);
      }
      setEmp(res.data);
      setSaveMsg('Saved successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg(err.response?.data?.message || 'Error saving changes');
    }
  };

  const departmentChoose = [
    { value: "Select", label: "Select" },
    { value: "All Department", label: "All Department" },
    { value: "Finance", label: "Finance" },
    { value: "Developer", label: "Developer" },
    { value: "Executive", label: "Executive" },
  ];
  const designationChoose = [
    { value: "Select", label: "Select" },
    { value: "Finance", label: "Finance" },
    { value: "Developer", label: "Developer" },
    { value: "Executive", label: "Executive" },
  ];
  const martialstatus = [
    { value: "Select", label: "Select" },
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];
  const salaryChoose = [
    { value: "Select", label: "Select" },
    { value: "Monthly", label: "Monthly" },
    { value: "Annualy", label: "Annualy" },
  ];
  const paymenttype = [
    { value: "Select", label: "Select" },
    { value: "Cash", label: "Cash" },
    { value: "Debit Card", label: "Debit Card" },
    { value: "Mobile Payment", label: "Mobile Payment" },
  ];
  const pfcontribution = [
    { value: "Select", label: "Select" },
    { value: "Employee Contribution", label: "Employee Contribution" },
    { value: "Employer Contribution", label: "Employer Contribution" },
    { value: "Provident Fund Interest", label: "Provident Fund Interest" },
  ];
  const additionalrate = [
    { value: "Select", label: "Select" },
    { value: "ESI", label: "ESI" },
    { value: "EPS", label: "EPS" },
    { value: "EPF", label: "EPF" },
  ];
  const esi = [
    { value: "Select", label: "Select" },
    { value: "Employee Contribution", label: "Employee Contribution" },
    { value: "Employer Contribution", label: "Employer Contribution" },
    { value: "Maternity Benefit ", label: "Maternity Benefit " },
  ];

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
      </div>
    );
  }

  if (!emp && !loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">Employee not found. Please go back and select an employee.</div>
        </div>
      </div>
    );
  }

  const fullName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : '';
  const photoUrl = getAvatarUrl(emp?.profilePhotoUrl);

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h6 className="fw-medium d-inline-flex align-items-center mb-3 mb-sm-0">
                <Link to={all_routes.employeeList}>
                  <i className="ti ti-arrow-left me-2" />
                  Employee Details
                </Link>
              </h6>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-inert={true}
                  data-bs-target="#add_bank_satutory"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Bank &amp; Statutory
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {saveMsg && (
            <div className={`alert ${saveMsg.includes('Error') || saveMsg.includes('error') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`} role="alert">
              {saveMsg}
              <button type="button" className="btn-close" onClick={() => setSaveMsg('')} aria-label="Close"></button>
            </div>
          )}
          <div className="row">
            <div className="col-xl-4 theiaStickySidebar">
              <div className="card card-bg-1">
                <div className="card-body p-0">
                  <span className="avatar avatar-xl avatar-rounded border border-2 border-white m-auto d-flex mb-2">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        className="w-auto h-auto rounded-circle"
                        alt="user"
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/img/users/user-13.jpg';
                        }}
                      />
                    ) : (
                      <ImageWithBasePath src="assets/img/users/user-13.jpg" className="w-auto h-auto" alt="user" />
                    )}
                  </span>
                  <div className="text-center px-3 pb-3 border-bottom">
                    <div className="mb-3">
                      <h5 className="d-flex align-items-center justify-content-center mb-1">
                        {fullName}
                        <i className="ti ti-discount-check-filled text-success ms-1" />
                      </h5>
                      <span className="badge badge-soft-dark fw-medium me-2">
                        <i className="ti ti-point-filled me-1" />
                        {emp?.designation?.name || 'N/A'}
                      </span>
                      <span className="badge badge-soft-secondary fw-medium">
                        {emp?.department?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center"><i className="ti ti-id me-2" />Employee ID</span>
                        <p className="text-dark">{emp?.employeeCode || '—'}</p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center"><i className="ti ti-star me-2" />Department</span>
                        <p className="text-dark">{emp?.department?.name || '—'}</p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center"><i className="ti ti-calendar-check me-2" />Date Of Join</span>
                        <p className="text-dark">{emp?.dateOfJoining ? dayjs(emp.dateOfJoining).format('D MMM YYYY') : '—'}</p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="d-inline-flex align-items-center"><i className="ti ti-calendar-check me-2" />Report Office</span>
                        <div className="d-flex align-items-center">
                          <p className="text-gray-9 mb-0">
                            {emp?.reportingManager ? (
                              emp.reportingManager.user?.role === 'COMPANY_ADMIN'
                                ? `${emp.reportingManager.firstName || ''} ${emp.reportingManager.lastName || ''}`.trim() + ' (Company Admin)'
                                : `${emp.reportingManager.firstName || ''} ${emp.reportingManager.lastName || ''}`.trim() || 'Company Admin'
                            ) : (
                              (emp?.user?.role === 'HR' || emp?.companyRole?.name === 'HR Manager') ? 'Company Admin' : '—'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="row gx-2 mt-3">
                        <div className="col-6">
                          <Link to="#" className="btn btn-dark w-100" data-bs-toggle="modal" data-inert={true} data-bs-target="#edit_employee" onClick={() => initEditEmp(emp)}>
                            <i className="ti ti-edit me-1" />Edit Info
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link to={all_routes.chat} className="btn btn-primary w-100">
                            <i className="ti ti-message-heart me-1" />Message
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Basic information</h6>
                      <Link to="#" className="btn btn-icon btn-sm" data-bs-toggle="modal" data-inert={true} data-bs-target="#edit_employee" onClick={() => initEditEmp(emp)}>
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-phone me-2" />Phone</span>
                      <p className="text-dark">{emp?.phone || '—'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-mail-check me-2" />Email</span>
                      <Link to="#" className="text-info d-inline-flex align-items-center">
                        {emp?.user?.email || '—'}
                      </Link>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-gender-male me-2" />Gender</span>
                      <p className="text-dark text-end">{emp?.gender || '—'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-cake me-2" />Birthday</span>
                      <p className="text-dark text-end">{emp?.dateOfBirth ? dayjs(emp.dateOfBirth).format('D MMM YYYY') : '—'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-map-pin-check me-2" />Address</span>
                      <p className="text-dark text-end">{emp?.address || '—'}</p>
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Personal Information</h6>
                      <Link to="#" className="btn btn-icon btn-sm" data-bs-toggle="modal" data-inert={true} data-bs-target="#edit_personal">
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-e-passport me-2" />Passport No</span>
                      <p className="text-dark">{emp?.passportNo || '—'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-calendar-x me-2" />Passport Exp Date</span>
                      <p className="text-dark text-end">{emp?.passportExpiry ? dayjs(emp.passportExpiry).format('D MMM YYYY') : '—'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-gender-male me-2" />Nationality</span>
                      <p className="text-dark text-end">{emp?.nationality || '—'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-bookmark-plus me-2" />Religion</span>
                      <p className="text-dark text-end">{emp?.religion || '—'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-hotel-service me-2" />Marital status</span>
                      <p className="text-dark text-end">{emp?.maritalStatus || '—'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-briefcase-2 me-2" />Employment of spouse</span>
                      <p className="text-dark text-end">{emp?.spouseEmployed || '—'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="d-inline-flex align-items-center"><i className="ti ti-baby-bottle me-2" />No. of children</span>
                      <p className="text-dark text-end">{emp?.numberOfChildren != null ? emp.numberOfChildren : '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6>Emergency Contact Number</h6>
                <Link to="#" className="btn btn-icon btn-sm" data-bs-toggle="modal" data-inert={true} data-bs-target="#edit_emergency">
                  <i className="ti ti-edit" />
                </Link>
              </div>
              <div className="card">
                <div className="card-body p-0">
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="d-inline-flex align-items-center">Emergency Contact</span>
                        <h6 className="d-flex align-items-center fw-medium mt-1">
                          {emp?.emergencyContactName || '—'}
                          {emp?.emergencyContactRelationship && (
                            <><span className="d-inline-flex mx-1"><i className="ti ti-point-filled text-danger" /></span>{emp.emergencyContactRelationship}</>
                          )}
                        </h6>
                      </div>
                      <p className="text-dark">{emp?.emergencyContactPhone || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-8">
              <div>
                <div className="tab-content custom-accordion-items">
                  <div
                    className="tab-pane active show"
                    id="bottom-justified-tab1"
                    role="tabpanel"
                  >
                    <div
                      className="accordion accordions-items-seperate"
                      id="accordionExample"
                    >
                      <div className="accordion-item">
                        <div className="accordion-header" id="headingOne">
                          <div className="accordion-button">
                            <div className="d-flex align-items-center flex-fill">
                              <h5>About Employee</h5>
                              <Link
                                to="#"
                                className="btn btn-sm btn-icon ms-auto"
                                data-bs-toggle="modal"
                                data-inert={true}
                                data-bs-target="#edit_employee"
                              >
                                <i className="ti ti-edit" />
                              </Link>
                              <Link
                                to="#"
                                className="d-flex align-items-center collapsed collapse-arrow"
                                data-bs-toggle="collapse"
                                data-bs-target="#primaryBorderOne"
                                aria-expanded="false"
                                aria-controls="primaryBorderOne"
                              >
                                <i className="ti ti-chevron-down fs-18" />
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div
                          id="primaryBorderOne"
                          className="accordion-collapse collapse show border-top"
                          aria-labelledby="headingOne"
                          data-bs-parent="#accordionExample"
                        >
                        <div className="accordion-body mt-2">
                            {emp?.about ? emp.about : <span className="text-muted">No description added yet.</span>}
                          </div>
                        </div>
                      </div>
                      <div className="accordion-item">
                        <div className="accordion-header" id="headingTwo">
                          <div className="accordion-button">
                            <div className="d-flex align-items-center flex-fill">
                              <h5>Bank Information</h5>
                              <Link
                                to="#"
                                className="btn btn-sm btn-icon ms-auto"
                                data-bs-toggle="modal"
                                data-inert={true}
                                data-bs-target="#edit_bank"
                              >
                                <i className="ti ti-edit" />
                              </Link>
                              <Link
                                to="#"
                                className="d-flex align-items-center collapsed collapse-arrow"
                                data-bs-toggle="collapse"
                                data-bs-target="#primaryBorderTwo"
                                aria-expanded="false"
                                aria-controls="primaryBorderTwo"
                              >
                                <i className="ti ti-chevron-down fs-18" />
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div
                          id="primaryBorderTwo"
                          className="accordion-collapse collapse border-top"
                          aria-labelledby="headingTwo"
                          data-bs-parent="#accordionExample"
                        >
                          <div className="accordion-body">
                            <div className="row">
                              <div className="col-md-3">
                                <span className="d-inline-flex align-items-center">Bank Name</span>
                                <h6 className="d-flex align-items-center fw-medium mt-1">{emp?.bankDetails?.bankName || '—'}</h6>
                              </div>
                              <div className="col-md-3">
                                <span className="d-inline-flex align-items-center">Bank account no</span>
                                <h6 className="d-flex align-items-center fw-medium mt-1">{emp?.bankDetails?.accountNumber || '—'}</h6>
                              </div>
                              <div className="col-md-3">
                                <span className="d-inline-flex align-items-center">IFSC Code</span>
                                <h6 className="d-flex align-items-center fw-medium mt-1">{emp?.bankDetails?.ifscCode || '—'}</h6>
                              </div>
                              <div className="col-md-3">
                                <span className="d-inline-flex align-items-center">Branch</span>
                                <h6 className="d-flex align-items-center fw-medium mt-1">{emp?.bankDetails?.branchName || '—'}</h6>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="accordion-item">
                        <div className="accordion-header" id="headingDocs">
                          <div className="accordion-button">
                            <div className="d-flex align-items-center flex-fill">
                              <h5 className="d-flex align-items-center mb-0">
                                <i className="ti ti-file-certificate text-primary me-2 fs-20" />
                                Onboarding &amp; Verification Documents
                              </h5>
                              <Link
                                to="#"
                                className="d-flex align-items-center collapsed collapse-arrow ms-auto"
                                data-bs-toggle="collapse"
                                data-bs-target="#primaryBorderDocs"
                                aria-expanded="false"
                                aria-controls="primaryBorderDocs"
                              >
                                <i className="ti ti-chevron-down fs-18" />
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div
                          id="primaryBorderDocs"
                          className="accordion-collapse collapse show border-top"
                          aria-labelledby="headingDocs"
                          data-bs-parent="#accordionExample"
                        >
                          <div className="accordion-body">
                            <div className="row g-3">
                              {/* Aadhaar Card */}
                              <div className="col-md-4">
                                <div className="border rounded p-3 h-100 d-flex flex-column justify-content-between bg-light-subtle">
                                  <div>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                      <span className="badge bg-primary-transparent text-primary">Identity Proof</span>
                                      {emp?.aadhaarPath ? (
                                        <span className="badge bg-success-transparent text-success">
                                          <i className="ti ti-check me-1" />Uploaded
                                        </span>
                                      ) : (
                                        <span className="badge bg-danger-transparent text-danger">Missing</span>
                                      )}
                                    </div>
                                    <h6 className="fw-semibold mb-1">Aadhaar Card</h6>
                                    <p className="fs-12 text-muted mb-3">National identity verification document.</p>
                                  </div>
                                  <div className="d-flex flex-column gap-2 pt-2 border-top">
                                    {emp?.aadhaarPath ? (
                                      <a
                                        href={`${APP_CONFIG.getBackendUrl()}${emp.aadhaarPath}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                                      >
                                        <i className="ti ti-eye me-1" /> View / Download
                                      </a>
                                    ) : (
                                      <button type="button" className="btn btn-sm btn-light text-muted" disabled>
                                        No Document Uploaded
                                      </button>
                                    )}
                                    {canEditDocs && (
                                      <div>
                                        <label htmlFor="upload-aadhaar-doc" className="btn btn-sm btn-primary w-100 mb-0 cursor-pointer d-flex align-items-center justify-content-center">
                                          <i className="ti ti-upload me-1" />
                                          {docUploading === 'aadhaar' ? 'Uploading...' : emp?.aadhaarPath ? 'Change / Replace' : 'Upload Document'}
                                        </label>
                                        <input
                                          type="file"
                                          id="upload-aadhaar-doc"
                                          style={{ display: 'none' }}
                                          accept=".pdf,image/*"
                                          disabled={docUploading !== null}
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              handleUploadDoc('aadhaar', e.target.files[0]);
                                            }
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* PAN Card */}
                              <div className="col-md-4">
                                <div className="border rounded p-3 h-100 d-flex flex-column justify-content-between bg-light-subtle">
                                  <div>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                      <span className="badge bg-info-transparent text-info">Tax Identification</span>
                                      {emp?.panPath ? (
                                        <span className="badge bg-success-transparent text-success">
                                          <i className="ti ti-check me-1" />Uploaded
                                        </span>
                                      ) : (
                                        <span className="badge bg-danger-transparent text-danger">Missing</span>
                                      )}
                                    </div>
                                    <h6 className="fw-semibold mb-1">PAN Card</h6>
                                    <p className="fs-12 text-muted mb-3">Tax compliance and payroll verification document.</p>
                                  </div>
                                  <div className="d-flex flex-column gap-2 pt-2 border-top">
                                    {emp?.panPath ? (
                                      <a
                                        href={`${APP_CONFIG.getBackendUrl()}${emp.panPath}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                                      >
                                        <i className="ti ti-eye me-1" /> View / Download
                                      </a>
                                    ) : (
                                      <button type="button" className="btn btn-sm btn-light text-muted" disabled>
                                        No Document Uploaded
                                      </button>
                                    )}
                                    {canEditDocs && (
                                      <div>
                                        <label htmlFor="upload-pan-doc" className="btn btn-sm btn-primary w-100 mb-0 cursor-pointer d-flex align-items-center justify-content-center">
                                          <i className="ti ti-upload me-1" />
                                          {docUploading === 'pan' ? 'Uploading...' : emp?.panPath ? 'Change / Replace' : 'Upload Document'}
                                        </label>
                                        <input
                                          type="file"
                                          id="upload-pan-doc"
                                          style={{ display: 'none' }}
                                          accept=".pdf,image/*"
                                          disabled={docUploading !== null}
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              handleUploadDoc('pan', e.target.files[0]);
                                            }
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Resume / CV */}
                              <div className="col-md-4">
                                <div className="border rounded p-3 h-100 d-flex flex-column justify-content-between bg-light-subtle">
                                  <div>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                      <span className="badge bg-warning-transparent text-warning">Curriculum Vitae</span>
                                      {emp?.resumePath ? (
                                        <span className="badge bg-success-transparent text-success">
                                          <i className="ti ti-check me-1" />Uploaded
                                        </span>
                                      ) : (
                                        <span className="badge bg-secondary-transparent text-secondary">Not Provided</span>
                                      )}
                                    </div>
                                    <h6 className="fw-semibold mb-1">Resume / CV</h6>
                                    <p className="fs-12 text-muted mb-3">Employment background &amp; candidate resume.</p>
                                  </div>
                                  <div className="d-flex flex-column gap-2 pt-2 border-top">
                                    {emp?.resumePath ? (
                                      <a
                                        href={`${APP_CONFIG.getBackendUrl()}${emp.resumePath}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center"
                                      >
                                        <i className="ti ti-eye me-1" /> View / Download
                                      </a>
                                    ) : (
                                      <button type="button" className="btn btn-sm btn-light text-muted" disabled>
                                        No Document Uploaded
                                      </button>
                                    )}
                                    {canEditDocs && (
                                      <div>
                                        <label htmlFor="upload-resume-doc" className="btn btn-sm btn-primary w-100 mb-0 cursor-pointer d-flex align-items-center justify-content-center">
                                          <i className="ti ti-upload me-1" />
                                          {docUploading === 'resume' ? 'Uploading...' : emp?.resumePath ? 'Change / Replace' : 'Upload Document'}
                                        </label>
                                        <input
                                          type="file"
                                          id="upload-resume-doc"
                                          style={{ display: 'none' }}
                                          accept=".pdf,.doc,.docx"
                                          disabled={docUploading !== null}
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                              handleUploadDoc('resume', e.target.files[0]);
                                            }
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="accordion-item">
                        <div className="accordion-header" id="headingThree">
                          <div className="accordion-button">
                            <div className="d-flex align-items-center justify-content-between flex-fill">
                              <h5>Family Information</h5>
                              <div className="d-flex">
                                <Link
                                  to="#"
                                  className="btn btn-icon btn-sm"
                                  data-bs-toggle="modal"
                                  data-inert={true}
                                  data-bs-target="#edit_personal"
                                >
                                  <i className="ti ti-edit" />
                                </Link>
                                <Link
                                  to="#"
                                  className="d-flex align-items-center collapsed collapse-arrow"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#primaryBorderThree"
                                  aria-expanded="false"
                                  aria-controls="primaryBorderThree"
                                >
                                  <i className="ti ti-chevron-down fs-18" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          id="primaryBorderThree"
                          className="accordion-collapse collapse border-top"
                          aria-labelledby="headingThree"
                          data-bs-parent="#accordionExample"
                        >
                          <div className="accordion-body">
                            <div className="row">
                              <div className="col-md-4">
                                <span className="d-inline-flex align-items-center">Spouse Name</span>
                                <h6 className="d-flex align-items-center fw-medium mt-1">
                                  {emp?.spouseName || '—'}
                                </h6>
                              </div>
                              <div className="col-md-4">
                                <span className="d-inline-flex align-items-center">Employment of Spouse</span>
                                <h6 className="d-flex align-items-center fw-medium mt-1">
                                  {emp?.spouseEmployed || '—'}
                                </h6>
                              </div>
                              <div className="col-md-4">
                                <span className="d-inline-flex align-items-center">No. of Children</span>
                                <h6 className="d-flex align-items-center fw-medium mt-1">
                                  {emp?.numberOfChildren != null ? emp.numberOfChildren : '—'}
                                </h6>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="accordion-item">
                            <div className="row">
                              <div
                                className="accordion-header"
                                id="headingFour"
                              >
                                <div className="accordion-button">
                                  <div className="d-flex align-items-center justify-content-between flex-fill">
                                    <h5>Education Details</h5>
                                    <div className="d-flex">
                                      <Link
                                        to="#"
                                        className="btn btn-icon btn-sm"
                                        data-bs-toggle="modal"
                                        data-inert={true}
                                        data-bs-target="#edit_education"
                                      >
                                        <i className="ti ti-edit" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="d-flex align-items-center collapsed collapse-arrow"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#primaryBorderFour"
                                        aria-expanded="false"
                                        aria-controls="primaryBorderFour"
                                      >
                                        <i className="ti ti-chevron-down fs-18" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div
                                id="primaryBorderFour"
                                className="accordion-collapse collapse border-top"
                                aria-labelledby="headingFour"
                                data-bs-parent="#accordionExample"
                              >
                                <div className="accordion-body">
                                  <div>
                                    {emp?.education ? (
                                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{emp.education}</pre>
                                    ) : (
                                      <span className="text-muted">No education details added yet.</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="accordion-item">
                            <div className="row">
                              <div
                                className="accordion-header"
                                id="headingFive"
                              >
                                <div className="accordion-button collapsed">
                                  <div className="d-flex align-items-center justify-content-between flex-fill">
                                    <h5>Experience</h5>
                                    <div className="d-flex">
                                      <Link
                                        to="#"
                                        className="btn btn-icon btn-sm"
                                        data-bs-toggle="modal"
                                        data-inert={true}
                                        data-bs-target="#edit_experience"
                                      >
                                        <i className="ti ti-edit" />
                                      </Link>
                                      <Link
                                        to="#"
                                        className="d-flex align-items-center collapsed collapse-arrow"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#primaryBorderFive"
                                        aria-expanded="false"
                                        aria-controls="primaryBorderFive"
                                      >
                                        <i className="ti ti-chevron-down fs-18" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div
                                id="primaryBorderFive"
                                className="accordion-collapse collapse border-top"
                                aria-labelledby="headingFive"
                                data-bs-parent="#accordionExample"
                              >
                                <div className="accordion-body">
                                  <div>
                                    {emp?.experience ? (
                                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{emp.experience}</pre>
                                    ) : (
                                      <span className="text-muted">No experience details added yet.</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                      <div className="card">
                        <div className="card-body">
                          <div className="contact-grids-tab p-0 mb-3">
                            <ul
                              className="nav nav-underline"
                              id="myTab"
                              role="tablist"
                            >
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
                                  Projects
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
                                  Assets
                                </button>
                              </li>
                            </ul>
                          </div>
                          <div className="tab-content" id="myTabContent3">
                            <div
                              className="tab-pane fade show active"
                              id="basic-info2"
                              role="tabpanel"
                              aria-labelledby="info-tab2"
                              tabIndex={0}
                            >
                              <div className="row">
                                <div className="col-md-6 d-flex">
                                  <div className="card flex-fill mb-4 mb-md-0">
                                    <div className="card-body">
                                      <div className="d-flex align-items-center pb-3 mb-3 border-bottom">
                                        <Link
                                          to={all_routes.projectdetails}
                                          className="flex-shrink-0 me-2"
                                        >
                                          <ImageWithBasePath
                                            src="assets/img/social/project-03.svg"
                                            alt="project"
                                          />
                                        </Link>
                                        <div>
                                          <h6 className="mb-1">
                                            <Link
                                              to={all_routes.projectdetails}
                                            >
                                              World Health
                                            </Link>
                                          </h6>
                                          <div className="d-flex align-items-center">
                                            <p className="mb-0 fs-13">
                                              8 tasks
                                            </p>
                                            <p className="fs-13">
                                              <span className="mx-1">
                                                <i className="ti ti-point-filled text-primary" />
                                              </span>
                                              15 Completed
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="row">
                                        <div className="col-md-6">
                                          <div>
                                            <span className="mb-1 d-block">
                                              Deadline
                                            </span>
                                            <p className="text-dark">
                                              31 July 2025
                                            </p>
                                          </div>
                                        </div>
                                        <div className="col-md-6">
                                          <div>
                                            <span className="mb-1 d-block">
                                              Project Lead
                                            </span>
                                            <Link
                                              to="#"
                                              className="fw-normal d-flex align-items-center"
                                            >
                                              <ImageWithBasePath
                                                className="avatar avatar-sm rounded-circle me-2"
                                                src="assets/img/profiles/avatar-01.jpg"
                                                alt="avatar"
                                              />
                                              Leona
                                            </Link>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-6 d-flex">
                                  <div className="card flex-fill mb-0">
                                    <div className="card-body">
                                      <div className="d-flex align-items-center pb-3 mb-3 border-bottom">
                                        <Link
                                          to={all_routes.projectdetails}
                                          className="flex-shrink-0 me-2"
                                        >
                                          <ImageWithBasePath
                                            src="assets/img/social/project-01.svg"
                                            alt="project"
                                          />
                                        </Link>
                                        <div>
                                          <h6 className="mb-1 text-truncate">
                                            <Link
                                              to={all_routes.projectdetails}
                                            >
                                              Hospital Administration
                                            </Link>
                                          </h6>
                                          <div className="d-flex align-items-center">
                                            <p className="mb-0 fs-13">
                                              8 tasks
                                            </p>
                                            <p className="fs-13">
                                              <span className="mx-1">
                                                <i className="ti ti-point-filled text-primary" />
                                              </span>
                                              15 Completed
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="row">
                                        <div className="col-md-6">
                                          <div>
                                            <span className="mb-1 d-block">
                                              Deadline
                                            </span>
                                            <p className="text-dark">
                                              31 July 2025
                                            </p>
                                          </div>
                                        </div>
                                        <div className="col-md-6">
                                          <div>
                                            <span className="mb-1 d-block">
                                              Project Lead
                                            </span>
                                            <Link
                                              to="#"
                                              className="fw-normal d-flex align-items-center"
                                            >
                                              <ImageWithBasePath
                                                className="avatar avatar-sm rounded-circle me-2"
                                                src="assets/img/profiles/avatar-01.jpg"
                                                alt="avatar"
                                              />
                                              Leona
                                            </Link>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div
                              className="tab-pane fade"
                              id="address2"
                              role="tabpanel"
                              aria-labelledby="address-tab2"
                              tabIndex={0}
                            >
                              <div className="row">
                                <div className="col-md-12 d-flex">
                                  <div className="card flex-fill">
                                    <div className="card-body">
                                      <div className="row align-items-center">
                                        <div className="col-md-8">
                                          <div className="d-flex align-items-center">
                                            <Link
                                              to={all_routes.projectdetails}
                                              className="flex-shrink-0 me-2"
                                            >
                                              <ImageWithBasePath
                                                src="assets/img/products/product-05.jpg"
                                                className="img-fluid rounded-circle"
                                                alt="product"
                                              />
                                            </Link>
                                            <div>
                                              <h6 className="mb-1">
                                                <Link
                                                  to={all_routes.projectdetails}
                                                >
                                                  Dell Laptop - #343556656
                                                </Link>
                                              </h6>
                                              <div className="d-flex align-items-center">
                                                <p>
                                                  <span className="text-primary">
                                                    AST - 001
                                                    <i className="ti ti-point-filled text-primary mx-1" />
                                                  </span>
                                                  Assigned on 22 Nov, 2022
                                                  10:32AM{" "}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="col-md-3">
                                          <div>
                                            <span className="mb-1 d-block">
                                              Assigned by
                                            </span>
                                            <Link
                                              to="#"
                                              className="fw-normal d-flex align-items-center"
                                            >
                                              <ImageWithBasePath
                                                className="avatar avatar-sm rounded-circle me-2"
                                                src="assets/img/profiles/avatar-01.jpg"
                                                alt="avatar"
                                              />
                                              Andrew Symon
                                            </Link>
                                          </div>
                                        </div>
                                        <div className="col-md-1">
                                          <div className="dropdown ms-2">
                                            <Link
                                              to="#"
                                              className="d-inline-flex align-items-center"
                                              data-bs-toggle="dropdown"
                                              aria-expanded="false"
                                            >
                                              <i className="ti ti-dots-vertical" />
                                            </Link>
                                            <ul className="dropdown-menu dropdown-menu-end p-3">
                                              <li>
                                                <Link
                                                  to="#"
                                                  className="dropdown-item rounded-1"
                                                  data-bs-toggle="modal"
                                                  data-inert={true}
                                                  data-bs-target="#asset_info"
                                                >
                                                  View Info
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  to="#"
                                                  className="dropdown-item rounded-1"
                                                  data-bs-toggle="modal"
                                                  data-inert={true}
                                                  data-bs-target="#refuse_msg"
                                                >
                                                  Raise Issue{" "}
                                                </Link>
                                              </li>
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-12 d-flex">
                                  <div className="card flex-fill mb-0">
                                    <div className="card-body">
                                      <div className="row align-items-center">
                                        <div className="col-md-8">
                                          <div className="d-flex align-items-center">
                                            <Link
                                              to={all_routes.projectdetails}
                                              className="flex-shrink-0 me-2"
                                            >
                                              <ImageWithBasePath
                                                src="assets/img/products/product-06.jpg"
                                                className="img-fluid rounded-circle"
                                                alt="product"
                                              />
                                            </Link>
                                            <div>
                                              <h6 className="mb-1">
                                                <Link
                                                  to={all_routes.projectdetails}
                                                >
                                                  Bluetooth Mouse - #478878
                                                </Link>
                                              </h6>
                                              <div className="d-flex align-items-center">
                                                <p>
                                                  <span className="text-primary">
                                                    AST - 001
                                                    <i className="ti ti-point-filled text-primary mx-1" />
                                                  </span>
                                                  Assigned on 22 Nov, 2022
                                                  10:32AM{" "}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="col-md-3">
                                          <div>
                                            <span className="mb-1 d-block">
                                              Assigned by
                                            </span>
                                            <Link
                                              to="#"
                                              className="fw-normal d-flex align-items-center"
                                            >
                                              <ImageWithBasePath
                                                className="avatar avatar-sm rounded-circle me-2"
                                                src="assets/img/profiles/avatar-01.jpg"
                                                alt="avatar"
                                              />
                                              Andrew Symon
                                            </Link>
                                          </div>
                                        </div>
                                        <div className="col-md-1">
                                          <div className="dropdown ms-2">
                                            <Link
                                              to="#"
                                              className="d-inline-flex align-items-center"
                                              data-bs-toggle="dropdown"
                                              aria-expanded="false"
                                            >
                                              <i className="ti ti-dots-vertical" />
                                            </Link>
                                            <ul className="dropdown-menu dropdown-menu-end p-3">
                                              <li>
                                                <Link
                                                  to="#"
                                                  className="dropdown-item rounded-1"
                                                  data-bs-toggle="modal"
                                                  data-inert={true}
                                                  data-bs-target="#asset_info"
                                                >
                                                  View Info
                                                </Link>
                                              </li>
                                              <li>
                                                <Link
                                                  to="#"
                                                  className="dropdown-item rounded-1"
                                                  data-bs-toggle="modal"
                                                  data-inert={true}
                                                  data-bs-target="#refuse_msg"
                                                >
                                                  Raise Issue{" "}
                                                </Link>
                                              </li>
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      {/* Edit Employee */}
      <div className="modal fade" id="edit_employee">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div className="d-flex align-items-center">
                <h4 className="modal-title me-2">Edit Employee</h4>
                <span>Employee ID : {editEmp.employeeCode || emp?.employeeCode || ''}</span>
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
                <ul className="nav nav-underline" id="myTabEditEmp" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="edit-info-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#edit-basic-info"
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
                      id="edit-salary-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#edit-salary"
                      type="button"
                      role="tab"
                      aria-selected="false"
                    >
                      Salary Details
                    </button>
                  </li>
                </ul>
              </div>
              <div className="tab-content" id="myTabContentEditEmp">
                <div
                  className="tab-pane fade show active"
                  id="edit-basic-info"
                  role="tabpanel"
                  aria-labelledby="edit-info-tab"
                  tabIndex={0}
                >
                  <div className="modal-body pb-0 ">
                    {editErrorMsg && <div className="alert alert-danger">{editErrorMsg}</div>}
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
                              <button
                                type="button"
                                className="btn btn-light btn-sm"
                                onClick={() => setEditEmpFile(null)}
                              >
                                Cancel
                              </button>
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
                              setEditEmp({ ...editEmp, firstName, email: `${firstName.toLowerCase().replace(/\s+/g, '')}@${getAdminCompanyDomain()}` });
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
                            onChange={(e) => setEditEmp({ ...editEmp, lastName: e.target.value })}
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
                            onChange={(e) => setEditEmp({ ...editEmp, email: e.target.value })}
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
                            onChange={(e) => setEditEmp({ ...editEmp, phone: e.target.value })}
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
                            options={[{ value: '', label: '-- None --' }, ...dbDepartments]}
                            onChange={(opt) => setEditEmp({ ...editEmp, departmentId: opt?.value || '' })}
                            defaultValue={(() => {
                              const allOptions = [{ value: '', label: '-- None --' }, ...dbDepartments];
                              return allOptions.find(d => d.value === String(editEmp.departmentId)) || allOptions[0];
                            })()}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Designation</label>
                          <CommonSelect
                            className="select"
                            options={[{ value: '', label: '-- None --' }, ...dbDesignations]}
                            onChange={(opt) => setEditEmp({ ...editEmp, designationId: opt?.value || '' })}
                            defaultValue={(() => {
                              const allOptions = [{ value: '', label: '-- None --' }, ...dbDesignations];
                              return allOptions.find(d => d.value === String(editEmp.designationId)) || allOptions[0];
                            })()}
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
                              { value: 'HR', label: 'HR' }
                            ]}
                            onChange={(opt) => {
                              const selectedRole = opt?.value || 'EMPLOYEE';
                              setEditEmp((prev: any) => ({
                                ...prev,
                                role: selectedRole,
                                reportingManagerId: selectedRole === 'HR' ? 'COMPANY_ADMIN' : prev.reportingManagerId
                              }));
                            }}
                            defaultValue={(() => {
                              const roles = [
                                { value: 'EMPLOYEE', label: 'Employee' },
                                { value: 'MANAGER', label: 'Manager' },
                                { value: 'HR', label: 'HR' }
                              ];
                              return roles.find(r => r.value === editEmp.role) || roles[0];
                            })()}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Permission Group (Role Permissions)</label>
                          <CommonSelect
                            className="select"
                            options={[{ value: '', label: '-- None --' }, ...dbRoles]}
                            onChange={(opt) => {
                              const selectedRoleId = opt?.value || '';
                              const selectedRoleObj = dbRoles.find(r => String(r.value) === String(selectedRoleId));
                              const isHRRole = selectedRoleObj?.label === 'HR Manager' || selectedRoleObj?.label === 'HR';
                              setEditEmp((prev: any) => ({
                                ...prev,
                                companyRoleId: selectedRoleId,
                                role: isHRRole ? 'HR' : prev.role,
                                reportingManagerId: isHRRole ? 'COMPANY_ADMIN' : prev.reportingManagerId
                              }));
                            }}
                            defaultValue={(() => {
                              const allOptions = [{ value: '', label: '-- None --' }, ...dbRoles];
                              return allOptions.find(r => r.value === String(editEmp.companyRoleId)) || allOptions[0];
                            })()}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Reporting Manager</label>
                          {(() => {
                            const managerOptions = [
                              { value: '', label: '-- None --' },
                              { value: 'COMPANY_ADMIN', label: 'Company Admin' },
                              ...dbEmployees.filter((e: any) => e.id !== editEmp.id).map((e: any) => {
                                const name = `${e.firstName || e.raw?.firstName || ''} ${e.lastName || e.raw?.lastName || ''}`.trim() || e.Name || e.user?.name || (e.employeeCode ? `Employee (${e.employeeCode})` : '') || 'Employee';
                                const desig = e.designation?.name || e.raw?.designation?.name || e.Designation || '';
                                return {
                                  value: String(e.id),
                                  label: desig ? `${name} (${desig})` : name
                                };
                              })
                            ];
                            const defaultVal = managerOptions.find(m => 
                              m.value === String(editEmp.reportingManagerId) ||
                              (m.value === 'COMPANY_ADMIN' && (
                                editEmp.reportingManagerId === 'COMPANY_ADMIN' ||
                                (emp?.reportingManager?.user?.role === 'COMPANY_ADMIN' && String(editEmp.reportingManagerId) === String(emp?.reportingManagerId)) ||
                                ((editEmp.role === 'HR' || dbRoles.find(r => r.value === String(editEmp.companyRoleId))?.label === 'HR Manager') && !editEmp.reportingManagerId)
                              ))
                            ) || managerOptions[0];

                            return (
                              <CommonSelect
                                key={`rm-${editEmp.id}-${editEmp.reportingManagerId}-${editEmp.companyRoleId}-${editEmp.role}`}
                                className="select"
                                options={managerOptions}
                                defaultValue={defaultVal}
                                onChange={(opt) => setEditEmp((prev: any) => ({ ...prev, reportingManagerId: opt?.value || '' }))}
                                isDisabled={false}
                              />
                            );
                          })()}
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
                            value={editEmp.about || ''}
                            onChange={(e) => setEditEmp({ ...editEmp, about: e.target.value })}
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
                      Save
                    </button>
                  </div>
                </div>
                <div
                  className="tab-pane fade"
                  id="edit-salary"
                  role="tabpanel"
                  aria-labelledby="edit-salary-tab"
                  tabIndex={0}
                >
                  <div className="modal-body pb-0">
                    <div className="row">
                      <div className="col-12 mb-3">
                        <h6 className="fw-semibold">Allowances (Earnings)</h6>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Basic Salary</label>
                        <input type="number" className="form-control" required value={editEmp.basic} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { basic: e.target.value }));
                        }} />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">HRA</label>
                        <input type="number" className="form-control" value={editEmp.hra} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { hra: e.target.value }));
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Conveyance</label>
                        <input type="number" className="form-control" value={editEmp.conveyance} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { conveyance: e.target.value }));
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Medical Allowance</label>
                        <input type="number" className="form-control" value={editEmp.medicalAllowance} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { medicalAllowance: e.target.value }));
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Special Allowance</label>
                        <input type="number" className="form-control" value={editEmp.specialAllowance} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { specialAllowance: e.target.value }));
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Bonus / Incentive</label>
                        <input type="number" className="form-control" value={editEmp.bonus} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { bonus: e.target.value }));
                        }} />
                      </div>

                      <div className="col-12 mt-3 mb-3">
                        <h6 className="fw-semibold">Deductions</h6>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">PF (Employee)</label>
                        <input type="number" className="form-control" value={editEmp.pfDeduction} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { pfDeduction: e.target.value }));
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">PF (Employer)</label>
                        <input type="number" className="form-control" value={editEmp.pfEmployer} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { pfEmployer: e.target.value }));
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">PF Professional Tax</label>
                        <input type="number" className="form-control" value={editEmp.professionalTax} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { professionalTax: e.target.value }));
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">TDS</label>
                        <input type="number" className="form-control" value={editEmp.tdsDeduction} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { tdsDeduction: e.target.value }));
                        }} />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Other Deductions</label>
                        <input type="number" className="form-control" value={editEmp.otherDeductions} onChange={(e) => {
                          setEditEmp(calculateSalary(editEmp, { otherDeductions: e.target.value }));
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
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Employee */}
      {/* Edit Personal */}
      <div className="modal fade" id="edit_personal">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Personal Info</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Passport No <span className="text-danger"> *</span></label>
                      <input type="text" className="form-control" value={editPersonal.passportNo} onChange={(e) => setEditPersonal(p => ({ ...p, passportNo: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Passport Expiry Date <span className="text-danger"> *</span></label>
                      <input type="date" className="form-control" value={editPersonal.passportExpiry} onChange={(e) => setEditPersonal(p => ({ ...p, passportExpiry: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Nationality <span className="text-danger"> *</span></label>
                      <input type="text" className="form-control" value={editPersonal.nationality} onChange={(e) => setEditPersonal(p => ({ ...p, nationality: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Religion</label>
                      <input type="text" className="form-control" value={editPersonal.religion} onChange={(e) => setEditPersonal(p => ({ ...p, religion: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Marital status <span className="text-danger"> *</span></label>
                      <input type="text" className="form-control" value={editPersonal.maritalStatus} onChange={(e) => setEditPersonal(p => ({ ...p, maritalStatus: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Employment of Spouse</label>
                      <input type="text" className="form-control" value={editPersonal.spouseEmployed} onChange={(e) => setEditPersonal(p => ({ ...p, spouseEmployed: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Spouse Name</label>
                      <input type="text" className="form-control" value={editPersonal.spouseName} onChange={(e) => setEditPersonal(p => ({ ...p, spouseName: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">No. of children</label>
                      <input type="number" className="form-control" value={editPersonal.numberOfChildren} onChange={(e) => setEditPersonal(p => ({ ...p, numberOfChildren: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white border me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="button" data-bs-dismiss="modal" className="btn btn-primary" onClick={() => saveField({ ...editPersonal })}>Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Personal */}
      {/* Edit Emergency Contact */}
      <div className="modal fade" id="edit_emergency">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Emergency Contact Details</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Name <span className="text-danger"> *</span></label>
                      <input type="text" className="form-control" value={editEmergency.emergencyContactName} onChange={(e) => setEditEmergency(p => ({ ...p, emergencyContactName: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Relationship</label>
                      <input type="text" className="form-control" value={editEmergency.emergencyContactRelationship} onChange={(e) => setEditEmergency(p => ({ ...p, emergencyContactRelationship: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone No <span className="text-danger"> *</span></label>
                      <input type="text" className="form-control" value={editEmergency.emergencyContactPhone} onChange={(e) => setEditEmergency(p => ({ ...p, emergencyContactPhone: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white border me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="button" data-bs-dismiss="modal" className="btn btn-primary" onClick={() => saveField({ ...editEmergency })}>Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Emergency Contact */}
      {/* Edit Bank */}
      <div className="modal fade" id="edit_bank">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Bank Details</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Bank Name <span className="text-danger"> *</span></label>
                      <input type="text" className="form-control" value={editBank.bankName} onChange={(e) => setEditBank(p => ({ ...p, bankName: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Account Holder Name</label>
                      <input type="text" className="form-control" value={editBank.bankAccountName} onChange={(e) => setEditBank(p => ({ ...p, bankAccountName: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Bank Account No</label>
                      <input type="text" className="form-control" value={editBank.bankAccountNumber} onChange={(e) => setEditBank(p => ({ ...p, bankAccountNumber: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">IFSC Code</label>
                      <input type="text" className="form-control" value={editBank.ifscCode} onChange={(e) => setEditBank(p => ({ ...p, ifscCode: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Branch Address</label>
                      <input type="text" className="form-control" value={editBank.branchName} onChange={(e) => setEditBank(p => ({ ...p, branchName: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white border me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="button" data-bs-dismiss="modal" className="btn btn-primary" onClick={() => saveField({ ...editBank })}>Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Bank */}
      {/* Add Family */}
      <div className="modal fade" id="edit_familyinformation">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Family Information</h4>
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
                      <label className="form-label">
                        Name <span className="text-danger"> *</span>
                      </label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Relationship </label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Phone </label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Passport Expiry Date{" "}
                        <span className="text-danger"> *</span>
                      </label>
                      <div className="input-icon-end position-relative">
                        <DatePicker
                          className="form-control datetimepicker"
                          format={{
                            format: "DD-MM-YYYY",
                            type: "mask",
                          }}
                          getPopupContainer={getModalContainer}
                          placeholder="DD-MM-YYYY"
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-calendar text-gray-7" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-white border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  className="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Family */}
      {/* Add Education */}
      <div className="modal fade" id="edit_education">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Education Information</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="mb-3">
                  <label className="form-label">Education Details <span className="text-muted fs-12">(e.g. University, Degree, Year)</span></label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="e.g.\nOxford University - Computer Science (2018-2022)\nHigh School - ABC School (2016-2018)"
                    value={editEducation}
                    onChange={(e) => setEditEducation(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white border me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="button" data-bs-dismiss="modal" className="btn btn-primary" onClick={() => saveField({ education: editEducation })}>Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Education */}
      {/* Add Experience */}
      <div className="modal fade" id="edit_experience">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Experience Information</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form>
              <div className="modal-body pb-0">
                <div className="mb-3">
                  <label className="form-label">Work Experience <span className="text-muted fs-12">(e.g. Company, Role, Year)</span></label>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="e.g.\nGoogle - Software Engineer (2020 - Present)\nInfosys - Developer (2018 - 2020)"
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white border me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="button" data-bs-dismiss="modal" className="btn btn-primary" onClick={() => saveField({ experience: editExperience })}>Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Experience */}
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
      {/* /Add Client Success */}
      {/* Add Statuorty */}
      <div className="modal fade" id="add_bank_satutory">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Bank &amp; Statutory</h4>
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
                <div className="border-bottom mb-4">
                  <h5 className="mb-3">Basic Salary Information</h5>
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">
                          Salary basis <span className="text-danger"> *</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={salaryChoose}
                          defaultValue={salaryChoose[0]}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Salary basis</label>
                        <input
                          type="text"
                          className="form-control"
                          defaultValue="$"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Payment type</label>
                        <CommonSelect
                          className="select"
                          options={paymenttype}
                          defaultValue={paymenttype[0]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-bottom mb-4">
                  <h5 className="mb-3">PF Information</h5>
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">
                          PF contribution{" "}
                          <span className="text-danger"> *</span>
                        </label>
                        <CommonSelect
                          className="select"
                          options={pfcontribution}
                          defaultValue={pfcontribution[0]}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">PF No</label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Employee PF rate</label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Additional rate</label>
                        <CommonSelect
                          className="select"
                          options={additionalrate}
                          defaultValue={additionalrate[0]}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Total rate</label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
                </div>
                <h5 className="mb-3">ESI Information</h5>
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">
                        ESI contribution<span className="text-danger"> *</span>
                      </label>
                      <CommonSelect
                        className="select"
                        options={esi}
                        defaultValue={esi[0]}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">ESI Number</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">
                        Employee ESI rate<span className="text-danger"> *</span>
                      </label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Additional rate</label>
                      <CommonSelect
                        className="select"
                        options={additionalrate}
                        defaultValue={additionalrate[0]}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Total rate</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-white border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  className="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Statuorty */}
      {/* Asset Information */}
      <div className="modal fade" id="asset_info">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Asset Information</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="bg-light p-3 rounded d-flex align-items-center mb-3">
                <span className="avatar avatar-lg flex-shrink-0 me-2">
                  <ImageWithBasePath
                    src="assets/img/laptop.jpg"
                    alt="laptop"
                    className="ig-fluid rounded-circle"
                  />
                </span>
                <div>
                  <h6>Dell Laptop - #343556656</h6>
                  <p className="fs-13">
                    <span className="text-primary">AST - 001 </span>
                    <i className="ti ti-point-filled text-primary" /> Assigned
                    on 22 Nov, 2022 10:32AM
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="fs-13 mb-0">Type</p>
                    <p className="text-gray-9">Laptop</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="fs-13 mb-0">Brand</p>
                    <p className="text-gray-9">Dell</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="fs-13 mb-0">Category</p>
                    <p className="text-gray-9">Computer</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="fs-13 mb-0">Serial No</p>
                    <p className="text-gray-9">3647952145678</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="fs-13 mb-0">Cost</p>
                    <p className="text-gray-9">$800</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="fs-13 mb-0">Vendor</p>
                    <p className="text-gray-9">Compusoft Systems Ltd.,</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="fs-13 mb-0">Warranty</p>
                    <p className="text-gray-9">12 Jan 2022 - 12 Jan 2026</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <p className="fs-13 mb-0">Location</p>
                    <p className="text-gray-9">46 Laurel Lane, TX 79701</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="fs-13 mb-2">Asset Images</p>
                <div className="d-flex align-items-center">
                  <ImageWithBasePath
                    src="assets/img/laptop-01.jpg"
                    alt="laptop"
                    className="img-fluid rounded me-2"
                  />
                  <ImageWithBasePath
                    src="assets/img/laptop-2.jpg"
                    alt="laptop"
                    className="img-fluid rounded me-2"
                  />
                  <ImageWithBasePath
                    src="assets/img/laptop-3.jpg"
                    alt="laptop"
                    className="img-fluid rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Asset Information */}
      {/* Refuse */}
      <div className="modal fade" id="refuse_msg">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Raise Issue</h4>
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
                      <label className="form-label">
                        Description<span className="text-danger"> *</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={4}
                        defaultValue={""}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-white border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-bs-dismiss="modal"
                  className="btn btn-primary"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Refuse */}
    </>
  );
};

export default EmployeeDetails;
