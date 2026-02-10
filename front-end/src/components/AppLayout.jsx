import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Hide bottom nav on Pay page (full-screen experience)
  const hideBottomNav = ["/scan"].includes(location.pathname);

  return (
    <div className="app-layout">
      {/* Top Header */}
      <header className="app-header">
        <div className="app-header-left">
          <img
            src="/assets/nidhi-logo.png"
            alt="NIDHI"
            className="app-header-logo"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "inline-block";
            }}
          />
          <span className="app-header-title" style={{ display: "none" }}>
            NIDHI
          </span>
        </div>
        <div className="app-header-right">
          <button className="header-profile-btn" onClick={() => navigate("/home")}>
            <span className="header-avatar">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          </button>
          <button className="header-logout-btn" onClick={handleLogout} title="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Bottom Navigation – 2 tabs */}
      {!hideBottomNav && (
        <nav className="bottom-nav">
          <NavLink to="/home" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>Pay</span>
          </NavLink>
          <NavLink to="/loans" className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span>Loans</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
};

export default AppLayout;
