import React, { useState, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TowColData } from '../../data/json/twoColData'
import { all_routes } from '../../../router/all_routes';
import { useAppSelector } from '../../data/redux/store';
import apiClient from "../../../core/utils/apiClient";
import { APP_CONFIG } from "../../../environment";

const StackedSidebar = () => {
    const user = useAppSelector((state) => state.auth.user) as any;
    const role = user?.role || 'EMPLOYEE';
    const routes = all_routes
    const Location = useLocation();
    const [showSubMenusTab, SetShowSubMenusTab] = useState(false);
    const [subOpen, setSubopen] = useState<any>("");
    const [companyLogo, setCompanyLogo] = useState<string | null>(user?.companyLogoUrl || null);
    const [companyIcon, setCompanyIcon] = useState<string | null>(user?.companyIconUrl || null);

    const getLogoSrc = (logoPath: string | null | undefined) => {
        if (!logoPath) return "";
        if (logoPath.startsWith("http://") || logoPath.startsWith("https://") || logoPath.startsWith("blob:")) {
            return logoPath;
        }
        const base = (apiClient.defaults.baseURL || APP_CONFIG.getBackendUrl()).replace(/\/+$/, "");
        const cleanPath = logoPath.startsWith("/") ? logoPath : `/${logoPath}`;
        return `${base}${cleanPath}`;
    };

    useEffect(() => {
        if (user?.companyLogoUrl) {
            setCompanyLogo(user.companyLogoUrl);
        }
        if (user?.companyIconUrl) {
            setCompanyIcon(user.companyIconUrl);
        }
    }, [user?.companyLogoUrl, user?.companyIconUrl]);

    useEffect(() => {
        const handleLogoUpdate = (event: any) => {
            const newLogo = event?.detail;
            if (newLogo) setCompanyLogo(newLogo);
        };
        const handleIconUpdate = (event: any) => {
            const newIcon = event?.detail;
            if (newIcon) setCompanyIcon(newIcon);
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
                }
            } catch (err) {
                // Ignore fallback
            }
        };
        fetchLogo();
    }, [user?.subdomain]);

    const smallLogoSrc =
        getLogoSrc(companyIcon || user?.companyIconUrl) ||
        getLogoSrc(companyLogo || user?.companyLogoUrl) ||
        "/assets/img/favicon.jfif";

    const getProfilePhotoSrc = useCallback((photoUrl: string | null | undefined) => {
        if (!photoUrl) return "/assets/img/profiles/avatar-12.jpg";
        if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://") || photoUrl.startsWith("blob:")) {
            return photoUrl;
        }
        const base = (apiClient.defaults.baseURL || APP_CONFIG.getBackendUrl()).replace(/\/+$/, "");
        const cleanPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;
        return `${base}${cleanPath}`;
    }, []);

    const formatUserRole = useCallback((userRole?: string, designation?: string) => {
        if (designation) return designation;
        if (!userRole) return "Employee";
        switch (userRole.toUpperCase()) {
            case "SUPER_ADMIN": return "Super Admin";
            case "COMPANY_ADMIN": return "Company Admin";
            case "HR": return "HR Manager";
            case "MANAGER": return "Manager";
            case "EMPLOYEE": return "Employee";
            default: return userRole.replace(/_/g, " ");
        }
    }, []);

    const showTabs = (res:any) => {
        TowColData.forEach((menus:any)=>{
            menus.menu.forEach((mainMenus:any) => {
                if (res.menuValue === mainMenus.menuValue) {
                    mainMenus.showMyTab = true;
                  } else {
                    mainMenus.showMyTab = false;
                  }
            })
        })
    }

    const toggleSidebar = (title: any) => {
        localStorage.setItem("menuOpened", title);
        if (title === subOpen) {
          setSubopen("");
        } else {
          setSubopen(title);
        }
      };
  return (
    <div className="stacked-sidebar" id="stacked-sidebar">
        <div className="sidebar sidebar-stacked" style={{display: 'flex' }}>
            <div className="stacked-mini">
                <Link to={routes.adminDashboard} className="logo-small d-flex align-items-center justify-content-center p-2 mb-3" title="Dashboard">
                    <img
                        src={smallLogoSrc}
                        alt="Company Logo"
                        style={{ maxHeight: "32px", maxWidth: "32px", objectFit: "contain", borderRadius: "6px" }}
                        onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (!img.src.includes("favicon.jfif")) {
                                img.src = "/assets/img/favicon.jfif";
                            } else if (!img.src.includes("favicon.png")) {
                                img.src = "/assets/img/favicon.png";
                            }
                        }}
                    />
                </Link>
                <div className="sidebar-left slimscroll">
                    <div className="d-flex align-items-center flex-column">
                        <div className="mb-1 notification-item">
                            <Link to={routes.activity} className="btn btn-menubar position-relative">
                                <i className="ti ti-bell"></i>
                                <span className="notification-status-dot"></span>
                            </Link>
                        </div>
                        <div className="mb-1">
                            <Link to="#" className="btn btn-menubar btnFullscreen">
                                <i className="ti ti-maximize"></i>
                            </Link>
                        </div>
                        <div className="mb-1">
                            <Link to="#" className="btn btn-menubar position-relative">
                                <i className="ti ti-shopping-bag"></i>
                                <span
                                    className="badge bg-success rounded-pill d-flex align-items-center justify-content-center header-badge">5</span>
                            </Link>
                        </div>
                        <div className="mb-1">
                            <Link to={routes.calendar} className="btn btn-menubar">
                                <i className="ti ti-layout-grid-remove"></i>
                            </Link>
                        </div>
                        <div className="mb-1">
                            <Link to={routes.chat} className="btn btn-menubar position-relative">
                                <i className="ti ti-brand-hipchat"></i>
                                <span className="badge bg-info rounded-pill d-flex align-items-center justify-content-center header-badge">5</span>
                            </Link>
                        </div>
                        <div className="mb-1">
                            <Link to={routes.email} className="btn btn-menubar">
                                <i className="ti ti-mail"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className="sidebar-right d-flex justify-content-between flex-column">
                <div className="sidebar-scroll">
                    <Link
                        to={routes.profile}
                        className="twocol-user-profile text-center d-block text-decoration-none mb-3"
                        title="View Profile"
                    >
                        <div className="position-relative d-inline-block mb-2">
                            <img
                                src={getProfilePhotoSrc(user?.profilePhotoUrl)}
                                alt={user?.name || "User"}
                                className="twocol-avatar-img rounded-circle shadow-sm"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/assets/img/profiles/avatar-12.jpg";
                                }}
                            />
                            <span className="twocol-avatar-status position-absolute rounded-circle" />
                        </div>
                        <h6 className="fs-15 fw-bold mb-1 text-truncate twocol-user-name">
                            {user?.name || "Admin"}
                        </h6>
                        <div className="d-flex justify-content-center">
                            <span className="badge text-truncate twocol-user-role">
                                {user?.companyRoleName || formatUserRole(user?.role)}
                            </span>
                        </div>
                    </Link>
                    <div className="stack-menu">
                        <div className="nav flex-column align-items-center nav-pills" role="tablist"
                            aria-orientation="vertical">
                            <div className="row g-2">
                            {TowColData.filter((mainMenu: any) => { 
                                const t = (mainMenu.tittle || "").toLowerCase(); 
                                return t !== "authentication" && t !== "crm" && t !== "pages" && t !== "ui interface" && t !== "content"; 
                            }).map((mainMenu, index) => (
                                <React.Fragment key={`main-${index}`}>
                                {mainMenu.menu.filter((title: any) => {
                                    const valLower = (title.menuValue || "").toLowerCase();
                                    if (valLower === "authentication" && title.base !== "authentication-settings") {
                                        return false;
                                    }
                                    if (valLower === "crm" || title.base === "crm") {
                                        return false;
                                    }
                                    const normRole = (role || "").toUpperCase();
                                    if (normRole !== "SUPER_ADMIN" && (title.menuValue === "Super Admin" || (title.menuValue || "").toLowerCase().includes("super admin"))) {
                                        return false;
                                    }
                                    if (normRole === "COMPANY_ADMIN" && (title.menuValue === "AI Center" || (title.menuValue || "").toLowerCase().includes("ai center"))) {
                                        return false;
                                    }
                                    return true;
                                }).map((title,i)=>(
                                    <div className="col-6" key={`col-${index}-${i}`}>
                                    <Link to="#" role="tab" onClick={()=>{showTabs(title);SetShowSubMenusTab(!showSubMenusTab)}} className={`nav-link ${
                                title?.subMenus
                                    ?.map((link: any) => link?.route)
                                    .includes(Location.pathname) 
                                    ? "active"
                                    : ""
                                }`} title={title.menuValue} aria-selected="true">
                                        <span><i className={`ti ti-${title.icon}`}></i></span>
                                        <p>{title.menuValue}</p>
                                    </Link>
                                </div>
                                )
                                )}
                                
                                </React.Fragment>
                            ))}
                               
                            </div>
                        </div>
                        <div className="tab-content">
                            <div className={`tab-pane ${showSubMenusTab ? 'd-block':'d-none'}`} id="menu-dashboard">
                                <ul className="stack-submenu">
                                {TowColData.filter((mainMenu: any) => { 
                                    const t = (mainMenu.tittle || "").toLowerCase(); 
                                    return t !== "authentication" && t !== "crm" && t !== "pages" && t !== "ui interface" && t !== "content"; 
                                }).map((mainMenu, index) => (
                                    <React.Fragment key={`main-${index}`}>
                                        {mainMenu.menu.filter((title: any) => {
                                            const valLower = (title.menuValue || "").toLowerCase();
                                            if (valLower === "authentication" && title.base !== "authentication-settings") {
                                                return false;
                                            }
                                            if (valLower === "crm" || title.base === "crm") {
                                                return false;
                                            }
                                            const normRole = (role || "").toUpperCase();
                                            if (normRole !== "SUPER_ADMIN" && (title.menuValue === "Super Admin" || (title.menuValue || "").toLowerCase().includes("super admin"))) {
                                                return false;
                                            }
                                            if (normRole === "COMPANY_ADMIN" && (title.menuValue === "AI Center" || (title.menuValue || "").toLowerCase().includes("ai center"))) {
                                                return false;
                                            }
                                            return true;
                                        }).map((title: any, i: number) => (
                                        <React.Fragment key={`title-${index}-${i}`}>
                                            {title.showMyTab === true && (
                                            <>
                                            
                                                {title.subMenus.filter((s: any) => {
                                                    const sLower = (s.menuValue || "").toLowerCase();
                                                    if (
                                                        sLower === "deals dashboard" ||
                                                        sLower === "leads dashboard" ||
                                                        (s.route && (s.route.includes("deals-dashboard") || s.route.includes("leads-dashboard")))
                                                    ) {
                                                        return false;
                                                    }
                                                    const normRole = (role || "").toUpperCase();
                                                    if (normRole === "EMPLOYEE" && title.menuValue === "Dashboard") {
                                                        return s.menuValue === "Employee Dashboard";
                                                    }
                                                    if (normRole === "COMPANY_ADMIN" && title.menuValue === "Dashboard") {
                                                        return s.menuValue === "Admin Dashboard";
                                                    }
                                                    return true;
                                                }).map((subMenus: any, j: number) => (
                                                <React.Fragment key={`submenu-${index}-${i}-${j}`}>
                                                    {title.hasSubRoute && (
                                                    <li>
                                                        <Link
                                                        className={
                                                            subMenus.route === Location.pathname ? "active" : ""
                                                        }
                                                        to={subMenus.route}
                                                        >
                                                        {subMenus.menuValue}
                                                        </Link>
                                                    </li>
                                                    )}
                                                    {title.hasSubRouteTwo && (
                                                    <>
                                                        {subMenus.customSubmenuTwo ? (
                                                        <li className="submenu">
                                                            <Link
                                                            to="#"
                                                            className={`${
                                                                subMenus?.subMenus
                                                                ?.map((link: any) => link?.route)
                                                                .includes(Location.pathname)
                                                                ? "active"
                                                                : ""
                                                            } ${
                                                                subOpen === subMenus.menuValue ? "subdrop" : ""
                                                            }`}
                                                            onClick={() => toggleSidebar(subMenus.menuValue)}
                                                            >
                                                            <span>{subMenus.menuValue}</span>
                                                            <span className="menu-arrow"></span>
                                                            </Link>
                                                            <ul
                                                            style={{
                                                                display:
                                                                subOpen === subMenus.menuValue ? "block" : "none",
                                                            }}
                                                            >
                                                            {subMenus.subMenusTwo.map(
                                                                (subMenuTwo: any, k: number) => (
                                                                <li key={`submenu-two-${index}-${i}-${j}-${k}`}>
                                                                    <Link
                                                                    className={
                                                                        subMenuTwo.route === Location.pathname
                                                                        ? "active"
                                                                        : ""
                                                                    }
                                                                    to={subMenuTwo.route}
                                                                    >
                                                                    {subMenuTwo.menuValue}
                                                                    </Link>
                                                                </li>
                                                                )
                                                            )}
                                                            </ul>
                                                        </li>
                                                        ) : (
                                                        <li key={`submenu-link-${index}-${i}-${j}`}>
                                                            <Link
                                                            to={subMenus.route}
                                                            className={
                                                                subMenus.route === Location.pathname ? "active" : ""
                                                            }
                                                            >
                                                            {subMenus.menuValue}
                                                            </Link>
                                                        </li>
                                                        )}
                                                    </>
                                                    )}
                                                </React.Fragment>
                                                ))}
                                            </>
                                            )}
                                        </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                    ))}

                                    
                                    
                                    
                                </ul>
                            </div>
                            
                        </div>
                    </div>
                </div>
                <div className="p-3">
                    <Link to="#" className="d-flex align-items-center fs-12 mb-3">Documentation</Link>
                    <Link to="#" className="d-flex align-items-center fs-12">Change Log<span
                            className="badge bg-pink badge-xs text-white fs-10 ms-2">v4.0.2</span></Link>
                </div>
            </div>
        </div>
    </div>
  )
}

export default StackedSidebar