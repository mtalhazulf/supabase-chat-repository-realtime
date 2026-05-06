/**
 * Applies RLS, triggers, FKs, and the realtime publication to the Supabase DB.
 * Run after `prisma db push` or `prisma migrate deploy`.
 *
 * Uses DIRECT_URL (preferred — bypasses pgBouncer) or DATABASE_URL.
 *
 *   bun run db:policies
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DIRECT_URL/DATABASE_URL env var.");
  process.exit(1);
}

const sqlPath = resolve(process.cwd(), "supabase/sql/policies.sql");
const sql = await readFile(sqlPath, "utf8");

const client = new Client({ connectionString: url });
await client.connect();
try {
  console.log("Applying policies.sql …");
  await client.query(sql);
  console.log("Done.");
} catch (err) {
  console.error("Failed to apply policies:", err);
  process.exitCode = 1;
} finally {
  await client.end();
}
