import { Router } from "express";
import { createOrder, getOrderDetails, processPayment } from "../controllers/gateway.controller.js";
import { processRefund } from "../controllers/refund.controller.js";
import { authenticateApiKey } from "../middleware/apiKeyAuth.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// Public route for fetching order details on checkout page
router.get("/orders/:orderId", getOrderDetails);

// Payment Execution (User must be logged in to pay)
router.post("/pay", authenticateToken, processPayment);

// Protected Developer APIs (require API Key)
router.post("/orders", authenticateApiKey, createOrder);
router.post("/refunds", authenticateApiKey, processRefund);

export default router;
