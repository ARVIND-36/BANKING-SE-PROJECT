import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setProfile(res.data.data);
      } catch {
        // handled by interceptor
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayUser = profile || user;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="auth-logo">💰 NIDHI</h1>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Welcome, {displayUser?.name || "User"}! 👋</h2>
          <p>Your NIDHI account is active</p>
        </div>

        <div className="profile-card">
          <h3>Profile Information</h3>
          <div className="profile-grid">
            <div className="profile-item">
              <span className="profile-label">Name</span>
              <span className="profile-value">{displayUser?.name}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Email</span>
              <span className="profile-value">{displayUser?.email}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Mobile</span>
              <span className="profile-value">{displayUser?.mobile}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">PAN Card</span>
              <span className="profile-value">{displayUser?.panCard}</span>
            </div>
            {profile?.aadhaarNumber && (
              <div className="profile-item">
                <span className="profile-label">Aadhaar</span>
                <span className="profile-value">
                  XXXX-XXXX-{profile.aadhaarNumber.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">💸</span>
            <h4>UPI Transfer</h4>
            <p>Send money via PAN-linked UPI</p>
            <span className="coming-soon">Coming Soon</span>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📋</span>
            <h4>Loan Suggestions</h4>
            <p>Compare & find the best loans</p>
            <span className="coming-soon">Coming Soon</span>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h4>Transaction History</h4>
            <p>View all your transactions</p>
            <span className="coming-soon">Coming Soon</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
