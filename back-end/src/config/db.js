import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

if (!process.env.NEON_URL) {
    logger.error("CRITICAL: NEON_URL environment variable is not defined");
    // Don't crash immediately, but db calls will fail. 
    // This allows index.js to run its check and log the error properly.
    // Or at least throw a clear error.
    throw new Error("NEON_URL environment variable is not defined");
}

const sql = neon(process.env.NEON_URL);
const db = drizzle(sql);

logger.info("Database connection established with Neon PostgreSQL");

export default db;
