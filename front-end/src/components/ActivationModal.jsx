import React, { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import "./ActivationModal.css";

export default function ActivationModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);

    // Simplified form data for students
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        businessName: "",
        businessType: "individual", // Default for students
        businessCategory: "",
        businessDescription: "",
        businessWebsite: "",
        // Step 2: Contact & Identity
        businessEmail: "",
        businessPhone: "",
        addressCity: "",
        addressState: "",
        // Optional student verification
        gstNumber: "", // Can be college ID or left empty
        // Step 3: Payment Details
        bankAccountName: "",
        accountNumber: "",
        ifscCode: "",
        accountType: "savings", // Default savings for students
        // OTP
        otp: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateStep = (stepNum) => {
        if (stepNum === 1) {
            if (!formData.businessName || !formData.businessCategory) {
                toast.error("Please fill all required fields");
                return false;
            }
        } else if (stepNum === 2) {
            if (!formData.businessEmail || !formData.businessPhone) {
                toast.error("Please provide your contact details");
                return false;
            }
        } else if (stepNum === 3) {
            if (!formData.accountNumber || !formData.ifscCode) {
                toast.error("Please provide account details for receiving payments");
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleRequestOtp = async () => {
        setOtpLoading(true);
        try {
            const res = await api.post("/merchants/request-activation-otp");
            toast.success(res.data.message || "OTP sent to your email");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.otp) {
            toast.error("Please enter the OTP");
            return;
        }

        setLoading(true);
        try {
            await api.post("/merchants/register", formData);
            toast.success("Merchant Account Activated! 🎉");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Activation failed");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getStepIcon = (stepNum) => {
        const icons = {
            1: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
            2: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
            ),
            3: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
            ),
        };
        return icons[stepNum];
    };

    const getStepTitle = () => {
        const titles = {
            1: "Basic Info",
            2: "Contact Details",
            3: "Payment & Verification",
        };
        return titles[step];
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="activation-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header with gradient */}
                <div className="activation-modal-header">
                    <div className="activation-header-content">
                        <div className="activation-icon-badge">{getStepIcon(step)}</div>
                        <div className="activation-header-text">
                            <h2>Start Accepting Payments</h2>
                            <p>
                                Step {step} of 3: {getStepTitle()}
                            </p>
                        </div>
                    </div>
                    <button className="activation-close-btn" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="activation-progress">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className={`progress-step ${num <= step ? "active" : ""} ${num < step ? "completed" : ""}`}>
                            <div className="progress-step-circle">
                                {num < step ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <span>{num}</span>
                                )}
                            </div>
                            <div className="progress-step-line" />
                        </div>
                    ))}
                </div>

                {/* Form Content */}
                <form className="activation-form" onSubmit={handleSubmit}>
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="form-step">
                            <div className="form-group">
                                <label>
                                    Your Business/Service Name <span className="required">*</span>
                                </label>
                                <input
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    placeholder="e.g. Sam's Tutoring, Campus Store, Freelance Design"
                                    required
                                />
                                <small className="field-hint">What do you want to call your merchant account?</small>
                            </div>

                            <div className="form-group">
                                <label>
                                    What do you do? <span className="required">*</span>
                                </label>
                                <select name="businessCategory" value={formData.businessCategory} onChange={handleChange} required>
                                    <option value="">Select category</option>
                                    <option value="tutoring">Tutoring / Coaching</option>
                                    <option value="freelance">Freelance Services (Design, Dev, Writing)</option>
                                    <option value="ecommerce">Selling Products (Handmade, Reselling)</option>
                                    <option value="content">Content Creation / Influencer</option>
                                    <option value="food">Food & Beverages</option>
                                    <option value="events">Event Management</option>
                                    <option value="photography">Photography / Videography</option>
                                    <option value="consulting">Consulting / Mentoring</option>
                                    <option value="other">Other Services</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Brief Description (Optional)</label>
                                <textarea
                                    name="businessDescription"
                                    value={formData.businessDescription}
                                    onChange={handleChange}
                                    placeholder="Tell us a bit about what you offer..."
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Website / Social Media Link (Optional)</label>
                                <input
                                    type="url"
                                    name="businessWebsite"
                                    value={formData.businessWebsite}
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/yourhandle or your website"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contact & Identity */}
                    {step === 2 && (
                        <div className="form-step">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>
                                        Your Email <span className="required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="businessEmail"
                                        value={formData.businessEmail}
                                        onChange={handleChange}
                                        placeholder="your.email@example.com"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Phone Number <span className="required">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="businessPhone"
                                        value={formData.businessPhone}
                                        onChange={handleChange}
                                        placeholder="9876543210"
                                        maxLength="10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Your City</label>
                                    <input name="addressCity" value={formData.addressCity} onChange={handleChange} placeholder="e.g. Mumbai" />
                                </div>

                                <div className="form-group">
                                    <label>Your State</label>
                                    <input
                                        name="addressState"
                                        value={formData.addressState}
                                        onChange={handleChange}
                                        placeholder="e.g. Maharashtra"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Student/College ID (Optional)</label>
                                <input
                                    name="gstNumber"
                                    value={formData.gstNumber}
                                    onChange={handleChange}
                                    placeholder="Your student ID or enrollment number"
                                />
                                <small className="field-hint">This helps us verify you're a student (not mandatory)</small>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Payment Details & OTP */}
                    {step === 3 && (
                        <div className="form-step">
                            <div className="info-box">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <p>We need your bank details to transfer payments you receive. Your account must be in your name.</p>
                            </div>

                            <div className="form-group">
                                <label>
                                    Account Holder Name <span className="required">*</span>
                                </label>
                                <input
                                    name="bankAccountName"
                                    value={formData.bankAccountName}
                                    onChange={handleChange}
                                    placeholder="Your full name as per bank account"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>
                                        Account Number <span className="required">*</span>
                                    </label>
                                    <input
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleChange}
                                        placeholder="Enter account number"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        IFSC Code <span className="required">*</span>
                                    </label>
                                    <input
                                        name="ifscCode"
                                        value={formData.ifscCode}
                                        onChange={handleChange}
                                        placeholder="HDFC0000123"
                                        maxLength="11"
                                        style={{ textTransform: "uppercase" }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="otp-section">
                                <div className="otp-info">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <p>We'll send a verification code to your registered email to confirm it's you</p>
                                </div>

                                <button type="button" className="otp-request-btn" onClick={handleRequestOtp} disabled={otpLoading}>
                                    {otpLoading ? "Sending..." : "Get OTP"}
                                </button>
                            </div>

                            <div className="form-group">
                                <label>
                                    Enter OTP <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="otp"
                                    value={formData.otp}
                                    onChange={handleChange}
                                    placeholder="Enter 6-digit code"
                                    maxLength="6"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="activation-actions">
                        {step > 1 && (
                            <button type="button" className="btn-secondary" onClick={handleBack}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button type="button" className="btn-primary" onClick={handleNext}>
                                Next
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                        ) : (
                            <button type="submit" className="btn-primary" onClick={handleSubmit} disabled={loading}>
                                {loading ? "Activating..." : "Start Accepting Payments 🚀"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
