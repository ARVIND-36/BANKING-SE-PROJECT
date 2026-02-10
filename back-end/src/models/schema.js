import { pgTable, serial, varchar, timestamp, boolean, decimal, text, integer, jsonb } from "drizzle-orm/pg-core";

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

// ─── LOAN APPLICATIONS ──────────────────────────────────────
export const loanApplications = pgTable("loan_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Loan type: home, education, vehicle, personal, business, credit_line
  loanType: varchar("loan_type", { length: 30 }).notNull(),

  // User inputs
  monthlyIncome: decimal("monthly_income", { precision: 15, scale: 2 }).notNull(),
  employmentType: varchar("employment_type", { length: 30 }).notNull(), // salaried, self_employed, business
  creditScore: integer("credit_score").notNull(),
  age: integer("age").notNull(),
  existingEmi: decimal("existing_emi", { precision: 15, scale: 2 }).default("0.00"),
  desiredTenure: integer("desired_tenure").notNull(),     // in months
  desiredAmount: decimal("desired_amount", { precision: 15, scale: 2 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),

  // Computed results
  eligibleAmount: decimal("eligible_amount", { precision: 15, scale: 2 }),
  isEligible: boolean("is_eligible").default(false),
  bankOffers: jsonb("bank_offers"),  // JSON array of matched bank offers

  // Loan-type-specific details (dynamic fields per loan category)
  loanSpecificDetails: jsonb("loan_specific_details"),

  createdAt: timestamp("created_at").defaultNow(),
});

// ─── USER LOAN PROFILES (saved details for auto-fill) ────────
export const userLoanProfiles = pgTable("user_loan_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),

  // Common fields saved for reuse
  monthlyIncome: decimal("monthly_income", { precision: 15, scale: 2 }),
  employmentType: varchar("employment_type", { length: 30 }),
  creditScore: integer("credit_score"),
  age: integer("age"),
  existingEmi: decimal("existing_emi", { precision: 15, scale: 2 }),
  city: varchar("city", { length: 100 }),

  // Loan-type-specific saved details (JSON per loan type)
  savedDetails: jsonb("saved_details"), // { home: {...}, education: {...}, ... }

  updatedAt: timestamp("updated_at").defaultNow(),
});
