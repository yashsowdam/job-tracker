import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AlertBox from "../components/AlertBox";

function getApiError(err) {
    if (!err.response) return "Network error. Is the backend running?";
    const data = err.response.data;

    // DRF often returns field errors like { username: ["..."] }
    if (typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal)) return `${firstKey}: ${firstVal[0]}`;
    }

    return data?.detail || "Something went wrong.";
}

export default function Register() {
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.username.trim()) e.username = "Username is required.";
        if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
        if (!form.password || form.password.length < 8) e.password = "Password must be at least 8 characters.";
        setFieldErrors(e);
        return Object.keys(e).length === 0;
    };

    const onChange = (k) => (evt) => setForm((p) => ({ ...p, [k]: evt.target.value }));

    const onSubmit = async (e) => {
        e.preventDefault();
        setServerError("");
        if (!validate()) return;

        setLoading(true);
        try {
            await api.post("/api/auth/register/", form);
            nav("/login");
        } catch (err) {
            setServerError(getApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
                <div className="auth-card-wrap">
                    <h3 className="auth-title text-white mb-3">Create account</h3>
                    <AlertBox message={serverError} />
                    <form onSubmit={onSubmit} className="card auth-card card-body shadow-sm">
                        <div className="mb-3">
                            <label className="form-label">Username</label>
                            <input
                                className={`form-control ${fieldErrors.username ? "is-invalid" : ""}`}
                                value={form.username}
                                onChange={onChange("username")}
                                autoComplete="username"
                            />
                            <div className="invalid-feedback">{fieldErrors.username}</div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Email (optional)</label>
                            <input
                                className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                                value={form.email}
                                onChange={onChange("email")}
                                autoComplete="email"
                            />
                            <div className="invalid-feedback">{fieldErrors.email}</div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
                                value={form.password}
                                onChange={onChange("password")}
                                autoComplete="new-password"
                            />
                            <div className="invalid-feedback">{fieldErrors.password}</div>
                        </div>

                        <button className="btn btn-dark w-100" disabled={loading}>
                            {loading ? "Creating..." : "Create account"}
                        </button>
                    </form>
                    <div className="text-center mt-3 text-white">
                        <span className="opacity-75">Already have an account?</span>{" "}
                        <Link className="text-white fw-semibold" to="/login">
                            Login
                        </Link>
                    </div>
                </div>
            </div>
    );
}