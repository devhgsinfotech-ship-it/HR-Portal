import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CommonSelect from "../../../core/common/commonSelect";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import { useDispatch } from "react-redux";
import { updateUser } from "../../../core/data/redux/authSlice";
import apiClient from "../../../core/utils/apiClient";

type PasswordField =
  | "oldPassword"
  | "newPassword"
  | "confirmPassword"
  | "currentPassword";

const Profile = () => {
  const dispatch = useDispatch();
  const [passwordVisibility, setPasswordVisibility] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
    currentPassword: false,
  });

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "Select",
    state: "Select",
    city: "Select",
    postalCode: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [salaryStructure, setSalaryStructure] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/employees/me');
      setProfileData({
        firstName: res.data.firstName || res.data.name?.split(' ')[0] || "",
        lastName: res.data.lastName || res.data.name?.split(' ')[1] || "",
        email: res.data.email || res.data.user?.email || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
        country: res.data.country || "Select",
        state: res.data.state || "Select",
        city: res.data.city || "Select",
        postalCode: res.data.postalCode || "",
        newPassword: "",
        confirmPassword: "",
      });
      if (res.data.profilePhotoUrl) {
        setProfileImagePreview(res.data.profilePhotoUrl);
      }
      if (res.data.salaryStructure) {
        setSalaryStructure(res.data.salaryStructure);
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("firstName", profileData.firstName);
      formData.append("lastName", profileData.lastName);
      formData.append("phone", profileData.phone);
      formData.append("address", profileData.address);
      formData.append("country", profileData.country);
      formData.append("state", profileData.state);
      formData.append("city", profileData.city);
      formData.append("postalCode", profileData.postalCode);
      if (profileData.newPassword) {
        formData.append("password", profileData.newPassword);
      }
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const res = await apiClient.put('/employees/me', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMsg("Profile updated successfully!");

      const authUserStr = localStorage.getItem('authUser');
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        const newName = `${profileData.firstName} ${profileData.lastName}`.trim();
        let newPhotoUrl = res.data.profilePhotoUrl || authUser.profilePhotoUrl;

        dispatch(updateUser({ name: newName, profilePhotoUrl: newPhotoUrl }));
      }
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Error updating profile");
    }
  };

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const countryChoose = [
    { value: "Select", label: "Select" },
    { value: "USA", label: "USA" },
    { value: "Canada", label: "Canada" },
    { value: "Germany", label: "Germany" },
    { value: "France", label: "France" },
  ];
  const stateChoose = [
    { value: "Select", label: "Select" },
    { value: "california", label: "california" },
    { value: "Texas", label: "Texas" },
    { value: "New York", label: "New York" },
    { value: "Florida", label: "Florida" },
  ];
  const cityChoose = [
    { value: "Select", label: "Select" },
    { value: "Los Angeles", label: "Los Angeles" },
    { value: "San Francisco", label: "San Francisco" },
    { value: "San Diego", label: "San Diego" },
    { value: "Fresno", label: "Fresno" },
  ];

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Profile </h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Pages</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Profile{" "}
                  </li>
                </ol>
              </nav>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="card">
            <div className="card-body">
              <div className="border-bottom mb-3 pb-3">
                <h4>Profile </h4>
              </div>
              <form onSubmit={handleSubmit}>
                {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}
                <div className="border-bottom mb-3">
                  <div className="row">
                    <div className="col-md-12">
                      <div>
                        <h6 className="mb-3">Basic Information</h6>
                        <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                          <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames overflow-hidden">
                            {profileImagePreview ? (
                              <img src={profileImagePreview.startsWith('blob:') ? profileImagePreview : `http://localhost:5000${profileImagePreview}`} alt="Profile" className="img-fluid" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <i className="ti ti-photo text-gray-3 fs-16" />
                            )}
                          </div>
                          <div className="profile-upload">
                            <div className="mb-2">
                              <h6 className="mb-1">Profile Photo</h6>
                              <p className="fs-12">
                                Recommended image size is 40px x 40px
                              </p>
                            </div>
                            <div className="profile-uploader d-flex align-items-center">
                              <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                                Upload
                                <input
                                  type="file"
                                  className="form-control image-sign"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                />
                              </div>
                              <button
                                type="button"
                                className="btn btn-light btn-sm"
                                onClick={() => { setProfileImage(null); setProfileImagePreview(null); }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-md-0">First Name</label>
                        </div>
                        <div className="col-md-8">
                          <input type="text" className="form-control" name="firstName" value={profileData.firstName} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-md-0">Last Name</label>
                        </div>
                        <div className="col-md-8">
                          <input type="text" className="form-control" name="lastName" value={profileData.lastName} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-md-0">Email</label>
                        </div>
                        <div className="col-md-8">
                          <input type="text" className="form-control bg-light" name="email" value={profileData.email} disabled />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-md-0">Phone</label>
                        </div>
                        <div className="col-md-8">
                          <input type="text" className="form-control" name="phone" value={profileData.phone} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-bottom mb-3">
                  <h6 className="mb-3">Address Information</h6>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-2">
                          <label className="form-label mb-md-0">Address</label>
                        </div>
                        <div className="col-md-10">
                          <input type="text" className="form-control" name="address" value={profileData.address} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-md-0">Country</label>
                        </div>
                        <div className="col-md-8">
                          <select className="form-select" name="country" value={profileData.country} onChange={handleInputChange}>
                            {countryChoose.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-md-0">State</label>
                        </div>
                        <div className="col-md-8">
                          <div>
                            <select className="form-select" name="state" value={profileData.state} onChange={handleInputChange}>
                              {stateChoose.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-md-0">City</label>
                        </div>
                        <div className="col-md-8">
                          <div>
                            <select className="form-select" name="city" value={profileData.city} onChange={handleInputChange}>
                              <option value="Select">Select</option>
                              <option value="New York">New York</option>
                              <option value="Los Angeles">Los Angeles</option>
                              <option value="Chicago">Chicago</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-md-0">Postal Code</label>
                        </div>
                        <div className="col-md-8">
                          <input type="text" className="form-control" name="postalCode" value={profileData.postalCode} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-bottom mb-3">
                  <h6 className="mb-3">Change Password</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-4">
                          <label className="form-label mb-md-0">New Password</label>
                        </div>
                        <div className="col-md-8">
                          <div className="pass-group">
                            <input
                              type={passwordVisibility.newPassword ? "text" : "password"}
                              className="pass-input form-control"
                              name="newPassword"
                              value={profileData.newPassword}
                              onChange={handleInputChange}
                            />
                            <span
                              className={`ti toggle-passwords ${passwordVisibility.newPassword ? "ti-eye" : "ti-eye-off"}`}
                              onClick={() => togglePasswordVisibility("newPassword")}
                            ></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="row align-items-center mb-3">
                        <div className="col-md-5">
                          <label className="form-label mb-md-0">Confirm Password</label>
                        </div>
                        <div className="col-md-7">
                          <div className="pass-group">
                            <input
                              type={passwordVisibility.confirmPassword ? "text" : "password"}
                              className="pass-input form-control"
                              name="confirmPassword"
                              value={profileData.confirmPassword}
                              onChange={handleInputChange}
                            />
                            <span
                              className={`ti toggle-passwords ${passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"}`}
                              onClick={() => togglePasswordVisibility("confirmPassword")}
                            ></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {salaryStructure && (
                  <div className="border-bottom mb-3 pb-3">
                    <h6 className="mb-3">Salary Details (Read-Only)</h6>
                    <div className="row bg-light rounded p-4 mx-0">
                      <div className="col-md-4 mb-3">
                        <label className="form-label text-muted mb-1">Basic Salary</label>
                        <p className="fw-medium text-dark m-0">₹{salaryStructure.basic?.toLocaleString() || 0}</p>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label text-muted mb-1">HRA</label>
                        <p className="fw-medium text-dark m-0">₹{salaryStructure.hra?.toLocaleString() || 0}</p>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label text-muted mb-1">Conveyance</label>
                        <p className="fw-medium text-dark m-0">₹{salaryStructure.conveyance?.toLocaleString() || 0}</p>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label text-muted mb-1">Medical Allowance</label>
                        <p className="fw-medium text-dark m-0">₹{salaryStructure.medicalAllowance?.toLocaleString() || 0}</p>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label text-muted mb-1">Special Allowance</label>
                        <p className="fw-medium text-dark m-0">₹{salaryStructure.specialAllowance?.toLocaleString() || 0}</p>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label text-muted mb-1">PF Deduction</label>
                        <p className="fw-medium text-danger m-0">-₹{salaryStructure.pfDeduction?.toLocaleString() || 0}</p>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label text-muted mb-1">Professional Tax</label>
                        <p className="fw-medium text-danger m-0">-₹{salaryStructure.professionalTax?.toLocaleString() || 0}</p>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label text-muted mb-1">Other Deductions</label>
                        <p className="fw-medium text-danger m-0">-₹{salaryStructure.otherDeductions?.toLocaleString() || 0}</p>
                      </div>
                      <div className="col-md-12">
                        <hr className="my-2" />
                      </div>
                      <div className="col-md-6 mt-2">
                        <label className="form-label text-muted mb-1">Gross Salary</label>
                        <p className="fw-bold text-dark fs-3 m-0">₹{salaryStructure.grossSalary?.toLocaleString() || 0}</p>
                      </div>
                      <div className="col-md-6 mt-2">
                        <label className="form-label text-muted mb-1">Net Salary</label>
                        <p className="fw-bold text-success fs-3 m-0">₹{salaryStructure.netSalary?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex align-items-center justify-content-end">
                  <button type="button" className="btn btn-outline-light border me-3">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
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

export default Profile;
