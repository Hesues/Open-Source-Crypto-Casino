# Blixbet v1 — Installation Guide

A full-stack crypto casino: **React + Vite frontend** (`artifacts/blixbet`) and **Express + TypeScript backend** (`artifacts/api-server`), wired together as a **pnpm monorepo**.

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Node.js** | 20 or 24 | `node -v` |
| **pnpm** | 9+ | `npm i -g pnpm` |
| **PostgreSQL** | 14+ | Local or hosted (Neon, Supabase, RDS, etc.) |
| Git | any | optional |

> The repo uses **pnpm workspaces** — do NOT use npm or yarn at the root.

---

## 2. Unzip & Install

```bash
unzip blixbetv1.zip
cd blixbetv1
pnpm install
```

`pnpm install` reads `pnpm-workspace.yaml` and installs deps for **all artifacts** in one go.

---

## 3. Configure Environment Variables

Create a file named **`.env`** in the project root:

```env
# ── Database ─────────────────────────────────────────────
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/blixbet

# ── App secrets (generate strong random strings) ────────
SESSION_SECRET=replace_with_64_random_chars
JWT_SECRET=replace_with_64_random_chars

# ── Server ──────────────────────────────────────────────
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
API_BASE=http://localhost:5000

# ── NOWPayments (crypto deposits / withdrawals) ─────────
NOWPAYMENTS_API_KEY=your_api_key
NOWPAYMENTS_IPN_SECRET=your_ipn_secret
NOWPAYMENTS_EMAIL=your_account_email
NOWPAYMENTS_PASSWORD=your_account_password

# ── Object storage (avatars, KYC docs) ──────────────────
# Local dev: leave the *_DIR pointing to a local folder; the app will create it.
PRIVATE_OBJECT_DIR=./.storage/private
PUBLIC_OBJECT_SEARCH_PATHS=./.storage/public
```

Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> **NOWPayments is optional in dev** — the wallet/payment screens will load but real crypto deposits won't work without valid credentials. Sign up at https://nowpayments.io and grab the keys from your dashboard.

---

## 4. Initialize the Database

```bash
# Push the Drizzle schema (creates all tables)
pnpm --filter @workspace/api-server run db:push
```

If that command isn't defined, run:
```bash
pnpm --filter @workspace/api-server exec drizzle-kit push
```

---

## 5. Run in Development

Open **two terminals**:

```bash
# Terminal 1 — backend (Express + WebSocket, port 5000)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — frontend (Vite, port 5173 by default)
pnpm --filter @workspace/blixbet run dev
```

Then open: **http://localhost:5173**

The frontend proxies `/api/*` and the WebSocket to the backend automatically (see `artifacts/blixbet/vite.config.ts`).

---

## 6. Build for Production

```bash
pnpm run build
```

This builds both the API server (`artifacts/api-server/dist`) and the frontend (`artifacts/blixbet/dist`). The Express server serves the built frontend in production.

Start the production server:
```bash
pnpm run start
# or:  node artifacts/api-server/dist/index.mjs
```

The single Node process serves both the API and the static frontend on `PORT` (default 5000).

---

## 7. First Login & Admin Access

1. Open the site, click **Register**, create your first account.
2. Connect to the database and promote yourself to admin:
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'your_username';
   ```
3. Refresh — you'll see the **Admin** link in the menu.

---

## 8. Folder Structure

```
blixbetv1/
├── artifacts/
│   ├── api-server/         ← Express backend (TypeScript)
│   │   ├── src/
│   │   │   ├── routes/      ← REST endpoints
│   │   │   ├── lib/games/   ← Crash, Mines, Slides, etc.
│   │   │   ├── db/          ← Drizzle schema + queries
│   │   │   └── index.ts     ← entry point
│   │   └── package.json
│   └── blixbet/            ← React + Vite frontend
│       ├── src/
│       │   ├── pages/       ← Routes (Home, Mines, Crash, Admin…)
│       │   ├── components/  ← Shared UI
│       │   └── App.tsx
│       ├── index.html
│       └── vite.config.ts
├── package.json            ← root workspace
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
└── INSTALLATION.md         ← you are here
```

---

## 9. Games Included

All games are server-authoritative (RNG runs on the backend, client only renders).

| Game | Path | Notes |
|---|---|---|
| Crash | `/crash` | Multiplayer rocket, real-time WS |
| Mines | `/mines` | 5×5 → 8×8 grids, manual + auto |
| Slides | `/slides` | 14× & 2× side bets, multiplayer |
| Towers | `/towers` | Easy/Medium/Hard ladders |
| Dice | `/dice` | Over/under provably-fair |
| Plinko | `/plinko` | 8–16 rows, 3 risk levels |
| Roulette | `/roulette` | EU single-zero |
| Blackjack | `/blackjack` | Standard rules + insurance |
| Chicken Cross | `/chicken-cross` | Lane-based crash variant |
| Race | `/race` | Wager leaderboard prizes |

---

## 10. Common Issues

**`pnpm install` fails with "Use pnpm instead"**
You ran `npm install`. Use `pnpm install` (the root `preinstall` script enforces this).

**Port 5000 already in use**
Change `PORT` in your `.env`, or kill the process: `lsof -ti:5000 | xargs kill`.

**Frontend loads but API calls fail**
Make sure the backend (Terminal 1) is running. Check `artifacts/blixbet/vite.config.ts` proxy targets the same `PORT` you set.

**Database connection refused**
Verify `DATABASE_URL`. For Postgres on macOS: `brew services start postgresql@16`.

**Crypto deposits show "Configuration error"**
NOWPayments keys are missing or invalid. Double-check `.env` and restart the backend.

**Blank screen / WebSocket disconnects**
The backend must be running BEFORE the frontend connects. Restart Terminal 1, then hard-refresh the browser.

---

## 11. Updating

```bash
git pull        # if using git
pnpm install    # in case deps changed
pnpm --filter @workspace/api-server run db:push   # if schema changed
```

Then restart both dev servers.

---

Enjoy! For any issues, check the logs in each terminal — both backend and frontend log generously in dev mode.
