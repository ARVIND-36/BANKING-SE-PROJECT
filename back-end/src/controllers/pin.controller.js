import { eq, and } from "drizzle-orm";
import db from "../config/db.js";
import { users } from "../models/schema.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// Helper: Check if string is numeric
const isNumeric = (str) => /^\d+$/.test(str);

// Helper: Send OTP Email
const sendOtpEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: "NIDHI Transaction PIN OTP",
        text: `Your OTP for setting up your Transaction PIN is: ${otp}. This OTP expires in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};

// ─── 1. REQUEST OTP FOR PIN SETUP ─────────────────────────────
export const requestPinOtp = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await db.select().from(users).where(eq(users.id, userId));

        if (!user.length) return res.status(404).json({ success: false, message: "User not found" });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

        // Save OTP to DB
        await db.update(users).set({ otp, otpExpiry }).where(eq(users.id, userId));

        // Send OTP via Email (or log in dev mode)
        if (process.env.SMTP_EMAIL) {
            await sendOtpEmail(user[0].email, otp);
        } else {
            logger.info(`[DEV] OTP for ${user[0].email}: ${otp}`);
        }

        return res.status(200).json({ success: true, message: "OTP sent to your email", data: { otp: process.env.NODE_ENV === 'development' ? otp : null } });
    } catch (error) {
        logger.error(`Request PIN OTP error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── 2. SETUP / CHANGE PIN ────────────────────────────────────
export const setTransactionPin = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pin, otp } = req.body;

        if (!pin || !otp) {
            return res.status(400).json({ success: false, message: "PIN and OTP are required" });
        }

        // Validate Numeric Only
        if (!isNumeric(pin)) {
            return res.status(400).json({ success: false, message: "PIN must contain only numbers" });
        }

        if (pin.length < 4 || pin.length > 6) {
            return res.status(400).json({ success: false, message: "PIN must be 4-6 digits long" });
        }

        // Fetch User
        const user = await db.select().from(users).where(eq(users.id, userId));
        if (!user.length) return res.status(404).json({ success: false, message: "User not found" });

        const userData = user[0];

        // Validate OTP
        logger.info(`PIN OTP check - stored: '${userData.otp}', received: '${otp}', expiry: ${userData.otpExpiry}`);
        if (!userData.otp || userData.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
        if (new Date() > new Date(userData.otpExpiry)) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        // Check 3-Month Cooldown if changing existing PIN
        if (userData.hasSetPin && userData.lastPinChange) {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            if (new Date(userData.lastPinChange) > threeMonthsAgo) {
                const nextChangeDate = new Date(userData.lastPinChange);
                nextChangeDate.setMonth(nextChangeDate.getMonth() + 3);
                return res.status(429).json({
                    success: false,
                    message: `You can only change your PIN once every 3 months. Next change allowed on: ${nextChangeDate.toLocaleDateString()}`
                });
            }
        }

        // Hash PIN
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        // Update User
        await db.update(users).set({
            transactionPin: hashedPin,
            hasSetPin: true,
            lastPinChange: new Date(),
            otp: null, // Clear OTP
            otpExpiry: null
        }).where(eq(users.id, userId));

        return res.status(200).json({ success: true, message: "Transaction PIN set successfully" });

    } catch (error) {
        logger.error(`Set PIN error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── 3. VERIFY PIN (For Transactions) ─────────────────────────
export const verifyTransactionPin = async (req, res) => {
    try {
        const userId = req.user.id;
        const { pin } = req.body;

        if (!pin) return res.status(400).json({ success: false, message: "PIN is required" });

        const user = await db.select().from(users).where(eq(users.id, userId));
        if (!user.length) return res.status(404).json({ success: false, message: "User not found" });

        if (!user[0].hasSetPin) {
            return res.status(400).json({ success: false, message: "Transaction PIN not set" });
        }

        const isMatch = await bcrypt.compare(pin, user[0].transactionPin);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect PIN" });
        }

        return res.status(200).json({ success: true, message: "PIN verified" });

    } catch (error) {
        logger.error(`Verify PIN error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
