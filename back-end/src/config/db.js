import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const sql = neon(process.env.NEON_URL);
const db = drizzle(sql);

logger.info("Database connection established with Neon PostgreSQL");

export default db;
