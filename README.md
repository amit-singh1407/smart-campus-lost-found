# 🎓 Smart Campus Lost & Found System

An intelligent, secure recovery platform connecting university students, faculty, and campus security staff to report, discover, match, and claim lost belongings with verified identities.

---

## 🚀 Key Features

- **Public Hub**: Landing showcase, directory browsing, registration, OTP email verification, and password reset flows.
- **Student / User Portal**: Dashboard metrics, report lost item, report found item, smart similarity match alerts, claims tracking, notification inbox, and profile settings.
- **Campus Security / Admin Control**: Overview analytics, campus user management (role updates & suspensions), inventory & locker moderation, claim proof verification desk, and immutable audit logs.
- **Smart Matching Engine**: Automatic matching between lost and found submissions based on category, location, and keywords with similarity scores.
- **Security & Integrity**:
  - Argon2 password hashing
  - JWT authentication & refresh tokens
  - Role-Based Access Control (`USER`, `ADMIN`, `SUPER_ADMIN`)
  - OTP Email Verification (with console fallback for local dev)
  - Rate limiting with Flask-Limiter
  - Input validation with Pydantic & Zod

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite** + **Tailwind CSS**
- **React Router v7** for public, protected, and admin routing
- **Axios** with JWT interceptors
- **Lucide React** icons & **Sonner** notifications
- **TanStack Query**

### Backend
- **Python 3** + **Flask**
- **MongoDB Atlas** (PyMongo)
- **Argon2** (`argon2-cffi`)
- **Flask-JWT-Extended**
- **Flask-Limiter** & **Flask-CORS**
- **Pydantic v2**

---

## 🏃 Running the Application

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Seed default admin account
python seed_admin.py

# Start Flask server
python run.py
```
> Server runs on `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> Frontend runs on `http://localhost:5173`

---

## 🔑 Default Administrative Credentials

- **Admin Email**: `admin@campus.edu`
- **Admin Password**: `AdminPassword123!`
- **Admin Portal**: `http://localhost:5173/admin/login`

---

## 🧪 Running Automated Tests

```bash
cd backend
python test_auth_flow.py
```
