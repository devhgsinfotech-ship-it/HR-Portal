// frontend/src/feature-module/finance-accounts/payrool/PayrollPayslips.tsx
// Payslip list + detail view for HR and Employee self-service
// Copyright (c) 2025 HGS Infotech Private Limited. All rights reserved.

import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../core/utils/apiClient";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";

const routes = all_routes;

const MONTHS = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const fmt = (n: number | string) =>
  "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Payslip {
  id: number;
  month: number;
  year: number;
  basic: number;
  totalAllowances: number;
  totalDeductions: number;
  netPay: number;
  generatedAt: string;
  employee: {
    firstName: string; lastName: string; employeeCode: string;
    department?: { name: string }; designation?: { name: string };
    user?: { email: string };
  };
  payrollEntry?: {
    hra: number; conveyance: number; medicalAllowance: number; specialAllowance: number;
    bonus: number; grossEarnings: number; lopDays: number; lopDeduction: number;
    pfDeduction: number; professionalTax: number; tdsDeduction: number;
    otherDeductions: number; presentDays: number; halfDays: number;
    paidLeaveDays: number; protectedDays: number;
    payrollPeriod?: { label: string; periodStart: string; periodEnd: string; totalDays: number };
  };
}

const PayrollPayslips = () => {
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("authUser") || "{}"); } catch { return {}; } })();
  const isEmployee = currentUser?.role === "EMPLOYEE";
  const path = window.location.pathname;
  const isOwnView = isEmployee || path === "/payslip" || path === "/payroll/my-payslips";

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [search, setSearch] = useState("");

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (isOwnView) params.ownOnly = "true";
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      const { data } = await apiClient.get("/api/payroll/payslips", { params });
      setPayslips(data);
    } catch {}
    finally { setLoading(false); }
  }, [filterMonth, filterYear, isOwnView]);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  const fetchDetail = async (id: number) => {
    try {
      const { data } = await apiClient.get(`/api/payroll/payslips/${id}`);
      setSelectedPayslip(data);
    } catch {}
  };

  const filtered = payslips.filter(p => {
    if (!search) return true;
    const name = `${p.employee?.firstName} ${p.employee?.lastName} ${p.employee?.employeeCode}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handlePrint = () => window.print();

  if (selectedPayslip) {
    const e = selectedPayslip;
    const pe = e.payrollEntry;
    return (
      <div className="page-wrapper py-4">
        <div className="content container-fluid">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setSelectedPayslip(null)}>
              <i className="ti ti-arrow-left me-1" /> Back to Payslips
            </button>
            <button className="btn btn-primary btn-sm rounded-pill" onClick={handlePrint}>
              <i className="ti ti-printer me-1" /> Print / Download
            </button>
          </div>

          <div className="card border-0 shadow-sm payslip-print" style={{ borderRadius: 16, maxWidth: 800, margin: "0 auto" }}>
            <div className="card-body p-5">
              {/* Header */}
              <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                <div>
                  <h4 className="fw-bold text-primary mb-0">HGS Infotech Pvt. Ltd.</h4>
                  <p className="text-muted small mb-0">Payslip for {MONTHS[e.month]} {e.year}</p>
                </div>
                <div className="text-end">
                  <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill">APPROVED</span>
                  <div className="small text-muted mt-1">Generated: {new Date(e.generatedAt).toLocaleDateString("en-IN")}</div>
                </div>
              </div>

              {/* Employee info */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <h6 className="fw-bold text-muted text-uppercase small mb-2">Employee Details</h6>
                  <table className="table table-sm table-borderless mb-0">
                    <tbody>
                      <tr><td className="text-muted small pe-3">Name</td><td className="fw-semibold">{e.employee?.firstName} {e.employee?.lastName}</td></tr>
                      <tr><td className="text-muted small">Employee ID</td><td className="fw-semibold">{e.employee?.employeeCode}</td></tr>
                      <tr><td className="text-muted small">Department</td><td>{e.employee?.department?.name || "—"}</td></tr>
                      <tr><td className="text-muted small">Designation</td><td>{e.employee?.designation?.name || "—"}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold text-muted text-uppercase small mb-2">Pay Period</h6>
                  <table className="table table-sm table-borderless mb-0">
                    <tbody>
                      <tr><td className="text-muted small pe-3">Period</td><td className="fw-semibold">{pe?.payrollPeriod?.label || `${MONTHS[e.month]} ${e.year}`}</td></tr>
                      {pe?.payrollPeriod && <>
                        <tr><td className="text-muted small">From</td><td>{new Date(pe.payrollPeriod.periodStart).toLocaleDateString("en-IN")}</td></tr>
                        <tr><td className="text-muted small">To</td><td>{new Date(pe.payrollPeriod.periodEnd).toLocaleDateString("en-IN")}</td></tr>
                        <tr><td className="text-muted small">Total Days</td><td>{pe.payrollPeriod.totalDays}</td></tr>
                      </>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Attendance summary */}
              {pe && (
                <div className="row g-2 mb-4">
                  {[
                    { label: "Present Days", val: Number(pe.presentDays).toFixed(1), color: "success" },
                    { label: "Paid Leave", val: Number(pe.paidLeaveDays).toFixed(1), color: "info" },
                    { label: "Week-offs/Holidays", val: Number(pe.protectedDays).toFixed(0), color: "secondary" },
                    { label: "LOP Days", val: Number(pe.lopDays).toFixed(1), color: "danger" },
                  ].map(c => (
                    <div className="col-6 col-md-3" key={c.label}>
                      <div className="text-center p-2 rounded" style={{ background: "#f8fafc" }}>
                        <div className={`fw-bold text-${c.color}`}>{c.val}</div>
                        <div className="small text-muted">{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Earnings & Deductions table */}
              <div className="row g-3">
                <div className="col-md-6">
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">Earnings</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr><td>Basic Salary</td><td className="text-end">{fmt(e.basic)}</td></tr>
                      {pe && <>
                        <tr><td>HRA</td><td className="text-end">{fmt(pe.hra)}</td></tr>
                        <tr><td>Conveyance</td><td className="text-end">{fmt(pe.conveyance)}</td></tr>
                        <tr><td>Medical Allowance</td><td className="text-end">{fmt(pe.medicalAllowance)}</td></tr>
                        <tr><td>Special Allowance</td><td className="text-end">{fmt(pe.specialAllowance)}</td></tr>
                        {Number(pe.bonus) > 0 && <tr><td>Bonus</td><td className="text-end">{fmt(pe.bonus)}</td></tr>}
                      </>}
                      <tr className="table-light fw-bold"><td>Gross Earnings</td><td className="text-end">{fmt(pe?.grossEarnings ?? Number(e.basic) + Number(e.totalAllowances))}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h6 className="fw-bold text-uppercase small text-muted mb-2">Deductions</h6>
                  <table className="table table-sm">
                    <tbody>
                      {pe && Number(pe.lopDeduction) > 0 && <tr><td>Loss of Pay (LOP)</td><td className="text-end text-danger">{fmt(pe.lopDeduction)}</td></tr>}
                      {pe && <tr><td>PF Employee</td><td className="text-end">{fmt(pe.pfDeduction)}</td></tr>}
                      {pe && <tr><td>Professional Tax</td><td className="text-end">{fmt(pe.professionalTax)}</td></tr>}
                      {pe && Number(pe.tdsDeduction) > 0 && <tr><td>TDS</td><td className="text-end">{fmt(pe.tdsDeduction)}</td></tr>}
                      {pe && Number(pe.otherDeductions) > 0 && <tr><td>Other Deductions</td><td className="text-end">{fmt(pe.otherDeductions)}</td></tr>}
                      <tr className="table-light fw-bold"><td>Total Deductions</td><td className="text-end">{fmt(e.totalDeductions)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net Pay */}
              <div className="mt-3 p-4 rounded-3 text-center" style={{ background: "linear-gradient(135deg, #4f46e5, #818cf8)" }}>
                <div className="text-white small opacity-75">Net Pay (Take Home)</div>
                <div className="text-white fw-bold" style={{ fontSize: "2.2rem" }}>{fmt(e.netPay)}</div>
              </div>

              <p className="text-center text-muted small mt-4 mb-0">
                This is a computer-generated payslip and does not require a signature.
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            .page-wrapper > .content > *:not(.payslip-print) { display: none !important; }
            .btn { display: none !important; }
            .payslip-print { box-shadow: none !important; border: 1px solid #dee2e6 !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-wrapper py-4">
      <div className="content container-fluid">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1" style={{ background: "linear-gradient(135deg,#4f46e5,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {isOwnView ? "My Payslip" : "All Payslips"}
            </h4>
            <nav><ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item"><Link to="/index">Dashboard</Link></li>
              <li className="breadcrumb-item active">Payslips</li>
            </ol></nav>
          </div>
          {!isEmployee && (
            <Link to={routes.payrollProcess} className="btn btn-primary btn-sm rounded-pill">
              <i className="ti ti-bolt me-1" /> Process Payroll
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              {!isOwnView && (
                <div className="col-md-3">
                  <input className="form-control form-control-sm rounded-pill" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              )}
              <div className="col-md-2">
                <select className="form-select form-select-sm rounded-pill" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                  <option value="">All Months</option>
                  {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <select className="form-select form-select-sm rounded-pill" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                  {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="col-md-1">
                <button className="btn btn-sm btn-outline-primary rounded-pill w-100" onClick={fetchPayslips}>
                  <i className="ti ti-filter" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="ti ti-file-invoice fs-1 d-block mb-2" />
                {isOwnView ? "Payslip not generated yet." : "No payslips found. Process payroll to generate payslips."}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light" style={{ borderRadius: 16 }}>
                    <tr>
                      {!isOwnView && <th>Employee</th>}
                      <th>Period</th>
                      <th className="text-end">Gross</th>
                      <th className="text-end">Deductions</th>
                      <th className="text-end fw-bold">Net Pay</th>
                      <th>Generated</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id}>
                        {!isOwnView && (
                          <td>
                            <div className="fw-semibold">{p.employee?.firstName} {p.employee?.lastName}</div>
                            <div className="text-muted small">{p.employee?.employeeCode} · {p.employee?.department?.name}</div>
                          </td>
                        )}
                        <td className="fw-semibold">{MONTHS[p.month]} {p.year}</td>
                        <td className="text-end">{fmt(Number(p.basic) + Number(p.totalAllowances))}</td>
                        <td className="text-end text-danger">{fmt(p.totalDeductions)}</td>
                        <td className="text-end fw-bold text-success">{fmt(p.netPay)}</td>
                        <td className="small text-muted">{new Date(p.generatedAt).toLocaleDateString("en-IN")}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => fetchDetail(p.id)}>
                            <i className="ti ti-eye me-1" />View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollPayslips;
