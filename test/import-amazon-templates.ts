// Admin-only importer: extract exact XLSM headers, then merge immutable template
// versions into PostgreSQL. No workbook macro or Amazon internal API is executed.
import { spawnSync } from "node:child_process";
import { readdir, mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../frontend/node_modules/dotenv/lib/main.js";
import { PrismaClient, Prisma } from "../frontend/generated/prisma/client";
import { PrismaPg } from "../frontend/node_modules/@prisma/adapter-pg";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const inbox = join(projectRoot, "test/amazon-templates/inbox");
const catalog = join(projectRoot, "test/amazon-templates/catalog");
const parser = join(projectRoot, "backend/modules/data_bridge/amazon_template.py");
config({ path: join(projectRoot, "frontend/.env.local") });

type Extracted = {
  parserVersion: number;
  platform: "AMAZON";
  marketplaceId: string;
  productType: string;
  language: string;
  sourceFilename: string;
  sourceSha256: string;
  schemaSha256: string;
  fieldCount: number;
  fields: Array<Record<string, unknown>>;
  sourceMetadata: Record<string, unknown>;
  definitionCount: number;
  browseNodes: Array<Record<string, string>>;
  requirementCounts: Record<string, number>;
  warnings: string[];
};

function extract(file: string): Extracted {
  const result = spawnSync(process.env.PYTHON || "python3", [parser, file], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`${basename(file)}: ${result.stderr || result.error}`);
  const value = JSON.parse(result.stdout) as Extracted;
  if (value.platform !== "AMAZON" || !value.productType || value.fieldCount !== value.fields.length)
    throw new Error(`${basename(file)}: invalid extracted catalog`);
  return value;
}

async function main() {
  const extractOnly = process.argv.includes("--extract-only");
  const paths = process.argv.slice(2).filter((arg) => arg !== "--extract-only");
  const files = paths.length
    ? paths.map((path) => resolve(path))
    : (await readdir(inbox)).filter((name) => name.toLowerCase().endsWith(".xlsm")).map((name) => join(inbox, name));
  if (!files.length) throw new Error(`No XLSM files found in ${inbox}`);
  const extracted = files.map(extract);
  const byScope = new Map<string, Extracted>();
  for (const item of extracted) {
    const scope = [item.platform, item.marketplaceId, item.productType, item.language].join("/");
    const earlier = byScope.get(scope);
    if (earlier && earlier.schemaSha256 !== item.schemaSha256)
      throw new Error(`Two different ${scope} templates in one batch; import a known latest version separately`);
    byScope.set(scope, item);
  }
  await mkdir(catalog, { recursive: true });
  // Keep every pinned source version even when a newer inbox file replaces it.
  const sourceStore = process.env.AMAZON_TEMPLATE_DIR || join(projectRoot, "frontend/private/amazon-templates");
  await mkdir(sourceStore, { recursive: true });
  for (let i = 0; i < files.length; i++) {
    const bytes = await readFile(files[i]);
    if (createHash("sha256").update(bytes).digest("hex") !== extracted[i].sourceSha256)
      throw new Error("Template changed during import. Retry with a stable source file.");
    const destination = join(sourceStore, `${extracted[i].sourceSha256}.xlsm`);
    try { await writeFile(destination, bytes, { flag: "wx", mode: 0o600 }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (createHash("sha256").update(await readFile(destination)).digest("hex") !== extracted[i].sourceSha256)
        throw new Error("Archived template checksum mismatch.");
    }
  }
  for (const item of extracted) {
    const output = join(catalog, `${item.productType}.${item.schemaSha256.slice(0, 12)}.json`);
    await writeFile(output, JSON.stringify(item, null, 2) + "\n");
    console.log(`${item.productType}: ${item.definitionCount} definitions, ${item.fieldCount} export columns → ${output}`);
    for (const warning of item.warnings) console.warn(`  Warning: ${warning}`);
  }
  if (extractOnly) return;
  const connection = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connection) throw new Error("DIRECT_URL or DATABASE_URL is required for database import");
  console.log(`Import target: ${new URL(connection).hostname} (marketplace_templates)`);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: connection, max: 1 }) });
  try {
    for (const item of byScope.values()) {
      const scope = {
        platform: item.platform,
        marketplaceId: item.marketplaceId,
        productType: item.productType,
        language: item.language,
      } as const;
      const result = await prisma.$transaction(async (tx) => {
        // Serializes two admin imports of the same product type without locking others.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${Object.values(scope).join("/")}, 0))::text`;
        const same = await tx.marketplaceTemplate.findUnique({
          where: { platform_marketplaceId_productType_language_schemaSha256: { ...scope, schemaSha256: item.schemaSha256 } },
        });
        if (same) {
          if (!same.sourceMetadata && same.sourceSha256 === item.sourceSha256) {
            await tx.marketplaceTemplate.update({ where: { id: same.id }, data: { sourceMetadata: item.sourceMetadata as Prisma.InputJsonValue } });
            return "source-metadata-added";
          }
          return same.isActive ? "unchanged" : "older-version-skipped";
        }
        await tx.marketplaceTemplate.updateMany({ where: { ...scope, isActive: true }, data: { isActive: false } });
        await tx.marketplaceTemplate.create({
          data: {
            ...scope,
            sourceFilename: item.sourceFilename,
            sourceSha256: item.sourceSha256,
            schemaSha256: item.schemaSha256,
            parserVersion: item.parserVersion,
            fieldCount: item.fieldCount,
            fields: item.fields as Prisma.InputJsonValue,
            browseNodes: item.browseNodes as Prisma.InputJsonValue,
            sourceMetadata: item.sourceMetadata as Prisma.InputJsonValue,
          },
        });
        return "activated";
      });
      console.log(`${item.productType}: ${result}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
