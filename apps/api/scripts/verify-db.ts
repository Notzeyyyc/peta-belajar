import Database from "better-sqlite3";
import { getDbPath } from "../src/db/client.js";

const db = new Database(getDbPath(), { readonly: true });
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all() as { name: string }[];
console.log("[verify] DB:", getDbPath());
console.log("[verify] tables:", tables.map((t) => t.name).join(", "));
for (const t of ["users", "resources"] as const) {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number };
  console.log(`[verify] ${t}: ${row.n} rows`);
}
const demo = db.prepare("SELECT id, display_name AS name, role FROM users WHERE id = 'user_demo_juri'").get();
console.log("[verify] demo judge account:", JSON.stringify(demo));
const sample = db.prepare("SELECT id, title, type FROM resources LIMIT 3").all();
console.log("[verify] sample resources:", JSON.stringify(sample, null, 2));
