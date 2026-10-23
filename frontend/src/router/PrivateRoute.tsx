// frontend/src/router/PrivateRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../core/data/redux/store";
import { all_routes } from "./all_routes";

interface PrivateRouteProps {
    allowedRoles?: Array<"SUPER_ADMIN" | "COMPANY_ADMIN" | "HR" | "MANAGER" | "EMPLOYEE">;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const location = useLocation();

    // Not logged in → redirect to login
    if (!isAuthenticated || !user) {
        return <Navigate to={all_routes.login} state={{ from: location }} replace />;
    }

    const roleStr = user.role as string;
    const currentPath = location.pathname;
    const isOnboardingRoute = currentPath === '/onboarding';

    // 1. Check onboarding status for non-admin users FIRST
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'COMPANY_ADMIN') {
        const onboardingStatus = (user as any).onboardingStatus || 'INVITED';

        // If not fully onboarded and trying to access anything ELSE, force them to onboarding
        if (onboardingStatus !== 'COMPLETED' && !isOnboardingRoute) {
            return <Navigate to="/onboarding" replace />;
        }

        // If fully onboarded and trying to access onboarding, force them to their proper dashboard
        if (onboardingStatus === 'COMPLETED' && isOnboardingRoute) {
            if (roleStr === "HR") return <Navigate to={all_routes.hrDashboard} replace />;
            return <Navigate to={all_routes.employeeDashboard} replace />;
        }
    }

    // 2. Logged in but wrong role → redirect to their correct dashboard
    if (allowedRoles && !allowedRoles.includes(user.role as any)) {
        if (roleStr === "SUPER_ADMIN") return <Navigate to={all_routes.superAdminDashboard} replace />;
        if (roleStr === "COMPANY_ADMIN") return <Navigate to={all_routes.adminDashboard} replace />;
        if (roleStr === "HR") return <Navigate to={all_routes.hrDashboard} replace />;
        if (roleStr === "MANAGER") return <Navigate to={all_routes.employeeDashboard} replace />;
        return <Navigate to={all_routes.employeeDashboard} replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
