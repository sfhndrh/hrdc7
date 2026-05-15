<!-- BEGIN:stack -->
This repo is a **React (Vite) SPA** plus **Express** API and **PostgreSQL** (Supabase) via **pg** (no ORM).

- UI: `client/` — `npm run dev -w client` (proxies `/api` to the server)
- API: `server/` — `npm run dev -w server` (default port **4000**)
- From repo root: `npm run dev` starts both.

Set `DATABASE_URL` in `server/.env` to your Supabase connection string (Project Settings → Database → URI; pooler recommended). Tables are created automatically on startup. Seed: `npm run db:seed`. JWT cookies use `JWT_SECRET` (falls back to `NEXTAUTH_SECRET` for migration).
<!-- END:stack -->
