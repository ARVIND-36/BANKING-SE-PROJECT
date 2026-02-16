import crypto from "crypto";
import axios from "axios";
import { eq } from "drizzle-orm";
import db from "../config/db.js";
import { webhookEndpoints, webhookEvents } from "../models/schema.js";
import logger from "../utils/logger.js";

// Helper: Sign Payload
const signPayload = (payload, secret) => {
    return crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");
};

// ─── DISPATCH EVENT ─────────────────────────────────────────
export const triggerWebhook = async (merchantId, eventType, payload) => {
    try {
        // 1. Find active endpoints for this merchant that subscribe to this event
        // For simplicity, we assume all endpoints subscribe to all events or we check array
        const endpoints = await db
            .select()
            .from(webhookEndpoints)
            .where(eq(webhookEndpoints.merchantId, merchantId));

        if (endpoints.length === 0) {
            logger.info(`No webhook endpoints for merchant ${merchantId}`);
            return;
        }

        const eventId = `evt_${crypto.randomBytes(12).toString("hex")}`;

        // 2. Log Event to DB
        await db.insert(webhookEvents).values({
            merchantId,
            eventId,
            type: eventType,
            payload,
            status: "pending",
        });

        // 3. Send to each endpoint (Fire and forget from main thread perspective, but we await here for simplicity)
        const deliveryPromises = endpoints.map(async (endpoint) => {
            // Check subscription
            if (endpoint.events && !endpoint.events.includes(eventType)) return;

            const signature = signPayload(payload, endpoint.secret);

            try {
                const response = await axios.post(endpoint.url, payload, {
                    headers: {
                        "Content-Type": "application/json",
                        "X-Nidhi-Signature": signature,
                        "X-Nidhi-Event-Id": eventId,
                    },
                    timeout: 5000,
                });

                // Update Event Status
                await db
                    .update(webhookEvents)
                    .set({
                        status: "success",
                        responseStatus: response.status,
                        responseBody: JSON.stringify(response.data).substring(0, 1000), // Truncate
                        lastAttemptAt: new Date(),
                        attempts: 1
                    })
                    .where(eq(webhookEvents.eventId, eventId));

                logger.info(`Webhook sent to ${endpoint.url} for ${eventId}`);

            } catch (error) {
                // Log Failure
                await db
                    .update(webhookEvents)
                    .set({
                        status: "failed",
                        responseStatus: error.response?.status || 0,
                        responseBody: error.message,
                        lastAttemptAt: new Date(),
                        attempts: 1
                    })
                    .where(eq(webhookEvents.eventId, eventId));

                logger.error(`Webhook failed for ${endpoint.url}: ${error.message}`);
            }
        });

        await Promise.all(deliveryPromises);

    } catch (error) {
        logger.error(`Webhook dispatcher error: ${error.message}`);
    }
};
