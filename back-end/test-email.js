// Quick test script to verify email service
import { sendOTPEmail } from "./src/utils/emailService.js";
import dotenv from "dotenv";

dotenv.config();

const testEmail = async () => {
  try {
    console.log("🧪 Testing OTP Email Service...");
    console.log(`📧 SMTP Email: ${process.env.SMTP_EMAIL}`);
    console.log(`📬 Sending test OTP to: ${process.env.SMTP_EMAIL}`);
    
    const testOTP = "123456";
    await sendOTPEmail(process.env.SMTP_EMAIL, testOTP, "Test User");
    
    console.log("✅ Test email sent successfully!");
    console.log("📨 Check your inbox for the OTP email");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
};

testEmail();
