// frontend/src/feature-module/finance-accounts/payrool/PayrollProcess.tsx
// Keka-style Payroll Processing Wizard — 5-step pipeline
// Copyright (c) 2025 HGS Infotech Private Limited. All rights reserved.

import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../core/utils/apiClient";
import { all_routes } from "../../../router/all_routes";
import { Link } from "react-router-dom";

const routes = all_routes;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayrollPeriod {
  id: number;
  label: string;
  periodStart: string;
  periodEnd: string;
  totalDays: number;
  weekoffDays: number;
  holidayDays: number;
  workingDays: number;
  status: "DRAFT" | "INPUTS_REVIEWED" | "CALCULATED" | "APPROVED" | "LOCKED";
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  _count?: { entries: number };
}

interface AttendanceInput {
  employeeId: number;
  employeeCode: string;
  name: string;
  department?: string;
  designation?: string;
  hasSalaryConfig: boolean;
  salary: { grossSalary: number; basic: number };
  attendance: {
    totalDays: number; presentDays: number; halfDays: number;
    paidLeaveDays: number; lopDays: number; weekoffDays: number;
    holidayDays: number; workingDays: number;
  };
}

interface PayrollEntry {
  id: number;
  employeeId: number;
  grossEarnings: number;
  lopDays: number;
  lopDeduction: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  hrRemarks?: string;
  employee: {
    firstName: string; lastName: string; employeeCode: string;
    department?: { name: string }; designation?: { name: string };
  };
}

const STEPS = [
  { id: 1, label: "Select Month",   icon: "ti ti-calendar" },
  { id: 2, label: "Review Inputs",  icon: "ti ti-users" },
  { id: 3, label: "Calculate",      icon: "ti ti-calculator" },
  { id: 4, label: "Review & Edit",  icon: "ti ti-edit" },
  { id: 5, label: "Approve & Lock", icon: "ti ti-lock" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmt = (n: number | string) =>
  "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Component ────────────────────────────────────────────────────────────────

const PayrollProcess = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activePeriod, setActivePeriod] = useState<PayrollPeriod | null>(null);

  const [inputs, setInputs] = useState<AttendanceInput[]>([]);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);

  const [overrideEntry, setOverrideEntry] = useState<PayrollEntry | null>(null);
  const [overrideLop, setOverrideLop] = useState("");
  const [overrideBonus, setOverrideBonus] = useState("");
  const [overrideOther, setOverrideOther] = useState("");
  const [overrideRemark, setOverrideRemark] = useState("");
  const [overriding, setOverriding] = useState(false);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const fetchPeriods = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/payroll/periods");
      setPeriods(data);
    } catch {}
  }, []);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  // Step 1
  const handleStartPeriod = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/payroll/periods", { month: selectedMonth, year: selectedYear });
      setActivePeriod(data.period);
      showMsg("success", `Period "${data.period.label}" created!`);
      await fetchPeriods();
      setStep(2);
    } catch (err: any) {
      if (err.response?.status === 409) {
        const ex = err.response.data.period;
        if (ex) { setActivePeriod(ex); setStep(2); return; }
      }
      showMsg("error", err.response?.data?.message || "Failed");
    } finally { setLoading(false); }
  };

  const handleResumePeriod = (p: PayrollPeriod) => {
    setActivePeriod(p);
    const map: Record<string, number> = { DRAFT: 2, INPUTS_REVIEWED: 3, CALCULATED: 4, APPROVED: 5, LOCKED: 5 };
    setStep(map[p.status] ?? 2);
  };

  // Step 2
  const loadInputs = async () => {
    if (!activePeriod) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/payroll/periods/${activePeriod.id}/inputs`);
      setInputs(data.inputs);
      setActivePeriod(data.period);
      setStep(3);
    } catch (err: any) {
      showMsg("error", err.response?.data?.message || "Failed to load inputs");
    } finally { setLoading(false); }
  };

  // Step 3
  const handleCalculate = async () => {
    if (!activePeriod) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/api/payroll/periods/${activePeriod.id}/calculate`);
      setCalcResult(data);
      showMsg("success", `Calculated for ${data.employeeCount} employees`);
      setStep(4);
    } catch (err: any) {
      showMsg("error", err.response?.data?.message || "Calculation failed");
    } finally { setLoading(false); }
  };

  // Step 4
  const loadEntries = useCallback(async () => {
    if (!activePeriod) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/payroll/periods/${activePeriod.id}/entries`);
      setEntries(data.entries);
      setActivePeriod(data.period);
    } catch {}
    finally { setLoading(false); }
  }, [activePeriod?.id]);

  useEffect(() => { if (step === 4) loadEntries(); }, [step]);

  const openOverride = (e: PayrollEntry) => {
    setOverrideEntry(e);
    setOverrideLop(String(Number(e.lopDays)));
    setOverrideBonus(""); setOverrideOther("");
    setOverrideRemark(e.hrRemarks || "");
  };

  const handleOverrideSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!overrideEntry) return;
    setOverriding(true);
    try {
      await apiClient.put(`/api/payroll/entries/${overrideEntry.id}/override`, {
        lopDays: overrideLop !== "" ? overrideLop : undefined,
        bonus: overrideBonus !== "" ? overrideBonus : undefined,
        otherDeductions: overrideOther !== "" ? overrideOther : undefined,
        hrRemarks: overrideRemark || undefined,
      });
      showMsg("success", "Entry updated");
      setOverrideEntry(null);
      await loadEntries();
    } catch (err: any) {
      showMsg("error", err.response?.data?.message || "Override failed");
    } finally { setOverriding(false); }
  };

  // Step 5
  const handleApprove = async () => {
    if (!activePeriod || !window.confirm(`Approve & lock "${activePeriod.label}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/api/payroll/periods/${activePeriod.id}/approve`);
      showMsg("success", data.message);
      await fetchPeriods();
      const refreshed = (await apiClient.get("/api/payroll/periods")).data.find((p: PayrollPeriod) => p.id === activePeriod.id);
      if (refreshed) setActivePeriod(refreshed);
    } catch (err: any) {
      showMsg("error", err.response?.data?.message || "Approval failed");
    } finally { setLoading(false); }
  };

  const isLocked = activePeriod?.status === "LOCKED";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-wrapper py-4">
      <div className="content container-fluid">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1" style={{ background: "linear-gradient(135deg,#4f46e5,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Process Payroll
            </h4>
            <nav><ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item"><Link to="/index">Dashboard</Link></li>
              <li className="breadcrumb-item active">Payroll Process</li>
            </ol></nav>
          </div>
          <div className="d-flex gap-2">
            <Link to={routes.payrollSalaryConfig} className="btn btn-outline-secondary btn-sm rounded-pill">
              <i className="ti ti-settings me-1" /> Salary Config
            </Link>
            <Link to={routes.payrollPayslips} className="btn btn-outline-primary btn-sm rounded-pill">
              <i className="ti ti-file-invoice me-1" /> All Payslips
            </Link>
          </div>
        </div>

        {/* Toast */}
        {msg && (
          <div className={`alert alert-${msg.type === "success" ? "success" : "danger"} alert-dismissible d-flex align-items-center gap-2 mb-3`}>
            <i className={`ti ${msg.type === "success" ? "ti-check-circle" : "ti-alert-circle"}`} />
            {msg.text}
            <button className="btn-close ms-auto" onClick={() => setMsg(null)} />
          </div>
        )}

        {/* Step bar */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body py-4">
            <div className="d-flex align-items-start">
              {STEPS.map((s, idx) => {
                const done = step > s.id, active = step === s.id;
                return (
                  <div key={s.id} className="d-flex flex-fill align-items-center">
                    <div className="d-flex flex-column align-items-center" style={{ minWidth: 72 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.1rem", border: "2px solid",
                        borderColor: done ? "#10b981" : active ? "#4f46e5" : "#e2e8f0",
                        background: done ? "#10b981" : active ? "#4f46e5" : "#f8fafc",
                        color: (done || active) ? "#fff" : "#94a3b8",
                        boxShadow: active ? "0 0 0 4px rgba(79,70,229,.15)" : "none",
                        transition: "all .3s"
                      }}>
                        {done ? <i className="ti ti-check" /> : <i className={s.icon} />}
                      </div>
                      <span style={{ fontSize: ".71rem", fontWeight: 600, color: done ? "#10b981" : active ? "#4f46e5" : "#94a3b8", marginTop: 6, textAlign: "center", whiteSpace: "nowrap" }}>
                        {s.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: done ? "#10b981" : "#e2e8f0", margin: "0 4px", marginTop: -22, transition: "background .3s" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">

            {/* STEP 1 */}
            {step === 1 && (
              <div>
                <h5 className="text-primary mb-3"><i className="ti ti-calendar me-2" />Select Payroll Month</h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Month</label>
                    <select className="form-select" value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}>
                      {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Year</label>
                    <select className="form-select" value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}>
                      {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <button className="btn btn-primary w-100 rounded-pill" onClick={handleStartPeriod} disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-plus me-2" />}
                      Start Payroll Period
                    </button>
                  </div>
                </div>

                {periods.length > 0 && (
                  <>
                    <hr />
                    <h6 className="fw-semibold text-muted mb-3">Previous Payroll Periods</h6>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle small">
                        <thead className="table-light">
                          <tr><th>Period</th><th>Dates</th><th>Days</th><th>Employees</th><th>Status</th><th>Net Pay</th><th /></tr>
                        </thead>
                        <tbody>
                          {periods.map(p => (
                            <tr key={p.id}>
                              <td className="fw-semibold">{p.label}</td>
                              <td className="text-muted">{new Date(p.periodStart).toLocaleDateString("en-IN")} – {new Date(p.periodEnd).toLocaleDateString("en-IN")}</td>
                              <td>{p.totalDays}</td>
                              <td>{p._count?.entries ?? 0}</td>
                              <td><span className={`badge rounded-pill bg-${p.status === "LOCKED" ? "success" : p.status === "CALCULATED" ? "info" : p.status === "INPUTS_REVIEWED" ? "warning" : "secondary"}`}>{p.status.replace("_"," ")}</span></td>
                              <td className="fw-semibold">{p.totalNetPay > 0 ? fmt(p.totalNetPay) : "—"}</td>
                              <td><button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => handleResumePeriod(p)}><i className="ti ti-arrow-right me-1" />Resume</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && activePeriod && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="text-primary mb-0"><i className="ti ti-users me-2" />Attendance Reconciliation — {activePeriod.label}</h5>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setStep(1)}><i className="ti ti-arrow-left me-1" />Back</button>
                    <button className="btn btn-sm btn-primary rounded-pill" onClick={loadInputs} disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-refresh me-1" />} Load & Review
                    </button>
                  </div>
                </div>
                <div className="row g-3 mb-4">
                  {[
                    { label: "Total Days", val: activePeriod.totalDays, color: "primary", icon: "ti-calendar" },
                    { label: "Week-offs",  val: activePeriod.weekoffDays, color: "secondary", icon: "ti-coffee" },
                    { label: "Holidays",   val: activePeriod.holidayDays, color: "warning", icon: "ti-star" },
                    { label: "Working",    val: activePeriod.workingDays, color: "success", icon: "ti-briefcase" },
                  ].map(c => (
                    <div className="col-6 col-md-3" key={c.label}>
                      <div className="card border-0 text-center p-3" style={{ background: `var(--bs-${c.color}-bg-subtle, #f8f9fa)`, borderRadius: 12 }}>
                        <i className={`ti ${c.icon} fs-3 text-${c.color}`} />
                        <div className="fs-2 fw-bold mt-1">{c.val}</div>
                        <div className="small text-muted">{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {inputs.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle small">
                      <thead className="table-light">
                        <tr><th>Employee</th><th>Dept</th><th>Gross Salary</th><th className="text-center">Present</th><th className="text-center">Paid Leave</th><th className="text-center text-danger">LOP</th><th className="text-center">Config</th></tr>
                      </thead>
                      <tbody>
                        {inputs.map(i => (
                          <tr key={i.employeeId}>
                            <td><div className="fw-semibold">{i.name}</div><div className="text-muted" style={{ fontSize: ".73rem" }}>{i.employeeCode}</div></td>
                            <td>{i.department || "—"}</td>
                            <td>{i.hasSalaryConfig ? fmt(i.salary.grossSalary) : <span className="badge bg-danger-subtle text-danger">Missing</span>}</td>
                            <td className="text-center">{i.attendance.presentDays}</td>
                            <td className="text-center">{i.attendance.paidLeaveDays}</td>
                            <td className="text-center fw-semibold" style={{ color: i.attendance.lopDays > 0 ? "#ef4444" : "#10b981" }}>{i.attendance.lopDays}</td>
                            <td className="text-center">{i.hasSalaryConfig ? <i className="ti ti-check text-success fs-5" /> : <i className="ti ti-x text-danger fs-5" />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : !loading && (
                  <div className="text-center text-muted py-5"><i className="ti ti-users fs-1 d-block mb-2" />Click "Load & Review" to fetch attendance data.</div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && activePeriod && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="text-primary mb-0"><i className="ti ti-calculator me-2" />Calculate — {activePeriod.label}</h5>
                  <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setStep(2)}><i className="ti ti-arrow-left me-1" />Back</button>
                </div>
                <div className="text-center py-4">
                  <i className="ti ti-calculator text-primary mb-3 d-block" style={{ fontSize: "4rem" }} />
                  <p className="text-muted lead mb-4">Run payroll calculation for all employees.<br />The engine computes Gross, LOP, PF, Tax, and Net Pay based on actual attendance.</p>
                  <button className="btn btn-primary btn-lg rounded-pill px-5" onClick={handleCalculate} disabled={loading}>
                    {loading ? <><span className="spinner-border spinner-border-sm me-2" />Calculating...</> : <><i className="ti ti-bolt me-2" />Run Calculation</>}
                  </button>
                </div>
                {calcResult && (
                  <div className="row g-3 mt-3">
                    {[
                      { label: "Employees", val: calcResult.employeeCount, icon: "ti-users", color: "info" },
                      { label: "Total Gross", val: fmt(calcResult.totalGross), icon: "ti-cash", color: "primary" },
                      { label: "Total Deductions", val: fmt(calcResult.totalDeductions), icon: "ti-minus-circle", color: "warning" },
                      { label: "Total Net Pay", val: fmt(calcResult.totalNetPay), icon: "ti-check-circle", color: "success" },
                    ].map(c => (
                      <div className="col-6 col-md-3" key={c.label}>
                        <div className="card border-0 text-center p-3" style={{ borderRadius: 12 }}>
                          <i className={`ti ${c.icon} fs-3 text-${c.color}`} />
                          <div className="fw-bold fs-5 mt-1">{c.val}</div>
                          <div className="small text-muted">{c.label}</div>
                        </div>
                      </div>
                    ))}
                    <div className="col-12 text-center mt-2">
                      <button className="btn btn-success rounded-pill px-4" onClick={() => setStep(4)}><i className="ti ti-arrow-right me-2" />Review Entries</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && activePeriod && (
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="text-primary mb-0"><i className="ti ti-edit me-2" />Review — {activePeriod.label}</h5>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => setStep(3)}><i className="ti ti-arrow-left me-1" />Back</button>
                    {!isLocked && <button className="btn btn-sm btn-success rounded-pill" onClick={() => setStep(5)}><i className="ti ti-check me-1" />Approve</button>}
                  </div>
                </div>
                {loading ? <div className="text-center py-5"><span className="spinner-border text-primary" /></div> : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Employee</th><th>Dept</th>
                          <th className="text-end">Gross</th>
                          <th className="text-center">LOP Days</th>
                          <th className="text-end">LOP Deduction</th>
                          <th className="text-end">Total Deductions</th>
                          <th className="text-end fw-bold">Net Pay</th>
                          <th>Status</th><th />
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map(e => (
                          <tr key={e.id}>
                            <td><div className="fw-semibold">{e.employee.firstName} {e.employee.lastName}</div><div className="text-muted" style={{ fontSize: ".73rem" }}>{e.employee.employeeCode}</div></td>
                            <td>{e.employee.department?.name || "—"}</td>
                            <td className="text-end">{fmt(e.grossEarnings)}</td>
                            <td className="text-center" style={{ color: Number(e.lopDays) > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{Number(e.lopDays).toFixed(1)}</td>
                            <td className="text-end text-danger">{Number(e.lopDays) > 0 ? fmt(e.lopDeduction) : "—"}</td>
                            <td className="text-end">{fmt(e.totalDeductions)}</td>
                            <td className="text-end fw-bold text-success">{fmt(e.netPay)}</td>
                            <td><span className={`badge rounded-pill bg-${e.status === "APPROVED" ? "success" : e.status === "OVERRIDDEN" ? "warning" : "secondary"}`}>{e.status}</span></td>
                            <td>{!isLocked && <button className="btn btn-sm btn-outline-primary rounded-pill px-2 py-1" onClick={() => openOverride(e)}><i className="ti ti-edit" style={{ fontSize: ".8rem" }} /></button>}</td>
                          </tr>
                        ))}
                      </tbody>
                      {entries.length > 0 && (
                        <tfoot className="table-light fw-bold">
                          <tr>
                            <td colSpan={2}>Total ({entries.length})</td>
                            <td className="text-end">{fmt(entries.reduce((s,e) => s + Number(e.grossEarnings), 0))}</td>
                            <td /><td className="text-end text-danger">{fmt(entries.reduce((s,e) => s + Number(e.lopDeduction), 0))}</td>
                            <td className="text-end">{fmt(entries.reduce((s,e) => s + Number(e.totalDeductions), 0))}</td>
                            <td className="text-end text-success">{fmt(entries.reduce((s,e) => s + Number(e.netPay), 0))}</td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}

                {/* Override modal */}
                {overrideEntry && (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1040, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                    <div className="card shadow-lg p-4" style={{ maxWidth: 480, width: "100%", borderRadius: 16 }}>
                      <h6 className="fw-bold mb-3"><i className="ti ti-edit me-2 text-primary" />Override: {overrideEntry.employee.firstName} {overrideEntry.employee.lastName}</h6>
                      <form onSubmit={handleOverrideSubmit}>
                        <div className="row g-3">
                          <div className="col-6">
                            <label className="form-label small fw-semibold">LOP Days</label>
                            <input type="number" min={0} step={0.5} className="form-control form-control-sm" value={overrideLop} onChange={e => setOverrideLop(e.target.value)} />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-semibold">Bonus Override (₹)</label>
                            <input type="number" min={0} className="form-control form-control-sm" value={overrideBonus} onChange={e => setOverrideBonus(e.target.value)} placeholder="Leave blank to keep" />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-semibold">Other Deductions (₹)</label>
                            <input type="number" min={0} className="form-control form-control-sm" value={overrideOther} onChange={e => setOverrideOther(e.target.value)} placeholder="Leave blank to keep" />
                          </div>
                          <div className="col-12">
                            <label className="form-label small fw-semibold">HR Remarks</label>
                            <input type="text" className="form-control form-control-sm" value={overrideRemark} onChange={e => setOverrideRemark(e.target.value)} placeholder="Optional" />
                          </div>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                          <button className="btn btn-primary btn-sm rounded-pill" disabled={overriding}>{overriding ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-check me-1" />}Save</button>
                          <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setOverrideEntry(null)}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && activePeriod && (
              <div className="text-center">
                <div className="mb-4">
                  {isLocked
                    ? <i className="ti ti-lock-check text-success" style={{ fontSize: "5rem" }} />
                    : <i className="ti ti-shield-check text-primary" style={{ fontSize: "5rem" }} />}
                </div>
                <h5 className="fw-bold mb-1">{activePeriod.label} Payroll</h5>
                <p className="text-muted mb-4">
                  {isLocked ? "This payroll has been approved and locked. Payslips have been generated." : "Review summary and approve to generate payslips for all employees."}
                </p>
                <div className="row g-3 mb-4 text-start">
                  {[
                    { label: "Period",           val: `${new Date(activePeriod.periodStart).toLocaleDateString("en-IN")} – ${new Date(activePeriod.periodEnd).toLocaleDateString("en-IN")}`, icon: "ti-calendar", color: "info" },
                    { label: "Total Gross",      val: fmt(activePeriod.totalGross),      icon: "ti-cash",            color: "primary" },
                    { label: "Total Deductions", val: fmt(activePeriod.totalDeductions), icon: "ti-minus",           color: "warning" },
                    { label: "Total Net Pay",    val: fmt(activePeriod.totalNetPay),     icon: "ti-currency-rupee",  color: "success" },
                  ].map(c => (
                    <div className="col-6 col-md-3" key={c.label}>
                      <div className="card border-0 p-3" style={{ borderRadius: 12, background: "#f8fafc" }}>
                        <i className={`ti ${c.icon} fs-3 text-${c.color}`} />
                        <div className="fw-bold mt-1">{c.val}</div>
                        <div className="small text-muted">{c.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  {!isLocked && (
                    <>
                      <button className="btn btn-outline-secondary rounded-pill" onClick={() => setStep(4)}><i className="ti ti-arrow-left me-1" />Back to Review</button>
                      <button className="btn btn-success btn-lg rounded-pill px-5" onClick={handleApprove} disabled={loading}>
                        {loading ? <><span className="spinner-border spinner-border-sm me-2" />Approving...</> : <><i className="ti ti-check me-2" />Approve & Generate Payslips</>}
                      </button>
                    </>
                  )}
                  <Link to={routes.payrollPayslips} className="btn btn-primary rounded-pill px-4"><i className="ti ti-file-invoice me-2" />View Payslips</Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollProcess;
