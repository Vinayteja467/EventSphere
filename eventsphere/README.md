# EventSphere — AI-Powered Collegiate Event Platform

EventSphere is an AI-powered, multi-role Event Management Platform designed for Hackathons, Workshops, and College Seminars. It features a premium, responsive glassmorphic dark-first interface and automates event lifecycle tasks using Google Gemini AI, webcam QR check-in flows, and automated PDF certificate generation.

---

## 🚀 Key Features

1. **5 Role-Aware Dashboards**: Specialized panels for Organizers, Participants, Volunteers, Sponsors, and Admins.
2. **AI Sponsor Matchmaking**: Handled by Google's Gemini AI (`gemini-1.5-flash`), analyzing event metadata and ranking corporate sponsors with scores and reasoning.
3. **Webcam QR Check-In**: Instant QR code generation on ticket purchase. Volunteers scan passes in real time via in-app webcam (powered by `html5-qrcode`).
4. **Gamification (XP & Badges)**: Volunteers toggle task checklists and verify checks to gain XP, level up, unlock badges, and top global rankings.
5. **PDF Certificate Streamer**: On-the-fly rendering and streaming of dynamic landscape participation certificates (via `pdfkit`) for verified attendees.
6. **Dark-first Glassmorphic Theme**: Sleek backdrop-blur borders, neon glowing overlays, and customized Recharts widgets with support for a Light Mode toggle.

---

## 📁 Folder Structure

```
eventsphere/
├── client/                 # React Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── api/            # Centralized Axios client (api.js)
│       ├── components/     # Reusable UI (Button, Modal, StatCard, EventCard, OnboardingModal)
│       ├── context/        # AuthContext, ThemeContext
│       ├── hooks/          # useAuth, useToast, useFetch
│       ├── pages/          # Landing, Auth, Dashboards (Organizer, Participant...)
│       ├── routes/         # PrivateRoute, RoleRoute
│       └── utils/          # cn, formatDate, generateQR
└── server/                 # Express Node API Backend
    ├── package.json
    ├── server.js           # API Entrypoint
    ├── seed.js             # DB Seeder script
    ├── controllers/        # auth, events, users, volunteers, ai, registrations
    ├── middleware/         # authMiddleware, roleMiddleware, errorHandler
    ├── models/             # User, Event, Sponsor, Registration, Announcement
    ├── routes/             # authRoutes, eventRoutes, userRoutes, registrationRoutes...
    └── utils/              # generateQR, generateCertificate
```

---

## 🛠️ Environmental Configurations (`server/.env`)

Configure the active environment variables inside `server/.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/eventsphere
JWT_SECRET=eventsphere_jwt_secret_key_2026_xyz
JWT_REFRESH_SECRET=eventsphere_jwt_refresh_secret_key_2026_abc
PORT=5000
CLIENT_URL=http://localhost:5173

# Optional: Add key to enable advanced Gemini AI Sponsor Matching
# (Otherwise falls back to an elegant interest-intersection database heuristic!)
GEMINI_API_KEY=your_google_gemini_api_key
```

---

## ⚡ Setup & Installation

### Step 1: Install Server Dependencies
```bash
cd server
npm install
```

### Step 2: Seed the MongoDB Database
Ensure your local MongoDB instance is executing, then run:
```bash
npm run seed
```
This seeds the database with **10 user profiles**, **3 events**, **4 sponsors**, **8 registrations**, and **3 announcements**.

### Step 3: Install Client Dependencies
```bash
cd ../client
npm install
```

---

## 🏃 Run Applications Locally

### Start API Server (`http://localhost:5000`)
```bash
cd server
npm run dev
```

### Start Vite Frontend (`http://localhost:5173`)
```bash
cd client
npm run dev
```

---

## 🧪 Testing Account Clearances

Use the seeded credentials below to log in directly via the login screen. **Default password for all seeded accounts is: `password123`**

| Role | Username | Email |
| :--- | :--- | :--- |
| **Organizer** | Alex Rivera | `alex@eventsphere.edu` |
| **Participant** | Jane Doe | `jane@eventsphere.edu` |
| **Volunteer** | Marcus Brody | `marcus@eventsphere.edu` |
| **Sponsor** | Vercel Rep | `vercel@eventsphere.edu` |
| **Admin** | *Configure role in DB* | *Change role to admin on user list* |

*Note: You can elevate any account role to **Admin** inside the database, or create an Admin account by editing roles under the Admin Dashboard `/dashboard/admin/users`!*
