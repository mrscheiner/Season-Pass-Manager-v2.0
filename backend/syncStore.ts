export type StoredBackup = {
  serverUpdatedAtISO: string;
  backupJson: string;
  sizeBytes: number;
};

export type SyncMeta =
  | { exists: false }
  | { exists: true; serverUpdatedAtISO: string; sizeBytes: number };

export interface SyncStore {
  getMeta(id: string): Promise<SyncMeta>;
  getBackup(id: string): Promise<{ serverUpdatedAtISO: string; backupJson: string } | null>;
  putBackup(params: {
    id: string;
    backupJson: string;
    sizeBytes: number;
    serverUpdatedAtISO: string;
  }): Promise<void>;
}

export type SyncStoreDriver = "json" | "sqlite";

let cachedStore: SyncStore | undefined;

export function getSyncStore(): SyncStore {
  if (cachedStore) return cachedStore;

  const driver = ((process.env.SPM_SYNC_STORE_DRIVER || "json").trim() || "json") as SyncStoreDriver;

  if (driver === "sqlite") {
    // Lazy import so local dev doesn't need SQLite unless requested.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createSqliteSyncStore } = require("./syncStoreDrivers/sqlite");
    const store: SyncStore = createSqliteSyncStore();
    cachedStore = store;
    return store;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createJsonFileSyncStore } = require("./syncStoreDrivers/jsonFile");
  const store: SyncStore = createJsonFileSyncStore();
  cachedStore = store;
  return store;
}
