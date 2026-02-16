import { useState } from "react";

const DeveloperDocs = () => {
    const [activeTab, setActiveTab] = useState("curl");

    const codeSnippets = {
        curl: `curl -X POST https://nidhi-app.com/api/v1/orders \\
  -u "your_key_id:your_key_secret" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 500,
    "currency": "INR",
    "description": "Test Order #123",
    "returnUrl": "https://your-site.com/callback"
  }'`,
        node: `const axios = require('axios');

const createOrder = async () => {
  try {
    const response = await axios.post(
      'https://nidhi-app.com/api/v1/orders',
      {
        amount: 500,
        currency: 'INR',
        description: 'Test Order #123',
        returnUrl: 'https://your-site.com/callback'
      },
      {
        auth: {
          username: 'your_key_id',
          password: 'your_key_secret'
        }
      }
    );
    console.log('Order created:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};`
    };

    return (
        <div className="home-section" style={{ marginTop: "2rem" }}>
            <div className="home-section-header">
                <h3>Developer Integration</h3>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                Integrate NIDHI Payments into your application using our simple REST API.
                Use your API Keys from the panel above to authenticate.
            </p>

            <div style={{ background: "#1e293b", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ display: "flex", borderBottom: "1px solid #334155" }}>
                    <button
                        onClick={() => setActiveTab("curl")}
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: activeTab === "curl" ? "#334155" : "transparent",
                            color: activeTab === "curl" ? "#fff" : "#94a3b8",
                            border: "none", cursor: "pointer", fontWeight: "500"
                        }}
                    >
                        cURL
                    </button>
                    <button
                        onClick={() => setActiveTab("node")}
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: activeTab === "node" ? "#334155" : "transparent",
                            color: activeTab === "node" ? "#fff" : "#94a3b8",
                            border: "none", cursor: "pointer", fontWeight: "500"
                        }}
                    >
                        Node.js
                    </button>
                </div>
                <div style={{ padding: "1.5rem", position: "relative" }}>
                    <pre style={{ margin: 0, fontFamily: "monospace", color: "#e2e8f0", fontSize: "0.85rem", overflowX: "auto" }}>
                        {codeSnippets[activeTab]}
                    </pre>
                    <button
                        onClick={() => navigator.clipboard.writeText(codeSnippets[activeTab])}
                        style={{
                            position: "absolute", top: "1rem", right: "1rem",
                            padding: "0.4rem 0.8rem", background: "rgba(255,255,255,0.1)",
                            border: "none", borderRadius: "4px", color: "#fff", fontSize: "0.75rem", cursor: "pointer"
                        }}
                    >
                        Copy
                    </button>
                </div>
            </div>

            <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                    <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>1. Create an Order</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Call the API to generate a unique <code>orderId</code>.
                    </p>
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-elevated)", borderRadius: "8px" }}>
                    <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>2. Redirect User</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Send users to <code>/pay/checkout/:orderId</code> to complete payment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeveloperDocs;
