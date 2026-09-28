# Heaven Craft — Base44 Dev Environment

## What this is
A Vite + React + Express (TypeScript) app: a Minecraft Bedrock add-on sharing platform.
The Express server (`server.ts`) runs Vite in middleware mode and serves both the API
(`/api/*`) and the frontend on a single port (3000).

## Running
- `docker compose -f docker-compose.base44.yml up -d --build` then check `:3000`.
- Dev command is `tsx server.ts` (set in package.json `dev` script).
- Source is bind-mounted; edits hot-reload via Vite HMR (middleware mode).
- `node_modules` lives in a named volume so host bind doesn't clobber installed deps.

## No external secrets required
- `GEMINI_API_KEY` is listed in `.env.example` but is NOT referenced anywhere in the
  code — the app boots and runs fully without it.
- Firebase config is hardcoded in `firebase-applet-config.json`; the server also keeps a
  local JSON fallback DB (`addons_local.json`, `broadcasts_local.json`) so it works even
  when Firestore quotas are exhausted.
- The only env var the code reads is `NODE_ENV` (set to `development` in compose).

## Health / verification
- Healthcheck probes `GET /api/db-status` (returns JSON connection status).
- `GET /` returns the React SPA; `GET /api/addons` returns the add-on list.
- Vite serves unhashed source modules (e.g. `/src/main.tsx`) — confirms live source, not a
  prebuilt bundle.

## Host/origin
- Express binds `0.0.0.0:3000`.
- Vite (>= 6.1) allowedHosts is satisfied via the platform-injected
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` env var (passed bare in compose).
