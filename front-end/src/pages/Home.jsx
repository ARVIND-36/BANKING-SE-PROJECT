import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import toast from "react-hot-toast";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentPeople, setRecentPeople] = useState([]);
  const [showBalance, setShowBalance] = useState(false);
  const [merchantProfile, setMerchantProfile] = useState(null);

  const fetchWalletData = async () => {
    try {
      const res = await api.get("/wallet/balance");
      setBalance(parseFloat(res.data.data.balance));
      setUpiId(res.data.data.upiId);
    } catch (err) {
      console.error("Failed to fetch wallet data", err);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const res = await api.get("/wallet/transactions?limit=4");
      setRecentTransactions(res.data.data.transactions || []);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  const fetchRecentPeople = async () => {
    try {
      const res = await api.get("/wallet/transactions?limit=20");
      const txns = res.data.data.transactions || [];
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
      setRecentPeople(Array.from(peopleMap.values()).slice(0, 6));
    } catch (err) {
      console.error("Failed to fetch recent people", err);
    }
  };

  const fetchMerchantProfile = async () => {
    try {
      const res = await api.get("/merchants/profile");
      setMerchantProfile(res.data.data);
    } catch (err) {
      console.error("Failed to fetch merchant profile", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchWalletData(),
        fetchRecentTransactions(),
        fetchRecentPeople(),
        fetchMerchantProfile(),
      ]);
    };
    loadData();
  }, []);

  const toggleBalance = async () => {
    if (!showBalance) {
      try {
        const res = await api.get("/wallet/balance");
        setBalance(parseFloat(res.data.data.balance));
      } catch (err) {
        console.error("Failed to refresh balance", err);
      }
    }
    setShowBalance(!showBalance);
  };

  const handlePayPerson = (person) => {
    navigate("/pay", { state: { prefill: person.upiId, name: person.name } });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = ["#10b981", "#14b8a6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <div className="home-container">
      {/* Balance Card */}
      <div className="home-balance-card" onClick={toggleBalance}>
        <div className="hb-top">
          <span className="hb-greeting">Hello, {user?.name?.split(" ")[0] || "there"}</span>
          <span className="hb-upi">{upiId}</span>
        </div>
        <div className="hb-bottom">
          <div className="hb-amount-wrap">
            <span className="hb-label">Wallet Balance</span>
            <span className="hb-amount">
              {showBalance
                ? `₹${balance !== null ? balance.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}`
                : "₹ ••••••"}
            </span>
          </div>
          <button className="hb-eye-btn" onClick={(e) => { e.stopPropagation(); toggleBalance(); }}>
            {showBalance ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="home-quick-actions">
        <button className="quick-action-btn" onClick={() => navigate("/pay")}>
          <div className="qa-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
          </div>
          <span className="qa-label">Send</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate("/scan")}>
          <div className="qa-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /></svg>
          </div>
          <span className="qa-label">Scan</span>
        </button>
        {merchantProfile && (
          <button className="quick-action-btn" onClick={() => navigate("/merchant")}>
            <div className="qa-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <span className="qa-label">Merchant</span>
          </button>
        )}
        <button className="quick-action-btn" onClick={() => navigate("/loans")}>
          <div className="qa-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          </div>
          <span className="qa-label">Loans</span>
        </button>
        <button className="quick-action-btn" onClick={() => navigate("/transactions")}>
          <div className="qa-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          </div>
          <span className="qa-label">History</span>
        </button>
      </div>

      {/* Recent People */}
      {recentPeople.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h3>Recent People</h3>
            <button className="see-all-btn" onClick={() => navigate("/transactions")}>See all</button>
          </div>
          <div className="people-grid">
            {recentPeople.map((person) => (
              <button key={person.upiId} className="person-chip" onClick={() => handlePayPerson(person)}>
                <div className="person-avatar" style={{ background: getAvatarColor(person.name) }}>
                  {getInitials(person.name)}
                </div>
                <span className="person-name">{person.name?.split(" ")[0] || "User"}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      {recentTransactions.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h3>Transactions</h3>
            <button className="see-all-btn" onClick={() => navigate("/transactions")}>See all</button>
          </div>
          <div className="transaction-list">
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="transaction-item">
                <div className="txn-left">
                  <div className="txn-avatar" style={{ background: getAvatarColor(txn.otherParty.name) }}>
                    {getInitials(txn.otherParty.name)}
                  </div>
                  <div className="txn-details">
                    <p className="txn-name">{txn.otherParty.name}</p>
                    <p className="txn-time">{formatDate(txn.timestamp)} • {formatTime(txn.timestamp)}</p>
                  </div>
                </div>
                <div className="txn-right">
                  <p className={`txn-amount ${txn.type === "sent" ? "sent" : "received"}`}>
                    {txn.type === "sent" ? "-" : "+"}₹{txn.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="txn-status">{txn.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
