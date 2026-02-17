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
                merchantId: order[0].merchantId,
                returnUrl: order[0].returnUrl
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
// NOTE: neon-http driver does not support db.transaction().
// We use sequential queries instead. This is acceptable for a
// demo/project because the Neon serverless HTTP driver executes
// each query as its own implicit transaction.
export const processPayment = async (req, res) => {
    try {
        const userId = req.user.id; // Buyer (Logged in user)
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // 1. Fetch Order
        const order = await db.select().from(orders).where(eq(orders.orderId, orderId));
        if (order.length === 0) {
            return res.status(400).json({ success: false, message: "Order not found" });
        }
        if (order[0].status === 'paid') {
            return res.status(400).json({ success: false, message: "Order already paid" });
        }

        // 2. Fetch Merchant
        const merchant = await db.select().from(merchants).where(eq(merchants.id, order[0].merchantId));
        if (merchant.length === 0) {
            return res.status(400).json({ success: false, message: "Merchant not found" });
        }

        // 3. Fetch Buyer
        const buyer = await db.select().from(users).where(eq(users.id, userId));
        if (buyer.length === 0) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // 4. Check Balance
        const amount = parseFloat(order[0].amount);
        const buyerBalance = parseFloat(buyer[0].walletBalance || 0);
        if (buyerBalance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        // 5. Generate IDs
        const transactionId = `txn_${crypto.randomBytes(12).toString("hex")}`;
        const paymentId = `pay_${crypto.randomBytes(12).toString("hex")}`;

        // 6. Debit Buyer
        await db
            .update(users)
            .set({ walletBalance: sql`${users.walletBalance} - ${amount}` })
            .where(eq(users.id, userId));

        // 7. Credit Merchant (PENDING BALANCE)
        await db
            .update(merchants)
            .set({ pendingBalance: sql`${merchants.pendingBalance} + ${amount}` })
            .where(eq(merchants.id, merchant[0].id));

        // 8. Record Transaction (Internal Ledger)
        await db.insert(transactions).values({
            transactionId,
            senderId: userId,
            receiverId: merchant[0].userId,
            amount,
            type: "payment",
            status: "completed",
            description: `Payment for Order ${orderId}`,
        });

        // 9. Record Payment (Gateway Ledger)
        await db.insert(payments).values({
            orderId,
            merchantId: merchant[0].id,
            paymentId,
            amount,
            status: "success",
            method: "wallet",
            transactionId,
        });

        // 10. Update Order Status
        await db
            .update(orders)
            .set({ status: "paid" })
            .where(eq(orders.orderId, orderId));

        logger.info(`Payment successful: ${paymentId} for Order ${orderId}`);

        return res.status(200).json({
            success: true,
            data: {
                paymentId,
                status: "success",
                message: "Payment processed successfully"
            }
        });

    } catch (error) {
        logger.error(`Payment execution error: ${error.message}`);
        return res.status(500).json({ success: false, message: "Payment processing failed. Please try again." });
    }
};
