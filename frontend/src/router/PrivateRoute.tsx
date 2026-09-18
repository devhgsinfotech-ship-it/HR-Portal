// frontend/src/router/PrivateRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../core/data/redux/store";
import { all_routes } from "./all_routes";

interface PrivateRouteProps {
    allowedRoles?: Array<"SUPER_ADMIN" | "COMPANY_ADMIN" | "HR" | "MANAGER" | "EMPLOYEE">;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    // Not logged in → redirect to login
    if (!isAuthenticated || !user) {
        return <Navigate to={all_routes.login} replace />;
    }

    // Logged in but wrong role → redirect to their correct dashboard
    const roleStr = user.role as string;
    if (allowedRoles && !allowedRoles.includes(user.role as any)) {
        const routes = all_routes;
        if (roleStr === "SUPER_ADMIN") return <Navigate to={routes.superAdminDashboard} replace />;
        if (roleStr === "COMPANY_ADMIN" || roleStr === "HR") return <Navigate to={routes.adminDashboard || routes.hrDashboard} replace />;
        if (roleStr === "MANAGER") return <Navigate to={routes.employeeDashboard} replace />;
        return <Navigate to={routes.employeeDashboard} replace />;
    }

    // Authorized — check onboarding status for Employees
    const currentPath = window.location.pathname;
    
    if (user.role === 'EMPLOYEE') {
        const onboardingStatus = (user as any).onboardingStatus || 'INVITED';
        const isOnboardingRoute = currentPath === '/onboarding';

        // If they are not fully onboarded and trying to access anything ELSE, force them to onboarding
        if (onboardingStatus !== 'COMPLETED' && !isOnboardingRoute) {
            return <Navigate to="/onboarding" replace />;
        }

        // If they are fully onboarded and trying to access onboarding, force them to dashboard
        if (onboardingStatus === 'COMPLETED' && isOnboardingRoute) {
            return <Navigate to={all_routes.employeeDashboard} replace />;
        }
    }

    return <Outlet />;
};

export default PrivateRoute;
