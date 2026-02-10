import { Router } from "express";
import {
  getWalletBalance,
  sendMoney,
  getTransactionHistory,
  searchUserByUpiId,
  addMoney,
} from "../controllers/wallet.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// All wallet routes require authentication
router.use(authenticateToken);

// GET /api/wallet/balance
router.get("/balance", getWalletBalance);

// POST /api/wallet/send
router.post("/send", sendMoney);

// GET /api/wallet/transactions
router.get("/transactions", getTransactionHistory);

// GET /api/wallet/search?upiId=username@nidhi
router.get("/search", searchUserByUpiId);

// POST /api/wallet/add-money (for testing/demo)
router.post("/add-money", addMoney);

export default router;
