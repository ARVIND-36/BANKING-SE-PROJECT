import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import { toast } from "react-hot-toast";
import ActivationModal from "../components/ActivationModal";

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [merchantProfile, setMerchantProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showActivationModal, setShowActivationModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinStep, setPinStep] = useState(1); // 1: Request OTP, 2: Enter PIN & OTP
    const [pinData, setPinData] = useState({ otp: "", pin: "", confirmPin: "" });
    const [otpLoading, setOtpLoading] = useState(false);

    useEffect(() => {
        fetchMerchantStatus();
    }, []);

    const fetchMerchantStatus = async () => {
        try {
            const res = await api.get("/merchants/profile");
            setMerchantProfile(res.data.data);
        } catch (error) {
            console.error("Error fetching merchant profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const activateMerchant = async () => {
        // Called after successful activation from modal
        await fetchMerchantStatus();
        setShowActivationModal(false);
    };

    const handlePinModalOpen = () => {
        setPinCheckStep(1); // Reset step
        setPinData({ otp: "", pin: "", confirmPin: "" });
        setShowPinModal(true);
    };

    const handlePinOtpRequest = async () => {
        setOtpLoading(true);
        try {
            await api.post("/pin/otp");
            toast.success("OTP sent to your email");
            setPinStep(2); // Enable OTP input or move to next step visually
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handlePinSubmit = async (e) => {
        if (e) e.preventDefault();
        const { otp, pin, confirmPin } = pinData;
        if (!pin || !confirmPin) return toast.error("Please enter and confirm your PIN");
        if (pin !== confirmPin) return toast.error("PINs do not match");
        if (pin.length < 4 || pin.length > 6) return toast.error("PIN must be 4-6 digits");
        if (!otp) return toast.error("Please enter the OTP sent to your email");

        setOtpLoading(true); // Reuse otpLoading or create new one? reuse for now as it locks UI
        try {
            await api.post("/pin/set", { otp, pin });
            toast.success("Transaction PIN set successfully!");
            setShowPinModal(false);
            setPinData({ otp: "", pin: "", confirmPin: "" });
            setPinStep(1);
            if (refreshUser) await refreshUser();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to set PIN");
        } finally {
            setOtpLoading(false);
        }
    };

    const [pinCheckStep, setPinCheckStep] = useState(1); // 1: Enter PINs, 2: OTP Sent

    if (!user) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="home-container">
            <div className="pay-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h2>My Profile</h2>
            </div>

            <div className="auth-card" style={{ marginTop: "1rem", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div className="header-avatar" style={{ width: "64px", height: "64px", fontSize: "1.5rem" }}>
                        {user.name[0].toUpperCase()}
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>{user.name}</h3>
                        <span className={`txn-status ${user.isVerified ? "success" : "pending"} `} style={{ fontSize: "0.75rem" }}>
                            {user.isVerified ? "Verified User" : "Unverified"}
                        </span>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label>Email</label>
                    <div style={{ padding: "0.6rem", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
                        {user.email}
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label>Mobile</label>
                    <div style={{ padding: "0.6rem", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
                        {user.mobile}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>PAN Card</label>
                        <div style={{ padding: "0.6rem", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
                            {user.panCard || "N/A"}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Aadhaar</label>
                        <div style={{ padding: "0.6rem", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
                            {user.aadhaarNumber || "N/A"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction PIN Section */}
            <div className="home-section" style={{ marginTop: "1.5rem" }}>
                <div className="home-section-header">
                    <h3>Security</h3>
                </div>
                <div className="transaction-item" style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", justifyContent: "space-between" }}>
                    <div className="txn-left">
                        <div className="qa-icon-circle" style={{ background: "var(--primary-dark)", color: "#fff" }}>🔒</div>
                        <div className="txn-details">
                            <span className="txn-name">Transaction PIN</span>
                            <span className="txn-time">
                                {user.hasSetPin
                                    ? "PIN is set • Required for all payments"
                                    : "Set up PIN to enable payments"}
                            </span>
                            {user.hasSetPin && user.lastPinChange && (
                                <span className="txn-time" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    {(() => {
                                        const lastChange = new Date(user.lastPinChange);
                                        const nextChange = new Date(lastChange);
                                        nextChange.setMonth(nextChange.getMonth() + 3);
                                        const now = new Date();
                                        if (now < nextChange) {
                                            return `Next change allowed: ${nextChange.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                                        }
                                        return "PIN change available";
                                    })()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="txn-right">
                        <button className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={handlePinModalOpen}>
                            {user.hasSetPin ? "Change PIN" : "Set PIN"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Merchant Section */}
            <div className="home-section" style={{ marginTop: "1.5rem" }}>
                <div className="home-section-header">
                    <h3>Merchant Status</h3>
                    {merchantProfile && <span className="status-badge active">Active</span>}
                </div>

                {loading ? (
                    <div className="spinner-sm"></div>
                ) : merchantProfile ? (
                    <div className="transaction-item" style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--primary-light)" }}>
                        <div className="txn-left">
                            <div className="qa-icon-circle" style={{ background: "var(--primary)", color: "#fff" }}>M</div>
                            <div className="txn-details">
                                <span className="txn-name">{merchantProfile.businessName}</span>
                                <span className="txn-time">Merchant ID: {merchantProfile.id}</span>
                            </div>
                        </div>
                        <div className="txn-right">
                            <button className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => navigate("/merchant")}>
                                Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="auth-card" style={{ textAlign: "center", padding: "1.5rem", background: "linear-gradient(145deg, #f0f9ff, #fff)" }}>
                        <h4 style={{ color: "var(--primary-dark)" }}>Accept Payments with NIDHI</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.5rem 0 1rem" }}>
                            Activate your merchant account to generate API keys and accept payments on your website.
                        </p>
                        <button className="btn-primary" onClick={() => setShowActivationModal(true)}>
                            Activate Merchant Account
                        </button>
                    </div>
                )}
            </div>

            <ActivationModal
                isOpen={showActivationModal}
                onClose={() => setShowActivationModal(false)}
                onSuccess={activateMerchant}
            />

            {/* PIN Modal */}
            {showPinModal && (
                <div className="modal-overlay">
                    <div className="activation-modal-content" style={{ maxWidth: "400px", padding: "2rem", flexDirection: "column" }}>
                        <h3>{user.hasSetPin ? "Change Transaction PIN" : "Set Transaction PIN"}</h3>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                            {pinStep === 1
                                ? "Step 1: Create your new numeric PIN."
                                : "Step 2: Enter the OTP sent to your email to confirm."}
                        </p>

                        <div className="form-group" style={{ marginBottom: "1rem" }}>
                            <label>New PIN (Numbers Only)</label>
                            <input
                                type="password"
                                placeholder="4-6 digits"
                                maxLength="6"
                                value={pinData.pin}
                                onChange={(e) => {
                                    if (/^\d*$/.test(e.target.value)) setPinData({ ...pinData, pin: e.target.value });
                                }}
                                disabled={pinStep === 2} // Disable if OTP sent, or maybe keep editable? Let's keep editable.
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                            <label>Confirm PIN</label>
                            <input
                                type="password"
                                placeholder="Confirm PIN"
                                maxLength="6"
                                value={pinData.confirmPin}
                                onChange={(e) => {
                                    if (/^\d*$/.test(e.target.value)) setPinData({ ...pinData, confirmPin: e.target.value });
                                }}
                                disabled={pinStep === 2}
                            />
                        </div>

                        {pinStep === 1 && (
                            <button
                                className="btn-primary"
                                style={{ width: "100%", marginBottom: "1rem" }}
                                onClick={() => {
                                    if (!pinData.pin || !pinData.confirmPin) return toast.error("Please enter a PIN");
                                    if (pinData.pin !== pinData.confirmPin) return toast.error("PINs do not match");
                                    if (pinData.pin.length < 4) return toast.error("PIN too short");
                                    handlePinOtpRequest();
                                }}
                                disabled={otpLoading}
                            >
                                {otpLoading ? "Sending OTP..." : "Get OTP"}
                            </button>
                        )}

                        {pinStep === 2 && (
                            <div className="form-group" style={{ marginBottom: "1rem" }}>
                                <label>Email OTP</label>
                                <input
                                    type="text"
                                    placeholder="Enter OTP"
                                    value={pinData.otp}
                                    onChange={(e) => setPinData({ ...pinData, otp: e.target.value })}
                                    autoFocus
                                />
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowPinModal(false)}>Cancel</button>
                            {pinStep === 2 && (
                                <button
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={handlePinSubmit}
                                    disabled={otpLoading}
                                >
                                    {otpLoading ? "Verifying..." : "Confirm & Set"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
