import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import logger from "./src/utils/logger.js";
import authRoutes from "./src/routes/auth.routes.js";
import walletRoutes from "./src/routes/wallet.routes.js";
import migrationRoutes from "./src/routes/migration.routes.js";
import loanRoutes from "./src/routes/loan.routes.js";
import db from "./src/config/db.js";

dotenv.config();

// Test database connection
try {
  await db.execute('SELECT 1');
  logger.info('Database connection established with Neon PostgreSQL');
} catch (error) {
  logger.error(`Database connection failed: ${error.message}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging via Morgan → Winston
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// ─── Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/migration", migrationRoutes);
app.use("/api/loans", loanRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", project: "NIDHI", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 NIDHI server running on http://localhost:${PORT}`);
});
