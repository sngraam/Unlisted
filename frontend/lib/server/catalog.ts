// Prisma-to-UI mapping plus atomic product edits. Persist facts, variants and immutable revisions.
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { Product } from "@/types/sku";
import { auditListing, auditScore } from "@/lib/validation";
import { db } from "./db";
import { HttpError, workspaceAccess } from "./auth";
export const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const object = (v: unknown) =>
  (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
type Access = Awaited<ReturnType<typeof workspaceAccess>>;
export async function readWorkspace(access: Access) {
  const { user, workspace } = access;
  const rows = await db().product.findMany({
    where: { workspaceId: workspace.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          listings: {
            include: {
              revisions: {
                orderBy: { number: "desc" },
                take: 1,
                include: {
                  approvals: { where: { revokedAt: null } },
                  validations: { orderBy: { createdAt: "desc" }, take: 1 },
                },
              },
              generationJobs: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });
  const products: Product[] = rows.map((p) => {
    p.variants.sort(
      (a, b) =>
        Number(object(a.attributes).position || 0) -
        Number(object(b.attributes).position || 0),
    );
    const facts = object(p.canonicalData),
      v = p.variants[0],
      listing = v?.listings[0],
      revision = listing?.revisions[0];
    const fixtureStatus =
      typeof facts.fixtureStatus === "string" ? facts.fixtureStatus : undefined;
    return {
      id: p.id,
      sku: v?.sellerSku || "",
      name: p.name,
      brand: String(facts.brand || workspace.brandContext!.name),
      category: p.categoryPath || "",
      marketplace: listing?.platform === "FLIPKART" ? "Flipkart" : "Amazon",
      status: (fixtureStatus ||
        (listing?.publicationStatus === "LIVE"
          ? "Published"
          : listing?.status === "READY"
            ? "Ready"
            : "Draft")) as Product["status"],
      score: revision?.validations[0]?.score ?? Number(facts.fixtureScore || 0),
      updatedAt: p.updatedAt.toISOString(),
      title: revision?.title || p.name,
      description: revision?.description || "",
      bullets: revision?.bulletPoints || [],
      keywords: revision?.searchKeywords.join(", ") || "",
      rawText: p.rawInputText || "",
      image: typeof facts.image === "string" ? facts.image : "",
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sellerSku,
        color: v.color || "",
        size: v.size || "",
        mrp: Number(v.mrp),
        price: Number(v.sellingPrice),
        stock: v.stock,
      })),
      hsn: v?.hsnCode || "",
      origin: v?.countryOfOrigin || "",
      weight: Number(v?.weightKg || 0),
      approved: !!revision?.approvals.length,
    };
  });
  const brand = workspace.brandContext!;
  return {
    products,
    brand: {
      name: brand.name,
      tone: brand.tone,
      glossary: String(object(brand.glossary).text || ""),
      bannedTerms: brand.bannedTerms.join(", "),
      painPoints: brand.painPoints || "",
    },
    profile: {
      name: user.displayName,
      email: user.email,
      type:
        user.accountType === "AGENCY"
          ? "Agency"
          : user.accountType === "FREELANCE"
            ? "Freelance"
            : "Individual",
      workspace: workspace.name,
      team: workspace.team.name,
    },
    connections: (
      await db().marketplaceConnection.findMany({
        where: { workspaceId: workspace.id, status: "CONNECTED" },
      })
    ).map((c) => (c.platform === "AMAZON" ? "Amazon" : "Flipkart")),
  };
}
export async function saveProduct(
  tx: Prisma.TransactionClient,
  access: Access,
  input: Product,
  create: boolean,
) {
  const { workspace, user } = access;
  const id = create ? randomUUID() : input.id;
  const existing = create
    ? null
    : await tx.product.findFirst({
        where: { id, workspaceId: workspace.id, deletedAt: null },
        include: { variants: true },
      });
  if (!create && !existing) throw new HttpError(404, "Product not found.");
  if (existing && existing.updatedAt.toISOString() !== input.updatedAt)
    throw new HttpError(
      409,
      "This product changed in another tab. Refresh before saving.",
    );
  const updatedAt = new Date(
    Math.max(Date.now(), (existing?.updatedAt.getTime() || 0) + 1),
  );
  const data = {
    name: input.name,
    categoryPath: input.category,
    rawInputText: input.rawText,
    canonicalData: json({ brand: input.brand, image: input.image || "" }),
    updatedAt,
  };
  if (create)
    await tx.product.create({
      data: {
        ...data,
        id,
        workspaceId: workspace.id,
        brandContextId: workspace.brandContext!.id,
      },
    });
  else {
    const result = await tx.product.updateMany({
      where: { id, workspaceId: workspace.id, updatedAt: existing!.updatedAt },
      data,
    });
    if (result.count !== 1)
      throw new HttpError(409, "Product changed. Refresh before saving.");
  }
  const keep: string[] = [];
  const checks = auditListing(
    input,
    workspace.brandContext!.bannedTerms.join(","),
  );
  const passed = !checks.some((c) => !c.passed && c.severity === "error");
  for (const [position, v] of Array.from(input.variants.entries())) {
    const prior = existing?.variants.find((old) => old.id === v.id);
    const variantId = prior?.id || randomUUID();
    keep.push(variantId);
    const variantData = {
      attributes: { position },
      sellerSku: v.sku,
      color: v.color,
      size: v.size,
      mrp: v.mrp,
      sellingPrice: v.price,
      stock: v.stock,
      hsnCode: input.hsn,
      countryOfOrigin: input.origin,
      weightKg: input.weight,
      deletedAt: null,
    };
    if (prior)
      await tx.productVariant.update({
        where: { id: variantId },
        data: variantData,
      });
    else
      await tx.productVariant.create({
        data: {
          ...variantData,
          id: variantId,
          productId: id,
          workspaceId: workspace.id,
        },
      });
    const platform = input.marketplace === "Amazon" ? "AMAZON" : "FLIPKART";
    // This UI supports one channel per product; changing it requires a future explicit channel workflow.
    const previous = await tx.marketplaceListing.findFirst({
      where: { variantId },
    });
    if (previous && previous.platform !== platform)
      throw new HttpError(
        400,
        "Changing an existing listing's marketplace is not supported yet.",
      );
    const listing = await tx.marketplaceListing.upsert({
      where: {
        variantId_platform_marketplaceRegion: {
          variantId,
          platform,
          marketplaceRegion: "IN",
        },
      },
      create: {
        variantId,
        workspaceId: workspace.id,
        platform,
        status: passed ? "READY" : "DRAFT",
      },
      update: { status: passed ? "READY" : "DRAFT" },
    });
    const latest = await tx.listingRevision.findFirst({
      where: { listingId: listing.id },
      orderBy: { number: "desc" },
    });
    await tx.listingApproval.updateMany({
      where: {
        workspaceId: workspace.id,
        revokedAt: null,
        revision: { listingId: listing.id },
      },
      data: { revokedAt: new Date(), revocationReason: "Listing edited" },
    });
    const revision = await tx.listingRevision.create({
      data: {
        listingId: listing.id,
        workspaceId: workspace.id,
        number: (latest?.number || 0) + 1,
        createdById: user.id,
        title: input.title,
        description: input.description,
        bulletPoints: input.bullets,
        searchKeywords: input.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        merchantSnapshot: json({ ...input, variants: [v], approved: false }),
        brandContextSnapshot: json({
          name: workspace.brandContext!.name,
          bannedTerms: workspace.brandContext!.bannedTerms,
        }),
      },
    });
    await tx.validationRun.create({
      data: {
        revisionId: revision.id,
        workspaceId: workspace.id,
        status: passed ? "PASSED" : "FAILED",
        rulesetVersion: "local-review-v1-not-marketplace-compliance",
        score: auditScore(checks),
        errors: json(checks.filter((c) => !c.passed && c.severity === "error")),
        warnings: json(
          checks.filter((c) => !c.passed && c.severity === "warning"),
        ),
        completedAt: new Date(),
      },
    });
  }
  await tx.productVariant.updateMany({
    where: { productId: id, workspaceId: workspace.id, id: { notIn: keep } },
    data: { deletedAt: new Date() },
  });
  return id;
}
