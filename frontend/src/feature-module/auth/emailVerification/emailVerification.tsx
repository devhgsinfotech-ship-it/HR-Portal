import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../../environment";

type VerifyState = "loading" | "success" | "error" | "no-token";

const EmailVerification = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>(token ? "loading" : "no-token");
  const [message, setMessage] = useState("");
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("no-token");
      return;
    }

    const verify = async () => {
      try {
        const response = await apiClient.post("/auth/verify-email", { token });
        setMessage(response.data.message || "Email verified successfully!");
        // Try to extract subdomain from response if available
        if (response.data.subdomain) {
          setSubdomain(response.data.subdomain);
        }
        setState("success");
      } catch (err: any) {
        setMessage(err.response?.data?.message || "Verification failed. The link may be invalid or expired.");
        setState("error");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="container-fuild">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row justify-content-center align-items-center vh-100">
          <div className="col-md-6 col-lg-5 mx-auto">
            <div className="card shadow-sm p-4 text-center">

              <div className="mb-4">
                <div className="mx-auto mb-3" style={{ maxWidth: 160 }}>
                  <ImageWithBasePath src="assets/img/logo.svg" className="img-fluid" alt="Logo" />
                </div>
              </div>

              {/* LOADING */}
              {state === "loading" && (
                <>
                  <div className="mb-3">
                    <span className="spinner-border text-primary" style={{ width: 48, height: 48 }} role="status" />
                  </div>
                  <h4 className="mb-2">Verifying your email...</h4>
                  <p className="text-muted">Please wait a moment.</p>
                </>
              )}

              {/* SUCCESS */}
              {state === "success" && (
                <>
                  <div className="mb-3">
                    <i className="ti ti-circle-check text-success" style={{ fontSize: 64 }} />
                  </div>
                  <h3 className="mb-2 text-success">Email Verified!</h3>
                  <p className="text-muted mb-4">{message}</p>
                  {subdomain && (
                    <div className="alert alert-info mb-3 text-start">
                      <p className="mb-1"><strong>Your workspace is ready:</strong></p>
                      <a 
                        href={`${APP_CONFIG.getBackendUrl().startsWith('https') ? 'https' : 'http'}://${subdomain}.${APP_CONFIG.getFrontendDomain()}/login`} 
                        className="fw-semibold"
                      >
                        {subdomain}.{APP_CONFIG.getFrontendDomain()}/login →
                      </a>
                    </div>
                  )}
                  <Link to={routes.login} className="btn btn-primary w-100">
                    <i className="ti ti-login me-2" />Go to Login
                  </Link>
                </>
              )}

              {/* ERROR */}
              {state === "error" && (
                <>
                  <div className="mb-3">
                    <i className="ti ti-circle-x text-danger" style={{ fontSize: 64 }} />
                  </div>
                  <h3 className="mb-2 text-danger">Verification Failed</h3>
                  <p className="text-muted mb-4">{message}</p>
                  <Link to={routes.register} className="btn btn-outline-primary w-100 mb-2">
                    Register Again
                  </Link>
                  <Link to={routes.login} className="btn btn-link text-muted">
                    Back to Login
                  </Link>
                </>
              )}

              {/* NO TOKEN */}
              {state === "no-token" && (
                <>
                  <div className="mb-3">
                    <i className="ti ti-mail-question text-warning" style={{ fontSize: 64 }} />
                  </div>
                  <h3 className="mb-2">No Verification Token</h3>
                  <p className="text-muted mb-4">
                    This page requires a verification token from your email link.<br />
                    Please check your inbox and click the verification link.
                  </p>
                  <Link to={routes.login} className="btn btn-primary w-100">
                    Back to Login
                  </Link>
                </>
              )}

              <div className="mt-4">
                <p className="mb-0 text-muted small">Copyright © 2024 - HRMS Portal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
