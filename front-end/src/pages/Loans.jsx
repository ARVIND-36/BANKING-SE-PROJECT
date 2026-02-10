import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const LOAN_TYPES = [
  { key: "home",        name: "Home Loan",    icon: "🏠" },
  { key: "education",   name: "Education",    icon: "🎓" },
  { key: "vehicle",     name: "Vehicle Loan",  icon: "🚗" },
  { key: "personal",    name: "Personal Loan", icon: "💼" },
  { key: "business",    name: "Business Loan", icon: "🏪" },
  { key: "credit_line", name: "Credit Line",   icon: "💳" },
];

const EMPLOYMENT_TYPES = [
  { key: "salaried",      label: "Salaried" },
  { key: "self_employed",  label: "Self Employed" },
  { key: "business",      label: "Business Owner" },
];

const Loans = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pastApps, setPastApps] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Saved user profile for auto-fill
  const [savedProfile, setSavedProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Dynamic fields for the selected loan type
  const [typeFields, setTypeFields] = useState([]);
  const [specificDetails, setSpecificDetails] = useState({});

  const [form, setForm] = useState({
    monthlyIncome: "",
    employmentType: "salaried",
    creditScore: "",
    age: "",
    existingEmi: "",
    desiredTenure: "",
    desiredAmount: "",
    city: "",
  });

  useEffect(() => {
    fetchPastApplications();
    fetchSavedProfile();
  }, []);

  const fetchPastApplications = async () => {
    try {
      const res = await api.get("/loans/my-applications");
      setPastApps(res.data.data.applications || []);
    } catch (err) { /* silent */ }
  };

  const fetchSavedProfile = async () => {
    try {
      const res = await api.get("/loans/profile");
      if (res.data.data.profile) {
        setSavedProfile(res.data.data.profile);
      }
      setProfileLoaded(true);
    } catch (err) {
      setProfileLoaded(true);
    }
  };

  const fetchLoanFields = async (typeKey) => {
    try {
      const res = await api.get(`/loans/fields/${typeKey}`);
      setTypeFields(res.data.data.fields || []);
    } catch (err) {
      setTypeFields([]);
    }
  };

  const handleTypeSelect = async (type) => {
    setSelectedType(type);
    setResult(null);
    setSpecificDetails({});
    await fetchLoanFields(type.key);
    setStep(2);
  };

  // Auto-fill common fields from saved profile
  const applySavedProfile = () => {
    if (!savedProfile) return;
    setForm((prev) => ({
      ...prev,
      monthlyIncome: savedProfile.monthlyIncome || prev.monthlyIncome,
      employmentType: savedProfile.employmentType || prev.employmentType,
      creditScore: savedProfile.creditScore || prev.creditScore,
      age: savedProfile.age || prev.age,
      existingEmi: savedProfile.existingEmi || prev.existingEmi,
      city: savedProfile.city || prev.city,
    }));

    // Also fill loan-specific details if saved for this type
    if (savedProfile.savedDetails && savedProfile.savedDetails[selectedType.key]) {
      setSpecificDetails(savedProfile.savedDetails[selectedType.key]);
    }
    toast.success("Filled from saved profile!");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSpecificChange = (key, value) => {
    setSpecificDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.monthlyIncome || !form.creditScore || !form.age || !form.desiredTenure || !form.desiredAmount || !form.city) {
      toast.error("Please fill all required fields");
      return;
    }
    if (parseInt(form.creditScore) < 300 || parseInt(form.creditScore) > 900) {
      toast.error("Credit score must be between 300-900");
      return;
    }
    if (parseInt(form.age) < 21 || parseInt(form.age) > 65) {
      toast.error("Age must be between 21-65");
      return;
    }

    // Validate required type-specific fields
    for (const field of typeFields) {
      if (field.required && !specificDetails[field.key]) {
        toast.error(`Please fill: ${field.label}`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.post("/loans/eligibility", {
        loanType: selectedType.key,
        ...form,
        loanSpecificDetails: specificDetails,
      });
      setResult(res.data.data);
      setStep(3);
      fetchPastApplications();
      fetchSavedProfile(); // Refresh saved profile
      toast.success("Eligibility checked!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to check eligibility");
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setSelectedType(null);
    setResult(null);
    setSpecificDetails({});
    setTypeFields([]);
    setForm({
      monthlyIncome: "",
      employmentType: "salaried",
      creditScore: "",
      age: "",
      existingEmi: "",
      desiredTenure: "",
      desiredAmount: "",
      city: "",
    });
  };

  const formatCurrency = (num) => {
    if (!num) return "₹0";
    return "₹" + Number(num).toLocaleString("en-IN");
  };

  // ─── Render a single dynamic field ─────────────────────────
  const renderField = (field) => {
    if (field.type === "select") {
      return (
        <div className="lf-group" key={field.key}>
          <label>{field.label} {field.required && <span className="lf-req">*</span>}</label>
          <select
            value={specificDetails[field.key] || ""}
            onChange={(e) => handleSpecificChange(field.key, e.target.value)}
            required={field.required}
            className="lf-select"
          >
            <option value="">Select...</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div className="lf-group" key={field.key}>
        <label>{field.label} {field.required && <span className="lf-req">*</span>}</label>
        <input
          type={field.type}
          value={specificDetails[field.key] || ""}
          onChange={(e) => handleSpecificChange(field.key, e.target.value)}
          placeholder={field.placeholder || ""}
          required={field.required}
        />
      </div>
    );
  };

  // ─── STEP 1: Choose Loan Type ──────────────────────────────
  if (step === 1) {
    return (
      <div className="loans-container">
        <div className="loans-banner">
          <div className="loans-banner-icon">🏦</div>
          <div className="loans-banner-text">
            <h3>Loan Eligibility Checker</h3>
            <p>Check your eligibility & compare offers from top banks</p>
          </div>
        </div>

        <div className="loans-section-header">
          <h3>Choose Loan Type</h3>
        </div>
        <div className="loans-grid">
          {LOAN_TYPES.map((type) => (
            <button key={type.key} className="loan-type-card" onClick={() => handleTypeSelect(type)}>
              <span className="loan-type-icon">{type.icon}</span>
              <span className="loan-type-name">{type.name}</span>
              <span className="loan-type-arrow">→</span>
            </button>
          ))}
        </div>

        {pastApps.length > 0 && (
          <div className="loans-history-section">
            <button className="loans-history-toggle" onClick={() => setShowHistory(!showHistory)}>
              <span>📋 Past Checks ({pastApps.length})</span>
              <span className={`toggle-arrow ${showHistory ? "open" : ""}`}>▼</span>
            </button>
            {showHistory && (
              <div className="loans-history-list">
                {pastApps.map((app) => (
                  <div key={app.id} className="loans-history-item">
                    <div className="lh-left">
                      <span className="lh-type">{LOAN_TYPES.find(t => t.key === app.loanType)?.icon} {app.loanType}</span>
                      <span className="lh-date">{new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="lh-right">
                      <span className={`lh-badge ${app.isEligible ? "eligible" : "not-eligible"}`}>
                        {app.isEligible ? "Eligible" : "Not Eligible"}
                      </span>
                      <span className="lh-amount">{formatCurrency(app.eligibleAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── STEP 2: Input Form ────────────────────────────────────
  if (step === 2) {
    return (
      <div className="loans-container">
        <div className="loans-form-header">
          <button className="loans-back-btn" onClick={() => setStep(1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="loans-form-title">
            <span className="lft-icon">{selectedType.icon}</span>
            <h3>{selectedType.name}</h3>
          </div>
        </div>

        {/* Auto-fill banner */}
        {savedProfile && (
          <button className="loans-autofill-btn" onClick={applySavedProfile}>
            <span className="autofill-icon">⚡</span>
            <span className="autofill-text">
              <strong>Use Saved Profile</strong>
              <small>Auto-fill from your last submission</small>
            </span>
            <span className="autofill-arrow">→</span>
          </button>
        )}

        <form className="loans-form" onSubmit={handleSubmit}>
          {/* ── Common Fields ── */}
          <div className="lf-section-title">Your Details</div>

          <div className="lf-group">
            <label>Monthly Income (₹) <span className="lf-req">*</span></label>
            <input type="number" name="monthlyIncome" value={form.monthlyIncome} onChange={handleChange} placeholder="e.g. 50000" required />
          </div>

          <div className="lf-group">
            <label>Employment Type</label>
            <div className="lf-radio-group">
              {EMPLOYMENT_TYPES.map((emp) => (
                <label key={emp.key} className={`lf-radio-chip ${form.employmentType === emp.key ? "active" : ""}`}>
                  <input type="radio" name="employmentType" value={emp.key} checked={form.employmentType === emp.key} onChange={handleChange} />
                  {emp.label}
                </label>
              ))}
            </div>
          </div>

          <div className="lf-row">
            <div className="lf-group">
              <label>Credit Score <span className="lf-req">*</span></label>
              <input type="number" name="creditScore" value={form.creditScore} onChange={handleChange} placeholder="300-900" min="300" max="900" required />
            </div>
            <div className="lf-group">
              <label>Age <span className="lf-req">*</span></label>
              <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="21-65" min="21" max="65" required />
            </div>
          </div>

          <div className="lf-group">
            <label>Existing EMIs (₹/month)</label>
            <input type="number" name="existingEmi" value={form.existingEmi} onChange={handleChange} placeholder="0 if none" />
          </div>

          <div className="lf-row">
            <div className="lf-group">
              <label>Loan Amount (₹) <span className="lf-req">*</span></label>
              <input type="number" name="desiredAmount" value={form.desiredAmount} onChange={handleChange} placeholder="e.g. 500000" required />
            </div>
            <div className="lf-group">
              <label>Tenure (months) <span className="lf-req">*</span></label>
              <input type="number" name="desiredTenure" value={form.desiredTenure} onChange={handleChange} placeholder="e.g. 60" required />
            </div>
          </div>

          <div className="lf-group">
            <label>City <span className="lf-req">*</span></label>
            <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Bangalore" required />
          </div>

          {/* ── Loan-Specific Fields ── */}
          {typeFields.length > 0 && (
            <>
              <div className="lf-section-title">{selectedType.name} Details</div>
              <div className="lf-specific-fields">
                {typeFields.map((field) => renderField(field))}
              </div>
            </>
          )}

          <button type="submit" className="lf-submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-spinner"></span>
            ) : (
              <>Check Eligibility</>
            )}
          </button>
        </form>
      </div>
    );
  }

  // ─── STEP 3: Results ──────────────────────────────────────
  if (step === 3 && result) {
    return (
      <div className="loans-container">
        <div className="loans-form-header">
          <button className="loans-back-btn" onClick={resetAll}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="loans-form-title">
            <span className="lft-icon">{selectedType.icon}</span>
            <h3>Results</h3>
          </div>
        </div>

        <div className={`eligibility-card ${result.isEligible ? "eligible" : "not-eligible"}`}>
          <div className="ec-top">
            <span className="ec-status-icon">{result.isEligible ? "✅" : "❌"}</span>
            <div className="ec-status-text">
              <h4>{result.isEligible ? "You're Eligible!" : "Not Eligible"}</h4>
              <p>{result.reason}</p>
            </div>
          </div>
          {result.isEligible && (
            <div className="ec-amount">
              <span className="ec-label">Max Eligible Amount</span>
              <span className="ec-value">{formatCurrency(result.eligibleAmount)}</span>
            </div>
          )}
        </div>

        {result.bankOffers && result.bankOffers.length > 0 && (
          <div className="bank-offers-section">
            <h3 className="bo-title">🏦 Bank Offers ({result.bankOffers.length})</h3>
            <div className="bank-offers-list">
              {result.bankOffers.map((offer, idx) => (
                <div key={idx} className="bank-offer-card">
                  <div className="bo-header">
                    <span className="bo-logo">{offer.logo}</span>
                    <span className="bo-bank">{offer.bank}</span>
                    <span className={`bo-chance ${offer.approvalChance.toLowerCase()}`}>
                      {offer.approvalChance}
                    </span>
                  </div>
                  <div className="bo-details">
                    <div className="bo-detail-item">
                      <span className="bo-detail-label">Interest</span>
                      <span className="bo-detail-value">{offer.interestRate}% p.a.</span>
                    </div>
                    <div className="bo-detail-item">
                      <span className="bo-detail-label">Approved Amt</span>
                      <span className="bo-detail-value">{formatCurrency(offer.approvedAmount)}</span>
                    </div>
                    <div className="bo-detail-item">
                      <span className="bo-detail-label">Monthly EMI</span>
                      <span className="bo-detail-value highlight">{formatCurrency(offer.monthlyEmi)}</span>
                    </div>
                    <div className="bo-detail-item">
                      <span className="bo-detail-label">Total Payable</span>
                      <span className="bo-detail-value">{formatCurrency(offer.totalPayable)}</span>
                    </div>
                    <div className="bo-detail-item">
                      <span className="bo-detail-label">Total Interest</span>
                      <span className="bo-detail-value muted">{formatCurrency(offer.totalInterest)}</span>
                    </div>
                    <div className="bo-detail-item">
                      <span className="bo-detail-label">Tenure</span>
                      <span className="bo-detail-value">{offer.tenure} months</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="loans-result-actions">
          <button className="lra-btn primary" onClick={resetAll}>Check Another Loan</button>
          <button className="lra-btn secondary" onClick={() => setStep(2)}>Modify Details</button>
        </div>
      </div>
    );
  }

  return null;
};

export default Loans;
