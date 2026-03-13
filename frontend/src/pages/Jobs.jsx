import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import AlertBox from "../components/AlertBox";

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    { value: "APPLIED", label: "Applied" },
    { value: "INTERVIEW", label: "Interview" },
    { value: "OFFER", label: "Offer" },
    { value: "REJECTED", label: "Rejected" },
];

const ORDER_OPTIONS = [
    { value: "-created_at", label: "Newest first" },
    { value: "created_at", label: "Oldest first" },
    { value: "-applied_date", label: "Applied date (newest)" },
    { value: "applied_date", label: "Applied date (oldest)" },
    { value: "company", label: "Company (A–Z)" },
    { value: "-company", label: "Company (Z–A)" },
];

function extractFieldErrors(err) {
    // DRF often returns { field: ["msg"] }
    if (!err?.response?.data || typeof err.response.data !== "object") return {};
    const data = err.response.data;
    const out = {};
    for (const key of Object.keys(data)) {
        const v = data[key];
        if (Array.isArray(v) && v.length) out[key] = v[0];
        else if (typeof v === "string") out[key] = v;
    }
    return out;
}

function getApiError(err) {
    if (!err.response) return "Network error. Is the backend running?";
    const data = err.response.data;
    if (typeof data === "string") return data;
    return data?.detail || "Something went wrong.";
}

function formatDateForInput(value) {
    // expects YYYY-MM-DD or null
    return value || "";
}

export default function Jobs() {
    // list state
    const [items, setItems] = useState([]);
    const [count, setCount] = useState(0); // DRF pagination count
    const [page, setPage] = useState(1);

    // filters
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [ordering, setOrdering] = useState("-created_at");

    // ui state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // modal state
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null); // job object or null

    const pageSize = 10; // matches backend PAGE_SIZE
    const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count]);

    async function fetchJobs({ resetPage = false } = {}) {
        setError("");
        setLoading(true);
        try {
            const nextPage = resetPage ? 1 : page;
            const res = await api.get("/api/jobs/", {
                params: {
                    page: nextPage,
                    status: status || undefined,
                    search: search || undefined,
                    ordering: ordering || undefined,
                },
            });
            setItems(res.data.results ?? res.data);
            setCount(res.data.count ?? (res.data.results ? res.data.count : res.data.length));
            if (resetPage) setPage(1);
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // whenever filters change, reset to page 1
        fetchJobs({ resetPage: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, ordering]);

    // Debounced search (simple, no library)
    useEffect(() => {
        const t = setTimeout(() => fetchJobs({ resetPage: true }), 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        fetchJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const onAdd = () => {
        setEditing(null);
        setShowModal(true);
    };

    const onEdit = (job) => {
        setEditing(job);
        setShowModal(true);
    };

    const onDelete = async (job) => {
        const ok = window.confirm(`Delete ${job.company} - ${job.role}?`);
        if (!ok) return;
        setError("");
        try {
            await api.delete(`/api/jobs/${job.id}/`);
            // if you delete last item on last page, step back
            if (items.length === 1 && page > 1) setPage((p) => p - 1);
            else fetchJobs();
        } catch (err) {
            setError(getApiError(err));
        }
    };

    const onSaved = () => {
        setShowModal(false);
        setEditing(null);
        fetchJobs();
    };

    return (
        <div className="app-shell">
            <div className="container py-0">
                <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                    <div>
                        <h3 className="mb-0">Jobs</h3>
                        <div className="text-muted">Add, edit and track your applications</div>
                    </div>
                    <button className="btn btn-dark" onClick={onAdd}>
                        + Add Job
                    </button>
                </div>

                <AlertBox message={error} />

                {/* Filters */}
                <div className="card card-body app-card shadow-sm mb-3">
                    <div className="row g-2 align-items-end">
                        <div className="col-md-5">
                            <label className="form-label">Search</label>
                            <input
                                className="form-control"
                                placeholder="Company, role, notes..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Sort</label>
                            <select className="form-select" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
                                {ORDER_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-1 d-grid">
                            <button className="btn btn-outline-accent btn-sm" onClick={() => fetchJobs({ resetPage: true })} disabled={loading}>
                                {loading ? "…" : "Go"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card card-body app-card shadow-sm">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                        <div className="fw-semibold">Applications</div>
                        <div className="text-muted small">
                            Page {page} / {totalPages} • {count} total
                        </div>
                    </div>

                    {loading ? (
                        <div className="card-body">Loading...</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Applied</th>
                                        <th style={{ width: 190 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted py-4">
                                                No results. Try changing filters or add a job.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((j) => (
                                            <tr key={j.id}>
                                                <td className="fw-semibold">{j.company}</td>
                                                <td>{j.role}</td>
                                                <td>
                                                    <span className="badge text-bg-dark">{j.status}</span>
                                                </td>
                                                <td>{j.applied_date || "-"}</td>
                                                <td className="text-end">
                                                    <div className="btn-group">
                                                        <button className="btn btn-outline-dark btn-sm" onClick={() => onEdit(j)}>
                                                            Edit
                                                        </button>
                                                        <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(j)}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="card-footer bg-white d-flex justify-content-between align-items-center">
                        <button className="btn btn-outline-accent btn-sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                            Prev
                        </button>

                        <div className="text-muted small">Showing {items.length} items</div>

                        <button
                            className="btn btn-outline-accent btn-sm"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {showModal ? (
                <JobModal
                    job={editing}
                    onClose={() => {
                        setShowModal(false);
                        setEditing(null);
                    }}
                    onSaved={onSaved}
                />
            ) : null}
        </div>
    );
}

function JobModal({ job, onClose, onSaved }) {
    const isEdit = Boolean(job);

    const [form, setForm] = useState({
        company: job?.company || "",
        role: job?.role || "",
        status: job?.status || "APPLIED",
        applied_date: formatDateForInput(job?.applied_date),
        link: job?.link || "",
        salary_min: job?.salary_min ?? "",
        salary_max: job?.salary_max ?? "",
        notes: job?.notes || "",
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [saving, setSaving] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.company.trim()) e.company = "Company is required.";
        if (!form.role.trim()) e.role = "Role is required.";

        if (form.link && !/^https?:\/\/.+/i.test(form.link)) e.link = "Link must start with http:// or https://";

        const min = form.salary_min === "" ? null : Number(form.salary_min);
        const max = form.salary_max === "" ? null : Number(form.salary_max);

        if (min !== null && Number.isNaN(min)) e.salary_min = "Enter a number.";
        if (max !== null && Number.isNaN(max)) e.salary_max = "Enter a number.";
        if (min !== null && max !== null && min > max) e.salary_min = "Min cannot be greater than max.";

        setFieldErrors(e);
        return Object.keys(e).length === 0;
    };

    const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setServerError("");
        setFieldErrors({});

        if (!validate()) return;

        // normalize payload
        const payload = {
            company: form.company.trim(),
            role: form.role.trim(),
            status: form.status,
            applied_date: form.applied_date || null,
            link: form.link.trim(),
            salary_min: form.salary_min === "" ? null : Number(form.salary_min),
            salary_max: form.salary_max === "" ? null : Number(form.salary_max),
            notes: form.notes,
        };

        setSaving(true);
        try {
            if (isEdit) {
                await api.patch(`/api/jobs/${job.id}/`, payload);
            } else {
                await api.post("/api/jobs/", payload);
            }
            onSaved();
        } catch (err) {
            setServerError(getApiError(err));
            const fe = extractFieldErrors(err);
            if (Object.keys(fe).length) setFieldErrors((prev) => ({ ...prev, ...fe }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.5)" }}>
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{isEdit ? "Edit Job" : "Add Job"}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <form onSubmit={submit}>
                        <div className="modal-body">
                            <AlertBox message={serverError} />

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Company *</label>
                                    <input
                                        className={`form-control ${fieldErrors.company ? "is-invalid" : ""}`}
                                        value={form.company}
                                        onChange={onChange("company")}
                                    />
                                    <div className="invalid-feedback">{fieldErrors.company}</div>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Role *</label>
                                    <input
                                        className={`form-control ${fieldErrors.role ? "is-invalid" : ""}`}
                                        value={form.role}
                                        onChange={onChange("role")}
                                    />
                                    <div className="invalid-feedback">{fieldErrors.role}</div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={form.status} onChange={onChange("status")}>
                                        <option value="APPLIED">Applied</option>
                                        <option value="INTERVIEW">Interview</option>
                                        <option value="OFFER">Offer</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Applied date</label>
                                    <input className="form-control" type="date" value={form.applied_date} onChange={onChange("applied_date")} />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Link</label>
                                    <input
                                        className={`form-control ${fieldErrors.link ? "is-invalid" : ""}`}
                                        placeholder="https://..."
                                        value={form.link}
                                        onChange={onChange("link")}
                                    />
                                    <div className="invalid-feedback">{fieldErrors.link}</div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Salary min</label>
                                    <input
                                        className={`form-control ${fieldErrors.salary_min ? "is-invalid" : ""}`}
                                        value={form.salary_min}
                                        onChange={onChange("salary_min")}
                                        inputMode="numeric"
                                    />
                                    <div className="invalid-feedback">{fieldErrors.salary_min}</div>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Salary max</label>
                                    <input
                                        className={`form-control ${fieldErrors.salary_max ? "is-invalid" : ""}`}
                                        value={form.salary_max}
                                        onChange={onChange("salary_max")}
                                        inputMode="numeric"
                                    />
                                    <div className="invalid-feedback">{fieldErrors.salary_max}</div>
                                </div>

                                <div className="col-md-12">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-control" rows="3" value={form.notes} onChange={onChange("notes")} />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-accent" onClick={onClose} disabled={saving}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-dark" disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}