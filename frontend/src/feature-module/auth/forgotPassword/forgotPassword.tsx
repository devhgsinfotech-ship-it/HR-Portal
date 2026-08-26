import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import apiClient, { getSubdomain } from "../../../core/utils/apiClient";

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
        <div className="row">
          <div className="col-lg-5">
            <div className="login-background position-relative d-lg-flex align-items-center justify-content-center d-none flex-wrap vh-100">
              <div className="bg-overlay-img">
                <ImageWithBasePath src="assets/img/bg/bg-01.png" className="bg-1" alt="Background pattern 1" />
                <ImageWithBasePath src="assets/img/bg/bg-02.png" className="bg-2" alt="Background pattern 2" />
                <ImageWithBasePath src="assets/img/bg/bg-03.png" className="bg-3" alt="Background pattern 3" />
              </div>
              <div className="authentication-card w-100">
                <div className="authen-overlay-item border w-100">
                  <h1 className="text-white display-1">
                    Empowering people <br /> through seamless HR <br /> management.
                  </h1>
                  <div className="my-4 mx-auto authen-overlay-img">
                    <ImageWithBasePath src="assets/img/bg/authentication-bg-01.png" alt="Authentication illustration" />
                  </div>
                  <div>
                    <p className="text-white fs-20 fw-semibold text-center">
                      Efficiently manage your workforce, streamline <br /> operations effortlessly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-7 col-md-12 col-sm-12">
            <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap">
              <div className="col-md-7 mx-auto vh-100">
                <form className="vh-100" onSubmit={handleSubmit}>
                  <div className="vh-100 d-flex flex-column justify-content-between p-4 pb-0">
                    <div className="mx-auto mb-5 text-center">
                      {resolvedLogo && !logoError ? (
                        <img 
                          src={resolvedLogo.startsWith('http') ? resolvedLogo : `${apiClient.defaults.baseURL || 'https://api.aaups.com'}${resolvedLogo}`} 
                          alt={resolvedCompanyName || "Logo"} 
                          className="img-fluid" 
                          style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain' }}
                          onError={() => setLogoError(true)}
                        />
                      ) : (
                        <h2 className="mb-0 text-primary fw-bold" style={{ letterSpacing: '0.5px' }}>
                          {resolvedCompanyName || "HGS-HRMS"}
                        </h2>
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
