import React, { useState, useEffect, useMemo } from "react";
import apiClient from "@/core/utils/apiClient";

interface MetadataEmployee {
  id: number;
  userId?: number;
  employeeCode: string;
  name: string;
  departmentId?: number | null;
  currentShiftId?: number | null;
  currentShiftName?: string;
}

interface ShiftPolicy {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

interface PeerShiftInfo {
  id: number;
  name: string;
  employeeCode: string;
  department: string;
  designation: string;
  shiftId: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  isMatch?: boolean;
}

interface ShiftSwapModalProps {
  employees: MetadataEmployee[];
  shiftPolicies: ShiftPolicy[];
  isEmployee: boolean;
  currentEmployeeId?: number;
  onSuccess: () => void;
}

const ShiftSwapRequestsModal: React.FC<ShiftSwapModalProps> = ({
  employees,
  shiftPolicies,
  isEmployee,
  currentEmployeeId,
  onSuccess,
}) => {
  const [requesterId, setRequesterId] = useState<string>(
    currentEmployeeId ? String(currentEmployeeId) : ""
  );
  const [shiftDate, setShiftDate] = useState<string>("");
  const [requestedShiftId, setRequestedShiftId] = useState<string>("");
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Peer & Schedule dynamic lookup
  const [peersLoading, setPeersLoading] = useState(false);
  const [requesterShift, setRequesterShift] = useState<{
    shiftId: number | null;
    shiftName: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [allPeersOnDate, setAllPeersOnDate] = useState<PeerShiftInfo[]>([]);
  const [eligiblePeers, setEligiblePeers] = useState<PeerShiftInfo[]>([]);

  // Keep requesterId in sync if currentEmployeeId changes
  useEffect(() => {
    if (isEmployee && currentEmployeeId) {
      setRequesterId(String(currentEmployeeId));
    }
  }, [isEmployee, currentEmployeeId]);

  const uniqueShiftPolicies = useMemo(() => {
    const map = new Map<string, ShiftPolicy>();
    for (const sp of shiftPolicies) {
      const key = sp.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, sp);
      }
    }
    return Array.from(map.values());
  }, [shiftPolicies]);

  const activeRequesterId = isEmployee ? (currentEmployeeId ? String(currentEmployeeId) : requesterId) : requesterId;

  // Whenever shiftDate or requesterId changes, fetch active shift info and peers for this date
  useEffect(() => {
    if (!shiftDate) {
      setRequesterShift(null);
      setAllPeersOnDate([]);
      setEligiblePeers([]);
      return;
    }

    let isMounted = true;
    const fetchPeers = async () => {
      try {
        setPeersLoading(true);
        setErrorMsg("");
        const queryParams = new URLSearchParams({
          shiftDate,
          ...(activeRequesterId ? { requesterId: String(activeRequesterId) } : {}),
          ...(requestedShiftId ? { requestedShiftId: String(requestedShiftId) } : {}),
        });

        const res = await apiClient.get(`/api/shifts/swaps/eligible-peers?${queryParams.toString()}`);
        if (!isMounted) return;

        if (res.data) {
          setRequesterShift(res.data.requesterShift || null);
          setAllPeersOnDate(res.data.allPeersOnDate || []);
          setEligiblePeers(res.data.eligiblePeers || []);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Failed to load shift peers for date:", err);
      } finally {
        if (isMounted) setPeersLoading(false);
      }
    };

    fetchPeers();

    return () => {
      isMounted = false;
    };
  }, [shiftDate, activeRequesterId, requestedShiftId]);

  // Selected colleague info
  const selectedColleague = useMemo(() => {
    if (!targetEmployeeId) return null;
    return allPeersOnDate.find((p) => String(p.id) === String(targetEmployeeId)) ||
      eligiblePeers.find((p) => String(p.id) === String(targetEmployeeId)) || null;
  }, [targetEmployeeId, allPeersOnDate, eligiblePeers]);

  // Selected desired shift info
  const desiredShiftPolicy = useMemo(() => {
    if (!requestedShiftId) return null;
    return uniqueShiftPolicies.find((sp) => String(sp.id) === String(requestedShiftId)) || null;
  }, [requestedShiftId, uniqueShiftPolicies]);

  // Validation: Does the selected colleague do the desired shift on this date?
  const isColleagueOnDesiredShift = useMemo(() => {
    if (!selectedColleague || !requestedShiftId) return null;
    return String(selectedColleague.shiftId) === String(requestedShiftId);
  }, [selectedColleague, requestedShiftId]);

  // Validation: Is requester already on this desired shift?
  const isRequesterAlreadyOnDesiredShift = useMemo(() => {
    if (!requesterShift || !requestedShiftId) return false;
    return String(requesterShift.shiftId) === String(requestedShiftId);
  }, [requesterShift, requestedShiftId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isEmployee && !requesterId) {
      setErrorMsg("Please select the employee requesting the swap.");
      return;
    }
    if (!shiftDate) {
      setErrorMsg("Please specify the shift date.");
      return;
    }
    if (!requestedShiftId) {
      setErrorMsg("Please select the desired replacement shift.");
      return;
    }
    if (isRequesterAlreadyOnDesiredShift) {
      setErrorMsg("You are already assigned to this shift on the selected date.");
      return;
    }
    if (!targetEmployeeId) {
      setErrorMsg("A colleague must be selected for the shift swap.");
      return;
    }
    if (isColleagueOnDesiredShift === false) {
      setErrorMsg(
        `Validation Failed: ${selectedColleague?.name} is scheduled for "${selectedColleague?.shiftName}", not the desired shift ("${desiredShiftPolicy?.name}"). You can only swap with an employee who is currently working the desired shift.`
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      await apiClient.post("/api/shifts/swaps", {
        requesterId: isEmployee ? currentEmployeeId : requesterId,
        targetEmployeeId,
        requestedShiftId,
        shiftDate,
        reason,
      });

      // Reset
      setReason("");
      setTargetEmployeeId("");
      setShiftDate("");
      setRequestedShiftId("");
      document.getElementById("close_swap_modal")?.click();
      onSuccess();
    } catch (err: any) {
      console.error("Error creating shift swap:", err);
      setErrorMsg(err.response?.data?.message || "Failed to submit swap request");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    !!shiftDate &&
    !!requestedShiftId &&
    !!targetEmployeeId &&
    isColleagueOnDesiredShift === true &&
    !isRequesterAlreadyOnDesiredShift;

  return (
    <div className="modal fade" id="add_shift_swap_modal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-light">
            <h5 className="modal-title d-flex align-items-center text-dark">
              <i className="ti ti-arrows-shuffle me-2 text-primary fs-18" />
              Request Shift Swap
            </h5>
            <button
              id="close_swap_modal"
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errorMsg && (
                <div className="alert alert-danger py-2 fs-13 mb-3 d-flex align-items-center">
                  <i className="ti ti-alert-circle me-2 fs-16" />
                  <div>{errorMsg}</div>
                </div>
              )}

              <div className="row g-3">
                {/* If Admin/Manager, can choose employee */}
                {!isEmployee && (
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Requesting Employee <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={requesterId}
                      onChange={(e) => {
                        setRequesterId(e.target.value);
                        setTargetEmployeeId("");
                      }}
                      required
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={String(emp.id)}>
                          {emp.name} ({emp.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Shift Date */}
                <div className={!isEmployee ? "col-md-6" : "col-12"}>
                  <label className="form-label fw-semibold">
                    Shift Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={shiftDate}
                    onChange={(e) => {
                      setShiftDate(e.target.value);
                      setTargetEmployeeId("");
                    }}
                    required
                  />
                </div>

                {/* Requester's Current Shift Banner */}
                {shiftDate && requesterShift && (
                  <div className="col-12">
                    <div className="p-3 bg-light rounded border d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div className="d-flex align-items-center">
                        <i className="ti ti-calendar-time text-primary fs-20 me-2" />
                        <div>
                          <div className="fs-12 text-muted">Your Scheduled Shift on {shiftDate}:</div>
                          <div className="fw-bold text-dark fs-14">
                            {requesterShift.shiftName}{" "}
                            <span className="fw-normal text-muted">
                              ({requesterShift.startTime} - {requesterShift.endTime})
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="badge bg-primary-transparent text-primary px-3 py-2 fs-12">
                        Current Shift
                      </span>
                    </div>
                  </div>
                )}

                {/* Desired Shift Selection */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Desired Shift <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={requestedShiftId}
                    disabled={!shiftDate}
                    onChange={(e) => {
                      setRequestedShiftId(e.target.value);
                      setTargetEmployeeId("");
                    }}
                    required
                  >
                    <option value="">
                      {!shiftDate ? "-- Pick Shift Date First --" : "-- Select Desired Shift --"}
                    </option>
                    {uniqueShiftPolicies.map((sp) => {
                      const isCurrent = requesterShift && String(requesterShift.shiftId) === String(sp.id);
                      return (
                        <option
                          key={sp.id}
                          value={String(sp.id)}
                          disabled={Boolean(isCurrent)}
                        >
                          {sp.name} ({sp.startTime} - {sp.endTime}) {isCurrent ? " [Current Shift]" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {isRequesterAlreadyOnDesiredShift && (
                    <small className="text-danger d-block mt-1">
                      You are already assigned to this shift on this date.
                    </small>
                  )}
                </div>

                {/* Target Colleague to Swap With (Strict Validation) */}
                <div className="col-md-6">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label fw-semibold mb-0">
                      Swap With Colleague <span className="text-danger">*</span>
                    </label>
                    {peersLoading ? (
                      <span className="badge bg-secondary-transparent text-secondary fs-11">
                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                        Checking schedules...
                      </span>
                    ) : requestedShiftId ? (
                      eligiblePeers.length > 0 ? (
                        <span className="badge bg-success-transparent text-success fs-11">
                          ✓ {eligiblePeers.length} colleague(s) on this shift
                        </span>
                      ) : (
                        <span className="badge bg-danger-transparent text-danger fs-11">
                          0 colleagues on this shift
                        </span>
                      )
                    ) : null}
                  </div>

                  <select
                    className={`form-select ${
                      isColleagueOnDesiredShift === true
                        ? "border-success"
                        : isColleagueOnDesiredShift === false
                        ? "border-danger"
                        : ""
                    }`}
                    value={targetEmployeeId}
                    disabled={!shiftDate || peersLoading}
                    onChange={(e) => {
                      const peerId = e.target.value;
                      setTargetEmployeeId(peerId);
                      // If no desired shift selected yet, auto-select this peer's shift!
                      if (!requestedShiftId && peerId) {
                        const chosen = allPeersOnDate.find((p) => String(p.id) === peerId);
                        if (chosen?.shiftId) {
                          setRequestedShiftId(String(chosen.shiftId));
                        }
                      }
                    }}
                    required
                  >
                    <option value="">
                      {!shiftDate
                        ? "-- Pick Shift Date First --"
                        : requestedShiftId
                        ? eligiblePeers.length > 0
                          ? "-- Select Colleague Doing Desired Shift --"
                          : "-- No colleagues assigned to this shift on this date --"
                        : "-- Select Any Colleague (Shift auto-detected) --"}
                    </option>

                    {requestedShiftId ? (
                      eligiblePeers.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name} ({p.employeeCode}) — [Doing {p.shiftName}]
                        </option>
                      ))
                    ) : (
                      allPeersOnDate.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name} ({p.employeeCode}) — [Shift: {p.shiftName}]
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Validation Feedback Banner */}
                {requestedShiftId && eligiblePeers.length === 0 && !peersLoading && shiftDate && (
                  <div className="col-12">
                    <div className="alert alert-warning py-2 fs-13 mb-0 d-flex align-items-center">
                      <i className="ti ti-alert-triangle fs-18 text-warning me-2" />
                      <div>
                        <strong>Shift Swap Validation Notice:</strong> No colleagues are currently assigned to{" "}
                        <strong>{desiredShiftPolicy?.name || "this shift"}</strong> on{" "}
                        <strong>{shiftDate}</strong>. Shift swap requires another employee who is currently working the desired shift.
                      </div>
                    </div>
                  </div>
                )}

                {selectedColleague && isColleagueOnDesiredShift === true && (
                  <div className="col-12">
                    <div className="alert alert-success py-2 fs-13 mb-0 d-flex align-items-center">
                      <i className="ti ti-circle-check fs-18 text-success me-2" />
                      <div>
                        <strong>Validation Passed:</strong> {selectedColleague.name} is confirmed assigned to{" "}
                        <strong>{selectedColleague.shiftName}</strong> on {shiftDate}. You will exchange your current shift with theirs.
                      </div>
                    </div>
                  </div>
                )}

                {selectedColleague && isColleagueOnDesiredShift === false && (
                  <div className="col-12">
                    <div className="alert alert-danger py-2 fs-13 mb-0 d-flex align-items-center">
                      <i className="ti ti-circle-x fs-18 text-danger me-2" />
                      <div>
                        <strong>Validation Error:</strong> {selectedColleague.name} is scheduled for{" "}
                        <strong>"{selectedColleague.shiftName}"</strong>, not{" "}
                        <strong>"{desiredShiftPolicy?.name}"</strong>. Shift swap only works if the other employee is doing the desired shift.
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Reason for Swap Request <span className="text-muted fw-normal">(Optional)</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Provide details for personal emergency, appointment, or schedule conflict..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || peersLoading || !isFormValid}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="ti ti-arrows-shuffle me-1" />
                    Submit Swap Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShiftSwapRequestsModal;