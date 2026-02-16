# NIDHI — UPI Transaction & Loan Platform

A concise developer guide for a full‑stack fintech prototype that implements UPI‑style wallet features and a loan eligibility flow.

---

## Project Overview

NIDHI is a full‑stack fintech application that provides:

- User onboarding with email OTP verification
- JWT‑based authentication and protected API routes
- Wallet operations: send/receive payments and view transaction history
- A simple loan assessment endpoint to check eligibility

The backend uses Node.js + Express and Drizzle ORM for PostgreSQL. The frontend is a Vite + React single‑page app using Context for auth state and calling backend REST APIs.

---

## Folder Structure (summary)

**Back-end (`back-end/`)**

- `index.js` — app entrypoint: loads environment, connects to DB, registers middleware (CORS, body parsers, logging) and mounts API routes.
- `src/config/` — DB and environment configuration (see `db.js`).
- `src/models/` — schema and table definitions (users, wallets, transactions, loans).
- `src/controllers/` — business logic (auth, wallet, loans, migrations).
- `src/routes/` — route files that map HTTP endpoints to controllers.
- `src/middleware/` — request guards (e.g., `auth.middleware.js` validates JWTs).
- `src/utils/` — utilities: OTP/email sender, logger (Winston), helpers.

**Front-end (`front-end/`)**

- `src/main.jsx` — React entrypoint that mounts `App`.
- `src/App.jsx` — router and top‑level layout; distinguishes public and protected routes.
- `src/context/` — `AuthContext` and hooks for token persistence and auth actions.
- `src/pages/` — screens: `Login`, `Register`, `VerifyOTP`, `Home`, `Wallet`, `Loans`, `Pay`, `Transactions`, `ScanPay`, etc.
- `src/components/` — shared UI components (navigation, `ProtectedRoute`, layout components).
- `src/services/api.js` — HTTP client wrapper used by pages to call backend APIs.

---

## Core Flows (high level)

- Registration: client → `POST /api/auth/register` → backend validates input, stores user (password hashed), generates OTP and emails it.
- OTP Verification: client → `POST /api/auth/verify-otp` → backend validates OTP, marks user verified, returns JWT.
- Login: client → `POST /api/auth/login` → backend validates credentials and returns JWT + user profile.
- Protected requests: frontend stores JWT in `localStorage` (via `AuthContext`) and sends it with requests; backend verifies token in `auth.middleware`.

For exact routes and payloads, inspect `back-end/src/routes/*.js` and the corresponding controllers in `back-end/src/controllers/`.

---

## Tech Stack

- Frontend: React, React Router, Vite
- Backend: Node.js, Express, Drizzle ORM, PostgreSQL (Neon)
- Logging: Morgan (HTTP) + Winston
- Auth: JWT tokens + email OTP

---

## Development — Run locally

1. Backend

```bash
cd back-end
npm install
# create a .env file with DB connection and JWT_SECRET
npm start
```

2. Frontend

```bash
cd front-end
npm install
npm run dev
```

Default CORS allows `http://localhost:5173` (Vite). Adjust if needed.

---

## Environment variables (typical)

- `DATABASE_URL` (or DB host/user/password) — used by `back-end/src/config/db.js`
- `JWT_SECRET` — secret for signing JWTs
- Email/SMTP config for OTP sending (see `back-end/src/utils/emailService.js`)

---

## Notes & recommended improvements

- Keep secrets out of version control (add `.env` to `.gitignore`).
- Add rate limiting and throttling for auth and OTP endpoints to prevent abuse.
- Consider implementing refresh tokens for safer session handling.
- Add automated tests (unit + integration) around auth and payment flows.
- Add API documentation (OpenAPI/Swagger or Postman collection) and include it in the repo.

---

If you want, I can expand the **API** section with endpoint examples and request/response shapes, or generate a Postman collection from the route/controller definitions—tell me which endpoints you want documented and I'll add them.

