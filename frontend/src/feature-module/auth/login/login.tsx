import { getSubdomain } from '../../../core/utils/apiClient';
import { useState, useEffect } from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { APP_CONFIG } from "../../../environment";
import { Link, useNavigate } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import apiClient from "../../../core/utils/apiClient";
import { useAppDispatch } from "../../../core/data/redux/store";
import { setCredentials } from "../../../core/data/redux/authSlice";
type PasswordField = "password";

const Login = () => {
  const routes = all_routes;
  const navigation = useNavigate();
  const dispatch = useAppDispatch();
  const apiUrl = APP_CONFIG.getBackendUrl();

  const subdomain = getSubdomain();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resolvedLogo, setResolvedLogo] = useState<string | null>(null);
  const [resolvedCompanyName, setResolvedCompanyName] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  // Auto-resolve logo by subdomain on mount
  useEffect(() => {
    const fetchSubdomainLogo = async () => {
      if (!subdomain) return;
      try {
        setLogoError(false);
        const res = await apiClient.get(`/auth/company-logo?subdomain=${subdomain}`);
        if (res.data?.success) {
          setResolvedLogo(res.data.logoUrl);
          setResolvedCompanyName(res.data.companyName);
        }
      } catch (err) {
        console.error("Failed to fetch subdomain logo:", err);
      }
    };
    fetchSubdomainLogo();
  }, [subdomain]);

  // Resolve logo by email domain on blur
  const handleEmailBlur = async () => {
    if (!email || !email.includes("@")) return;
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return;

    const publicDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"];
    if (publicDomains.includes(domain)) return;

    try {
      setLogoError(false);
      const res = await apiClient.get(`/auth/company-logo?emailDomain=${domain}`);
      if (res.data?.success) {
        setResolvedLogo(res.data.logoUrl);
        setResolvedCompanyName(res.data.companyName);
      }
    } catch (err) {
      console.error("Failed to load email domain logo:", err);
    }
  };


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent page reload
    setError(""); // Clear previous errors

    try {
      // Call our backend API
      const response = await apiClient.post("/auth/login", {
        email,
        password,
        subdomain, // Will be null on main site, "techcorp" on company workspace
      });

      // If successful, store the token in localStorage
      const { token, user } = response.data;
      // localStorage.setItem("token", token);

      // // Store user role in localStorage (or Redux later) so we know who is logged in
      // localStorage.setItem("userRole", user.role);

      // With this:
      dispatch(setCredentials({ token, user }));

      // Check onboarding status first (HR and Employees must complete onboarding)
      const onboardingStatus = user.onboardingStatus || 'INVITED';
      
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'COMPANY_ADMIN' && onboardingStatus !== 'COMPLETED') {
        navigation('/onboarding');
      } else {
        // Redirect based on role if onboarding is completed or user is SUPER_ADMIN / COMPANY_ADMIN
        if (user.role === "SUPER_ADMIN") {
          navigation(routes.superAdminDashboard);
        } else if (user.role === "COMPANY_ADMIN") {
          navigation(routes.adminDashboard);
        } else if (user.role === "HR") {
          navigation(routes.hrDashboard);
        } else {
          navigation(routes.employeeDashboard);
        }
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      // Show error message from backend if available
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
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
                <form className="vh-100" onSubmit={handleLogin}>
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className="mx-auto mb-5 text-center" style={{ minHeight: "60px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      {!!(resolvedLogo && !logoError) ? (
                        <div className="d-flex flex-column align-items-center gap-2">
                          <img
                            src={resolvedLogo.startsWith("http") ? resolvedLogo : `${apiUrl}${resolvedLogo}`}
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
                        <h2 className="mb-2">Sign In</h2>
                        <p className="mb-0">Please enter your details to sign in</p>
                      </div>
                      <div className="mb-3">
                        {error && <div className="alert alert-danger p-2">{error}</div>}
                        <label className="form-label fw-bold text-dark fs-14">Email Address</label>
                        <div className="input-group">
                          <input
                            type="email"
                            className="form-control border-end-0 shadow-none"
                            style={{ backgroundColor: "#f0f6ff", borderColor: "#dbeafe", padding: "12px" }}
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={handleEmailBlur}
                          />
                          <span className="input-group-text border-start-0" style={{ backgroundColor: "#f0f6ff", borderColor: "#dbeafe" }}>
                            <i className="ti ti-mail text-secondary" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-bold text-dark fs-14">Password</label>
                        <div className="pass-group input-group">
                          <input
                            type={passwordVisibility.password ? "text" : "password"}
                            className="pass-input form-control border-end-0 shadow-none"
                            style={{ backgroundColor: "#f0f6ff", borderColor: "#dbeafe", padding: "12px" }}
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <span
                            className={`input-group-text border-start-0 ti toggle-passwords ${passwordVisibility.password ? "ti-eye" : "ti-eye-off"} text-secondary`}
                            style={{ backgroundColor: "#f0f6ff", borderColor: "#dbeafe", cursor: "pointer" }}
                            onClick={() => togglePasswordVisibility("password")}
                            role="button"
                            tabIndex={0}
                            aria-label="Toggle password visibility"
                          ></span>
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <div className="form-check form-check-md mb-0">
                            <input
                              className="form-check-input"
                              id="remember_me"
                              type="checkbox"
                            />
                            <label
                              htmlFor="remember_me"
                              className="form-check-label mt-0"
                            >
                              Remember Me
                            </label>
                          </div>
                        </div>
                        <div className="text-end">
                          <Link to={all_routes.forgotPassword} className="fw-medium" style={{ color: "#f97316" }}>
                            Forgot Password?
                          </Link>
                        </div>
                      </div>
                      <div className="mb-3">
                        <button
                          type="submit"
                          className="btn w-100 text-white fw-bold shadow-sm"
                          style={{ backgroundColor: "#f97316", borderColor: "#f97316", padding: "12px", fontSize: "16px" }}
                        >
                          Sign In
                        </button>
                      </div>
                      <div className="text-center">
                        <h6 className="fw-normal text-dark mb-0">
                          Don’t have an account?
                          <Link to={all_routes.register} className="fw-bold ms-1" style={{ color: "#f97316" }}>
                            Create Account
                          </Link>
                        </h6>
                      </div>
                      <div className="login-or">
                        <span className="span-or">Or</span>
                      </div>
                      <div className="mt-4">
                        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                          <Link
                            to="#"
                            className="btn btn-outline-light border d-flex align-items-center justify-content-center text-dark fw-medium flex-fill p-2 bg-white shadow-sm rounded-pill"
                          >
                            <ImageWithBasePath
                              className="img-fluid"
                              src="assets/img/icons/facebook-logo.svg"
                              alt="Facebook"
                              width={20}
                            />
                            <span className="ms-2 fs-14">Continue with Facebook</span>
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-outline-light border d-flex align-items-center justify-content-center text-dark fw-medium flex-fill p-2 bg-white shadow-sm rounded-pill"
                          >
                            <ImageWithBasePath
                              className="img-fluid"
                              src="assets/img/icons/google-logo.svg"
                              alt="Google"
                              width={20}
                            />
                            <span className="ms-2 fs-14">Continue with Google</span>
                          </Link>
                          <Link
                            to="#"
                            className="bg-dark btn btn-dark d-flex align-items-center justify-content-center text-white fw-medium flex-fill p-2 shadow-sm rounded-pill"
                          >
                            <ImageWithBasePath
                              className="img-fluid"
                              src="assets/img/icons/apple-logo.svg"
                              alt="Apple"
                              width={20}
                            />
                            <span className="ms-2 fs-14">Continue with Apple</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pb-4 text-center">
                      <p className="mb-0 text-gray-9">HR Portal by HGSInfotech</p>
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

export default Login;
