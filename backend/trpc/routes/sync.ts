import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";
import { getSyncStore } from "../../syncStore";

const store = getSyncStore();

async function sha256Hex(input: string): Promise<string> {
  // Prefer WebCrypto (Workers / modern Node). Fallback to node:crypto when available.
  try {
    const c: any = (globalThis as any).crypto;
    if (c?.subtle?.digest) {
      const data = new TextEncoder().encode(input);
      const digest = await c.subtle.digest("SHA-256", data);
      const bytes = new Uint8Array(digest);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    // ignore
  }

  try {
    // Node.js runtime
    const nodeCrypto: any = await import('node:crypto');
    return nodeCrypto.createHash('sha256').update(input).digest('hex');
  } catch {
    // As a last resort, use the raw key (still a secret) as identifier.
    return input;
  }
}

const MAX_BACKUP_BYTES = 8 * 1024 * 1024; // 8MB safety cap

export const syncRouter = createTRPCRouter({
  getMeta: publicProcedure
    .input(
      z.object({
        key: z.string().min(8).max(200),
      })
    )
    .query(async ({ input }) => {
      const id = await sha256Hex(input.key);
      return await store.getMeta(id);
    }),

  getBackup: publicProcedure
    .input(
      z.object({
        key: z.string().min(8).max(200),
      })
    )
    .query(async ({ input }) => {
      const id = await sha256Hex(input.key);
      return await store.getBackup(id);
    }),

  putBackup: publicProcedure
    .input(
      z.object({
        key: z.string().min(8).max(200),
        backupJson: z.string().min(2),
      })
    )
    .mutation(async ({ input }) => {
      const id = await sha256Hex(input.key);

      const sizeBytes = new TextEncoder().encode(input.backupJson).byteLength;
      if (sizeBytes > MAX_BACKUP_BYTES) {
        throw new Error(
          `Backup too large (${sizeBytes} bytes). Max allowed is ${MAX_BACKUP_BYTES} bytes.`
        );
      }

      // Validate basic JSON shape so we don't store garbage.
      try {
        const parsed = JSON.parse(input.backupJson);
        if (!parsed || typeof parsed !== "object") throw new Error("Not an object");
        if (!Array.isArray((parsed as any).seasonPasses)) throw new Error("Missing seasonPasses[]");
      } catch (e: any) {
        throw new Error(`Invalid backup JSON: ${e?.message || String(e)}`);
      }

      const serverUpdatedAtISO = new Date().toISOString();

      await store.putBackup({
        id,
        serverUpdatedAtISO,
        backupJson: input.backupJson,
        sizeBytes,
      });

      return { serverUpdatedAtISO };
    }),
});
