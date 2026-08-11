import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CollapseHeader from '../../../core/common/collapse-header/collapse-header'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { all_routes } from '../../../router/all_routes'
import apiClient from '../../../core/utils/apiClient'
import { LoadingSpinner } from '../../../core/common/LoadingSpinner'

const PaySlip = () => {
    const [employeeData, setEmployeeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayslip = async () => {
            try {
                const res = await apiClient.get('/employees/me');
                setEmployeeData(res.data);
            } catch (error) {
                console.error("Error fetching payslip details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayslip();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <LoadingSpinner text="Loading Payslip..." />
    }

    const salaryStructure = employeeData?.salaryStructure || {};
    const company = employeeData?.user?.company || {};
    const designation = employeeData?.designation?.name || 'Employee';

    return (
        <>
            <style>
                {`
                @media print {
                    .sidebar, .header, .page-breadcrumb, .footer, .btn, .head-icons {
                        display: none !important;
                    }
                    .page-wrapper {
                        margin-left: 0 !important;
                        padding-top: 0 !important;
                        padding: 0 !important;
                        background: #fff;
                    }
                    body {
                        background: #fff;
                    }
                    .card {
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
                `}
            </style>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Payslip</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Payroll</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Payslip
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
                            <div className="mb-2">
                                <button type="button" className="btn btn-dark d-flex align-items-center" onClick={handlePrint}>
                                    <i className="ti ti-download me-2" />
                                    Download / Print
                                </button>
                            </div>
                            <div className="head-icons ms-2">
                                <CollapseHeader />
                            </div>
                        </div>
                    </div>
                    {/* /Breadcrumb */}
                    {/* Invoices */}
                    <div>
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="row justify-content-between align-items-center border-bottom mb-3">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <div className="mb-2 invoice-logo">
                                                        {company.logoUrl ? (
                                                            <img src={`http://localhost:5000${company.logoUrl}`} className="img-fluid logo" alt="logo" style={{ maxHeight: '50px' }} />
                                                        ) : (
                                                            <ImageWithBasePath src="assets/img/logo.svg" className="img-fluid logo" alt="logo" />
                                                        )}
                                                    </div>
                                                    <p>{company.address || 'Company Address Not Set'}</p>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className=" text-end mb-3">
                                                    <h5 className="text-gray mb-1">
                                                        Payslip No{" "}
                                                        <span className="text-primary"> #PS{employeeData?.id?.toString().padStart(4, '0')}</span>
                                                    </h5>
                                                    <p className="fw-medium">
                                                        Salary Month :{" "}
                                                        <span className="text-dark">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>{" "}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row border-bottom align-items-center mb-3">
                                            <div className="col-md-5">
                                                <div className="mb-3">
                                                    <p className="text-dark mb-2 fw-semibold">From</p>
                                                    <div>
                                                        <h4 className="mb-1">{company.name || 'Company Name'}</h4>
                                                        <p className="mb-1">
                                                            {company.address || 'Address Not Provided'}
                                                        </p>
                                                        <p className="mb-1">
                                                            Email :{" "}
                                                            <span className="text-dark">{company.emailDomain ? `hr@${company.emailDomain}` : 'hr@company.com'}</span>
                                                        </p>
                                                        <p>
                                                            Phone :{" "}
                                                            <span className="text-dark">{company.phone || '+91 000 000 0000'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-5">
                                                <div className="mb-3">
                                                    <p className="text-dark mb-2 fw-semibold">To</p>
                                                    <div>
                                                        <h4 className="mb-1">{employeeData?.firstName} {employeeData?.lastName}</h4>
                                                        <p className="mb-1">{designation}</p>
                                                        <p className="mb-1">
                                                            Email :{" "}
                                                            <span className="text-dark">{employeeData?.user?.email}</span>
                                                        </p>
                                                        <p>
                                                            Phone :{" "}
                                                            <span className="text-dark">{employeeData?.phone || 'N/A'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="text-center mb-4">
                                                Payslip for the month of {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </h5>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="list-group mb-3">
                                                        <div className="list-group-item bg-light p-3 border-bottom-0">
                                                            <h6>Earnings</h6>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0">Basic Salary</p>
                                                                <h6 className="fw-medium">₹{salaryStructure.basic?.toLocaleString() || 0}</h6>
                                                            </div>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0">
                                                                    House Rent Allowance (H.R.A.)
                                                                </p>
                                                                <h6 className="fw-medium">₹{salaryStructure.hra?.toLocaleString() || 0}</h6>
                                                            </div>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0">Conveyance</p>
                                                                <h6 className="fw-medium">₹{salaryStructure.conveyance?.toLocaleString() || 0}</h6>
                                                            </div>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0">Medical Allowance</p>
                                                                <h6 className="fw-medium">₹{salaryStructure.medicalAllowance?.toLocaleString() || 0}</h6>
                                                            </div>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0">Special Allowance</p>
                                                                <h6 className="fw-medium">₹{salaryStructure.specialAllowance?.toLocaleString() || 0}</h6>
                                                            </div>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0 fw-bold">Total Earnings</p>
                                                                <h6 className="fw-bold">₹{salaryStructure.grossSalary?.toLocaleString() || 0}</h6>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="list-group mb-3">
                                                        <div className="list-group-item bg-light p-3 border-bottom-0">
                                                            <h6>Deductions</h6>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0">Provident Fund (PF)</p>
                                                                <h6 className="fw-medium">₹{salaryStructure.pfDeduction?.toLocaleString() || 0}</h6>
                                                            </div>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0">Professional Tax</p>
                                                                <h6 className="fw-medium">₹{salaryStructure.professionalTax?.toLocaleString() || 0}</h6>
                                                            </div>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0">Other Deductions</p>
                                                                <h6 className="fw-medium">₹{salaryStructure.otherDeductions?.toLocaleString() || 0}</h6>
                                                            </div>
                                                        </div>
                                                        <div className="list-group-item border-0">
                                                            {/* Spacer to align with earnings */}
                                                            <div className="d-flex align-items-center justify-content-between p-2"></div>
                                                        </div>
                                                        <div className="list-group-item border-0">
                                                            <div className="d-flex align-items-center justify-content-between p-2"></div>
                                                        </div>
                                                        <div className="list-group-item">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <p className="mb-0 fw-bold">Total Deductions</p>
                                                                <h6 className="fw-bold">
                                                                    ₹{(Number(salaryStructure.pfDeduction || 0) + Number(salaryStructure.professionalTax || 0) + Number(salaryStructure.otherDeductions || 0)).toLocaleString()}
                                                                </h6>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <h5 className="text-dark">
                                                    Net Salary :{" "}
                                                    <span className="text-success fw-bold">
                                                        ₹{salaryStructure.netSalary?.toLocaleString() || 0}
                                                    </span>
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /Invoices */}
                </div>
                {/* Footer */}
                <div className="footer d-sm-flex align-items-center justify-content-between bg-white border-top p-3">
                    <p className="mb-0">2014 - 2026 © SmartHR.</p>
                    <p>
                        Designed &amp; Developed By{" "}
                        <Link to="#" className="text-primary">
                            Dreams
                        </Link>
                    </p>
                </div>
                {/* /Footer */}
            </div>
            {/* /Page Wrapper */}
        </>
    )
}

export default PaySlip
