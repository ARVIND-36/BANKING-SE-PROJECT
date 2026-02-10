import { useNavigate } from "react-router-dom";

const ScanPay = () => {
  const navigate = useNavigate();

  return (
    <div className="scan-container">
      <div className="scan-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h2>Scan &amp; Pay</h2>
      </div>

      <div className="scan-body">
        <div className="scan-viewfinder">
          <div className="scan-corner tl" />
          <div className="scan-corner tr" />
          <div className="scan-corner bl" />
          <div className="scan-corner br" />
          <div className="scan-placeholder-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
          </div>
          <div className="scan-line" />
        </div>
        <p className="scan-instruction">Point camera at a QR code to pay</p>
        <p className="scan-coming-soon">📷 Camera integration coming soon</p>
        <button className="btn-primary-sm" onClick={() => navigate("/pay")} style={{ marginTop: "1.5rem" }}>
          Enter UPI ID manually instead
        </button>
      </div>
    </div>
  );
};

export default ScanPay;
