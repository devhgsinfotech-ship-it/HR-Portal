import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../utils/apiClient";
import CommonTextEditor from "../common/textEditor";
import { useAppSelector } from "../../core/data/redux/store";

interface Client {
  id: number;
  companyName: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  Name: string;
}

const ProjectModals = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  
  const canReadFinance = currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'HR' ||
    currentUser?.role === 'MANAGER' ||
    currentUser?.permissions?.some(p => p.module === 'FINANCE' && p.canRead);

  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // New Project Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [companyManagerId, setCompanyManagerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [health, setHealth] = useState("GOOD");
  const [projectStatus, setProjectStatus] = useState("ACTIVE");

  const [addActiveTab, setAddActiveTab] = useState<"basic" | "members">("basic");
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [teamLeadIds, setTeamLeadIds] = useState<number[]>([]);

  // Attachments & Logo State
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [message, setMessage] = useState("");

  const fetchMetadata = async () => {
    try {
      const [clientRes, empRes] = await Promise.all([
        apiClient.get("/api/clients"),
        apiClient.get("/employees")
      ]);
      if (clientRes.data?.success) {
        setClients(clientRes.data.data);
      }
      if (Array.isArray(empRes.data)) {
        setEmployees(empRes.data.map((emp: any) => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          Name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
        })));
      }
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  };

  useEffect(() => {
    // Only fetch metadata if modal opens, or do it on mount. On mount is fine for dashboard.
    fetchMetadata();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setMessage("");
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post("/api/projects/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        setAttachmentUrl(res.data.url);
      }
    } catch (err: any) {
      console.error("File upload failed:", err);
      setMessage(err.response?.data?.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploading(true);
      setMessage("");
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post("/api/projects/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        setLogoUrl(res.data.url);
      }
    } catch (err: any) {
      console.error("Logo upload failed:", err);
      setMessage(err.response?.data?.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId) return;
    try {
      setMessage("");
      const payload = {
        name,
        description,
        clientId: parseInt(clientId, 10),
        managerId: companyManagerId ? parseInt(companyManagerId, 10) : null,
        projectManagerId: managerId ? parseInt(managerId, 10) : null,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        budget: budget ? parseFloat(budget) : null,
        priority,
        health,
        status: projectStatus,
        memberIds: memberIds,
        teamLeadIds: teamLeadIds,
        attachmentUrl: attachmentUrl,
        logoUrl: logoUrl
      };

      const res = await apiClient.post("/api/projects", payload);
      if (res.data?.success) {
        setName("");
        setDescription("");
        setClientId("");
        setManagerId("");
        setCompanyManagerId("");
        setStartDate("");
        setEndDate("");
        setBudget("");
        setPriority("MEDIUM");
        setHealth("GOOD");
        setProjectStatus("ACTIVE");
        setMemberIds([]);
        setTeamLeadIds([]);
        setAttachmentUrl("");
        setLogoUrl("");
        setAddActiveTab("basic");
        
        window.dispatchEvent(new Event('projectAdded'));

        const closeBtn = document.getElementById("close-add-project-modal");
        if (closeBtn) closeBtn.click();
      }
    } catch (err: any) {
      console.error("Failed to create project:", err);
      setMessage(err.response?.data?.message || "Failed to create project.");
    }
  };

  return (
    <>
      <div className="modal fade" id="add_project" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header header-border align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <h5 className="modal-title me-2 fw-semibold">Add Project</h5>
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                id="close-add-project-modal"
              />
            </div>

            <div className="p-3 pb-0">
              <ul className="progress-bar-wizard d-flex align-items-center border-bottom pb-2 mb-3" style={{ listStyle: "none", paddingLeft: 0, gap: "15px" }}>
                <li
                  className={`pb-1 ${addActiveTab === "basic" ? "active border-bottom border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setAddActiveTab("basic")}
                >
                  <h6 className="fw-medium mb-0" style={{ color: addActiveTab === "basic" ? "#ff5b35" : "#666" }}>Basic Information</h6>
                </li>
                <li
                  className={`pb-1 ${addActiveTab === "members" ? "active border-bottom border-primary" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setAddActiveTab("members")}
                >
                  <h6 className="fw-medium mb-0" style={{ color: addActiveTab === "members" ? "#ff5b35" : "#666" }}>Members</h6>
                </li>
              </ul>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="modal-body pt-0">
                {message && <div className="alert alert-danger mb-3">{message}</div>}
                {addActiveTab === "basic" && (
                  <div className="row animate__animated animate__fadeIn">
                    <div className="col-md-12 mb-3">
                      <div className="d-flex align-items-center flex-wrap row-gap-3 bg-light w-100 rounded p-3 mb-2">
                        <div className="d-flex align-items-center justify-content-center avatar avatar-xxl rounded-circle border border-dashed me-3 flex-shrink-0 text-dark bg-white" style={{ width: "80px", height: "80px", border: "1px dashed #ccc" }}>
                          {logoUrl ? (
                            <img src={`${apiClient.defaults.baseURL || ''}${logoUrl}`} alt="logo" className="rounded-circle" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <i className="ti ti-photo text-gray-2 fs-24 text-muted" />
                          )}
                        </div>
                        <div className="profile-upload flex-grow-1">
                          <div className="mb-2">
                            <h6 className="mb-1 fw-semibold fs-14">Upload Project Logo</h6>
                            <p className="fs-12 text-muted mb-0">Image should be below 4 MB (PNG, JPG)</p>
                          </div>
                          <div className="profile-uploader d-flex align-items-center gap-2">
                            <div className="drag-upload-btn btn btn-sm btn-primary position-relative" style={{ overflow: "hidden" }}>
                              {logoUploading ? "Uploading..." : "Upload Logo"}
                              <input
                                type="file"
                                className="position-absolute top-0 start-0 opacity-0 w-100 h-100 cursor-pointer"
                                accept="image/*"
                                onChange={(e) => handleLogoUpload(e)}
                                style={{ cursor: "pointer" }}
                              />
                            </div>
                            {logoUrl && (
                              <button type="button" className="btn btn-light btn-sm text-danger" onClick={() => setLogoUrl("")}>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Project Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Website Overhaul"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Client <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Client --</option>
                        {clients.map(c => (
                          <option value={c.id} key={c.id}>{c.companyName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13">End Date (Deadline)</label>
                      <input
                        type="date"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    {canReadFinance && (
                      <div className="col-md-6 mb-3">
                        <label className="form-label fs-13">Project Value / Budget (₹ INR)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 500000"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fs-13">Priority</label>
                      <select
                        className="form-select"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Description</label>
                      <CommonTextEditor
                        value={description}
                        onChange={(val) => setDescription(val)}
                        placeholder="Outline scope, goals and milestones..."
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Upload Document or PDF</label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={(e) => handleFileUpload(e)}
                      />
                      {uploading && <small className="text-primary d-block mt-1">Uploading file...</small>}
                      {attachmentUrl && (
                        <div className="mt-1">
                          <small className="text-success">Uploaded successfully: </small>
                          <a href={`${apiClient.defaults.baseURL || ''}${attachmentUrl}`} target="_blank" rel="noreferrer" className="text-decoration-underline text-primary fs-12 ms-1">
                            Download Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {addActiveTab === "members" && (
                  <div className="row animate__animated animate__fadeIn">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13 me-2">Allocate Team Leads</label>

                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {teamLeadIds.map(id => {
                          const emp = employees.find(e => e.id === id);
                          return (
                            <span key={id} className="badge bg-info text-white p-2 d-inline-flex align-items-center gap-2">
                              {emp ? emp.Name : `ID: ${id}`}
                              <i
                                className="ti ti-x cursor-pointer fs-12"
                                style={{ cursor: "pointer" }}
                                onClick={() => setTeamLeadIds(teamLeadIds.filter(tId => tId !== id))}
                              />
                            </span>
                          );
                        })}
                      </div>

                      <select
                        className="form-select"
                        onChange={(e) => {
                          const idVal = parseInt(e.target.value, 10);
                          if (idVal && !teamLeadIds.includes(idVal)) {
                            setTeamLeadIds([...teamLeadIds, idVal]);
                            // Also remove from members if they were there
                            setMemberIds(memberIds.filter(mId => mId !== idVal));
                          }
                          e.target.value = ""; // Reset select
                        }}
                      >
                        <option value="">-- Click to allocate team lead --</option>
                        {employees
                          .filter(e => !teamLeadIds.includes(e.id))
                          .map(e => (
                            <option value={e.id} key={e.id}>{e.Name}</option>
                          ))}
                      </select>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13 me-2">Allocate Team Members</label>

                      <div className="d-flex flex-wrap gap-2 mb-2">
                        {memberIds.map(id => {
                          const emp = employees.find(e => e.id === id);
                          return (
                            <span key={id} className="badge bg-primary text-white p-2 d-inline-flex align-items-center gap-2">
                              {emp ? emp.Name : `ID: ${id}`}
                              <i
                                className="ti ti-x cursor-pointer fs-12"
                                style={{ cursor: "pointer" }}
                                onClick={() => setMemberIds(memberIds.filter(mId => mId !== id))}
                              />
                            </span>
                          );
                        })}
                      </div>

                      <select
                        className="form-select"
                        onChange={(e) => {
                          const idVal = parseInt(e.target.value, 10);
                          if (idVal && !memberIds.includes(idVal)) {
                            setMemberIds([...memberIds, idVal]);
                            // Also remove from team leads if they were there
                            setTeamLeadIds(teamLeadIds.filter(tId => tId !== idVal));
                          }
                          e.target.value = ""; // Reset select
                        }}
                      >
                        <option value="">-- Click to allocate member --</option>
                        {employees
                          .filter(e => !memberIds.includes(e.id) && !teamLeadIds.includes(e.id))
                          .map(e => (
                            <option value={e.id} key={e.id}>{e.Name}</option>
                          ))}
                      </select>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Manager</label>
                      <select
                        className="form-select"
                        value={companyManagerId}
                        onChange={(e) => setCompanyManagerId(e.target.value)}
                      >
                        <option value="">-- Choose Manager --</option>
                        {employees.map(e => (
                          <option value={e.id} key={e.id}>{e.Name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Project Manager</label>
                      <select
                        className="form-select"
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value)}
                      >
                        <option value="">-- Choose PM --</option>
                        {employees.map(e => (
                          <option value={e.id} key={e.id}>{e.Name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label fs-13">Status</label>
                      <select
                        className="form-select"
                        value={projectStatus}
                        onChange={(e) => setProjectStatus(e.target.value)}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                {addActiveTab === "basic" ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!name || !clientId) {
                        setMessage("Please fill out the required fields (Project Name and Client) before proceeding.");
                        return;
                      }
                      setMessage("");
                      setAddActiveTab("members");
                    }}
                  >
                    Next: Add Members
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-success text-white"
                    disabled={!name || !clientId}
                  >
                    Create Project
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectModals;
