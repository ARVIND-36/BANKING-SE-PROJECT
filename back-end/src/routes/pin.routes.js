import express from "express";
import { requestPinOtp, setTransactionPin, verifyTransactionPin } from "../controllers/pin.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/otp", authenticateToken, requestPinOtp);
router.post("/set", authenticateToken, setTransactionPin); // Used for both setup and change
router.post("/verify", authenticateToken, verifyTransactionPin);

export default router;
