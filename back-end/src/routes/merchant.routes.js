import { Router } from "express";
import { registerMerchant, getMerchantProfile, requestActivationOtp } from "../controllers/merchant.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

import { generateApiKey, getApiKeys, revokeApiKey } from "../controllers/apiKey.controller.js";
import { registerWebhook, getWebhooks, deleteWebhook, getWebhookEvents } from "../controllers/webhook.controller.js";
import { triggerSettlement } from "../controllers/settlement.controller.js";

const router = Router();

// All routes require login first
router.use(authenticateToken);

// POST /api/merchants/request-activation-otp - Request OTP for merchant activation
router.post("/request-activation-otp", requestActivationOtp);

// POST /api/merchants/register - Upgrade current user to merchant
router.post("/register", registerMerchant);

// GET /api/merchants/profile - Get merchant details
router.get("/profile", getMerchantProfile);

// API Keys
router.get("/keys", getApiKeys);
router.post("/keys/generate", generateApiKey);
router.post("/keys/revoke", revokeApiKey);

// Webhooks
router.get("/webhooks", getWebhooks);
router.post("/webhooks", registerWebhook);
router.post("/webhooks/delete", deleteWebhook);
router.get("/webhooks/events", getWebhookEvents);

// Settlements (Manual trigger for demo purposes)
router.post("/settle", triggerSettlement);

export default router;
