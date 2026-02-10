import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setProfile(res.data.data);
      } catch {
        // handled by interceptor
      }
    };

    const fetchWalletBalance = async () => {
      try {
        const res = await api.get("/wallet/balance");
        setWalletBalance(res.data.data.balance);
        setUpiId(res.data.data.upiId);
      } catch {
        console.error("Failed to fetch wallet balance");
      }
    };

    fetchProfile();
    fetchWalletBalance();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayUser = profile || user;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-logo-container">
          <img 
            src="/assets/nidhi-logo.png" 
            alt="NIDHI Logo" 
            className="dashboard-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'inline-block';
            }}
          />
          <h1 className="auth-logo" style={{ display: 'none' }}>💰 NIDHI</h1>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Welcome, {displayUser?.name || "User"}! 👋</h2>
          <p>Your NIDHI account is active</p>
          <div className="wallet-quick-view">
            <div className="quick-balance">
              <span className="balance-label">Wallet Balance</span>
              <span className="balance-amount">₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <Link to="/wallet" className="btn-view-wallet">
              View Wallet →
            </Link>
          </div>
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
            <div className="profile-item">
              <span className="profile-label">UPI ID</span>
              <span className="profile-value" style={{color: "#667eea", fontWeight: "600"}}>{upiId || "Loading..."}</span>
            </div>
            {profile?.aadhaarNumber && (
              <div className="profile-item">
                <span className="profile-label">Aadhaar</span>
                <span className="profile-value">{profile.aadhaarNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="features-grid">
          <Link to="/wallet" className="feature-card clickable">
            <span className="feature-icon">💰</span>
            <h4>My Wallet</h4>
            <p>Manage your NIDHI wallet & UPI</p>
            <span className="active-badge">Active</span>
          </Link>
          <div className="feature-card">
            <span className="feature-icon">💸</span>
            <h4>Send Money</h4>
            <p>Transfer via username@nidhi</p>
            <span className="active-badge">Active</span>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h4>Transaction History</h4>
            <p>View all your transactions</p>
            <span className="active-badge">Active</span>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📋</span>
            <h4>Loan Suggestions</h4>
            <p>Compare & find the best loans</p>
            <span className="coming-soon">Coming Soon</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
