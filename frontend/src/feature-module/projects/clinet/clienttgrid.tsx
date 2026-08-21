import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import apiClient from "../../../core/utils/apiClient";
import { useAppSelector } from "../../../core/data/redux/store";

interface Client {
  id: number;
  companyName: string;
  contactPerson: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    projects: number;
  };
}

const ClienttGrid = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  
  const canWriteClients = currentUser?.role === 'SUPER_ADMIN' || 
                          currentUser?.role === 'HR' || 
                          currentUser?.role === 'MANAGER' ||
                          currentUser?.permissions?.some(p => p.module === 'PROJECTS' && p.canWrite);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Add Client Form State
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");

  const [message, setMessage] = useState("");

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/clients");
      if (res.data?.success) {
        setClients(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !email) return;

    try {
      setMessage("");
      const payload = {
        companyName,
        contactPerson: contactPerson || null,
        email,
        phone: phone || null,
        address: address || null,
        website: website || null
      };

      const res = await apiClient.post("/api/clients", payload);
      if (res.data?.success) {
        // Reset form
        setCompanyName("");
        setContactPerson("");
        setEmail("");
        setPhone("");
        setAddress("");
        setWebsite("");

        // Refresh list
        fetchClients();

        // Close modal
        const closeBtn = document.getElementById("close-add-client-modal");
        if (closeBtn) closeBtn.click();
      }
    } catch (err: any) {
      console.error("Failed to create client:", err);
      setMessage(err.response?.data?.message || "Failed to create client.");
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      const res = await apiClient.delete(`/api/clients/${id}`);
      if (res.data?.success) {
        fetchClients();
      }
    } catch (err) {
      console.error("Failed to delete client:", err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Summary counts
  const summary = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.isActive).length;
    const inactive = total - active;
    
    // New Clients: registered in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newClients = clients.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length;

    return { total, active, inactive, newClients };
  }, [clients]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Search filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = c.companyName.toLowerCase().includes(query);
        const matchesContact = (c.contactPerson || "").toLowerCase().includes(query);
        const matchesEmail = c.email.toLowerCase().includes(query);
        if (!matchesName && !matchesContact && !matchesEmail) return false;
      }
      
      // Status filter
      if (statusFilter !== "ALL") {
        const isClientActive = statusFilter === "ACTIVE";
        if (c.isActive !== isClientActive) return false;
      }

      return true;
    });
  }, [clients, searchTerm, statusFilter]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Client ID", "Company Name", "Contact Person", "Email", "Phone", "Website", "Status"];
    const rows = filteredClients.map(c => [
      `CLI-${c.id.toString().padStart(4, '0')}`,
      c.companyName,
      c.contactPerson || "N/A",
      c.email,
      c.phone || "N/A",
      c.website || "N/A",
      c.isActive ? "Active" : "Inactive"
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Clients_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export (Browser Print Window)
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHtml = `
      <html>
        <head>
          <title>Clients Directory</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Clients Directory</h2>
          <table>
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Company Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredClients.map(c => `
                <tr>
                  <td>CLI-${c.id.toString().padStart(4, '0')}</td>
                  <td>${c.companyName}</td>
                  <td>${c.contactPerson || 'N/A'}</td>
                  <td>${c.email}</td>
                  <td>${c.phone || 'N/A'}</td>
                  <td>${c.isActive ? 'Active' : 'Inactive'}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(tableHtml);
    printWindow.document.close();
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Clients Grid</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Projects</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Client Grid
                  </li>
                </ol>
              </nav>
            </div>
            
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              {/* List / Grid View Switcher */}
              <div className="me-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 icon-list">
                  <Link to={all_routes.clientlist} className="btn btn-icon btn-sm me-1" title="List View">
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link to={all_routes.clientgrid} className="btn btn-icon btn-sm active bg-primary text-white" title="Grid View">
                    <i className="ti ti-layout-grid" />
                  </Link>
                </div>
              </div>

              {/* Export dropdown */}
              <div className="me-2">
                <div className="dropdown">
                  <button
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <button className="dropdown-item rounded-1" onClick={handleExportPDF}>
                        <i className="ti ti-file-type-pdf me-2" /> Export PDF
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item rounded-1" onClick={handleExportCSV}>
                        <i className="ti ti-file-type-xls me-2" /> Export Excel / CSV
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {canWriteClients && (
                <div>
                  <button
                    data-bs-toggle="modal"
                    data-bs-target="#add_client_modal"
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <i className="ti ti-circle-plus me-2" />
                    Add Client
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Summary Cards */}
          <div className="row">
            <div className="col-xl-3 col-md-6 d-flex mb-4">
              <div className="card flex-fill shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-2">
                        <span className="p-2 br-10 bg-pink-transparent border border-pink d-flex align-items-center justify-content-center">
                          <i className="ti ti-users-group text-pink fs-18" />
                        </span>
                      </div>
                      <div>
                        <p className="fs-12 fw-medium mb-0 text-gray-5">Total Clients</p>
                        <h4 className="mb-0 fw-bold">{summary.total}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 d-flex mb-4">
              <div className="card flex-fill shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-2">
                        <span className="p-2 br-10 bg-success-transparent border border-success d-flex align-items-center justify-content-center">
                          <i className="ti ti-user-check text-success fs-18" />
                        </span>
                      </div>
                      <div>
                        <p className="fs-12 fw-medium mb-0 text-gray-5">Active Clients</p>
                        <h4 className="mb-0 fw-bold text-success">{summary.active}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 d-flex mb-4">
              <div className="card flex-fill shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-2">
                        <span className="p-2 br-10 bg-danger-transparent border border-danger d-flex align-items-center justify-content-center">
                          <i className="ti ti-user-x text-danger fs-18" />
                        </span>
                      </div>
                      <div>
                        <p className="fs-12 fw-medium mb-0 text-gray-5">Inactive Clients</p>
                        <h4 className="mb-0 fw-bold text-danger">{summary.inactive}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 d-flex mb-4">
              <div className="card flex-fill shadow-sm border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-2">
                        <span className="p-2 br-10 bg-info-transparent border border-info d-flex align-items-center justify-content-center">
                          <i className="ti ti-user-plus text-info fs-18" />
                        </span>
                      </div>
                      <div>
                        <p className="fs-12 fw-medium mb-0 text-gray-5">New Clients (30d)</p>
                        <h4 className="mb-0 fw-bold text-info">{summary.newClients}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtering Section */}
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <h5 className="mb-0 fw-semibold">Directory Grid</h5>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Search clients..."
                    style={{ width: "200px" }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <select
                    className="form-select form-select-sm w-auto"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="INACTIVE">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading clients directory...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="card text-center p-5 shadow-sm border-0">
              <i className="ti ti-user-off fs-48 text-muted mb-3" />
              <h4>No Clients Found</h4>
              <p className="text-muted">Register a new client using the Add Client button.</p>
            </div>
          ) : (
            <div className="row">
              {filteredClients.map((client) => (
                <div className="col-xxl-3 col-lg-4 col-md-6 mb-4" key={client.id}>
                  <div className="card h-100 shadow-sm border-0">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className={`badge ${client.isActive ? 'bg-success-transparent text-success' : 'bg-danger-transparent text-danger'}`}>
                          {client.isActive ? 'Active' : 'Inactive'}
                        </span>
                        
                        {canWriteClients && (
                          <div className="dropdown">
                            <button className="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
                              <i className="ti ti-dots-vertical fs-16" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end p-2">
                              <li>
                                <button
                                  className="dropdown-item rounded-1 text-danger"
                                  onClick={() => handleDeleteClient(client.id)}
                                >
                                  <i className="ti ti-trash me-2" /> Delete
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="text-center mb-3">
                        <span className="avatar avatar-lg bg-primary-transparent text-primary rounded-circle mb-2 d-inline-flex align-items-center justify-content-center font-bold fs-20">
                          {client.companyName[0].toUpperCase()}
                        </span>
                        <h5 className="mb-0 text-dark fw-bold">{client.companyName}</h5>
                        <p className="text-muted fs-12 mb-0">{client.contactPerson || "No primary contact"}</p>
                      </div>

                      <div className="bg-light rounded p-2 mb-3 fs-12 flex-grow-1">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Email:</span>
                          <span className="text-dark text-truncate d-inline-block" style={{ maxWidth: "150px" }} title={client.email}>
                            {client.email}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Phone:</span>
                          <span className="text-dark">{client.phone || "N/A"}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Website:</span>
                          <span className="text-dark text-truncate d-inline-block" style={{ maxWidth: "150px" }}>
                            {client.website ? <a href={client.website} target="_blank" rel="noreferrer">{client.website.replace(/^https?:\/\//, '')}</a> : "N/A"}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                          <span className="text-muted">Projects:</span>
                          <span className="fw-semibold text-primary">{client._count?.projects || 0} active</span>
                        </div>
                      </div>

                      <div className="text-center pt-2 border-top mt-auto">
                        <Link to={`${all_routes.clientlist}`} className="btn btn-outline-primary btn-sm w-100">
                          Manage Client
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      <div className="modal fade" id="add_client_modal" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Client Profile</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                id="close-add-client-modal"
              />
            </div>
            <form onSubmit={handleCreateClient}>
              <div className="modal-body">
                {message && <div className="alert alert-danger mb-3">{message}</div>}
                
                <div className="mb-3">
                  <label className="form-label fs-13">Company / Client Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13">Primary Contact Person</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13">Client Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. billing@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. +1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13">Website</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="e.g. https://acme.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13">Corporate Address</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Suite 100, New York..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!companyName || !email}
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClienttGrid;
