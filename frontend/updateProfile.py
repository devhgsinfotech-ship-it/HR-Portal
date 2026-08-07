import re

filepath = r"e:\Vikramjeet\hr-portal\frontend\src\feature-module\pages\profile\index.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the imports and state at the top
top_repl = """import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CommonSelect from "../../../core/common/commonSelect";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../../router/all_routes";
import apiClient from "../../../core/utils/apiClient";

type PasswordField =
  | "oldPassword"
  | "newPassword"
  | "confirmPassword"
  | "currentPassword";

const Profile = () => {
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
    newPassword: "",
    confirmPassword: "",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
        newPassword: "",
        confirmPassword: "",
      });
      if (res.data.profilePhotoUrl) {
        setProfileImagePreview(res.data.profilePhotoUrl);
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
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
      if (profileData.newPassword) {
        formData.append("password", profileData.newPassword);
      }
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      await apiClient.put('/employees/me', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMsg("Profile updated successfully!");
      
      const authUserStr = localStorage.getItem('authUser');
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        authUser.name = `${profileData.firstName} ${profileData.lastName}`.trim();
        if (profileImagePreview && profileImagePreview.startsWith('http')) {
           authUser.profilePhotoUrl = profileImagePreview;
        }
        localStorage.setItem('authUser', JSON.stringify(authUser));
      }
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Error updating profile");
    }
  };

  const countryChoose = [
"""

content = re.sub(r'import \{ useState \} from "react";.*?const countryChoose = \[', top_repl, content, flags=re.DOTALL)

# Replace the form content
form_repl = """              <form onSubmit={handleSubmit}>
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
                              <img src={profileImagePreview.startsWith('blob:') ? profileImagePreview : `http://localhost:5000${profileImagePreview}`} alt="Profile" className="img-fluid" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
                <div className="d-flex align-items-center justify-content-end">
                  <button type="button" className="btn btn-outline-light border me-3">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>"""

content = re.sub(r'<form>.*?</form>', form_repl, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
