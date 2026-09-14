// frontend/src/feature-module/finance-accounts/payrool/PayrollSalaryConfig.tsx
// Salary Structure Configuration — HR configures per-employee salary components
// Copyright (c) 2025 HGS Infotech Private Limited. All rights reserved.

import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../core/utils/apiClient";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";

const routes = all_routes;
const fmt = (n: number | string) =>
  "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Employee { id: number; firstName: string; lastName: string; employeeCode: string; department?: { name: string }; designation?: { name: string }; }
interface SalaryStructure {
  employeeId: number; basic: number; hra: number; conveyance: number;
  medicalAllowance: number; specialAllowance: number; bonus: number;
  pfDeduction: number; pfEmployer: number; professionalTax: number;
  tdsDeduction: number; otherDeductions: number; grossSalary: number; netSalary: number;
  employee: Employee;
}

const emptyForm = { basic: "", hra: "", conveyance: "", medicalAllowance: "", specialAllowance: "", bonus: "", pfDeduction: "", pfEmployer: "", professionalTax: "", tdsDeduction: "", otherDeductions: "" };

const PayrollSalaryConfig = () => {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  // Edit form
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Policy
  const [policy, setPolicy] = useState({ payrollCycleStartDay: 1 });
  const [policyMsg, setPolicyMsg] = useState("");
  const [savingPolicy, setSavingPolicy] = useState(false);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 4000);
  };

  const fetchStructures = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/payroll/salary-structures");
      setStructures(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/employees");
      setEmployees(Array.isArray(data) ? data : data.employees ?? []);
    } catch {}
  }, []);

  const fetchPolicy = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/payroll/policy");
      setPolicy(data);
    } catch {}
  }, []);

  useEffect(() => { fetchStructures(); fetchEmployees(); fetchPolicy(); }, []);

  const openEdit = (emp: Employee, existing?: SalaryStructure) => {
    setEditEmp(emp);
    setForm(existing ? {
      basic: String(existing.basic), hra: String(existing.hra), conveyance: String(existing.conveyance),
      medicalAllowance: String(existing.medicalAllowance), specialAllowance: String(existing.specialAllowance),
      bonus: String(existing.bonus), pfDeduction: String(existing.pfDeduction), pfEmployer: String(existing.pfEmployer),
      professionalTax: String(existing.professionalTax), tdsDeduction: String(existing.tdsDeduction),
      otherDeductions: String(existing.otherDeductions),
    } : { ...emptyForm });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmp) return;
    setSaving(true);
    try {
      await apiClient.put(`/api/payroll/salary-structures/${editEmp.id}`, form);
      showMsg("success", `Salary structure saved for ${editEmp.firstName} ${editEmp.lastName}`);
      setEditEmp(null);
      await fetchStructures();
    } catch (err: any) {
      showMsg("error", err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      await apiClient.put("/api/payroll/policy", { payrollCycleStartDay: policy.payrollCycleStartDay });
      setPolicyMsg("Policy saved!");
      setTimeout(() => setPolicyMsg(""), 3000);
    } catch { setPolicyMsg("Failed to save policy"); }
    finally { setSavingPolicy(false); }
  };

  // Live calc preview
  const calcPreview = () => {
    const p = (k: string) => parseFloat((form as any)[k] || 0);
    const gross = p("basic") + p("hra") + p("conveyance") + p("medicalAllowance") + p("specialAllowance") + p("bonus");
    const deductions = p("pfDeduction") + p("professionalTax") + p("tdsDeduction") + p("otherDeductions");
    return { gross, net: Math.max(0, gross - deductions) };
  };

  // Employees without salary config
  const empIds = new Set(structures.map(s => s.employeeId));
  const unconfigured = employees.filter(e => !empIds.has(e.id));

  const filteredStructures = structures.filter(s => {
    if (!search) return true;
    return `${s.employee.firstName} ${s.employee.lastName} ${s.employee.employeeCode}`.toLowerCase().includes(search.toLowerCase());
  });

  const preview = calcPreview();

  return (
    <div className="page-wrapper py-4">
      <div className="content container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1" style={{ background: "linear-gradient(135deg,#4f46e5,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Salary Configuration
            </h4>
            <nav><ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item"><Link to="/index">Dashboard</Link></li>
              <li className="breadcrumb-item"><Link to={routes.payrollProcess}>Payroll</Link></li>
              <li className="breadcrumb-item active">Salary Config</li>
            </ol></nav>
          </div>
          <Link to={routes.payrollProcess} className="btn btn-primary btn-sm rounded-pill">
            <i className="ti ti-bolt me-1" /> Process Payroll
          </Link>
        </div>

        {msg && (
          <div className={`alert alert-${msg.type === "success" ? "success" : "danger"} alert-dismissible d-flex align-items-center gap-2 mb-3`}>
            <i className={`ti ${msg.type === "success" ? "ti-check-circle" : "ti-alert-circle"}`} />
            {msg.text}
            <button className="btn-close ms-auto" onClick={() => setMsg(null)} />
          </div>
        )}

        {/* Policy card */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3"><i className="ti ti-settings me-2 text-primary" />Payroll Cycle Policy</h6>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Payroll Cycle Start Day</label>
                <select className="form-select form-select-sm" value={policy.payrollCycleStartDay}
                  onChange={e => setPolicy(p => ({ ...p, payrollCycleStartDay: +e.target.value }))}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d === 1 ? "1st (Calendar Month)" : `${d}th of Previous Month`}</option>)}
                </select>
                <div className="form-text">Controls how payroll period dates are calculated.</div>
              </div>
              <div className="col-md-2">
                <button className="btn btn-sm btn-primary rounded-pill w-100" onClick={handleSavePolicy} disabled={savingPolicy}>
                  {savingPolicy ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="ti ti-check me-1" />}Save
                </button>
              </div>
              {policyMsg && <div className="col-md-4"><span className="text-success small">{policyMsg}</span></div>}
            </div>
          </div>
        </div>

        {/* Unconfigured employees warning */}
        {unconfigured.length > 0 && (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
            <i className="ti ti-alert-triangle" />
            <span><strong>{unconfigured.length} employee(s)</strong> have no salary configured: {unconfigured.slice(0, 3).map(e => `${e.firstName} ${e.lastName}`).join(", ")}{unconfigured.length > 3 ? "..." : ""}</span>
          </div>
        )}

        {/* Configured employees */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex align-items-center justify-content-between">
            <h6 className="fw-bold mb-0">Configured Salary Structures ({structures.length})</h6>
            <div className="d-flex gap-2">
              <input className="form-control form-control-sm rounded-pill" style={{ width: 200 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              {unconfigured.length > 0 && (
                <div className="dropdown">
                  <button className="btn btn-sm btn-outline-primary rounded-pill dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="ti ti-plus me-1" />Add New
                  </button>
                  <ul className="dropdown-menu shadow">
                    {unconfigured.map(emp => (
                      <li key={emp.id}>
                        <button className="dropdown-item small" onClick={() => openEdit(emp)}>
                          {emp.firstName} {emp.lastName} <span className="text-muted">({emp.employeeCode})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5"><span className="spinner-border text-primary" /></div>
            ) : filteredStructures.length === 0 ? (
              <div className="text-center text-muted py-5">
                <i className="ti ti-settings fs-1 d-block mb-2" />
                No salary structures configured yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Employee</th><th>Dept</th>
                      <th className="text-end">Basic</th><th className="text-end">HRA</th><th className="text-end">Allowances</th>
                      <th className="text-end">PF</th><th className="text-end">Prof Tax</th><th className="text-end">TDS</th>
                      <th className="text-end fw-bold text-success">Gross</th><th className="text-end fw-bold text-primary">Net</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStructures.map(s => {
                      const allowances = Number(s.conveyance) + Number(s.medicalAllowance) + Number(s.specialAllowance) + Number(s.bonus);
                      return (
                        <tr key={s.employeeId}>
                          <td><div className="fw-semibold">{s.employee.firstName} {s.employee.lastName}</div><div className="text-muted" style={{ fontSize: ".73rem" }}>{s.employee.employeeCode}</div></td>
                          <td>{s.employee.department?.name || "—"}</td>
                          <td className="text-end">{fmt(s.basic)}</td>
                          <td className="text-end">{fmt(s.hra)}</td>
                          <td className="text-end">{fmt(allowances)}</td>
                          <td className="text-end">{fmt(s.pfDeduction)}</td>
                          <td className="text-end">{fmt(s.professionalTax)}</td>
                          <td className="text-end">{fmt(s.tdsDeduction)}</td>
                          <td className="text-end fw-semibold text-success">{fmt(s.grossSalary)}</td>
                          <td className="text-end fw-semibold text-primary">{fmt(s.netSalary)}</td>
                          <td><button className="btn btn-sm btn-outline-primary rounded-pill" onClick={() => openEdit(s.employee, s)}><i className="ti ti-edit" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Edit modal */}
        {editEmp && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1040, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflowY: "auto" }}>
            <div className="card shadow-lg" style={{ maxWidth: 680, width: "100%", borderRadius: 16 }}>
              <div className="card-header bg-primary text-white py-3 px-4" style={{ borderRadius: "16px 16px 0 0" }}>
                <h6 className="fw-bold mb-0"><i className="ti ti-settings me-2" />Salary Structure — {editEmp.firstName} {editEmp.lastName}</h6>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSave}>
                  <h6 className="text-muted small fw-bold text-uppercase mb-2">Earnings</h6>
                  <div className="row g-3 mb-3">
                    {[
                      { key: "basic", label: "Basic Salary" },
                      { key: "hra", label: "HRA" },
                      { key: "conveyance", label: "Conveyance" },
                      { key: "medicalAllowance", label: "Medical Allowance" },
                      { key: "specialAllowance", label: "Special Allowance" },
                      { key: "bonus", label: "Bonus / Incentive" },
                    ].map(f => (
                      <div className="col-md-4" key={f.key}>
                        <label className="form-label small">{f.label}</label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">₹</span>
                          <input type="number" min={0} step={0.01} className="form-control"
                            value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <h6 className="text-muted small fw-bold text-uppercase mb-2 mt-2">Deductions</h6>
                  <div className="row g-3 mb-3">
                    {[
                      { key: "pfDeduction", label: "PF (Employee)" },
                      { key: "pfEmployer", label: "PF (Employer)" },
                      { key: "professionalTax", label: "Professional Tax" },
                      { key: "tdsDeduction", label: "TDS" },
                      { key: "otherDeductions", label: "Other Deductions" },
                    ].map(f => (
                      <div className="col-md-4" key={f.key}>
                        <label className="form-label small">{f.label}</label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">₹</span>
                          <input type="number" min={0} step={0.01} className="form-control"
                            value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live preview */}
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <div className="text-center p-3 rounded" style={{ background: "#f0fdf4" }}>
                        <div className="small text-muted">Gross Salary</div>
                        <div className="fw-bold text-success fs-5">{fmt(preview.gross)}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 rounded" style={{ background: "#eff6ff" }}>
                        <div className="small text-muted">Net Salary (Take Home)</div>
                        <div className="fw-bold text-primary fs-5">{fmt(preview.net)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={saving}>
                      {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="ti ti-check me-2" />}Save Structure
                    </button>
                    <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={() => setEditEmp(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollSalaryConfig;
