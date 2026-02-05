# Cloud Sync — Hosted Backend (Anytime/Anywhere)

Your app is **offline-first**: edits (sales/pricing/etc.) are saved locally immediately.

To get true "works anywhere" redundancy/sync, the Cloud Sync backend must be reachable on the public internet (HTTPS), not just your Mac on Wi‑Fi.

## How Cloud Sync works today

- Client talks to `EXPO_PUBLIC_RORK_API_BASE_URL` (or the dev LAN host) at `/api/trpc`.
- Server stores one encrypted-ish blob per "Cloud Sync Key" (we hash the key server-side).
- Conflict strategy is **last-backup-wins**.

## Recommended production setup

1) Host the backend (Bun + Hono + tRPC) on a public URL.
2) Use a **persistent** store for backups.
3) Set `EXPO_PUBLIC_RORK_API_BASE_URL` in your production build to the hosted URL.

### Storage drivers

The backend supports these storage drivers:

- `SPM_SYNC_STORE_DRIVER=json` (default)
  - Persists to a JSON file: `SPM_SYNC_STORE_PATH` (or `dev/sync-store.json`).
  - OK for local dev; not recommended for production.

- `SPM_SYNC_STORE_DRIVER=sqlite`
  - Persists to SQLite: `SPM_SYNC_SQLITE_PATH` (or `dev/sync-store.sqlite`).
  - Recommended for a small hosted backend. Use a persistent disk/volume.

## Environment variables

Backend:

- `PORT=8787` (or whatever your host assigns)
- `SPM_SYNC_STORE_DRIVER=sqlite`
- `SPM_SYNC_SQLITE_PATH=/data/sync-store.sqlite` (path on a persistent volume)

Client:

- `EXPO_PUBLIC_RORK_API_BASE_URL=https://YOUR_HOSTNAME` (no trailing slash)

## Cellular / leaving Wi‑Fi

- Users can always keep editing offline.
- Sync will happen automatically once:
  - there is internet connectivity, and
  - `EXPO_PUBLIC_RORK_API_BASE_URL` is reachable.

## Dev: access away from home network

- For UI/dev access from anywhere: run Expo with `--tunnel`.
- For API access from anywhere: either deploy the API, or tunnel port 8787 via a tunnel (ngrok/cloudflared).

---

If you tell me which hosting you prefer (Fly.io, Render, Railway, etc.), I can add a ready-to-deploy config for that provider.
