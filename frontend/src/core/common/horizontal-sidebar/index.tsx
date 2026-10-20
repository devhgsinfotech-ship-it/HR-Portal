import React, { useState, useCallback, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HorizontalSidebarData } from "../../data/json/horizontalSidebar";
import ImageWithBasePath from "../imageWithBasePath";
import { useAppSelector } from "../../data/redux/store";

// Types for menu items
interface SubMenuThree {
  menuValue: string;
  route: string;
}

interface SubMenuTwo {
  menuValue: string;
  route?: string;
  customSubmenuTwo?: boolean;
  customSubmenuThree?: boolean;
  subMenusTwo?: SubMenuThree[];
  subMenusThree?: SubMenuThree[];
}

interface SubMenu {
  menuValue: string;
  route?: string;
  base?: string;
  customSubmenuTwo?: boolean;
  subMenusTwo?: SubMenuTwo[];
}

interface MenuItem {
  menuValue: string;
  hasSubRoute?: boolean;
  showSubRoute?: boolean;
  icon?: string;
  base?: string;
  subMenus?: SubMenu[];
}

interface MenuGroup {
  title: string;
  showAsTab: boolean;
  separateRoute: boolean;
  menu: MenuItem[];
}

// Helper: Recursively get all routes from a menu structure
const getAllRoutes = (item: SubMenu | SubMenuTwo | SubMenuThree): string[] => {
  const routes: string[] = [];
  if ("route" in item && item.route) {
    routes.push(item.route);
  }
  if ("subMenusTwo" in item && item.subMenusTwo) {
    item.subMenusTwo.forEach((sub) => {
      routes.push(...getAllRoutes(sub));
    });
  }
  if ("subMenusThree" in item && item.subMenusThree) {
    item.subMenusThree.forEach((sub) => {
      routes.push(...getAllRoutes(sub));
    });
  }
  return routes;
};

const HorizontalSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const user = useAppSelector((state) => state.auth.user) as any;
  const currentRole = user?.role || "EMPLOYEE";

  // State for open menus at different levels
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());
  const [openSubMenusTwo, setOpenSubMenusTwo] = useState<Set<string>>(
    new Set()
  );
  const [openSubMenusThree, setOpenSubMenusThree] = useState<Set<string>>(
    new Set()
  );

  const closeAllMenus = useCallback(() => {
    setOpenMenus(new Set());
    setOpenSubMenus(new Set());
    setOpenSubMenusTwo(new Set());
    setOpenSubMenusThree(new Set());
  }, []);

  // Close menus on route change
  useEffect(() => {
    closeAllMenus();
  }, [currentPath, closeAllMenus]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const nav = document.getElementById("horizontal-menu");
      if (nav && !nav.contains(e.target as Node)) {
        closeAllMenus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeAllMenus]);

  // Toggle functions (click opens selected and closes siblings at same level)
  const toggleMenu = useCallback((menuValue: string) => {
    setOpenMenus((prev) => {
      const newSet = new Set<string>();
      if (!prev.has(menuValue)) {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const toggleSubMenu = useCallback((menuValue: string) => {
    setOpenSubMenus((prev) => {
      const newSet = new Set<string>();
      if (!prev.has(menuValue)) {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const toggleSubMenuTwo = useCallback((menuValue: string) => {
    setOpenSubMenusTwo((prev) => {
      const newSet = new Set<string>();
      if (!prev.has(menuValue)) {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  const toggleSubMenuThree = useCallback((menuValue: string) => {
    setOpenSubMenusThree((prev) => {
      const newSet = new Set<string>();
      if (!prev.has(menuValue)) {
        newSet.add(menuValue);
      }
      return newSet;
    });
  }, []);

  // Check if menu is active
  const isMenuActive = useCallback(
    (menuItem: MenuItem): boolean => {
      const routes =
        menuItem.subMenus?.flatMap((sub) => getAllRoutes(sub)) || [];
      return routes.includes(currentPath);
    },
    [currentPath]
  );

  // Check if submenu is active
  const isSubMenuActive = useCallback(
    (subItem: SubMenu | SubMenuTwo): boolean => {
      if ("route" in subItem && subItem.route === currentPath) return true;
      const routes = getAllRoutes(subItem);
      return routes.includes(currentPath);
    },
    [currentPath]
  );

  return (
    <div className="sidebar sidebar-horizontal" id="horizontal-menu">
      <div className="sidebar-menu">
        <div className="main-menu">
          <ul className="nav-menu">
            {(HorizontalSidebarData as MenuGroup[])?.map((group, groupIdx) =>
              group.menu?.filter((menuItem) => {
                const valLower = (menuItem.menuValue || "").toLowerCase();
                const baseLower = (menuItem.base || "").toLowerCase();
                if (valLower === "authentication" && baseLower !== "authentication-settings") {
                  return false;
                }
                if (valLower === "crm" || baseLower === "crm") {
                  return false;
                }
                const normRole = (currentRole || "").toUpperCase();
                if (normRole !== "SUPER_ADMIN") {
                  if (valLower === "super admin" || baseLower === "super-admin" || baseLower.includes("super-admin")) {
                    return false;
                  }
                }
                if (normRole === "COMPANY_ADMIN") {
                  if (valLower === "ai center" || valLower.includes("ai center") || baseLower.includes("ai-center")) {
                    return false;
                  }
                }
                return true;
              }).map((menuItem, i) => {
                const hasSubmenu =
                  menuItem.subMenus && menuItem.subMenus.length > 0;
                const isOpen = openMenus.has(menuItem.menuValue);
                const isActive = isMenuActive(menuItem);

                return (
                  <li className={hasSubmenu ? "submenu" : ""} key={`menu-${groupIdx}-${i}`}>
                    <Link
                      to={hasSubmenu ? "#" : menuItem.route || "#"}
                      onClick={(e) => {
                        if (hasSubmenu) {
                          e.preventDefault();
                          toggleMenu(menuItem.menuValue);
                        } else {
                          closeAllMenus();
                        }
                      }}
                      className={`${isActive ? "active" : ""} ${
                        isOpen ? "subdrop" : ""
                      }`}
                    >
                      {menuItem.icon && (
                        <i className={`ti ti-${menuItem.icon}`}></i>
                      )}
                      <span>{menuItem.menuValue}</span>
                      {hasSubmenu && <span className="menu-arrow"></span>}
                    </Link>

                    {/* Level 1 Submenu */}
                    {hasSubmenu && (
                      <ul style={{ display: isOpen ? "block" : "none" }}>
                        {menuItem.subMenus?.filter(subItem => {
                          const subValLower = (subItem.menuValue || "").toLowerCase();
                          const authSubmenuList = [
                            "login", "register", "forgot password", "reset password",
                            "email verification", "2 step verification"
                          ];
                          if (authSubmenuList.includes(subValLower)) {
                            return false;
                          }
                          if (subValLower === "crm" || subItem.base === "crm") {
                            return false;
                          }
                          if (
                            subValLower === "deals dashboard" ||
                            subValLower === "leads dashboard" ||
                            (subItem.route && (subItem.route.includes("deals-dashboard") || subItem.route.includes("leads-dashboard")))
                          ) {
                            return false;
                          }
                          const normRole = (currentRole || "").toUpperCase();
                          if (normRole === "EMPLOYEE" && menuItem.menuValue === "Dashboard") {
                            return subItem.menuValue === "Employee Dashboard";
                          }
                          if (normRole === "COMPANY_ADMIN" && menuItem.menuValue === "Dashboard") {
                            return subItem.menuValue === "Admin Dashboard";
                          }
                          if (normRole === "COMPANY_ADMIN" || normRole === "SUPER_ADMIN") {
                            if (
                              subValLower === "my attendance" ||
                              subItem.base === "attendance-employee" ||
                              (subItem.route && subItem.route.includes("attendance-employee"))
                            ) {
                              return false;
                            }
                          }
                          return true;
                        }).map((subItem, j) => {
                          const hasSubTwo =
                            subItem.customSubmenuTwo &&
                            subItem.subMenusTwo &&
                            subItem.subMenusTwo.length > 0;
                          const isSubOpen = openSubMenus.has(subItem.menuValue);
                          const isSubActive = isSubMenuActive(subItem);

                          return (
                            <li
                              className={hasSubTwo ? "submenu submenu-two" : ""}
                              key={`sub-${groupIdx}-${i}-${j}`}
                            >
                              <Link
                                to={hasSubTwo ? "#" : subItem.route || "#"}
                                onClick={(e) => {
                                  if (hasSubTwo) {
                                    e.preventDefault();
                                    toggleSubMenu(subItem.menuValue);
                                  } else {
                                    closeAllMenus();
                                  }
                                }}
                                className={`${isSubActive ? "active" : ""} ${
                                  isSubOpen ? "subdrop" : ""
                                }`}
                              >
                                {subItem.menuValue}
                                {hasSubTwo && (
                                  <span className="menu-arrow inside-submenu"></span>
                                )}
                              </Link>

                              {/* Level 2 Submenu */}
                              {hasSubTwo && (
                                <ul
                                  style={{
                                    display: isSubOpen ? "block" : "none",
                                  }}
                                >
                                  {subItem.subMenusTwo?.map((subTwo, k) => {
                                    const hasSubThree =
                                      (subTwo.customSubmenuTwo ||
                                        subTwo.customSubmenuThree) &&
                                      (subTwo.subMenusTwo ||
                                        subTwo.subMenusThree) &&
                                      ((subTwo.subMenusTwo &&
                                        subTwo.subMenusTwo.length > 0) ||
                                        (subTwo.subMenusThree &&
                                          subTwo.subMenusThree.length > 0));
                                    const isSubTwoOpen = openSubMenusTwo.has(
                                      subTwo.menuValue
                                    );
                                    const isSubTwoActive =
                                      isSubMenuActive(subTwo);

                                    return (
                                      <li
                                        className={hasSubThree ? "submenu" : ""}
                                        key={`sub-two-${groupIdx}-${i}-${j}-${k}`}
                                      >
                                        <Link
                                          to={
                                            hasSubThree
                                              ? "#"
                                              : subTwo.route || "#"
                                          }
                                          onClick={(e) => {
                                            if (hasSubThree) {
                                              e.preventDefault();
                                              toggleSubMenuTwo(
                                                subTwo.menuValue
                                              );
                                            } else {
                                              closeAllMenus();
                                            }
                                          }}
                                          className={`${
                                            isSubTwoActive ? "active" : ""
                                          } ${isSubTwoOpen ? "subdrop" : ""}`}
                                        >
                                          {subTwo.menuValue}
                                          {hasSubThree && (
                                            <span className="menu-arrow"></span>
                                          )}
                                        </Link>

                                        {/* Level 3 Submenu */}
                                        {hasSubThree && (
                                          <ul
                                            style={{
                                              display: isSubTwoOpen
                                                ? "block"
                                                : "none",
                                            }}
                                          >
                                            {(
                                              subTwo.subMenusTwo ||
                                              subTwo.subMenusThree
                                            )?.map((subThree, l) => {
                                              const hasSubFour =
                                                "subMenusTwo" in subThree ||
                                                "subMenusThree" in subThree;
                                              const isSubThreeOpen =
                                                openSubMenusThree.has(
                                                  subThree.menuValue
                                                );

                                              if (hasSubFour) {
                                                return (
                                                  <li
                                                    className="submenu submenu-two submenu-three"
                                                    key={`sub-three-${groupIdx}-${i}-${j}-${k}-${l}`}
                                                  >
                                                    <Link
                                                      to="#"
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleSubMenuThree(
                                                          subThree.menuValue
                                                        );
                                                      }}
                                                      className={
                                                        isSubThreeOpen
                                                          ? "subdrop"
                                                          : ""
                                                      }
                                                    >
                                                      {subThree.menuValue}
                                                      <span className="menu-arrow inside-submenu inside-submenu-two"></span>
                                                    </Link>
                                                    <ul
                                                      style={{
                                                        display: isSubThreeOpen
                                                          ? "block"
                                                          : "none",
                                                      }}
                                                    >
                                                      {(
                                                        (subThree as SubMenuTwo)
                                                          .subMenusTwo ||
                                                        (subThree as SubMenuTwo)
                                                          .subMenusThree
                                                      )?.map((subFour, m) => (
                                                        <li
                                                          key={`sub-four-${groupIdx}-${i}-${j}-${k}-${l}-${m}`}
                                                        >
                                                          <Link
                                                            to={
                                                              subFour.route ||
                                                              "#"
                                                            }
                                                            onClick={() => closeAllMenus()}
                                                            className={
                                                              subFour.route ===
                                                              currentPath
                                                                ? "active"
                                                                : ""
                                                            }
                                                          >
                                                            {subFour.menuValue}
                                                          </Link>
                                                        </li>
                                                      ))}
                                                    </ul>
                                                  </li>
                                                );
                                              }

                                              return (
                                                <li key={`sub-three-link-${groupIdx}-${i}-${j}-${k}-${l}`}>
                                                  <Link
                                                    to={subThree.route || "#"}
                                                    onClick={() => closeAllMenus()}
                                                    className={
                                                      subThree.route ===
                                                      currentPath
                                                        ? "active"
                                                        : ""
                                                    }
                                                  >
                                                    {subThree.menuValue}
                                                  </Link>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HorizontalSidebar;
