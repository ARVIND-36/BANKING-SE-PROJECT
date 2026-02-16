import { eq, desc } from "drizzle-orm";
import db from "../config/db.js";
import { webhookEndpoints, webhookEvents, merchants } from "../models/schema.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

// ─── REGISTER WEBHOOK ──────────────────────────────────────
export const registerWebhook = async (req, res) => {
    try {
        const userId = req.user.id;
        const { url, events } = req.body;

        if (!url) return res.status(400).json({ success: false, message: "URL is required" });

        // Find merchant
        const merchant = await db.select().from(merchants).where(eq(merchants.userId, userId));
        if (merchant.length === 0) return res.status(403).json({ success: false, message: "Not a merchant" });

        const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

        const newWebhook = await db
            .insert(webhookEndpoints)
            .values({
                merchantId: merchant[0].id,
                url,
                secret,
                events: events || ["payment.success", "payment.failed"],
            })
            .returning();

        logger.info(`Webhook registered for merchant ${merchant[0].id}`);

        return res.status(201).json({ success: true, data: newWebhook[0] });
    } catch (error) {
        logger.error(`Register webhook error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── LIST WEBHOOKS ─────────────────────────────────────────
export const getWebhooks = async (req, res) => {
    try {
        const userId = req.user.id;
        const merchant = await db.select().from(merchants).where(eq(merchants.userId, userId));
        if (merchant.length === 0) return res.status(403).json({ success: false, message: "Not a merchant" });

        const endpoints = await db
            .select()
            .from(webhookEndpoints)
            .where(eq(webhookEndpoints.merchantId, merchant[0].id));

        return res.status(200).json({ success: true, data: endpoints });
    } catch (error) {
        logger.error(`Get webhooks error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── DELETE WEBHOOK ────────────────────────────────────────
export const deleteWebhook = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.body;

        const merchant = await db.select().from(merchants).where(eq(merchants.userId, userId));
        if (merchant.length === 0) return res.status(403).json({ success: false, message: "Not a merchant" });

        await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, id));

        return res.status(200).json({ success: true, message: "Webhook deleted" });
    } catch (error) {
        logger.error(`Delete webhook error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET WEBHOOK EVENTS (LOGS) ─────────────────────────────
export const getWebhookEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const merchant = await db.select().from(merchants).where(eq(merchants.userId, userId));
        if (merchant.length === 0) return res.status(403).json({ success: false, message: "Not a merchant" });

        const events = await db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.merchantId, merchant[0].id))
            .orderBy(desc(webhookEvents.createdAt))
            .limit(20);

        return res.status(200).json({ success: true, data: events });
    } catch (error) {
        logger.error(`Get webhook events error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
