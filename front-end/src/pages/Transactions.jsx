import { useState, useEffect } from "react";
import api from "../services/api";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/wallet/transactions?limit=100");
      setTransactions(res.data.data.transactions || []);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = filter === "all"
    ? transactions
    : transactions.filter((t) => t.type === filter);

  const groupByDate = (txns) => {
    const groups = {};
    txns.forEach((txn) => {
      const date = new Date(txn.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label;
      if (date.toDateString() === today.toDateString()) {
        label = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = "Yesterday";
      } else {
        label = date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(txn);
    });
    return groups;
  };

  const grouped = groupByDate(filtered);

  if (isLoading) {
    return (
      <div className="loading-container" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="txn-page-container">
      <div className="txn-page-title">
        <h2>Transaction History</h2>
      </div>

      {/* Filter Tabs */}
      <div className="txn-filters">
        {["all", "sent", "received"].map((f) => (
          <button
            key={f}
            className={`txn-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "sent" ? "Sent" : "Received"}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="txn-empty">
          <span className="empty-icon">📭</span>
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="txn-grouped-list">
          {Object.entries(grouped).map(([date, txns]) => (
            <div key={date} className="txn-date-group">
              <h4 className="txn-date-label">{date}</h4>
              <div className="txn-date-items">
                {txns.map((txn) => (
                  <div key={txn.id} className={`txn-row ${txn.type}`}>
                    <div className={`txn-row-icon ${txn.type}`}>
                      {txn.type === "sent" ? "↑" : "↓"}
                    </div>
                    <div className="txn-row-details">
                      <span className="txn-row-name">
                        {txn.otherParty?.name || "Unknown"}
                      </span>
                      <span className="txn-row-upi">
                        {txn.otherParty?.upiId}
                      </span>
                      {txn.description && (
                        <span className="txn-row-desc">{txn.description}</span>
                      )}
                    </div>
                    <div className="txn-row-right">
                      <span className={`txn-row-amount ${txn.type}`}>
                        {txn.type === "sent" ? "−" : "+"}₹
                        {parseFloat(txn.amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span className="txn-row-time">
                        {new Date(txn.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;
