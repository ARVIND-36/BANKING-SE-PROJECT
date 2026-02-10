import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [recentPeople, setRecentPeople] = useState([]);
  const [payInput, setPayInput] = useState("");
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    fetchWalletData();
    fetchRecentPeople();
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await api.get("/wallet/balance");
      setBalance(parseFloat(res.data.data.balance));
      setUpiId(res.data.data.upiId);
    } catch (err) {
      console.error("Failed to fetch wallet data");
    }
  };

  const fetchRecentPeople = async () => {
    try {
      const res = await api.get("/wallet/transactions?limit=20");
      const txns = res.data.data.transactions || [];
      // Extract unique people from transactions
      const peopleMap = new Map();
      txns.forEach((txn) => {
        const person = txn.otherParty;
        if (person && !peopleMap.has(person.upiId)) {
          peopleMap.set(person.upiId, {
            name: person.name,
            upiId: person.upiId,
            type: txn.type,
          });
        }
      });
      setRecentPeople(Array.from(peopleMap.values()).slice(0, 8));
    } catch (err) {
      console.error("Failed to fetch recent people");
    }
  };

  const handlePay = () => {
    const input = payInput.trim();
    if (!input) {
      toast.error("Enter a UPI ID or phone number");
      return;
    }
    navigate("/pay", { state: { prefill: input } });
  };

  const handleBankTransfer = () => {
    toast("Bank transfer integration coming soon", {
      icon: "🏦",
    });
  };

  const handlePayPerson = (person) => {
    navigate("/pay", { state: { prefill: person.upiId, name: person.name } });
  };

  const toggleBalance = async () => {
    if (!showBalance) {
      // Refresh balance when showing
      try {
        const res = await api.get("/wallet/balance");
        setBalance(parseFloat(res.data.data.balance));
      } catch (err) {
        // use cached
      }
    }
    setShowBalance(!showBalance);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "#667eea", "#764ba2", "#f093fb", "#4facfe",
      "#43e97b", "#fa709a", "#fee140", "#30cfd0",
      "#a18cd1", "#fbc2eb", "#ff9a9e", "#fad0c4",
    ];
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="home-container">
      {/* Greeting */}
      <div className="home-greeting">
        <h2>Hi, {user?.name?.split(" ")[0] || "there"} 👋</h2>
        <p className="home-upi-id">{upiId}</p>
      </div>

      {/* Scan & Pay Section */}
      <div className="home-actions-card">
        <button className="scan-btn" onClick={() => navigate("/scan")}>
          <div className="scan-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="12" y1="7" x2="12" y2="17" />
            </svg>
          </div>
          <span>Tap to Scan &amp; Pay</span>
        </button>

        <div className="pay-input-row">
          <div className="pay-input-wrapper">
            <span className="pay-input-icon">🔍</span>
            <input
              type="text"
              className="pay-input"
              placeholder="Pay by UPI ID or phone number"
              value={payInput}
              onChange={(e) => setPayInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePay()}
            />
          </div>
          <button className="pay-go-btn" onClick={handlePay}>
            Pay
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-quick-actions">
        <button className="quick-action-btn" onClick={() => navigate("/pay")}>
          <span className="qa-icon">💸</span>
          <span className="qa-label">Send</span>
        </button>
        <button className="quick-action-btn" onClick={handleBankTransfer}>
          <span className="qa-icon">🏦</span>
          <span className="qa-label">Bank Transfer</span>
        </button>
        <button className="quick-action-btn" onClick={toggleBalance}>
          <span className="qa-icon">💰</span>
          <span className="qa-label">Balance</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate("/transactions")}>
          <span className="qa-icon">📜</span>
          <span className="qa-label">History</span>
        </button>
      </div>

      {/* Balance Card (toggle) */}
      {showBalance && (
        <div className="home-balance-card" onClick={toggleBalance}>
          <div className="hb-left">
            <span className="hb-label">NIDHI Wallet Balance</span>
            <span className="hb-amount">
              ₹{balance !== null ? balance.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "---"}
            </span>
          </div>
          <span className="hb-hide">Tap to hide</span>
        </div>
      )}

      {/* Recent People */}
      <div className="home-section">
        <div className="home-section-header">
          <h3>People</h3>
          {recentPeople.length > 0 && (
            <button className="see-all-btn" onClick={() => navigate("/transactions")}>
              See all
            </button>
          )}
        </div>

        {recentPeople.length === 0 ? (
          <div className="home-empty-state">
            <span className="empty-icon">👥</span>
            <p>Your recent transactions will appear here</p>
            <button className="btn-primary-sm" onClick={() => navigate("/pay")}>
              Send your first payment
            </button>
          </div>
        ) : (
          <div className="people-grid">
            {recentPeople.map((person) => (
              <button
                key={person.upiId}
                className="person-chip"
                onClick={() => handlePayPerson(person)}
              >
                <div
                  className="person-avatar"
                  style={{ background: getAvatarColor(person.name) }}
                >
                  {getInitials(person.name)}
                </div>
                <span className="person-name">
                  {person.name?.split(" ")[0] || "User"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Promotional Cards */}
      <div className="home-promo-section">
        <div className="promo-card promo-wallet" onClick={handleBankTransfer}>
          <div className="promo-text">
            <h4>My Wallet</h4>
            <p>Add money, send &amp; manage your NIDHI wallet</p>
          </div>
          <span className="promo-arrow">→</span>
        </div>
        <div className="promo-card promo-bank" onClick={handleBankTransfer}>
          <div className="promo-text">
            <h4>Bank Accounts</h4>
            <p>Link your bank accounts for easy transfers</p>
          </div>
          <span className="promo-arrow">→</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
