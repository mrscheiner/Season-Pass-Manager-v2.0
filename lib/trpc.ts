import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";
import { resolveApiBaseUrl } from "@/lib/apiBaseUrl";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const resolved = resolveApiBaseUrl();
  if (!resolved.baseUrl) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[trpc] API base URL is missing; cloud sync/schedule calls will fail.");
      return "http://localhost:8787";
    }
    throw new Error("Missing API base URL");
  }

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[trpc] Using API base (${resolved.source}):`, resolved.baseUrl);
  }

  return resolved.baseUrl;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
