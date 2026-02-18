import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import ActivationModal from "../components/ActivationModal";
import DeveloperDocs from "../components/DeveloperDocs";

const SUPPORT_EMAIL = "pnarvind05@gmail.com";

/* ── Pre-activation landing page ─────────────────────────── */
const MerchantLanding = ({ onActivate }) => {
    return (
        <div className="home-container" style={{ maxWidth: "720px", paddingBottom: "6rem" }}>
            {/* Hero */}
            <div style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                borderRadius: "20px",
                padding: "2.5rem 2rem",
                color: "#fff",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                marginBottom: "1.5rem",
            }}>
                <div style={{
                    position: "absolute", inset: 0, opacity: 0.08,
                    backgroundImage: "radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{
                        width: "72px", height: "72px", borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1rem", fontSize: "2rem",
                        border: "2px solid rgba(255,255,255,0.3)",
                    }}>🏪</div>
                    <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.6rem", fontWeight: 700 }}>
                        NIDHI Payment Gateway
                    </h2>
                    <p style={{ margin: 0, fontSize: "1rem", opacity: 0.92, lineHeight: 1.5 }}>
                        Accept payments on your website or app with a simple API integration.
                        <br />Start collecting payments in minutes.
                    </p>
                </div>
            </div>

            {/* What You Get */}
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>What You Get</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.75rem" }}>
                {[
                    { icon: "🔑", title: "API Keys", desc: "Test & Live keys for secure authentication" },
                    { icon: "🔗", title: "Hosted Checkout", desc: "Ready-made payment page — no frontend needed" },
                    { icon: "💰", title: "Auto Settlement", desc: "Daily settlement at 9 PM IST to your bank" },
                    { icon: "📊", title: "Dashboard", desc: "Track payments, balances & settlement history" },
                ].map((f, i) => (
                    <div key={i} style={{
                        background: "var(--bg-card)", borderRadius: "14px",
                        padding: "1rem", border: "1px solid var(--border)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                    }}>
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{f.icon}</div>
                        <h4 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 600 }}>{f.title}</h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* How It Works */}
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>How It Works</h3>
            <div style={{
                background: "var(--bg-card)", borderRadius: "14px",
                padding: "1.25rem", border: "1px solid var(--border)",
                marginBottom: "1.75rem",
            }}>
                {[
                    { step: "1", title: "Activate Your Merchant Account", desc: "Fill basic info, contact details & bank account. Verify with OTP." },
                    { step: "2", title: "Generate API Keys", desc: "Create Test keys for development and Live keys for production." },
                    { step: "3", title: "Create Orders via API", desc: "POST to /api/v1/orders with amount, currency & returnUrl using Basic Auth." },
                    { step: "4", title: "Redirect to Hosted Checkout", desc: "Send your customer to /pay/checkout/:orderId — NIDHI handles the payment UI." },
                    { step: "5", title: "Get Paid", desc: "Payments settle to your bank automatically every day at 9 PM IST." },
                ].map((s, i) => (
                    <div key={i} style={{
                        display: "flex", gap: "0.85rem", alignItems: "flex-start",
                        padding: "0.75rem 0",
                        borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                    }}>
                        <div style={{
                            width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "0.85rem",
                        }}>{s.step}</div>
                        <div>
                            <h4 style={{ margin: "0 0 0.2rem", fontSize: "0.9rem", fontWeight: 600 }}>{s.title}</h4>
                            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Activate CTA */}
            <button
                onClick={onActivate}
                style={{
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#fff",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "none",
                    borderRadius: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    marginBottom: "1rem",
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.5)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.4)"; }}
            >
                🚀 Activate Merchant Account
            </button>

            {/* Contact */}
            <div style={{
                textAlign: "center",
                padding: "1rem",
                borderRadius: "12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
            }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Have questions about the gateway integration?
                </p>
                <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
                >
                    📧 {SUPPORT_EMAIL}
                </a>
            </div>
        </div>
    );
};

/* ── Integration Guide (post-activation) ─────────────────── */
const IntegrationGuide = () => {
    const [expandedStep, setExpandedStep] = useState(null);

    const steps = [
        {
            num: "1",
            title: "Generate API Keys",
            desc: "Go to the API Keys section above and generate a Test Key first. You'll get a Key ID and a Secret Key.",
            details: `• Click "+ Test Key" to generate a test credential.
• IMPORTANT: Save the Secret Key immediately — it is shown only once.
• Use Test keys during development (no real money moves).
• When ready for production, generate a Live Key.`,
        },
        {
            num: "2",
            title: "Create an Order (Server-Side)",
            desc: "From your backend, call our API to create a payment order.",
            details: `POST /api/v1/orders
Authorization: Basic base64(key_id:key_secret)
Content-Type: application/json

Body:
{
  "amount": 500,          // Amount in INR
  "currency": "INR",
  "description": "Order #123",
  "returnUrl": "https://yoursite.com/payment-status"
}

Response:
{
  "success": true,
  "data": {
    "orderId": "ord_abc123",
    "checkout_url": "https://nidhi-app.com/pay/checkout/ord_abc123"
  }
}`,
        },
        {
            num: "3",
            title: "Redirect Customer to Checkout",
            desc: "Send the customer to the checkout_url returned in step 2. NIDHI handles the payment UI.",
            details: `• The user sees a secure hosted checkout page.
• They enter their UPI ID / wallet credentials and confirm with their PIN.
• No need to build your own payment form — we handle it.
• After payment, the user is redirected to your returnUrl.`,
        },
        {
            num: "4",
            title: "Verify Payment Status",
            desc: "After the customer pays, check the order status from your backend.",
            details: `GET /api/v1/orders/:orderId
Authorization: Basic base64(key_id:key_secret)

Response:
{
  "success": true,
  "data": {
    "orderId": "ord_abc123",
    "status": "paid",       // "pending" | "paid" | "failed"
    "amount": 500,
    "paidAt": "2026-02-18T..."
  }
}

Only deliver goods / services when status === "paid".`,
        },
        {
            num: "5",
            title: "Receive Settlement",
            desc: "Payments automatically settle to your bank account every day at 9 PM IST.",
            details: `• Paid amounts appear as "Pending Settlement" in your dashboard.
• At 9 PM IST daily, pending balance is transferred to "Available Balance".
• You'll receive a settlement confirmation email.
• You can also trigger manual settlement using the "⚡ Do Settlement" button.`,
        },
    ];

    return (
        <div className="home-section" style={{ marginTop: "1.5rem" }}>
            <div className="home-section-header">
                <h3>📋 Integration Guide</h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Follow these steps to integrate NIDHI Payment Gateway into your app or website.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {steps.map((s) => (
                    <div key={s.num} style={{
                        background: "var(--bg-card)", borderRadius: "12px",
                        border: expandedStep === s.num ? "1px solid var(--primary)" : "1px solid var(--border)",
                        overflow: "hidden", transition: "border-color 0.2s",
                    }}>
                        <button
                            onClick={() => setExpandedStep(expandedStep === s.num ? null : s.num)}
                            style={{
                                width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                                padding: "1rem", background: "none", border: "none",
                                cursor: "pointer", textAlign: "left",
                            }}
                        >
                            <div style={{
                                width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                                background: "linear-gradient(135deg, #10b981, #059669)",
                                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 700, fontSize: "0.8rem",
                            }}>{s.num}</div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: "0 0 0.15rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{s.title}</h4>
                                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>{s.desc}</p>
                            </div>
                            <svg
                                width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="var(--text-muted)" strokeWidth="2"
                                style={{ transform: expandedStep === s.num ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {expandedStep === s.num && (
                            <div style={{
                                padding: "0 1rem 1rem 3.5rem",
                                animation: "stepFadeIn 0.2s ease-out",
                            }}>
                                <pre style={{
                                    margin: 0, padding: "1rem", borderRadius: "8px",
                                    background: "#1e293b", color: "#e2e8f0",
                                    fontSize: "0.8rem", fontFamily: "monospace",
                                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                                    lineHeight: 1.6, overflowX: "auto",
                                }}>
                                    {s.details}
                                </pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Support contact */}
            <div style={{
                marginTop: "1.25rem", padding: "1rem", borderRadius: "12px",
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: "0.75rem",
            }}>
                <span style={{ fontSize: "1.3rem" }}>💬</span>
                <div>
                    <p style={{ margin: "0 0 0.15rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        Need help integrating?
                    </p>
                    <a href={`mailto:${SUPPORT_EMAIL}`} style={{ fontSize: "0.82rem", color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>
                        {SUPPORT_EMAIL}
                    </a>
                </div>
            </div>
        </div>
    );
};

/* ── Main MerchantDashboard ──────────────────────────────── */
const MerchantDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);   // true = server error (not "no merchant")
    const [newKey, setNewKey] = useState(null);
    const [settling, setSettling] = useState(false);
    const [showActivationModal, setShowActivationModal] = useState(false);

    const doSettlement = async () => {
        if (!window.confirm("Run settlement now? This will move pending balance to available balance and send a settlement email.")) return;
        setSettling(true);
        try {
            const res = await api.post("/merchants/settle");
            const data = res.data;
            if (data.success) {
                toast.success(`Settlement done! ${data.count} merchant(s) settled.`);
                fetchData();
            } else {
                toast.error(data.message || "Settlement failed");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Settlement failed");
        } finally {
            setSettling(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setFetchError(false);
        try {
            const [profileRes, keysRes] = await Promise.all([
                api.get("/merchants/profile"),
                api.get("/merchants/keys").catch(() => ({ data: { data: [] } })), // keys are optional
            ]);
            // Backend returns { success: true, data: null } when user has no merchant account
            // and { success: true, data: {...} } when they do — never treat a 500 as "no merchant"
            setProfile(profileRes.data.data);
            setKeys(keysRes.data.data || []);
        } catch (error) {
            const status = error.response?.status;
            if (status === 404) {
                // Definitively no merchant account yet — show landing page
                setProfile(null);
            } else {
                // 500 / network error — DO NOT show activation page, show error banner
                console.error("Merchant fetch error:", error);
                setFetchError(true);
            }
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

    /* ── Server/DB error → show retry banner, NOT the activation page ── */
    if (fetchError) {
        return (
            <div className="home-container" style={{ maxWidth: "480px", paddingTop: "3rem", textAlign: "center" }}>
                <div style={{
                    background: "var(--bg-card)", borderRadius: "16px",
                    border: "1px solid var(--border)", padding: "2rem",
                }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
                    <h3 style={{ margin: "0 0 0.5rem" }}>Couldn't Load Dashboard</h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
                        There was a temporary issue connecting to the server.
                        Your merchant account is safe — please try again.
                    </p>
                    <button
                        onClick={() => { setLoading(true); fetchData(); }}
                        style={{
                            padding: "0.75rem 2rem", borderRadius: "12px", border: "none",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem",
                        }}
                    >
                        🔄 Retry
                    </button>
                    <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Still having issues? Contact{" "}
                        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--primary)" }}>{SUPPORT_EMAIL}</a>
                    </p>
                </div>
            </div>
        );
    }

    /* ── Not yet a merchant → show landing page + activation modal ── */
    if (!profile) {
        return (
            <>
                <MerchantLanding onActivate={() => setShowActivationModal(true)} />
                <ActivationModal
                    isOpen={showActivationModal}
                    onClose={() => setShowActivationModal(false)}
                    onSuccess={() => {
                        setShowActivationModal(false);
                        window.location.reload();
                    }}
                />
            </>
        );
    }

    /* ── Merchant activated → full dashboard ── */
    return (
        <div className="home-container" style={{ maxWidth: "800px", paddingBottom: "6rem" }}>
            <div className="home-section-header">
                <h3>Merchant Dashboard</h3>
                <span style={{
                    padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600,
                    background: profile.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    color: profile.status === "active" ? "#059669" : "#d97706",
                }}>{profile.status}</span>
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
                        {parseFloat(profile.pendingBalance) > 0 && (
                            <button
                                onClick={doSettlement}
                                disabled={settling}
                                style={{
                                    marginTop: "0.5rem",
                                    padding: "6px 16px",
                                    fontSize: "0.8rem",
                                    fontWeight: "600",
                                    background: settling ? "#9ca3af" : "linear-gradient(135deg, #f59e0b, #d97706)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: settling ? "not-allowed" : "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                {settling ? "Settling..." : "⚡ Do Settlement"}
                            </button>
                        )}
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
                                <span className={`txn-status ${key.isActive ? "success" : "failed"}`}>
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
                    {keys.length === 0 && <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>No API keys found. Generate one above to get started.</div>}
                </div>
            </div>

            {/* Step-by-step Integration Guide */}
            <IntegrationGuide />

            {/* Developer Code Snippets */}
            <DeveloperDocs />
        </div>
    );
};

export default MerchantDashboard;
