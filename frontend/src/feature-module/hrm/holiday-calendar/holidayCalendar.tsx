import React, { useState, useEffect, useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Modal from "react-bootstrap/Modal";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import CommonFooter from "@/core/common/commonFooter/footer";
import apiClient from "../../../core/utils/apiClient";

interface HolidayRecord {
  id: number;
  title: string;
  holidayDate: string;
  description: string;
  isNational: boolean;
}

const HolidayCalendars = () => {
  const routes = all_routes;
  const calendarRef = useRef<FullCalendar | null>(null);

  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "danger"; text: string } | null>(null);

  // Selected Event Details Modal
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form State for Adding Holiday
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsNational, setNewIsNational] = useState(true);

  // User Role
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("authUser") || "{}");
    } catch {
      return {};
    }
  })();
  const userRole = (currentUser?.role || "").toUpperCase();
  const canManage = ["SUPER_ADMIN", "COMPANY_ADMIN", "HR"].includes(userRole);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/holidays");
      setHolidays(res.data || []);
    } catch (err: any) {
      console.error("Failed to load holidays:", err);
      setFeedbackMsg({
        type: "danger",
        text: err.response?.data?.message || "Failed to load company holidays",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleEventClick = (info: any) => {
    const ext = info.event.extendedProps;
    setSelectedHoliday({
      id: Number(info.event.id),
      title: info.event.title,
      holidayDate: info.event.startStr,
      description: ext?.description || "",
      isNational: ext?.isNational ?? false,
    });
    setShowDetailsModal(true);
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) {
      alert("Please provide holiday name and date.");
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post("/api/holidays", {
        title: newTitle,
        holidayDate: newDate,
        description: newDescription,
        isNational: newIsNational,
      });

      setFeedbackMsg({
        type: "success",
        text: `Holiday "${newTitle}" added to the company calendar!`,
      });

      setNewTitle("");
      setNewDate("");
      setNewDescription("");
      setNewIsNational(true);

      document.getElementById("close_add_holiday_modal")?.click();
      fetchHolidays();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add holiday");
    } finally {
      setSubmitting(false);
    }
  };

  // Format events for FullCalendar
  const calendarEvents = useMemo(() => {
    return holidays.map((h) => {
      const dateStr = h.holidayDate ? h.holidayDate.split("T")[0] : "";
      return {
        id: String(h.id),
        title: h.title,
        start: dateStr,
        allDay: true,
        backgroundColor: h.isNational ? "#4f46e5" : "#0284c7",
        borderColor: "transparent",
        textColor: "#ffffff",
        extendedProps: {
          description: h.description,
          isNational: h.isNational,
        },
      };
    });
  }, [holidays]);

  // Upcoming holidays list
  const upcomingHolidays = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return holidays
      .filter((h) => {
        const d = h.holidayDate ? h.holidayDate.split("T")[0] : "";
        return d >= today;
      })
      .slice(0, 5);
  }, [holidays]);

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Company Holiday Calendar</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Attendance</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Holiday Calendar
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap gap-2">
              {canManage && (
                <button
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#add_holiday_modal"
                  className="btn btn-primary d-inline-flex align-items-center"
                >
                  <i className="ti ti-calendar-plus me-1" />
                  Add New Holiday
                </button>
              )}
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>

          {/* Feedback Msg */}
          {feedbackMsg && (
            <div
              className={`alert alert-${feedbackMsg.type} alert-dismissible fade show d-flex align-items-center mb-3`}
              role="alert"
            >
              <i
                className={`ti ${
                  feedbackMsg.type === "success" ? "ti-circle-check" : "ti-alert-triangle"
                } fs-18 me-2`}
              />
              <div>{feedbackMsg.text}</div>
              <button type="button" className="btn-close" onClick={() => setFeedbackMsg(null)} />
            </div>
          )}

          <div className="row">
            {/* Calendar Main Grid */}
            <div className="col-xl-9 col-lg-8">
              <div className="card shadow-sm border-0">
                <div className="card-body p-3">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 text-muted">Syncing holiday calendar...</p>
                    </div>
                  ) : (
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      events={calendarEvents}
                      headerToolbar={{
                        start: "today,prev,next",
                        center: "title",
                        end: "dayGridMonth,dayGridWeek,dayGridDay",
                      }}
                      eventClick={handleEventClick}
                      ref={calendarRef}
                      height="auto"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Side Panel: Legends & Upcoming Holidays */}
            <div className="col-xl-3 col-lg-4">
              {/* Legend Card */}
              <div className="card shadow-sm border-0 mb-3">
                <div className="card-header bg-transparent pb-2">
                  <h6 className="card-title mb-0 fw-semibold">Event Categories</h6>
                </div>
                <div className="card-body pt-2">
                  <div className="d-flex align-items-center mb-2">
                    <span
                      className="d-inline-block rounded-circle me-2"
                      style={{ width: "12px", height: "12px", backgroundColor: "#4f46e5" }}
                    />
                    <span className="fs-13 text-dark fw-medium">National Holiday</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <span
                      className="d-inline-block rounded-circle me-2"
                      style={{ width: "12px", height: "12px", backgroundColor: "#0284c7" }}
                    />
                    <span className="fs-13 text-dark fw-medium">Company / Optional Holiday</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Holidays Card */}
              <div className="card shadow-sm border-0">
                <div className="card-header bg-transparent pb-2 d-flex align-items-center justify-content-between">
                  <h6 className="card-title mb-0 fw-semibold">Upcoming Holidays</h6>
                  <span className="badge badge-soft-primary">{upcomingHolidays.length}</span>
                </div>
                <div className="card-body p-0">
                  {upcomingHolidays.length === 0 ? (
                    <div className="text-center py-4 px-3 text-muted fs-13">
                      <i className="ti ti-calendar-off fs-24 mb-1 d-block" />
                      No upcoming holidays scheduled.
                    </div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {upcomingHolidays.map((h) => {
                        const dateFormatted = h.holidayDate ? h.holidayDate.split("T")[0] : "";
                        return (
                          <li
                            key={h.id}
                            className="list-group-item d-flex align-items-center justify-content-between p-3"
                          >
                            <div>
                              <h6 className="fs-13 fw-semibold mb-1">{h.title}</h6>
                              <span className="fs-12 text-muted">
                                <i className="ti ti-calendar me-1" />
                                {dateFormatted}
                              </span>
                            </div>
                            <span
                              className={`badge ${
                                h.isNational ? "badge-soft-primary" : "badge-soft-info"
                              } fs-11`}
                            >
                              {h.isNational ? "National" : "Company"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CommonFooter />
      </div>

      {/* Holiday Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} centered>
        <div className="modal-header bg-primary text-white">
          <h5 className="modal-title text-white d-flex align-items-center">
            <i className="ti ti-calendar-event me-2" />
            Holiday Details
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowDetailsModal(false)}
            aria-label="Close"
          />
        </div>
        <div className="modal-body">
          {selectedHoliday && (
            <div>
              <h4 className="fw-bold text-dark mb-2">{selectedHoliday.title}</h4>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="badge badge-soft-primary fs-12">
                  <i className="ti ti-calendar me-1" />
                  {selectedHoliday.holidayDate}
                </span>
                <span
                  className={`badge ${
                    selectedHoliday.isNational ? "badge-soft-success" : "badge-soft-info"
                  } fs-12`}
                >
                  {selectedHoliday.isNational ? "National Public Holiday" : "Company / Optional"}
                </span>
              </div>
              {selectedHoliday.description ? (
                <p className="text-muted fs-13 mb-0">{selectedHoliday.description}</p>
              ) : (
                <p className="text-muted fst-italic fs-13 mb-0">No extra description provided.</p>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowDetailsModal(false)}
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Add New Holiday Modal */}
      {canManage && (
        <div id="add_holiday_modal" className="modal custom-modal fade" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-md" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="ti ti-calendar-plus me-2 text-primary" />
                  Add Holiday to Calendar
                </h5>
                <button
                  id="close_add_holiday_modal"
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleAddHoliday}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">
                        Holiday Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Diwali, Independence Day, Christmas"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">
                        Holiday Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="isNationalSwitch"
                          checked={newIsNational}
                          onChange={(e) => setNewIsNational(e.target.checked)}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="isNationalSwitch">
                          Is National / Mandatory Public Holiday
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Description / Remarks</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Optional remarks about office closure or holiday significance..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Saving Holiday...
                      </>
                    ) : (
                      "Save Holiday"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HolidayCalendars;
