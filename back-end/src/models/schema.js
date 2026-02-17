import { pgTable, serial, varchar, timestamp, boolean, decimal, text, integer, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  mobile: varchar("mobile", { length: 15 }).notNull().unique(),
  panCard: varchar("pan_card", { length: 10 }).notNull().unique(),
  aadhaarNumber: varchar("aadhaar_number", { length: 12 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  transactionPin: varchar("transaction_pin", { length: 255 }),
  hasSetPin: boolean("has_set_pin").default(false),
  lastPinChange: timestamp("last_pin_change"),
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

// ─── MERCHANTS ──────────────────────────────────────────────
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),

  // Basic Business Info
  businessName: varchar("business_name", { length: 150 }).notNull(),
  businessType: varchar("business_type", { length: 50 }), // sole_proprietorship, partnership, pvt_ltd, llp, opc, public_ltd
  businessCategory: varchar("business_category", { length: 100 }), // ecommerce, saas, education, healthcare, etc.
  businessDescription: text("business_description"),
  businessWebsite: varchar("business_website", { length: 255 }),

  // Legal & Tax Documents
  gstNumber: varchar("gst_number", { length: 15 }),
  businessPan: varchar("business_pan", { length: 10 }),
  registrationNumber: varchar("registration_number", { length: 50 }),

  // Business Address
  addressStreet: varchar("address_street", { length: 255 }),
  addressCity: varchar("address_city", { length: 100 }),
  addressState: varchar("address_state", { length: 100 }),
  addressPinCode: varchar("address_pin_code", { length: 10 }),

  // Bank Account Details
  bankAccountName: varchar("bank_account_name", { length: 255 }),
  bankName: varchar("bank_name", { length: 100 }),
  accountNumber: varchar("account_number", { length: 20 }),
  ifscCode: varchar("ifsc_code", { length: 11 }),
  accountType: varchar("account_type", { length: 20 }), // savings, current

  // Business Contact Information
  businessEmail: varchar("business_email", { length: 255 }),
  businessPhone: varchar("business_phone", { length: 15 }),
  supportEmail: varchar("support_email", { length: 255 }),
  supportPhone: varchar("support_phone", { length: 15 }),

  // Merchant specific wallet fields
  availableBalance: decimal("available_balance", { precision: 15, scale: 2 }).default("0.00"),
  pendingBalance: decimal("pending_balance", { precision: 15, scale: 2 }).default("0.00"),

  // Status & Verification
  status: varchar("status", { length: 20 }).default("active"), // active, suspended
  kybStatus: varchar("kyb_status", { length: 20 }).default("pending"), // pending, verified, rejected
  kybVerifiedAt: timestamp("kyb_verified_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── API KEYS ───────────────────────────────────────────────
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  keyId: varchar("key_id", { length: 100 }).notNull().unique(), // Public ID (pk_live_...)
  keySecretHash: varchar("key_secret_hash", { length: 255 }).notNull(), // Hashed secret (sk_live_...)
  type: varchar("type", { length: 20 }).default("live"), // live, test
  permissions: jsonb("permissions").default(["read", "write"]),
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PAYMENT GATEWAY: ORDERS ────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  orderId: varchar("order_id", { length: 50 }).notNull().unique(), // Public Order ID (ord_...)

  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),

  status: varchar("status", { length: 20 }).default("created"), // created, attempted, paid, failed, refunded

  customerName: varchar("customer_name", { length: 100 }),
  customerEmail: varchar("customer_email", { length: 150 }),
  customerPhone: varchar("customer_phone", { length: 15 }),

  description: text("description"),
  returnUrl: text("return_url"),

  metadata: jsonb("metadata"), // Custom merchant data

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── PAYMENT GATEWAY: PAYMENTS ──────────────────────────────
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id", { length: 50 }).notNull().references(() => orders.orderId),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),

  paymentId: varchar("payment_id", { length: 50 }).notNull().unique(), // pay_...
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),

  status: varchar("status", { length: 20 }).default("pending"), // pending, success, failed
  method: varchar("method", { length: 30 }).default("wallet"), // wallet, upi, card (simulated)

  // Link to internal transaction if paid via wallet
  transactionId: varchar("transaction_id", { length: 50 }),

  errorMessage: text("error_message"),

  createdAt: timestamp("created_at").defaultNow(),
});



// ─── SETTLEMENTS ────────────────────────────────────────────
export const settlements = pgTable("settlements", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  settlementId: varchar("settlement_id", { length: 50 }).notNull().unique(), // setl_...

  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),

  status: varchar("status", { length: 20 }).default("processed"), // processed, failed

  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),

  utr: varchar("utr", { length: 50 }), // Bank UTR number

  createdAt: timestamp("created_at").defaultNow(),
});
