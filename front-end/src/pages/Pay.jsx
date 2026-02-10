import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const Pay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill || "";
  const prefillName = location.state?.name || "";

  const [receiverUpiId, setReceiverUpiId] = useState(prefill);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receiverName, setReceiverName] = useState(prefillName);
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchUser = async (upiIdOrPhone) => {
    if (!upiIdOrPhone || upiIdOrPhone.length < 3) {
      setReceiverName("");
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get(`/wallet/search?upiId=${upiIdOrPhone}`);
      setReceiverName(res.data.data.name);
    } catch {
      setReceiverName("");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!receiverUpiId.trim()) {
      toast.error("Enter a UPI ID or phone number");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setIsSending(true);
    try {
      const res = await api.post("/wallet/send", {
        receiverUpiId: receiverUpiId.trim(),
        amount: parseFloat(amount),
        description: description.trim(),
      });
      toast.success(res.data.message || "Payment successful!");
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
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h2>Pay</h2>
      </div>

      <form onSubmit={handleSend} className="pay-form">
        {/* Receiver Input */}
        <div className="pay-field">
          <label>To</label>
          <input
            type="text"
            placeholder="UPI ID or phone number"
            value={receiverUpiId}
            onChange={(e) => {
              setReceiverUpiId(e.target.value);
              searchUser(e.target.value);
            }}
            autoFocus
          />
          {isSearching && <span className="pay-searching">Searching...</span>}
          {receiverName && (
            <div className="pay-receiver-found">
              <span className="receiver-check">✓</span>
              <span>{receiverName}</span>
            </div>
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
          {isSending ? "Sending..." : `Pay${amount ? ` ₹${amount}` : ""}`}
        </button>
      </form>
    </div>
  );
};

export default Pay;
