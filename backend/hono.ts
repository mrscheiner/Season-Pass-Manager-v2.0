import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

console.log('[TRPC_SERVER] Hono server initializing...');
console.log('[TRPC_SERVER] tRPC mounted at /trpc/* internally, endpoint set to /api/trpc (full path after platform mount)');

// Masked verification logging for Ticketmaster API key
const tmKeyPresent = Boolean(process.env.TICKETMASTER_API_KEY);
const tmKeyLength = process.env.TICKETMASTER_API_KEY?.length ?? 0;
const tmKeyLast4 = tmKeyPresent ? process.env.TICKETMASTER_API_KEY!.slice(-4) : 'N/A';
console.log('[TRPC_SERVER] TICKETMASTER_API_KEY check:');
console.log('[TRPC_SERVER]   hasKey:', tmKeyPresent);
console.log('[TRPC_SERVER]   keyLength:', tmKeyLength);
console.log('[TRPC_SERVER]   last4:', tmKeyLast4);

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

const logRequest = async (c: any, next: any) => {
  console.log('[TRPC_SERVER] ========== INCOMING REQUEST ==========');
  console.log('[TRPC_SERVER] Method:', c.req.method);
  console.log('[TRPC_SERVER] URL:', c.req.url);
  console.log('[TRPC_SERVER] Path:', c.req.path);
  const startTime = Date.now();
  await next();
  const elapsed = Date.now() - startTime;
  console.log('[TRPC_SERVER] Response completed in', elapsed, 'ms');
  console.log('[TRPC_SERVER] ========================================');
};

// Primary: match the client URL `${baseUrl}/api/trpc`
app.use(
  "/api/trpc/*",
  logRequest,
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

// Back-compat: some runtimes mount at /trpc
app.use(
  "/trpc/*",
  logRequest,
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/", (c) => {
  console.log('[TRPC_SERVER] Health check hit');
  return c.json({ status: "ok", message: "API is running", timestamp: new Date().toISOString() });
});

export default app;
