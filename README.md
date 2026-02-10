# NIDHI - UPI Transaction & Loan Platform 💰

## Overview
NIDHI is a full-stack financial platform for PAN-based UPI transactions and loan suggestions (like PolicyBazaar). Currently implements a complete authentication system with **email OTP verification**.

---

## 🚀 Features Implemented

### ✅ Authentication System
- **User Registration** with validation
  - Name, Email, Mobile, PAN Card, Aadhaar Number, Password
  - Email OTP verification (10-minute validity)
  - Automatic OTP email delivery via Gmail SMTP
- **Login System** with email verification check
- **Protected Routes** with JWT authentication
- **Password Hashing** with bcryptjs
- **OTP Resend** functionality

### ✅ Technology Stack
| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Neon Cloud) with Drizzle ORM |
| **Authentication** | JWT, bcryptjs |
| **Email Service** | Nodemailer (Gmail SMTP) |
| **Logging** | Winston (file + console) |
| **Frontend** | React 19, Vite, React Router |
| **API Client** | Axios with interceptors |
| **Notifications** | React Hot Toast |

---

## 📁 Project Structure

```
BANKING-SE-PROJECT/
├── back-end/
│   ├── index.js                          # Express server entry point
│   ├── .env                              # Environment variables (Gmail SMTP, DB, JWT)
│   ├── package.json
│   ├── logs/                             # Winston log files
│   └── src/
│       ├── config/
│       │   ├── db.js                     # Database connection
│       │   └── drizzle.config.js         # Drizzle ORM config
│       ├── models/
│       │   └── schema.js                 # User table schema (with OTP fields)
│       ├── controllers/
│       │   └── auth.controller.js        # Auth logic (register, login, verifyOTP, resendOTP)
│       ├── routes/
│       │   └── auth.routes.js            # API routes
│       ├── middleware/
│       │   └── auth.middleware.js        # JWT middleware
│       └── utils/
│           ├── logger.js                 # Winston logger
│           └── emailService.js           # OTP email sender
│
└── front-end/                            # React app
    └── src/
        ├── App.jsx                       # Routing setup
        ├── App.css                       # Global styles
        ├── services/api.js               # Axios instance
        ├── context/AuthContext.jsx       # Auth state management
        ├── components/ProtectedRoute.jsx # Route guard
        └── pages/
            ├── Login.jsx                 # Login page
            ├── Register.jsx              # Registration page
            ├── VerifyOTP.jsx             # OTP verification page
            └── Dashboard.jsx             # Protected dashboard
```

---

## 🔧 Setup Instructions

### 1. Backend Setup

```bash
cd back-end
npm install
```

**Environment Variables (`.env`):**
```env
# Gmail SMTP Configuration
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password

# JWT Secret
JWT_SECRET=nidhi_jwt_secret_key_2026_secure

# Neon PostgreSQL URL
NEON_URL=postgresql://user:pass@host/db?sslmode=require
```

**Push Database Schema:**
```bash
npm run db:push
```

**Start Backend:**
```bash
npm run dev    # Development (nodemon)
# or
npm start      # Production
```

Server runs on: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd front-end
npm install
```

**Start Frontend:**
```bash
npm run dev
```

App runs on: `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user → sends OTP email | ❌ |
| `POST` | `/api/auth/verify-otp` | Verify email with OTP → returns JWT | ❌ |
| `POST` | `/api/auth/resend-otp` | Resend OTP email | ❌ |
| `POST` | `/api/auth/login` | Login (requires verified email) | ❌ |
| `GET` | `/api/auth/profile` | Get user profile | ✅ JWT |
| `GET` | `/api/health` | Health check | ❌ |

---

## 🧪 Testing the OTP Flow

### Step 1: Register a New User
1. Go to `http://localhost:5173/register`
2. Fill in all fields:
   - Name: `John Doe`
   - Email: `your-test-email@gmail.com`
   - Mobile: `9876543210` (must start with 6-9)
   - PAN Card: `ABCDE1234F` (format: 5 letters + 4 digits + 1 letter)
   - Aadhaar: `123456789012` (12 digits)
   - Password: `password123`
3. Click **Create Account**
4. ✅ You'll be redirected to the **Verify OTP** page

### Step 2: Check Email for OTP
- Check the inbox of the email you provided
- Look for an email from **NIDHI Platform**
- Subject: "NIDHI - Verify Your Account"
- Copy the **6-digit OTP** from the email

### Step 3: Verify OTP
1. On the **Verify OTP** page, enter the 6-digit code
2. Click **Verify OTP**
3. ✅ Upon success, you'll be logged in and redirected to the **Dashboard**

### Step 4: Test Login
1. Logout from the dashboard
2. Go to `http://localhost:5173/login`
3. Enter your **email or mobile number** and **password**
4. Click **Sign In**
5. ✅ You should be logged into the dashboard (only works if email is verified)

### Step 5: Test Resend OTP
1. Register another user but don't verify
2. Wait for the OTP to expire (or just test the resend)
3. Click **Resend OTP** on the verification page
4. ✅ A new OTP will be sent to your email

---

## 🔒 Security Features

1. **Password Hashing**: bcrypt with salt rounds = 12
2. **JWT Tokens**: 7-day expiration
3. **OTP Expiry**: 10 minutes from generation
4. **Email Verification**: Users cannot login without verifying email
5. **Input Validation**: All fields validated on backend
6. **Protected Routes**: JWT middleware guards sensitive endpoints

---

## 📝 Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  pan_card VARCHAR(10) UNIQUE NOT NULL,
  aadhaar_number VARCHAR(12) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  otp VARCHAR(6),
  otp_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🐛 Common Issues & Solutions

### Issue 1: OTP Email Not Received
- **Check spam folder**
- **Verify SMTP credentials** in `.env`
- **Enable "Less secure app access"** for Gmail (or use App Password)
- Check backend logs: `back-end/logs/combined.log`

### Issue 2: CORS Errors
- Ensure backend is running on `http://localhost:5000`
- Check `index.js` has `cors` middleware configured for `localhost:5173`

### Issue 3: Database Connection Failed
- Verify `NEON_URL` in `.env` is correct
- Check if Neon database is accessible
- Run `npm run db:push` to ensure schema is synced

### Issue 4: JWT Token Issues
- Clear browser localStorage and cookies
- Check if `JWT_SECRET` in `.env` matches backend

---

## 🎨 UI Features

- **Beautiful gradient backgrounds**
- **Responsive design** (mobile-friendly)
- **Real-time toast notifications**
- **Loading states** on buttons
- **OTP input field** with auto-formatting
- **Protected dashboard** with profile display

---

## 🚧 Coming Soon

- 💸 **UPI Transfer** (PAN-based, no bank account)
- 📋 **Loan Suggestions** (PolicyBazaar-style comparison)
- 📊 **Transaction History**
- 📱 **Mobile OTP** (SMS verification)
- 🔐 **Two-Factor Authentication**
- 💳 **Virtual Cards**

---

## 📞 Support

For issues or questions, check:
- Backend logs: `back-end/logs/combined.log`
- Browser console for frontend errors
- Network tab for API request/response details

---

## 🎉 Success Indicators

✅ Backend running on port 5000  
✅ Frontend running on port 5173  
✅ Database schema pushed successfully  
✅ Email service configured  
✅ User can register and receive OTP email  
✅ User can verify OTP and login  
✅ Protected routes working with JWT  

---

**Built with ❤️ for NIDHI Platform**
