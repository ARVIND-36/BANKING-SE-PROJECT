import express from "express";
import { updateUsersWithUpiIds } from "../controllers/migration.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin/dev endpoint to update existing users with UPI IDs
router.post("/update-upi-ids", authenticateToken, updateUsersWithUpiIds);

export default router;
