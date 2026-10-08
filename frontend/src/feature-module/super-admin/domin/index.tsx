import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import apiClient from '../../../core/utils/apiClient';

interface DomainDetails {
  id: number;
  companyName: string;
  email: string;
  domain: string;
  emailDomain?: string;
  companyCode?: string;
  subdomain?: string;
  plan: string;
  createdDate: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | string;
}

const Domain = () => {
  const [domains, setDomains] = useState<DomainDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainDetails | null>(null);
  const [editDomain, setEditDomain] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/subscriptions/domains');
      if (res.data && res.data.domains) {
        setDomains(res.data.domains);
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleSelectDomain = (domain: DomainDetails) => {
    setSelectedDomain(domain);
    const domainVal = domain.emailDomain || domain.domain || '';
    setEditDomain(domainVal);
  };

  const handleUpdateStatus = async (domainId: number, newStatus: 'APPROVED' | 'REJECTED' | 'UPDATE_ONLY', customDomain?: string) => {
    try {
      const payload: any = {};
      if (newStatus !== 'UPDATE_ONLY') {
        payload.status = newStatus;
      }
      if (customDomain && customDomain.trim() !== '') {
        payload.domain = customDomain.trim().toLowerCase();
        payload.emailDomain = customDomain.trim().toLowerCase();
      }
      const res = await apiClient.put(`/subscriptions/domains/${domainId}/status`, payload);
      setMessage({ type: 'success', text: res.data?.message || `Domain request updated successfully!` });
      fetchDomains();
      // Close modal if open
      const closeBtn = document.getElementById('close-domain-modal');
      if (closeBtn) closeBtn.click();
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update domain status' });
    }
  };

  const columns = [
    {
      title: "Company Name",
      dataIndex: "companyName",
      render: (_text: string, record: DomainDetails) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link to="#" className="avatar avatar-md border rounded-circle me-2">
            <ImageWithBasePath
              src="assets/img/company/company-01.svg"
              className="img-fluid"
              alt={`${record.companyName} logo`}
            />
          </Link>
          <div>
            <h6 className="fw-medium mb-0">
              <Link to="#" onClick={() => handleSelectDomain(record)} data-bs-toggle="modal" data-bs-target="#domain_detail">
                {record.companyName}
              </Link>
            </h6>
            <small className="text-muted">{record.email}</small>
          </div>
        </div>
      ),
      sorter: (a: DomainDetails, b: DomainDetails) => a.companyName.localeCompare(b.companyName),
    },
    {
      title: "Company Domain",
      dataIndex: "domain",
      render: (text: string, record: DomainDetails) => (
        <div>
          <span className="text-primary fw-medium">{text}</span>
          {record.companyCode && (
            <div>
              <span className="badge badge-soft-info border fs-11 mt-1">{record.companyCode}</span>
            </div>
          )}
        </div>
      ),
      sorter: (a: DomainDetails, b: DomainDetails) => a.domain.localeCompare(b.domain),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      sorter: (a: DomainDetails, b: DomainDetails) => a.plan.localeCompare(b.plan),
    },
    {
      title: "Created Date",
      dataIndex: "createdDate",
      render: (text: string) => text ? new Date(text).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
      sorter: (a: DomainDetails, b: DomainDetails) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    },
    {
      title: "Domain Status",
      dataIndex: "status",
      render: (text: string) => {
        let badgeClass = "badge-soft-secondary";
        let icon = "ti-clock";
        if (text === 'APPROVED') {
          badgeClass = "badge-soft-success";
          icon = "ti-check";
        } else if (text === 'PENDING') {
          badgeClass = "badge-soft-warning";
          icon = "ti-hourglass-low";
        } else if (text === 'REJECTED') {
          badgeClass = "badge-soft-danger";
          icon = "ti-x";
        }

        return (
          <span className={`badge ${badgeClass} d-inline-flex align-items-center px-2 py-1 fs-12 font-semibold`}>
            <i className={`ti ${icon} me-1 fs-13`} />
            {text}
          </span>
        );
      },
      sorter: (a: DomainDetails, b: DomainDetails) => a.status.localeCompare(b.status),
    },
    {
      title: "Approval Action",
      dataIndex: "status",
      render: (text: string, record: DomainDetails) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            to="#"
            className="btn btn-icon btn-sm btn-light border rounded-circle d-inline-flex align-items-center justify-content-center shadow-xs"
            style={{ width: "32px", height: "32px" }}
            data-bs-toggle="modal"
            data-bs-target="#domain_detail"
            onClick={() => handleSelectDomain(record)}
            title="View Details"
          >
            <i className="ti ti-eye fs-15 text-secondary" />
          </Link>

          {record.status === 'PENDING' && (
            <div className="d-inline-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-sm btn-success d-inline-flex align-items-center px-2 py-1 rounded shadow-xs fs-12 fw-medium"
                style={{ whiteSpace: "nowrap" }}
                onClick={() => handleUpdateStatus(record.id, 'APPROVED')}
                title="Approve Domain Request"
              >
                <i className="ti ti-check me-1 fs-14" /> Approve
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center px-2 py-1 rounded shadow-xs fs-12 fw-medium"
                style={{ whiteSpace: "nowrap" }}
                onClick={() => handleUpdateStatus(record.id, 'REJECTED')}
                title="Reject Domain Request"
              >
                <i className="ti ti-x me-1 fs-14" /> Reject
              </button>
            </div>
          )}

          {record.status === 'APPROVED' && (
            <span className="text-success fs-12 fw-semibold d-inline-flex align-items-center gap-1">
              <i className="ti ti-circle-check-filled fs-15" /> Active & Registered
            </span>
          )}

          {record.status === 'REJECTED' && (
            <span className="text-danger fs-12 fw-semibold d-inline-flex align-items-center gap-1">
              <i className="ti ti-circle-x-filled fs-15" /> Request Rejected
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {message && (
            <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
            </div>
          )}

          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Domain Requests</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Super Admin</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Domain List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Domain Approval Requests</h5>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center">Loading domain requests...</div>
              ) : (
                <Table dataSource={domains} columns={columns} Selection={true} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Domain Detail Modal */}
      <div className="modal fade" id="domain_detail">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title d-flex align-items-center">
                Domain Details & Approval
                <span className={`badge ${selectedDomain?.status === 'APPROVED' ? 'bg-outline-success' : selectedDomain?.status === 'PENDING' ? 'bg-outline-skyblue' : 'bg-outline-danger'} ms-2`}>
                  {selectedDomain?.status}
                </span>
              </h4>
              <button
                id="close-domain-modal"
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body pb-3">
              {selectedDomain && (
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <div className="p-3 rounded bg-light">
                      <h6 className="fw-bold mb-1">{selectedDomain.companyName}</h6>
                      <p className="text-muted mb-0">{selectedDomain.email}</p>
                    </div>
                  </div>

                  <div className="col-md-12 mb-3">
                    <label className="form-label fw-bold text-dark fs-13 mb-1">
                      Company Domain / Corporate Email Domain <span className="text-muted fw-normal">(Domain used for company employees)</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-secondary">
                        <i className="ti ti-world fs-14" />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={editDomain}
                        onChange={(e) => setEditDomain(e.target.value.toLowerCase().replace(/^https?:\/\//, ''))}
                        placeholder="e.g. hgsinfotech.com"
                      />
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-1">
                      <small className="text-muted fs-11">
                        Active Domain: <strong className="text-primary">{editDomain || 'N/A'}</strong>
                        {selectedDomain.companyCode && (
                          <span className="ms-2 text-dark font-monospace">[{selectedDomain.companyCode}]</span>
                        )}
                      </small>
                      {editDomain !== (selectedDomain.emailDomain || selectedDomain.domain) && (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-primary py-1 px-2 fs-11"
                          onClick={() => handleUpdateStatus(selectedDomain.id, 'UPDATE_ONLY', editDomain)}
                        >
                          Save Domain Change
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <span className="fs-12 text-muted">Subscription Plan</span>
                    <h6 className="fw-normal">{selectedDomain.plan}</h6>
                  </div>
                  <div className="col-md-6 mb-3">
                    <span className="fs-12 text-muted">Created Date</span>
                    <h6 className="fw-normal">{new Date(selectedDomain.createdDate).toLocaleDateString()}</h6>
                  </div>
                  <div className="col-md-12 mb-3">
                    <span className="fs-12 text-muted">Current Approval Status</span>
                    <h6 className="fw-normal">{selectedDomain.status}</h6>
                  </div>

                  <div className="col-md-12 mt-3 d-flex justify-content-end gap-2">
                    {selectedDomain.status === 'PENDING' && (
                      <>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleUpdateStatus(selectedDomain.id, 'REJECTED')}
                        >
                          Reject Domain
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={() => handleUpdateStatus(selectedDomain.id, 'APPROVED', editDomain)}
                        >
                          Approve & Activate Company
                        </button>
                      </>
                    )}
                    {selectedDomain.status === 'APPROVED' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleUpdateStatus(selectedDomain.id, 'APPROVED', editDomain)}
                      >
                        Update Domain Configuration
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Domain;