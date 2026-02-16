import { eq } from "drizzle-orm";
import db from "../config/db.js";
import { users, merchants } from "../models/schema.js";
import logger from "../utils/logger.js";
import nodemailer from "nodemailer";

// ─── OTP HELPERS ────────────────────────────────────────────
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
        subject: "NIDHI Merchant Activation OTP",
        text: `Your OTP for merchant account activation is: ${otp}. This OTP expires in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};

// ─── REQUEST ACTIVATION OTP ─────────────────────────────────
export const requestActivationOtp = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if already a merchant
        const existing = await db.select().from(merchants).where(eq(merchants.userId, userId));
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Merchant account already exists" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // Save OTP to user record
        await db.update(users).set({ otp, otpExpiry }).where(eq(users.id, userId));

        // Fetch user email
        const user = await db.select().from(users).where(eq(users.id, userId));
        const userEmail = user[0].email;

        // Send OTP via Email (or log in dev mode)
        if (process.env.SMTP_EMAIL) {
            await sendOtpEmail(userEmail, otp);
        } else {
            logger.info(`[DEV] Merchant activation OTP for ${userEmail}: ${otp}`);
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent to your registered email",
            data: { otp: process.env.NODE_ENV === 'development' ? otp : null }
        });
    } catch (error) {
        logger.error(`Request merchant OTP error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── REGISTER MERCHANT (WITH KYB) ──────────────────────────
export const registerMerchant = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            otp,
            businessName,
            businessType,
            businessCategory,
            businessDescription,
            businessWebsite,
            gstNumber,
            businessPan,
            registrationNumber,
            addressStreet,
            addressCity,
            addressState,
            addressPinCode,
            bankAccountName,
            bankName,
            accountNumber,
            ifscCode,
            accountType,
            businessEmail,
            businessPhone,
            supportEmail,
            supportPhone,
        } = req.body;

        // ── Validation ──────────────────────────────────────
        if (!businessName || !businessType || !businessCategory) {
            return res.status(400).json({ success: false, message: "Business name, type, and category are required" });
        }

        if (!otp) {
            return res.status(400).json({ success: false, message: "OTP is required" });
        }

        // Check if already a merchant
        const existing = await db.select().from(merchants).where(eq(merchants.userId, userId));
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Merchant account already exists" });
        }

        // ── Verify OTP ──────────────────────────────────────
        const user = await db.select().from(users).where(eq(users.id, userId));
        if (user.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const userData = user[0];
        if (!userData.otp || userData.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
        if (new Date() > new Date(userData.otpExpiry)) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        // ── Create Merchant ─────────────────────────────────
        const newMerchant = await db
            .insert(merchants)
            .values({
                userId,
                businessName,
                businessType,
                businessCategory,
                businessDescription,
                businessWebsite,
                gstNumber,
                businessPan,
                registrationNumber,
                addressStreet,
                addressCity,
                addressState,
                addressPinCode,
                bankAccountName,
                bankName,
                accountNumber,
                ifscCode,
                accountType,
                businessEmail,
                businessPhone,
                supportEmail,
                supportPhone,
                status: "active",
                kybStatus: "pending", // Can be manually verified later
            })
            .returning();

        // Clear OTP
        await db.update(users).set({ otp: null, otpExpiry: null }).where(eq(users.id, userId));

        logger.info(`Merchant activated: ${businessName} (User ID: ${userId})`);

        return res.status(201).json({
            success: true,
            message: "Merchant account activated successfully!",
            data: newMerchant[0],
        });
    } catch (error) {
        logger.error(`Merchant registration error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET MERCHANT PROFILE ───────────────────────────────────
export const getMerchantProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db
            .select({
                id: merchants.id,
                businessName: merchants.businessName,
                businessType: merchants.businessType,
                businessCategory: merchants.businessCategory,
                businessDescription: merchants.businessDescription,
                businessWebsite: merchants.businessWebsite,
                gstNumber: merchants.gstNumber,
                businessPan: merchants.businessPan,
                registrationNumber: merchants.registrationNumber,
                addressStreet: merchants.addressStreet,
                addressCity: merchants.addressCity,
                addressState: merchants.addressState,
                addressPinCode: merchants.addressPinCode,
                bankAccountName: merchants.bankAccountName,
                bankName: merchants.bankName,
                accountNumber: merchants.accountNumber,
                ifscCode: merchants.ifscCode,
                accountType: merchants.accountType,
                businessEmail: merchants.businessEmail,
                businessPhone: merchants.businessPhone,
                supportEmail: merchants.supportEmail,
                supportPhone: merchants.supportPhone,
                availableBalance: merchants.availableBalance,
                pendingBalance: merchants.pendingBalance,
                status: merchants.status,
                kybStatus: merchants.kybStatus,
                kybVerifiedAt: merchants.kybVerifiedAt,
                createdAt: merchants.createdAt,
                user: {
                    name: users.name,
                    email: users.email,
                }
            })
            .from(merchants)
            .innerJoin(users, eq(merchants.userId, users.id))
            .where(eq(merchants.userId, userId));

        if (result.length === 0) {
            return res.status(200).json({ success: true, data: null });
        }

        return res.status(200).json({ success: true, data: result[0] });
    } catch (error) {
        logger.error(`Get merchant profile error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
