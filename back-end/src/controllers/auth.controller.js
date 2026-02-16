import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, or, and, lt } from "drizzle-orm";
import db from "../config/db.js";
import { users } from "../models/schema.js";
import logger from "../utils/logger.js";
import { generateOTP, sendOTPEmail } from "../utils/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "nidhi_super_secret_key_2026";
const JWT_EXPIRES_IN = "7d";
const OTP_EXPIRY_MINUTES = 10;

// ─── REGISTER ────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, mobile, panCard, aadhaarNumber, password } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !panCard || !aadhaarNumber || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Validate PAN card format (ABCDE1234F)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panCard)) {
      return res.status(400).json({ success: false, message: "Invalid PAN card format. Expected: ABCDE1234F" });
    }

    // Validate Aadhaar number (12 digits)
    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(aadhaarNumber)) {
      return res.status(400).json({ success: false, message: "Invalid Aadhaar number. Must be 12 digits" });
    }

    // Validate mobile number (10 digits)
    const mobileRegex = /^[6-9][0-9]{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ success: false, message: "Invalid mobile number. Must be 10 digits starting with 6-9" });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, email),
          eq(users.mobile, mobile),
          eq(users.panCard, panCard),
          eq(users.aadhaarNumber, aadhaarNumber)
        )
      );

    if (existingUser.length > 0) {
      const existing = existingUser[0];
      let conflictField = "details";
      if (existing.email === email) conflictField = "email";
      else if (existing.mobile === mobile) conflictField = "mobile number";
      else if (existing.panCard === panCard) conflictField = "PAN card";
      else if (existing.aadhaarNumber === aadhaarNumber) conflictField = "Aadhaar number";

      logger.warn(`Registration attempt with existing ${conflictField}: ${email}`);
      return res.status(409).json({
        success: false,
        message: `User with this ${conflictField} already exists`,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Generate UPI ID from email or name
    const generateUpiId = (email, name) => {
      const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      return `${username}@nidhi`;
    };

    const upiId = generateUpiId(email, name);

    // Insert user (unverified with OTP)
    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        mobile,
        panCard,
        aadhaarNumber,
        password: hashedPassword,
        isVerified: false,
        otp,
        otpExpiry,
        upiId,
        walletBalance: "0.00",
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        mobile: users.mobile,
        upiId: users.upiId,
      });

    // Send OTP email (with timeout and fallback for dev)
    try {
      await sendOTPEmail(email, otp, name);
      logger.info(`New user registered: ${email} (${name}) - OTP sent`);

      return res.status(201).json({
        success: true,
        message: "Registration successful! Please check your email for OTP verification.",
        data: {
          userId: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          // Only send OTP in response for development (remove in production)
          ...(process.env.NODE_ENV === 'development' && { otp }),
        },
      });
    } catch (emailError) {
      // Don't delete user, just log the error and ask them to resend OTP
      logger.error(`Failed to send OTP email: ${email} - ${emailError.message}`);

      return res.status(201).json({
        success: true,
        message: "Registration successful! Email service is slow. Please use resend OTP.",
        data: {
          userId: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          emailFailed: true,
          // Only send OTP in response for development (remove in production)
          ...(process.env.NODE_ENV === 'development' && { otp }),
        },
      });
    }
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── VERIFY OTP ──────────────────────────────────────────────
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    // Find user by email
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUsers.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = existingUsers[0];

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User is already verified" });
    }

    // Check OTP
    if (user.otp !== otp) {
      logger.warn(`Invalid OTP attempt for user: ${email}`);
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Check OTP expiry
    const now = new Date();
    if (user.otpExpiry && now > user.otpExpiry) {
      logger.warn(`Expired OTP attempt for user: ${email}`);
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // Update user as verified and clear OTP
    await db
      .update(users)
      .set({
        isVerified: true,
        otp: null,
        otpExpiry: null,
      })
      .where(eq(users.id, user.id));

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info(`User verified successfully: ${email}`);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          panCard: user.panCard,
        },
        token,
      },
    });
  } catch (error) {
    logger.error(`OTP verification error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── RESEND OTP ──────────────────────────────────────────────
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Find user by email
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUsers.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = existingUsers[0];

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User is already verified" });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update OTP in database
    await db
      .update(users)
      .set({
        otp,
        otpExpiry,
      })
      .where(eq(users.id, user.id));

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, user.name);
      logger.info(`OTP resent to: ${email}`);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully! Please check your email.",
      });
    } catch (emailError) {
      logger.error(`Failed to resend OTP email: ${email}`);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again."
      });
    }
  } catch (error) {
    logger.error(`Resend OTP error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // identifier can be email or mobile
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Mobile and password are required",
      });
    }

    // Find user by email or mobile
    const existingUsers = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.mobile, identifier)));

    if (existingUsers.length === 0) {
      logger.warn(`Login attempt for non-existent user: ${identifier}`);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = existingUsers[0];

    // Check if user is verified
    if (!user.isVerified) {
      logger.warn(`Login attempt for unverified user: ${identifier}`);
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
        requiresVerification: true,
        email: user.email,
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for user: ${identifier}`);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info(`User logged in: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          panCard: user.panCard,
          aadhaarNumber: user.aadhaarNumber,
          isVerified: user.isVerified,
          hasSetPin: user.hasSetPin || false,
          lastPinChange: user.lastPinChange || null,
        },
        token,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── GET PROFILE ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        mobile: users.mobile,
        panCard: users.panCard,
        aadhaarNumber: users.aadhaarNumber,
        isVerified: users.isVerified,
        hasSetPin: users.hasSetPin,
        lastPinChange: users.lastPinChange,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: result[0] });
  } catch (error) {
    logger.error(`Profile fetch error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
