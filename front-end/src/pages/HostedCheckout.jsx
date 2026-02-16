import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/useAuth";

const HostedCheckout = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState("");

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/v1/orders/${orderId}`);
            setOrder(res.data.data);
        } catch (err) {
            setError("Invalid or expired payment link.");
        } finally {
            setLoading(false);
        }
    };

    const initiatePayment = () => {
        if (!user) {
            navigate("/login", { state: { from: `/pay/checkout/${orderId}` } });
            return;
        }

        if (!user.hasSetPin) {
            toast.error("Please set your Transaction PIN in Profile to pay.");
            setTimeout(() => navigate("/profile"), 2000);
            return;
        }

        setShowPinModal(true);
    };

    const handlePayment = async () => {
        if (!pin) return toast.error("Please enter your PIN");

        setProcessing(true);
        try {
            // First verify PIN
            await api.post("/pin/verify", { pin });

            // If verified, proceed with payment
            const res = await api.post("/v1/pay", { orderId });
            toast.success("Payment Successful!");
            setShowPinModal(false);

            if (order.returnUrl) {
                setTimeout(() => {
                    window.location.href = `${order.returnUrl}?payment_id=${res.data.data.paymentId}&status=success`;
                }, 1500);
            } else {
                setTimeout(() => navigate("/transactions"), 1500);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Payment failed");
            setProcessing(false);
        }
    };

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8f9fa" }}>
            <div className="spinner"></div>
        </div>
    );

    if (error) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8f9fa" }}>
                <div className="auth-card" style={{ textAlign: "center", maxWidth: "400px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                    <h3 style={{ color: "var(--danger)" }}>Unable to Load Order</h3>
                    <p style={{ color: "var(--text-secondary)" }}>{error}</p>
                </div>
            </div>
        );
    }

    if (order.status === "paid") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8f9fa" }}>
                <div className="auth-card" style={{ textAlign: "center", maxWidth: "400px", padding: "3rem 2rem" }}>
                    <div style={{
                        width: "80px", height: "80px", background: "#dcfce7", color: "#166534",
                        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2.5rem", margin: "0 auto 1.5rem"
                    }}>
                        ✓
                    </div>
                    <h2 style={{ marginBottom: "0.5rem" }}>Payment Successful</h2>
                    <p style={{ color: "var(--text-secondary)" }}>Transaction ID: {order.id}</p>
                    <div style={{ margin: "2rem 0", fontSize: "1.5rem", fontWeight: "bold" }}>
                        {order.currency} {order.amount}
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Redirecting you back to the merchant...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div className="checkout-grid">

                {/* Left Side - Order Details */}
                <div style={{ padding: "3rem", background: "#1e293b", color: "#fff", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
                            <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                                M
                            </div>
                            <span style={{ fontSize: "1.1rem", fontWeight: "500", opacity: 0.9 }}>{user ? `Paying to Merchant ${order.merchantId}` : "NIDHI Secure Pay"}</span>
                        </div>

                        <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>
                            Total Amount
                        </div>
                        <div style={{ fontSize: "3.5rem", fontWeight: "800", marginBottom: "2rem", lineHeight: 1 }}>
                            <span style={{ fontSize: "2rem", verticalAlign: "top", marginRight: "4px" }}>{order.currency === 'INR' ? '₹' : order.currency}</span>
                            {order.amount}
                        </div>

                        <div style={{ marginBottom: "2rem" }}>
                            <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem", opacity: 0.7 }}>Order Description</div>
                            <div style={{ fontSize: "1.1rem", lineHeight: "1.5" }}>{order.description || "Payment for order"}</div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", opacity: 0.6, marginTop: "auto" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <span>Secure Payment by NIDHI</span>
                        </div>
                    </div>

                    {/* Background Pattern */}
                    <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", background: "var(--primary)", borderRadius: "50%", opacity: 0.1, filter: "blur(40px)" }}></div>
                    <div style={{ position: "absolute", bottom: "-50px", left: "-50px", width: "300px", height: "300px", background: "var(--secondary)", borderRadius: "50%", opacity: 0.1, filter: "blur(50px)" }}></div>
                </div>

                {/* Right Side - Payment Action */}
                <div style={{ padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h2 style={{ marginBottom: "2rem", color: "#1e293b" }}>Complete your payment</h2>

                    {user ? (
                        <div style={{ marginBottom: "2rem" }}>
                            <div style={{ padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                                    {user.name[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Paying as</div>
                                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{user.name}</div>
                                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{user.email}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Wallet Balance</div>
                                    <div style={{ fontWeight: "700", color: "var(--primary)" }}>₹{user.balance || user.walletBalance || "0.00"}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", marginBottom: "2rem", textAlign: "center" }}>
                            <p style={{ marginBottom: "1rem", color: "#475569" }}>Please login to your NIDHI account to complete this transaction.</p>
                            <button
                                onClick={() => navigate("/login", { state: { from: `/pay/checkout/${orderId}` } })}
                                style={{ background: "#fff", border: "1px solid #cbd5e1", padding: "0.75rem 1.5rem", borderRadius: "8px", fontWeight: "600", color: "#334155", cursor: "pointer", width: "100%" }}
                            >
                                Login to Pay
                            </button>
                        </div>
                    )}

                    <button
                        className="btn-primary"
                        onClick={initiatePayment}
                        disabled={processing || !user}
                        style={{
                            width: "100%",
                            padding: "1rem",
                            fontSize: "1.1rem",
                            borderRadius: "8px",
                            opacity: processing || !user ? 0.7 : 1
                        }}
                    >
                        {processing ? "Processing Payment..." : `Pay ₹${order.amount}`}
                    </button>

                    <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "#94a3b8" }}>
                        Protected by 256-bit encryption. <br />
                        <span onClick={() => navigate("/")} style={{ color: "var(--primary)", cursor: "pointer", textDecoration: "underline" }}>Cancel and return to NIDHI</span>
                    </div>
                </div>

            </div>

            {/* PIN Verification Modal */}
            {showPinModal && (
                <div className="modal-overlay">
                    <div className="activation-modal-content" style={{ maxWidth: "400px", padding: "2rem", flexDirection: "column" }}>
                        <h3>Enter Transaction PIN</h3>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                            Enter your 4-6 digit security PIN to authorize this payment of ₹{order.amount}.
                        </p>

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
                                    if (e.key === 'Enter') handlePayment();
                                }}
                                style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.5rem", padding: "0.8rem" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowPinModal(false)}>Cancel</button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={handlePayment} disabled={processing}>
                                {processing ? "Verifying..." : "Confirm Pay"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostedCheckout;
