import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

const Wallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [upiId, setUpiId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);

  // Send money form
  const [sendForm, setSendForm] = useState({
    receiverUpiId: "",
    amount: "",
    description: "",
  });
  const [receiverName, setReceiverName] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Add money form
  const [addAmount, setAddAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await api.get("/wallet/balance");
      setBalance(res.data.data.balance);
      setUpiId(res.data.data.upiId);
    } catch (err) {
      toast.error("Failed to fetch wallet data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/wallet/transactions?limit=20");
      setTransactions(res.data.data.transactions);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  const searchUserByUpiId = async (upiIdToSearch) => {
    if (!upiIdToSearch) {
      setReceiverName("");
      return;
    }

    try {
      const res = await api.get(`/wallet/search?upiId=${upiIdToSearch}`);
      setReceiverName(res.data.data.name);
    } catch (err) {
      setReceiverName("");
      if (upiIdToSearch.length > 5) {
        toast.error("UPI ID not found");
      }
    }
  };

  const handleSendMoney = async (e) => {
    e.preventDefault();

    if (!sendForm.receiverUpiId || !sendForm.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    if (parseFloat(sendForm.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (parseFloat(sendForm.amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsSending(true);
    try {
      const res = await api.post("/wallet/send", sendForm);
      toast.success(res.data.message);
      setBalance(parseFloat(res.data.data.newBalance));
      setSendForm({ receiverUpiId: "", amount: "", description: "" });
      setReceiverName("");
      setShowSendMoney(false);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();

    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setIsAdding(true);
    try {
      const res = await api.post("/wallet/add-money", { amount: parseFloat(addAmount) });
      toast.success(res.data.message);
      setBalance(parseFloat(res.data.data.newBalance));
      setAddAmount("");
      setShowAddMoney(false);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add money");
    } finally {
      setIsAdding(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    toast.success("UPI ID copied!");
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      {/* Balance Card */}
      <div className="wallet-balance-card">
        <div className="balance-header">
          <span className="balance-label">Wallet Balance</span>
          <span className="currency">INR</span>
        </div>
        <div className="balance-amount">₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        <div className="upi-id-section">
          <span className="upi-label">Your UPI ID:</span>
          <div className="upi-id-box">
            <span className="upi-id">{upiId}</span>
            <button onClick={copyUpiId} className="btn-copy" title="Copy UPI ID">
              📋
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="wallet-actions">
        <button onClick={() => setShowSendMoney(true)} className="action-btn send-btn">
          <span className="action-icon">💸</span>
          <span>Send Money</span>
        </button>
        <button onClick={() => setShowAddMoney(true)} className="action-btn add-btn">
          <span className="action-icon">➕</span>
          <span>Add Money</span>
        </button>
      </div>

      {/* Send Money Modal */}
      {showSendMoney && (
        <div className="modal-overlay" onClick={() => setShowSendMoney(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Money</h3>
              <button onClick={() => setShowSendMoney(false)} className="modal-close">
                ✕
              </button>
            </div>
            <form onSubmit={handleSendMoney} className="modal-form">
              <div className="form-group">
                <label>Receiver UPI ID</label>
                <input
                  type="text"
                  placeholder="username@nidhi"
                  value={sendForm.receiverUpiId}
                  onChange={(e) => {
                    setSendForm({ ...sendForm, receiverUpiId: e.target.value });
                    searchUserByUpiId(e.target.value);
                  }}
                  required
                />
                {receiverName && <p className="receiver-name">✓ {receiverName}</p>}
              </div>

              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={balance}
                  value={sendForm.amount}
                  onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Payment for..."
                  value={sendForm.description}
                  onChange={(e) => setSendForm({ ...sendForm, description: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={isSending || !receiverName}>
                {isSending ? "Sending..." : "Send Money"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="modal-overlay" onClick={() => setShowAddMoney(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Money</h3>
              <button onClick={() => setShowAddMoney(false)} className="modal-close">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddMoney} className="modal-form">
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max="10000"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  required
                />
                <p className="helper-text">Max: ₹10,000 per transaction</p>
              </div>

              <button type="submit" className="btn-primary" disabled={isAdding}>
                {isAdding ? "Adding..." : "Add Money"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="transactions-section">
        <h3>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="no-transactions">No transactions yet</p>
        ) : (
          <div className="transactions-list">
            {transactions.map((txn) => (
              <div key={txn.id} className={`transaction-item ${txn.type}`}>
                <div className="txn-icon">{txn.type === "sent" ? "↑" : "↓"}</div>
                <div className="txn-details">
                  <div className="txn-party">
                    {txn.type === "sent" ? "To:" : "From:"} {txn.otherParty.name}
                  </div>
                  <div className="txn-upi">{txn.otherParty.upiId}</div>
                  {txn.description && <div className="txn-desc">{txn.description}</div>}
                  <div className="txn-time">{new Date(txn.timestamp).toLocaleString()}</div>
                </div>
                <div className={`txn-amount ${txn.type}`}>
                  {txn.type === "sent" ? "-" : "+"}₹{txn.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
