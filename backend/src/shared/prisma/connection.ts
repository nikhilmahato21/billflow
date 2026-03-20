import { Pool } from "pg";

import { env } from "../config/env";

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function normalizeDatabaseUrl(connectionString: string) {
  let parsed: URL;

  try {
    parsed = new URL(connectionString);
  } catch {
    return connectionString;
  }

  const sslMode = parsed.searchParams.get("sslmode");
  if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode) && !isLocalHostname(parsed.hostname)) {
    parsed.searchParams.set("sslmode", "verify-full");
  }

  return parsed.toString();
}

export const normalizedDatabaseUrl = normalizeDatabaseUrl(env.DATABASE_URL);

export const pgPool = new Pool({
  connectionString: normalizedDatabaseUrl,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: env.DATABASE_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DATABASE_POOL_CONNECTION_TIMEOUT_MS,
});

pgPool.on("error", (error) => {
  console.error("[db] Unexpected Postgres pool error:", error);
});
