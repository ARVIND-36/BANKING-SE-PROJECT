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

// Test database connection (can be skipped in non-production via SKIP_DB_CHECK=true)
if (process.env.SKIP_DB_CHECK === 'true') {
  logger.info('Skipping DB connectivity check (SKIP_DB_CHECK=true).');
} else {
  try {
    await db.execute('SELECT 1');
    logger.info('Database connection established with Neon PostgreSQL');
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────
// Configure CORS origins via environment variable `ALLOWED_ORIGINS`
// Example: ALLOWED_ORIGINS="http://localhost:5173,https://your-static-site"
const allowedOrigins = [
  "http://localhost:5173",
  "https://nidhistatic1771217837.z29.web.core.windows.net",
  ...(process.env.ALLOWED_ORIGINS || "").split(","),
].map((s) => s.trim()).filter(Boolean);

// Startup Check: Validate critical environment variables
const requiredEnvVars = ["NEON_URL", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  logger.error(
    `CRITICAL: Missing required environment variables: ${missingEnvVars.join(
      ", "
    )}`
  );
  logger.error("Server cannot start without these variables.");
  process.exit(1);
}

// Restricted CORS – only your own front-ends (auth, wallet, dashboard, etc.)
const restrictedCors = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser or same-origin requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'), false);
  },
  credentials: true,
});

// Open CORS – any third-party / developer app can call the payment gateway API
const openCors = cors();

// IMPORTANT: Apply CORS selectively - open for /api/v1, restricted for others
// Express processes middleware in order, so route-specific CORS comes first
app.use("/api/v1", openCors);

// For non-gateway routes, apply restricted CORS
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1')) {
    return next(); // Skip restrictedCors for /api/v1 routes
  }
  restrictedCors(req, res, next);
});

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
import merchantRoutes from "./src/routes/merchant.routes.js";
app.use("/api/merchants", merchantRoutes);
import pinRoutes from "./src/routes/pin.routes.js";
app.use("/api/pin", pinRoutes);
import gatewayRoutes from "./src/routes/gateway.routes.js";
app.use("/api/v1", gatewayRoutes); // Developer API Version 1

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
