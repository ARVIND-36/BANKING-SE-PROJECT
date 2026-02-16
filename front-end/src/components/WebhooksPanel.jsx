import { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";

const WebhooksPanel = () => {
    const [webhooks, setWebhooks] = useState([]);
    const [events, setEvents] = useState([]);
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [whRes, evtRes] = await Promise.all([
                api.get("/merchants/webhooks"),
                api.get("/merchants/webhooks/events"),
            ]);
            setWebhooks(whRes.data.data);
            setEvents(evtRes.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addWebhook = async () => {
        if (!url) return;
        setLoading(true);
        try {
            await api.post("/merchants/webhooks", { url });
            toast.success("Webhook added");
            setUrl("");
            fetchData();
        } catch (err) {
            toast.error("Failed to add webhook");
        } finally {
            setLoading(false);
        }
    };

    const deleteWebhook = async (id) => {
        if (!window.confirm("Remove this webhook?")) return;
        try {
            await api.post("/merchants/webhooks/delete", { id });
            fetchData();
            toast.success("Webhook removed");
        } catch (err) { toast.error("Failed to remove"); }
    };

    return (
        <div className="home-section" style={{ marginTop: "2rem" }}>
            <div className="home-section-header">
                <h3>Webhooks</h3>
            </div>

            {/* Add Webhook Form */}
            <div className="form-row" style={{ gridTemplateColumns: "3fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                    type="text"
                    placeholder="https://your-api.com/webhook"
                    className="form-group input"
                    style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border)" }}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <button className="btn-primary" style={{ margin: 0, fontSize: "0.9rem" }} onClick={addWebhook} disabled={loading}>
                    {loading ? "Adding..." : "+ Add URL"}
                </button>
            </div>

            {/* Webhooks List */}
            <div className="transaction-list" style={{ marginBottom: "1.5rem" }}>
                {webhooks.map((wh) => (
                    <div key={wh.id} className="transaction-item">
                        <div className="txn-left">
                            <div className="qa-icon-circle" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--primary)" }}>
                                W
                            </div>
                            <div className="txn-details">
                                <span className="txn-name" style={{ fontSize: "0.85rem" }}>{wh.url}</span>
                                <code style={{ fontSize: "0.7rem", background: "#f1f5f9", padding: "2px 4px", borderRadius: "4px" }}>
                                    Secret: {wh.secret}
                                </code>
                            </div>
                        </div>
                        <div className="txn-right">
                            <button onClick={() => deleteWebhook(wh.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {webhooks.length === 0 && <div style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>No webhooks configured.</div>}
            </div>

            {/* Logs */}
            <div className="home-section-header">
                <h3>Recent Deliveries</h3>
            </div>
            <div className="transaction-list">
                {events.map((evt) => (
                    <div key={evt.id} className="transaction-item" style={{ padding: "0.75rem 1rem" }}>
                        <div className="txn-left">
                            <div
                                className="qa-icon-circle"
                                style={{
                                    width: "28px", height: "28px", fontSize: "0.7rem",
                                    background: evt.status === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                    color: evt.status === "success" ? "var(--primary)" : "var(--danger)"
                                }}
                            >
                                {evt.status === "success" ? "✓" : "✕"}
                            </div>
                            <div className="txn-details">
                                <span className="txn-name" style={{ fontSize: "0.8rem" }}>{evt.type}</span>
                                <span className="txn-time">{new Date(evt.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="txn-right">
                            <span className={`txn-status ${evt.status}`}>{evt.status}</span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{evt.responseStatus}</span>
                        </div>
                    </div>
                ))}
                {events.length === 0 && <div style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>No events yet.</div>}
            </div>
        </div>
    );
};

export default WebhooksPanel;
