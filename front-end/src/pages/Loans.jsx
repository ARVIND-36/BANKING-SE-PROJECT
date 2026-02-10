const Loans = () => {
  return (
    <div className="loans-container">
      <div className="loans-header-section">
        <h2>Loan Suggestions</h2>
        <p className="loans-subtitle">Find the best loan offers tailored for you</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="loans-coming-soon">
        <div className="coming-soon-icon">🏗️</div>
        <h3>Coming Soon!</h3>
        <p>We're working on bringing you the best loan offers from top banks and NBFCs.</p>
        <div className="loan-features-preview">
          <div className="loan-feature">
            <span className="lf-icon">🏠</span>
            <span>Home Loan</span>
          </div>
          <div className="loan-feature">
            <span className="lf-icon">🎓</span>
            <span>Education Loan</span>
          </div>
          <div className="loan-feature">
            <span className="lf-icon">🚗</span>
            <span>Vehicle Loan</span>
          </div>
          <div className="loan-feature">
            <span className="lf-icon">💼</span>
            <span>Personal Loan</span>
          </div>
          <div className="loan-feature">
            <span className="lf-icon">🏪</span>
            <span>Business Loan</span>
          </div>
          <div className="loan-feature">
            <span className="lf-icon">💳</span>
            <span>Credit Line</span>
          </div>
        </div>
      </div>

      {/* Placeholder Cards */}
      <div className="loans-placeholder-cards">
        <div className="loan-placeholder-card">
          <div className="lpc-header">
            <span className="lpc-bank">🏦 SBI</span>
            <span className="lpc-tag">Popular</span>
          </div>
          <h4>Home Loan</h4>
          <p>Interest from <strong>8.5% p.a.</strong></p>
          <div className="lpc-details">
            <span>Up to ₹5 Cr</span>
            <span>30 years tenure</span>
          </div>
          <button className="btn-notify" disabled>Notify Me</button>
        </div>

        <div className="loan-placeholder-card">
          <div className="lpc-header">
            <span className="lpc-bank">🏦 HDFC</span>
            <span className="lpc-tag">Low Rate</span>
          </div>
          <h4>Personal Loan</h4>
          <p>Interest from <strong>10.5% p.a.</strong></p>
          <div className="lpc-details">
            <span>Up to ₹40 L</span>
            <span>5 years tenure</span>
          </div>
          <button className="btn-notify" disabled>Notify Me</button>
        </div>

        <div className="loan-placeholder-card">
          <div className="lpc-header">
            <span className="lpc-bank">🏦 ICICI</span>
            <span className="lpc-tag">Quick Approval</span>
          </div>
          <h4>Education Loan</h4>
          <p>Interest from <strong>9.0% p.a.</strong></p>
          <div className="lpc-details">
            <span>Up to ₹1 Cr</span>
            <span>15 years tenure</span>
          </div>
          <button className="btn-notify" disabled>Notify Me</button>
        </div>
      </div>
    </div>
  );
};

export default Loans;
