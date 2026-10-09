import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";

type PasswordField = "password" | "confirmPassword";

interface PasswordVisibility {
  password: boolean;
  confirmPassword: boolean;
}

interface PasswordResponse {
  passwordResponceText: string;
  passwordResponceKey: string;
}

const ResetPassword = () => {
  const routes = all_routes;
  const navigation = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [resolvedLogo, setResolvedLogo] = useState<string | null>(null);
  const [resolvedCompanyName, setResolvedCompanyName] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const fetchLogoByToken = async () => {
      if (!token) return;
      try {
        setLogoError(false);
        const res = await apiClient.get(`/auth/company-logo?token=${encodeURIComponent(token)}`);
        if (res.data?.success) {
          setResolvedLogo(res.data.logoUrl);
          setResolvedCompanyName(res.data.companyName);
        }
      } catch (err) {
        console.error("Failed to fetch token logo:", err);
      }
    };
    fetchLogoByToken();
  }, [token]);

  const [passwordVisibility, setPasswordVisibility] = useState<PasswordVisibility>({
    password: false,
    confirmPassword: false,
  });
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordResponce, setPasswordResponce] = useState<PasswordResponse>({
    passwordResponceText: "Use 8 or more characters with a mix of letters, numbers, and symbols.",
    passwordResponceKey: "",
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const onChangePassword = (value: string) => {
    setPassword(value);
    if (value.match(/^$|\s+/)) {
      setPasswordResponce({
        passwordResponceText: "Use 8 or more characters with a mix of letters, numbers & symbols",
        passwordResponceKey: "",
      });
    } else if (value.length === 0) {
      setPasswordResponce({
        passwordResponceText: "",
        passwordResponceKey: "",
      });
    } else if (value.length < 8) {
      setPasswordResponce({
        passwordResponceText: "Weak. Must contain at least 8 characters",
        passwordResponceKey: "0",
      });
    } else if (
      value.search(/[a-z]/) < 0 ||
      value.search(/[A-Z]/) < 0 ||
      value.search(/[0-9]/) < 0
    ) {
      setPasswordResponce({
        passwordResponceText: "Average. Must contain at least 1 upper case and number",
        passwordResponceKey: "1",
      });
    } else if (value.search(/(?=.*?[#?!@$%^&*-])/) < 0) {
      setPasswordResponce({
        passwordResponceText: "Almost. Must contain a special symbol",
        passwordResponceKey: "2",
      });
    } else {
      setPasswordResponce({
        passwordResponceText: "Awesome! You have a secure password.",
        passwordResponceKey: "3",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        password,
      });
      setSuccess(response.data.message || "Password reset successful.");
      setTimeout(() => {
        navigation(routes.resetPasswordSuccess);
      }, 2000);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fuild">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row g-0">
          <div className="col-lg-6 p-0 d-none d-lg-block" style={{ backgroundColor: "#f2f7fc" }}>
            <div className="vh-100 w-100 d-flex align-items-center justify-content-center p-5">
              <ImageWithBasePath 
                src="assets/img/bg/Hr-login-banner.png" 
                alt="HR Management Illustration" 
                className="mw-100 mh-100 object-fit-contain"
              />
            </div>
          </div>
          <div className="col-lg-6 col-md-12 col-sm-12 p-0" style={{ background: "linear-gradient(135deg, #ffffff 0%, #f4f9ff 100%)" }}>
            <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
              <div className="col-md-7 mx-auto vh-100">
                <form className="vh-100" onSubmit={handleSubmit}>
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className="mx-auto mb-5 text-center" style={{ minHeight: "60px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      {!!(resolvedLogo && !logoError) ? (
                        <div className="d-flex flex-column align-items-center gap-2">
                          <img
                            src={resolvedLogo.startsWith("http") ? resolvedLogo : `${APP_CONFIG.getBackendUrl()}${resolvedLogo}`}
                            alt={resolvedCompanyName || "Company Logo"}
                            className="img-fluid border rounded p-1 bg-white shadow-xs"
                            style={{ maxHeight: "60px", maxWidth: "180px", objectFit: "contain" }}
                            onError={() => setLogoError(true)}
                          />
                        </div>
                      ) : !!resolvedCompanyName ? (
                        <div className="d-flex flex-column align-items-center justify-content-center border rounded px-4 py-2 bg-light shadow-xs" style={{ minHeight: "55px", minWidth: "180px" }}>
                          <h4 className="fw-bold text-primary mb-0 text-uppercase" style={{ letterSpacing: "1px", fontSize: "16px" }}>
                            {resolvedCompanyName}
                          </h4>
                        </div>
                      ) : (
                        <img
                          src="/assets/img/hgs-logo-HR.webp"
                          className="img-fluid"
                          alt="HGS Logo"
                          style={{ maxHeight: "60px", maxWidth: "200px", objectFit: "contain" }}
                        />
                      )}
                    </div>
                    <div className="">
                      <div className="text-center mb-3">
                        <h2 className="mb-2">Reset Password</h2>
                        <p className="mb-0">
                          Your new password must be different from previous used
                          passwords.
                        </p>
                      </div>

                      {error && <div className="alert alert-danger p-2 text-center">{error}</div>}
                      {success && <div className="alert alert-success p-2 text-center">{success}</div>}

                      <div>
                        <div className="input-block mb-3">
                          <div className="mb-3">
                            <label className="form-label">Password</label>
                            <div className="pass-group" id="passwordInput">
                              <input
                                type={passwordVisibility.password ? "text" : "password"}
                                value={password}
                                onChange={(e) => onChangePassword(e.target.value)}
                                className="form-control pass-input"
                                placeholder="Enter your password"
                                required
                                autoComplete="new-password"
                                disabled={loading}
                              />
                              <span
                                className={`ti toggle-passwords ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"}`}
                                onClick={() => togglePasswordVisibility("password")}
                                style={{ cursor: "pointer" }}
                                role="button"
                                tabIndex={0}
                                aria-label="Toggle password visibility"
                              ></span>
                            </div>
                          </div>
                          <div
                            className={`password-strength d-flex ${passwordResponce.passwordResponceKey === "0"
                              ? "poor-active"
                              : passwordResponce.passwordResponceKey === "1"
                                ? "avg-active"
                                : passwordResponce.passwordResponceKey === "2"
                                  ? "strong-active"
                                  : passwordResponce.passwordResponceKey === "3"
                                    ? "heavy-active"
                                    : ""
                              }`}
                            id="passwordStrength"
                          >
                            <span id="poor" className="active" />
                            <span id="weak" className="active" />
                            <span id="strong" className="active" />
                            <span id="heavy" className="active" />
                          </div>
                        </div>
                        <p className="fs-12">{passwordResponce.passwordResponceText}</p>
                        <div className="mb-3">
                          <label className="form-label">Confirm Password</label>
                          <div className="pass-group">
                            <input
                              type={passwordVisibility.confirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="pass-input form-control"
                              required
                              autoComplete="new-password"
                              placeholder="Confirm your password"
                              disabled={loading}
                            />
                            <span
                              className={`ti toggle-passwords ${passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"}`}
                              onClick={() => togglePasswordVisibility("confirmPassword")}
                              role="button"
                              tabIndex={0}
                              aria-label="Toggle confirm password visibility"
                            ></span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? "Submitting..." : "Submit"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pb-4 text-center">
                      <p className="mb-0 text-gray-9">@HGS HR Management</p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
