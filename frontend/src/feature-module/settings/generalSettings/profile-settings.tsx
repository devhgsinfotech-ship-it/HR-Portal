import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";

const resolveImageUrl = (url: string | null | undefined) => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendBase = apiClient.defaults.baseURL || "http://localhost:5000";
  return `${backendBase.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
};

const Profilesettings = () => {
  const routes = all_routes;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    profilePhotoUrl: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/auth/profile');
        if (res.data?.success && res.data.profile) {
          const prof = res.data.profile;
          setFormData({
            firstName: prof.firstName || "",
            lastName: prof.lastName || "",
            email: prof.email || "",
            phone: prof.phone || "",
            address: prof.address || "",
            country: prof.country || "",
            state: prof.state || "",
            city: prof.city || "",
            postalCode: prof.postalCode || "",
            emergencyContactName: prof.emergencyContactName || "",
            emergencyContactPhone: prof.emergencyContactPhone || "",
            profilePhotoUrl: prof.profilePhotoUrl || "",
          });
          if (prof.profilePhotoUrl) {
            setPreviewAvatar(prof.profilePhotoUrl);
          }
        }
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        setMessage({ type: 'danger', text: err.response?.data?.message || "Failed to load user profile." });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const submitData = new FormData();
      submitData.append("firstName", formData.firstName);
      submitData.append("lastName", formData.lastName);
      submitData.append("phone", formData.phone);
      submitData.append("address", formData.address);
      submitData.append("country", formData.country);
      submitData.append("state", formData.state);
      submitData.append("city", formData.city);
      submitData.append("postalCode", formData.postalCode);
      submitData.append("emergencyContactName", formData.emergencyContactName);
      submitData.append("emergencyContactPhone", formData.emergencyContactPhone);
      if (avatarFile) {
        submitData.append("avatar", avatarFile);
      }

      const res = await apiClient.put('/auth/profile', submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: "Profile settings updated and saved successfully!" });
        if (res.data.employee?.profilePhotoUrl) {
          setFormData(prev => ({ ...prev, profilePhotoUrl: res.data.employee.profilePhotoUrl }));
          setPreviewAvatar(res.data.employee.profilePhotoUrl);
        }
      }
    } catch (err: any) {
      console.error("Failed to save profile settings:", err);
      setMessage({ type: 'danger', text: err.response?.data?.message || "Failed to save profile settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Settings</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">General Settings</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Profile Settings
                  </li>
                </ol>
              </nav>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>
          {/* /Breadcrumb */}

          <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3">
            <li className="nav-item">
              <Link className="nav-link active" to={routes.profilesettings}>
                <i className="ti ti-settings me-2" />
                General Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.businessSettings}>
                <i className="ti ti-world-cog me-2" />
                Website Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.salarySettings}>
                <i className="ti ti-device-ipad-horizontal-cog me-2" />
                App Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.emailSettings}>
                <i className="ti ti-server-cog me-2" />
                System Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.paymentGateways}>
                <i className="ti ti-settings-dollar me-2" />
                Financial Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.customCss}>
                <i className="ti ti-settings-2 me-2" />
                Other Settings
              </Link>
            </li>
          </ul>

          {message && (
            <div className={`alert alert-${message.type} alert-dismissible fade show mt-3 mb-3`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)} aria-label="Close" />
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading Profile...</span>
              </div>
            </div>
          ) : (
            <div className="row">
              <div className="col-xl-3 theiaStickySidebar">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex flex-column list-group settings-list">
                      <Link
                        to={routes.profilesettings}
                        className="d-inline-flex align-items-center rounded active py-2 px-3"
                      >
                        <i className="ti ti-arrow-badge-right me-2" />
                        Profile Settings
                      </Link>
                      <Link
                        to={routes.securitysettings}
                        className="d-inline-flex align-items-center rounded py-2 px-3"
                      >
                        Security Settings
                      </Link>
                      <Link
                        to={routes.notificationssettings}
                        className="d-inline-flex align-items-center rounded py-2 px-3"
                      >
                        Notifications
                      </Link>
                      <Link
                        to={routes.connectedApps}
                        className="d-inline-flex align-items-center rounded py-2 px-3"
                      >
                        Connected Apps
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-9">
                <div className="card">
                  <div className="card-body">
                    <div className="border-bottom mb-3 pb-3">
                      <h4>Profile Settings</h4>
                    </div>
                    <form onSubmit={handleSubmit}>
                      <div className="border-bottom mb-3">
                        <div className="row">
                          <div className="col-md-12">
                            <div>
                              <h6 className="mb-3">Basic Information</h6>
                              <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-4">
                                <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-2 flex-shrink-0 text-dark frames">
                                  {previewAvatar ? (
                                    <img
                                      src={resolveImageUrl(previewAvatar) || ""}
                                      alt="Profile Avatar"
                                      className="rounded-circle"
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  ) : (
                                    <i className="ti ti-photo text-gray-3 fs-16" />
                                  )}
                                </div>
                                <div className="profile-upload">
                                  <div className="mb-2">
                                    <h6 className="mb-1">Profile Photo</h6>
                                    <p className="fs-12">Upload JPG or PNG profile image</p>
                                  </div>
                                  <div className="profile-uploader d-flex align-items-center">
                                    <div className="drag-upload-btn btn btn-sm btn-primary me-2">
                                      Upload
                                      <input
                                        type="file"
                                        className="form-control image-sign"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-light btn-sm"
                                      onClick={() => setPreviewAvatar(formData.profilePhotoUrl)}
                                    >
                                      Reset
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
                                <input
                                  type="text"
                                  name="firstName"
                                  className="form-control"
                                  value={formData.firstName}
                                  onChange={handleChange}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row align-items-center mb-3">
                              <div className="col-md-4">
                                <label className="form-label mb-md-0">Last Name</label>
                              </div>
                              <div className="col-md-8">
                                <input
                                  type="text"
                                  name="lastName"
                                  className="form-control"
                                  value={formData.lastName}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row align-items-center mb-3">
                              <div className="col-md-4">
                                <label className="form-label mb-md-0">Email</label>
                              </div>
                              <div className="col-md-8">
                                <input
                                  type="email"
                                  name="email"
                                  className="form-control bg-light"
                                  value={formData.email}
                                  disabled
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row align-items-center mb-3">
                              <div className="col-md-4">
                                <label className="form-label mb-md-0">Phone</label>
                              </div>
                              <div className="col-md-8">
                                <input
                                  type="text"
                                  name="phone"
                                  className="form-control"
                                  value={formData.phone}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-bottom mb-3">
                        <h6 className="mb-3">Address &amp; Contact Information</h6>
                        <div className="row">
                          <div className="col-md-12">
                            <div className="row align-items-center mb-3">
                              <div className="col-md-2">
                                <label className="form-label mb-md-0">Address</label>
                              </div>
                              <div className="col-md-10">
                                <input
                                  type="text"
                                  name="address"
                                  className="form-control"
                                  value={formData.address}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row align-items-center mb-3">
                              <div className="col-md-4">
                                <label className="form-label mb-md-0">Country</label>
                              </div>
                              <div className="col-md-8">
                                <input
                                  type="text"
                                  name="country"
                                  className="form-control"
                                  value={formData.country}
                                  onChange={handleChange}
                                  placeholder="Country"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row align-items-center mb-3">
                              <div className="col-md-4">
                                <label className="form-label mb-md-0">State</label>
                              </div>
                              <div className="col-md-8">
                                <input
                                  type="text"
                                  name="state"
                                  className="form-control"
                                  value={formData.state}
                                  onChange={handleChange}
                                  placeholder="State"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row align-items-center mb-3">
                              <div className="col-md-4">
                                <label className="form-label mb-md-0">City</label>
                              </div>
                              <div className="col-md-8">
                                <input
                                  type="text"
                                  name="city"
                                  className="form-control"
                                  value={formData.city}
                                  onChange={handleChange}
                                  placeholder="City"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="row align-items-center mb-3">
                              <div className="col-md-4">
                                <label className="form-label mb-md-0">Postal Code</label>
                              </div>
                              <div className="col-md-8">
                                <input
                                  type="text"
                                  name="postalCode"
                                  className="form-control"
                                  value={formData.postalCode}
                                  onChange={handleChange}
                                  placeholder="Postal Code"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-end">
                        <button
                          type="button"
                          className="btn btn-outline-light border me-3"
                          onClick={() => window.location.reload()}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profilesettings;
