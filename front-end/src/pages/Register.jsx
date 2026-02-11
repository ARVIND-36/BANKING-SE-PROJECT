import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    panCard: "",
    aadhaarNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (Object.values(form).some((v) => !v)) {
      toast.error("All fields are required");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panCard)) {
      toast.error("Invalid PAN card format (e.g., ABCDE1234F)");
      return;
    }
    if (!/^[0-9]{12}$/.test(form.aadhaarNumber)) {
      toast.error("Aadhaar must be exactly 12 digits");
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(form.mobile)) {
      toast.error("Mobile must be 10 digits starting with 6-9");
      return;
    }

    setIsLoading(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...payload } = form;
      const res = await api.post("/auth/register", payload);
      toast.success(res.data.message);
      
      // Log OTP in development mode for easier testing
      if (res.data.data.otp) {
        console.log("🔐 Development Mode - Your OTP is:", res.data.data.otp);
        toast.success(`OTP: ${res.data.data.otp} (Check console)`, { duration: 10000 });
      }
      
      // Navigate to OTP verification page with email and name
      navigate("/verify-otp", { 
        state: { 
          email: res.data.data.email,
          name: res.data.data.name
        } 
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Registration failed";
      toast.error(errorMsg);
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
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
          <p className="auth-subtitle">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                name="mobile"
                placeholder="10-digit mobile number"
                value={form.mobile}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label>PAN Card Number</label>
              <input
                type="text"
                name="panCard"
                placeholder="ABCDE1234F"
                value={form.panCard}
                onChange={handleChange}
                maxLength={10}
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Aadhaar Number (Mock)</label>
            <input
              type="text"
              name="aadhaarNumber"
              placeholder="12-digit Aadhaar number"
              value={form.aadhaarNumber}
              onChange={handleChange}
              maxLength={12}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
