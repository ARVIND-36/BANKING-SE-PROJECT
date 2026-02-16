import { eq, sql } from "drizzle-orm";
import db from "../config/db.js";
import { orders, merchants, users, transactions } from "../models/schema.js";
import logger from "../utils/logger.js";
import crypto from "crypto";
// import { triggerWebhook } from "../services/webhookService.js";

// ─── PROCESS REFUND ─────────────────────────────────────────
export const processRefund = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        const { id: merchantId } = req.merchant;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // NOTE: neon-http driver does not support db.transaction().
        // Using sequential queries instead.

        // 1. Fetch Order
        const order = await db.select().from(orders).where(eq(orders.orderId, orderId));
        if (order.length === 0) throw new Error("Order not found");
        if (order[0].merchantId !== merchantId) throw new Error("Unauthorized");
        if (order[0].status !== 'paid') throw new Error("Order not paid");

        // 2. Fetch Merchant
        const merchant = await db.select().from(merchants).where(eq(merchants.id, merchantId));

        // 3. Logic: Deduct from Available Balance
        const refundAmount = parseFloat(amount || order[0].amount); // Full refund if amount not specified

        if (parseFloat(merchant[0].availableBalance) < refundAmount) {
            throw new Error("Insufficient available balance for refund. Wait for settlement.");
        }

        // 4. Refund logic placeholder
        // TODO: Full refund implementation — look up Payment -> Transaction -> Sender
        throw new Error("Refund API not fully implemented in this demo phase.");

        return res.status(200).json({ success: true, message: "Refund processed" });

    } catch (error) {
        logger.error(`Refund error: ${error.message}`);
        return res.status(400).json({ success: false, message: error.message });
    }
};
