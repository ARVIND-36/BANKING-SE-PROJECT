import { eq, sql, and } from "drizzle-orm";
import db from "../config/db.js";
import { merchants, settlements, payments, orders, users } from "../models/schema.js";
import logger from "../utils/logger.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

// ─── EMAIL HELPER ───────────────────────────────────────────
const sendSettlementEmail = async (toEmail, merchantName, settlementData) => {
    const { settlementId, amount, transactionRows, periodEnd } = settlementData;

    // Build the transaction table rows (with masked/secured details)
    const txnTableRows = transactionRows.map((txn) => {
        const maskedPaymentId = txn.paymentId
            ? `****${txn.paymentId.slice(-6)}`
            : "N/A";
        const maskedOrderId = txn.orderId
            ? `****${txn.orderId.slice(-6)}`
            : "N/A";
        const maskedTxnId = txn.transactionId
            ? `****${txn.transactionId.slice(-6)}`
            : "N/A";

        return `
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${maskedPaymentId}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${maskedOrderId}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${maskedTxnId}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">₹${parseFloat(txn.amount).toFixed(2)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${txn.method || "wallet"}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">${new Date(txn.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
        </tr>`;
    }).join("");

    const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:650px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;color:#fff;">
            <h1 style="margin:0;font-size:22px;">NIDHI Payment Gateway</h1>
            <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">Settlement Confirmation</p>
        </div>
        <div style="padding:24px 32px;">
            <p style="color:#374151;">Hello <strong>${merchantName}</strong>,</p>
            <p style="color:#6b7280;">Your pending balance has been settled successfully. Here are the details:</p>

            <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="color:#6b7280;padding:4px 0;">Settlement ID</td><td style="font-weight:600;">${settlementId}</td></tr>
                    <tr><td style="color:#6b7280;padding:4px 0;">Total Amount</td><td style="font-weight:600;color:#059669;">₹${parseFloat(amount).toFixed(2)}</td></tr>
                    <tr><td style="color:#6b7280;padding:4px 0;">Settled On</td><td style="font-weight:600;">${new Date(periodEnd).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>
                    <tr><td style="color:#6b7280;padding:4px 0;">Transactions</td><td style="font-weight:600;">${transactionRows.length}</td></tr>
                </table>
            </div>

            ${transactionRows.length > 0 ? `
            <h3 style="color:#374151;margin-bottom:8px;">Transaction Details</h3>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead>
                        <tr style="background:#f3f4f6;">
                            <th style="padding:8px 12px;text-align:left;color:#6b7280;">Payment ID</th>
                            <th style="padding:8px 12px;text-align:left;color:#6b7280;">Order ID</th>
                            <th style="padding:8px 12px;text-align:left;color:#6b7280;">Txn ID</th>
                            <th style="padding:8px 12px;text-align:left;color:#6b7280;">Amount</th>
                            <th style="padding:8px 12px;text-align:left;color:#6b7280;">Method</th>
                            <th style="padding:8px 12px;text-align:left;color:#6b7280;">Date</th>
                        </tr>
                    </thead>
                    <tbody>${txnTableRows}</tbody>
                </table>
            </div>` : ""}

            <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
                Note: Payment IDs and Order IDs are partially masked for security. 
                For full details, please log in to your NIDHI merchant dashboard.
            </p>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} NIDHI Payment Gateway. All rights reserved.</p>
        </div>
    </div>`;

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"NIDHI Settlements" <${process.env.SMTP_EMAIL}>`,
            to: toEmail,
            subject: `Settlement Processed — ₹${parseFloat(amount).toFixed(2)} credited | ${settlementId}`,
            html: htmlBody,
        });

        logger.info(`📧 Settlement email sent to ${toEmail} for ${settlementId}`);
    } else {
        logger.info(`📧 [DEV] Settlement email for ${toEmail}:`);
        logger.info(`   Settlement ID: ${settlementId}`);
        logger.info(`   Amount: ₹${parseFloat(amount).toFixed(2)}`);
        logger.info(`   Transactions: ${transactionRows.length}`);
        transactionRows.forEach((txn, i) => {
            logger.info(`   [${i + 1}] PayID: ${txn.paymentId} | OrdID: ${txn.orderId} | ₹${txn.amount} | ${txn.method}`);
        });
    }
};

// ─── RUN SETTLEMENT ─────────────────────────────────────────
// Moves 'pendingBalance' to 'availableBalance' for all merchants,
// fetches associated transaction details, and sends email notification.
export const runSettlement = async () => {
    try {
        // 1. Get all merchants with positive pending balance
        const eligibleMerchants = await db
            .select()
            .from(merchants)
            .where(sql`${merchants.pendingBalance} > 0`);

        const settlementReports = [];

        for (const merchant of eligibleMerchants) {
            const amountToSettle = merchant.pendingBalance;

            if (parseFloat(amountToSettle) <= 0) continue;

            const settlementId = `setl_${crypto.randomBytes(12).toString("hex")}`;
            const periodEnd = new Date();

            // 2. Fetch all successful payments for this merchant that haven't been settled yet
            //    (payments created since the merchant's pending balance was last zeroed out)
            let transactionRows = [];
            try {
                transactionRows = await db
                    .select({
                        paymentId: payments.paymentId,
                        orderId: payments.orderId,
                        transactionId: payments.transactionId,
                        amount: payments.amount,
                        method: payments.method,
                        createdAt: payments.createdAt,
                    })
                    .from(payments)
                    .where(
                        and(
                            eq(payments.merchantId, merchant.id),
                            eq(payments.status, "success")
                        )
                    );
            } catch (err) {
                logger.warn(`Could not fetch payment details for merchant ${merchant.id}: ${err.message}`);
            }

            // 3. Move funds: Pending -> Available
            await db
                .update(merchants)
                .set({
                    pendingBalance: "0.00",
                    availableBalance: sql`${merchants.availableBalance} + ${amountToSettle}`
                })
                .where(eq(merchants.id, merchant.id));

            // 4. Create Settlement Record
            await db.insert(settlements).values({
                merchantId: merchant.id,
                settlementId,
                amount: amountToSettle,
                status: "processed",
                periodEnd,
            });

            // 5. Get merchant's email (businessEmail or user email fallback)
            let merchantEmail = merchant.businessEmail;
            if (!merchantEmail) {
                try {
                    const userResult = await db
                        .select({ email: users.email })
                        .from(users)
                        .where(eq(users.id, merchant.userId));
                    if (userResult.length > 0) merchantEmail = userResult[0].email;
                } catch (err) {
                    logger.warn(`Could not fetch user email for merchant ${merchant.id}`);
                }
            }

            // 6. Send settlement email
            if (merchantEmail) {
                try {
                    await sendSettlementEmail(merchantEmail, merchant.businessName, {
                        settlementId,
                        amount: amountToSettle,
                        transactionRows,
                        periodEnd,
                    });
                } catch (emailErr) {
                    logger.error(`Failed to send settlement email to ${merchantEmail}: ${emailErr.message}`);
                }
            }

            settlementReports.push({
                merchantId: merchant.id,
                businessName: merchant.businessName,
                amount: amountToSettle,
                settlementId,
                transactionsCount: transactionRows.length,
                emailSentTo: merchantEmail || "N/A",
            });
        }

        logger.info(`✅ Settlement run completed. Settled for ${settlementReports.length} merchants.`);
        return settlementReports;

    } catch (error) {
        logger.error(`Settlement run failed: ${error.message}`);
        throw error;
    }
};
