# NIDHI — Banking App

This repository implements a full-stack banking/payment prototype.

## Architecture
- Backend: Node.js + Express providing REST APIs under `/api` (auth, wallet, payments, pin, merchants, webhooks).
- Frontend: Vite + React single-page app consuming backend APIs.
- Database: PostgreSQL (Neon) accessed via Drizzle ORM.

## Core flows
- Registration: `POST /api/auth/register` → backend creates user, generates OTP, sends email.
- OTP verification: `POST /api/auth/verify-otp` → backend validates OTP, marks user verified, returns JWT.
- Login: `POST /api/auth/login` → returns JWT for authenticated requests.
- PIN setup: request OTP (`POST /api/pin/otp`), set PIN (`POST /api/pin/set`) with OTP; PIN hashed and stored.
- PIN verification: `POST /api/pin/verify` used before sensitive operations (payments).
- Payments: hosted checkout calls payment endpoints (`/api/v1/*`) to create and finalize payments.
- Merchant features: merchant activation, API key generation, webhook configuration and event delivery.

## Required environment variables (examples)
- `SMTP_EMAIL`, `SMTP_PASSWORD`
- `JWT_SECRET`
- `NEON_URL` (DB connection)
- `ALLOWED_ORIGINS`
- `NODE_ENV`, `PORT`
- Frontend build-time: `VITE_API_URL`

## Run locally
Backend
```bash
cd back-end
cp .env.example .env    # fill values
npm install
npm run dev
```

Frontend
```bash
cd front-end
cp .env.production .env  # set VITE_API_URL if needed
npm install
npm run dev
```

## Build for production
- Frontend: `cd front-end && npm run build` (output `front-end/dist`).
- Backend: run `npm start` in `back-end` with production env vars.

## CI/CD
- GitHub Actions workflows in `.github/workflows/` deploy the backend to Azure App Service and the frontend to Azure Storage.

This README only explains how the code works and how to run it.

