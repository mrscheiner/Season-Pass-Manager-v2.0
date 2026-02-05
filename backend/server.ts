import app from "./hono";

const port = Number(process.env.PORT || 8787);

// Bun runtime server entrypoint for local dev.
// This lets Expo Go (on iPhone) reach the API via your Mac's LAN IP.
Bun.serve({
  port,
  fetch: app.fetch,
});

// eslint-disable-next-line no-console
console.log(`[API] Hono/tRPC server listening on http://0.0.0.0:${port}`);
