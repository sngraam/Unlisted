// Prisma CLI configuration. Local-only schema commands work without database credentials.
// Migrations prefer a direct/session-pooled URL; runtime traffic uses DATABASE_URL.
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  ...(process.env.DIRECT_URL || process.env.DATABASE_URL
    ? {
        datasource: {
          url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
        },
      }
    : {}),
});
