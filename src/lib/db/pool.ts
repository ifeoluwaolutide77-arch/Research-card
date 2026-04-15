import { Pool } from "pg";
import { getServerEnv } from "@/lib/env";

let pool: Pool | null = null;

export function getPool(): Pool {
  const { DATABASE_URL } = getServerEnv();
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL, max: 10, idleTimeoutMillis: 30_000 });
  }
  return pool;
}

export function tryGetPool(): Pool | null {
  try {
    return getPool();
  } catch {
    return null;
  }
}

export async function withDb<T>(fn: (pool: Pool) => Promise<T>): Promise<T> {
  return fn(getPool());
}
