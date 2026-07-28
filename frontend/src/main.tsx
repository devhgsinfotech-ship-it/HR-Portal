import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { base_path } from "./environment";
import "../src/style/css/bootstrap.min.css";
import "../src/style/css/feather.css";
import "../src/style/scss/custom.scss";
import store from "./core/data/redux/store";
import { Provider } from "react-redux";
import "../src/style/icon/boxicons/boxicons/css/boxicons.min.css";
import "../src/style/icon/weather/weathericons.css";
import "../src/style/icon/typicons/typicons.css";
import "../src/style/css/fontawesome/css/fontawesome.min.css";
import "../src/style/css/fontawesome/css/all.min.css";
import "../src/style/icon/ionic/ionicons.css";
import "../src/style/icon/tabler-icons/webfont/tabler-icons.css";
import ALLRoutes from "../src/router/router.js";
import "../src/style/js/bootstrap.bundle.min.js";

import { BrowserRouter } from "react-router";
import React from "react";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary.js";
import { initializePreloading } from "./router/preloadUtils";
import { PerformanceProvider } from "./core/providers/PerformanceProvider";

// Initialize preloading for better performance
initializePreloading();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <React.StrictMode>
      <Provider store={store}>
        <PerformanceProvider
          enableProfiling={false}
          enableMemoization={true}
          enableVirtualization={true}
        >
          <BrowserRouter basename={base_path}>
            <ErrorBoundary
              fallback={<div>Oops! An unexpected error occurred.</div>}
            >
              <ALLRoutes />
            </ErrorBoundary>
          </BrowserRouter>
        </PerformanceProvider>
      </Provider>
    </React.StrictMode>
  </StrictMode>
);
