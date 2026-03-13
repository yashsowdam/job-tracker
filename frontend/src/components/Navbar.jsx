import { Link, useNavigate, NavLink } from "react-router-dom";
import { clearTokens, isLoggedIn } from "../api/auth";

export default function Navbar() {
    const navigate = useNavigate();

    const logout = () => {
        clearTokens();
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <Link className="navbar-brand" to="/">
                    JobTracker
                </Link>

                <div className="d-flex gap-2">
                    {isLoggedIn() ? (
                        <div className="d-flex align-items-center gap-2">
                            <NavLink className="btn btn-outline-light btn-sm" to="/">
                                Dashboard
                            </NavLink>
                            <NavLink className="btn btn-outline-light btn-sm" to="/jobs">
                                Jobs
                            </NavLink>
                            <button onClick={logout} className="btn btn-accent btn-sm">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link className="btn btn-outline-light btn-sm" to="/login">
                                Login
                            </Link>
                            <Link className="btn btn-warning btn-sm" to="/register">
                                Create account
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}