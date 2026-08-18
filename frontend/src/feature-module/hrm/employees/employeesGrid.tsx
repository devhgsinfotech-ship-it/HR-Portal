import React, { useState, useEffect, useMemo } from 'react';
import { all_routes } from '../../../router/all_routes';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import CommonSelect from '../../../core/common/commonSelect';
import { DatePicker } from 'antd';
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import apiClient, { getSubdomain } from '../../../core/utils/apiClient';
import dayjs from 'dayjs';

type PasswordField = "password" | "confirmPassword";

const EmployeesGrid = () => {
    const [dbEmployees, setDbEmployees] = useState<any[]>([]);
    const [dbDepartments, setDbDepartments] = useState<any[]>([]);
    const [dbDesignations, setDbDesignations] = useState<any[]>([]);
    const [selectedDesignation, setSelectedDesignation] = useState<string>('All');
    const [loading, setLoading] = useState<boolean>(true);

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
        const modalElement = document.getElementById('modal-datepicker');
        return modalElement ? modalElement : document.body;
    };

    const [newEmp, setNewEmp] = useState({ 
        firstName: '', lastName: '', email: '', phone: '', departmentId: '', designationId: '', dateOfJoining: '', role: 'EMPLOYEE', reportingManagerId: '',
        basic: 0, hra: 0, conveyance: 0, medicalAllowance: 0, specialAllowance: 0,
        pfDeduction: 0, professionalTax: 0, otherDeductions: 0,
        grossSalary: 0, netSalary: 0
    });
    const [editEmp, setEditEmp] = useState<any>({ 
        id: '', firstName: '', lastName: '', email: '', phone: '', departmentId: '', designationId: '', dateOfJoining: '', profilePhotoUrl: '', employeeCode: '', username: '', company: '', password: '', confirmPassword: '', role: 'EMPLOYEE', reportingManagerId: '',
        basic: 0, hra: 0, conveyance: 0, medicalAllowance: 0, specialAllowance: 0,
        pfDeduction: 0, professionalTax: 0, otherDeductions: 0, grossSalary: 0, netSalary: 0
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [newEmpFile, setNewEmpFile] = useState<File | null>(null);
    const [editEmpFile, setEditEmpFile] = useState<File | null>(null);
    const [deleteEmpId, setDeleteEmpId] = useState<string | number | null>(null);
    const [emailStatus, setEmailStatus] = useState<{ available?: boolean, suggestion?: string, checking?: boolean }>({});
    const [isEmailEdited, setIsEmailEdited] = useState(false);

    const calculateSalary = (empState: any, fieldUpdates: any) => {
        const updated = { ...empState, ...fieldUpdates };
        const basic = Number(updated.basic || 0);
        const hra = Number(updated.hra || 0);
        const conveyance = Number(updated.conveyance || 0);
        const medical = Number(updated.medicalAllowance || 0);
        const special = Number(updated.specialAllowance || 0);
        const pf = Number(updated.pfDeduction || 0);
        const pt = Number(updated.professionalTax || 0);
        const other = Number(updated.otherDeductions || 0);

        const grossSalary = basic + hra + conveyance + medical + special;
        const netSalary = grossSalary - (pf + pt + other);

        return {
            ...updated,
            grossSalary,
            netSalary
        };
    };

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
            setDbEmployees(empRes.data);
            setDbDepartments(deptRes.data.map((d: any) => ({ value: d.id, label: d.name })));
            setDbDesignations(desigRes.data.map((d: any) => ({ value: d.id, label: d.name })));
            setLoading(false);
        } catch (err) {
            console.error('Error fetching grid data:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const total = dbEmployees.length;
        const active = dbEmployees.filter(emp => emp.onboardingStatus === 'COMPLETED' || emp.user?.accountStatus === 'ACTIVE').length;
        const inactive = dbEmployees.filter(emp => emp.user?.accountStatus === 'DISABLED').length;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newJoiners = dbEmployees.filter(emp => {
            if (!emp.dateOfJoining) return false;
            return new Date(emp.dateOfJoining) >= thirtyDaysAgo;
        }).length;

        return { total, active, inactive, newJoiners };
    }, [dbEmployees]);

    const filteredEmployees = useMemo(() => {
        if (selectedDesignation === 'All') return dbEmployees;
        return dbEmployees.filter(emp => emp.designation?.name === selectedDesignation);
    }, [dbEmployees, selectedDesignation]);

    const getAvatarUrl = (photoUrl: string | null | undefined) => {
        if (!photoUrl) return null;
        if (photoUrl.startsWith('http')) return photoUrl;
        const apiBase = apiClient.defaults.baseURL || '';
        return `${apiBase}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
    };

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
            setErrorMsg('');
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
            const modal = document.getElementById('delete_modal');
            if (modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
            fetchData();
            setDeleteEmpId(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error deleting employee');
        }
    };

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const tableHtml = `
            <html>
                <head>
                    <title>Employees Grid Export</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        h2 { text-align: center; }
                    </style>
                </head>
                <body>
                    <h2>Employees List</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Emp ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Designation</th>
                                <th>Joining Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredEmployees.map(emp => `
                                <tr>
                                    <td>${emp.employeeCode || 'N/A'}</td>
                                    <td>${emp.firstName || ''} ${emp.lastName || ''}</td>
                                    <td>${emp.user?.email || emp.email || 'N/A'}</td>
                                    <td>${emp.phone || 'N/A'}</td>
                                    <td>${emp.designation?.name || 'N/A'}</td>
                                    <td>${emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        };
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(tableHtml);
        printWindow.document.close();
    };

    const handleExportExcel = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Emp ID,Name,Email,Phone,Designation,Joining Date\n";
        filteredEmployees.forEach(emp => {
            const row = [
                `"${emp.employeeCode || 'N/A'}"`,
                `"${emp.firstName || ''} ${emp.lastName || ''}"`,
                `"${emp.user?.email || emp.email || 'N/A'}"`,
                `"${emp.phone || 'N/A'}"`,
                `"${emp.designation?.name || 'N/A'}"`,
                `"${emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : 'N/A'}"`
            ].join(",");
            csvContent += row + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `employees_grid_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                                        Employee Grid
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
                            <div className="me-2 mb-2">
                                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                                    <Link to={all_routes.employeeList} className="btn btn-icon btn-sm me-1">
                                        <i className="ti ti-list-tree" />
                                    </Link>
                                    <Link
                                        to={all_routes.employeeGrid}
                                        className="btn btn-icon btn-sm active bg-primary text-white"
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
                                    <ul className="dropdown-menu dropdown-menu-end p-3">
                                        <li>
                                            <Link
                                                to="#"
                                                className="dropdown-item rounded-1"
                                                onClick={(e) => { e.preventDefault(); handleExportPDF(); }}
                                            >
                                                <i className="ti ti-file-type-pdf me-1" />
                                                Export as PDF
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="#"
                                                className="dropdown-item rounded-1"
                                                onClick={(e) => { e.preventDefault(); handleExportExcel(); }}
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
                                    data-bs-toggle="modal" data-inert={true}
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

                    {/* Stats Row */}
                    <div className="row">
                        {/* Total Employees */}
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
                                            <h4>{stats.total}</h4>
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
                        {/* Active Employees */}
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
                                            <h4>{stats.active}</h4>
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
                        {/* Inactive Employees */}
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
                                            <h4>{stats.inactive}</h4>
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
                        {/* New Joiners */}
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
                                            <h4>{stats.newJoiners}</h4>
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
                    </div>

                    {/* Filter and Title */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2 mb-4">
                        <div className="d-flex align-items-center flex-wrap row-gap-2">
                            <h4 className="mb-0">Employees Grid</h4>
                        </div>
                        <div className="d-flex align-items-center flex-wrap row-gap-2">
                            <div className="dropdown me-2">
                                <Link
                                    to="#"
                                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="ti ti-filter me-1" />
                                    {selectedDesignation === 'All' ? 'Designation' : selectedDesignation}
                                </Link>
                                <ul className="dropdown-menu dropdown-menu-end p-3">
                                    <li>
                                        <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setSelectedDesignation('All'); }}>
                                            All Designations
                                        </Link>
                                    </li>
                                    {dbDesignations.map(d => (
                                        <li key={d.value}>
                                            <Link to="#" className="dropdown-item rounded-1" onClick={(e) => { e.preventDefault(); setSelectedDesignation(d.label); }}>
                                                {d.label}
                                            </Link>
                                        </li>
                                    ))}
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
                                <ul className="dropdown-menu dropdown-menu-end p-3">
                                    <li>
                                        <Link to="#" className="dropdown-item rounded-1">
                                            Ascending
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Grid List */}
                    <div className="row">
                        {loading ? (
                            <div className="col-12 text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="col-12 text-center py-5">
                                <h5>No employees found</h5>
                            </div>
                        ) : (
                            filteredEmployees.map((emp) => (
                                <div className="col-xl-3 col-lg-4 col-md-6" key={emp.id}>
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="form-check form-check-md">
                                                    <input className="form-check-input" type="checkbox" />
                                                </div>
                                                <div>
                                                    <Link
                                                        to={`${all_routes.employeedetails}?id=${emp.id}`}
                                                        className="avatar avatar-xl avatar-rounded online border p-1 border-primary rounded-circle d-inline-flex justify-content-center align-items-center"
                                                        style={{ width: '80px', height: '80px' }}
                                                    >
                                                        {getAvatarUrl(emp.profilePhotoUrl) ? (
                                                            <img
                                                                src={getAvatarUrl(emp.profilePhotoUrl)!}
                                                                className="img-fluid rounded-circle"
                                                                alt="user"
                                                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                                onError={(e) => {
                                                                    e.currentTarget.onerror = null;
                                                                    e.currentTarget.src = '/assets/img/users/user-13.jpg';
                                                                }}
                                                            />
                                                        ) : (
                                                            <ImageWithBasePath
                                                                src="assets/img/users/user-13.jpg"
                                                                className="img-fluid rounded-circle"
                                                                alt="user"
                                                            />
                                                        )}
                                                    </Link>
                                                </div>
                                                <div className="dropdown">
                                                    <button
                                                        className="btn btn-icon btn-sm rounded-circle"
                                                        type="button"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false"
                                                    >
                                                        <i className="ti ti-dots-vertical" />
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end p-3">
                                                        <li>
                                                            <Link
                                                                className="dropdown-item rounded-1"
                                                                to="#"
                                                                data-bs-toggle="modal" data-inert={true}
                                                                data-bs-target="#edit_employee"
                                                                onClick={() => {
                                                                    setEditEmp({
                                                                        id: emp.id,
                                                                        firstName: emp.firstName || '',
                                                                        lastName: emp.lastName || '',
                                                                        email: emp.user?.email || emp.email || '',
                                                                        phone: emp.phone || '',
                                                                        departmentId: emp.departmentId || '',
                                                                        designationId: emp.designationId || '',
                                                                        dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '',
                                                                        profilePhotoUrl: emp.profilePhotoUrl || '',
                                                                        employeeCode: emp.employeeCode || '',
                                                                        username: emp.user?.name || '',
                                                                        company: emp.user?.company?.name || '',
                                                                        role: emp.user?.role || 'EMPLOYEE',
                                                                        reportingManagerId: emp.reportingManagerId || '',
                                                                        password: '',
                                                                        confirmPassword: '',
                                                                        basic: emp.salaryStructure?.basic || 0,
                                                                        hra: emp.salaryStructure?.hra || 0,
                                                                        conveyance: emp.salaryStructure?.conveyance || 0,
                                                                        medicalAllowance: emp.salaryStructure?.medicalAllowance || 0,
                                                                        specialAllowance: emp.salaryStructure?.specialAllowance || 0,
                                                                        pfDeduction: emp.salaryStructure?.pfDeduction || 0,
                                                                        professionalTax: emp.salaryStructure?.professionalTax || 0,
                                                                        otherDeductions: emp.salaryStructure?.otherDeductions || 0,
                                                                        grossSalary: emp.salaryStructure?.grossSalary || 0,
                                                                        netSalary: emp.salaryStructure?.netSalary || 0
                                                                    });
                                                                    setEditEmpFile(null);
                                                                    setErrorMsg('');
                                                                }}
                                                            >
                                                                <i className="ti ti-edit me-1" />
                                                                Edit
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link
                                                                className="dropdown-item rounded-1 text-danger"
                                                                to="#"
                                                                data-bs-toggle="modal" data-inert={true}
                                                                data-bs-target="#delete_modal"
                                                                onClick={() => setDeleteEmpId(emp.id)}
                                                            >
                                                                <i className="ti ti-trash me-1" />
                                                                Delete
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="text-center mb-3">
                                                <h6 className="mb-1">
                                                    <Link to={`${all_routes.employeedetails}?id=${emp.id}`}>{`${emp.firstName || ''} ${emp.lastName || ''}`.trim()}</Link>
                                                </h6>
                                                <span className="badge bg-pink-transparent fs-10 fw-medium">
                                                    {emp.designation?.name || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="row text-center">
                                                <div className="col-4">
                                                    <div className="mb-3">
                                                        <span className="fs-12">Projects</span>
                                                        <h6 className="fw-medium">20</h6>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="mb-3">
                                                        <span className="fs-12">Done</span>
                                                        <h6 className="fw-medium">13</h6>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="mb-3">
                                                        <span className="fs-12">Progress</span>
                                                        <h6 className="fw-medium">7</h6>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="mb-2 text-center">
                                                Productivity : <span className="text-purple"> 65%</span>
                                            </p>
                                            <div className="progress progress-xs mb-2">
                                                <div
                                                    className="progress-bar bg-purple"
                                                    role="progressbar"
                                                    style={{ width: "65%" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {/* /Grid List */}
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

            {/* Add Employee Modal */}
            <div className="modal fade" id="add_employee">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="d-flex align-items-center">
                                <h4 className="modal-title me-2">Add New Employee</h4>
                                <span>Employee ID : (Auto-generated)</span>
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
                                                            {newEmpFile && (
                                                                <button type="button" className="btn btn-light btn-sm" onClick={() => setNewEmpFile(null)}>
                                                                    Cancel
                                                                </button>
                                                            )}
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
                                                        options={[{ value: '', label: '-- None --' }, ...dbEmployees.map((emp: any) => ({ value: String(emp.id), label: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() }))]}
                                                        onChange={(opt) => setNewEmp({...newEmp, reportingManagerId: opt?.value || ''})}
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
                                                    setNewEmp(calculateSalary(newEmp, { basic: e.target.value }));
                                                }} />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">HRA</label>
                                                <input type="number" className="form-control" value={newEmp.hra} onChange={(e) => {
                                                    setNewEmp(calculateSalary(newEmp, { hra: e.target.value }));
                                                }} />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Conveyance</label>
                                                <input type="number" className="form-control" value={newEmp.conveyance} onChange={(e) => {
                                                    setNewEmp(calculateSalary(newEmp, { conveyance: e.target.value }));
                                                }} />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Medical Allowance</label>
                                                <input type="number" className="form-control" value={newEmp.medicalAllowance} onChange={(e) => {
                                                    setNewEmp(calculateSalary(newEmp, { medicalAllowance: e.target.value }));
                                                }} />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Special Allowance</label>
                                                <input type="number" className="form-control" value={newEmp.specialAllowance} onChange={(e) => {
                                                    setNewEmp(calculateSalary(newEmp, { specialAllowance: e.target.value }));
                                                }} />
                                            </div>

                                            <div className="col-12 mt-3 mb-3">
                                                <h6 className="fw-semibold">Deductions</h6>
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">PF Deduction</label>
                                                <input type="number" className="form-control" value={newEmp.pfDeduction} onChange={(e) => {
                                                    setNewEmp(calculateSalary(newEmp, { pfDeduction: e.target.value }));
                                                }} />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Professional Tax</label>
                                                <input type="number" className="form-control" value={newEmp.professionalTax} onChange={(e) => {
                                                    setNewEmp(calculateSalary(newEmp, { professionalTax: e.target.value }));
                                                }} />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Other Deductions</label>
                                                <input type="number" className="form-control" value={newEmp.otherDeductions} onChange={(e) => {
                                                    setNewEmp(calculateSalary(newEmp, { otherDeductions: e.target.value }));
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
                                        <p className="text-muted">Permissions can be customized after adding the employee.</p>
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
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Add Employee Modal */}

            {/* Edit Employee Modal */}
            <div className="modal fade" id="edit_employee">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="d-flex align-items-center">
                                <h4 className="modal-title me-2">Edit Employee</h4>
                                <span>Employee ID : {editEmp.employeeCode || 'N/A'}</span>
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
                                        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                                                    <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                                                        <img
                                                            src={
                                                                editEmpFile 
                                                                    ? URL.createObjectURL(editEmpFile) 
                                                                    : editEmp.profilePhotoUrl 
                                                                        ? (editEmp.profilePhotoUrl.startsWith('/') ? `${apiClient.defaults.baseURL}${editEmp.profilePhotoUrl}` : `/assets/img/users/${editEmp.profilePhotoUrl}`)
                                                                        : "/assets/img/users/user-13.jpg"
                                                            }
                                                            alt="user"
                                                            className="rounded-circle"
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = '/assets/img/users/user-13.jpg';
                                                            }}
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
                                                            {editEmpFile && (
                                                                <button type="button" className="btn btn-light btn-sm" onClick={() => setEditEmpFile(null)}>
                                                                    Cancel
                                                                </button>
                                                            )}
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
                                                    <label className="form-label">Department</label>
                                                    <CommonSelect
                                                        className="select"
                                                        options={dbDepartments}
                                                        defaultValue={dbDepartments.find(d => d.value === editEmp.departmentId)}
                                                        onChange={(opt) => setEditEmp({...editEmp, departmentId: opt?.value || ''})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Designation</label>
                                                    <CommonSelect
                                                        className="select"
                                                        options={dbDesignations}
                                                        defaultValue={dbDesignations.find(d => d.value === editEmp.designationId)}
                                                        onChange={(opt) => setEditEmp({...editEmp, designationId: opt?.value || ''})}
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
                                                        defaultValue={{ value: editEmp.role, label: editEmp.role }}
                                                        onChange={(opt) => setEditEmp({...editEmp, role: opt?.value || 'EMPLOYEE'})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Reporting Manager</label>
                                                    <CommonSelect
                                                        className="select"
                                                        options={[{ value: '', label: '-- None --' }, ...dbEmployees.filter(e => e.id !== editEmp.id).map((emp: any) => ({ value: String(emp.id), label: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() }))]}
                                                        defaultValue={{ value: String(editEmp.reportingManagerId || ''), label: editEmp.reportingManagerId ? (dbEmployees.find(e => e.id === editEmp.reportingManagerId)?.Name || 'Selected Manager') : '-- None --' }}
                                                        onChange={(opt) => setEditEmp({...editEmp, reportingManagerId: opt?.value || ''})}
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

                                            <div className="col-12 mt-3 mb-3">
                                                <h6 className="fw-semibold">Deductions</h6>
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">PF Deduction</label>
                                                <input type="number" className="form-control" value={editEmp.pfDeduction} onChange={(e) => {
                                                    setEditEmp(calculateSalary(editEmp, { pfDeduction: e.target.value }));
                                                }} />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label">Professional Tax</label>
                                                <input type="number" className="form-control" value={editEmp.professionalTax} onChange={(e) => {
                                                    setEditEmp(calculateSalary(editEmp, { professionalTax: e.target.value }));
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
                                            Save{" "}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Edit Employee Modal */}

            {/* Delete Modal */}
            <div className="modal fade" id="delete_modal" role="dialog">
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
            {/* /Delete Modal */}
        </>
    );
};

export default EmployeesGrid;
