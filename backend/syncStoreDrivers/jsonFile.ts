import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StoredBackup, SyncMeta, SyncStore } from "../syncStore";

declare global {
  // eslint-disable-next-line no-var
  var __spmSyncStore: Map<string, StoredBackup> | undefined;
}

function getStoreFilePath(): string {
  const custom = process.env.SPM_SYNC_STORE_PATH;
  if (custom && custom.trim()) return custom.trim();
  return path.join(process.cwd(), "dev", "sync-store.json");
}

function getMemoryStore(): Map<string, StoredBackup> {
  if (!globalThis.__spmSyncStore) {
    globalThis.__spmSyncStore = new Map<string, StoredBackup>();

    // Best-effort load from disk so sync survives server restarts.
    void (async () => {
      try {
        const storeFile = getStoreFilePath();
        const raw = await readFile(storeFile, "utf8");
        const parsed = JSON.parse(raw) as Record<string, StoredBackup>;
        if (parsed && typeof parsed === "object") {
          for (const [k, v] of Object.entries(parsed)) {
            if (!v || typeof v !== "object") continue;
            if (typeof v.serverUpdatedAtISO !== "string") continue;
            if (typeof v.backupJson !== "string") continue;
            if (typeof v.sizeBytes !== "number") continue;
            globalThis.__spmSyncStore!.set(k, v);
          }
        }
      } catch {
        // ignore (file may not exist on first run)
      }
    })();
  }
  return globalThis.__spmSyncStore;
}

let persistPromise: Promise<void> | null = null;
function persistStore(store: Map<string, StoredBackup>): Promise<void> {
  // Serialize persist operations to avoid concurrent writes.
  if (persistPromise) {
    persistPromise = persistPromise.then(() => persistStore(store));
    return persistPromise;
  }

  persistPromise = (async () => {
    try {
      const storeFile = getStoreFilePath();
      await mkdir(path.dirname(storeFile), { recursive: true });

      const obj: Record<string, StoredBackup> = {};
      for (const [k, v] of store.entries()) obj[k] = v;

      const tmp = `${storeFile}.tmp`;
      await writeFile(tmp, JSON.stringify(obj), "utf8");
      await writeFile(storeFile, JSON.stringify(obj), "utf8");
    } finally {
      persistPromise = null;
    }
  })();

  return persistPromise;
}

export function createJsonFileSyncStore(): SyncStore {
  const store = getMemoryStore();

  return {
    async getMeta(id: string): Promise<SyncMeta> {
      const existing = store.get(id);
      if (!existing) return { exists: false };
      return {
        exists: true,
        serverUpdatedAtISO: existing.serverUpdatedAtISO,
        sizeBytes: existing.sizeBytes,
      };
    },

    async getBackup(id: string) {
      const existing = store.get(id);
      if (!existing) return null;
      return {
        serverUpdatedAtISO: existing.serverUpdatedAtISO,
        backupJson: existing.backupJson,
      };
    },

    async putBackup(params) {
      store.set(params.id, {
        serverUpdatedAtISO: params.serverUpdatedAtISO,
        backupJson: params.backupJson,
        sizeBytes: params.sizeBytes,
      });

      await persistStore(store);
    },
  };
}
