import { eq } from "drizzle-orm";
import db from "../config/db.js";
import { apiKeys, merchants } from "../models/schema.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";

export const authenticateApiKey = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Basic ")) {
            return res.status(401).json({
                success: false,
                message: "Missing or invalid Authorization header. Use Basic Auth with your API Key ID as the username and API Key Secret as the password."
            });
        }

        // Decode Basic Auth credentials
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
        const [keyId, keySecret] = credentials.split(":");

        if (!keyId || !keySecret) {
            return res.status(401).json({ success: false, message: "Invalid API credentials format" });
        }

        // Find the API key record by public ID
        const keyRecord = await db
            .select({
                id: apiKeys.id,
                keySecretHash: apiKeys.keySecretHash,
                merchantId: apiKeys.merchantId,
                isActive: apiKeys.isActive,
                type: apiKeys.type
            })
            .from(apiKeys)
            .where(eq(apiKeys.keyId, keyId));

        if (keyRecord.length === 0 || !keyRecord[0].isActive) {
            return res.status(401).json({ success: false, message: "Invalid or inactive API Key" });
        }

        // Verify the secret key
        const isMatch = await bcrypt.compare(keySecret, keyRecord[0].keySecretHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid API Key Secret" });
        }

        // Attach merchant info to request
        req.merchant = {
            id: keyRecord[0].merchantId,
            keyType: keyRecord[0].type, // live or test
        };

        // Update last used timestamp (async, don't await)
        db.update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, keyRecord[0].id))
            .catch(err => logger.error(`Failed to update key usage: ${err.message}`));

        next();
    } catch (error) {
        logger.error(`API Key Auth Error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
