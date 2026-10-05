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
  subdomain: string;
  plan: string;
  createdDate: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | string;
}

const Domain = () => {
  const [domains, setDomains] = useState<DomainDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainDetails | null>(null);
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

  const handleUpdateStatus = async (domainId: number, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await apiClient.put(`/subscriptions/domains/${domainId}/status`, { status: newStatus });
      setMessage({ type: 'success', text: res.data?.message || `Domain request ${newStatus.toLowerCase()} successfully!` });
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
              <Link to="#" onClick={() => setSelectedDomain(record)} data-bs-toggle="modal" data-bs-target="#domain_detail">
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
      title: "Subdomain / Domain URL",
      dataIndex: "domain",
      render: (text: string) => <span className="text-primary fw-medium">{text}</span>,
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
      render: (text: string, record: DomainDetails) => {
        const badgeClass = text === 'APPROVED' ? 'badge-soft-success' : text === 'PENDING' ? 'badge-soft-info' : 'badge-soft-danger';
        return (
          <span className={`badge ${badgeClass} d-inline-flex align-items-center badge-xs`}>
            <i className="ti ti-checks me-1" />
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
        <div className="action-icon d-inline-flex align-items-center">
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#domain_detail"
            onClick={() => setSelectedDomain(record)}
          >
            <i className="ti ti-eye fs-16" />
          </Link>
          {record.status === 'PENDING' && (
            <>
              <button
                className="btn btn-sm btn-success me-1 py-0 px-2"
                onClick={() => handleUpdateStatus(record.id, 'APPROVED')}
                title="Approve Domain Request"
              >
                <i className="ti ti-check me-1" /> Approve
              </button>
              <button
                className="btn btn-sm btn-outline-danger py-0 px-2"
                onClick={() => handleUpdateStatus(record.id, 'REJECTED')}
                title="Reject Domain Request"
              >
                <i className="ti ti-x me-1" /> Reject
              </button>
            </>
          )}
          {record.status === 'APPROVED' && (
            <span className="text-success fs-12 fw-semibold">
              <i className="ti ti-check" /> Active & Registered
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
                Domain Details
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
                  <div className="col-md-6 mb-3">
                    <span className="fs-12 text-muted">Domain URL</span>
                    <h6 className="fw-normal text-primary">{selectedDomain.domain}</h6>
                  </div>
                  <div className="col-md-6 mb-3">
                    <span className="fs-12 text-muted">Plan</span>
                    <h6 className="fw-normal">{selectedDomain.plan}</h6>
                  </div>
                  <div className="col-md-6 mb-3">
                    <span className="fs-12 text-muted">Created Date</span>
                    <h6 className="fw-normal">{new Date(selectedDomain.createdDate).toLocaleDateString()}</h6>
                  </div>
                  <div className="col-md-6 mb-3">
                    <span className="fs-12 text-muted">Domain Status</span>
                    <h6 className="fw-normal">{selectedDomain.status}</h6>
                  </div>
                  {selectedDomain.status === 'PENDING' && (
                    <div className="col-md-12 mt-3 d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleUpdateStatus(selectedDomain.id, 'REJECTED')}
                      >
                        Reject Domain
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleUpdateStatus(selectedDomain.id, 'APPROVED')}
                      >
                        Approve & Activate Company
                      </button>
                    </div>
                  )}
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