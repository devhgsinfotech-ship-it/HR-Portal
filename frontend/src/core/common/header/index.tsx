import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setDataLayout } from "../../data/redux/themeSettingSlice";
import { logout } from "../../data/redux/authSlice";
import ImageWithBasePath from "../imageWithBasePath";
import {
  setMobileSidebar,
  toggleMiniSidebar,
} from "../../data/redux/sidebarSlice";
import { all_routes } from "../../../router/all_routes";
import { HorizontalSidebarData } from "../../data/json/horizontalSidebar";
import React from "react";
import apiClient from "../../../core/utils/apiClient";
import type {
  AppRootState as RootState,
  AppDispatch,
} from "../../data/redux/store";
import type {
  HorizontalMainMenu,
  HorizontalMenuItem,
  HorizontalSubMenu,
} from "../../data/types";
import HorizontalSignalSidebar from "../horizontal-sidebar/horizontalsingalMenu";
import { APP_CONFIG } from "../../../environment";

// Helper to get all routes from a menu item recursively
const getAllRoutes = (item: HorizontalSubMenu): string[] => {
  const routes: string[] = [];
  if (item.route) routes.push(item.route);
  if (item.subMenusTwo) {
    item.subMenusTwo.forEach((sub) => {
      routes.push(...getAllRoutes(sub));
    });
  }
  if (item.subMenusThree) {
    item.subMenusThree.forEach((sub: HorizontalSubMenu) => {
      routes.push(...getAllRoutes(sub));
    });
  }
  if (item.subMenusFour) {
    item.subMenusFour.forEach((sub: HorizontalSubMenu) => {
      routes.push(...getAllRoutes(sub));
    });
  }
  return routes;
};

// Helper to check if any child has the active route
const hasActiveChild = (
  subMenus: HorizontalSubMenu[] | undefined,
  currentPath: string,
): boolean => {
  if (!subMenus) return false;
  return subMenus.some((sub) => {
    if (sub.route === currentPath) return true;
    if (sub.subMenusTwo && hasActiveChild(sub.subMenusTwo, currentPath))
      return true;
    if (sub.subMenusThree && hasActiveChild(sub.subMenusThree, currentPath))
      return true;
    if (sub.subMenusFour && hasActiveChild(sub.subMenusFour, currentPath))
      return true;
    return false;
  });
};

const Header = React.memo(() => {
  const routes = all_routes;
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const dataLayout = useSelector(
    (state: RootState) => state.themeSetting.dataLayout,
  );
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const Location = useLocation();
  const apiUrl = APP_CONFIG.getBackendUrl();
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
        console.error("Failed to load company logo in header:", err);
      }
    };
    fetchLogo();
  }, [user]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(logout());
    navigate(all_routes.login);
  };

  // ── Dynamic Global Search States & Handlers ──────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const searchContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Fetch Employees and Departments for Search Index when search is opened
  useEffect(() => {
    if (isSearchOpen && dbEmployees.length === 0) {
      const loadSearchData = async () => {
        try {
          const [empRes, deptRes] = await Promise.allSettled([
            apiClient.get('/employees'),
            apiClient.get('/departments')
          ]);
          if (empRes.status === 'fulfilled' && empRes.value.data) {
            setDbEmployees(Array.isArray(empRes.value.data) ? empRes.value.data : []);
          }
          if (deptRes.status === 'fulfilled' && deptRes.value.data) {
            setDbDepartments(Array.isArray(deptRes.value.data) ? deptRes.value.data : []);
          }
        } catch (e) {
          console.error("Search data load error:", e);
        }
      };
      loadSearchData();
    }
  }, [isSearchOpen, dbEmployees.length]);

  // Keyboard shortcut listener (CTRL + /) and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // System Modules & Actions Index for Quick Jump
  const systemModules = useMemo(() => [
    { title: 'Org Directory', category: 'Pages & Actions', icon: 'building', route: all_routes.org || '/org', keywords: 'organization org employee directory team' },
    { title: 'Employees List', category: 'Pages & Actions', icon: 'users', route: all_routes.employeeList || '/employees', keywords: 'employee staff workforce team list' },
    { title: 'Employees Grid', category: 'Pages & Actions', icon: 'layout-grid', route: all_routes.employeeGrid || '/employees-grid', keywords: 'employee grid cards' },
    { title: 'Departments', category: 'Departments', icon: 'building-community', route: all_routes.departments || '/departments', keywords: 'department team division dept' },
    { title: 'Designations', category: 'Departments', icon: 'badge', route: all_routes.designations || '/designations', keywords: 'designation role position title' },
    
    { title: 'My Attendance', category: 'Attendance & Leaves', icon: 'clock-check', route: all_routes.attendanceemployee || '/attendance-employee', keywords: 'attendance punch checkin checkout time in out' },
    { title: 'Attendance Management', category: 'Attendance & Leaves', icon: 'clock-cog', route: all_routes.attendanceadmin || '/attendance-admin', keywords: 'admin attendance regularization punches' },
    { title: 'My Leaves', category: 'Attendance & Leaves', icon: 'calendar-off', route: all_routes.leaveemployee || '/leaves-employee', keywords: 'leave vacation timeoff apply leave balance' },
    { title: 'Leave Approvals', category: 'Attendance & Leaves', icon: 'calendar-event', route: all_routes.leaveadmin || '/leaves', keywords: 'leave admin approve reject leave requests' },
    { title: 'Holidays', category: 'Attendance & Leaves', icon: 'calendar-star', route: all_routes.holidays || '/hrm/holidays', keywords: 'holiday calendar festival office off' },
    
    { title: 'My Payslips & Salary', category: 'Payroll', icon: 'receipt-2', route: all_routes.payslip || '/payslip', keywords: 'payslip salary pay slip gross net salary structure tax' },
    { title: 'Employee Salary List', category: 'Payroll', icon: 'cash', route: all_routes.employeesalary || '/payroll/employee-salary', keywords: 'employee salary payroll list' },
    { title: 'Payroll Additions', category: 'Payroll', icon: 'currency-dollar', route: all_routes.payrollAddition || '/payroll/payroll-addition', keywords: 'payroll items deductions allowances basic hra' },
    
    { title: 'Goal Tracking', category: 'Performance', icon: 'target', route: all_routes.goalTracking || '/performance/goal-tracking', keywords: 'goals target okr kpi tracking' },
    { title: 'Performance Review', category: 'Performance', icon: 'stars', route: all_routes.performanceReview || '/performance/performance-review', keywords: 'appraisal review rating evaluation' },
    { title: 'Performance Indicators', category: 'Performance', icon: 'chart-bar', route: all_routes.performanceIndicator || '/performance/performance-indicator', keywords: 'kpi indicator metrics' },
    
    { title: 'Company Policies', category: 'Policies & Docs', icon: 'file-text', route: all_routes.policy || '/policy', keywords: 'policy document hr rules guidelines code of conduct' },
    { title: 'My Profile & Documents', category: 'Policies & Docs', icon: 'user-circle', route: all_routes.profile || '/pages/profile', keywords: 'profile documents aadhaar pan resume personal info' },
    
    { title: 'Leave Settings', category: 'Settings', icon: 'adjustments', route: all_routes.leavesettings || '/leave-settings', keywords: 'leave settings policy types' },
    { title: 'General Settings', category: 'Settings', icon: 'settings', route: all_routes.profilesettings || '/settings/general-settings', keywords: 'company settings logo system config' },
  ], [routes]);

  // Compute Search Results across Employees, Departments, Pages & Modules
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return { pages: [], employees: [], departments: [] };

    const matchedPages = systemModules.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.category.toLowerCase().includes(q) || 
      m.keywords.toLowerCase().includes(q)
    );

    const matchedEmployees = dbEmployees.filter(emp => {
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
      const code = String(emp.employeeCode || emp.employeeId || '').toLowerCase();
      const email = String(emp.user?.email || emp.email || '').toLowerCase();
      const dept = String(emp.department?.name || emp.departmentName || '').toLowerCase();
      const desig = String(emp.designation?.name || emp.companyRole?.name || '').toLowerCase();
      return name.includes(q) || code.includes(q) || email.includes(q) || dept.includes(q) || desig.includes(q);
    }).slice(0, 5);

    const matchedDepts = dbDepartments.filter(d => 
      String(d.name || '').toLowerCase().includes(q)
    ).slice(0, 4);

    return { pages: matchedPages, employees: matchedEmployees, departments: matchedDepts };
  }, [searchQuery, systemModules, dbEmployees, dbDepartments]);

  // Multi-level menu open states (using Set for multiple open menus)
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());
  const [openSubMenusTwo, setOpenSubMenusTwo] = useState<Set<string>>(
    new Set(),
  );
  const [openSubMenusThree, setOpenSubMenusThree] = useState<Set<string>>(
    new Set(),
  );

  // Toggle functions for each level
  const toggleMenu = useCallback((menuValue: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuValue)) {
        newSet.delete(menuValue);
      } else {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const toggleSubMenu = useCallback((menuValue: string) => {
    setOpenSubMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuValue)) {
        newSet.delete(menuValue);
      } else {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const toggleSubMenuTwo = useCallback((menuValue: string) => {
    setOpenSubMenusTwo((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuValue)) {
        newSet.delete(menuValue);
      } else {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const toggleSubMenuThree = useCallback((menuValue: string) => {
    setOpenSubMenusThree((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuValue)) {
        newSet.delete(menuValue);
      } else {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const mobileSidebar = useSelector(
    (state: RootState) => state.sidebarSlice.mobileSidebar,
  );

  // Memoize the toggle mobile sidebar function
  const toggleMobileSidebar = useCallback(() => {
    dispatch(setMobileSidebar(!mobileSidebar));
  }, [dispatch, mobileSidebar]);

  // Memoize the toggle mini sidebar function
  const handleToggleMiniSidebar = useCallback(() => {
    if (dataLayout === "mini_layout") {
      dispatch(setDataLayout("default_layout"));
      localStorage.setItem("dataLayout", "default_layout");
    } else {
      dispatch(toggleMiniSidebar());
    }
  }, [dataLayout, dispatch]);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Memoize the toggle fullscreen function
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  // Check if a menu item or any of its children is active
  const isMenuActive = useCallback(
    (data: HorizontalMenuItem): boolean => {
      if (!data.subMenus) return false;
      return data.subMenus.some((sub) => {
        if (sub.route === Location.pathname) return true;
        const allRoutes = getAllRoutes(sub);
        return allRoutes.includes(Location.pathname);
      });
    },
    [Location.pathname],
  );

  // Render Level 4 submenu items
  const renderSubMenusFour = useCallback(
    (items: HorizontalSubMenu[] | undefined) => {
      if (!items) return null;
      return items.map((item, index) => (
        <li key={`level4-${index}-${item.menuValue || item.label}`}>
          <Link
            to={item.route || "#"}
            className={item.route === Location.pathname ? "active" : ""}
          >
            {item.menuValue || item.label}
          </Link>
        </li>
      ));
    },
    [Location.pathname],
  );

  // Render Level 3 submenu items
  const renderSubMenusThree = useCallback(
    (items: HorizontalSubMenu[] | undefined, parentKey: string) => {
      if (!items) return null;
      return items.map((item, index) => {
        const menuKey = `${parentKey}-l3-${index}-${
          item.menuValue || item.label
        }`;
        const hasSubMenus = item.subMenusFour && item.subMenusFour.length > 0;
        const isActive =
          item.route === Location.pathname ||
          hasActiveChild(item.subMenusFour, Location.pathname);
        const isOpen = openSubMenusThree.has(menuKey);

        return (
          <li
            key={menuKey}
            className={hasSubMenus ? "submenu submenu-two submenu-three" : ""}
          >
            <Link
              to={item.route || "#"}
              className={`${isActive ? "active" : ""} ${
                isOpen ? "subdrop" : ""
              }`}
              onClick={(e) => {
                if (hasSubMenus) {
                  e.preventDefault();
                  toggleSubMenuThree(menuKey);
                }
              }}
            >
              {item.menuValue || item.label}
              {hasSubMenus && (
                <span className="menu-arrow inside-submenu inside-submenu-two"></span>
              )}
            </Link>
            {hasSubMenus && (
              <ul style={{ display: isOpen ? "block" : "none" }}>
                {renderSubMenusFour(item.subMenusFour)}
              </ul>
            )}
          </li>
        );
      });
    },
    [
      Location.pathname,
      openSubMenusThree,
      toggleSubMenuThree,
      renderSubMenusFour,
    ],
  );

  // Render Level 2 submenu items
  const renderSubMenusTwo = useCallback(
    (items: HorizontalSubMenu[] | undefined, parentKey: string) => {
      if (!items) return null;
      return items.map((item, index) => {
        const menuKey = `${parentKey}-l2-${index}-${
          item.menuValue || item.label
        }`;
        const hasSubMenus =
          (item.subMenusThree && item.subMenusThree.length > 0) ||
          (item.subMenusFour && item.subMenusFour.length > 0);
        const isActive =
          item.route === Location.pathname ||
          hasActiveChild(item.subMenusThree, Location.pathname) ||
          hasActiveChild(item.subMenusFour, Location.pathname);
        const isOpen = openSubMenusTwo.has(menuKey);

        // Determine the correct submenu items to render
        const subItems = item.subMenusThree || item.subMenusFour;

        return (
          <li
            key={menuKey}
            className={hasSubMenus ? "submenu submenu-two" : ""}
          >
            <Link
              to={item.route || "#"}
              className={`${isActive ? "active" : ""} ${
                isOpen ? "subdrop" : ""
              }`}
              onClick={(e) => {
                if (hasSubMenus) {
                  e.preventDefault();
                  toggleSubMenuTwo(menuKey);
                }
              }}
            >
              {item.menuValue || item.label}
              {hasSubMenus && (
                <span className="menu-arrow inside-submenu"></span>
              )}
            </Link>
            {hasSubMenus && subItems && (
              <ul style={{ display: isOpen ? "block" : "none" }}>
                {item.subMenusThree
                  ? renderSubMenusThree(item.subMenusThree, menuKey)
                  : renderSubMenusFour(item.subMenusFour)}
              </ul>
            )}
          </li>
        );
      });
    },
    [
      Location.pathname,
      openSubMenusTwo,
      toggleSubMenuTwo,
      renderSubMenusThree,
      renderSubMenusFour,
    ],
  );

  // Render Level 1 submenu items
  const renderSubMenus = useCallback(
    (data: HorizontalMenuItem, parentKey: string) => {
      if (!data.subMenus) return null;
      return data.subMenus.map((subMenu, index) => {
        const menuKey = `${parentKey}-l1-${index}-${
          subMenu.menuValue || subMenu.label
        }`;
        const hasSubMenus =
          (subMenu.customSubmenuTwo && subMenu.subMenusTwo) ||
          subMenu.subMenusThree ||
          subMenu.subMenusFour;
        const isActive =
          subMenu.route === Location.pathname ||
          hasActiveChild(subMenu.subMenusTwo, Location.pathname) ||
          hasActiveChild(subMenu.subMenusThree, Location.pathname) ||
          hasActiveChild(subMenu.subMenusFour, Location.pathname);
        const isOpen = openSubMenus.has(menuKey);

        return (
          <li
            key={menuKey}
            className={hasSubMenus ? "submenu submenu-two" : ""}
          >
            <Link
              to={subMenu.route || "#"}
              className={`${isActive ? "active" : ""} ${
                isOpen ? "subdrop" : ""
              }`}
              onClick={(e) => {
                if (hasSubMenus) {
                  e.preventDefault();
                  toggleSubMenu(menuKey);
                }
              }}
            >
              <span>{subMenu.menuValue || subMenu.label}</span>
              {hasSubMenus && (
                <span className="menu-arrow inside-submenu"></span>
              )}
            </Link>
            {hasSubMenus && (
              <ul style={{ display: isOpen ? "block" : "none" }}>
                {subMenu.subMenusTwo &&
                  renderSubMenusTwo(subMenu.subMenusTwo, menuKey)}
                {!subMenu.subMenusTwo &&
                  subMenu.subMenusThree &&
                  renderSubMenusThree(subMenu.subMenusThree, menuKey)}
                {!subMenu.subMenusTwo &&
                  !subMenu.subMenusThree &&
                  subMenu.subMenusFour &&
                  renderSubMenusFour(subMenu.subMenusFour)}
              </ul>
            )}
          </li>
        );
      });
    },
    [
      Location.pathname,
      openSubMenus,
      toggleSubMenu,
      renderSubMenusTwo,
      renderSubMenusThree,
      renderSubMenusFour,
    ],
  );

  // Memoize the menu items rendering
  const menuItems = useMemo(
    () =>
      HorizontalSidebarData?.map(
        (mainMenu: HorizontalMainMenu, index: number) => (
          <React.Fragment key={`main-${index}`}>
            {mainMenu?.menu?.map((data: HorizontalMenuItem, i: number) => {
              const menuKey = `menu-${index}-${i}-${data.menuValue}`;
              const active = isMenuActive(data);
              const isOpen = openMenus.has(menuKey);

              return (
                <li className="submenu" key={menuKey}>
                  <Link
                    to="#"
                    className={`${active ? "active" : ""} ${
                      isOpen ? "subdrop" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleMenu(menuKey);
                    }}
                  >
                    <i className={`ti ti-${data.icon}`}></i>
                    <span>{data.menuValue}</span>
                    <span className="menu-arrow"></span>
                  </Link>
                  <ul style={{ display: isOpen ? "block" : "none" }}>
                    {renderSubMenus(data, menuKey)}
                  </ul>
                </li>
              );
            })}
          </React.Fragment>
        ),
      ),
    [
      HorizontalSidebarData,
      isMenuActive,
      openMenus,
      toggleMenu,
      renderSubMenus,
    ],
  );

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="main-header">
          <div className="header-left">
            <Link to={routes.adminDashboard} className="logo">
              {companyLogo || user?.companyLogoUrl ? (
                <img
                  src={(companyLogo || user?.companyLogoUrl).startsWith("http") ? (companyLogo || user?.companyLogoUrl) : `${apiUrl || "http://localhost:5000"}${companyLogo || user?.companyLogoUrl}`}
                  alt="Company Logo"
                  style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }}
                />
              ) : (
                <img src="/assets/img/hgs-logo-HR.webp" alt="Logo" style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }} />
              )}
            </Link>
            <Link to={routes.adminDashboard} className="dark-logo">
              {companyLogo || user?.companyLogoUrl ? (
                <img
                  src={(companyLogo || user?.companyLogoUrl).startsWith("http") ? (companyLogo || user?.companyLogoUrl) : `${apiUrl || "http://localhost:5000"}${companyLogo || user?.companyLogoUrl}`}
                  alt="Company Logo"
                  style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }}
                />
              ) : (
                <img src="/assets/img/hgs-logo-HR.webp" alt="Logo" style={{ maxHeight: "35px", maxWidth: "140px", objectFit: "contain" }} />
              )}
            </Link>
          </div>

          <Link
            id="mobile_btn"
            onClick={toggleMobileSidebar}
            className="mobile_btn"
            to="#sidebar"
          >
            <span className="bar-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </Link>

          <div className="header-user">
            <div className="nav user-menu nav-list position-relative">

              {/* Dynamic Search Component Centered */}
              <div 
                className="position-absolute start-50 top-50 translate-middle d-none d-md-block" 
                ref={searchContainerRef} 
                style={{ width: "380px", maxWidth: "45vw", zIndex: 100 }}
              >
                  <div className="input-group input-group-flat">
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="form-control"
                      placeholder="Search in HRMS..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchOpen(true)}
                    />
                    <span className="input-group-text cursor-pointer" onClick={() => searchInputRef.current?.focus()}>
                      <kbd className="bg-light text-muted border px-1">CTRL + /</kbd>
                    </span>
                  </div>

                  {/* Floating Live Search Dropdown */}
                  {isSearchOpen && searchQuery.trim().length > 0 && (
                    <div 
                      className="dropdown-menu show shadow-lg border rounded-3 p-3 position-absolute w-100 mt-1 bg-white overflow-auto" 
                      style={{ maxHeight: '450px', zIndex: 1050, left: 0, minWidth: '360px' }}
                    >
                      {/* Search Header */}
                      <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                        <span className="fs-11 text-uppercase fw-bold text-muted">
                          {searchQuery ? `Search Results for "${searchQuery}"` : 'Quick Jump & Navigation'}
                        </span>
                        <span className="badge bg-light text-muted border fs-10">Esc to close</span>
                      </div>

                      {/* Employees Section */}
                      {searchResults.employees.length > 0 && (
                        <div className="mb-3">
                          <div className="fs-11 fw-bold text-primary text-uppercase mb-2 d-flex align-items-center">
                            <i className="ti ti-user me-1" /> Employees ({searchResults.employees.length})
                          </div>
                          {searchResults.employees.map((emp) => {
                            const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.user?.name || 'Employee';
                            const desig = emp.designation?.name || emp.companyRole?.name || 'Staff';
                            const empCode = emp.employeeCode || emp.employeeId || '';
                            const userRole = user?.role || localStorage.getItem('userRole') || 'EMPLOYEE';
                            const targetRoute = userRole === 'EMPLOYEE' ? '/org' : `${all_routes.employeedetails}?id=${emp.id}`;

                            return (
                              <div 
                                key={emp.id}
                                className="d-flex align-items-center p-2 rounded hover-bg-light cursor-pointer mb-1 border-bottom-dashed"
                                onClick={() => {
                                  navigate(targetRoute);
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                }}
                              >
                                <div className="avatar avatar-sm rounded-circle me-2 bg-primary-transparent text-primary fw-bold d-flex align-items-center justify-content-center">
                                  {empName.charAt(0)}
                                </div>
                                <div className="flex-grow-1 overflow-hidden">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <span className="fw-bold text-dark fs-13 text-truncate">{empName}</span>
                                    {empCode && <span className="badge bg-light text-secondary border fs-10">{empCode}</span>}
                                  </div>
                                  <div className="fs-11 text-muted text-truncate">{desig} {emp.department?.name ? `• ${emp.department.name}` : ''}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Departments Section */}
                      {searchResults.departments.length > 0 && (
                        <div className="mb-3">
                          <div className="fs-11 fw-bold text-success text-uppercase mb-2 d-flex align-items-center">
                            <i className="ti ti-building-community me-1" /> Departments ({searchResults.departments.length})
                          </div>
                          {searchResults.departments.map((dept) => (
                            <div 
                              key={dept.id}
                              className="d-flex align-items-center justify-content-between p-2 rounded hover-bg-light cursor-pointer mb-1 border-bottom-dashed"
                              onClick={() => {
                                navigate('/departments');
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                            >
                              <div className="d-flex align-items-center">
                                <i className="ti ti-building-arch text-success me-2 fs-16" />
                                <span className="fw-semibold text-dark fs-13">{dept.name}</span>
                              </div>
                              <span className="fs-11 text-muted">View Department</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* System Pages & Modules Section */}
                      {searchResults.pages.length > 0 && (
                        <div className="mb-2">
                          <div className="fs-11 fw-bold text-secondary text-uppercase mb-2 d-flex align-items-center">
                            <i className="ti ti-layout-grid me-1" /> System Modules & Pages ({searchResults.pages.length})
                          </div>
                          {searchResults.pages.map((m, idx) => (
                            <div 
                              key={idx}
                              className="d-flex align-items-center justify-content-between p-2 rounded hover-bg-light cursor-pointer mb-1"
                              onClick={() => {
                                navigate(m.route);
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                            >
                              <div className="d-flex align-items-center">
                                <i className={`ti ti-${m.icon} text-primary me-2 fs-16`} />
                                <div>
                                  <div className="fw-semibold text-dark fs-13">{m.title}</div>
                                  <div className="fs-10 text-muted">{m.category}</div>
                                </div>
                              </div>
                              <i className="ti ti-chevron-right text-muted fs-12" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No Results Fallback */}
                      {searchResults.employees.length === 0 && searchResults.departments.length === 0 && searchResults.pages.length === 0 && (
                        <div className="text-center py-4 text-muted">
                          <i className="ti ti-search-off fs-24 mb-1 d-block text-secondary" />
                          <div className="fs-13 fw-semibold">No results found for "{searchQuery}"</div>
                          <div className="fs-11">Try searching by module name, employee name, or department</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* /Dynamic Search Component */}

                <div className="ms-auto d-flex align-items-center">
                <Link
                  to={all_routes.profilesettings}
                  className="btn btn-menubar"
                >
                  <i className="ti ti-settings-cog" />
                </Link>
              </div>
              <HorizontalSignalSidebar />
              {/* /Horizontal Single */}
              <div className="d-flex align-items-center">
                <div className="dropdown ai-dropdown me-2">
                  <Link
                    to="#"
                    className="dropdown-toggle d-flex align-items-center btn btn-primary-gradient"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-sparkles me-1" />
                    AI Center
                    <i className="ti ti-chevron-down ms-1" />
                  </Link>
                  <div className="dropdown-menu shadow-none p-3">
                    <Link
                      className="dropdown-item rounded"
                      to={all_routes.aiAttendanceInsights}
                    >
                      AI Attendance Insights
                    </Link>
                    <Link
                      className="dropdown-item rounded"
                      to={all_routes.aiPayrollForecast}
                    >
                      AI Payroll Forecast
                    </Link>
                    <Link
                      className="dropdown-item rounded"
                      to={all_routes.aiHiringForecast}
                    >
                      AI Hiring Forecast
                    </Link>
                    <Link
                      className="dropdown-item rounded"
                      to={all_routes.aiTeamPerformanceInsights}
                    >
                      AI Team Performance Insights
                    </Link>
                    <Link
                      className="dropdown-item rounded"
                      to={all_routes.aiConfiguration}
                    >
                      AI Settings
                    </Link>
                  </div>
                </div>

                <div className="me-2">
                  <Link
                    to="#"
                    onClick={toggleFullscreen}
                    className="btn btn-menubar btnFullscreen"
                  >
                    <i className="ti ti-maximize"></i>
                  </Link>
                </div>
                <div className="dropdown me-2">
                  <Link
                    to="#"
                    className="btn btn-menubar"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-layout-grid-remove" />
                  </Link>
                  <div className="dropdown-menu dropdown-menu-end">
                    <div className="card mb-0 border-0 shadow-none">
                      <div className="card-header">
                        <h4>Applications</h4>
                      </div>
                      <div className="card-body">
                        <Link to={all_routes.calendar} className="d-block pb-2">
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-calendar text-gray-9" />
                          </span>
                          Calendar
                        </Link>
                        <Link to={all_routes.todo} className="d-block py-2">
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-subtask text-gray-9" />
                          </span>
                          To Do
                        </Link>
                        <Link to={all_routes.notes} className="d-block py-2">
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-notes text-gray-9" />
                          </span>
                          Notes
                        </Link>
                        <Link
                          to={all_routes.fileManager}
                          className="d-block py-2"
                        >
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-folder text-gray-9" />
                          </span>
                          File Manager
                        </Link>
                        <Link
                          to={all_routes.kanbanView}
                          className="d-block py-2"
                        >
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-layout-kanban text-gray-9" />
                          </span>
                          Kanban
                        </Link>
                        <Link
                          to={all_routes.applicationinvoices}
                          className="d-block py-2 pb-0"
                        >
                          <span className="avatar avatar-md bg-transparent-dark me-2">
                            <i className="ti ti-file-invoice text-gray-9" />
                          </span>
                          Invoices
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="me-2">
                  <Link
                    to={all_routes.chat}
                    className="btn btn-menubar position-relative"
                  >
                    <i className="ti ti-message" />
                    <span className="msg-status-dot" />
                  </Link>
                </div>
                <div className="me-2">
                  <Link to={all_routes.email} className="btn btn-menubar">
                    <i className="ti ti-mail" />
                  </Link>
                </div>
                <div className="me-2 notification_item">
                  <Link
                    to="#"
                    className="btn btn-menubar position-relative me-1"
                    id="notification_popup"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-bell" />
                    <span className="notification-status-dot" />
                  </Link>
                  <div className="dropdown-menu dropdown-menu-end notification-dropdown p-4">
                    <div className="d-flex align-items-center justify-content-between border-bottom p-0 pb-3 mb-3">
                      <h4 className="notification-title">Notifications (2)</h4>
                      <div className="d-flex align-items-center">
                        <Link to="#" className="text-primary fs-15 me-3 lh-1">
                          Mark all as read
                        </Link>
                        <div className="dropdown">
                          <Link
                            to="#"
                            className="bg-white dropdown-toggle"
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-calendar-due me-1" />
                            Today
                          </Link>
                          <ul className="dropdown-menu mt-2 p-3">
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                This Week
                              </Link>
                            </li>
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                Last Week
                              </Link>
                            </li>
                            <li>
                              <Link to="#" className="dropdown-item rounded-1">
                                Last Month
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="noti-content">
                      <div className="d-flex flex-column">
                        <div className="border-bottom mb-3 pb-3">
                          <Link to={all_routes.activity}>
                            <div className="d-flex">
                              <span className="avatar avatar-lg me-2 flex-shrink-0">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-27.jpg"
                                  alt="Profile"
                                />
                              </span>
                              <div className="flex-grow-1">
                                <p className="mb-1">
                                  <span className="text-dark fw-semibold">
                                    Shawn
                                  </span>
                                  performance in Math is below the threshold.
                                </p>
                                <span>Just Now</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="border-bottom mb-3 pb-3">
                          <Link to={all_routes.activity} className="pb-0">
                            <div className="d-flex">
                              <span className="avatar avatar-lg me-2 flex-shrink-0">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-23.jpg"
                                  alt="Profile"
                                />
                              </span>
                              <div className="flex-grow-1">
                                <p className="mb-1">
                                  <span className="text-dark fw-semibold">
                                    Sylvia
                                  </span>{" "}
                                  added appointment on 02:00 PM
                                </p>
                                <span>10 mins ago</span>
                                <div className="d-flex justify-content-start align-items-center mt-1">
                                  <span className="btn btn-light btn-sm me-2">
                                    Deny
                                  </span>
                                  <span className="btn btn-primary btn-sm">
                                    Approve
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="border-bottom mb-3 pb-3">
                          <Link to={all_routes.activity}>
                            <div className="d-flex">
                              <span className="avatar avatar-lg me-2 flex-shrink-0">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-25.jpg"
                                  alt="Profile"
                                />
                              </span>
                              <div className="flex-grow-1">
                                <p className="mb-1">
                                  New student record{" "}
                                  <span className="text-dark fw-semibold">
                                    {" "}
                                    George
                                  </span>{" "}
                                  is created by{" "}
                                  <span className="text-dark fw-semibold">
                                    Teressa
                                  </span>
                                </p>
                                <span>2 hrs ago</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                        <div className="border-0 mb-3 pb-0">
                          <Link to={all_routes.activity}>
                            <div className="d-flex">
                              <span className="avatar avatar-lg me-2 flex-shrink-0">
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-01.jpg"
                                  alt="Profile"
                                />
                              </span>
                              <div className="flex-grow-1">
                                <p className="mb-1">
                                  A new teacher record for{" "}
                                  <span className="text-dark fw-semibold">
                                    Elisa
                                  </span>{" "}
                                </p>
                                <span>09:45 AM</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex p-0">
                      <Link to="#" className="btn btn-light w-100 me-2">
                        Cancel
                      </Link>
                      <Link
                        to={all_routes.activity}
                        className="btn btn-primary w-100"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="dropdown profile-dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle d-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <span className="avatar avatar-md online overflow-hidden">
                      {user?.profilePhotoUrl ? (
                        <img
                          src={user.profilePhotoUrl.startsWith('http') ? user.profilePhotoUrl : `${apiUrl}${user.profilePhotoUrl}`}
                          alt="Img"
                          className="img-fluid rounded-circle"
                          style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        />
                      ) : (
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-12.jpg"
                          alt="Img"
                          className="img-fluid rounded-circle"
                        />
                      )}
                    </span>
                  </Link>
                  <div className="dropdown-menu shadow-none">
                    <div className="card mb-0">
                      <div className="card-header">
                        <div className="d-flex align-items-center">
                          <span className="avatar avatar-lg me-2 avatar-rounded overflow-hidden">
                            {user?.profilePhotoUrl ? (
                              <img
                                src={user.profilePhotoUrl.startsWith('http') ? user.profilePhotoUrl : `${apiUrl}${user.profilePhotoUrl}`}
                                alt="Img"
                                className="img-fluid rounded-circle"
                                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                              />
                            ) : (
                              <ImageWithBasePath
                                src="assets/img/profiles/avatar-12.jpg"
                                alt="img"
                                className="img-fluid rounded-circle"
                              />
                            )}
                          </span>
                          <div>
                            <h5 className="mb-0">{user?.name || "Admin"}</h5>
                            <p className="fs-12 fw-medium mb-0">
                              {user?.email || "admin@example.com"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="card-body">
                        <Link
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2"
                          to={all_routes.profile}
                        >
                          <i className="ti ti-user-circle me-1" />
                          My Profile
                        </Link>
                        <Link
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2"
                          to={all_routes.businessSettings}
                        >
                          <i className="ti ti-settings me-1" />
                          Settings
                        </Link>
                        <Link
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2"
                          to={all_routes.profilesettings}
                        >
                          <i className="ti ti-circle-arrow-up me-1" />
                          My Account
                        </Link>
                        <Link
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2"
                          to={all_routes.knowledgebase}
                        >
                          <i className="ti ti-question-mark me-1" />
                          Knowledge Base
                        </Link>
                      </div>
                      <div className="card-footer">
                        <Link
                          className="dropdown-item d-inline-flex align-items-center p-0 py-2"
                          to={all_routes.login}
                          onClick={handleLogout}
                        >
                          <i className="ti ti-login me-2" />
                          Logout
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dropdown mobile-user-menu">
            <Link
              to="#"
              className="nav-link dropdown-toggle"
              data-bs-toggle="dropdown"
            >
              <span className="user-img overflow-hidden">
                {user?.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl.startsWith('http') ? user.profilePhotoUrl : `${apiUrl}${user.profilePhotoUrl}`}
                    alt="Img"
                    className="img-fluid rounded-circle"
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                ) : (
                  <ImageWithBasePath
                    src="assets/img/profiles/avatar-12.jpg"
                    alt="Img"
                    className="img-fluid rounded-circle"
                  />
                )}
              </span>
            </Link>
            <div className="dropdown-menu dropdown-menu-end">
              <div className="dropdown-header">
                <div className="d-flex align-items-center">
                  <span className="avatar avatar-sm me-2 overflow-hidden">
                    {user?.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl.startsWith('http') ? user.profilePhotoUrl : `${apiUrl}${user.profilePhotoUrl}`}
                        alt="Img"
                        className="img-fluid rounded-circle"
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                      />
                    ) : (
                      <ImageWithBasePath
                        src="assets/img/profiles/avatar-12.jpg"
                        alt="Img"
                        className="img-fluid rounded-circle"
                      />
                    )}
                  </span>
                  <div>
                    <h6 className="mb-0">{user?.name || "Admin"}</h6>
                    <p className="fs-12 fw-medium mb-0">{user?.email || "admin@example.com"}</p>
                  </div>
                </div>
              </div>
              <Link className="dropdown-item" to={routes.profile}>
                <i className="ti ti-user-circle me-1"></i>My Profile
              </Link>
              <Link className="dropdown-item" to={routes.businessSettings}>
                <i className="ti ti-settings me-1"></i>Settings
              </Link>
              <Link className="dropdown-item" to={routes.securitysettings}>
                <i className="ti ti-status-change me-1"></i>Status
              </Link>
              <Link className="dropdown-item" to={routes.profilesettings}>
                <i className="ti ti-circle-arrow-up me-1"></i>My Account
              </Link>
              <Link className="dropdown-item" to={routes.knowledgebase}>
                <i className="ti ti-question-mark me-1"></i>Knowledge Base
              </Link>
              <Link 
                className="dropdown-item" 
                to={routes.login}
                onClick={handleLogout}
              >
                <i className="ti ti-login me-2"></i>Logout
              </Link>
            </div>
          </div>
        </div>
      </div>
</>
  );
});

// Header Component

Header.displayName = "Header";

export default Header;
