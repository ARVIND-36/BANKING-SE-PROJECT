import { pgTable, serial, varchar, timestamp, boolean, decimal, text, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  mobile: varchar("mobile", { length: 15 }).notNull().unique(),
  panCard: varchar("pan_card", { length: 10 }).notNull().unique(),
  aadhaarNumber: varchar("aadhaar_number", { length: 12 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isVerified: boolean("is_verified").default(false),
  otp: varchar("otp", { length: 6 }),
  otpExpiry: timestamp("otp_expiry"),
  
  // Wallet fields
  upiId: varchar("upi_id", { length: 100 }).unique(),
  walletBalance: decimal("wallet_balance", { precision: 15, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 50 }).notNull().unique(),
  
  // Sender and Receiver
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  
  // Transaction details
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),
  
  // Status: pending, completed, failed, cancelled
  status: varchar("status", { length: 20 }).default("completed"),
  
  // Transaction type: send, receive, refund
  type: varchar("type", { length: 20 }).notNull(),
  
  // Notes/description
  description: text("description"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});
