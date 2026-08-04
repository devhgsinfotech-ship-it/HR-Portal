import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import { authRoutes, publicRoutes, layoutRoutes } from "./router.link";
import { LoadingSpinner } from "../core/common/LoadingSpinner";
import PrivateRoute from "./PrivateRoute";
import { all_routes } from "./all_routes";

const LazyFeature = lazy(() => import("../feature-module/feature"));
const LazyAuthFeature = lazy(() => import("../feature-module/authFeature"));
const LazyLayoutFeature = lazy(() => import("../feature-module/layoutFeature"));

type Role = "SUPER_ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

const getRouteRoles = (path: string | undefined): Role[] => {
  if (!path) return ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"];

  const p = path.toLowerCase();

  // 1. Super Admin ONLY routes
  if (p.startsWith("/super-admin")) return ["SUPER_ADMIN"];

  // 2. Employee Self-Service routes (Accessible by all)
  const employeeAllowedPrefixes = [
    "/employee-dashboard", "/attendance-employee", "/leaves-employee",
    "/pages/profile", "/hrm/holidays", "/payslip", "/application"
  ];
  if (employeeAllowedPrefixes.some(prefix => p.startsWith(prefix))) {
    return ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }

  // 3. Manager & HR Approvals
  const adminApprovalPrefixes = [
    "/leaves", "/attendance-admin", "/timesheet", "/performance", "/training",
    "/projects", "/tasks", "/clients", "/tickets"
  ];
  if (adminApprovalPrefixes.some(prefix => p.startsWith(prefix))) {
    return ["SUPER_ADMIN", "HR", "MANAGER"];
  }

  // 4. Default: Restricted to HR & Super Admin (Security by default)
  return ["SUPER_ADMIN", "HR"];
};

const ALLRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Redirect root URL to login */}
        {/* <Route path="/" element={<Navigate to={all_routes.login} replace />} /> */}

        {/* ── PROTECTED ROUTES (must be logged in) ── */}
        <Route>
          <Route
            element={
              <Suspense fallback={<LoadingSpinner text="Loading application..." />}>
                <LazyFeature />
              </Suspense>
            }
          >
            {publicRoutes.map((route, idx) => {
              const allowedRoles = getRouteRoles(route.path);
              return (
                <Route element={<PrivateRoute allowedRoles={allowedRoles} />} key={idx}>
                  <Route
                    path={route.path}
                    element={
                      <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                        {route.element}
                      </Suspense>
                    }
                  />
                </Route>
              );
            })}
          </Route>
        </Route>

        {/* Layout routes — also protected */}
        <Route>
          <Route
            element={
              <Suspense fallback={<LoadingSpinner text="Loading layout..." />}>
                <LazyLayoutFeature />
              </Suspense>
            }
          >
            {layoutRoutes.map((route, idx) => {
              const allowedRoles = getRouteRoles(route.path);
              return (
                <Route element={<PrivateRoute allowedRoles={allowedRoles} />} key={`layout-${idx}`}>
                  <Route
                    path={route.path}
                    element={
                      <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                        {route.element}
                      </Suspense>
                    }
                  />
                </Route>
              );
            })}
          </Route>
        </Route>

        {/* ── AUTH ROUTES (login, register — no auth needed) ── */}
        <Route
          element={
            <Suspense fallback={<LoadingSpinner text="Loading authentication..." />}>
              <LazyAuthFeature />
            </Suspense>
          }
        >
          {authRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                  {route.element}
                </Suspense>
              }
              key={idx}
            />
          ))}
        </Route>
      </Routes>
    </>
  );
};

export default ALLRoutes;
