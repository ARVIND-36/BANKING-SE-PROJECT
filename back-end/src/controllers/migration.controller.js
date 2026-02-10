import { isNull, eq } from "drizzle-orm";
import db from "../config/db.js";
import { users } from "../models/schema.js";
import logger from "../utils/logger.js";

// ─── UPDATE EXISTING USERS WITH UPI IDs ────────────────────
export const updateUsersWithUpiIds = async (req, res) => {
  try {
    // Find all users without UPI IDs
    const usersWithoutUpi = await db
      .select()
      .from(users)
      .where(isNull(users.upiId));

    if (usersWithoutUpi.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All users already have UPI IDs",
        updated: 0,
      });
    }

    let updated = 0;

    for (const user of usersWithoutUpi) {
      const username = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const upiId = `${username}@nidhi`;

      await db
        .update(users)
        .set({ upiId, walletBalance: user.walletBalance || "0.00" })
        .where(eq(users.id, user.id));

      updated++;
      logger.info(`Updated UPI ID for user ${user.email}: ${upiId}`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully updated ${updated} users with UPI IDs`,
      updated,
    });
  } catch (error) {
    logger.error(`Migration error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
