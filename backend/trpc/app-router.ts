import { createTRPCRouter } from "./create-context";
import { espnRouter } from "./routes/espn";
import { ticketmasterRouter } from "./routes/ticketmaster";
import { syncRouter } from "./routes/sync";

export const appRouter = createTRPCRouter({
  espn: espnRouter,
  ticketmaster: ticketmasterRouter,
  sync: syncRouter,
});

export type AppRouter = typeof appRouter;
