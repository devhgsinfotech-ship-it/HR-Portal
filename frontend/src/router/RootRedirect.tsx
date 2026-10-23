import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../core/data/redux/store";
import { all_routes } from "./all_routes";

const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to={all_routes.login} replace />;
  }

  // Non-admins who haven't completed onboarding go to /onboarding
  if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN") {
    const onboardingStatus = (user as any).onboardingStatus || "INVITED";
    if (onboardingStatus !== "COMPLETED") {
      return <Navigate to="/onboarding" replace />;
    }
  }

  if (user.role === "SUPER_ADMIN") {
    return <Navigate to={all_routes.superAdminDashboard} replace />;
  }
  if (user.role === "COMPANY_ADMIN") {
    return <Navigate to={all_routes.adminDashboard} replace />;
  }
  if (user.role === "HR") {
    return <Navigate to={all_routes.hrDashboard} replace />;
  }
  return <Navigate to={all_routes.employeeDashboard} replace />;
};

export default RootRedirect;
