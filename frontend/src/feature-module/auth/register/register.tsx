import { useState } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import apiClient from "../../../core/utils/apiClient";

type PasswordField = "password" | "confirmPassword";

interface PasswordVisibility {
  password: boolean;
  confirmPassword: boolean;
}

const Register = () => {
  const routes = all_routes;

  // Form fields
  const [fullName, setFullName]         = useState("");
  const [email, setEmail]               = useState("");
  const [companyName, setCompanyName]   = useState("");
  const [phone, setPhone]               = useState("");
  const [companySize, setCompanySize]   = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms]     = useState(false);

  // UI state
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>({
    password: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Company name change — no subdomain preview for user
  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/register", {
        companyName,
        contactPerson: fullName,
        email,
        phone,
        companySize,
        password,
      });

      const { company } = response.data;
      setWorkspaceUrl(
        company.workspaceUrl || `http://${company.subdomain}.yourhrms.com/login`
      );
      setRegisteredEmail(email);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────
  if (success) {
    return (
      <div className="container-fuild">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
          <div className="row justify-content-center align-items-center vh-100">
            <div className="col-md-6 col-lg-5 mx-auto px-3">
              <div className="card shadow-sm text-center p-4">
                <div className="mb-3">
                  <div className="mx-auto mb-3" style={{ maxWidth: 160 }}>
                    <ImageWithBasePath
                      src="assets/img/logo.svg"
                      className="img-fluid"
                      alt="Logo"
                    />
                  </div>
                  <i
                    className="ti ti-circle-check text-success d-block mb-2"
                    style={{ fontSize: 56 }}
                  />
                  <h3 className="mb-2">Company Registered!</h3>
                  <p className="text-muted mb-3">
                    We've sent a verification email to{" "}
                    <strong>{registeredEmail}</strong>.<br />
                    Please verify your email to activate your workspace.
                  </p>
                </div>

                <div className="card bg-light mb-3 p-3 text-start">
                  <p className="mb-1 fw-semibold">
                    <i className="ti ti-world me-1" /> Your Workspace URL:
                  </p>
                  <p className="text-primary mb-0 fw-semibold">{workspaceUrl}</p>
                </div>



                <a href={`${workspaceUrl}/login`} className="btn btn-primary w-100 mb-2">
                  Go to Login
                </a>
                <p className="text-muted small mb-0">
                  Didn't receive the email?{" "}
                  <Link to="#" className="hover-a">
                    Resend
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration Form ─────────────────────────────────────────────
  return (
    <div className="container-fuild">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row">

          {/* Left panel */}
          <div className="col-lg-5">
            <div className="login-background position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100">
              <div className="bg-overlay-img">
                <ImageWithBasePath
                  src="assets/img/bg/bg-01.png"
                  className="bg-1"
                  alt="Background pattern 1"
                />
                <ImageWithBasePath
                  src="assets/img/bg/bg-02.png"
                  className="bg-2"
                  alt="Background pattern 2"
                />
                <ImageWithBasePath
                  src="assets/img/bg/bg-03.png"
                  className="bg-3"
                  alt="Background pattern 3"
                />
              </div>
              <div className="authentication-card w-100">
                <div className="authen-overlay-item border w-100">
                  <h1 className="text-white display-1">
                    Start managing <br /> your workforce <br /> smarter.
                  </h1>
                  <div className="my-4 mx-auto authen-overlay-img">
                    <ImageWithBasePath
                      src="assets/img/bg/authentication-bg-01.png"
                      alt="Authentication illustration"
                    />
                  </div>
                  <p className="text-white fs-20 fw-semibold text-center">
                    Join thousands of companies <br /> using our HRMS platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel — Form */}
          <div className="col-lg-7 col-md-12 col-sm-12">
            <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
              <div className="col-md-8 mx-auto py-4 px-3">

                <div className="text-center mb-4">
                  <div className="mx-auto mb-3" style={{ maxWidth: 160 }}>
                    <ImageWithBasePath
                      src="assets/img/logo.svg"
                      className="img-fluid"
                      alt="Logo"
                    />
                  </div>
                  <h2 className="mb-1">Register Your Company</h2>
                  <p className="text-muted mb-0">
                    Create your HRMS workspace in minutes
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger p-2 mb-3">{error}</div>
                  )}

                  {/* Full Name */}
                  <div className="mb-3">
                    <label className="form-label">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control border-end-0"
                        placeholder="Vikramjeet Singh"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                      <span className="input-group-text border-start-0">
                        <i className="ti ti-user" />
                      </span>
                    </div>
                  </div>

                  {/* Business Email */}
                  <div className="mb-3">
                    <label className="form-label">
                      Business Email <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="email"
                        className="form-control border-end-0"
                        placeholder="hr@yourcompany.com"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <span className="input-group-text border-start-0">
                        <i className="ti ti-mail" />
                      </span>
                    </div>
                  </div>

                  {/* Company Name — no subdomain preview, backend handles it */}
                  <div className="mb-3">
                    <label className="form-label">
                      Company Name <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control border-end-0"
                        placeholder="TechCorp Pvt Ltd"
                        required
                        value={companyName}
                        onChange={(e) => handleCompanyNameChange(e.target.value)}
                      />
                      <span className="input-group-text border-start-0">
                        <i className="ti ti-building" />
                      </span>
                    </div>
                  </div>

                  {/* Phone Number + Company Size side by side */}
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label">
                        Phone Number <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type="tel"
                          className="form-control border-end-0"
                          placeholder="9988776655"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                        <span className="input-group-text border-start-0">
                          <i className="ti ti-phone" />
                        </span>
                      </div>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Company Size</label>
                      <select
                        className="form-select"
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                      >
                        <option value="">Select size</option>
                        <option value="5-20">5 – 20 employees</option>
                        <option value="20-40">20 – 40 employees</option>
                        <option value="40-80">40 – 80 employees</option>
                        <option value="80-150">80 – 150 employees</option>
                        <option value="150-300">150 – 300 employees</option>
                        <option value="300+">300+ employees</option>
                      </select>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label className="form-label">
                      Password <span className="text-danger">*</span>
                    </label>
                    <div className="pass-group">
                      <input
                        type={passwordVisibility.password ? "text" : "password"}
                        className="pass-input form-control"
                        placeholder="Min 8 characters"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <span
                        className={`ti toggle-passwords ${
                          passwordVisibility.password ? "ti-eye" : "ti-eye-off"
                        }`}
                        onClick={() => togglePasswordVisibility("password")}
                        role="button"
                        tabIndex={0}
                        aria-label="Toggle password visibility"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-3">
                    <label className="form-label">
                      Confirm Password <span className="text-danger">*</span>
                    </label>
                    <div className="pass-group">
                      <input
                        type={
                          passwordVisibility.confirmPassword ? "text" : "password"
                        }
                        className="pass-input form-control"
                        placeholder="Re-enter password"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <span
                        className={`ti toggle-passwords ${
                          passwordVisibility.confirmPassword
                            ? "ti-eye"
                            : "ti-eye-off"
                        }`}
                        onClick={() =>
                          togglePasswordVisibility("confirmPassword")
                        }
                        role="button"
                        tabIndex={0}
                        aria-label="Toggle confirm password visibility"
                      />
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        id="agree_terms"
                        type="checkbox"
                        required
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                      />
                      <label
                        htmlFor="agree_terms"
                        className="form-check-label text-dark mt-0"
                      >
                        I agree to the{" "}
                        <span className="text-primary">
                          Terms &amp; Privacy Policy
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          />
                          Creating Workspace...
                        </>
                      ) : (
                        "Create Workspace"
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <h6 className="fw-normal text-dark mb-0">
                      Already have an account?{" "}
                      <Link to={routes.login} className="hover-a ms-1">
                        Sign In
                      </Link>
                    </h6>
                  </div>
                </form>

                <div className="mt-4 pb-3 text-center">
                  <p className="mb-0 text-muted small">
                    Copyright © 2024 - HRMS Portal
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;
