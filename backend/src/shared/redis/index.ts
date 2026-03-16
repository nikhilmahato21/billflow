import { Redis } from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

function parseRedisUrl(url: string): { host: string; port: number } {
  try {
    const parsed = new URL(url);
    return { host: parsed.hostname || "localhost", port: parseInt(parsed.port || "6379") };
  } catch {
    return { host: "localhost", port: 6379 };
  }
}

const { host, port } = parseRedisUrl(redisUrl);

// BullMQ expects a plain connection config, not an ioredis instance
// Using the same major ioredis version as BullMQ bundles avoids type conflicts
export const bullMQConnection = { connection: { host, port } };
