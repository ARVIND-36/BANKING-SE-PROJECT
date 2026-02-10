# NIDHI - UPI Transaction & Loan Platform 💰

A full-stack fintech platform with user authentication, wallet transactions, and loan eligibility checker.

---

## ✨ Features

### 🔐 Authentication & Security
- Email OTP-based registration & login (10-min validity)
- JWT-based protected routes
- Password hashing (bcryptjs)
- Email verification required

### 💸 Wallet & Transactions
- UPI-based money transfers
- Transaction history with filters
- Real-time balance updates
- **Automatic transaction email alerts** (credit/debit)
- Recent people & quick actions

### 🏦 Loan Eligibility Checker
- 6 loan types: Home, Education, Vehicle, Personal, Business, Credit Line
- Loan-type-specific input fields (dynamic forms)
- FOIR-based eligibility computation
- EMI calculation & loan amount estimation
- 30+ bank offers with interest rates
- Saved user profiles for auto-fill
- Past applications history

### 🎨 Modern UI
- Emerald theme (#10b981) with white background
- Responsive mobile-first design
- 2-tab navigation (Home + Services)
- Toast notifications
- Back-button prevention after login

---

## 🛠 Tech Stack

| Component | Tech |
|-----------|------|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon) + Drizzle ORM |
| **Auth** | JWT + bcryptjs |
| **Email** | Nodemailer (Gmail SMTP) |
| **Frontend** | React 19 + Vite |
| **Routing** | React Router v6 |
| **Styling** | CSS Variables |
| **Notifications** | React Hot Toast |
| **HTTP** | Axios with interceptors |

---

## 📦 Setup

### Backend
```bash
cd back-end
npm install
npm run db:push        # Push schema to Neon
npm run dev            # Start on :5000
```

**.env required:**
```env
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=gmail-app-password
JWT_SECRET=your-secret-key
NEON_URL=postgresql://...
```

### Frontend
```bash
cd front-end
npm install
npm run dev            # Start on :5173
```

---

## 📡 Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Register with email OTP |
| `/api/auth/verify-otp` | POST | Verify email & get JWT |
| `/api/auth/login` | POST | Login (verified email only) |
| `/api/wallet/send` | POST | Transfer money + send emails |
| `/api/wallet/transactions` | GET | Transaction history |
| `/api/loans/eligibility` | POST | Check loan eligibility |
| `/api/loans/fields/:type` | GET | Type-specific form fields |
| `/api/loans/profile` | GET | Saved user profile |

---

## 📁 Project Structure

```
back-end/src/
├── controllers/       # auth, wallet, loan logic
├── routes/           # API route definitions
├── models/schema.js  # Drizzle table definitions
├── middleware/       # JWT authentication
└── utils/
    ├── emailService.js    # OTP + transaction emails
    └── logger.js          # Winston logging

front-end/src/
├── pages/            # Login, Register, Home, Loans, Pay, Transactions
├── components/       # ProtectedRoute, AppLayout
├── context/          # AuthContext for global auth state
├── services/         # API client (axios)
└── App.jsx          # Route config with PublicRoute wrapper
```

---

## 🚀 Features in Detail

### Transaction Email Alerts
Every money transfer sends **2 emails**:
- **Sender**: Debit alert with new balance
- **Receiver**: Credit alert with new balance
- Includes: Amount, Transaction ID, Timestamp, Counterparty name

### Loan Type-Specific Forms
Each loan has unique required fields:
- **Home**: Property type, value, down payment, first home status, co-applicant
- **Education**: Course name, institute, country, admission status, collateral
- **Vehicle**: Vehicle type, brand, on-road price
- **Personal**: Loan purpose, employer, years in job
- **Business**: Business type, annual turnover, GST registration
- **Credit Line**: Purpose, monthly usage

### Auto-Fill From Saved Profile
- Previous details automatically saved to DB
- **⚡ "Use Saved Profile"** button to fill all fields in 1 click
- Loan-specific details stored separately per loan type

### Back-Button Prevention
- After login, can't go back to /login (browser history replaced)
- Authenticated users redirected to /home if accessing /login

---

## 🔐 Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (name, email, password hash, wallet balance, UPI ID) |
| `transactions` | Money transfers (sender, receiver, amount, status, description) |
| `loanApplications` | Loan applications (type, eligibility, bank offers, specific details) |
| `userLoanProfiles` | Saved profile data (common fields + per-loan-type details) |

---

## 🧪 Quick Test

1. **Register**: http://localhost:5173/register → Check email for OTP
2. **Verify**: Enter OTP → Redirect to home
3. **Send Money**: Pay tab → Enter UPI ID → Send → Both users get emails
4. **Check Loans**: Loans tab → Choose type → Fill form → See eligibility & bank offers

---

## 📝 Environment Variables

```bash
# Gmail SMTP (use App Password for 2FA-enabled Gmail)
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx

# JWT
JWT_SECRET=nidhi_jwt_secret_key_2026_secure

# Neon PostgreSQL (free tier)
NEON_URL=postgresql://neondb_owner:password@host/db?sslmode=require

# Node
NODE_ENV=development
```

---



---

## 📊 Key Code Files

- **Email Service**: `back-end/src/utils/emailService.js` → OTP + Transaction emails
- **Wallet Logic**: `back-end/src/controllers/wallet.controller.js` → Send money + triggers emails
- **Loan Controller**: `back-end/src/controllers/loan.controller.js` → Eligibility logic
- **Auth Context**: `front-end/src/context/AuthContext.jsx` → Global auth state
- **App Routes**: `front-end/src/App.jsx` → PublicRoute + ProtectedRoute wrappers

---

## ✅ Checklist for Running

- [ ] `.env` file filled with Gmail credentials & DB URL
- [ ] `npm run db:push` executed (schema synced)
- [ ] Backend running: `npm run dev` in `back-end/`
- [ ] Frontend running: `npm run dev` in `front-end/`
- [ ] Can register & receive OTP email
- [ ] Can transfer money & both users get transaction emails
- [ ] Can check loan eligibility & see bank offers

---


