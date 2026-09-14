import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../../core/utils/apiClient";
import { all_routes } from "../../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { APP_CONFIG } from "../../../environment";

const routes = all_routes;
const apiUrl = APP_CONFIG.getBackendUrl();

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const relativeTime = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const emptyForm = { title: "", content: "", expiresAt: "", targetType: "ALL" };

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/announcements");
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error("Failed to fetch announcements:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setImageFile(null);
    setRemoveImage(false);
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      title: item.title,
      content: item.content,
      expiresAt: item.expiresAt ? item.expiresAt.split("T")[0] : "",
      targetType: item.targetType || "ALL",
    });
    setImageFile(null);
    setRemoveImage(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("content", form.content);
      fd.append("targetType", form.targetType);
      if (form.expiresAt) fd.append("expiresAt", form.expiresAt);
      if (imageFile) fd.append("image", imageFile);
      if (removeImage) fd.append("removeImage", "true");

      if (editItem) {
        await apiClient.put(`/announcements/${editItem.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await apiClient.post("/announcements", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (e) {
      console.error("Save announcement error:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/announcements/${id}`);
      setDeleteId(null);
      fetchAnnouncements();
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const filtered = announcements.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Announcements</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item"><Link to={routes.adminDashboard}><i className="ti ti-smart-home" /></Link></li>
                  <li className="breadcrumb-item">HRM</li>
                  <li className="breadcrumb-item active" aria-current="page">Announcements</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center gap-2">
              <button onClick={openAdd} className="btn btn-primary d-flex align-items-center gap-1">
                <i className="ti ti-plus fs-16" /> New Announcement
              </button>
              <div className="ms-1 head-icons"><CollapseHeader /></div>
            </div>
          </div>

          {/* Search bar */}
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
            <div className="card-body p-3">
              <div className="input-group">
                <span className="input-group-text border-0 bg-light"><i className="ti ti-search text-gray-5" /></span>
                <input
                  type="text"
                  className="form-control border-0 bg-light"
                  placeholder="Search announcements..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Announcements List */}
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
          ) : filtered.length === 0 ? (
            <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: "12px" }}>
              <i className="ti ti-megaphone-off fs-48 text-gray-4 d-block mb-3" />
              <h5 className="text-gray-6">{search ? "No announcements match your search" : "No announcements yet"}</h5>
              {!search && <p className="text-gray-5 fs-13">Click "New Announcement" to create the first one.</p>}
            </div>
          ) : (
            <div className="row g-3">
              {filtered.map((a: any) => {
                const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
                return (
                  <div key={a.id} className="col-12">
                    <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", borderLeft: `4px solid ${isExpired ? "#adb5bd" : "#162E5B"}` }}>
                      <div className="card-body p-4">
                        <div className="d-flex align-items-start gap-3">
                          {/* Icon */}
                          <div className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                            style={{ width: 44, height: 44, backgroundColor: isExpired ? "#f8f9fa" : "#E0F7FA", color: isExpired ? "#adb5bd" : "#00BCD4" }}>
                            <i className="ti ti-megaphone-filled fs-20" />
                          </div>

                          {/* Content */}
                          <div className="flex-fill min-w-0">
                            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                              <h6 className="fw-bold mb-0 text-gray-9 fs-15">{a.title}</h6>
                              {isExpired && <span className="badge bg-secondary-transparent text-secondary fs-10">Expired</span>}
                              <span className="badge fs-10" style={{ backgroundColor: "#E0F7FA", color: "#00838F" }}>{a.targetType === "ALL" ? "All Employees" : "Targeted"}</span>
                            </div>
                            <p className="text-gray-6 fs-13 mb-2" style={{ whiteSpace: "pre-line" }}>{a.content}</p>

                            {/* Image thumbnail */}
                            {a.imageUrl && (
                              <img
                                src={a.imageUrl.startsWith("http") ? a.imageUrl : `${apiUrl}${a.imageUrl}`}
                                alt="Attachment"
                                className="rounded-3 mb-2"
                                style={{ maxHeight: 160, maxWidth: "100%", objectFit: "cover" }}
                              />
                            )}

                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              <span className="fs-12 text-gray-5"><i className="ti ti-clock me-1" />{relativeTime(a.publishedAt)}</span>
                              {a.expiresAt && <span className="fs-12 text-gray-5"><i className="ti ti-calendar-x me-1" />Expires: {formatDate(a.expiresAt)}</span>}
                              {a.createdBy && (
                                <span className="fs-12 text-gray-5">
                                  <i className="ti ti-user me-1" />
                                  {a.createdBy.firstName} {a.createdBy.lastName}
                                  {a.createdBy.designation?.name ? ` · ${a.createdBy.designation.name}` : ""}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="d-flex gap-2 flex-shrink-0">
                            <button onClick={() => openEdit(a)} className="btn btn-icon btn-sm btn-light" title="Edit">
                              <i className="ti ti-pencil fs-14" />
                            </button>
                            <button onClick={() => setDeleteId(a.id)} className="btn btn-icon btn-sm btn-danger-light" title="Delete">
                              <i className="ti ti-trash fs-14" />
                            </button>
                          </div>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-0 px-4 pt-4 pb-2">
                <h5 className="modal-title fw-bold">{editItem ? "Edit Announcement" : "New Announcement"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body px-4 pb-2">
                {/* Title */}
                <div className="mb-3">
                  <label className="form-label fw-medium">Title <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" placeholder="e.g. Office closed on Sep 5" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>

                {/* Content */}
                <div className="mb-3">
                  <label className="form-label fw-medium">Message <span className="text-danger">*</span></label>
                  <textarea className="form-control" rows={5} placeholder="Write announcement details here..."
                    value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
                </div>

                <div className="row g-3 mb-3">
                  {/* Target */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Target Audience</label>
                    <select className="form-select" value={form.targetType} onChange={e => setForm(f => ({ ...f, targetType: e.target.value }))}>
                      <option value="ALL">All Employees</option>
                    </select>
                  </div>
                  {/* Expiry */}
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Expires On <span className="text-gray-5 fw-normal">(optional)</span></label>
                    <input type="date" className="form-control" value={form.expiresAt}
                      onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                  </div>
                </div>

                {/* Image */}
                <div className="mb-3">
                  <label className="form-label fw-medium">Attachment / Banner Image <span className="text-gray-5 fw-normal">(optional, max 5MB)</span></label>
                  {editItem?.imageUrl && !removeImage && (
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <img src={editItem.imageUrl.startsWith("http") ? editItem.imageUrl : `${apiUrl}${editItem.imageUrl}`}
                        alt="Current" className="rounded-2" style={{ height: 60, maxWidth: 140, objectFit: "cover" }} />
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setRemoveImage(true)}>Remove</button>
                    </div>
                  )}
                  <input type="file" ref={fileRef} className="form-control" accept="image/*"
                    onChange={e => setImageFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button className="btn btn-light px-4" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary px-4" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</> : editItem ? "Update" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-body p-4 text-center">
                <div className="mb-3"><i className="ti ti-trash-x fs-48 text-danger" /></div>
                <h6 className="fw-bold mb-2">Delete Announcement?</h6>
                <p className="text-gray-5 fs-13 mb-4">This action cannot be undone.</p>
                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-light px-4" onClick={() => setDeleteId(null)}>Cancel</button>
                  <button className="btn btn-danger px-4" onClick={() => handleDelete(deleteId!)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Announcements;
