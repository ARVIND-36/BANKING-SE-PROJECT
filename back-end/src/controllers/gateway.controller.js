import { eq } from "drizzle-orm";
import db from "../config/db.js";
import { orders } from "../models/schema.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

// ─── CREATE ORDER ───────────────────────────────────────────
export const createOrder = async (req, res) => {
    try {
        const { amount, currency, description, customer_name, customer_email, customer_phone, return_url, metadata } = req.body;
        const { id: merchantId } = req.merchant;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Amount must be greater than 0" });
        }

        // Generate public Order ID
        const orderId = `ord_${crypto.randomBytes(12).toString("hex")}`;

        const newOrder = await db
            .insert(orders)
            .values({
                merchantId,
                orderId,
                amount,
                currency: currency || "INR",
                status: "created",
                customerName: customer_name,
                customerEmail: customer_email,
                customerPhone: customer_phone,
                description,
                returnUrl: return_url,
                metadata,
            })
            .returning();

        logger.info(`Order created: ${orderId} for Merchant ${merchantId}`);

        return res.status(201).json({
            success: true,
            id: newOrder[0].orderId,
            amount: newOrder[0].amount,
            currency: newOrder[0].currency,
            status: newOrder[0].status,
            created_at: newOrder[0].createdAt,
            checkout_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pay/checkout/${orderId}`
        });
    } catch (error) {
        logger.error(`Order creation error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─── GET ORDER DETAILS (For hosted page) ────────────────────
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await db.select().from(orders).where(eq(orders.orderId, orderId));

        if (order.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Return safety subset of data for the frontend checkout page
        return res.status(200).json({
            success: true,
            data: {
                orderId: order[0].orderId,
                amount: order[0].amount,
                currency: order[0].currency,
                description: order[0].description,
                status: order[0].status,
                merchantId: order[0].merchantId
            }
        });
    } catch (error) {
        logger.error(`Get order error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

import { payments, merchants, users, transactions } from "../models/schema.js";
import { sql } from "drizzle-orm";

// ─── PROCESS PAYMENT (Wallet Debit) ─────────────────────────
export const processPayment = async (req, res) => {
    try {
        const userId = req.user.id; // Buyer (Logged in user)
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // Start Atomic Transaction
        const result = await db.transaction(async (tx) => {
            // 1. Fetch Order & Merchant
            const order = await tx.select().from(orders).where(eq(orders.orderId, orderId));
            if (order.length === 0) throw new Error("Order not found");
            if (order[0].status === 'paid') throw new Error("Order already paid");

            const merchant = await tx.select().from(merchants).where(eq(merchants.id, order[0].merchantId));
            if (merchant.length === 0) throw new Error("Merchant not found");

            // 2. Fetch Buyer
            const buyer = await tx.select().from(users).where(eq(users.id, userId));
            if (buyer.length === 0) throw new Error("User not found");

            // 3. Check Balance
            const amount = parseFloat(order[0].amount);
            if (parseFloat(buyer[0].balance) < amount) {
                throw new Error("Insufficient balance");
            }

            // 4. Generate IDs
            const transactionId = `txn_${crypto.randomBytes(12).toString("hex")}`;
            const paymentId = `pay_${crypto.randomBytes(12).toString("hex")}`;

            // 5. Debit Buyer
            await tx
                .update(users)
                .set({ balance: sql`${users.balance} - ${amount}` })
                .where(eq(users.id, userId));

            // 6. Credit Merchant (PENDING BALANCE)
            // Money goes to pendingBalance, NOT availableBalance.
            // It will move to availableBalance after Settlement (T+1).
            await tx
                .update(merchants)
                .set({ pendingBalance: sql`${merchants.pendingBalance} + ${amount}` })
                .where(eq(merchants.id, merchant[0].id));

            // 7. Record Transaction (Internal Ledger)
            await tx.insert(transactions).values({
                transactionId,
                senderId: userId,
                receiverId: merchant[0].userId, // Linked user account of merchant
                amount,
                type: "payment",
                status: "success",
                description: `Payment for Order ${orderId}`,
            });

            // 8. Record Payment (Gateway Ledger)
            await tx.insert(payments).values({
                orderId,
                merchantId: merchant[0].id,
                paymentId,
                amount,
                status: "success",
                method: "wallet",
                transactionId,
            });

            // 9. Update Order Status
            await tx
                .update(orders)
                .set({ status: "paid" })
                .where(eq(orders.orderId, orderId));

            return { paymentId, transactionId, merchant, order };
        });

        logger.info(`Payment successful: ${result.paymentId} for Order ${orderId}`);

        // Off-load webhook triggering so it doesn't block the response significantly,
        // or just await it if we want strong consistency guarantees for the demo
        triggerWebhook(result.merchant[0].id, "payment.success", {
            event: "payment.success",
            payment_id: result.paymentId,
            order_id: orderId,
            amount: result.order[0].amount,
            currency: result.order[0].currency,
            status: "success",
            timestamp: new Date().toISOString()
        }).catch(err => logger.error("Webhook triggers failed:", err));

        return res.status(200).json({
            success: true,
            data: {
                paymentId: result.paymentId,
                status: "success",
                message: "Payment processed successfully"
            }
        });

    } catch (error) {
        logger.error(`Payment execution error: ${error.message}`);
        return res.status(400).json({ success: false, message: error.message });
    }
};
