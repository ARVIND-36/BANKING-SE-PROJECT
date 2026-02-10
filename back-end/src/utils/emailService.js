import nodemailer from "nodemailer";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

// Create nodemailer transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"NIDHI Platform" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "NIDHI - Verify Your Account",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .otp-box { background: #f0ebff; border: 2px dashed #6c3ce0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .otp-code { font-size: 36px; font-weight: bold; color: #6c3ce0; letter-spacing: 8px; margin: 10px 0; }
          .footer { background: #f5f7fb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          .btn { display: inline-block; background: #6c3ce0; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 NIDHI</h1>
            <p>Your UPI & Loan Platform</p>
          </div>
          <div class="content">
            <h2>Hello ${name}! 👋</h2>
            <p>Thank you for registering with NIDHI. To complete your account verification, please use the OTP below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Your One-Time Password</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Valid for 10 minutes</p>
            </div>
            
            <p>If you didn't request this OTP, please ignore this email.</p>
            <p style="color: #6b7280; font-size: 14px;">This OTP is confidential. Do not share it with anyone.</p>
          </div>
          <div class="footer">
            <p>© 2026 NIDHI Platform. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email} - Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send OTP email to ${email}: ${error.message}`);
    throw new Error("Failed to send OTP email");
  }
};
