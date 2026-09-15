// Node-only Prisma singleton. Never import this module from client components.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { listingDb?: PrismaClient };
export function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not configured.");
  const configuredPoolSize = Number.parseInt(
    process.env.DATABASE_POOL_MAX || "1",
    10,
  );
  const poolSize =
    Number.isFinite(configuredPoolSize) &&
    configuredPoolSize >= 1 &&
    configuredPoolSize <= 10
      ? configuredPoolSize
      : 1;
  if (!globalDb.listingDb)
    globalDb.listingDb = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        // Vercel scales horizontally; keep each instance's client-side pool small.
        max: poolSize,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 10_000,
      }),
    });
  return globalDb.listingDb;
}
