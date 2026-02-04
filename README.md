# Zootopia Clicker

## Backend auth + state (Telegram Mini Apps)

### Environment variables (Yandex Lockbox)
Store secrets only in Yandex Lockbox and inject them into the function/container runtime:

- `BOT_TOKEN` — Telegram bot token for initData signature verification.
- `JWT_SECRET` — secret used to sign access tokens.
- `DATABASE_URL` — Postgres connection string.
- `TONCENTER_API_KEY` — TON API key (if used by other functions).
- `CORS_ORIGINS` — optional comma-separated whitelist of allowed origins (GitHub Pages + Telegram WebApp). If unset, CORS defaults to `*` for MVP.

### Backend endpoints
The auth handler (`backend/auth.js`) exposes:
- `POST /auth/telegram`
- `GET /me`
- `POST /wallet/link`
- `GET /state`
- `POST /state`

### Frontend configuration
Set `window.API_BASE` (or `localStorage.zoo_api_base`) to the deployed backend base URL before running the app.

## Deployment (Yandex Cloud)

### 1) Postgres (Managed)
1. Create a Managed PostgreSQL cluster.
2. Apply migrations in `backend/migrations/*.sql`.
3. Store the resulting connection string in Lockbox as `DATABASE_URL`.

### 2) Yandex Lockbox
1. Create a Lockbox secret with keys: `BOT_TOKEN`, `JWT_SECRET`, `DATABASE_URL`, `TONCENTER_API_KEY`, `CORS_ORIGINS`.
2. Grant the function/container service account read access to the secret.

### 3) Yandex Cloud Functions / Serverless Containers
1. Deploy `backend/auth.js` as a Node.js function (or a container with a single entrypoint).
2. Configure environment variables by referencing Lockbox secrets.
3. Expose an HTTPS endpoint; set it as `window.API_BASE`.

### 4) GitHub Pages (frontend)
1. Build/commit the static frontend.
2. Ensure `window.API_BASE` is set to the backend URL.
3. Open the Mini App via Telegram (so `initData` is available).
