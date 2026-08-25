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
import apiClient from "../../../core/utils/apiClient";

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

type Role = "SUPER_ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

const getRouteRoles = (path: string | undefined): Role[] => {
  if (!path) return ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  let p = path.toLowerCase();
  if (!p.startsWith('/')) {
    p = '/' + p;
  }

  if (p.startsWith("/super-admin")) return ["SUPER_ADMIN"];

  // 2. Employee Self-Service routes (Accessible by all)
  const employeeAllowedPrefixes = [
    "/employee-dashboard", "/attendance-employee", "/leaves-employee",
    "/pages/profile", "/hrm/holidays", "/application",
    "/projects", "/tasks", "/task-board", "/clients"
  ];
  if (employeeAllowedPrefixes.some(prefix => p.startsWith(prefix))) {
    return ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }
  
  if (p === "/payslip" || p.startsWith("/payslip/")) {
    return ["SUPER_ADMIN", "HR", "MANAGER", "EMPLOYEE"];
  }

  // 3. Manager & HR Approvals
  const adminApprovalPrefixes = [
    "/leaves", "/attendance-admin", "/timesheet", "/performance", "/training",
    "/tickets"
  ];
  if (adminApprovalPrefixes.some(prefix => p.startsWith(prefix))) {
    return ["SUPER_ADMIN", "HR", "MANAGER"];
  }

  // 4. Default: Restricted to HR & Super Admin (Security by default)
  return ["SUPER_ADMIN", "HR"];
};

const filterMenu = (items: SidebarMenuItem[] | undefined, role: Role): SidebarMenuItem[] => {
  if (!items) return [];
  return items.filter(item => {
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

  const user = useAppSelector((state) => state.auth.user) as any;
  const currentRole = (user?.role as Role) || "EMPLOYEE";
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const currentSub = window.location.hostname.split('.')[0];
      const sub = currentSub && currentSub !== 'localhost' && currentSub !== 'www' ? currentSub : user?.subdomain;
      
      if (!sub) return;
      try {
        const res = await apiClient.get(`/auth/company-logo?subdomain=${sub}`);
        if (res.data?.success && res.data.logoUrl) {
          setCompanyLogo(res.data.logoUrl);
        }
      } catch (err) {
        console.error("Failed to load company logo in sidebar:", err);
      }
    };
    fetchLogo();
  }, [user]);

  // Filter sidebar data deeply based on role
  const filteredSidebarData = useMemo(() => {
    const dataCopy = JSON.parse(JSON.stringify(SidebarDataTest)) as SidebarMainMenu[];
    return dataCopy.map(mainMenu => {
      mainMenu.submenuItems = filterMenu(mainMenu.submenuItems, currentRole);
      return mainMenu;
    }).filter(mainMenu => mainMenu.submenuItems.length > 0);
  }, [currentRole]);

  const [openMenus, setOpenMenus] = useState<Set<string>>(
    new Set(["Dashboard"]),
  );
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());

  // Find which menus should be open based on current path
  const findActiveMenus = useMemo(() => {
    const activeMenuLabels: string[] = [];
    const activeSubMenuLabels: string[] = [];

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
  }, [currentPath]);

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
      "Horizontal Single": "horizontal-single",
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
    // Add expand-menu class to body if mini-sidebar is present OR hoverview mode is active
    if (
      body.classList.contains("mini-sidebar") ||
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
              src={(companyLogo || user?.companyLogoUrl).startsWith("http") ? (companyLogo || user?.companyLogoUrl) : `${apiClient.defaults.baseURL || "http://localhost:5000"}${companyLogo || user?.companyLogoUrl}`}
              alt="Logo"
              style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }}
            />
          ) : (
            <img src="/assets/img/hgs-logo-HR.webp" alt="Logo" style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }} />
          )}
        </Link>
        <Link to={all_routes.adminDashboard} className="logo-small">
          {companyLogo || user?.companyLogoUrl ? (
            <img
              src={(companyLogo || user?.companyLogoUrl).startsWith("http") ? (companyLogo || user?.companyLogoUrl) : `${apiClient.defaults.baseURL || "http://localhost:5000"}${companyLogo || user?.companyLogoUrl}`}
              alt="Logo"
              style={{ maxHeight: "25px", maxWidth: "25px", objectFit: "contain", borderRadius: "4px" }}
            />
          ) : (
            <img src="/assets/img/hgs-logo-HR.webp" alt="Logo" style={{ maxHeight: "25px", maxWidth: "25px", objectFit: "contain", borderRadius: "4px" }} />
          )}
        </Link>
        <Link to={all_routes.adminDashboard} className="dark-logo">
          {companyLogo || user?.companyLogoUrl ? (
            <img
              src={(companyLogo || user?.companyLogoUrl).startsWith("http") ? (companyLogo || user?.companyLogoUrl) : `${apiClient.defaults.baseURL || "http://localhost:5000"}${companyLogo || user?.companyLogoUrl}`}
              alt="Logo"
              style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }}
            />
          ) : (
            <img src="/assets/img/hgs-logo-HR.webp" alt="Logo" style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }} />
          )}
        </Link>
      </div>

      {/* Modern Profile */}
      <div className="modern-profile p-3 pb-0">
        <div className="text-center rounded bg-light p-3 mb-4 user-profile">
          <div className="avatar avatar-lg online mb-3">
            <ImageWithBasePath
              src="assets/img/profiles/avatar-02.jpg"
              alt="Img"
              className="img-fluid rounded-circle"
            />
          </div>
          <h6 className="fs-12 fw-normal mb-1">Adrian Herman</h6>
          <p className="fs-10">System Admin</p>
        </div>
        <div className="sidebar-nav mb-3">
          <ul
            className="nav nav-tabs nav-tabs-solid nav-tabs-rounded nav-justified bg-transparent"
            role="tablist"
          >
            <li className="nav-item">
              <Link className="nav-link active border-0" to="#">
                Menu
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link border-0" to={all_routes.chat}>
                Chats
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link border-0" to={all_routes.email}>
                Inbox
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Sidebar Header */}
      <div className="sidebar-header p-3 pb-0 pt-2">
        <div className="text-center rounded bg-light p-2 mb-4 sidebar-profile d-flex align-items-center">
          <div className="avatar avatar-md onlin">
            <ImageWithBasePath
              src="assets/img/profiles/avatar-02.jpg"
              alt="Img"
              className="img-fluid rounded-circle"
            />
          </div>
          <div className="text-start sidebar-profile-info ms-2">
            <h6 className="fs-12 fw-normal mb-1">Adrian Herman</h6>
            <p className="fs-10">System Admin</p>
          </div>
        </div>
        <div className="input-group input-group-flat d-inline-flex mb-4">
          <span className="input-icon-addon">
            <i className="ti ti-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search in HRMS"
          />
          <span className="input-group-text">
            <kbd>CTRL + / </kbd>
          </span>
        </div>
        <div className="d-flex align-items-center justify-content-between menu-item mb-3">
          <div className="me-3">
            <Link to={all_routes.calendar} className="btn btn-menubar">
              <i className="ti ti-layout-grid-remove"></i>
            </Link>
          </div>
          <div className="me-3">
            <Link
              to={all_routes.chat}
              className="btn btn-menubar position-relative"
            >
              <i className="ti ti-brand-hipchat"></i>
              <span className="badge bg-info rounded-pill d-flex align-items-center justify-content-center header-badge">
                5
              </span>
            </Link>
          </div>
          <div className="me-3 notification-item">
            <Link
              to={all_routes.activity}
              className="btn btn-menubar position-relative me-1"
            >
              <i className="ti ti-bell"></i>
              <span className="notification-status-dot"></span>
            </Link>
          </div>
          <div className="me-0">
            <Link to={all_routes.email} className="btn btn-menubar">
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
              {filteredSidebarData?.map(
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
                                  {menuItem.newBadge && (
                                    <span className="badge badge-danger fs-10 fw-medium text-white p-1">
                                      New
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
                                              {subItem.newBadge && (
                                                <span className="badge badge-danger fs-10 fw-medium text-white p-1">
                                                  New
                                                </span>
                                              )}

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
