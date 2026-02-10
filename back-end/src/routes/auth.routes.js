import { Router } from "express";
import { register, login, getProfile, verifyOTP, resendOTP } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/verify-otp
router.post("/verify-otp", verifyOTP);

// POST /api/auth/resend-otp
router.post("/resend-otp", resendOTP);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/profile  (protected)
router.get("/profile", authenticateToken, getProfile);

export default router;
