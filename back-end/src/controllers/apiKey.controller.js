import { eq, and } from "drizzle-orm";
import db from "../config/db.js";
import { merchants, apiKeys } from "../models/schema.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Helper: Generate random key
const generateKey = (prefix) => {
    const random = crypto.randomBytes(24).toString("hex");
    return `${prefix}_${random}`;
};

// ─── GET API KEYS ──────────────────────────────────────────
export const getApiKeys = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find merchant
        const merchant = await db.select().from(merchants).where(eq(merchants.userId, userId));
        if (merchant.length === 0) return res.status(403).json({ success: false, message: "Not a merchant" });

        const keys = await db
            .select({
                id: apiKeys.id,
                keyId: apiKeys.keyId,
                type: apiKeys.type,
                isActive: apiKeys.isActive,
                createdAt: apiKeys.createdAt,
                lastUsedAt: apiKeys.lastUsedAt,
            })
            .from(apiKeys)
            .where(eq(apiKeys.merchantId, merchant[0].id));

        return res.status(200).json({ success: true, data: keys });
    } catch (error) {
        logger.error(`Get API keys error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GENERATE NEW KEY ──────────────────────────────────────
export const generateApiKey = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.body; // "live" or "test"

        if (!["live", "test"].includes(type)) {
            return res.status(400).json({ success: false, message: "Invalid key type" });
        }

        const merchant = await db.select().from(merchants).where(eq(merchants.userId, userId));
        if (merchant.length === 0) return res.status(403).json({ success: false, message: "Not a merchant" });
        const merchantId = merchant[0].id;

        // Generate keys
        const publicKey = generateKey(type === "live" ? "pk_live" : "pk_test");
        const secretKey = generateKey(type === "live" ? "sk_live" : "sk_test");

        // Hash secret key
        const salt = await bcrypt.genSalt(10);
        const keySecretHash = await bcrypt.hash(secretKey, salt);

        // Save to DB
        await db.insert(apiKeys).values({
            merchantId,
            keyId: publicKey,
            keySecretHash,
            type,
            permissions: ["read", "write"],
        });

        logger.info(`Generated ${type} API key for merchant ${merchantId}`);

        return res.status(201).json({
            success: true,
            data: {
                keyId: publicKey,
                keySecret: secretKey, // Only shown once!
                type,
                warning: "Save this Secret Key now! You won't be able to see it again.",
            },
        });
    } catch (error) {
        logger.error(`Generate API key error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── REVOKE KEY ────────────────────────────────────────────
export const revokeApiKey = async (req, res) => {
    try {
        const userId = req.user.id;
        const { keyId } = req.body;

        const merchant = await db.select().from(merchants).where(eq(merchants.userId, userId));
        if (merchant.length === 0) return res.status(403).json({ success: false, message: "Not a merchant" });

        await db
            .update(apiKeys)
            .set({ isActive: false })
            .where(and(eq(apiKeys.keyId, keyId), eq(apiKeys.merchantId, merchant[0].id)));

        logger.info(`Revoked API key ${keyId} for merchant ${merchant[0].id}`);

        return res.status(200).json({ success: true, message: "API Key revoked successfully" });
    } catch (error) {
        logger.error(`Revoke API key error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
