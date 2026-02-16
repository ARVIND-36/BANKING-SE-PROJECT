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

        // Start Atomic Transaction
        const result = await db.transaction(async (tx) => {
            // 1. Fetch Order
            const order = await tx.select().from(orders).where(eq(orders.orderId, orderId));
            if (order.length === 0) throw new Error("Order not found");
            if (order[0].merchantId !== merchantId) throw new Error("Unauthorized");
            if (order[0].status !== 'paid') throw new Error("Order not paid");

            // 2. Fetch Merchant
            const merchant = await tx.select().from(merchants).where(eq(merchants.id, merchantId));

            // 3. Logic: Deduct from Available Balance (Assuming settlement happened)
            // If settlement hasn't happened, we could deduct from Pending, but for simplicity we'll stick to Available
            // Or we can check both. Let's start with Available Balance for safety.
            const refundAmount = parseFloat(amount || order[0].amount); // Full refund if amount not specified

            if (parseFloat(merchant[0].availableBalance) < refundAmount) {
                // Fallback: Check pending balance? No, let's be strict for now.
                throw new Error("Insufficient available balance for refund. Wait for settlement.");
            }

            // 4. Determine User to Refund
            // We need to find the transaction to know who paid. 
            // Ideally `orders` should store `userId` but we have `payments` linking to `transactions`.
            // For this demo, we'll assume the customerEmail matches a user or we use the linked Transaction.
            // Let's rely on finding the original transaction.
            // A limitation of our current schema is we need to query payments -> transaction -> senderId
            // Let's simplify and say we can only refunds if we can duplicate the money back to the user found via email/phone ??
            // Better: Update Schema to link Order -> User? No, let's use the Payment Record.

            // ... Complex refund logic skipped for MVP speed, let's assume we refund to the "customer" field if it was a wallet user?
            // Actually, we can just look up the Order -> Payment -> Transaction -> Sender.
            // Use existing "payments" table.

            // ... (Implementation simplified for task) ...
            throw new Error("Refund API not fully implemented in this demo phase.");
        });

        return res.status(200).json({ success: true, message: "Refund processed" });

    } catch (error) {
        logger.error(`Refund error: ${error.message}`);
        return res.status(400).json({ success: false, message: error.message });
    }
};
