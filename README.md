# 🎓 Smart Campus Lost & Found System

An intelligent, secure, and full-stack recovery platform connecting university students, faculty, and campus security staff to report, discover, match, and claim lost belongings — with verified identities, smart AI matching, and a conversational recovery assistant.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Database Collections](#-database-collections)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Default Credentials](#-default-administrative-credentials)
- [Automated Tests](#-running-automated-tests)

---

## 🌟 Overview

Smart Campus Lost & Found is a full-stack web application that digitizes the entire lifecycle of a lost item — from first report to final handover. It features:

- **Multi-role authentication** (Student/User, Admin, Super Admin)
- **Smart Matching Engine** powered by TF-IDF cosine similarity + weighted attribute scoring
- **Conversational Recovery Assistant** with Hinglish NLP support
- **Cloudinary-backed image uploads** for lost/found items
- **QR Code digital handover** system for secure physical pickup
- **Immutable Audit Logs** for all administrative actions
- **OTP email verification** with SMTP + console fallback
- **Enhanced UI/UX** with dynamic password strength indicators, OTP auto-submission, and modern visual feedback

---

## 🚀 Features

### 🌐 Public Zone
| Page | Description |
|------|-------------|
| **Landing Page** | Hero showcase, feature highlights, recent activity feed |
| **Browse Page** | Publicly accessible item directory with filters |
| **Register** | Student/faculty registration with campus email validation, password strength & match indicators |
| **OTP Verification** | Email-based OTP verification with automatic submission and visual progress dots |
| **Login** | JWT-based login with refresh token support and password visibility toggles |
| **Forgot Password** | Secure password reset via email OTP |

### 👤 Student / User Portal
| Page | Description |
|------|-------------|
| **Dashboard** | Summary metrics: active reports, matches, claims, notifications |
| **Report Lost Item** | Rich form with image upload, category, brand, color, location |
| **Report Found Item** | Found item submission with image upload and locker assignment |
| **Browse Items** | Filterable/searchable directory of all open items |
| **Item Details** | Full item view with match indicators and claim button |
| **My Reports** | All personal lost & found submissions with status tracking |
| **Matches** | Smart similarity-scored matches auto-detected by the engine |
| **Claims** | Track submitted claim requests and their verification status |
| **Notifications** | In-app notification inbox for matches, claims, and alerts |
| **Recovery Assistant** | AI-powered conversational agent to locate lost items by natural language |
| **Watchlist** | Subscribe to alerts when matching items are reported |
| **Profile** | Update personal info, student ID, and password |

### 🛡️ Admin / Campus Security Control Panel
| Page | Description |
|------|-------------|
| **Admin Dashboard** | System-wide analytics: total items, claims, users, match rates |
| **User Management** | View all users, update roles, suspend/activate accounts |
| **Item Inventory** | Manage all submitted items, update status, assign storage lockers |
| **Claims Verification** | Review claim proofs, approve/reject claims, trigger handover QR |
| **Reports** | Summary statistics and activity reports |
| **Audit Logs** | Immutable, timestamped log of all admin actions |
| **Admin Login** | Separate admin authentication portal |

### 🧠 Smart Matching Engine
- Automatic matching triggered on every new item submission
- **Scoring breakdown:**
  - Category match — 30 pts
  - Location match — 25 pts
  - TF-IDF cosine similarity on title/description — 25 pts
  - Brand match — 10 pts
  - Color match — 10 pts
  - Date proximity bonus (up to 10 pts)
- Match tiers: **High** (≥75), **Medium** (≥50), **Low** (≥30)
- Stores top matches in `matches` collection; notifies both parties

### 🤖 Recovery Assistant (NLP)
- Natural language query parsing (English + Hinglish)
- Extracts: item category, color, brand, campus location, relative date
- Supported Hinglish keywords: `batua` (wallet), `chabi` (key), `basta` (bag), `kitab` (book), `kho gaya` (lost), `kal` (yesterday), etc.
- Returns ranked candidates with similarity scores and guided action steps

### 🔒 Security & Integrity
- **Argon2** password hashing (`argon2-cffi`)
- **JWT** access + refresh token flow with custom error handlers
- **Role-Based Access Control**: `USER` → `ADMIN` → `SUPER_ADMIN`
- **OTP Email Verification** (SMTP via Gmail; console fallback in dev)
- **Flask-Limiter** rate limiting (`200 req/day` default per IP)
- **Pydantic v2** request validation (backend) + **Zod** (frontend)
- **Security headers** middleware (X-Frame-Options, CSP, etc.)
- **Cloudinary** for secure image hosting

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| **React 19** + **Vite 8** | UI framework and build tool |
| **Tailwind CSS v4** | Utility-first styling |
| **React Router v7** | Client-side routing (public, protected, admin) |
| **TanStack Query v5** | Server state, caching, and background refetch |
| **React Hook Form** + **Zod** | Form management and schema validation |
| **Axios** | HTTP client with JWT interceptor |
| **Lucide React** | Icon library |
| **Sonner** | Toast notification system |
| **date-fns** | Date formatting utilities |

### Backend
| Tech | Purpose |
|------|---------|
| **Python 3** + **Flask 3** | Web framework |
| **MongoDB Atlas** (PyMongo) | Primary NoSQL database |
| **Flask-JWT-Extended** | JWT access + refresh tokens |
| **Flask-CORS** | Cross-Origin Resource Sharing |
| **Flask-Limiter** | Rate limiting per IP |
| **Argon2-cffi** | Secure password hashing |
| **Pydantic v2** | Request schema validation |
| **Cloudinary SDK** | Image upload and CDN storage |
| **scikit-learn** + **numpy** | TF-IDF cosine similarity for matching |
| **Pillow** | Image processing |
| **Gunicorn** | Production WSGI server |
| **python-dotenv** | Environment variable management |

---

## 📁 Project Structure

```
smart-campus-lost-found/
├── backend/
│   ├── app/
│   │   ├── __init__.py              # Flask app factory, MongoDB init, blueprint registration
│   │   ├── config.py                # Config class (reads .env)
│   │   ├── data_store.py            # In-memory fallback store
│   │   ├── middleware/
│   │   │   └── security_headers.py  # Security headers middleware
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic v2 request schemas
│   │   ├── routes/
│   │   │   ├── auth_routes.py       # /api/v1/auth
│   │   │   ├── item_routes.py       # /api/v1/items
│   │   │   ├── claim_routes.py      # /api/v1/claims
│   │   │   ├── admin_routes.py      # /api/v1/admin
│   │   │   ├── dashboard_routes.py  # /api/v1/dashboard
│   │   │   ├── notification_routes.py # /api/v1/notifications
│   │   │   ├── user_routes.py       # /api/v1/users
│   │   │   ├── watchlist_routes.py  # /api/v1/watchlists
│   │   │   ├── assistant_routes.py  # /api/v1/assistant
│   │   │   └── public_routes.py     # /api/v1/public
│   │   ├── services/
│   │   │   ├── auth_service.py      # Registration, login, OTP, password reset
│   │   │   ├── item_service.py      # Item CRUD, image upload, storage assignment
│   │   │   ├── claim_service.py     # Claim submission, verification, QR handover
│   │   │   ├── matching_engine.py   # TF-IDF + weighted attribute similarity scoring
│   │   │   ├── matching_service.py  # Triggers engine on item events
│   │   │   ├── recovery_assistant_service.py # NLP conversational assistant
│   │   │   ├── report_quality_service.py     # Report completeness scoring
│   │   │   └── audit_service.py     # Audit log write service
│   │   └── utils/
│   ├── run.py                       # Flask entry point
│   ├── seed_admin.py                # Seeds default admin account
│   ├── requirements.txt
│   ├── test_auth_flow.py            # Auth flow automated tests
│   ├── test_core_and_matching.py    # Core features + matching engine tests
│   └── test_new_features.py        # New feature tests
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Responsive navbar with role-aware nav links
│   │   │   ├── Footer.jsx           # Site footer
│   │   │   ├── ItemCard.jsx         # Reusable item card component
│   │   │   ├── Layout.jsx           # Shared page layout wrapper
│   │   │   └── UIComponents.jsx     # Shared UI primitives (badges, spinners, etc.)
│   │   ├── pages/
│   │   │   ├── public/              # LandingPage, LoginPage, RegisterPage,
│   │   │   │                        # VerifyEmailPage, ForgotPasswordPage
│   │   │   ├── user/                # DashboardPage, ReportLostPage, ReportFoundPage,
│   │   │   │                        # BrowsePage, ItemDetailsPage, MyReportsPage,
│   │   │   │                        # MatchesPage, ClaimsPage, NotificationsPage,
│   │   │   │                        # RecoveryAssistantPage, ProfilePage
│   │   │   ├── admin/               # AdminLoginPage, AdminDashboardPage, AdminUsersPage,
│   │   │   │                        # AdminItemsPage, AdminClaimsPage, AdminReportsPage,
│   │   │   │                        # AdminAuditLogsPage
│   │   │   └── items/               # FindItem
│   │   ├── routes/                  # Route definitions (public, protected, admin guards)
│   │   ├── services/                # Axios API service modules
│   │   ├── context/                 # React context (Auth, etc.)
│   │   └── layouts/                 # Layout components
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 📡 API Reference

### Authentication — `/api/v1/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new user (sends OTP) |
| POST | `/verify-otp` | Public | Verify email OTP |
| POST | `/resend-otp` | Public | Resend OTP email |
| POST | `/login` | Public | Login, returns access + refresh tokens |
| POST | `/refresh` | Refresh Token | Rotate access token |
| POST | `/logout` | JWT | Logout (blacklist token) |
| POST | `/forgot-password` | Public | Send password reset OTP |
| POST | `/reset-password` | Public | Reset password with OTP |

### Items — `/api/v1/items`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Optional | List/search all items |
| POST | `/` | JWT | Create lost or found item report |
| GET | `/:id` | Optional | Get single item details |
| PATCH | `/:id` | JWT (Owner) | Update item |
| DELETE | `/:id` | JWT (Owner/Admin) | Delete item |
| POST | `/:id/image` | JWT (Owner) | Upload item image to Cloudinary |
| GET | `/my` | JWT | Get current user's items |
| GET | `/matches/:id` | JWT | Get matches for a specific item |

### Claims — `/api/v1/claims`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | JWT | Submit a claim with proof answers |
| GET | `/my` | JWT | Get user's submitted claims |
| GET | `/item/:id` | JWT | Get all claims for an item |

### Dashboard — `/api/v1/dashboard`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | User dashboard summary metrics |

### Notifications — `/api/v1/notifications`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | Get user's notifications |
| PATCH | `/:id/read` | JWT | Mark notification as read |
| PATCH | `/read-all` | JWT | Mark all as read |

### Watchlist — `/api/v1/watchlists`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | JWT | Add item to watchlist |
| DELETE | `/:id` | JWT | Remove from watchlist |
| GET | `/` | JWT | Get user's watchlist |

### Recovery Assistant — `/api/v1/assistant`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/query` | JWT | Submit natural language query, get ranked matches |

### Admin — `/api/v1/admin`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | ADMIN | List all users |
| PATCH | `/users/:id/role` | SUPER_ADMIN | Update user role |
| PATCH | `/users/:id/suspend` | ADMIN | Suspend/activate user |
| GET | `/items` | ADMIN | List all items with admin metadata |
| PATCH | `/items/:id` | ADMIN | Update item status / assign locker |
| GET | `/claims` | ADMIN | List all claims |
| PATCH | `/claims/:id` | ADMIN | Approve/reject claim, generate handover QR |
| GET | `/audit-logs` | ADMIN | Retrieve immutable audit logs |
| GET | `/stats` | ADMIN | System-wide statistics |

### Public — `/api/v1/public`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/items` | None | Browse items without login |

---

## 🗄️ Database Collections

| Collection | Description |
|------------|-------------|
| `users` | Accounts with roles, student IDs, Argon2 hashed passwords |
| `items` | Lost and found submissions with status, images, locker assignments |
| `matches` | Auto-generated similarity-scored pairs between lost and found items |
| `claims` | User claim submissions with proof answers and approval status |
| `notifications` | In-app notifications for matches, claims, and system events |
| `watchlists` | User subscriptions to alerts for specific lost items |
| `otp_verifications` | Temporary OTP records for email verification |
| `audit_logs` | Immutable timestamped log of all admin actions |

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory. Use `.env.example` as a template:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/
MONGODB_DATABASE=smart_campus_lost_found

# JWT
JWT_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<long-random-refresh-secret>

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=<your-gmail>
EMAIL_PASSWORD=<app-password>

# App
FRONTEND_URL=http://localhost:5173
ALLOWED_EMAIL_DOMAIN=campus.edu
FLASK_ENV=development
DEBUG=True
MAX_CONTENT_LENGTH=16777216
RATE_LIMIT_DEFAULT=200/day
```

> **Note:** In development, if SMTP credentials are missing, OTP codes are printed to the Flask console instead of being emailed.

Frontend — create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

---

## 🏃 Running the Application

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment (recommended)
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Seed the default admin account
python seed_admin.py

# Start the Flask development server
python run.py
```

> ✅ Backend runs on `http://localhost:5000`
> ✅ Health check: `http://localhost:5000/health`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

> ✅ Frontend runs on `http://localhost:5173`

---

## 🔑 Default Administrative Credentials

| Field | Value |
|-------|-------|
| **Admin Email** | `admin@campus.edu` |
| **Admin Password** | `AdminPassword123!` |
| **Admin Portal URL** | `http://localhost:5173/admin/login` |

> ⚠️ Change the admin password immediately after first login in any production deployment.

---

## 🧪 Running Automated Tests

Three test suites are included in the `backend/` directory:

```bash
cd backend

# Auth flow tests (register, OTP, login, refresh, logout, password reset)
python test_auth_flow.py

# Core features + smart matching engine tests
python test_core_and_matching.py

# New features tests (watchlist, assistant, notifications)
python test_new_features.py
```

> Tests hit the live Flask server. Make sure `python run.py` is running before executing the test suites.

---

## 📦 Production Deployment Notes

- Use **Gunicorn** as the WSGI server: `gunicorn -w 4 run:app`
- Set `FLASK_ENV=production` and `DEBUG=False`
- Configure **MongoDB Atlas** IP allowlist for your server
- Set `FRONTEND_URL` to your deployed frontend domain for CORS
- Use a Redis URL for `REDIS_URL` in rate limiter for multi-worker setups
- Build the frontend: `npm run build` — serve the `dist/` folder via Nginx or a CDN

---

## 👤 Author

**Amit Singh** — Smart Campus Lost & Found System
Built as a full-stack Big Data project integrating NLP-based item recovery, intelligent matching, and role-based campus administration.
