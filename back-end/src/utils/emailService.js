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
  // Add timeout settings
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 5000,
  socketTimeout: 10000, // 10 seconds
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
    // Add timeout wrapper
    const sendWithTimeout = Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), 15000) // 15 second timeout
      )
    ]);
    
    const info = await sendWithTimeout;
    logger.info(`OTP email sent to ${email} - Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send OTP email to ${email}: ${error.message}`);
    throw new Error("Failed to send OTP email");
  }
};

// Send transaction email (credited/debited)
export const sendTransactionEmail = async ({
  to,
  name,
  type, // "credited" | "debited"
  amount,
  counterpartyName,
  transactionId,
  description,
  timestamp,
  balanceAfter,
}) => {
  const subject = type === "credited"
    ? "NIDHI - Money Credited"
    : "NIDHI - Money Debited";

  const amountText = `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const balanceText = balanceAfter !== undefined && balanceAfter !== null
    ? `₹${Number(balanceAfter).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
    : "";
  const directionText = type === "credited" ? "credited to" : "debited from";

  const mailOptions = {
    from: `"NIDHI Platform" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 28px; text-align: center; color: white; }
          .content { padding: 32px 28px; }
          .amount { font-size: 28px; font-weight: 800; color: #111827; }
          .pill { display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; color: #065f46; background: #d1fae5; }
          .row { margin: 10px 0; color: #374151; }
          .label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .footer { background: #f5f7fb; padding: 18px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">💰 NIDHI</h1>
            <p style="margin:6px 0 0;">Transaction Alert</p>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your account was <span class="pill">${type.toUpperCase()}</span>.</p>
            <div class="amount">${amountText}</div>
            <div class="row">Amount ${directionText} your account ${type === "credited" ? "from" : "to"} <strong>${counterpartyName}</strong>.</div>
            ${description ? `<div class="row"><span class="label">Note</span><br/>${description}</div>` : ""}
            <div class="row"><span class="label">Transaction ID</span><br/>${transactionId}</div>
            <div class="row"><span class="label">Date & Time</span><br/>${new Date(timestamp).toLocaleString("en-IN")}</div>
            ${balanceText ? `<div class="row"><span class="label">Balance After</span><br/>${balanceText}</div>` : ""}
          </div>
          <div class="footer">
            <p>© 2026 NIDHI Platform. This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const sendWithTimeout = Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email timeout")), 15000)
      ),
    ]);

    const info = await sendWithTimeout;
    logger.info(`Transaction email sent to ${to} - Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send transaction email to ${to}: ${error.message}`);
    return false;
  }
};
