import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDb, getDbPath } from "./db/client.js";

const db = createDb();
migrate(db, { migrationsFolder: "./drizzle" });
console.log(`[migrate] OK -> ${getDbPath()}`);
