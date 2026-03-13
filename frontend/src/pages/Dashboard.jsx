import { useEffect, useState } from "react";
import api from "../api/axios";
import AlertBox from "../components/AlertBox";

export default function Dashboard() {
    const [jobs, setJobs] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        setError("");
        try {
            const [jobsRes, analyticsRes] = await Promise.all([
                api.get("/api/jobs/"),
                api.get("/api/analytics/"),
            ]);
            setJobs(jobsRes.data.results ?? jobsRes.data); // pagination safe
            setAnalytics(analyticsRes.data);
        } catch (err) {
            if (!err.response) setError("Network error. Is backend running?");
            else if (err.response.status === 401) setError("Session expired. Please login again.");
            else setError("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="app-shell">
                <div className="container py-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                            <h3 className="mb-0">Dashboard</h3>
                            <div className="text-muted">Track your applications and status</div>
                        </div>
                        <button className="btn btn-outline-dark" onClick={load} disabled={loading}>
                            Refresh
                        </button>
                    </div>

                    <AlertBox message={error} />

                    {loading ? (
                        <div className="card card-body app-card shadow-sm">Loading...</div>
                    ) : (
                        <>
                            {/* Analytics summary */}
                            <div className="row g-3 mb-3">
                                <div className="col-md-3">
                                    <div className="card card-body app-card shadow-sm">
                                        <div className="text-muted">Total Jobs</div>
                                        <div className="fs-3 fw-bold">{analytics?.total ?? 0}</div>
                                    </div>
                                </div>

                                {["APPLIED", "INTERVIEW", "OFFER", "REJECTED"].map((s) => (
                                    <div className="col-md-3" key={s}>
                                        <div className="card card-body app-card shadow-sm">
                                            <div className="text-muted">{s}</div>
                                            <div className="fs-3 fw-bold">{analytics?.by_status?.[s] ?? 0}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Jobs preview */}
                            <div className="card card-body app-card shadow-sm">
                                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                    <div className="fw-semibold">Recent Applications</div>
                                    <span className="text-muted small">{jobs.length} items</span>
                                </div>

                                <div className="table-responsive">
                                    <table className="table mb-0 align-middle">
                                        <thead>
                                            <tr>
                                                <th>Company</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Applied Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center text-muted py-4">
                                                        No jobs yet. Add your first application.
                                                    </td>
                                                </tr>
                                            ) : (
                                                jobs.slice(0, 8).map((j) => (
                                                    <tr key={j.id}>
                                                        <td className="fw-semibold">{j.company}</td>
                                                        <td>{j.role}</td>
                                                        <td>
                                                            <span className="badge text-bg-dark">{j.status}</span>
                                                        </td>
                                                        <td>{j.applied_date || "-"}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
    );
}