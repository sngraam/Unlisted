// Run from frontend: npm run db:seed. Add missing fixtures and reset only the local demo login.
import { config } from "../frontend/node_modules/dotenv/lib/main.js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { PrismaClient } from "../frontend/generated/prisma/client";
import { PrismaPg } from "../frontend/node_modules/@prisma/adapter-pg";
import { hashPassword } from "../frontend/lib/server/password";
import { seedDataSchema } from "./seed-contract";
const root = resolve(process.cwd(), "..");
config({ path: resolve(root, "frontend/.env.local") });
const url = new URL(process.env.DATABASE_URL || "");
if (
  url.hostname !== "127.0.0.1" ||
  url.port !== "5433" ||
  url.pathname !== "/listing_agent_local"
)
  throw new Error(
    "Seed is restricted to this project's local development database.",
  );
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url.toString() }),
});
const seed = seedDataSchema.parse(
  JSON.parse(readFileSync(resolve(root, "test/seed-data.json"), "utf8")),
);
function id(key: string) {
  const h = createHash("sha256")
    .update("listing-agent-local:" + key)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
async function main() {
  const password = "sngram";
  const userId = id("user"),
    teamId = id("team"),
    workspaceId = id("workspace"),
    brandId = id("brand");
  const existed = await prisma.user.findUnique({
    where: { email: seed.profile.email },
  });
  if (existed && existed.id !== userId)
    throw new Error(
      "Seed email already belongs to another account; no data changed.",
    );
  const usernameOwner = await prisma.user.findUnique({
    where: { username: seed.profile.username },
  });
  if (usernameOwner && usernameOwner.id !== userId)
    throw new Error(
      "Seed username already belongs to another account; no data changed.",
    );
  const passwordHash = await hashPassword(password);
  await prisma.$transaction(
    async (tx) => {
      await tx.user.upsert({
        where: { id: userId },
        update: {
          username: seed.profile.username,
          displayName: seed.profile.name,
          passwordHash,
        },
        create: {
          id: userId,
          username: seed.profile.username,
          email: seed.profile.email,
          displayName: seed.profile.name,
          accountType: "AGENCY",
          passwordHash,
        },
      });
      await tx.team.upsert({
        where: { id: teamId },
        update: {},
        create: { id: teamId, name: seed.profile.team, createdById: userId },
      });
      await tx.teamMembership.upsert({
        where: { teamId_userId: { teamId, userId } },
        update: {},
        create: { teamId, userId, role: "OWNER" },
      });
      await tx.folder.upsert({
        where: { id: id("folder") },
        update: {},
        create: { id: id("folder"), teamId, name: "Local catalog" },
      });
      await tx.workspace.upsert({
        where: { id: workspaceId },
        update: {},
        create: {
          id: workspaceId,
          teamId,
          folderId: id("folder"),
          name: seed.profile.workspace,
        },
      });
      await tx.brandContext.upsert({
        where: { id: brandId },
        update: {},
        create: {
          id: brandId,
          workspaceId,
          name: seed.brand.name,
          tone: seed.brand.tone,
          glossary: { text: seed.brand.glossary },
          bannedTerms: seed.brand.bannedTerms
            .split(",")
            .map((s: string) => s.trim()),
          painPoints: seed.brand.painPoints,
        },
      });
      for (const p of seed.products) {
        const productId = id("product:" + p.id);
        if (await tx.product.findUnique({ where: { id: productId } })) continue;
        await tx.product.create({
          data: {
            id: productId,
            workspaceId,
            brandContextId: brandId,
            name: p.name,
            categoryPath: p.category,
            rawInputText: p.rawText,
            canonicalData: {
              brand: p.brand,
              image: p.image || "",
              fixture: true,
              fixtureStatus: p.status,
              fixtureScore: p.score,
            },
            createdAt: new Date(p.updatedAt),
            updatedAt: new Date(p.updatedAt),
          },
        });
        for (const v of p.variants) {
          const variantId = id("variant:" + p.id + ":" + v.id),
            listingId = id("listing:" + variantId),
            revisionId = id("revision:" + listingId);
          await tx.productVariant.create({
            data: {
              id: variantId,
              productId,
              workspaceId,
              sellerSku: v.sku,
              color: v.color,
              size: v.size,
              mrp: v.mrp,
              sellingPrice: v.price,
              stock: v.stock,
              hsnCode: p.hsn,
              countryOfOrigin: p.origin,
              weightKg: p.weight,
            },
          });
          // Sample Published/Processing/Failed badges stay explicitly in fixture metadata. No fake live publication or jobs.
          await tx.marketplaceListing.create({
            data: {
              id: listingId,
              variantId,
              workspaceId,
              platform: p.marketplace === "Amazon" ? "AMAZON" : "FLIPKART",
              status: "DRAFT",
            },
          });
          await tx.listingRevision.create({
            data: {
              id: revisionId,
              listingId,
              workspaceId,
              number: 1,
              createdById: userId,
              title: p.title,
              description: p.description,
              bulletPoints: p.bullets,
              searchKeywords: p.keywords
                .split(",")
                .map((s: string) => s.trim()),
              merchantSnapshot: p,
              brandContextSnapshot: seed.brand,
              generationMetadata: {
                source: "synthetic-local-seed",
                generatedByAI: false,
              },
            },
          });
        }
      }
    },
    { timeout: 60000 },
  );
  const location = resolve(root, "test/local-login.txt");
  writeFileSync(
    location,
    `Local development only\nURL: http://localhost:3000/login\nLogin ID: ${seed.profile.username}\nPassword: ${password}\nEmail: ${seed.profile.email}\nUser ID: ${userId}\nWorkspace ID: ${workspaceId}\n`,
    { mode: 0o600 },
  );
  console.log(
    `Seed ready: 1 account, 1 team, 1 workspace, ${seed.products.length} sample products. Demo login reset to ${seed.profile.username}. Existing product edits preserved. Login details: test/local-login.txt`,
  );
}
main().finally(() => prisma.$disconnect());
