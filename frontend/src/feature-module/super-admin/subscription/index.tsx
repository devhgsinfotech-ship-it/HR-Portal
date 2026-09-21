import { Link } from 'react-router-dom'
import { all_routes } from '../../../router/all_routes'
import CollapseHeader from '../../../core/common/collapse-header/collapse-header'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import ReactApexChart from "react-apexcharts";
import PredefinedDateRanges from '../../../core/common/datePicker'
import Table from "../../../core/common/dataTable/index";
import React, { useState, useEffect } from 'react';
import apiClient from '../../../core/utils/apiClient';

interface SubscriptionDetails {
  id: number;
  companyId: number;
  CompanyName: string;
  Image: string;
  Plan: string;
  BillCycle: string;
  PaymentMethod: string;
  Amount: string;
  CreatedDate: string;
  ExpiringDate: string;
  Status: string;
  trialDaysLeft: number;
  adminEmail: string;
}

const Subscription = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalSubsCount, setTotalSubsCount] = useState<number>(0);
  const [activeSubsCount, setActiveSubsCount] = useState<number>(0);
  const [expiredSubsCount, setExpiredSubsCount] = useState<number>(0);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/super-admin/subscriptions');
      const data = response.data;
      if (Array.isArray(data)) {
        let active = 0;
        let expired = 0;

        const formatted: SubscriptionDetails[] = data.map((sub: any) => {
          if (sub.status === 'ACTIVE' || sub.status === 'TRIAL') active++;
          if (sub.status === 'EXPIRED') expired++;

          return {
            id: sub.id,
            companyId: sub.companyId,
            CompanyName: sub.companyName,
            Image: sub.companyLogo || 'company-01.svg',
            Plan: `${sub.planName} (${sub.billingCycle})`,
            BillCycle: sub.billingCycle === 'YEARLY' ? '365' : '30',
            PaymentMethod: sub.lastInvoice?.paymentMethod || 'Credit Card / Stripe',
            Amount: `₹${(sub.billingCycle === 'YEARLY' ? sub.priceYearly : sub.priceMonthly).toLocaleString('en-IN')}`,
            CreatedDate: sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A',
            ExpiringDate: sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : 'N/A',
            Status: sub.status,
            trialDaysLeft: sub.trialDaysLeft,
            adminEmail: sub.adminEmail
          };
        });

        setSubscriptions(formatted);
        setTotalSubsCount(data.length);
        setActiveSubsCount(active);
        setExpiredSubsCount(expired);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleExtendTrial = async (companyId: number) => {
    try {
      await apiClient.post(`/super-admin/subscriptions/${companyId}/extend-trial`, { extraDays: 14 });
      alert('Successfully extended trial by 14 days!');
      fetchSubscriptions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to extend trial');
    }
  };

  const columns = [
    {
      title: "Company Name",
      dataIndex: "CompanyName",
      render: (_text: string, record: SubscriptionDetails) => (
        <div className="d-flex align-items-center file-name-icon">
          <div className="avatar avatar-md border rounded-circle bg-light d-flex align-items-center justify-content-center">
            <span className="fw-bold text-primary">{record.CompanyName.charAt(0)}</span>
          </div>
          <div className="ms-2">
            <h6 className="fw-medium mb-0">{record.CompanyName}</h6>
            <span className="fs-12 text-muted">{record.adminEmail}</span>
          </div>
        </div>
      ),
      sorter: (a: SubscriptionDetails, b: SubscriptionDetails) => a.CompanyName.localeCompare(b.CompanyName),
    },
    {
      title: "Plan",
      dataIndex: "Plan",
      sorter: (a: SubscriptionDetails, b: SubscriptionDetails) => a.Plan.localeCompare(b.Plan),
    },
    {
      title: "Billing Cycle",
      dataIndex: "BillCycle",
      render: (_text: string, record: SubscriptionDetails) => (
        <span>{record.BillCycle} Days</span>
      ),
      sorter: (a: SubscriptionDetails, b: SubscriptionDetails) => a.BillCycle.localeCompare(b.BillCycle),
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      sorter: (a: SubscriptionDetails, b: SubscriptionDetails) => a.Amount.localeCompare(b.Amount),
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      sorter: (a: SubscriptionDetails, b: SubscriptionDetails) => a.CreatedDate.localeCompare(b.CreatedDate),
    },
    {
      title: "Trial / Expiry",
      dataIndex: "ExpiringDate",
      render: (_text: string, record: SubscriptionDetails) => (
        <div>
          <div>{record.ExpiringDate}</div>
          {record.Status === 'TRIAL' && (
            <span className="badge badge-info-transparent">{record.trialDaysLeft} days left</span>
          )}
        </div>
      ),
      sorter: (a: SubscriptionDetails, b: SubscriptionDetails) => a.ExpiringDate.localeCompare(b.ExpiringDate),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => {
        let badgeClass = 'badge-secondary';
        if (text === 'ACTIVE') badgeClass = 'badge-success';
        if (text === 'TRIAL') badgeClass = 'badge-warning';
        if (text === 'EXPIRED') badgeClass = 'badge-danger';
        return (
          <span className={`badge ${badgeClass} d-inline-flex align-items-center badge-xs`}>
            <i className="ti ti-point-filled me-1" />
            {text}
          </span>
        );
      },
      sorter: (a: SubscriptionDetails, b: SubscriptionDetails) => a.Status.localeCompare(b.Status),
    },
    {
      title: "Action",
      dataIndex: "actions",
      render: (_text: string, record: SubscriptionDetails) => (
        <div className="action-icon d-inline-flex align-items-center">
          <button
            className="btn btn-xs btn-outline-primary me-2"
            onClick={() => handleExtendTrial(record.companyId)}
            title="Extend Trial (+14 Days)"
          >
            +14d Trial
          </button>
        </div>
      ),
    },
  ];

  const [totalTransaction] = React.useState<any>({
    series: [{
      name: "",
      data: [6, 2, 8, 4, 3, 8, 1, 3, 6, 5, 9, 2, 8, 1, 4, 8, 9, 8, 2, 1]
    }],
    fill: {
      type: 'solid',
      opacity: 1
    },
    chart: {
      foreColor: '#fff',
      type: "area",
      width: 80,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        enabled: 0,
        top: 3,
        left: 14,
        blur: 4,
        opacity: .12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#F7A37A"],
      strokeColors: "#fff",
      strokeWidth: 0,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        endingShape: "rounded"
      }
    },
    dataLabels: {
      enabled: !1
    },
    // stroke: {
    //   show: !0,
    //   width: 2.5,
    //   curve: "smooth"
    // },
    stroke: {
      width: 0,
      curve: 'monotoneCubic'
    },
    colors: ["#F7A37A"],
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },

      marker: {
        show: !1
      }
    }
  })
  const [totalSubscription] = React.useState<any>({
    series: [{
      name: "",
      data: [6, 2, 8, 4, 3, 8, 1, 3, 6, 5, 9, 2, 8, 1, 4, 8, 9, 8, 2, 1]
    }],
    fill: {
      type: 'solid',
      opacity: 1
    },
    chart: {
      foreColor: '#fff',
      type: "area",
      width: 80,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        enabled: 0,
        top: 3,
        left: 14,
        blur: 4,
        opacity: .12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#70B1FF"],
      strokeColors: "#fff",
      strokeWidth: 0,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        endingShape: "rounded"
      }
    },
    dataLabels: {
      enabled: !1
    },
    // stroke: {
    //   show: !0,
    //   width: 2.5,
    //   curve: "smooth"
    // },
    stroke: {
      width: 0,
      curve: 'monotoneCubic'
    },
    colors: ["#70B1FF"],
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },

      marker: {
        show: !1
      }
    }
  })
  const [activeSubscription] = React.useState<any>({
    series: [{
      name: "",
      data: [6, 2, 8, 4, 3, 8, 1, 3, 6, 5, 9, 2, 8, 1, 4, 8, 9, 8, 2, 1]
    }],
    fill: {
      type: 'solid',
      opacity: 1
    },
    chart: {
      foreColor: '#fff',
      type: "area",
      width: 80,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        enabled: 0,
        top: 3,
        left: 14,
        blur: 4,
        opacity: .12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#60DD97"],
      strokeColors: "#fff",
      strokeWidth: 0,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        endingShape: "rounded"
      }
    },
    dataLabels: {
      enabled: !1
    },
    // stroke: {
    //   show: !0,
    //   width: 2.5,
    //   curve: "smooth"
    // },
    stroke: {
      width: 0,
      curve: 'monotoneCubic'
    },
    colors: ["#60DD97"],
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },

      marker: {
        show: !1
      }
    }
  })
  const [expiredSubscription] = React.useState<any>({
    series: [{
      name: "",
      data: [6, 2, 8, 4, 3, 8, 1, 3, 6, 5, 9, 2, 8, 1, 4, 8, 9, 8, 2, 1]
    }],
    fill: {
      type: 'solid',
      opacity: 1
    },
    chart: {
      foreColor: '#fff',
      type: "area",
      width: 80,
      toolbar: {
        show: !1
      },
      zoom: {
        enabled: !1
      },
      dropShadow: {
        enabled: 0,
        top: 3,
        left: 14,
        blur: 4,
        opacity: .12,
        color: "#fff"
      },
      sparkline: {
        enabled: !0
      }
    },
    markers: {
      size: 0,
      colors: ["#DE5555"],
      strokeColors: "#fff",
      strokeWidth: 0,
      hover: {
        size: 7
      }
    },
    plotOptions: {
      bar: {
        horizontal: !1,
        columnWidth: "35%",
        endingShape: "rounded"
      }
    },
    dataLabels: {
      enabled: !1
    },
    // stroke: {
    //   show: !0,
    //   width: 2.5,
    //   curve: "smooth"
    // },
    stroke: {
      width: 0,
      curve: 'monotoneCubic'
    },
    colors: ["#DE5555"],
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: !1
      },
      x: {
        show: !1
      },

      marker: {
        show: !1
      }
    }
  })

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Subscription</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Super Admin</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Subscription
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="row">
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Total Transaction
                          </span>
                          <h5>$5,340</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ReactApexChart
                          options={totalTransaction}
                          series={totalTransaction.series}
                          type="area"
                          width={60}
                          height={35}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        +19.01%
                      </span>
                      from last week
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Total Subscribers
                          </span>
                          <h5>{totalSubsCount}</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ReactApexChart
                          options={totalSubscription}
                          series={totalSubscription.series}
                          type="area"
                          width={60}
                          height={35}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        Live Platform Tenants
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Active Subscribers
                          </span>
                          <h5>{activeSubsCount}</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ReactApexChart
                          options={activeSubscription}
                          series={activeSubscription.series}
                          type="area"
                          width={60}
                          height={35}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-primary fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-up me-1" />
                        Active / Trial
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body ">
                  <div className="border-bottom pb-3 mb-3">
                    <div className="row align-items-center">
                      <div className="col-7">
                        <div>
                          <span className="fs-14 fw-normal text-truncate mb-1">
                            Expired Subscribers
                          </span>
                          <h5>{expiredSubsCount}</h5>
                        </div>
                      </div>
                      <div className="col-5">
                        <ReactApexChart
                          options={expiredSubscription}
                          series={expiredSubscription.series}
                          type="area"
                          width={60}
                          height={35}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex">
                    <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                      <span className="text-danger fs-12 d-flex align-items-center me-1">
                        <i className="ti ti-arrow-wave-right-down me-1" />
                        Requires Renewal
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Subscription List</h5>
            </div>
            <div className="card-body p-0">
              <Table dataSource={subscriptions} columns={columns} Selection={false} />
            </div>
          </div>
        </div>
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2026 © SmartHR.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* View Invoice */}
      <div className="modal fade" id="view_invoice">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-body p-5">
              <div className="row justify-content-between align-items-center mb-3">
                <div className="col-md-6">
                  <div className="mb-4">
                    <ImageWithBasePath
                      src="assets/img/logo.svg"
                      className="img-fluid"
                      alt="logo"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className=" text-end mb-3">
                    <h5 className="text-dark mb-1">Invoice</h5>
                    <p className="mb-1 fw-normal">
                      <i className="ti ti-file-invoice me-1" />
                      INV0287
                    </p>
                    <p className="mb-1 fw-normal">
                      <i className="ti ti-calendar me-1" />
                      Issue date : 12 Sep 2024{" "}
                    </p>
                    <p className="fw-normal">
                      <i className="ti ti-calendar me-1" />
                      Due date : 12 Oct 2024{" "}
                    </p>
                  </div>
                </div>
              </div>
              <div className="row mb-3 d-flex justify-content-between">
                <div className="col-md-7">
                  <p className="text-dark mb-2 fw-medium fs-16">Invoice From :</p>
                  <div>
                    <p className="mb-1">SmartHR</p>
                    <p className="mb-1">
                      367 Hillcrest Lane, Irvine, California, United States
                    </p>
                    <p className="mb-1">smarthr@example.com</p>
                  </div>
                </div>
                <div className="col-md-5">
                  <p className="text-dark mb-2 fw-medium fs-16">Invoice To :</p>
                  <div>
                    <p className="mb-1">BrightWave Innovations</p>
                    <p className="mb-1">
                      367 Hillcrest Lane, Irvine, California, United States
                    </p>
                    <p className="mb-1">michael@example.com</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="table-responsive mb-3">
                  <table className="table">
                    <thead className="thead-light">
                      <tr>
                        <th>Plan</th>
                        <th>Billing Cycle</th>
                        <th>Created Date</th>
                        <th>Expiring On</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Advanced (Monthly)</td>
                        <td>30 Days</td>
                        <td>12 Sep 2024</td>
                        <td>12 Oct 2024</td>
                        <td>$200</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="row mb-3 d-flex justify-content-between">
                <div className="col-md-4">
                  <div>
                    <h6 className="mb-4">Payment info:</h6>
                    <p className="mb-0">Credit Card - 123***********789</p>
                    <div className="d-flex justify-content-between align-items-center mb-2 pe-3">
                      <p className="mb-0">Amount</p>
                      <p className="text-dark fw-medium mb-2">$200.00</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Sub Total</p>
                    <p className="mb-2">$200.00</p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Tax </p>
                    <p className="mb-2">$0.00</p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Total</p>
                    <p className="text-dark fw-medium mb-2">$200.00</p>
                  </div>
                </div>
              </div>
              <div className="card border mb-0">
                <div className="card-body">
                  <p className="text-dark fw-medium mb-2">
                    Terms &amp; Conditions:
                  </p>
                  <p className="fs-12 fw-normal d-flex align-items-baseline mb-2">
                    <i className="ti ti-point-filled text-primary me-1" />
                    All payments must be made according to the agreed schedule. Late
                    payments may incur additional fees.
                  </p>
                  <p className="fs-12 fw-normal d-flex align-items-baseline">
                    <i className="ti ti-point-filled text-primary me-1" />
                    We are not liable for any indirect, incidental, or consequential
                    damages, including loss of profits, revenue, or data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /View Invoice */}
    </>


  )
}

export default Subscription