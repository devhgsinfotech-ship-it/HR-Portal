import ImageWithBasePath from "@/core/common/imageWithBasePath";
import React from "react";
import { Link } from "react-router";
import Modal from "./modal";
import { all_routes } from "@/router/all_routes";
import CommonSelect from "@/core/common/commonSelect";
import {
  admin_dropdown,
  maximum_tokens,
  modal_type,
  response_language,
  retrain_frequency,
} from "@/core/common/selectoption/selectoption";

const AiConfiguration = () => {
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">AI Settings</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">AI Center</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    AI Settings
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
              <Link to="#" className="btn btn-primary-gradient mb-2">
                <i className="ti ti-refresh me-2" />
                Run AI Scan
              </Link>
              <div className="ms-2 mb-2 head-icons">
                <Link
                  to="#"
                  className=""
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  data-bs-original-title="Collapse"
                  id="collapse-header"
                >
                  <i className="ti ti-chevrons-up" />
                </Link>
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Start Content */}
          <div className="customer-item-wrap">
            <div className="row g-4 justify-content-center">
              <div className="col-xxl-8">
                <div className="card">
                  <div className="card-body">
                    <ul className="nav nav-tabs nav-bordered border-0 nav-bordered-primary">
                      <li className="nav-item">
                        <Link
                          to="#ai-configuration"
                          data-bs-toggle="tab"
                          aria-expanded="false"
                          className="nav-link active d-md-inline-block fw-bold"
                        >
                          AI Configuration
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="#ai-model-settings"
                          data-bs-toggle="tab"
                          aria-expanded="true"
                          className="nav-link d-md-inline-block fw-bold"
                        >
                          AI Model Settings
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="#data-training-settings"
                          data-bs-toggle="tab"
                          aria-expanded="false"
                          className="nav-link d-md-inline-block fw-bold"
                        >
                          Data Training Settings
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="#ai-permissions"
                          data-bs-toggle="tab"
                          aria-expanded="false"
                          className="nav-link d-md-inline-block fw-bold"
                        >
                          AI Permissions
                        </Link>
                      </li>
                    </ul>
                    <div className="tab-content">
                      <div className="tab-pane fade" id="ai-model-settings">
                        <p className="fw-bold text-dark mb-3 mt-3">
                          Model Configuration
                        </p>
                        {/* Row 1 */}
                        <div className="border-bottom mb-3">
                          <div className="row">
                            <div className="col-md-6">
                              <label className="mb-1 fw-medium text-dark">
                                Model Type
                              </label>
                              <CommonSelect
                                className="select"
                                options={modal_type}
                                defaultValue={modal_type[0]}
                              />

                              <p className="fs-13 mb-3 mt-1">
                                Select the AI model to use for processing
                                requests
                              </p>
                            </div>
                            <div className="col-md-6">
                              <label className="mb-1 fw-medium text-dark">
                                Maximum Tokens
                              </label>
                              <CommonSelect
                                className="select"
                                options={maximum_tokens}
                                defaultValue={maximum_tokens[0]}
                              />

                              <p className="fs-13 mt-1">
                                Maximum number of tokens to generate (1-4096)
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* Row 2 */}
                        <div className="row">
                          <p className="fw-bold text-dark mb-2">
                            Advanced Parameters
                          </p>
                          <div className="col-md-6">
                            <label className="mb-1 fw-medium text-dark">
                              Prediction Accuracy Level
                            </label>
                            <div className="d-flex align-items-center gap-2 mb-3">
                              <div
                                className="progress w-100"
                                role="progressbar"
                                aria-valuenow={75}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <div
                                  className="progress-bar bg-primary"
                                  style={{ width: "75%" }}
                                ></div>
                              </div>
                              <span className="fw-medium">75%</span>
                            </div>
                            <p className="fs-13 mt-1">
                              Higher accuracy uses more computational resources
                            </p>
                          </div>
                          <div className="col-md-6">
                            <label className="mb-1 fw-medium text-dark">
                              Response Language
                            </label>
                            <CommonSelect
                              className="select"
                              options={response_language}
                              defaultValue={response_language[0]}
                            />

                            <p className="fs-13 mt-1">
                              Maximum number of tokens to generate (1-4096)
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        className="tab-pane fade show active"
                        id="ai-configuration"
                      >
                        {/* Row 1 */}
                        <div className="d-flex justify-content-between align-items-center mt-2 py-3 border-bottom">
                          <div>
                            <h6 className="mb-1">
                              Natural Language Processing
                            </h6>
                            <p className="mb-0 fs-13">
                              Enable AI-powered text analysis and understanding
                            </p>
                          </div>
                          <div className="form-check form-switch mb-0 ps-0">
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              role="switch"
                              defaultChecked
                            />
                          </div>
                        </div>
                        {/* Row 2 */}
                        <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                          <div>
                            <h6 className="mb-1">Computer Vision</h6>
                            <p className="mb-0 fs-13">
                              Image recognition and visual content analysis
                            </p>
                          </div>
                          <div className="form-check form-switch mb-0 ps-0">
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              role="switch"
                              defaultChecked
                            />
                          </div>
                        </div>
                        {/* Row 3 */}
                        <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                          <div>
                            <h6 className="mb-1">Content Generation</h6>
                            <p className="mb-0 fs-13">
                              Automated content creation and text generation
                            </p>
                          </div>
                          <div className="form-check form-switch mb-0 ps-0">
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              role="switch"
                            />
                          </div>
                        </div>
                        {/* Row 4 */}
                        <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                          <div>
                            <h6 className="mb-1">Predictive Analytics</h6>
                            <p className="mb-0 fs-13">
                              Data forecasting and trend prediction
                            </p>
                          </div>
                          <div className="form-check form-switch mb-0 ps-0">
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              role="switch"
                              defaultChecked
                            />
                          </div>
                        </div>
                        {/* Row 5 */}
                        <div className="d-flex justify-content-between align-items-center pt-3">
                          <div>
                            <h6 className="mb-1">Recommendation Engine</h6>
                            <p className="mb-0 fs-13">
                              Personalized content and product recommendations
                            </p>
                          </div>
                          <div className="form-check form-switch mb-0 ps-0">
                            <input
                              className="form-check-input ms-0"
                              type="checkbox"
                              role="switch"
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        className="tab-pane fade"
                        id="data-training-settings"
                      >
                        <div className="col-md-6 my-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <label className="mb-1 text-dark fw-bold">
                                Training Configuration
                              </label>
                              <p>
                                Configure automatic retraining and data quality
                                settings
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="border-bottom mb-3">
                          <div className="row mb-3">
                            {/* Row 1 */}
                            <div className="col-md-6">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <label className="mb-1 text-dark fw-bold">
                                    Automatic Retraining
                                  </label>
                                  <p className="fs-13">
                                    Automatically retrain models with new data
                                  </p>
                                </div>
                                <div className="form-check form-switch mb-0 ps-0">
                                  <input
                                    className="form-check-input ms-0"
                                    type="checkbox"
                                    role="switch"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <label className="mb-2 text-dark fw-bold">
                                Retrain Frequency
                              </label>
                              <CommonSelect
                                className="select"
                                options={retrain_frequency}
                                defaultValue={retrain_frequency[0]}
                              />
                            </div>
                          </div>
                          {/* Row 2 */}
                          <div className="row mb-3">
                            <div className="col-md-6">
                              <label className="mb-2 text-dark fw-bold">
                                Response Language
                              </label>
                              <CommonSelect
                                className="select"
                                options={response_language}
                                defaultValue={response_language[0]}
                              />
                              <p className="fs-13 mt-1">
                                Maximum number of tokens to generate (1-4096)
                              </p>
                            </div>
                            <div className="col-md-6">
                              <label className="mb-2 text-dark fw-bold">
                                Prediction Accuracy Level
                              </label>
                              <div className="d-flex align-items-center gap-2 mb-3">
                                <div
                                  className="progress w-100"
                                  role="progressbar"
                                  aria-valuenow={75}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                >
                                  <div
                                    className="progress-bar bg-primary"
                                    style={{ width: "75%" }}
                                  ></div>
                                </div>
                                <span className="fw-medium">75%</span>
                              </div>
                              <p className="fs-13 mt-1">
                                Higher accuracy uses more computational
                                resources
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <label className="mb-1 text-dark fw-bold">
                              Training Datasets
                            </label>
                            <p>Manage datasets used for model training</p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-dark btn-md bg-gradient"
                          >
                            <i className="ti ti-upload me-1" />
                            Update Dataset
                          </button>
                        </div>
                        <div className="card">
                          <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                              <p className="text-dark fw-bold mb-1">
                                Customer Interactions Dataset
                              </p>
                              <p className="mb-0 small">
                                2.4 GB
                                <i className="ti ti-point-filled mx-1 text-danger" />
                                125 records
                                <i className="ti ti-point-filled mx-1 text-danger" />
                                Updated 2 hours ago
                              </p>
                            </div>
                            <div className="d-flex">
                              <button className="btn btn-icon">
                                <i className="ti ti-refresh" />
                              </button>
                              <button className="btn btn-icon">
                                <i className="ti ti-trash" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="card mb-0">
                          <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                              <p className="text-dark fw-bold mb-1">
                                Customer Interactions Dataset
                              </p>
                              <p className="mb-0 small">
                                2.4 GB
                                <i className="ti ti-point-filled mx-1 text-danger" />
                                125 records
                                <i className="ti ti-point-filled mx-1 text-danger" />
                                Updated 2 hours ago
                              </p>
                            </div>
                            <div className="d-flex">
                              <button className="btn btn-icon">
                                <i className="ti ti-refresh" />
                              </button>
                              <button className="btn btn-icon">
                                <i className="ti ti-trash" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tab-pane fade" id="ai-permissions">
                        <div className="row g-2 align-items-center my-3">
                          {/* Search */}
                          <div className="col-sm-8">
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-white border-end-0">
                                <i className="ti ti-search" />
                              </span>
                              <input
                                type="text"
                                className="form-control form-control-sm border-start-0"
                                placeholder="Search users..."
                              />
                            </div>
                          </div>
                          {/* Admin Dropdown */}
                          <div className="col-sm-2">
                            <CommonSelect
                              className="select"
                              options={admin_dropdown}
                              defaultValue={admin_dropdown[0]}
                            />
                          </div>
                          {/* Add User Button */}
                          <div className="col-sm-2">
                            <Link
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#add_users"
                              className="btn btn-dark text-nowrap d-flex align-items-center justify-content-center"
                            >
                              <i className="ti ti-plus me-1" />
                              Add User
                            </Link>
                          </div>
                        </div>
                        {/* Table */}
                        <div className="table-responsive border rounded">
                          <table className="table mb-0 align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>User</th>
                                <th>AI Config</th>
                                <th>Model Settings</th>
                                <th>Data Training</th>
                                <th>API Access</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="avatar avatar me-2 away avatar-rounded">
                                      <ImageWithBasePath
                                        src="assets/img/avatar/avatar-04.jpg"
                                        alt="avatar"
                                      />
                                    </span>
                                    <Link to="#" className="text-dark fw-bold">
                                      Anthony Lewis
                                    </Link>
                                  </div>
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="avatar avatar me-2 away avatar-rounded">
                                      <ImageWithBasePath
                                        src="assets/img/avatar/avatar-05.jpg"
                                        alt="avatar"
                                      />
                                    </span>
                                    <Link to="#" className="text-dark fw-bold">
                                      Brian Villalobos
                                    </Link>
                                  </div>
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="avatar avatar me-2 away avatar-rounded">
                                      <ImageWithBasePath
                                        src="assets/img/avatar/avatar-06.jpg"
                                        alt="avatar"
                                      />
                                    </span>
                                    <Link to="#" className="text-dark fw-bold">
                                      Harvey Smith
                                    </Link>
                                  </div>
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="avatar avatar me-2 away avatar-rounded">
                                      <ImageWithBasePath
                                        src="assets/img/avatar/avatar-07.jpg"
                                        alt="avatar"
                                      />
                                    </span>
                                    <Link to="#" className="text-dark fw-bold">
                                      Doglas Martini
                                    </Link>
                                  </div>
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                  />
                                </td>
                                <td>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultChecked
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>{" "}
                {/* end col */}
              </div>
              {/* end tab-content */}
            </div>
            {/* end card-body */}
          </div>
          {/* end card */}
          {/* Footer Buttons */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 py-2">
            <p className="mb-0">Last Updated : 15 May 2026</p>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn bg-white-gradient btn-white btn-effect"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn bg-primary-gradient btn-primary btn-effect"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* end content */}
      {/* Start Footer */}
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2014 - 2026 © SmartHR.</p>
        <p>
          Designed &amp; Developed By{" "}
          <Link to="#" className="text-primary">
            Dreams
          </Link>
        </p>
      </div>
      {/* End Footer */}
      {/* /Page Wrapper */}
      <Modal />
    </>
  );
};

export default AiConfiguration;
