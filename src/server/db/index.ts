import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Supabase's transaction pooler (port 6543) does not support prepared statements.
  const client = postgres(url, { prepare: false, max: 5 });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

// Reuse one client across hot reloads in development and warm serverless invocations.
const globalForDb = globalThis as unknown as { yaadashtDb?: Db };

export function getDb(): Db {
  globalForDb.yaadashtDb ??= createDb();
  return globalForDb.yaadashtDb;
}
