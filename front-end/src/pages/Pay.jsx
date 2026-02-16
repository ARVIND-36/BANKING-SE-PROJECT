import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import toast from "react-hot-toast";

const Pay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const prefill = location.state?.prefill || "";
  const prefillName = location.state?.name || "";

  const [receiverInput, setReceiverInput] = useState(prefill);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receiverName, setReceiverName] = useState(prefillName);
  const [receiverUpiId, setReceiverUpiId] = useState(prefill);
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  // PIN verification state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");

  const searchUser = (input) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!input || input.length < 3) {
      setReceiverName("");
      setReceiverUpiId("");
      return;
    }
    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/wallet/search?upiId=${input.trim()}`);
        setReceiverName(res.data.data.name);
        setReceiverUpiId(res.data.data.upiId);
      } catch {
        setReceiverName("");
        setReceiverUpiId("");
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Step 1: Validate form and show PIN modal
  const handleSend = (e) => {
    e.preventDefault();

    if (!receiverInput.trim()) {
      toast.error("Enter a UPI ID or phone number");
      return;
    }
    if (!receiverName) {
      toast.error("User not found. Check UPI ID or phone number.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    // Check if PIN is set
    if (!user?.hasSetPin) {
      toast.error("Please set your Transaction PIN in Profile first.");
      setTimeout(() => navigate("/profile"), 1500);
      return;
    }

    // Show PIN entry modal
    setPin("");
    setShowPinModal(true);
  };

  // Step 2: Execute payment with PIN
  const handleConfirmPayment = async () => {
    if (!pin || pin.length < 4) {
      toast.error("Please enter your 4-6 digit PIN");
      return;
    }

    setIsSending(true);
    try {
      const res = await api.post("/wallet/send", {
        receiverUpiId: receiverInput.trim(),
        amount: parseFloat(amount),
        description: description.trim(),
        transactionPin: pin,
      });
      toast.success(res.data.message || "Payment successful!");
      setShowPinModal(false);
      navigate("/home");
    } catch (err) {
      toast.error(err.response?.data?.message || "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="pay-container">
      <div className="pay-header">
        <button className="back-btn" onClick={() => navigate("/home")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h2>Send Money</h2>
      </div>

      <form onSubmit={handleSend} className="pay-form">
        {/* Receiver Input */}
        <div className="pay-field">
          <label>Pay to</label>
          <input
            type="text"
            placeholder="Enter UPI ID or 10-digit phone number"
            value={receiverInput}
            onChange={(e) => {
              setReceiverInput(e.target.value);
              searchUser(e.target.value);
            }}
            autoFocus
          />
          {isSearching && <span className="pay-searching">🔍 Searching...</span>}
          {receiverName && (
            <div className="pay-receiver-found">
              <span className="receiver-check">✓</span>
              <span>{receiverName}</span>
              {receiverUpiId !== receiverInput && (
                <span className="receiver-upi-hint">({receiverUpiId})</span>
              )}
            </div>
          )}
          {!isSearching && !receiverName && receiverInput.length >= 3 && (
            <span className="pay-not-found">User not found</span>
          )}
        </div>

        {/* Amount */}
        <div className="pay-amount-section">
          <span className="rupee-symbol">₹</span>
          <input
            type="number"
            className="pay-amount-input"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
          />
        </div>

        {/* Description */}
        <div className="pay-field">
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="pay-note-input"
          />
        </div>

        {/* Pay Button */}
        <button
          type="submit"
          className="pay-submit-btn"
          disabled={isSending || !receiverName}
        >
          {isSending ? (
            <span className="pay-btn-loading">
              <span className="spinner-sm" /> Sending...
            </span>
          ) : (
            `Pay${amount ? ` ₹${parseFloat(amount).toLocaleString("en-IN")}` : ""}`
          )}
        </button>
      </form>

      {/* ── PIN Verification Modal ──────────────────────── */}
      {showPinModal && (
        <div className="modal-overlay">
          <div className="activation-modal-content" style={{ maxWidth: "400px", padding: "2rem", flexDirection: "column" }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "var(--primary-light)", color: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", margin: "0 auto 1rem", fontWeight: "bold"
              }}>🔒</div>
              <h3 style={{ margin: "0 0 0.25rem" }}>Confirm Payment</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
                Enter your Transaction PIN to pay <strong>₹{parseFloat(amount).toLocaleString("en-IN")}</strong> to <strong>{receiverName}</strong>
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <input
                type="password"
                placeholder="Enter PIN"
                maxLength="6"
                value={pin}
                autoFocus
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) setPin(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmPayment();
                }}
                style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.5rem", padding: "0.8rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowPinModal(false); setPin(""); }}>Cancel</button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleConfirmPayment}
                disabled={isSending || pin.length < 4}
              >
                {isSending ? "Processing..." : "Confirm Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pay;
