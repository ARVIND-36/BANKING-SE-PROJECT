import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getLoanTypes, getLoanFields, checkEligibility, getMyApplications, getUserLoanProfile } from "../controllers/loan.controller.js";

const router = express.Router();

router.get("/types", authenticateToken, getLoanTypes);
router.get("/fields/:type", authenticateToken, getLoanFields);
router.get("/profile", authenticateToken, getUserLoanProfile);
router.post("/eligibility", authenticateToken, checkEligibility);
router.get("/my-applications", authenticateToken, getMyApplications);

export default router;
