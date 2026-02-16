import { eq, sql, and, lte } from "drizzle-orm";
import db from "../config/db.js";
import { merchants, settlements } from "../models/schema.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

// ─── RUN SETTLEMENT ─────────────────────────────────────────
// Moves 'pendingBalance' to 'availableBalance' for all merchants
// In a real system, this would filter by transaction date (T+1)
export const runSettlement = async () => {
    try {
        // NOTE: neon-http driver does not support db.transaction().
        // Using sequential queries instead.

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

            // 2. Move funds: Pending -> Available
            await db
                .update(merchants)
                .set({
                    pendingBalance: "0.00",
                    availableBalance: sql`${merchants.availableBalance} + ${amountToSettle}`
                })
                .where(eq(merchants.id, merchant.id));

            // 3. Create Settlement Record
            await db.insert(settlements).values({
                merchantId: merchant.id,
                settlementId,
                amount: amountToSettle,
                status: "processed",
                periodEnd: new Date(),
            });

            settlementReports.push({
                merchantId: merchant.id,
                amount: amountToSettle,
                settlementId
            });
        }

        logger.info(`Settlement run completed. Settled for ${settlementReports.length} merchants.`);
        return settlementReports;

    } catch (error) {
        logger.error(`Settlement run failed: ${error.message}`);
        throw error;
    }
};
