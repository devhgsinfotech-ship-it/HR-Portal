import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../core/common/dataTable/index";
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
  _count?: {
    projects: number;
  };
}

const ClientList = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  const canWriteClients = currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'HR' ||
    currentUser?.role === 'MANAGER' ||
    currentUser?.permissions?.some(p => p.module === 'PROJECTS' && p.canWrite);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
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

  const columns: any[] = [
    {
      title: "Client ID",
      dataIndex: "id",
      render: (id: number) => <span>CLI-{id.toString().padStart(4, '0')}</span>,
      sorter: (a: Client, b: Client) => a.id - b.id,
    },
    {
      title: "Company Name",
      dataIndex: "companyName",
      render: (name: string) => <span className="fw-semibold text-dark">{name}</span>,
      sorter: (a: Client, b: Client) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: "Contact Person",
      dataIndex: "contactPerson",
      render: (person: string | null) => <span>{person || "--"}</span>,
      sorter: (a: Client, b: Client) => (a.contactPerson || "").localeCompare(b.contactPerson || ""),
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a: Client, b: Client) => a.email.localeCompare(b.email),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      render: (phone: string | null) => <span>{phone || "--"}</span>,
    },
    {
      title: "Projects",
      dataIndex: "_count",
      render: (count: any) => <span className="badge bg-light text-dark">{count?.projects || 0} active</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive: boolean) => (
        <span className={`badge ${isActive ? 'bg-success-transparent text-success' : 'bg-danger-transparent text-danger'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    ...(canWriteClients ? [{
      title: "Action",
      dataIndex: "id",
      render: (id: number) => (
        <button
          onClick={() => handleDeleteClient(id)}
          className="btn btn-link text-danger p-0"
          title="Delete Client"
        >
          <i className="ti ti-trash fs-14" />
        </button>
      )
    }] : [])
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Clients Directory</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Projects</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Clients
                  </li>
                </ol>
              </nav>
            </div>

            {canWriteClients && (
              <div className="mb-2">
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

          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              <Table
                dataSource={clients}
                columns={columns}
                loading={loading}
              />
            </div>
          </div>
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

export default ClientList;
