import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AlertBox from "../components/AlertBox";
import { setTokens } from "../api/auth";

function getApiError(err) {
    if (!err.response) return "Network error. Is the backend running?";
    const data = err.response.data;
    return data?.detail || "Invalid credentials.";
}

export default function Login() {
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.username.trim()) e.username = "Username is required.";
        if (!form.password) e.password = "Password is required.";
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
            const resp = await api.post("/api/auth/token/", form);
            setTokens({ access: resp.data.access, refresh: resp.data.refresh });
            nav("/");
        } catch (err) {
            setServerError(getApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-overlay w-100">
                <div className="auth-card-wrap">
                    <h3 className="auth-title text-white mb-3">Login</h3>

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
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
                        value={form.password}
                        onChange={onChange("password")}
                        autoComplete="current-password"
                    />
                    <div className="invalid-feedback">{fieldErrors.password}</div>
                </div>

                <button className="btn btn-dark w-100" disabled={loading}>
                    {loading ? "Signing in..." : "Login"}
                </button>
                    </form>

                    <div className="text-center mt-3 text-white">
                        <span className="opacity-75">New here?</span>{" "}
                        <Link className="text-white fw-semibold" to="/register">
                            Create an account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}