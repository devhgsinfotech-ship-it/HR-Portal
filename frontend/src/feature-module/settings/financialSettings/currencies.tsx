import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import React, { useState, useEffect } from "react";
import apiClient from "../../../core/utils/apiClient";

const routes = all_routes;

interface CurrencyItem {
    id: number;
    name: string;
    code: string;
    symbol: string;
    symbolPosition: string;
    exchangeRate?: number;
    isDefault: boolean;
    status: string;
}

const Currencies: React.FC = () => {
    const [currencies, setCurrencies] = useState<CurrencyItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [alert, setAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);

    // Modal state
    const [newCurrency, setNewCurrency] = useState({
        name: "",
        code: "",
        symbol: "",
        symbolPosition: "Front",
        status: "Active",
        isDefault: false,
    });

    const [editCurrency, setEditCurrency] = useState<CurrencyItem | null>(null);
    const [deleteCurrencyItem, setDeleteCurrencyItem] = useState<CurrencyItem | null>(null);

    const fetchCurrencies = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get("/system-settings/currencies");
            if (res.data?.success && Array.isArray(res.data.currencies)) {
                setCurrencies(res.data.currencies);
            }
        } catch (err: any) {
            console.error("Failed to load currencies:", err);
            setAlert({ type: "danger", message: "Failed to load currencies from server." });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrencies();
    }, []);

    const handleSetDefault = async (currencyId: number, code: string, symbol: string) => {
        try {
            setActionLoading(true);
            setAlert(null);
            const res = await apiClient.post("/system-settings/set-default-currency", { currencyId });
            if (res.data?.success) {
                setAlert({
                    type: "success",
                    message: `Default currency changed to ${code} (${symbol}) successfully!`,
                });
                fetchCurrencies();
            }
        } catch (err: any) {
            console.error("Failed to set default currency:", err);
            setAlert({
                type: "danger",
                message: err.response?.data?.message || "Failed to set default currency.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddCurrencySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCurrency.name || !newCurrency.code || !newCurrency.symbol) {
            setAlert({ type: "danger", message: "Name, code, and symbol are required." });
            return;
        }

        try {
            setActionLoading(true);
            setAlert(null);
            const res = await apiClient.post("/system-settings/currencies", newCurrency);
            if (res.data?.success) {
                setAlert({ type: "success", message: `Currency ${newCurrency.code} added successfully!` });
                setNewCurrency({
                    name: "",
                    code: "",
                    symbol: "",
                    symbolPosition: "Front",
                    status: "Active",
                    isDefault: false,
                });
                // Close modal via data-bs-dismiss or programmatically
                const closeBtn = document.getElementById("close_add_currency_modal");
                if (closeBtn) closeBtn.click();
                fetchCurrencies();
            }
        } catch (err: any) {
            console.error("Failed to add currency:", err);
            setAlert({
                type: "danger",
                message: err.response?.data?.message || "Failed to add currency.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditCurrencySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editCurrency) return;

        try {
            setActionLoading(true);
            setAlert(null);
            const res = await apiClient.put(`/system-settings/currencies/${editCurrency.id}`, editCurrency);
            if (res.data?.success) {
                setAlert({ type: "success", message: `Currency ${editCurrency.code} updated successfully!` });
                const closeBtn = document.getElementById("close_edit_currency_modal");
                if (closeBtn) closeBtn.click();
                fetchCurrencies();
            }
        } catch (err: any) {
            console.error("Failed to update currency:", err);
            setAlert({
                type: "danger",
                message: err.response?.data?.message || "Failed to update currency.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCurrencyConfirm = async () => {
        if (!deleteCurrencyItem) return;

        try {
            setActionLoading(true);
            setAlert(null);
            const res = await apiClient.delete(`/system-settings/currencies/${deleteCurrencyItem.id}`);
            if (res.data?.success) {
                setAlert({ type: "success", message: `Currency ${deleteCurrencyItem.code} deleted successfully!` });
                const closeBtn = document.getElementById("close_delete_currency_modal");
                if (closeBtn) closeBtn.click();
                fetchCurrencies();
            }
        } catch (err: any) {
            console.error("Failed to delete currency:", err);
            setAlert({
                type: "danger",
                message: err.response?.data?.message || "Failed to delete currency.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Settings</h2>
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={routes.adminDashboard}>
                                            <i className="ti ti-smart-home" aria-hidden="true" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Finance Settings</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Currencies Settings
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="head-icons ms-2">
                            <CollapseHeader />
                        </div>
                    </div>

                    {/* Nav tabs */}
                    <ul className="nav nav-tabs nav-tabs-solid bg-transparent border-bottom mb-3">
                        <li className="nav-item">
                            <Link className="nav-link" to={routes.profilesettings}>
                                <i className="ti ti-settings me-2" aria-hidden="true" />
                                General Settings
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to={routes.businessSettings}>
                                <i className="ti ti-world-cog me-2" aria-hidden="true" />
                                Website Settings
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to={routes.salarySettings}>
                                <i className="ti ti-device-ipad-horizontal-cog me-2" aria-hidden="true" />
                                App Settings
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to={routes.emailSettings}>
                                <i className="ti ti-server-cog me-2" aria-hidden="true" />
                                System Settings
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to={routes.paymentGateways}>
                                <i className="ti ti-settings-dollar me-2" aria-hidden="true" />
                                Financial Settings
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to={routes.customCss}>
                                <i className="ti ti-settings-2 me-2" aria-hidden="true" />
                                Other Settings
                            </Link>
                        </li>
                    </ul>

                    {/* Alert Banner */}
                    {alert && (
                        <div
                            className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center mb-3`}
                            role="alert"
                        >
                            <i
                                className={`ti ${
                                    alert.type === "success" ? "ti-circle-check" : "ti-alert-triangle"
                                } fs-18 me-2`}
                            />
                            <div className="flex-grow-1">{alert.message}</div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setAlert(null)}
                                aria-label="Close"
                            />
                        </div>
                    )}

                    <div className="row">
                        {/* Sidebar links */}
                        <div className="col-xl-3 theiaStickySidebar">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex flex-column list-group settings-list">
                                        <Link
                                            to={routes.paymentGateways}
                                            className="d-inline-flex align-items-center rounded py-2 px-3"
                                        >
                                            Payment Gateways
                                        </Link>
                                        <Link
                                            to={routes.taxRates}
                                            className="d-inline-flex align-items-center rounded py-2 px-3"
                                        >
                                            Tax Rates
                                        </Link>
                                        <Link
                                            to={routes.currencies}
                                            className="d-inline-flex align-items-center rounded active py-2 px-3"
                                            aria-current="page"
                                        >
                                            <i className="ti ti-arrow-badge-right me-2" aria-hidden="true" />
                                            Currencies
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="col-xl-9">
                            <div className="card">
                                <div className="card-header px-0 mx-3">
                                    <div className="row g-3 align-items-center">
                                        <div className="col-md-6 col-sm-4">
                                            <h4>Currencies List</h4>
                                            <p className="text-muted fs-12 mb-0">
                                                Manage available currencies and configure the active default currency for the platform.
                                            </p>
                                        </div>
                                        <div className="col-md-6 col-sm-8">
                                            <div className="d-flex justify-content-sm-end align-items-center flex-wrap row-gap-2 gap-2">
                                                <span className="badge bg-primary-transparent text-primary py-2 px-3 fs-13">
                                                    <i className="ti ti-arrows-exchange me-1" /> Multi-Currency Active (INR ₹ &amp; USD $)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body pb-0">
                                    <div className="card mb-3 border">
                                        <div className="card-body p-0">
                                            {loading ? (
                                                <div className="text-center py-5">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading currencies...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="table-responsive">
                                                    <table className="table align-middle">
                                                        <thead className="thead-light">
                                                            <tr>
                                                                <th>Currency Name</th>
                                                                <th>Symbol</th>
                                                                <th>Code</th>
                                                                <th>Exchange Rate</th>
                                                                <th>Status</th>
                                                                <th>Default</th>
                                                                <th className="text-end">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {currencies.map((c) => (
                                                                <tr key={c.id}>
                                                                    <td>
                                                                        <h6 className="d-flex align-items-center fw-medium mb-0">
                                                                            {c.name}
                                                                        </h6>
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-light text-dark fs-13">
                                                                            {c.symbol}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <strong>{c.code}</strong>
                                                                    </td>
                                                                    <td>
                                                                        {c.code === 'INR' ? (
                                                                            <span className="text-muted fs-12">1.0 (Base Price)</span>
                                                                        ) : (
                                                                            <span className="badge bg-light text-dark fs-12">
                                                                                1 USD = {c.exchangeRate ? c.exchangeRate.toFixed(2) : '84.00'} INR (Live API)
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <span
                                                                            className={`badge badge-${
                                                                                c.status === "Active" ? "success" : "danger"
                                                                            } d-inline-flex align-items-center badge-xs`}
                                                                        >
                                                                            <i className="ti ti-point-filled me-1" aria-hidden="true" />
                                                                            {c.status}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {c.isDefault ? (
                                                                            <span className="badge bg-primary-transparent text-primary fw-semibold">
                                                                                <i className="ti ti-check me-1" /> Active Default
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-primary py-0 px-2 fs-12"
                                                                                onClick={() => handleSetDefault(c.id, c.code, c.symbol)}
                                                                                disabled={actionLoading}
                                                                            >
                                                                                Set as Default
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <div className="action-icon d-inline-flex gap-1">
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-link p-1 text-muted"
                                                                                data-bs-toggle="modal"
                                                                                data-bs-target="#edit_new_currency"
                                                                                aria-label={`Edit ${c.name}`}
                                                                                onClick={() => setEditCurrency({ ...c })}
                                                                            >
                                                                                <i className="ti ti-edit fs-16" aria-hidden="true" />
                                                                            </button>
                                                                            {!c.isDefault && (
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-link p-1 text-danger"
                                                                                    data-bs-toggle="modal"
                                                                                    data-bs-target="#delete_modal"
                                                                                    aria-label={`Delete ${c.name}`}
                                                                                    onClick={() => setDeleteCurrencyItem(c)}
                                                                                >
                                                                                    <i className="ti ti-trash fs-16" aria-hidden="true" />
                                                                                </button>
                                                                            )}
                                                                        </div>
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Add New Currency Modal */}
            <div className="modal fade" id="add_new_currency">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Add New Currency</h4>
                            <button
                                id="close_add_currency_modal"
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" aria-hidden="true" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCurrencySubmit}>
                            <div className="modal-body pb-0">
                                <div className="mb-3">
                                    <label className="form-label">
                                        Currency Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. US Dollar"
                                        value={newCurrency.name}
                                        onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Currency Symbol <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. $"
                                        value={newCurrency.symbol}
                                        onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Currency Code (ISO) <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control text-uppercase"
                                        placeholder="e.g. USD"
                                        value={newCurrency.code}
                                        onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div className="d-flex mb-3">
                                    <label className="form-label me-3">Currency Position</label>
                                    <div className="form-check me-3">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="currencyPosition"
                                            id="add_pos_front"
                                            checked={newCurrency.symbolPosition === "Front"}
                                            onChange={() => setNewCurrency({ ...newCurrency, symbolPosition: "Front" })}
                                        />
                                        <label className="form-check-label" htmlFor="add_pos_front">
                                            Front ($100)
                                        </label>
                                    </div>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            name="currencyPosition"
                                            type="radio"
                                            id="add_pos_behind"
                                            checked={newCurrency.symbolPosition === "Behind"}
                                            onChange={() => setNewCurrency({ ...newCurrency, symbolPosition: "Behind" })}
                                        />
                                        <label className="form-check-label" htmlFor="add_pos_behind">
                                            Behind (100$)
                                        </label>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={newCurrency.status}
                                        onChange={(e) => setNewCurrency({ ...newCurrency, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="form-check mb-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="add_is_default"
                                        checked={newCurrency.isDefault}
                                        onChange={(e) => setNewCurrency({ ...newCurrency, isDefault: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="add_is_default">
                                        Set as platform default currency
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                    {actionLoading ? "Adding..." : "Add Currency"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Edit Currency Modal */}
            <div className="modal fade" id="edit_new_currency">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Edit Currency</h4>
                            <button
                                id="close_edit_currency_modal"
                                type="button"
                                className="btn-close custom-btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            >
                                <i className="ti ti-x" aria-hidden="true" />
                            </button>
                        </div>
                        {editCurrency && (
                            <form onSubmit={handleEditCurrencySubmit}>
                                <div className="modal-body pb-0">
                                    <div className="mb-3">
                                        <label className="form-label">Currency Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editCurrency.name}
                                            onChange={(e) => setEditCurrency({ ...editCurrency, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Currency Symbol</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editCurrency.symbol}
                                            onChange={(e) => setEditCurrency({ ...editCurrency, symbol: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Currency Code</label>
                                        <input
                                            type="text"
                                            className="form-control text-uppercase"
                                            value={editCurrency.code}
                                            onChange={(e) => setEditCurrency({ ...editCurrency, code: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>
                                    <div className="d-flex mb-3">
                                        <label className="form-label me-3">Currency Position</label>
                                        <div className="form-check me-3">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="currencyPositionEdit"
                                                id="edit_pos_front"
                                                checked={editCurrency.symbolPosition === "Front"}
                                                onChange={() => setEditCurrency({ ...editCurrency, symbolPosition: "Front" })}
                                            />
                                            <label className="form-check-label" htmlFor="edit_pos_front">
                                                Front
                                            </label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                name="currencyPositionEdit"
                                                type="radio"
                                                id="edit_pos_behind"
                                                checked={editCurrency.symbolPosition === "Behind"}
                                                onChange={() => setEditCurrency({ ...editCurrency, symbolPosition: "Behind" })}
                                            />
                                            <label className="form-check-label" htmlFor="edit_pos_behind">
                                                Behind
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={editCurrency.status}
                                            onChange={(e) => setEditCurrency({ ...editCurrency, status: e.target.value })}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="form-check mb-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="edit_is_default"
                                            checked={editCurrency.isDefault}
                                            onChange={(e) => setEditCurrency({ ...editCurrency, isDefault: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="edit_is_default">
                                            Set as platform default currency
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                                        {actionLoading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <div className="modal fade" id="delete_modal">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-body text-center p-4">
                            <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                                <i className="ti ti-trash-x fs-36" aria-hidden="true" />
                            </span>
                            <h4 className="mb-1">Confirm Delete Currency</h4>
                            <p className="mb-3 text-muted">
                                Are you sure you want to remove <strong>{deleteCurrencyItem?.name} ({deleteCurrencyItem?.code})</strong>?
                            </p>
                            <div className="d-flex justify-content-center gap-2">
                                <button
                                    id="close_delete_currency_modal"
                                    type="button"
                                    className="btn btn-light"
                                    data-bs-dismiss="modal"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleDeleteCurrencyConfirm}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? "Deleting..." : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Currencies;
