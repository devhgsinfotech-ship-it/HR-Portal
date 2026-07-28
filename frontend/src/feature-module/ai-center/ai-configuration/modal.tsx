import CommonSelect from "@/core/common/commonSelect";
import { role } from "@/core/common/selectoption/selectoption";
import React, { useState } from "react";

const Modal = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <>
      {/* Add Users */}
      <div className="modal fade" id="add_users">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add User</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form action="users.html">
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">First Name</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">User Name</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Password</label>

                      <div className="pass-group position-relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control pe-5"
                        />

                        <span
                          className={`ti toggle-password ${
                            showPassword ? "ti-eye" : "ti-eye-off"
                          } position-absolute top-50 end-0 translate-middle-y me-3`}
                          style={{ cursor: "pointer", zIndex: 10 }}
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Confirm Password</label>

                      <div className="pass-group position-relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control pe-5"
                        />

                        <span
                          className={`ti toggle-password ${
                            showConfirmPassword ? "ti-eye" : "ti-eye-off"
                          } position-absolute top-50 end-0 translate-middle-y me-3`}
                          style={{ cursor: "pointer", zIndex: 10 }}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input type="text" className="form-control" />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <CommonSelect
                              className="select"
                              options={role}
                              defaultValue={role[0]}
                            />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="card">
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table ">
                            <thead className="thead-light">
                              <tr>
                                <th>Module Permissions</th>
                                <th>Read</th>
                                <th>Write</th>
                                <th>Create</th>
                                <th>Delete</th>
                                <th>Import</th>
                                <th>Export</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <h6 className="fs-14 fw-normal text-gray-9">
                                    Employee
                                  </h6>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <h6 className="fs-14 fw-normal text-gray-9">
                                    Holidays
                                  </h6>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <h6 className="fs-14 fw-normal text-gray-9">
                                    Leaves
                                  </h6>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <h6 className="fs-14 fw-normal text-gray-9">
                                    Events
                                  </h6>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="form-check form-check-md">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                    />
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
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
                <button type="submit" className="btn btn-primary">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Users */}
    </>
  );
};

export default Modal;
