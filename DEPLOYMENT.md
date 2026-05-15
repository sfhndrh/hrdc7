# Production deployment guide

This document covers deploying **hrdctrainer** with:

| Component | Platform |
|-----------|----------|
| Frontend (React 19 + Vite 6) | [Vercel](https://vercel.com) |
| API (Express 4 + TypeScript) | [Railway](https://railway.app) |
| Database | Railway **PostgreSQL** (recommended) |

---

## Deployment analysis (pre-flight)

### Architecture risks

| Risk | Severity | Notes |
|------|----------|-------|
| **Cross-origin cookies** | High | Frontend (Vercel) and API (Railway) are different sites. JWT cookies use `SameSite=None; Secure` in production. Both URLs must be HTTPS. |
| **Ephemeral uploads** | High | Multer writes to local disk. Railway containers lose files on redeploy unless you attach a **volume** or migrate to S3/R2. |
| **pdf2pic + Ghostscript** | Medium | PDF certificate AI verification needs `gs` on PATH. `server/nixpacks.toml` installs Ghostscript on Railway. PNG/JPEG uploads work without PDF conversion. |
| **Server-to-server verify** | Low | Background verify calls `API_URL` or `127.0.0.1:PORT`. On Railway, set `API_URL` to your public Railway URL if loopback fails. |
| **CORS misconfiguration** | Medium | `CLIENT_URL` must exactly match the Vercel origin (scheme + host, no trailing slash). |

### Missing configs (addressed in this repo)

- `CLIENT_URL` / `VITE_API_URL` for split hosting
- Production CORS with `credentials: true`
- `trust proxy` for Railway
- `vercel.json` SPA rewrites
- `server/nixpacks.toml` for Ghostscript
- Central `apiFetch` / `apiAssetUrl` on the client

### Vercel compatibility

- Build: `npm run build` in `client/` → static `dist/`
- Env: `VITE_API_URL` must be set at **build time** (Vite inlines it)
- React Router: `vercel.json` rewrites all routes to `index.html`

### Railway compatibility

- Build: `npm run build` in `server/` → `dist/`
- Start: `npm start` → `node dist/index.js`
- Port: Railway sets `PORT` automatically
- Database: link PostgreSQL plugin → `DATABASE_URL`
- SSL: internal Railway Postgres often uses `DATABASE_SSL=false`; public URLs use SSL

### Database: PostgreSQL vs MySQL

**Recommendation: stay on Railway PostgreSQL.**

The codebase is PostgreSQL-specific:

- Driver: `pg` (not `mysql2`)
- Schema: `DOUBLE PRECISION`, `NOW()::text`, `count(*)::int`
- Queries: `substring("createdAt" from 1 for 7)` (PostgreSQL `SUBSTRING` syntax)
- Placeholders: `?` converted to `$1…$n` in `server/src/db/query.ts`

Migrating to MySQL would require:

- New driver and connection pool
- Rewriting schema types and defaults
- Replacing PostgreSQL casts and `substring(… from … for …)` in analytics SQL
- Retesting all routes and transactions

**No ORM was added** — raw SQL is preserved.

---

## Environment variables

### Backend (`server/` — Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Railway PostgreSQL connection string |
| `JWT_SECRET` | Yes (prod) | Long random secret for JWT signing |
| `NODE_ENV` | Yes | `production` |
| `CLIENT_URL` | Yes | Vercel URL, e.g. `https://your-app.vercel.app` |
| `RESEND_API_KEY` | Optional | Resend email (preferred over SMTP) |
| `RESEND_FROM` | Optional | Verified sender, e.g. `App <notify@domain.com>` |
| `ADMIN_EMAIL` | Optional | Admin notification recipient |
| `API_URL` | Optional | Public API URL for internal verify triggers |
| `DATABASE_SSL` | Optional | `false` for Railway internal DB; default SSL in prod |
| `UPLOAD_DIR` | Optional | Upload root (use volume mount path if attached) |
| `CORS_ORIGINS` | Optional | Extra origins, comma-separated (preview deploys) |

Copy from `server/.env.example`.

### Frontend (`client/` — Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | Railway API URL, e.g. `https://your-api.up.railway.app` |

Copy from `client/.env.example`. **No trailing slash.**

Development: leave `VITE_API_URL` unset; Vite proxies `/api` to `localhost:4000`.

---

## Railway deployment checklist

### 1. Create project & PostgreSQL

- [ ] New Railway project
- [ ] Add **PostgreSQL** service
- [ ] Copy `DATABASE_URL` from the Postgres service variables

### 2. Deploy backend

- [ ] Add service from GitHub repo (or CLI)
- [ ] Set **Root Directory** → `server`
- [ ] **Build command:** `npm install && npm run build`
- [ ] **Start command:** `npm start`
- [ ] Node 20+ (see `engines` in `server/package.json`)

### 3. Environment variables

- [ ] `DATABASE_URL` (reference from Postgres plugin)
- [ ] `JWT_SECRET` (generate: `openssl rand -base64 48`)
- [ ] `NODE_ENV=production`
- [ ] `CLIENT_URL` = your Vercel production URL
- [ ] `RESEND_API_KEY` + `RESEND_FROM` (if using email)
- [ ] `ADMIN_EMAIL`
- [ ] If DB connection fails with SSL errors: `DATABASE_SSL=false`
- [ ] Optional: `API_URL` = Railway public domain

### 4. Networking

- [ ] Generate Railway **public domain** for the API
- [ ] Health check: `GET https://<api>/api/payment-settings` (or any public route)

### 5. Database seed (one-time)

From your machine (with `DATABASE_URL` pointing at Railway):

```bash
cd server
npm run db:seed
```

Or Railway one-off shell with the same env vars.

### 6. CORS verification

- [ ] `CLIENT_URL` matches Vercel origin exactly
- [ ] Browser devtools → Network → API responses include `Access-Control-Allow-Origin: <your-vercel-url>`
- [ ] `Access-Control-Allow-Credentials: true`

### 7. Cookie verification

- [ ] Login from Vercel app
- [ ] Application → Cookies: `auth_token` on API domain, `HttpOnly`, `Secure`, `SameSite=None`
- [ ] `GET /api/auth/session` returns user when called from Vercel with credentials

### 8. Uploads (awareness)

- [ ] Understand files are on ephemeral disk unless you add a Railway volume at `UPLOAD_DIR`
- [ ] Plan object storage (S3/R2) for long-term file retention

### 9. PDF verification

- [ ] `nixpacks.toml` installs Ghostscript
- [ ] Test trainer registration with PDF cert, or use PNG/JPEG if `gs` unavailable

---

## Vercel deployment checklist

### 1. Import project

- [ ] Connect GitHub repository
- [ ] **Root Directory** → `client`
- [ ] Framework: Vite
- [ ] Build: `npm run build`
- [ ] Output: `dist`

### 2. Environment variables

- [ ] `VITE_API_URL` = Railway public API URL (no trailing slash)
- [ ] Redeploy after changing `VITE_*` variables

### 3. SPA routing

- [ ] `vercel.json` present with rewrite to `/index.html`

### 4. API connectivity

- [ ] Open deployed app → login
- [ ] Network tab shows requests to `https://<railway-api>/api/...`
- [ ] No CORS errors
- [ ] Session persists after refresh

### 5. Assets

- [ ] Profile photos and uploads load (URLs use `VITE_API_URL` prefix via `apiAssetUrl`)

---

## GitHub push preparation

### Initialize git (if not done)

```bash
git init
git add .
git commit -m "Prepare for Vercel + Railway deployment"
```

### Never commit

- `server/.env`, `client/.env`, any file with secrets
- `node_modules/`, `dist/`, uploaded files under `server/uploads/`

### Safe to commit

- `server/.env.example`, `client/.env.example`
- `DEPLOYMENT.md`, `vercel.json`, `nixpacks.toml`

`.gitignore` ignores `.env*` but allows `!.env.example`.

---

## Local development (unchanged)

```bash
# From repo root
npm install
# server/.env with DATABASE_URL, JWT_SECRET
npm run dev
```

- Client: http://localhost:5173 (proxies `/api` → :4000)
- API: http://localhost:4000

---

## Monorepo build commands

```bash
npm run build          # server + client
npm run build -w server
npm run build -w client
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error on login | Set `CLIENT_URL` on Railway to exact Vercel URL |
| Cookie not sent | `SameSite=None`, HTTPS on both sides, `credentials: 'include'` |
| 401 after login | Check `JWT_SECRET` is set in production |
| Images 404 | Set `VITE_API_URL`; rebuild Vercel |
| PDF verify fails | Install Ghostscript (nixpacks) or upload image cert |
| Uploads disappear | Expected on redeploy; add volume or cloud storage |

---

## Future improvements (not in scope)

- S3/R2/Supabase Storage for multer uploads
- Pure-JS PDF rendering to remove Ghostscript dependency
- CI workflow for build/lint on push
