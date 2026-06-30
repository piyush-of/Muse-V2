# MUSE — AI-Powered Personal Fashion Intelligence Platform

MUSE is a premium, full-stack personal styling and digital wardrobe assistant. Rather than showing endless shopping feeds or discovery lists, MUSE focuses on **decision compression**—helping users make fast, confident outfit choices using the wardrobe items they already own.

---

## 🌌 Product Features

- **Daily Capsule Deck**: A daily recommendation of three customized outfits compiled by style algorithms based on weather, occasion, and wear-history analytics. Rendered as a stacked deck with fluid card physics (swipe left to reject, right to accept).
- **AI Garment Scanner**: Real-time image uploads with zero manual tagging. Behind the scenes, the system connects to Anthropic's Claude API to determine categories, colors, seasons, and formality metrics.
- **Style DNA Fingerprint**: A dynamic, interactive vector radar chart that graphs style dimensions (e.g. Relaxed ↔ Structured, Neutral ↔ Bold) and tracks a user's North Star metric: the daily Outfit Acceptance Rate.
- **Wardrobe Gap Discovery**: Continuous audit of digital closets to highlight composition gaps (e.g., missing outerwear layers) and suggest high-utility additions to double existing outfit combinations.
- **Living Background**: A responsive digital canvas of fluid color blobs that react to theme toggles, cursor motion, and scroll depths.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **State Management**: Zustand (UI/swipe decks), React Query (API caching & server states)
- **Backend**: Node.js, Express, TypeScript
- **Database & ORM**: SQLite (zero-setup local storage) with Prisma ORM
- **Authentication**: JWT-based session auth, password hashing via `bcryptjs`
- **File Storage**: Local filesystem disk storage (`/backend/uploads/`) with pluggable cloud S3 interface

---

## 📂 Project Structure

```
Muse v2/
├── package.json            <- Monorepo configuration and scripts
├── backend/                <- Express + Prisma Server
│   ├── prisma/
│   │   ├── schema.prisma   <- SQLite schema models (User, ClosetItem, Outfit, etc.)
│   │   └── dev.db          <- SQLite local database file
│   ├── src/
│   │   ├── controllers/    <- Route controllers (Auth, Closet, Capsule, Discover, Profile)
│   │   ├── services/       <- AI classification, node-cron compilers, db, storage
│   │   ├── routes/         <- Express route routers
│   │   └── index.ts        <- Server listener and initialization
│   └── package.json
└── frontend/               <- Vite + React Client
    ├── src/
    │   ├── components/     <- UI Components (DailyCapsule, ClosetGrid, ProfileDNA, etc.)
    │   ├── store/          <- Zustand client store
    │   └── App.tsx         <- Main router and layout shell
    ├── tailwind.config.js  <- Premium design color palette config
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Installation
Clone the repository and install all dependencies for both the frontend and backend in one command:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="YOUR_SECURE_JWT_SECRET_STRING"
ANTHROPIC_API_KEY="YOUR_CLAUDE_API_KEY_HERE"  # Optional: Fallback mock heuristics used if empty
UPLOAD_DIR="./uploads"
```

### 3. Initialize the Local Database
Run Prisma migrations to create your SQLite database and generate the Prisma Client:
```bash
cd backend
npx prisma db push
cd ..
```

### 4. Running the Application
Start both the backend API server and the frontend Vite web server concurrently:
```bash
npm run dev
```

The application will be accessible at:
- **Frontend client**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API server**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🎨 Design System

MUSE operates on a custom-tailored luxury color scheme built with CSS variables to ensure seamless light/dark transitions:

| Token Name | Light Mode Hex | Dark Mode Hex | Description |
| :--- | :--- | :--- | :--- |
| `--color-paper` | `#F5F2EC` | `#131210` | Canvas base page color |
| `--color-card` | `#FBF9F5` | `#1C1A17` | Card and modal surface |
| `--color-ink-primary` | `#211F1B` | `#EDE9E2` | High contrast text color |
| `--color-accent` | `#4B3B66` | `#7C62A8` | Premium editorial purple accent |
| `--color-border-hairline` | `rgba(33,31,27,0.12)` | `rgba(237,233,226,0.10)` | Super fine borders |

---

## 📦 Production Deployment

Refer to the detailed [deployment_guide.md](file:///C:/Users/piyus/.gemini/antigravity/brain/b2b65f88-e6a6-4fd2-a530-5fdcdd4781b9/deployment_guide.md) in the system directory for setting up hosted PostgreSQL databases, Docker configurations, and container settings for **Railway**, **Render**, or **Vercel**.
