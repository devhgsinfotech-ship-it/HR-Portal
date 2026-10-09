import { useNavigate } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { useState } from "react";
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";

const ResetPasswordSuccess = () => {
  const routes = all_routes;
  const navigation = useNavigate();
  const apiUrl = APP_CONFIG.getBackendUrl();

  const [resolvedLogo, setResolvedLogo] = useState<string | null>(null);
  const [resolvedCompanyName, setResolvedCompanyName] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigation(routes.login);
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
                        <ImageWithBasePath
                          src="assets/img/icons/success-tick.svg"
                          alt="Success tick"
                          className="img-fluid mb-3"
                        />
                        <h2 className="mb-2">Success</h2>
                        <p className="mb-0">
                          Your new password has been successfully saved
                        </p>
                      </div>
                      <div className="mb-3">
                        <button type="submit" className="btn btn-primary w-100">
                          Back to Sign In
                        </button>
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

export default ResetPasswordSuccess;
