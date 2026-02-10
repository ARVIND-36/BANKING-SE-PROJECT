import dotenv from "dotenv";
dotenv.config();

/** @type {import("drizzle-kit").Config} */
export default {
  schema: "./src/models/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEON_URL,
  },
};
