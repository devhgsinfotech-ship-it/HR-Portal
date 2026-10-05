import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import apiClient, { getSubdomain } from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";

const ForgotPassword = () => {
  const routes = all_routes;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const subdomain = getSubdomain();

  const [resolvedLogo, setResolvedLogo] = useState<string | null>(null);
  const [resolvedCompanyName, setResolvedCompanyName] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent page reload
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/forgot-password", { email, subdomain });
      setSuccess(response.data.message || "A password reset link has been sent to your email address.");
      setEmail("");
    } catch (err: any) {
      console.error("Forgot password failed:", err);
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
                    <div>
                      <div className="text-center mb-3">
                        <h2 className="mb-2">Forgot Password?</h2>
                        <p className="mb-0">
                          If you forgot your password, well, then we'll email you
                          instructions to reset your password.
                        </p>
                      </div>
                      
                      {error && <div className="alert alert-danger p-2 text-center">{error}</div>}
                      {success && <div className="alert alert-success p-2 text-center">{success}</div>}

                      <div className="mb-3">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <div className="input-group">
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={handleEmailBlur}
                            className="form-control border-end-0"
                            required
                            autoComplete="email"
                            disabled={loading}
                          />
                          <span className="input-group-text border-start-0">
                            <i className="ti ti-mail" />
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                          {loading ? "Submitting..." : "Submit"}
                        </button>
                      </div>
                      <div className="text-center">
                        <h6 className="fw-normal text-dark mb-0">
                          Return to
                          <Link to={routes.login} className="hover-a ms-1">
                            Sign In
                          </Link>
                        </h6>
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

export default ForgotPassword;
