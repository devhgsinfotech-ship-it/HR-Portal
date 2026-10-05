import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import apiClient from '../../core/utils/apiClient';

const Membershipplan = () => {
  const routes = all_routes;
  const [plans, setPlans] = useState<any[]>([]);
  const [companySub, setCompanySub] = useState<any>(null);
  const [isYearly, setIsYearly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [upgrading, setUpgrading] = useState<number | null>(null);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subRes, plansRes] = await Promise.all([
        apiClient.get('/subscriptions/company').catch(() => null),
        apiClient.get('/super-admin/plans').catch(() => null)
      ]);

      if (subRes?.data) setCompanySub(subRes.data);
      if (plansRes?.data && Array.isArray(plansRes.data)) {
        setPlans(plansRes.data.filter((p: any) => p.isActive));
      }
    } catch (err) {
      console.error('Error loading membership data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleUpgradePlan = async (planId: number, planName: string) => {
    try {
      setUpgrading(planId);
      const cycle = isYearly ? 'YEARLY' : 'MONTHLY';
      const res = await apiClient.post('/subscriptions/company/change-plan', {
        planId,
        billingCycle: cycle
      });

      alert(res.data?.message || `Successfully changed plan to ${planName}.`);
      fetchSubscriptionData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to change plan.');
    } finally {
      setUpgrading(null);
    }
  };

  const getFeatureList = (features: any): string[] => {
    if (Array.isArray(features)) return features;
    if (features && typeof features === 'object') {
      return Object.keys(features).filter(k => features[k] === true);
    }
    return [];
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header */}
        <div className="d-md-flex d-block align-items-center justify-content-between mb-3">
          <div className="my-auto mb-2">
            <h3 className="page-title mb-1">Subscription &amp; Membership Plans</h3>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={routes.adminDashboard}>Dashboard</Link>
                </li>
                <li className="breadcrumb-item">Membership</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Membership Plans
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Current Subscription Status Card */}
        {companySub && (
          <div className="card bg-primary-transparent border-primary mb-4">
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-7">
                  <span className="badge bg-primary mb-2">ACTIVE PLAN</span>
                  <h3 className="text-dark fw-bold mb-1">
                    {companySub.plan?.name} ({companySub.billingCycle || 'MONTHLY'})
                  </h3>
                  <p className="text-muted fs-13 mb-3">
                    {companySub.plan?.description || 'Your current active organization subscription.'}
                  </p>

                  <div className="d-flex align-items-center flex-wrap gap-4">
                    <div>
                      <span className="text-muted fs-12 d-block">EMPLOYEE QUOTA</span>
                      <h5 className={`mb-0 ${companySub.currentEmployeeCount >= companySub.maxEmployees ? 'text-danger' : 'text-dark'}`}>
                        {companySub.currentEmployeeCount} / {companySub.maxEmployees} Employees
                      </h5>
                    </div>
                    <div>
                      <span className="text-muted fs-12 d-block">STORAGE LIMIT</span>
                      <h5 className="mb-0 text-dark">
                        {companySub.plan?.maxStorageGb || 5} GB
                      </h5>
                    </div>
                    <div>
                      <span className="text-muted fs-12 d-block">STATUS</span>
                      <span className={`badge ${companySub.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'} fs-12`}>
                        {companySub.status === 'TRIAL' ? `14-Day Trial (${companySub.trialDaysLeft} days left)` : companySub.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-md-5 text-md-end mt-3 mt-md-0">
                  <div className="p-3 bg-white rounded-3 border d-inline-block text-center shadow-sm">
                    <span className="text-muted fs-12">Price</span>
                    <h2 className="text-primary fw-bold mb-0">
                      ₹{(companySub.billingCycle === 'YEARLY' ? companySub.plan?.priceYearly : companySub.plan?.priceMonthly)?.toLocaleString('en-IN')}
                      <span className="fs-13 text-muted fw-normal">/{companySub.billingCycle === 'YEARLY' ? 'year' : 'month'}</span>
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly / Yearly Billing Toggle */}
        <div className="card border-0 mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-center">
              <h5 className={`mb-0 ${!isYearly ? 'text-primary fw-bold' : 'text-muted'}`}>Monthly Billing</h5>
              <div className="form-check form-check-md form-switch mx-3 mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={isYearly}
                  onChange={(e) => setIsYearly(e.target.checked)}
                />
              </div>
              <h5 className={`mb-0 ${isYearly ? 'text-primary fw-bold' : 'text-muted'}`}>
                Yearly Billing <span className="badge bg-success-transparent text-success fs-12 ms-1">Save up to 17%</span>
              </h5>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading plans...</span>
            </div>
          </div>
        ) : (
          <div className="row">
            {plans.map((p) => {
              const isCurrent = companySub?.plan?.id === p.id;
              const featList = getFeatureList(p.features);
              const price = isYearly ? p.priceYearly : p.priceMonthly;

              return (
                <div className="col-lg-4 col-md-6 d-flex mb-4" key={p.id}>
                  <div className={`card flex-fill w-100 ${isCurrent ? 'border-2 border-primary shadow-sm' : 'border'}`}>
                    <div className="card-body d-flex flex-column">
                      <div className="border-bottom pb-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h4 className="fw-bold mb-0">{p.name}</h4>
                          {isCurrent && <span className="badge bg-primary">Current Plan</span>}
                        </div>
                        <p className="text-muted fs-13 mb-0">
                          {p.description || 'Flexible HR suite tailored for your team.'}
                        </p>
                      </div>

                      <div className="bg-light p-3 rounded-3 text-center mb-3">
                        <h2 className="text-dark fw-bold mb-0">
                          ₹{price?.toLocaleString('en-IN')}
                          <span className="text-muted fs-13 fw-normal">/{isYearly ? 'yr' : 'mo'}</span>
                        </h2>
                        <span className="fs-12 text-muted">Up to {p.maxEmployees} Employees • {p.maxStorageGb} GB Storage</span>
                      </div>

                      <h6 className="fw-semibold mb-2 fs-13 text-uppercase text-muted">Enabled Modules</h6>
                      <ul className="list-unstyled flex-grow-1 mb-4">
                        {featList.length > 0 ? (
                          featList.map((f: string) => (
                            <li className="mb-2" key={f}>
                              <div className="d-flex align-items-center">
                                <span className="text-success me-2">
                                  <i className="ti ti-circle-check-filled fs-16 align-middle" />
                                </span>
                                <span className="fs-14 text-dark">{f}</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted fs-13">Core HR Access</li>
                        )}
                      </ul>

                      <div className="mt-auto">
                        {isCurrent ? (
                          <button className="btn btn-light w-100 text-muted border fw-semibold" disabled>
                            <i className="ti ti-check me-1" /> Active Plan
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary w-100 fw-semibold"
                            disabled={upgrading === p.id}
                            onClick={() => handleUpgradePlan(p.id, p.name)}
                          >
                            {upgrading === p.id 
                              ? 'Updating Plan...' 
                              : (companySub?.plan?.maxEmployees && p.maxEmployees < companySub.plan.maxEmployees)
                                ? `Degrade to ${p.name}`
                                : `Upgrade to ${p.name}`
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Membershipplan;
