import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import ImageWithBasePath from "../imageWithBasePath";
import "../../../style/icon/tabler-icons/webfont/tabler-icons.css";
import { setExpandMenu } from "../../data/redux/sidebarSlice";
import { useDispatch } from "react-redux";
import { setDataLayout } from "../../data/redux/themeSettingSlice";
import { SidebarDataTest } from "../../data/json/sidebarMenu";
import { all_routes } from "../../../router/all_routes";
import { useAppSelector } from "../../data/redux/store";
import type { AppDispatch } from "../../data/redux/store";
import { updateUser } from "../../data/redux/authSlice";
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";

// Define flexible types for sidebar data
interface SidebarMenuItem {
  label: string;
  link: string;
  submenu?: boolean;
  showSubRoute?: boolean;
  icon?: string;
  base?: string;
  base2?: string;
  base3?: string;
  base4?: string;
  base5?: string;
  materialicons?: string;
  dot?: boolean;
  newBadge?: boolean;
  submenuItems?: SidebarMenuItem[];
  links?: string[];
  themeSetting?: boolean;
  changeLogVersion?: boolean;
}

interface SidebarMainMenu {
  tittle: string;
  icon: string;
  showAsTab: boolean;
  separateRoute: boolean;
  submenuItems: SidebarMenuItem[];
}

type Role = "SUPER_ADMIN" | "COMPANY_ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

const getRouteRoles = (path: string | undefined): Role[] => {
  if (!path) return ["COMPANY_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  let p = path.toLowerCase();
  if (!p.startsWith('/')) {
    p = '/' + p;
  }

  // --- 0. EXPLICITLY HIDE COMPANY USER MANAGEMENT FROM SUPER ADMIN ---
  const companyUserMgmt = ["user-management", "manage-users", "roles-permissions"];
  if (companyUserMgmt.some(kw => p.includes(kw) || p === kw)) {
    return ["COMPANY_ADMIN", "HR"];
  }

  // --- 0.1 EXCLUSIVELY SUPER ADMIN ROUTES ---
  if (p.startsWith("/super-admin") || p.includes("super-admin") || p.includes("superadmin")) {
    return ["SUPER_ADMIN"];
  }

  // --- 0.2 HIDE AI CENTER FROM COMPANY ADMIN ---
  if (p.startsWith("/ai-") || p.includes("ai-center")) {
    return ["SUPER_ADMIN"];
  }

  // --- 1. SUPER ADMIN EXPLICIT ALLOW LIST ---
  // Paths related to Super Admin responsibilities: 
  // Companies, Plans & Subscriptions, Billing, Platform Users, Roles, Settings, Integrations, Audit Logs
  const superAdminAllowed = [
    "compan", "plan", "subscription", "package", 
    "billing", "payment", "tax", "currency", // Billing & Financial Settings
    "platform-user", 
    "setting", "integration", "audit", 
    "gdpr", "maintenance", "css", "js", "cronjob", "storage", "ban", "backup", "cache", // System/Other Settings
    "template" // Email/SMS templates
  ];
  const isSuperAdminRoute = superAdminAllowed.some(kw => p.includes(kw));

  // --- 2. DASHBOARD ROUTES ---
  if (p === "/employee-dashboard" || p.includes("employee-dashboard")) {
    return ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }
  if (p.includes("hr-dashboard")) {
    return ["COMPANY_ADMIN", "HR"];
  }
  if (
    p.includes("payroll-dashboard") ||
    p.includes("finance-dashboard") ||
    p.includes("asset-dashboard") ||
    p.includes("help-desk-dashboard")
  ) {
    return ["COMPANY_ADMIN", "HR"];
  }
  if (
    p.includes("recruitment-dashboard") ||
    p.includes("attendance-dashboard") ||
    p.includes("deals-dashboard") ||
    p.includes("leads-dashboard")
  ) {
    return ["COMPANY_ADMIN", "HR", "MANAGER"];
  }
  if (p.includes("it-admin-dashboard")) {
    return ["COMPANY_ADMIN"];
  }
  if (p === "/index" || p.includes("admin-dashboard") || p.includes("dashboard")) {
    return ["COMPANY_ADMIN", "SUPER_ADMIN"];
  }

  // --- 3. EXISTING COMPANY-LEVEL FILTERS ---
  
  if (p.includes("job-grid") || p.includes("job-list") || p.includes("jobgrid") || p.includes("joblist") || p.includes("jobs") || p.includes("refferal")) {
    return ["COMPANY_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }

  const recruitmentKeywords = ["recruitment", "job", "candidate", "campus-hiring"];
  if (recruitmentKeywords.some(keyword => p.includes(keyword))) {
    return ["COMPANY_ADMIN", "HR", "MANAGER"];
  }

  // Dedicated rule: My Attendance (Self-service attendance tracking for Employees, HR & Managers)
  // Hidden from and disallowed for Company Admin & Super Admin (Owners/Admins are not tracked)
  if (p === "/attendance-employee" || p.startsWith("/attendance-employee")) {
    return ["HR", "MANAGER", "EMPLOYEE"];
  }

  const employeeAllowedPrefixes = [
    "/employee-dashboard", "/leaves-employee",
    "/pages/profile", "/hrm/holidays", "/application",
    "/projects", "/tasks", "/task-board", "/clients",
    "/org", "/org-directory"
  ];
  if (employeeAllowedPrefixes.some(prefix => p.startsWith(prefix))) {
    return isSuperAdminRoute 
      ? ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER", "EMPLOYEE"]
      : ["COMPANY_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }
  
  if (p === "/payslip" || p.startsWith("/payslip/")) {
    return ["COMPANY_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }

  // Employee Lifecycle routes (Probation, Notice, Promotion, Resignation, Termination)
  if (
    p.includes("probation") ||
    p.includes("notice-period") ||
    p.includes("notice period") ||
    p.includes("promotion") ||
    p.includes("resignation") ||
    p.includes("termination")
  ) {
    return ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }

  // Payroll Overtime is restricted to HR and Admins
  if (p.includes("payroll-overtime")) {
    return ["COMPANY_ADMIN", "HR"];
  }

  // Shift Scheduling & Work Arrangements (Phase 2: Accessible by all roles)
  if (
    p.includes("schedule-timing") ||
    p.includes("shift-schedule") ||
    p.includes("shift-swap") ||
    p.includes("overtime") ||
    p.includes("holiday-calendar") ||
    p.includes("wfh-management") ||
    p.includes("work-from-home")
  ) {
    return ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }

  if (p.includes("category") || p.includes("categories")) {
    return isSuperAdminRoute 
      ? ["SUPER_ADMIN", "COMPANY_ADMIN", "HR", "MANAGER"]
      : ["COMPANY_ADMIN", "HR", "MANAGER"];
  }

  if (p.includes("asset")) {
    return ["COMPANY_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }

  const adminApprovalPrefixes = [
    "/leaves", "/attendance-admin", "/timesheet", "/performance", "/training",
    "/tickets"
  ];
  if (adminApprovalPrefixes.some(prefix => p.startsWith(prefix))) {
    return ["COMPANY_ADMIN", "HR", "MANAGER"];
  }

  // --- 4. DEFAULT FALLBACK ---
  // If the route matches the Super Admin allowed list, give them access.
  // Otherwise, fallback to Company Admin and HR.
  if (isSuperAdminRoute) {
    return ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"];
  }

  return ["COMPANY_ADMIN", "HR"];
};

const filterMenu = (items: SidebarMenuItem[] | undefined, role: Role): SidebarMenuItem[] => {
  if (!items) return [];
  return items.filter(item => {
    const normalizedRole = (role || "").toUpperCase();
    const labelLower = (item.label || "").toLowerCase();
    const baseLower = (item.base || "").toLowerCase();
    const linkLower = (item.link || "").toLowerCase();

    // Explicitly hide "Authentication" & "CRM" parent menu and demo submenus for ALL roles
    if (labelLower === "authentication" && baseLower !== "authentication-settings") {
      return false;
    }
    if (labelLower === "crm" || baseLower === "crm") {
      return false;
    }

    // Explicitly hide "Deals Dashboard" and "Leads Dashboard" under Dashboard for ALL roles
    if (
      labelLower === "deals dashboard" ||
      labelLower === "leads dashboard" ||
      linkLower.includes("deals-dashboard") ||
      linkLower.includes("leads-dashboard")
    ) {
      return false;
    }

    // Explicitly hide "User Management" for SUPER_ADMIN
    if (normalizedRole === "SUPER_ADMIN") {
      const labelLower = (item.label || "").toLowerCase();
      const baseLower = (item.base || "").toLowerCase();
      if (labelLower === "user management" || baseLower === "user-management") {
        return false;
      }
    }

    // Explicitly hide "Super Admin" parent menu and all super-admin routes for non-SUPER_ADMIN users (including COMPANY_ADMIN)
    if (normalizedRole !== "SUPER_ADMIN") {
      const labelLower = (item.label || "").toLowerCase();
      const baseLower = (item.base || "").toLowerCase();
      const linkLower = (item.link || "").toLowerCase();
      if (
        labelLower === "super admin" ||
        labelLower.includes("super admin") ||
        baseLower.includes("super-admin") ||
        linkLower.includes("super-admin") ||
        baseLower.includes("superadmin") ||
        linkLower.includes("superadmin")
      ) {
        return false;
      }
    }

    // Explicitly for EMPLOYEE role: under Dashboard menu, ONLY "Employee Dashboard" is visible.
    // Hide all other dashboard sub-routes!
    if (normalizedRole === "EMPLOYEE") {
      const labelLower = (item.label || "").toLowerCase();
      const linkLower = (item.link || "").toLowerCase();
      const baseLower = (item.base || "").toLowerCase();
      if (
        (labelLower.includes("dashboard") || linkLower.includes("dashboard") || baseLower.includes("dashboard")) &&
        labelLower !== "dashboard" && item.link !== "index"
      ) {
        if (
          labelLower !== "employee dashboard" &&
          !linkLower.includes("employee-dashboard") &&
          !baseLower.includes("employee-dashboard")
        ) {
          return false;
        }
      }
    }

    // Explicitly for COMPANY_ADMIN role: under Dashboard menu, ONLY "Admin Dashboard" is visible.
    // Hide all other dashboard sub-routes!
    if (normalizedRole === "COMPANY_ADMIN") {
      const labelLower = (item.label || "").trim().toLowerCase();
      const linkLower = (item.link || "").trim().toLowerCase();
      const baseLower = (item.base || "").trim().toLowerCase();
      if (
        (labelLower.includes("dashboard") || linkLower.includes("dashboard") || baseLower.includes("dashboard")) &&
        labelLower !== "dashboard" && item.link !== "index"
      ) {
        if (labelLower !== "admin dashboard") {
          return false;
        }
      }

      // Explicitly hide "AI Center" menu and all its children for COMPANY_ADMIN
      if (
        labelLower === "ai center" ||
        labelLower.includes("ai center") ||
        baseLower.includes("ai-center") ||
        linkLower.includes("ai-center") ||
        baseLower.startsWith("/ai-") ||
        linkLower.startsWith("/ai-")
      ) {
        return false;
      }
    }

    // Explicitly hide "My Attendance" for COMPANY_ADMIN and SUPER_ADMIN
    if (normalizedRole === "COMPANY_ADMIN" || normalizedRole === "SUPER_ADMIN") {
      const labelLower = (item.label || "").trim().toLowerCase();
      const linkLower = (item.link || "").trim().toLowerCase();
      const baseLower = (item.base || "").trim().toLowerCase();

      if (
        labelLower === "my attendance" ||
        baseLower === "attendance-employee" ||
        linkLower.includes("attendance-employee") ||
        baseLower.includes("attendance-employee")
      ) {
        return false;
      }
    }

    // Process submenu first
    if (item.submenuItems && item.submenuItems.length > 0) {
      item.submenuItems = filterMenu(item.submenuItems, role);
      // If submenu is now empty, hide the parent too
      if (item.submenuItems.length === 0) return false;
      // If submenu has visible items, the parent MUST be visible 
      // (ignore arbitrary link/base restrictions on the wrapper itself)
      return true;
    }

    // If it has a link and it's not '#', check roles
    if (item.link && item.link !== '#' && item.link !== 'index' && item.link !== 'apps') {
      const allowedRoles = getRouteRoles(item.link);
      if (!allowedRoles.includes(role)) return false;
    }

    // Check base explicitly if provided (sometimes item.link is '#')
    if (item.base && item.base !== '/application') {
      const allowedRoles = getRouteRoles(item.base);
      if (!allowedRoles.includes(role)) return false;
    }

    return true;
  });
};

// Helper: Normalize path for comparison (remove trailing slash, lowercase)
const normalizePath = (path: string): string => {
  return path?.toLowerCase().replace(/\/$/, "") || "";
};

// Helper: Check if paths match
const pathsMatch = (path1: string, path2: string): boolean => {
  return normalizePath(path1) === normalizePath(path2);
};

// Helper: Get all base links from a menu item (base, base2, base3, etc.)
const getBaseLinks = (item: SidebarMenuItem): string[] => {
  const baseLinks: string[] = [];
  if (item.base) baseLinks.push(normalizePath(item.base));
  if (item.base2) baseLinks.push(normalizePath(item.base2));
  if (item.base3) baseLinks.push(normalizePath(item.base3));
  if (item.base4) baseLinks.push(normalizePath(item.base4));
  if (item.base5) baseLinks.push(normalizePath(item.base5));
  return baseLinks;
};

// Helper: Check if current path matches any base link (exact match or starts with)
const matchesBaseLinks = (
  item: SidebarMenuItem,
  currentPath: string,
): boolean => {
  const normalizedPath = normalizePath(currentPath);
  const baseLinks = getBaseLinks(item);
  return baseLinks.some((base) => {
    // Exact match
    if (pathsMatch(base, currentPath)) return true;
    // Path starts with base (for route-based base values like /application/chat)
    if (normalizedPath.startsWith(base)) return true;
    // Path equals base
    if (normalizedPath === base) return true;
    return false;
  });
};

// Helper: Check if any child link or base matches current path (recursive)
const hasActiveChild = (
  items: SidebarMenuItem[] | undefined,
  currentPath: string,
): boolean => {
  if (!items) return false;
  return items.some(
    (item) =>
      pathsMatch(item.link, currentPath) ||
      matchesBaseLinks(item, currentPath) ||
      hasActiveChild(item.submenuItems, currentPath),
  );
};

// Helper: Get all links from menu item including base links (recursive)
const getAllLinks = (item: SidebarMenuItem): string[] => {
  const links: string[] = [normalizePath(item.link)];
  // Add all base links
  links.push(...getBaseLinks(item));
  if (item.submenuItems) {
    item.submenuItems.forEach((sub) => {
      links.push(...getAllLinks(sub));
    });
  }
  return links;
};

// Helper: Check if menu item is active (by link or any base)
const isItemActive = (item: SidebarMenuItem, currentPath: string): boolean => {
  // Check direct link match
  if (pathsMatch(item.link, currentPath)) return true;
  // Check base links
  if (matchesBaseLinks(item, currentPath)) return true;
  // Check children
  return hasActiveChild(item.submenuItems, currentPath);
};

const Sidebar = React.memo(() => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const currentPath = location.pathname;

  const dataLayout = useAppSelector((state) => state.themeSetting.dataLayout);
  const user = useAppSelector((state) => state.auth.user) as any;
  const currentRole = (user?.role as Role) || "EMPLOYEE";
  const [companyLogo, setCompanyLogo] = useState<string | null>(user?.companyLogoUrl || null);
  const [companyIcon, setCompanyIcon] = useState<string | null>(user?.companyIconUrl || null);
  const [searchTerm, setSearchTerm] = useState("");

  const getLogoSrc = (logoPath: string | null | undefined) => {
    if (!logoPath) return "";
    if (logoPath.startsWith("http://") || logoPath.startsWith("https://") || logoPath.startsWith("blob:")) {
      return logoPath;
    }
    const base = (apiClient.defaults.baseURL || APP_CONFIG.getBackendUrl()).replace(/\/+$/, "");
    const cleanPath = logoPath.startsWith("/") ? logoPath : `/${logoPath}`;
    return `${base}${cleanPath}`;
  };

  const getProfilePhotoSrc = useCallback((photoUrl: string | null | undefined) => {
    if (!photoUrl) return "/assets/img/profiles/avatar-12.jpg";
    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://") || photoUrl.startsWith("blob:")) {
      return photoUrl;
    }
    const base = (apiClient.defaults.baseURL || APP_CONFIG.getBackendUrl()).replace(/\/+$/, "");
    const cleanPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
    return `${base}${cleanPath}`;
  }, []);

  const formatUserRole = useCallback((role?: string, designation?: string) => {
    if (designation) return designation;
    if (!role) return "Employee";
    switch (role.toUpperCase()) {
      case "SUPER_ADMIN": return "Super Admin";
      case "COMPANY_ADMIN": return "Company Admin";
      case "HR": return "HR Manager";
      case "MANAGER": return "Manager";
      case "EMPLOYEE": return "Employee";
      default: return role.replace(/_/g, " ");
    }
  }, []);

  useEffect(() => {
    if (user?.companyLogoUrl) {
      setCompanyLogo(user.companyLogoUrl);
    }
  }, [user?.companyLogoUrl]);

  useEffect(() => {
    if (user?.companyIconUrl) {
      setCompanyIcon(user.companyIconUrl);
    }
  }, [user?.companyIconUrl]);

  useEffect(() => {
    const handleLogoUpdate = (event: any) => {
      const newLogo = event?.detail;
      if (newLogo) {
        setCompanyLogo(newLogo);
      }
    };
    const handleIconUpdate = (event: any) => {
      const newIcon = event?.detail;
      if (newIcon) {
        setCompanyIcon(newIcon);
      }
    };
    window.addEventListener("companyLogoUpdated", handleLogoUpdate as EventListener);
    window.addEventListener("systemLogoUpdated", handleLogoUpdate as EventListener);
    window.addEventListener("companyIconUpdated", handleIconUpdate as EventListener);
    return () => {
      window.removeEventListener("companyLogoUpdated", handleLogoUpdate as EventListener);
      window.removeEventListener("systemLogoUpdated", handleLogoUpdate as EventListener);
      window.removeEventListener("companyIconUpdated", handleIconUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const sub = user?.subdomain;
        const res = await apiClient.get(`/auth/company-logo${sub ? `?subdomain=${encodeURIComponent(sub)}` : ''}`);
        if (res.data?.success) {
          if (res.data.logoUrl) {
            setCompanyLogo(res.data.logoUrl);
          }
          if (res.data.iconUrl) {
            setCompanyIcon(res.data.iconUrl);
          }
          const logoDiff = res.data.logoUrl && res.data.logoUrl !== user?.companyLogoUrl;
          const iconDiff = res.data.iconUrl && res.data.iconUrl !== user?.companyIconUrl;
          if (user && (logoDiff || iconDiff)) {
            dispatch(updateUser({
              companyLogoUrl: res.data.logoUrl || user.companyLogoUrl,
              companyIconUrl: res.data.iconUrl || user.companyIconUrl,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load company logo in sidebar:", err);
      }
    };
    fetchLogo();
  }, [user?.subdomain, dispatch]);

  // Filter sidebar data deeply based on role
  const filteredSidebarData = useMemo(() => {
    return (JSON.parse(JSON.stringify(SidebarDataTest)) as SidebarMainMenu[])
      .filter((mainMenu) => {
        const titleLower = (mainMenu.tittle || "").toLowerCase();
        if (titleLower === "authentication" || titleLower === "crm") return false;
        if (currentRole === "SUPER_ADMIN" && mainMenu.tittle === "HRM") return false;
        return true;
      })
      .map(mainMenu => {
        mainMenu.submenuItems = filterMenu(mainMenu.submenuItems, currentRole);
        return mainMenu;
      })
      .filter(mainMenu => mainMenu.submenuItems.length > 0);
  }, [currentRole]);

  // Search filtered sidebar data
  const displayedSidebarData = useMemo(() => {
    if (!searchTerm.trim()) return filteredSidebarData;
    const term = searchTerm.toLowerCase().trim();
    return filteredSidebarData
      .map((mainMenu) => {
        const matchingItems = (mainMenu.submenuItems || []).filter((item) => {
          if (item.label.toLowerCase().includes(term)) return true;
          if (item.submenuItems?.some((sub) => sub.label.toLowerCase().includes(term))) return true;
          return false;
        });
        if (matchingItems.length > 0) {
          return { ...mainMenu, submenuItems: matchingItems };
        }
        return null;
      })
      .filter(Boolean) as SidebarMainMenu[];
  }, [filteredSidebarData, searchTerm]);

  const [openMenus, setOpenMenus] = useState<Set<string>>(
    new Set(["Dashboard"]),
  );
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());

  // Find which menus should be open based on current path or search
  const findActiveMenus = useMemo(() => {
    const activeMenuLabels: string[] = [];
    const activeSubMenuLabels: string[] = [];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      displayedSidebarData.forEach((mainMenu) => {
        mainMenu.submenuItems?.forEach((menuItem) => {
          if (
            menuItem.label.toLowerCase().includes(term) ||
            menuItem.submenuItems?.some((sub) => sub.label.toLowerCase().includes(term))
          ) {
            activeMenuLabels.push(menuItem.label);
          }
        });
      });
      return { activeMenuLabels, activeSubMenuLabels };
    }

    filteredSidebarData.forEach((mainMenu) => {
      mainMenu.submenuItems?.forEach((menuItem) => {
        // Check if menu item is active (by link, base, or children)
        if (isItemActive(menuItem, currentPath)) {
          activeMenuLabels.push(menuItem.label);

          // Check for active submenu items
          menuItem.submenuItems?.forEach((subItem) => {
            if (isItemActive(subItem, currentPath)) {
              activeSubMenuLabels.push(subItem.label);
            }
          });
        }
      });
    });

    return { activeMenuLabels, activeSubMenuLabels };
  }, [currentPath, searchTerm, displayedSidebarData, filteredSidebarData]);

  // Auto-open menus when route changes
  useEffect(() => {
    const { activeMenuLabels, activeSubMenuLabels } = findActiveMenus;

    if (activeMenuLabels.length > 0) {
      setOpenMenus(new Set(activeMenuLabels));
    }
    if (activeSubMenuLabels.length > 0) {
      setOpenSubMenus(new Set(activeSubMenuLabels));
    }
  }, [findActiveMenus]);

  // Toggle first level menu
  const toggleMenu = useCallback((label: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  }, []);

  // Toggle second level menu
  const toggleSubMenu = useCallback((label: string) => {
    setOpenSubMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  }, []);

  // Layout change handler
  const handleLayoutChange = useCallback(
    (layout: string) => {
      dispatch(setDataLayout(layout));
    },
    [dispatch],
  );

  // Get layout class from label
  const getLayoutClass = useCallback((label: string): string => {
    const layoutMap: Record<string, string> = {
      Default: "default",
      Mini: "mini",
      Boxed: "boxed",
      Dark: "dark",
      RTL: "rtl",
      Horizontal: "horizontal",
      Modern: "modern",
      "Two Column": "twocolumn",
      Hovered: "hovered",
      "Horizontal Overlay": "horizontal-overlay",
      "Horizontal Box": "horizontal-box",
      "Menu Aside": "horizontal-sidemenu",
      Transparent: "transparent",
      "Without Header": "without-header",
      Detached: "detached",
    };
    return layoutMap[label] || "";
  }, []);

  // Handle menu click
  const handleMenuClick = useCallback(
    (e: React.MouseEvent, item: SidebarMenuItem) => {
      if (item.submenu && item.submenuItems && item.submenuItems.length > 0) {
        e.preventDefault();
        toggleMenu(item.label);
      }
      if (item.themeSetting) {
        handleLayoutChange(getLayoutClass(item.label));
      }
    },
    [toggleMenu, handleLayoutChange, getLayoutClass],
  );

  // Handle submenu click
  const handleSubMenuClick = useCallback(
    (e: React.MouseEvent, item: SidebarMenuItem) => {
      if (item.submenu && item.submenuItems && item.submenuItems.length > 0) {
        e.preventDefault();
        toggleSubMenu(item.label);
      }
    },
    [toggleSubMenu],
  );

  // Mouse event handlers for mini sidebar and hoverview
  const onMouseEnter = useCallback(() => {
    dispatch(setExpandMenu(true));
    const body = document.body;
    const html = document.documentElement;
    // Add expand-menu class to body if mini-sidebar is present OR data-layout is mini OR hoverview mode is active
    if (
      body.classList.contains("mini-sidebar") ||
      html.getAttribute("data-layout") === "mini" ||
      html.getAttribute("data-size") === "hoverview"
    ) {
      body.classList.add("expand-menu");
    }
  }, [dispatch]);

  const onMouseLeave = useCallback(() => {
    dispatch(setExpandMenu(false));
    // Remove expand-menu class from body
    document.body.classList.remove("expand-menu");
  }, [dispatch]);

  // Check if menu item is active (includes base matching)
  const isMenuActive = useCallback(
    (item: SidebarMenuItem): boolean => {
      return isItemActive(item, currentPath);
    },
    [currentPath],
  );

  // Check if link is active (includes base matching)
  const isLinkActive = useCallback(
    (item: SidebarMenuItem): boolean => {
      return isItemActive(item, currentPath);
    },
    [currentPath],
  );

  return (
    <div
      className="sidebar"
      id="sidebar"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <Link to={all_routes.adminDashboard} className="logo logo-normal">
          {companyLogo || user?.companyLogoUrl ? (
            <img
              src={getLogoSrc(companyLogo || user?.companyLogoUrl)}
              alt="Logo"
              style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/assets/img/hgs-logo-HR.webp";
              }}
            />
          ) : (
            <img src="/assets/img/hgs-logo-HR.webp" alt="Logo" style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }} />
          )}
        </Link>
        <Link to={all_routes.adminDashboard} className="logo-small">
          <img
            src={getLogoSrc(companyIcon || user?.companyIconUrl) || "/assets/img/favicon.png"}
            alt="Mini Logo"
            style={{ maxHeight: "32px", maxWidth: "32px", objectFit: "contain", borderRadius: "6px" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/assets/img/favicon.png";
            }}
          />
        </Link>
      </div>


      {/* Sidebar Header (Active in Without Header layout or when header is absent) */}
      <div className="sidebar-header p-3 pb-0 pt-2">
        <Link
          to={all_routes.profile}
          className="rounded sidebar-profile d-flex align-items-center text-decoration-none p-2 mb-3"
        >
          <div className="avatar avatar-md online flex-shrink-0">
            <img
              src={getProfilePhotoSrc(user?.profilePhotoUrl)}
              alt={user?.name || "User"}
              className="img-fluid rounded-circle"
              style={{ width: "38px", height: "38px", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/assets/img/profiles/avatar-12.jpg";
              }}
            />
          </div>
          <div className="text-start sidebar-profile-info ms-2 overflow-hidden flex-grow-1">
            <h6 className="fs-13 fw-semibold mb-0 text-truncate sidebar-profile-name">
              {user?.name || "Admin"}
            </h6>
            <p className="fs-11 fw-normal mb-0 text-truncate sidebar-profile-role">
              {user?.companyRoleName || formatUserRole(user?.role)}
            </p>
          </div>
        </Link>
        <div className="input-group input-group-flat d-inline-flex mb-3">
          <span className="input-icon-addon">
            <i className="ti ti-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="input-group-text">
            <kbd>CTRL + / </kbd>
          </span>
        </div>
        <div className="d-flex align-items-center justify-content-between menu-item mb-2">
          <div className="me-2">
            <Link to={all_routes.calendar} className="btn btn-menubar" title="Calendar">
              <i className="ti ti-layout-grid-remove"></i>
            </Link>
          </div>
          <div className="me-2">
            <Link
              to={all_routes.chat}
              className="btn btn-menubar position-relative"
              title="Chat"
            >
              <i className="ti ti-brand-hipchat"></i>
              <span className="badge bg-info rounded-pill d-flex align-items-center justify-content-center header-badge">
                5
              </span>
            </Link>
          </div>
          <div className="me-2 notification-item">
            <Link
              to={all_routes.activity}
              className="btn btn-menubar position-relative me-1"
              title="Notifications"
            >
              <i className="ti ti-bell"></i>
              <span className="notification-status-dot"></span>
            </Link>
          </div>
          <div className="me-0">
            <Link to={all_routes.email} className="btn btn-menubar" title="Email">
              <i className="ti ti-message"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div className="slimScrollDiv">
        <div className="sidebar-inner slimscroll">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              {displayedSidebarData?.map(
                (mainMenu: SidebarMainMenu, index: number) => (
                  <React.Fragment key={`main-${index}`}>
                    <li className="menu-title">
                      <span>{mainMenu?.tittle}</span>
                    </li>
                    <li>
                      <ul>
                        {mainMenu?.submenuItems?.map(
                          (menuItem: SidebarMenuItem, i: number) => {
                            const hasSubmenu =
                              menuItem.submenu &&
                              menuItem.submenuItems &&
                              menuItem.submenuItems.length > 0;
                            const isOpen = openMenus.has(menuItem.label);
                            const isActive = isMenuActive(menuItem);

                            return (
                              <li
                                className={`${hasSubmenu ? "submenu" : isActive ? "active" : ""}`}
                                key={`menu-${index}-${i}`}
                              >
                                <Link
                                  to={hasSubmenu ? "#" : menuItem.link}
                                  onClick={(e) => handleMenuClick(e, menuItem)}
                                  className={`d-flex align-items-center justify-content-between ${hasSubmenu
                                      ? `${isActive ? "active" : ""} ${isOpen ? "subdrop" : ""}`
                                      : ""
                                    }`}
                                >
                                  <div>
                                    {menuItem.icon && (
                                      <i
                                        className={`ti ti-${menuItem.icon}`}
                                      ></i>
                                    )}
                                    <span>{menuItem.label}</span>
                                  </div>
                                  {menuItem.dot && (
                                    <span className="badge badge-danger fs-10 fw-medium text-white p-1 me-4">
                                      Hot
                                    </span>
                                  )}
                                  {menuItem.changeLogVersion && (
                                    <span className="badge bg-pink badge-xs text-white fs-10 ms-s">
                                      v1.6.3
                                    </span>
                                  )}
                                  {hasSubmenu && (
                                    <span className="menu-arrow"></span>
                                  )}
                                </Link>

                                {/* Level 2 Submenu */}
                                {hasSubmenu && (
                                  <ul
                                    style={{
                                      display: isOpen ? "block" : "none",
                                    }}
                                  >
                                    {menuItem.submenuItems?.map(
                                      (subItem: SidebarMenuItem, j: number) => {
                                        const hasNestedSubmenu =
                                          subItem.submenu &&
                                          subItem.submenuItems &&
                                          subItem.submenuItems.length > 0;
                                        const isSubOpen = openSubMenus.has(
                                          subItem.label,
                                        );
                                        const isSubActive =
                                          isLinkActive(subItem);

                                        return (
                                          <li
                                            className={
                                              hasNestedSubmenu
                                                ? "submenu submenu-two"
                                                : ""
                                            }
                                            key={`sub-${index}-${i}-${j}`}
                                          >
                                            <Link
                                              to={
                                                hasNestedSubmenu
                                                  ? "#"
                                                  : subItem.link
                                              }
                                              onClick={(e) =>
                                                handleSubMenuClick(e, subItem)
                                              }
                                              className={`d-flex align-items-center justify-content-between ${hasNestedSubmenu
                                                  ? `${isSubActive ? "active" : ""} ${isSubOpen ? "subdrop" : ""}`
                                                  : `${isSubActive ? "active" : ""}`
                                                }`}
                                            >
                                              {subItem.label}

                                              {hasNestedSubmenu && (
                                                <span className="menu-arrow inside-submenu"></span>
                                              )}
                                            </Link>

                                            {/* Level 3 Nested Submenu */}
                                            {hasNestedSubmenu && (
                                              <ul
                                                style={{
                                                  display: isSubOpen
                                                    ? "block"
                                                    : "none",
                                                }}
                                              >
                                                {subItem.submenuItems?.map(
                                                  (
                                                    nestedItem: SidebarMenuItem,
                                                    k: number,
                                                  ) => (
                                                    <li
                                                      key={`nested-${index}-${i}-${j}-${k}`}
                                                    >
                                                      <Link
                                                        to={nestedItem.link}
                                                        className={
                                                          isLinkActive(
                                                            nestedItem,
                                                          )
                                                            ? "active"
                                                            : ""
                                                        }
                                                      >
                                                        {nestedItem.label}
                                                      </Link>
                                                    </li>
                                                  ),
                                                )}
                                              </ul>
                                            )}
                                          </li>
                                        );
                                      },
                                    )}
                                  </ul>
                                )}
                              </li>
                            );
                          },
                        )}
                      </ul>
                    </li>
                  </React.Fragment>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
