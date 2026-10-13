import { Navigate } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";

const Bussinesssettings = () => {
  return <Navigate to={all_routes.companySettings} replace />;
};

export default Bussinesssettings;
