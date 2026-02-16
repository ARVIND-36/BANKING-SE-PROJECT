import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-hot-toast";
import WebhooksPanel from "../components/WebhooksPanel";
import DeveloperDocs from "../components/DeveloperDocs";

const MerchantDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newKey, setNewKey] = useState(null); // To show secret key once

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, keysRes] = await Promise.all([
                api.get("/merchants/profile"),
                api.get("/merchants/keys"),
            ]);
            setProfile(profileRes.data.data);
            setKeys(keysRes.data.data);
        } catch (error) {
            console.error("Merchant fetch error:", error);
            // If 404, user is not a merchant yet, redirect or show register button
        } finally {
            setLoading(false);
        }
    };

    const generateKey = async (type) => {
        try {
            const res = await api.post("/merchants/keys/generate", { type });
            setNewKey(res.data.data);
            toast.success(`${type.toUpperCase()} API Key generated!`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to generate key");
        }
    };

    const revokeKey = async (keyId) => {
        if (!window.confirm("Are you sure? This will break any integration using this key.")) return;
        try {
            await api.post("/merchants/keys/revoke", { keyId });
            toast.success("Key revoked");
            fetchData();
        } catch (error) {
            console.error("Revoke key error:", error);
            toast.error("Failed to revoke key");
        }
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    if (!profile) {
        return (
            <div className="home-container" style={{ textAlign: "center", marginTop: "4rem" }}>
                <h2>Become a Merchant</h2>
                <p className="auth-subtitle" style={{ marginBottom: "2rem" }}>
                    Accept payments on your website or app.
                </p>
                <button
                    onClick={async () => {
                        const name = prompt("Enter Business Name:");
                            if (name) {
                            try {
                                await api.post("/merchants/register", { businessName: name });
                                toast.success("Welcome aboard!");
                                window.location.reload();
                            } catch (err) { console.error("Merchant register error:", err); toast.error("Failed to register"); }
                        }
                    }}
                    className="btn-primary"
                >
                    Activate Merchant Account
                </button>
            </div>
        );
    }

    return (
        <div className="home-container" style={{ maxWidth: "800px" }}>
            <div className="home-section-header">
                <h3>Merchant Dashboard</h3>
                <span className={`status - badge ${profile.status} `}>{profile.status}</span>
            </div>

            {/* Balance Card */}
            <div className="home-balance-card">
                <div className="hb-top">
                    <span className="hb-greeting">{profile.businessName}</span>
                    <span className="hb-upi">ID: {profile.id}</span>
                </div>
                <div className="hb-bottom" style={{ gap: "2rem", justifyContent: "flex-start" }}>
                    <div className="hb-amount-wrap">
                        <span className="hb-label">Available Balance</span>
                        <span className="hb-amount">₹{profile.availableBalance}</span>
                    </div>
                    <div className="hb-amount-wrap">
                        <span className="hb-label">Pending Settlement</span>
                        <span className="hb-amount" style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
                            ₹{profile.pendingBalance}
                        </span>
                    </div>
                </div>
            </div>

            {/* New Key Modal */}
            {newKey && (
                <div className="auth-card" style={{ marginBottom: "2rem", border: "1px solid var(--primary)" }}>
                    <h4 style={{ color: "var(--primary)" }}>New API Credential Generated</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--danger)", margin: "0.5rem 0" }}>
                        SAVE THIS SECRET KEY NOW. You will not see it again.
                    </p>
                    <div className="form-group">
                        <label>Public Key ID</label>
                        <input readOnly value={newKey.keyId} />
                    </div>
                    <div className="form-group" style={{ marginTop: "1rem" }}>
                        <label>Secret Key</label>
                        <input readOnly value={newKey.keySecret} style={{ fontWeight: "bold" }} />
                    </div>
                    <button
                        className="btn-primary"
                        style={{ marginTop: "1rem", padding: "0.5rem" }}
                        onClick={() => setNewKey(null)}
                    >
                        I have saved it
                    </button>
                </div>
            )}

            {/* API Keys List */}
            <div className="home-section">
                <div className="home-section-header">
                    <h3>API Keys</h3>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => generateKey("test")} className="see-all-btn">+ Test Key</button>
                        <button onClick={() => generateKey("live")} className="see-all-btn">+ Live Key</button>
                    </div>
                </div>

                <div className="transaction-list">
                    {keys.map((key) => (
                        <div key={key.id} className="transaction-item">
                            <div className="txn-left">
                                <div
                                    className="qa-icon-circle"
                                    style={{
                                        width: "32px", height: "32px",
                                        background: key.type === "live" ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)",
                                        color: key.type === "live" ? "var(--danger)" : "#3b82f6"
                                    }}
                                >
                                    {key.type === "live" ? "L" : "T"}
                                </div>
                                <div className="txn-details">
                                    <span className="txn-name" style={{ fontFamily: "monospace" }}>{key.keyId}</span>
                                    <span className="txn-time">Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="txn-right">
                                <span className={`txn - status ${key.isActive ? "success" : "failed"} `}>
                                    {key.isActive ? "Active" : "Revoked"}
                                </span>
                                {key.isActive && (
                                    <button
                                        onClick={() => revokeKey(key.keyId)}
                                        style={{
                                            background: "none", border: "none", color: "var(--danger)",
                                            fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline"
                                        }}
                                    >
                                        Revoke
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {keys.length === 0 && <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>No API keys found.</div>}
                </div>
            </div>


            <WebhooksPanel />

            <DeveloperDocs />
        </div>
    );
};

export default MerchantDashboard;
