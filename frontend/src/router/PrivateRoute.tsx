// frontend/src/router/PrivateRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../core/data/redux/store";
import { all_routes } from "./all_routes";

interface PrivateRouteProps {
    allowedRoles?: Array<"SUPER_ADMIN" | "HR" | "MANAGER" | "EMPLOYEE">;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    // Not logged in → redirect to login
    if (!isAuthenticated || !user) {
        return <Navigate to={all_routes.login} replace />;
    }

    // Logged in but wrong role → redirect to their correct dashboard
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const routes = all_routes;
        if (user.role === "SUPER_ADMIN") return <Navigate to={routes.superAdminDashboard} replace />;
        if (user.role === "HR") return <Navigate to={routes.hrDashboard} replace />;
        if (user.role === "MANAGER") return <Navigate to={routes.employeeDashboard} replace />;
        return <Navigate to={routes.employeeDashboard} replace />;
    }

    // Authorized — render the child routes
    return <Outlet />;
};

export default PrivateRoute;
