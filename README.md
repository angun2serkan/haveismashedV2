# havesmashed

Date tracking app with interactive globe visualization, friend system, badges, and admin panel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rust, Axum, SQLx, PostgreSQL 16 + PostGIS, Redis |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, react-globe.gl |
| Admin Panel | React, TypeScript, Vite, Tailwind CSS, Leaflet |

## Prerequisites

- **Rust** (latest stable) — [rustup.rs](https://rustup.rs)
- **Node.js** (v18+) — [nodejs.org](https://nodejs.org)
- **PostgreSQL 16** with **PostGIS** extension
- **Redis**

### macOS (Homebrew)

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# PostgreSQL + PostGIS
brew install postgresql@16 postgis
brew services start postgresql@16

# Redis
brew install redis
brew services start redis

# Node.js (if not installed)
brew install node
```

### Ubuntu/Debian

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# PostgreSQL + PostGIS
sudo apt install postgresql-16 postgresql-16-postgis-3

# Redis
sudo apt install redis-server

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs
```

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd haveismashedV2
```

### 2. Create the database

```bash
psql postgres -c "CREATE DATABASE havesmashed;"
```

> PostGIS and pgcrypto extensions are automatically created by the first migration.

### 3. Configure the backend

```bash
cd backend
cp .env.example .env.dev
```

Edit `backend/.env.dev`:

```env
DATABASE_URL=postgres://YOUR_USERNAME@localhost:5432/havesmashed
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=pick_any_random_string_at_least_32_characters
ADMIN_API_KEY=pick_any_random_admin_key
```

> On macOS with Homebrew, `YOUR_USERNAME` is your system username (run `whoami`). No password needed.

### 4. Start the backend

```bash
cd backend
cargo run
```

First run will:
- Compile the project (~1-2 min first time)
- Run all 9 database migrations automatically
- Seed 97 cities, 103 tags, and 12 badges
- Start the API server on `http://localhost:3000`

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`

### 6. Start the admin panel (optional)

```bash
cd admin
npm install
npm run dev
```

Opens on `http://localhost:5174`. Login with the `ADMIN_API_KEY` you set in `.env.dev`.

## Usage

### First time
1. Open `http://localhost:5173`
2. Click "Create Account" — you'll get a 12-word secret phrase. **Save it.**
3. Set a nickname
4. Click on a country on the globe → select a city → fill out the date form

### Adding friends
1. Go to Friends page → "Generate Friend Code"
2. Share the 8-character code with your friend
3. Your friend enters the code in their Friends page → "Add Friend"

### Admin panel
1. Open `http://localhost:5174`
2. Enter the `ADMIN_API_KEY`
3. Manage cities, badges, notifications, and view user stats

## Project Structure

```
haveismashedV2/
├── backend/              # Rust API server
│   ├── src/
│   │   ├── handlers/     # Route handlers (auth, dates, connections, badges, admin, etc.)
│   │   ├── services/     # Business logic (crypto, invites, wordlist)
│   │   ├── middleware/    # JWT auth middleware
│   │   └── main.rs       # Entry point
│   └── migrations/       # SQL migrations (auto-run on startup)
│
├── frontend/             # Main React app (port 5173)
│   └── src/
│       ├── pages/        # Route pages
│       ├── components/   # UI components (Globe, DateEntry, Friends, Badges, etc.)
│       ├── services/     # API client
│       ├── stores/       # Zustand state stores
│       └── data/         # Tag definitions, country mappings
│
└── admin/                # Admin React app (port 5174)
    └── src/
        ├── pages/        # Dashboard, Cities, Badges, Notifications, Users
        ├── services/     # Admin API client
        └── stores/       # Admin auth store
```

## API Overview

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | - | Create account, get 12-word phrase |
| `/api/auth/login` | POST | - | Login with phrase |
| `/api/auth/nickname` | PUT | JWT | Set nickname |
| `/api/dates` | GET/POST | JWT | List/create dates |
| `/api/dates/:id` | GET/PUT/DELETE | JWT | Date CRUD |
| `/api/cities` | GET | JWT | List cities |
| `/api/tags` | GET/POST | JWT | List/create tags |
| `/api/connections` | GET | JWT | List friends |
| `/api/connections/add` | POST | JWT | Add friend by code |
| `/api/invites/create` | POST | JWT | Generate invite/friend code |
| `/api/stats` | GET | JWT | User statistics |
| `/api/badges/me` | GET | JWT | User's badges |
| `/api/notifications` | GET | JWT | User notifications |
| `/api/friends/dates` | GET | JWT | Friends' dates for globe |
| `/api/admin/*` | Various | Admin Key | Admin CRUD endpoints |

## Resetting the Database

If you need a fresh start:

```bash
psql postgres -c "DROP DATABASE havesmashed;"
psql postgres -c "CREATE DATABASE havesmashed;"
cargo run  # migrations re-run automatically
```
