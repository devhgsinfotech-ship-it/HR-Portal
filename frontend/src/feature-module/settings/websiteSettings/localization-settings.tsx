import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import apiClient from "../../../core/utils/apiClient";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../../../core/data/redux/authSlice";

interface LocalizationData {
  language: string;
  languageSwitcher: boolean;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  financialYear: string;
  startingMonth: string;
  currency: string;
  currencySymbol: string;
  currencyPosition: string;
  decimalSeparator: string;
  thousandSeparator: string;
  countriesRestriction: string;
}

const Localizationsettings = () => {
  const routes = all_routes;
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth?.user);
  const isSuperAdmin = (user?.role || "").toUpperCase() === "SUPER_ADMIN";

  const [initialData, setInitialData] = useState<LocalizationData | null>(null);

  // Localization Fields State
  const [language, setLanguage] = useState<string>("English");
  const [languageSwitcher, setLanguageSwitcher] = useState<boolean>(false);
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState<string>("DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState<string>("12 Hours");
  const [financialYear, setFinancialYear] = useState<string>("2026-2027");
  const [startingMonth, setStartingMonth] = useState<string>("April");

  // Currency Information State
  const [currency, setCurrency] = useState<string>("INR");
  const [currencySymbol, setCurrencySymbol] = useState<string>("₹");
  const [currencyPosition, setCurrencyPosition] = useState<string>("Front");
  const [decimalSeparator, setDecimalSeparator] = useState<string>(".");
  const [thousandSeparator, setThousandSeparator] = useState<string>(",");

  // Country Settings State
  const [countriesRestriction, setCountriesRestriction] = useState<string>("Allow All Countries");

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  // Fetch localization data dynamically from DB
  const fetchSettings = async () => {
    try {
      setLoading(true);
      if (isSuperAdmin) {
        const res = await apiClient.get("/system-settings");
        if (res.data?.success && res.data.settings) {
          const s = res.data.settings;
          const loaded: LocalizationData = {
            language: s.language || "English",
            languageSwitcher: Boolean(s.languageSwitcher),
            timezone: s.timezone || "Asia/Kolkata",
            dateFormat: s.dateFormat || "DD/MM/YYYY",
            timeFormat: s.timeFormat || "12 Hours",
            financialYear: s.financialYear || "2026-2027",
            startingMonth: s.startingMonth || "April",
            currency: s.currency || "INR",
            currencySymbol: s.currencySymbol || (s.currency === "USD" ? "$" : "₹"),
            currencyPosition: s.currencyPosition || "Front",
            decimalSeparator: s.decimalSeparator || ".",
            thousandSeparator: s.thousandSeparator || ",",
            countriesRestriction: s.countriesRestriction || "Allow All Countries",
          };
          setInitialData(loaded);
          applyToState(loaded);
        }
      } else {
        const res = await apiClient.get("/auth/company-settings");
        if (res.data?.success && res.data.company) {
          const comp = res.data.company;
          const s = comp.settings || {};
          const loaded: LocalizationData = {
            language: s.language || "English",
            languageSwitcher: Boolean(s.languageSwitcher),
            timezone: s.timezone || "Asia/Kolkata",
            dateFormat: s.dateFormat || "DD/MM/YYYY",
            timeFormat: s.timeFormat || "12 Hours",
            financialYear: s.financialYear || "2026-2027",
            startingMonth: s.startingMonth || "April",
            currency: s.currency || comp.currency || "INR",
            currencySymbol: s.currencySymbol || comp.currencySymbol || (comp.currency === "USD" ? "$" : "₹"),
            currencyPosition: s.currencyPosition || "Front",
            decimalSeparator: s.decimalSeparator || ".",
            thousandSeparator: s.thousandSeparator || ",",
            countriesRestriction: s.countriesRestriction || "Allow All Countries",
          };
          setInitialData(loaded);
          applyToState(loaded);
        }
      }
    } catch (e: any) {
      console.error("Failed to load localization settings:", e);
      setAlert({
        type: "danger",
        message: e.response?.data?.message || "Failed to load localization settings from server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyToState = (data: LocalizationData) => {
    setLanguage(data.language);
    setLanguageSwitcher(data.languageSwitcher);
    setTimezone(data.timezone);
    setDateFormat(data.dateFormat);
    setTimeFormat(data.timeFormat);
    setFinancialYear(data.financialYear);
    setStartingMonth(data.startingMonth);
    setCurrency(data.currency);
    setCurrencySymbol(data.currencySymbol);
    setCurrencyPosition(data.currencyPosition);
    setDecimalSeparator(data.decimalSeparator);
    setThousandSeparator(data.thousandSeparator);
    setCountriesRestriction(data.countriesRestriction);
  };

  useEffect(() => {
    fetchSettings();
  }, [isSuperAdmin]);

  // When currency changes, automatically adjust default currency symbol
  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    const newSym = newCurr === "USD" ? "$" : "₹";
    setCurrencySymbol(newSym);
  };

  // Reset to loaded state
  const handleCancel = () => {
    if (initialData) {
      applyToState(initialData);
      setAlert(null);
    }
  };

  // Save changes to DB
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setAlert(null);

      const payload = {
        language,
        languageSwitcher,
        timezone,
        dateFormat,
        timeFormat,
        financialYear,
        startingMonth,
        currency,
        currencySymbol,
        currencyPosition,
        decimalSeparator,
        thousandSeparator,
        countriesRestriction,
      };

      if (isSuperAdmin) {
        const res = await apiClient.put("/system-settings", payload);
        if (res.data?.success) {
          dispatch(updateUser({ currency, currencySymbol }));
          window.dispatchEvent(new CustomEvent("companyCurrencyUpdated", { detail: { currency, currencySymbol } }));
          setInitialData(payload);
          setAlert({
            type: "success",
            message: `System localization and currency (${currency}) updated successfully! Attendance tracking & live logs will use ${timezone}.`,
          });
        }
      } else {
        const res = await apiClient.put("/auth/company-settings", payload);
        if (res.data?.success) {
          dispatch(updateUser({ currency, currencySymbol }));
          window.dispatchEvent(new CustomEvent("companyCurrencyUpdated", { detail: { currency, currencySymbol } }));
          setInitialData(payload);
          setAlert({
            type: "success",
            message: `Company localization and currency (${currency}) updated successfully! Attendance punch calculations & shift timings will use timezone ${timezone}.`,
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to save localization settings:", err);
      setAlert({
        type: "danger",
        message: err.response?.data?.message || "Failed to save localization settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Dropdown options
  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Hindi", label: "Hindi (हिंदी)" },
    { value: "Spanish", label: "Spanish (Español)" },
    { value: "French", label: "French (Français)" },
    { value: "German", label: "German (Deutsch)" },
    { value: "Arabic", label: "Arabic (العربية)" },
  ];

  const timezoneOptions = [
    { value: "Asia/Kolkata", label: "(UTC +05:30) Asia/Kolkata (IST - India Standard Time)" },
    { value: "UTC", label: "(UTC +00:00) UTC (Universal Time Coordinated)" },
    { value: "America/New_York", label: "(UTC -05:00) America/New_York (EST/EDT - Eastern Time)" },
    { value: "America/Chicago", label: "(UTC -06:00) America/Chicago (CST/CDT - Central Time)" },
    { value: "America/Denver", label: "(UTC -07:00) America/Denver (MST/MDT - Mountain Time)" },
    { value: "America/Los_Angeles", label: "(UTC -08:00) America/Los_Angeles (PST/PDT - Pacific Time)" },
    { value: "Europe/London", label: "(UTC +00:00) Europe/London (GMT/BST - UK)" },
    { value: "Europe/Paris", label: "(UTC +01:00) Europe/Paris (CET - Central Europe)" },
    { value: "Europe/Berlin", label: "(UTC +01:00) Europe/Berlin (CET - Germany)" },
    { value: "Asia/Dubai", label: "(UTC +04:00) Asia/Dubai (GST - UAE & Gulf)" },
    { value: "Asia/Singapore", label: "(UTC +08:00) Asia/Singapore (SGT - Singapore)" },
    { value: "Asia/Tokyo", label: "(UTC +09:00) Asia/Tokyo (JST - Japan)" },
    { value: "Australia/Sydney", label: "(UTC +10:00) Australia/Sydney (AEST - Australia)" },
    { value: "America/Toronto", label: "(UTC -05:00) America/Toronto (EST - Canada)" },
  ];

  const dateOptions = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (e.g. 14/10/2026)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (e.g. 2026-10-14)" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (e.g. 10/14/2026)" },
    { value: "DD-MM-YYYY", label: "DD-MM-YYYY (e.g. 14-10-2026)" },
    { value: "DD MMM YYYY", label: "DD MMM YYYY (e.g. 14 Oct 2026)" },
  ];

  const timeFormatOptions = [
    { value: "12 Hours", label: "12 Hours (e.g. 09:30 AM / 06:30 PM)" },
    { value: "24 Hours", label: "24 Hours (e.g. 09:30 / 18:30)" },
  ];

  const yearOptions = [
    { value: "2026-2027", label: "2026-2027" },
    { value: "2025-2026", label: "2025-2026" },
    { value: "2024-2025", label: "2024-2025" },
    { value: "2023-2024", label: "2023-2024" },
    { value: "2026", label: "2026" },
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
  ];

  const monthOptions = [
    { value: "April", label: "April (Standard Indian Financial Year)" },
    { value: "January", label: "January (Calendar Year)" },
    { value: "July", label: "July (Australian Financial Year)" },
    { value: "October", label: "October (US Fiscal Year)" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
    { value: "May", label: "May" },
    { value: "June", label: "June" },
    { value: "August", label: "August" },
    { value: "September", label: "September" },
    { value: "November", label: "November" },
    { value: "December", label: "December" },
  ];

  const currencyOptions = [
    { value: "INR", label: "INR (Indian Rupee - ₹)" },
    { value: "USD", label: "USD (US Dollar - $)" },
  ];

  const symbolOptions = [
    { value: "₹", label: "₹ (INR Rupee Symbol)" },
    { value: "$", label: "$ (USD Dollar Symbol)" },
  ];

  const positionOptions = [
    { value: "Front", label: "Front (e.g. ₹100 / $100)" },
    { value: "Behind", label: "Behind (e.g. 100₹ / 100$)" },
  ];

  const decimalOptions = [
    { value: ".", label: ". (Dot - e.g. 1,000.00)" },
    { value: ",", label: ", (Comma - e.g. 1.000,00)" },
  ];

  const thousandOptions = [
    { value: ",", label: ", (Comma - e.g. 10,000)" },
    { value: ".", label: ". (Dot - e.g. 10.000)" },
    { value: "Space", label: "Space (e.g. 10 000)" },
  ];

  const countryRestrictionOptions = [
    { value: "Allow All Countries", label: "Allow All Countries" },
    { value: "India Only", label: "India Only" },
    { value: "United States Only", label: "United States Only" },
    { value: "Deny All Countries", label: "Deny All Countries" },
  ];

  return (
    <div>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Settings</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Website Settings</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Localization Settings
                  </li>
                </ol>
              </nav>
            </div>
            <div className="head-icons ms-2">
              <CollapseHeader />
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Top Settings Tabs */}
          <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3">
            <li className="nav-item">
              <Link className="nav-link" to={routes.profilesettings}>
                <i className="ti ti-settings me-2" />
                General Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to={routes.businessSettings}>
                <i className="ti ti-world-cog me-2" />
                Website Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.salarySettings}>
                <i className="ti ti-device-ipad-horizontal-cog me-2" />
                App Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.emailSettings}>
                <i className="ti ti-server-cog me-2" />
                System Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.paymentGateways}>
                <i className="ti ti-settings-dollar me-2" />
                Financial Settings
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to={routes.customCss}>
                <i className="ti ti-settings-2 me-2" />
                Other Settings
              </Link>
            </li>
          </ul>

          <div className="row">
            {/* Left Sidebar */}
            <div className="col-xl-3 theiaStickySidebar">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex flex-column list-group settings-list">
                    <Link
                      to={routes.companySettings}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      Company Settings
                    </Link>
                    <Link
                      to={routes.seoSettings}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      SEO Settings
                    </Link>
                    <Link
                      to={routes.localizationSettings}
                      className="d-inline-flex align-items-center rounded active py-2 px-3"
                    >
                      <i className="ti ti-arrow-badge-right me-2" />
                      Localization
                    </Link>
                    <Link
                      to={routes.authenticationSettings}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      Authentication Settings
                    </Link>
                    <Link
                      to={routes.aiSettings}
                      className="d-inline-flex align-items-center rounded py-2 px-3"
                    >
                      AI Settings
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="col-xl-9">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3">
                    <div>
                      <h4 className="mb-1">Localization</h4>
                      <p className="text-muted fs-13 mb-0">
                        Configure platform language, date/time formatting, operating timezone (powers attendance tracking &amp; shift punches), and currency.
                      </p>
                    </div>
                    {loading && (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    )}
                  </div>

                  {alert && (
                    <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                      {alert.message}
                      <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close" />
                    </div>
                  )}

                  <form onSubmit={handleSave}>
                    {/* Localization Section */}
                    <div className="border-bottom mb-3 pb-2">
                      <div className="row">
                        {/* Language */}
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Language</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                              >
                                {languageOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <div className="form-check form-switch mt-2">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  id="languageSwitcherToggle"
                                  checked={languageSwitcher}
                                  onChange={(e) => setLanguageSwitcher(e.target.checked)}
                                />
                                <label className="form-check-label fs-13" htmlFor="languageSwitcherToggle">
                                  Language Switcher
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Timezone (Critical for Attendance Tracking) */}
                        <div className="col-md-6">
                          <div className="row align-items-start mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">
                                Timezone
                                <span className="badge bg-light-primary text-primary ms-1 fs-11">Attendance</span>
                              </label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                              >
                                {timezoneOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <small className="text-muted d-block mt-1 fs-12">
                                <i className="ti ti-info-circle me-1" />
                                Controls employee punch-in timestamps, office shift calculations, and late marks.
                              </small>
                            </div>
                          </div>
                        </div>

                        {/* Date Format */}
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Date Format</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={dateFormat}
                                onChange={(e) => setDateFormat(e.target.value)}
                              >
                                {dateOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Time Format */}
                        <div className="col-md-6">
                          <div className="row align-items-start mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">
                                Time Format
                                <span className="badge bg-light-info text-info ms-1 fs-11">Clock</span>
                              </label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={timeFormat}
                                onChange={(e) => setTimeFormat(e.target.value)}
                              >
                                {timeFormatOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <small className="text-muted d-block mt-1 fs-12">
                                <i className="ti ti-clock me-1" />
                                Sets 12 Hours (AM/PM) or 24 Hours on punch logs and dashboard.
                              </small>
                            </div>
                          </div>
                        </div>

                        {/* Financial Year */}
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Financial Year</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={financialYear}
                                onChange={(e) => setFinancialYear(e.target.value)}
                              >
                                {yearOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Starting Month */}
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Starting Month</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={startingMonth}
                                onChange={(e) => setStartingMonth(e.target.value)}
                              >
                                {monthOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Currency Information */}
                    <div className="border-bottom mb-3 pb-2">
                      <h6 className="mb-3 fw-bold text-dark">
                        <i className="ti ti-currency-dollar me-1 text-primary" />
                        Currency Information
                      </h6>
                      <div className="row">
                        {/* Currency */}
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Currency</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={currency}
                                onChange={(e) => handleCurrencyChange(e.target.value)}
                              >
                                {currencyOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Currency Symbol */}
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Currency Symbol</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={currencySymbol}
                                onChange={(e) => setCurrencySymbol(e.target.value)}
                              >
                                {symbolOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Currency Position */}
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Currency Position</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={currencyPosition}
                                onChange={(e) => setCurrencyPosition(e.target.value)}
                              >
                                {positionOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Decimal Separator */}
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Decimal Separator</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={decimalSeparator}
                                onChange={(e) => setDecimalSeparator(e.target.value)}
                              >
                                {decimalOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Thousand Separator */}
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Thousand Separator</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={thousandSeparator}
                                onChange={(e) => setThousandSeparator(e.target.value)}
                              >
                                {thousandOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Country Settings */}
                    <div className="border-bottom mb-3 pb-2">
                      <h6 className="mb-3 fw-bold text-dark">
                        <i className="ti ti-map-pin me-1 text-primary" />
                        Country Settings
                      </h6>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="row align-items-center mb-3">
                            <div className="col-md-5">
                              <label className="form-label mb-md-0 fw-semibold">Countries Restriction</label>
                            </div>
                            <div className="col-md-7">
                              <select
                                className="form-select"
                                value={countriesRestriction}
                                onChange={(e) => setCountriesRestriction(e.target.value)}
                              >
                                {countryRestrictionOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex align-items-center justify-content-end gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                            Saving...
                          </>
                        ) : (
                          "Save Localization & Currency"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
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
    </div>
  );
};

export default Localizationsettings;
