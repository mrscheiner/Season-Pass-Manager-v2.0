import path from "node:path";

import type { SyncMeta, SyncStore } from "../syncStore";

type SqliteDatabase = any;

function getDbPath(): string {
  const custom = process.env.SPM_SYNC_SQLITE_PATH;
  if (custom && custom.trim()) return custom.trim();

  // Default to a repo-local file for dev. In production, point this to a persistent volume.
  return path.join(process.cwd(), "dev", "sync-store.sqlite");
}

function openDb(dbPath: string): SqliteDatabase {
  // Bun provides bun:sqlite. This backend is already Bun-based.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Database } = require("bun:sqlite");
  return new Database(dbPath);
}

export function createSqliteSyncStore(): SyncStore {
  const dbPath = getDbPath();
  const db = openDb(dbPath);

  db.run(
    "CREATE TABLE IF NOT EXISTS spm_backups (id TEXT PRIMARY KEY, serverUpdatedAtISO TEXT NOT NULL, sizeBytes INTEGER NOT NULL, backupJson TEXT NOT NULL)"
  );

  const stmtGetMeta = db.prepare(
    "SELECT serverUpdatedAtISO, sizeBytes FROM spm_backups WHERE id = ? LIMIT 1"
  );
  const stmtGetBackup = db.prepare(
    "SELECT serverUpdatedAtISO, backupJson FROM spm_backups WHERE id = ? LIMIT 1"
  );
  const stmtUpsert = db.prepare(
    "INSERT INTO spm_backups (id, serverUpdatedAtISO, sizeBytes, backupJson) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET serverUpdatedAtISO=excluded.serverUpdatedAtISO, sizeBytes=excluded.sizeBytes, backupJson=excluded.backupJson"
  );

  return {
    async getMeta(id: string): Promise<SyncMeta> {
      const row = stmtGetMeta.get(id) as { serverUpdatedAtISO: string; sizeBytes: number } | undefined;
      if (!row) return { exists: false };
      return { exists: true, serverUpdatedAtISO: row.serverUpdatedAtISO, sizeBytes: row.sizeBytes };
    },

    async getBackup(id: string) {
      const row = stmtGetBackup.get(id) as
        | { serverUpdatedAtISO: string; backupJson: string }
        | undefined;
      if (!row) return null;
      return { serverUpdatedAtISO: row.serverUpdatedAtISO, backupJson: row.backupJson };
    },

    async putBackup(params) {
      stmtUpsert.run(params.id, params.serverUpdatedAtISO, params.sizeBytes, params.backupJson);
    },
  };
}
