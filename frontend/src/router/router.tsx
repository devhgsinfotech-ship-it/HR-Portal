import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import { authRoutes, publicRoutes, layoutRoutes } from "./router.link";
import { LoadingSpinner } from "../core/common/LoadingSpinner";
import PrivateRoute from "./PrivateRoute";
import { all_routes } from "./all_routes";

const LazyFeature = lazy(() => import("../feature-module/feature"));
const LazyAuthFeature = lazy(() => import("../feature-module/authFeature"));
const LazyLayoutFeature = lazy(() => import("../feature-module/layoutFeature"));

const ALLRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        {/* Redirect root URL to login */}
        {/* <Route path="/" element={<Navigate to={all_routes.login} replace />} /> */}

        {/* ── PROTECTED ROUTES (must be logged in) ── */}
        <Route element={<PrivateRoute />}>
          <Route
            element={
              <Suspense fallback={<LoadingSpinner text="Loading application..." />}>
                <LazyFeature />
              </Suspense>
            }
          >
            {publicRoutes.map((route, idx) => (
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
        </Route>

        {/* Layout routes — also protected */}
        <Route element={<PrivateRoute />}>
          <Route
            element={
              <Suspense fallback={<LoadingSpinner text="Loading layout..." />}>
                <LazyLayoutFeature />
              </Suspense>
            }
          >
            {layoutRoutes.map((route, idx) => (
              <Route
                path={route.path}
                element={
                  <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                    {route.element}
                  </Suspense>
                }
                key={`layout-${idx}`}
              />
            ))}
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
