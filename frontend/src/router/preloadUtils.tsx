import { preloadComponent } from "./lazyRoutes";

// Preload critical components for better UX
export const preloadCriticalComponents = () => {
  // Preload login and dashboard components
  preloadComponent(() => import("../feature-module/auth/login/login"))();
  preloadComponent(() => import("../feature-module/mainMenu/adminDashboard"))();
  preloadComponent(
    () =>
      import("../feature-module/mainMenu/employeeDashboard/employee-dashboard")
  )();
};

// Preload components based on user role
export const preloadRoleBasedComponents = (userRole: string) => {
  switch (userRole) {
    case "admin":
      preloadComponent(
        () => import("../feature-module/mainMenu/adminDashboard")
      )();
      preloadComponent(
        () => import("../feature-module/userManagement/manageusers")
      )();
      preloadComponent(
        () =>
          import("../feature-module/settings/generalSettings/profile-settings")
      )();
      break;
    case "employee":
      preloadComponent(
        () =>
          import(
            "../feature-module/mainMenu/employeeDashboard/employee-dashboard"
          )
      )();
      preloadComponent(
        () => import("../feature-module/hrm/attendance/attendance_employee")
      )();
      preloadComponent(
        () => import("../feature-module/hrm/attendance/leaves/leaveEmployee")
      )();
      break;
    case "super_admin":
      preloadComponent(
        () => import("../feature-module/super-admin/dashboard")
      )();
      preloadComponent(
        () => import("../feature-module/super-admin/companies")
      )();
      preloadComponent(
        () => import("../feature-module/super-admin/subscription")
      )();
      break;
    default:
      // Preload common components for all users
      preloadComponent(() => import("../feature-module/application/chat"))();
      preloadComponent(
        () => import("../feature-module/mainMenu/apps/calendar")
      )();
  }
};

// Preload components based on current route
export const preloadRouteComponents = (currentPath: string) => {
  // Preload related components based on current route
  if (currentPath.includes("/crm")) {
    preloadComponent(
      () => import("../feature-module/crm/contacts/contactList")
    )();
    preloadComponent(() => import("../feature-module/crm/leads/leadsList"))();
    preloadComponent(() => import("../feature-module/crm/deals/dealsList"))();
  }

  if (currentPath.includes("/hrm")) {
    preloadComponent(
      () => import("../feature-module/hrm/employees/employeesList")
    )();
    preloadComponent(
      () => import("../feature-module/hrm/attendance/attendanceadmin")
    )();
    preloadComponent(
      () => import("../feature-module/hrm/attendance/leaves/leaveAdmin")
    )();
  }

  if (currentPath.includes("/projects")) {
    preloadComponent(
      () => import("../feature-module/projects/project/projectlist")
    )();
    preloadComponent(
      () => import("../feature-module/projects/task/task-board")
    )();
    preloadComponent(
      () => import("../feature-module/projects/clinet/clientlist")
    )();
  }

  if (currentPath.includes("/finance")) {
    preloadComponent(
      () => import("../feature-module/finance-accounts/sales/invoices")
    )();
    preloadComponent(
      () => import("../feature-module/finance-accounts/sales/expenses")
    )();
    preloadComponent(
      () => import("../feature-module/finance-accounts/payrool/payroll")
    )();
  }

  if (currentPath.includes("/settings")) {
    preloadComponent(
      () =>
        import("../feature-module/settings/generalSettings/profile-settings")
    )();
    preloadComponent(
      () =>
        import("../feature-module/settings/generalSettings/security-settings")
    )();
    preloadComponent(
      () => import("../feature-module/settings/websiteSettings/appearance")
    )();
  }
};

// Preload components on user interaction (hover, focus)
export const preloadOnInteraction = (componentPath: string) => {
  const preloadMap: Record<string, () => void> = {
    "/chat": () =>
      preloadComponent(() => import("../feature-module/application/chat"))(),
    "/calendar": () =>
      preloadComponent(
        () => import("../feature-module/mainMenu/apps/calendar")
      )(),
    "/email": () =>
      preloadComponent(() => import("../feature-module/application/email"))(),
    "/file-manager": () =>
      preloadComponent(
        () => import("../feature-module/application/fileManager")
      )(),
    "/todo": () =>
      preloadComponent(
        () => import("../feature-module/application/todo/todo")
      )(),
    "/contacts": () =>
      preloadComponent(
        () => import("../feature-module/crm/contacts/contactList")
      )(),
    "/leads": () =>
      preloadComponent(() => import("../feature-module/crm/leads/leadsList"))(),
    "/deals": () =>
      preloadComponent(() => import("../feature-module/crm/deals/dealsList"))(),
    "/employees": () =>
      preloadComponent(
        () => import("../feature-module/hrm/employees/employeesList")
      )(),
    "/projects": () =>
      preloadComponent(
        () => import("../feature-module/projects/project/projectlist")
      )(),
    "/tasks": () =>
      preloadComponent(
        () => import("../feature-module/projects/task/task-board")
      )(),
    "/invoices": () =>
      preloadComponent(
        () => import("../feature-module/finance-accounts/sales/invoices")
      )(),
    "/reports": () =>
      preloadComponent(
        () => import("../feature-module/administration/reports/expensereport")
      )(),
  };

  const preloadFunc = preloadMap[componentPath];
  if (preloadFunc) {
    preloadFunc();
  }
};

// Initialize preloading on app startup
export const initializePreloading = () => {
  // Preload critical components immediately
  preloadCriticalComponents();

  // Set up route change listener for dynamic preloading
  if (typeof window !== "undefined") {
    const handleRouteChange = () => {
      preloadRouteComponents(window.location.pathname);
    };

    // Listen for route changes
    window.addEventListener("popstate", handleRouteChange);

    // Clean up listener on unmount
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }
};
