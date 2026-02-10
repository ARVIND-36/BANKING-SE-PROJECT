import { eq, or, desc, sql, inArray } from "drizzle-orm";
import db from "../config/db.js";
import { users, transactions } from "../models/schema.js";
import logger from "../utils/logger.js";
import { sendTransactionEmail } from "../utils/emailService.js";

// Generate unique transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `TXN${timestamp}${random}`.toUpperCase();
};

// ─── GET WALLET BALANCE ──────────────────────────────────────
export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db
      .select({
        walletBalance: users.walletBalance,
        upiId: users.upiId,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        balance: parseFloat(result[0].walletBalance || 0),
        upiId: result[0].upiId,
        name: result[0].name,
      },
    });
  } catch (error) {
    logger.error(`Get wallet balance error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── SEND MONEY ──────────────────────────────────────────────
export const sendMoney = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverUpiId, amount, description } = req.body;

    // Validation
    if (!receiverUpiId || !amount) {
      return res.status(400).json({ success: false, message: "Receiver UPI ID and amount are required" });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    if (amountNum > 100000) {
      return res.status(400).json({ success: false, message: "Maximum transfer limit is ₹1,00,000" });
    }

    // Get sender details
    const senderResult = await db
      .select()
      .from(users)
      .where(eq(users.id, senderId));

    if (senderResult.length === 0) {
      return res.status(404).json({ success: false, message: "Sender not found" });
    }

    const sender = senderResult[0];
    const senderBalance = parseFloat(sender.walletBalance || 0);

    // Check sender balance
    if (senderBalance < amountNum) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        balance: senderBalance,
      });
    }

    // Get receiver details by UPI ID or phone number
    const isPhone = /^[6-9][0-9]{9}$/.test(receiverUpiId);
    const receiverResult = await db
      .select()
      .from(users)
      .where(isPhone ? eq(users.mobile, receiverUpiId) : eq(users.upiId, receiverUpiId));

    if (receiverResult.length === 0) {
      return res.status(404).json({ success: false, message: "Receiver UPI ID not found" });
    }

    const receiver = receiverResult[0];

    // Check if sending to self
    if (sender.id === receiver.id) {
      return res.status(400).json({ success: false, message: "Cannot send money to yourself" });
    }

    const receiverBalance = parseFloat(receiver.walletBalance || 0);

    // Generate transaction ID
    const transactionId = generateTransactionId();

    // Update balances
    await db
      .update(users)
      .set({ walletBalance: (senderBalance - amountNum).toFixed(2) })
      .where(eq(users.id, senderId));

    await db
      .update(users)
      .set({ walletBalance: (receiverBalance + amountNum).toFixed(2) })
      .where(eq(users.id, receiver.id));

    // Create transaction record
    const now = new Date();
    await db.insert(transactions).values({
      transactionId,
      senderId,
      receiverId: receiver.id,
      amount: amountNum.toFixed(2),
      status: "completed",
      type: "transfer",
      description: description || `Payment to ${receiver.name}`,
      completedAt: now,
    });

    logger.info(
      `Transaction ${transactionId}: ${sender.name} sent ₹${amountNum} to ${receiver.name} (${receiverUpiId})`
    );

    // Send email notifications (non-blocking)
    const senderNewBalance = (senderBalance - amountNum).toFixed(2);
    const receiverNewBalance = (receiverBalance + amountNum).toFixed(2);

    await Promise.allSettled([
      sendTransactionEmail({
        to: sender.email,
        name: sender.name,
        type: "debited",
        amount: amountNum,
        counterpartyName: receiver.name,
        transactionId,
        description: description || `Payment to ${receiver.name}`,
        timestamp: now,
        balanceAfter: senderNewBalance,
      }),
      sendTransactionEmail({
        to: receiver.email,
        name: receiver.name,
        type: "credited",
        amount: amountNum,
        counterpartyName: sender.name,
        transactionId,
        description: description || `Payment from ${sender.name}`,
        timestamp: now,
        balanceAfter: receiverNewBalance,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Money sent successfully",
      data: {
        transactionId,
        amount: amountNum,
        receiver: {
          name: receiver.name,
          upiId: receiver.upiId,
        },
        newBalance: senderNewBalance,
        timestamp: now,
      },
    });
  } catch (error) {
    logger.error(`Send money error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Transaction failed. Please try again." });
  }
};

// ─── GET TRANSACTION HISTORY ─────────────────────────────────
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Get transactions where user is sender or receiver
    const result = await db
      .select({
        id: transactions.id,
        transactionId: transactions.transactionId,
        senderId: transactions.senderId,
        receiverId: transactions.receiverId,
        amount: transactions.amount,
        status: transactions.status,
        type: transactions.type,
        description: transactions.description,
        createdAt: transactions.createdAt,
        completedAt: transactions.completedAt,
      })
      .from(transactions)
      .where(or(eq(transactions.senderId, userId), eq(transactions.receiverId, userId)))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get user details for all transactions
    const userIds = new Set();
    result.forEach((txn) => {
      userIds.add(txn.senderId);
      userIds.add(txn.receiverId);
    });

    const userIdsArray = Array.from(userIds);
    
    let userDetails = [];
    if (userIdsArray.length > 0) {
      userDetails = await db
        .select({
          id: users.id,
          name: users.name,
          upiId: users.upiId,
        })
        .from(users)
        .where(inArray(users.id, userIdsArray));
    }

    const userMap = {};
    userDetails.forEach((u) => {
      userMap[u.id] = { name: u.name, upiId: u.upiId };
    });

    // Format transactions
    const formattedTransactions = result.map((txn) => {
      const isSender = txn.senderId === userId;
      const otherUserId = isSender ? txn.receiverId : txn.senderId;
      const otherUser = userMap[otherUserId] || { name: "Unknown", upiId: "" };

      return {
        id: txn.id,
        transactionId: txn.transactionId,
        amount: parseFloat(txn.amount),
        type: isSender ? "sent" : "received",
        status: txn.status,
        description: txn.description,
        otherParty: {
          name: otherUser.name,
          upiId: otherUser.upiId,
        },
        timestamp: txn.completedAt || txn.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        count: formattedTransactions.length,
        hasMore: formattedTransactions.length === limit,
      },
    });
  } catch (error) {
    logger.error(`Get transaction history error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── SEARCH USER BY UPI ID OR PHONE ──────────────────────────
export const searchUserByUpiId = async (req, res) => {
  try {
    const { upiId } = req.query;

    if (!upiId) {
      return res.status(400).json({ success: false, message: "UPI ID or phone number is required" });
    }

    // Check if input looks like a phone number (10 digits)
    const isPhone = /^[6-9][0-9]{9}$/.test(upiId);

    let result;
    if (isPhone) {
      result = await db
        .select({ name: users.name, upiId: users.upiId })
        .from(users)
        .where(eq(users.mobile, upiId));
    } else {
      result = await db
        .select({ name: users.name, upiId: users.upiId })
        .from(users)
        .where(eq(users.upiId, upiId));
    }

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: isPhone ? "Phone number not found" : "UPI ID not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: result[0].name,
        upiId: result[0].upiId,
      },
    });
  } catch (error) {
    logger.error(`Search user error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── ADD MONEY (For testing/demo purposes) ───────────────────
export const addMoney = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const amountNum = parseFloat(amount);

    if (amountNum > 10000) {
      return res.status(400).json({ success: false, message: "Maximum add limit is ₹10,000 per transaction" });
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentBalance = parseFloat(result[0].walletBalance || 0);
    const newBalance = currentBalance + amountNum;

    await db
      .update(users)
      .set({ walletBalance: newBalance.toFixed(2) })
      .where(eq(users.id, userId));

    logger.info(`User ${userId} added ₹${amountNum} to wallet. New balance: ₹${newBalance}`);

    return res.status(200).json({
      success: true,
      message: "Money added successfully",
      data: {
        amountAdded: amountNum,
        newBalance: newBalance.toFixed(2),
      },
    });
  } catch (error) {
    logger.error(`Add money error: ${error.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
