import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import toast from "react-hot-toast";

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const email = location.state?.email || "";
  const userName = location.state?.name || "";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      
      // Store token and user data
      const { user, token } = res.data.data;
      localStorage.setItem("nidhi_token", token);
      localStorage.setItem("nidhi_user", JSON.stringify(user));
      
      toast.success("Email verified successfully!");
      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email not found. Please register again.");
      return;
    }

    setIsResending(true);
    try {
      await api.post("/auth/resend-otp", { email });
      toast.success("New OTP sent to your email!");
      setOtp("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img 
              src="/assets/nidhi-logo.png" 
              alt="NIDHI Logo" 
              className="auth-logo-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <h1 className="auth-logo" style={{ display: 'none' }}>💰 NIDHI</h1>
            <p className="auth-subtitle">Invalid access</p>
          </div>
          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            No email found. Please{" "}
            <a href="/register" style={{ color: "var(--primary)" }}>
              register
            </a>{" "}
            first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img 
            src="/assets/nidhi-logo.png" 
            alt="NIDHI Logo" 
            className="auth-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <h1 className="auth-logo" style={{ display: 'none' }}>💰 NIDHI</h1>
          <p className="auth-subtitle">Verify Your Email</p>
        </div>

        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Hi <strong>{userName}</strong>! We've sent a 6-digit OTP to:
          </p>
          <p style={{ fontWeight: "600", color: "var(--primary)", marginTop: "0.5rem" }}>
            {email}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Valid for 10 minutes
          </p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          <div className="form-group">
            <label>Enter OTP</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" }}
              autoFocus
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Didn't receive the OTP?
          </p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isResending}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.9rem",
              marginTop: "0.5rem",
              textDecoration: "underline",
            }}
          >
            {isResending ? "Sending..." : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
