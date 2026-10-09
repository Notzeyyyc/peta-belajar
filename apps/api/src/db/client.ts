import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "./schema.js";

export function getDbPath(): string {
  const p = process.env.DATABASE_URL ?? "./data/peta-belajar.db";
  return resolve(process.cwd(), p);
}

export function createDb(dbPath = getDbPath()) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export const db = createDb();
export { schema };
