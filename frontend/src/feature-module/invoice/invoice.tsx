import ImageWithBasePath from '@/core/common/imageWithBasePath';
import { invoiceData } from '@/core/data/json/invoice';
import React from 'react'
import { Link } from 'react-router'
import Table from "../../core/common/dataTable/index";
import PredefinedDatePicker from '@/core/common/datePicker';
import { all_routes } from '@/router/all_routes';
import CollapseHeader from '@/core/common/collapse-header/collapse-header';

// Define a type for invoice data
interface Invoice {
  Invoice_ID: string;
  Client_Name: string;
  job: string;
  Company_Name: string;
  Estimate_Date: string;
  Expiry_Date: string;
  Amount: string;
  Status: string;
  avatar: string;
}

const Invoice = () => {
  const data: Invoice[] = invoiceData;
  const columns = [
    {
      title: " Invoice ID",
      dataIndex: "Invoice_ID",

      sorter: (a: Invoice, b: Invoice) =>
        a.Invoice_ID.length - b.Invoice_ID.length,
    },
    {
      title: " Client Name",
      dataIndex: "Client_Name",
      render: (_text: string, record: Invoice) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link to="#" className="avatar avatar-md ">
            <ImageWithBasePath
              src={`assets/img/users/${record.avatar}`}
              className="img-fluid rounded-circle"
              alt={record.Client_Name}
            />
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{record.Client_Name}</Link>
            </h6>
            <span className="d-block mt-1">{record.job}</span>
          </div>
        </div>
      ),
      sorter: (a: Invoice, b: Invoice) =>
        a.Client_Name.length - b.Client_Name.length,
    },
    {
      title: " Company Name",
      dataIndex: "Company_Name",

      sorter: (a: Invoice, b: Invoice) =>
        a.Company_Name.length - b.Company_Name.length,
    },
    {
      title: " Estimate Date",
      dataIndex: "Estimate_Date",

      sorter: (a: Invoice, b: Invoice) =>
        a.Estimate_Date.length - b.Estimate_Date.length,
    },
    {
      title: " Expiry Date",
      dataIndex: "Expiry_Date",

      sorter: (a: Invoice, b: Invoice) =>
        a.Expiry_Date.length - b.Expiry_Date.length,
    },
    {
      title: " Amount",
      dataIndex: "Amount",

      sorter: (a: Invoice, b: Invoice) =>
        a.Amount.length - b.Amount.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <span
          className={`badge border   ${text === "Send"
            ? "border-purple text-purple"
            : text === "Expired"
              ? "border-warning text-warning"
              : text === "Accepted"
                ? "border-success text-success"
                : text === "Declined"
                  ? "border-danger text-danger"
                  : "border-pink text-pink"
            }`}
        >
          <i className="ti ti-point-filled" />
          {text}
        </span>
      ),
      sorter: (a: Invoice, b: Invoice) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: () => (
        <div className="action-icon d-inline-flex">
          <Link to="#" className="me-2" data-bs-toggle="modal" data-bs-target="#edit_contact" aria-label="Edit contact">
            <i className="ti ti-edit"></i>
          </Link>
          <Link to="#" data-bs-toggle="modal" data-bs-target="#delete_modal" aria-label="Delete contact">
            <i className="ti ti-trash"></i>
          </Link>
        </div>
      ),
    },
  ]
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Invoices</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Sales</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Invoice
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
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
                  to={all_routes.addinvoice}
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Invoices
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Invoices List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-3">
                  <div className="me-3 input-icon position-relative">
                    <PredefinedDatePicker />
                  </div>
                </div>
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    $0.00 - $00
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        $0.00 - $00
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        $3000
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        $2500
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
                        Accepted
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Sent
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Expired
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Declined
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
                        Desending
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
              <div className="custom-datatable-filter table-responsive">
                <table className="table datatable">
                  <thead className="thead-light">
                    <tr>
                      <th className="no-sort">
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="select-all"
                          />
                        </div>
                      </th>
                      <th>Invoice ID</th>
                      <th>Client Name</th>
                      <th>Company Name</th>
                      <th>Estimate Date</th>
                      <th>Expiry Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-001
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md ">
                            <ImageWithBasePath
                              src="assets/img/users/user-09.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Michael Walker</Link>
                            </h6>
                            <span className="d-block mt-1">CEO</span>
                          </div>
                        </div>
                      </td>
                      <td>BrightWave Innovations</td>
                      <td>14 Jan 2024</td>
                      <td>15 Jan 2024</td>
                      <td>$3000</td>
                      <td>
                        <span className="badge badge-soft-purple">
                          <i className="ti ti-point-filled" />
                          Sent
                        </span>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-002
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md ">
                            <ImageWithBasePath
                              src="assets/img/users/user-40.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Sophie Headrick</Link>
                            </h6>
                            <span className="d-block mt-1">Manager</span>
                          </div>
                        </div>
                      </td>
                      <td>Stellar Dynamics</td>
                      <td>21 Jan 2024</td>
                      <td>25 Jan 2024</td>
                      <td>$2500</td>
                      <td>
                        <span className="badge badge-soft-purple">
                          <i className="ti ti-point-filled" />
                          Sent
                        </span>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-003
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md ">
                            <ImageWithBasePath
                              src="assets/img/users/user-41.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Cameron Drake</Link>
                            </h6>
                            <span className="d-block mt-1">Director</span>
                          </div>
                        </div>
                      </td>
                      <td>Quantum Nexus</td>
                      <td>20 Feb 2024</td>
                      <td>22 Feb 2024</td>
                      <td>$2800</td>
                      <td>
                        <span className="badge badge-soft-warning">
                          <i className="ti ti-point-filled" />
                          Expired
                        </span>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-004
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md ">
                            <ImageWithBasePath
                              src="assets/img/users/user-42.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Doris Crowley</Link>
                            </h6>
                            <span className="d-block mt-1">Consultant</span>
                          </div>
                        </div>
                      </td>
                      <td>EcoVision Enterprises</td>
                      <td>15 Mar 2024</td>
                      <td>17 Mar 2024</td>
                      <td>$3300</td>
                      <td>
                        <span className="badge badge-soft-success">
                          <i className="ti ti-point-filled" />
                          Accepted
                        </span>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-005
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md ">
                            <ImageWithBasePath
                              src="assets/img/users/user-44.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Thomas Bordelon</Link>
                            </h6>
                            <span className="d-block mt-1">Manager</span>
                          </div>
                        </div>
                      </td>
                      <td>Aurora Technologies</td>
                      <td>12 Apr 2024</td>
                      <td>16 Apr 2024</td>
                      <td>$3600</td>
                      <td>
                        <span className="badge badge-soft-danger">
                          <i className="ti ti-point-filled" />
                          Declined
                        </span>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-006
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md ">
                            <ImageWithBasePath
                              src="assets/img/users/user-45.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Kathleen Gutierrez</Link>
                            </h6>
                            <span className="d-block mt-1">Director</span>
                          </div>
                        </div>
                      </td>
                      <td>BlueSky Ventures</td>
                      <td>20 Apr 2024</td>
                      <td>21 Apr 2024</td>
                      <td>$2000</td>
                      <td>
                        <span className="badge badge-soft-purple">
                          <i className="ti ti-point-filled" />
                          Sent
                        </span>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-007
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md">
                            <ImageWithBasePath
                              src="assets/img/users/user-46.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Bruce Wright</Link>
                            </h6>
                            <span className="d-block mt-1">CEO</span>
                          </div>
                        </div>
                      </td>
                      <td>TerraFusion Energy</td>
                      <td>06 Jul 2024</td>
                      <td>06 Jul 2024</td>
                      <td>$3400</td>
                      <td>
                        <span className="badge badge-soft-warning">
                          <i className="ti ti-point-filled" />
                          Expired
                        </span>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-008
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md ">
                            <ImageWithBasePath
                              src="assets/img/users/user-47.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Estelle Morgan</Link>
                            </h6>
                            <span className="d-block mt-1">Manager</span>
                          </div>
                        </div>
                      </td>
                      <td>UrbanPulse Design</td>
                      <td>02 Sep 2024</td>
                      <td>04 Sep 2024</td>
                      <td>$4000</td>
                      <td>
                        <span className="badge badge-soft-danger">
                          <i className="ti ti-point-filled" />
                          Declined
                        </span>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-009
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md ">
                            <ImageWithBasePath
                              src="assets/img/users/user-48.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Stephen Dias</Link>
                            </h6>
                            <span className="d-block mt-1">CEO</span>
                          </div>
                        </div>
                      </td>
                      <td>Nimbus Networks</td>
                      <td>15 Nov 2024</td>
                      <td>15 Nov 2024</td>
                      <td>$4500</td>
                      <td>
                        <div>
                          <span className="badge badge-soft-success">
                            <i className="ti ti-point-filled" />
                            Accepted
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                      </td>
                      <td>
                        <Link to={all_routes.invoiceDetails}>
                          Inv-010
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <Link to="#" className="avatar avatar-md ">
                            <ImageWithBasePath
                              src="assets/img/users/user-43.jpg"
                              className="img-fluid rounded-circle"
                              alt="img"
                            />
                          </Link>
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <Link to="#">Angela Thomas</Link>
                            </h6>
                            <span className="d-block mt-1">Consultant</span>
                          </div>
                        </div>
                      </td>
                      <td>Epicurean Delights</td>
                      <td>10 Dec 2024</td>
                      <td>11 Dec 2024</td>
                      <td>$3800</td>
                      <td>
                        <span className="badge badge-soft-purple">
                          <i className="ti ti-point-filled" />
                          Sent
                        </span>
                      </td>
                      <td>
                        <div className="action-icon d-inline-flex">
                          <Link to={all_routes.editinvoice} className="me-2">
                            <i className="ti ti-edit" />
                          </Link>
                          <Link
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
    </>

  );
};

export default Invoice;