import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

/**
 * persistent last-read-page store, keyed by a book's normalized relative path.
 * the only module that touches node:sqlite, so the engine can be swapped behind
 * this interface without changing any caller.
 */
export interface ProgressStore {
  /** last saved page for `key`, or undefined if none. */
  get(key: string): number | undefined;
  /** save (insert or replace) the page for `key`. */
  set(key: string, page: number): void;
  close(): void;
}

/** open (creating if needed) a sqlite-backed progress store at `dbPath`. */
export function openProgressStore(dbPath: string): ProgressStore {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(
    "CREATE TABLE IF NOT EXISTS progress (key TEXT PRIMARY KEY, page INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
  );
  const selectStmt = db.prepare("SELECT page FROM progress WHERE key = ?");
  const upsertStmt = db.prepare(
    "INSERT INTO progress (key, page, updated_at) VALUES (?, ?, ?) " +
      "ON CONFLICT(key) DO UPDATE SET page = excluded.page, updated_at = excluded.updated_at",
  );

  let open = true;
  return {
    get(key) {
      const row = selectStmt.get(key) as { page: number } | undefined;
      return row?.page;
    },
    set(key, page) {
      upsertStmt.run(key, page, Date.now());
    },
    close() {
      // idempotent: close may be called more than once (db.close() throws otherwise).
      if (open) {
        open = false;
        db.close();
      }
    },
  };
}
