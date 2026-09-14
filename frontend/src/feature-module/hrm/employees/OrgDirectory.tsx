import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../../core/utils/apiClient";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import CommonSelect from "../../../core/common/commonSelect";

// Helper function to extract State and Country per user rules:
// "if state not available then country on should comes and country not availbe than state come. If both than both come with comma separted."
const formatStateCountry = (emp: any) => {
    let state = (emp.state || emp.raw?.state || '').trim();
    let country = (emp.country || emp.raw?.country || '').trim();
    let city = (emp.city || emp.raw?.city || '').trim();

    // Helper to filter out street addresses / house numbers
    const isStreetAddress = (str: string) => {
        if (!str) return false;
        const s = str.toLowerCase();
        return /\d+/.test(s) || s.includes('..') || s.includes('ghatii') || s.includes('street') || s.includes('road') || s.includes('vägen') || s.includes('apt') || s.includes('flat') || s.includes('house');
    };

    // If state is not provided, use city if it's a valid city/state name (not a street address)
    if (!state && city && !isStreetAddress(city)) {
        state = city;
    }

    // Apply User Logic Rules:
    // 1. Both State and Country -> "State, Country"
    // 2. Country only -> "Country"
    // 3. State only -> "State"
    // 4. Neither -> "N/A" (never street address)
    if (state && country) {
        if (state.toLowerCase() === country.toLowerCase()) return country;
        return `${state}, ${country}`;
    }
    if (country) return country;
    if (state) return state;

    return 'N/A';
};

const OrgDirectory = () => {
    const [dbEmployees, setDbEmployees] = useState<any[]>([]);
    const [dbDepartments, setDbDepartments] = useState<any[]>([]);
    const [dbDesignations, setDbDesignations] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Filter States
    const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('All');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
    const [selectedLocation, setSelectedLocation] = useState<string>('All');
    const [selectedCostCenter, setSelectedCostCenter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Fetch Dynamic API Data from Backend Database
    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, deptRes, desigRes] = await Promise.allSettled([
                apiClient.get('/employees'),
                apiClient.get('/departments'),
                apiClient.get('/designations')
            ]);

            if (empRes.status === 'fulfilled' && empRes.value.data) {
                setDbEmployees(Array.isArray(empRes.value.data) ? empRes.value.data : []);
            } else {
                setDbEmployees([]);
            }

            if (deptRes.status === 'fulfilled' && deptRes.value.data) {
                setDbDepartments(Array.isArray(deptRes.value.data) ? deptRes.value.data : []);
            }
            if (desigRes.status === 'fulfilled' && desigRes.value.data) {
                setDbDesignations(Array.isArray(desigRes.value.data) ? desigRes.value.data : []);
            }
        } catch (err) {
            console.error('Error fetching org directory:', err);
            setDbEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getAvatarUrl = (photoUrl: string | null | undefined) => {
        if (!photoUrl) return null;
        if (photoUrl.startsWith('http')) return photoUrl;
        const apiBase = apiClient.defaults.baseURL || '';
        return `${apiBase}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
    };

    // 1. Dynamic Business Unit Options from Database
    const businessUnitOptions = useMemo(() => {
        const units = new Set<string>();
        dbEmployees.forEach(emp => {
            const deptName = emp.department?.name || emp.departmentName || '';
            if (deptName) {
                const mainUnit = deptName.split('>')[0].trim();
                if (mainUnit) units.add(mainUnit);
            }
        });
        const opts = Array.from(units).map(u => ({ value: u, label: u }));
        return [{ value: 'All', label: 'All Business Units' }, ...opts];
    }, [dbEmployees]);

    // 2. Dynamic Department Options from Database
    const departmentOptions = useMemo(() => {
        const depts = new Set<string>();
        dbEmployees.forEach(emp => {
            const name = emp.department?.name || emp.departmentName || '';
            if (name) depts.add(name);
        });
        dbDepartments.forEach(d => {
            if (d.name) depts.add(d.name);
        });
        const opts = Array.from(depts).map(d => ({ value: d, label: d }));
        return [{ value: 'All', label: 'All Departments' }, ...opts];
    }, [dbEmployees, dbDepartments]);

    // 3. Dynamic Location Options (Strictly State / Country)
    const locationOptions = useMemo(() => {
        const locs = new Set<string>();
        dbEmployees.forEach(emp => {
            const formatted = formatStateCountry(emp);
            if (formatted && formatted !== 'N/A') {
                locs.add(formatted);
            }
        });
        const opts = Array.from(locs).map(l => ({ value: l, label: l }));
        return [{ value: 'All', label: 'All Locations' }, ...opts];
    }, [dbEmployees]);

    // 4. Dynamic Cost Center / Employee ID Options from Database
    const costCenterOptions = useMemo(() => {
        const codes = new Set<string>();
        dbEmployees.forEach(emp => {
            const code = emp.employeeCode || emp.employeeId || emp.costCenter;
            if (code && String(code).trim() !== '') {
                codes.add(String(code).trim());
            }
        });
        const opts = Array.from(codes).map(c => ({ value: c, label: c }));
        return [{ value: 'All', label: 'All Employee IDs' }, ...opts];
    }, [dbEmployees]);

    // Dynamic Reactive Filter Across All Employee Fields
    const filteredEmployees = useMemo(() => {
        return dbEmployees.filter(emp => {
            const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.user?.name || '';
            const desig = emp.designation?.name || emp.companyRole?.name || emp.designationName || '';
            const dept = emp.department?.name || emp.departmentName || '';
            const loc = formatStateCountry(emp);
            const email = emp.user?.email || emp.email || '';
            const phone = emp.phone || emp.mobile || '';
            const empCode = String(emp.employeeCode || emp.employeeId || emp.costCenter || '');

            // 1. Business Unit Filter
            if (selectedBusinessUnit !== 'All' && !dept.toLowerCase().includes(selectedBusinessUnit.toLowerCase())) {
                return false;
            }
            // 2. Department Filter
            if (selectedDepartment !== 'All' && !dept.toLowerCase().includes(selectedDepartment.toLowerCase())) {
                return false;
            }
            // 3. Location Filter (Matches formatted State/Country)
            if (selectedLocation !== 'All' && loc.toLowerCase() !== selectedLocation.toLowerCase()) {
                return false;
            }
            // 4. Employee ID / Cost Center Filter
            if (selectedCostCenter !== 'All' && !empCode.toLowerCase().includes(selectedCostCenter.toLowerCase())) {
                return false;
            }
            // 5. Global Search Bar Query
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase().trim();
                const matches = fullName.toLowerCase().includes(q) || 
                                desig.toLowerCase().includes(q) || 
                                dept.toLowerCase().includes(q) || 
                                loc.toLowerCase().includes(q) || 
                                email.toLowerCase().includes(q) || 
                                phone.toLowerCase().includes(q) ||
                                empCode.toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [dbEmployees, selectedBusinessUnit, selectedDepartment, selectedLocation, selectedCostCenter, searchQuery]);

    return (
        <div className="page-wrapper">
            <div className="content">
                {/* Header Title Bar */}
                <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                    <div className="my-auto mb-2">
                        <h2 className="mb-1 text-dark fw-bold">Org Directory</h2>
                        <nav>
                            <ol className="breadcrumb mb-0">
                                <li className="breadcrumb-item">
                                    <Link to="/employee-dashboard">
                                        <i className="ti ti-smart-home me-1" /> Dashboard
                                    </Link>
                                </li>
                                <li className="breadcrumb-item">Org</li>
                                <li className="breadcrumb-item active" aria-current="page">Employee Directory</li>
                            </ol>
                        </nav>
                    </div>
                    <div className="head-icons ms-2">
                        <CollapseHeader />
                    </div>
                </div>

                {/* Header Navigation Tabs */}
                <div className="card border-0 shadow-xs mb-3 bg-white rounded-3">
                    <div className="card-body p-2 border-bottom">
                        <div className="d-flex align-items-center gap-4 text-uppercase fs-12 fw-bold text-secondary">
                            <span className="text-primary border-bottom border-2 border-primary pb-2 cursor-pointer">EMPLOYEES</span>
                            <span className="text-muted cursor-pointer">DOCUMENTS</span>
                            <span className="text-muted cursor-pointer">ENGAGE</span>
                        </div>
                    </div>
                    
                    {/* Sub-Tabs Bar */}
                    <div className="card-body py-2 px-3 bg-light d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <button className="btn btn-sm btn-white border shadow-xs fw-semibold text-primary">Employee Directory</button>
                            <button className="btn btn-sm btn-link text-decoration-none text-muted fw-medium">Organization Tree</button>
                        </div>
                        <div className="fs-12 text-muted fw-medium">
                            Showing <strong className="text-dark">{filteredEmployees.length}</strong> of {dbEmployees.length} Employees
                        </div>
                    </div>

                    {/* Dynamic Multi-Filter Bar */}
                    <div className="card-body p-3 bg-white">
                        <div className="row g-2 align-items-center">
                            <div className="col-md-2">
                                <label className="fs-11 text-muted mb-1 fw-bold text-uppercase">Business Unit</label>
                                <CommonSelect
                                    className="select"
                                    options={businessUnitOptions}
                                    defaultValue={{ value: 'All', label: 'All Business Units' }}
                                    onChange={(opt: any) => setSelectedBusinessUnit(opt ? opt.value : 'All')}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="fs-11 text-muted mb-1 fw-bold text-uppercase">Department</label>
                                <CommonSelect
                                    className="select"
                                    options={departmentOptions}
                                    defaultValue={{ value: 'All', label: 'All Departments' }}
                                    onChange={(opt: any) => setSelectedDepartment(opt ? opt.value : 'All')}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="fs-11 text-muted mb-1 fw-bold text-uppercase">Location</label>
                                <CommonSelect
                                    className="select"
                                    options={locationOptions}
                                    defaultValue={{ value: 'All', label: 'All Locations' }}
                                    onChange={(opt: any) => setSelectedLocation(opt ? opt.value : 'All')}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="fs-11 text-muted mb-1 fw-bold text-uppercase">Employee ID</label>
                                <CommonSelect
                                    className="select"
                                    options={costCenterOptions}
                                    defaultValue={{ value: 'All', label: 'All Employee IDs' }}
                                    onChange={(opt: any) => setSelectedCostCenter(opt ? opt.value : 'All')}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="fs-11 text-muted mb-1 fw-bold text-uppercase">Search</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <i className="ti ti-search text-muted" />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-0"
                                        placeholder="Search by Name, Position, Dept, Location, Email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchQuery('')}>
                                            <i className="ti ti-x" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Read-Only Horizontal Employee Cards Grid (100% Dynamic from DB) */}
                <div className="row">
                    {loading ? (
                        <div className="col-12 text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="col-12 text-center py-5">
                            <h5 className="text-muted">No employees found in database</h5>
                        </div>
                    ) : (
                        filteredEmployees.map((emp) => {
                            const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.user?.name || emp.name || 'N/A';
                            const desigName = emp.designation?.name || emp.companyRole?.name || emp.designationName || 'N/A';
                            const deptName = emp.department?.name || emp.departmentName || 'N/A';
                            const locName = formatStateCountry(emp);
                            const emailAddr = emp.user?.email || emp.email || 'N/A';
                            const phoneNum = emp.phone || emp.mobile || 'N/A';
                            const empCode = emp.employeeCode || emp.employeeId || '---';

                            return (
                                <div className="col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-3" key={emp.id}>
                                    <div className="card h-100 border shadow-xs rounded-3 p-3 bg-white me-0">
                                        <div className="d-flex align-items-center">
                                            {/* Left: Avatar Photo */}
                                            <div className="flex-shrink-0 me-3">
                                                <div 
                                                    className="avatar rounded-circle overflow-hidden border border-2 border-light shadow-xs" 
                                                    style={{ width: '65px', height: '65px' }}
                                                >
                                                    {getAvatarUrl(emp.profilePhotoUrl) ? (
                                                        <img
                                                            src={getAvatarUrl(emp.profilePhotoUrl)!}
                                                            className="w-100 h-100"
                                                            alt={empName}
                                                            style={{ objectFit: 'cover' }}
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = '/assets/img/users/user-13.jpg';
                                                            }}
                                                        />
                                                    ) : (
                                                        <ImageWithBasePath
                                                            src="assets/img/users/user-13.jpg"
                                                            className="w-100 h-100 object-fit-cover"
                                                            alt="user"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Employee Read-Only Details (Non-Clickable & 100% Dynamic) */}
                                            <div className="flex-grow-1 overflow-hidden">
                                                <div className="d-flex align-items-center justify-content-between mb-0">
                                                    <h6 className="fw-bold text-dark mb-0 text-truncate fs-13" title={empName}>
                                                        {empName}
                                                    </h6>
                                                    <span className="badge bg-light text-muted border px-1 py-0 fs-10 rounded">{empCode}</span>
                                                </div>
                                                
                                                <div className="text-primary fs-11 fw-semibold mb-1 text-truncate" title={desigName}>
                                                    {desigName}
                                                </div>

                                                <div className="fs-10 text-muted mb-1 text-truncate" title={deptName}>
                                                    <span className="text-secondary">Department :</span> <span className="text-dark fw-medium">{deptName}</span>
                                                </div>

                                                <div className="fs-10 text-muted mb-1 text-truncate" title={locName}>
                                                    <span className="text-secondary">Location :</span> <span className="text-primary fw-medium">{locName}</span>
                                                </div>

                                                <div className="fs-10 text-muted mb-1 text-truncate" title={emailAddr}>
                                                    <span className="text-secondary">Email :</span> {emailAddr !== 'N/A' ? (
                                                        <a href={`mailto:${emailAddr}`} className="text-primary text-decoration-none ms-1">{emailAddr}</a>
                                                    ) : (
                                                        <span className="text-dark ms-1">N/A</span>
                                                    )}
                                                </div>

                                                <div className="fs-10 text-muted text-truncate" title={phoneNum}>
                                                    <span className="text-secondary">Mobile :</span> <span className="text-dark fw-medium ms-1">{phoneNum}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
                <p className="mb-0">2014 - 2026 © HR Portal.</p>
                <p>Designed &amp; Developed By <Link to="#" className="text-primary">HGS Infotech</Link></p>
            </div>
        </div>
    );
};

export default OrgDirectory;
