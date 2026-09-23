// Export the local seed workspace for inspection. Password hashes, sessions and credentials are excluded.
import { config } from "../frontend/node_modules/dotenv/lib/main.js";
import { PrismaClient } from "../frontend/generated/prisma/client";
import { PrismaPg } from "../frontend/node_modules/@prisma/adapter-pg";
import { writeFileSync } from "node:fs";
config({ path: ".env.local" });
const url = new URL(process.env.DATABASE_URL || "");
if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "5433" ||
  url.pathname !== "/listing_agent_local"
)
  throw new Error("Export is restricted to the local development database.");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.toString() }),
});
async function main() {
  const workspaceId = "33b5a3f5-0213-4ff5-a3b6-50eb5574fb32";
  // Snapshot the active sample catalog only. Archived legacy fixtures remain in
  // PostgreSQL for history, but should not appear as current demo products.
  const activeProduct = { deletedAt: null };
  const activeVariant = { deletedAt: null, product: activeProduct };
  const activeListing = { variant: activeVariant };
  const activeRevision = { listing: activeListing };
  const snapshot = await prisma.$transaction(
    async (tx) => ({
      exportedAt: new Date().toISOString(),
      description:
        "Local synthetic workspace snapshot; not a database backup. Secrets excluded.",
      workspace: await tx.workspace.findUnique({ where: { id: workspaceId } }),
      users: await tx.user.findMany({
        where: {
          memberships: {
            some: { team: { workspaces: { some: { id: workspaceId } } } },
          },
        },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          accountType: true,
        },
      }),
      teams: await tx.team.findMany({
        where: { workspaces: { some: { id: workspaceId } } },
        include: { memberships: true, folders: true },
      }),
      brand: await tx.brandContext.findUnique({ where: { workspaceId } }),
      products: await tx.product.findMany({ where: { workspaceId, ...activeProduct } }),
      variants: await tx.productVariant.findMany({ where: { workspaceId, ...activeVariant } }),
      categoryConfigs: await tx.productMarketplaceConfig.findMany({ where: { workspaceId, product: activeProduct } }),
      listings: await tx.marketplaceListing.findMany({
        where: { workspaceId, ...activeListing },
      }),
      revisions: await tx.listingRevision.findMany({ where: { workspaceId, ...activeRevision } }),
      marketplacePayloads: await tx.marketplacePayload.findMany({
        where: { workspaceId, revision: activeRevision },
      }),
      validationRuns: await tx.validationRun.findMany({
        where: { workspaceId, revision: activeRevision },
      }),
      approvals: await tx.listingApproval.findMany({
        where: { workspaceId, revision: activeRevision },
      }),
    }),
    { isolationLevel: "RepeatableRead" },
  );
  writeFileSync(
    "../test/database-snapshot.json",
    JSON.stringify(snapshot, null, 2) + "\n",
  );
  console.log(
    `Exported ${snapshot.products.length} products and ${snapshot.variants.length} variants to test/database-snapshot.json; no secrets included.`,
  );
}
main().finally(() => prisma.$disconnect());
