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
  const user = useSelector((state: RootState) => state.auth.user);
  const Location = useLocation();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(logout());
    navigate(all_routes.login);
  };

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
              <ImageWithBasePath src="assets/img/logo.svg" alt="Logo" />
            </Link>
            <Link to={routes.adminDashboard} className="dark-logo">
              <ImageWithBasePath src="assets/img/logo-white.svg" alt="Logo" />
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
            <div className="nav user-menu nav-list">
              <div
                className="me-auto d-flex align-items-center"
                id="header-search"
              >
                <Link id="toggle_btn" to="#" className="btn btn-menubar me-2">
                  <i className="ti ti-arrow-bar-to-left" />
                </Link>
                {/* Search */}
                <div className="input-group input-group-flat d-inline-flex me-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search in HRMS"
                  />
                  <span className="input-group-text">
                    <kbd>CTRL + / </kbd>
                  </span>
                </div>
                {/* /Search */}
                <div className="dropdown crm-dropdown">
                  <Link
                    to="#"
                    className="btn btn-menubar me-2"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-layout-grid" />
                  </Link>
                  <div className="dropdown-menu dropdown-lg dropdown-menu-start">
                    <div className="card mb-0 border-0 shadow-none">
                      <div className="card-header">
                        <h4>CRM</h4>
                      </div>
                      <div className="card-body pb-1">
                        <div className="row">
                          <div className="col-sm-6">
                            <Link
                              to={all_routes.contactList}
                              className="d-flex align-items-center justify-content-between p-2 crm-link mb-3"
                            >
                              <span className="d-flex align-items-center me-3">
                                <i className="ti ti-user-shield text-default me-2" />
                                Contacts
                              </span>
                              <i className="ti ti-arrow-right" />
                            </Link>
                            <Link
                              to={all_routes.dealsGrid}
                              className="d-flex align-items-center justify-content-between p-2 crm-link mb-3"
                            >
                              <span className="d-flex align-items-center me-3">
                                <i className="ti ti-heart-handshake text-default me-2" />
                                Deals
                              </span>
                              <i className="ti ti-arrow-right" />
                            </Link>
                            <Link
                              to={all_routes.pipeline}
                              className="d-flex align-items-center justify-content-between p-2 crm-link mb-3"
                            >
                              <span className="d-flex align-items-center me-3">
                                <i className="ti ti-timeline-event-text text-default me-2" />
                                Pipeline
                              </span>
                              <i className="ti ti-arrow-right" />
                            </Link>
                          </div>
                          <div className="col-sm-6">
                            <Link
                              to={all_routes.companiesGrid}
                              className="d-flex align-items-center justify-content-between p-2 crm-link mb-3"
                            >
                              <span className="d-flex align-items-center me-3">
                                <i className="ti ti-building text-default me-2" />
                                Companies
                              </span>
                              <i className="ti ti-arrow-right" />
                            </Link>
                            <Link
                              to={all_routes.leadsGrid}
                              className="d-flex align-items-center justify-content-between p-2 crm-link mb-3"
                            >
                              <span className="d-flex align-items-center me-3">
                                <i className="ti ti-user-check text-default me-2" />
                                Leads
                              </span>
                              <i className="ti ti-arrow-right" />
                            </Link>
                            <Link
                              to={all_routes.activity}
                              className="d-flex align-items-center justify-content-between p-2 crm-link mb-3"
                            >
                              <span className="d-flex align-items-center me-3">
                                <i className="ti ti-activity text-default me-2" />
                                Activities
                              </span>
                              <i className="ti ti-arrow-right" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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

Header.displayName = "Header";

export default Header;
