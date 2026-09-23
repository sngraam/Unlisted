// Prisma-to-UI mapping plus atomic product edits. Persist facts, variants and immutable revisions.
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { Product } from "@/types/sku";
import { MarketplaceTemplate, MarketplaceTemplateField } from "@/types/marketplace-template";
import { hasStrictChoices, isManagedTemplateField, templateGaps, templateAnswerIssues } from "@/lib/marketplace-template";
import { auditListing, auditScore } from "@/lib/validation";
import { db } from "./db";
import { HttpError, workspaceAccess } from "./auth";
export const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const object = (v: unknown) =>
  (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
type Access = Awaited<ReturnType<typeof workspaceAccess>>;
export async function readWorkspace(access: Access, productIds?: string[]) {
  const { user, workspace } = access;
  const rows = await db().product.findMany({
    where: { workspaceId: workspace.id, deletedAt: null, ...(productIds ? { id: { in: productIds } } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      marketplaceConfigs: { include: { template: { select: { productType: true } } } },
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
                  payload: true,
                  approvals: { where: { revokedAt: null } },
                  validations: { orderBy: { createdAt: "desc" }, take: 1 },
                },
              },
              generationJobs: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      },
      intake: true,
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
    const categoryConfig = p.marketplaceConfigs.find((config) => config.id === listing?.configId);
    const channels = p.variants.flatMap((variant) => variant.listings);
    const activeJobs = channels.map((channel) => {
      const job = channel.generationJobs[0];
      return job?.baseRevisionId === channel.revisions[0]?.id ? job : undefined;
    }).filter((job) => !!job);
    const fixtureStatus =
      typeof facts.fixtureStatus === "string" ? facts.fixtureStatus : undefined;
    return {
      id: p.id,
      sku: v?.sellerSku || "",
      name: p.name,
      brand: p.brandName,
      category: p.categoryPath || "",
      productType: categoryConfig?.template.productType || listing?.productType || undefined,
      browseNodeId: categoryConfig?.browseNodeId || listing?.browseNodeId || undefined,
      templateId: categoryConfig?.templateId || revision?.payload?.templateId || undefined,
      categoryLocked: !!categoryConfig,
      workbookExample: facts.workbookExample ? {
        sourceFilename: String(object(facts.workbookExample).sourceFilename || ""),
        definitionCount: Number(object(facts.workbookExample).definitionCount || 0),
        skippedCount: Array.isArray(object(facts.workbookExample).skipped) ? (object(facts.workbookExample).skipped as unknown[]).length : 0,
      } : undefined,
      marketplace: listing?.platform === "FLIPKART" ? "Flipkart" : "Amazon",
      status: (fixtureStatus ||
        (channels.length > 0 && channels.every((channel) => channel.publicationStatus === "LIVE")
          ? "Published"
          : activeJobs.some((job) => job.status === "PROCESSING" || job.status === "QUEUED")
            ? "Processing"
            : activeJobs.some((job) => job.status === "FAILED")
              ? "Failed"
          : listing?.status === "REVIEW_PENDING" || listing?.status === "READY"
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
      images: Array.isArray(facts.images)
        ? facts.images.filter((value): value is string => typeof value === "string")
        : undefined,
      intake: p.intake
        ? {
            productIdType: p.intake.productIdType || "",
            materials: p.intake.materials || "",
            dimensions: p.intake.dimensions || "",
            features: Array.isArray(p.intake.featureFacts)
              ? (p.intake.featureFacts as { label: string; value: string }[])
              : [],
            sourceFiles: Array.isArray(p.intake.sourceFiles)
              ? (p.intake.sourceFiles as { name: string; mimeType: string; sizeBytes: number }[])
              : [],
            status: p.intake.status,
            statusMessage: p.intake.statusMessage || undefined,
          }
        : undefined,
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sellerSku,
        color: v.color || "",
        size: v.size || "",
        mrp: Number(v.mrp),
        price: Number(v.sellingPrice),
        stock: v.stock,
        countryOfOrigin: v.countryOfOrigin || "",
        hsnCode: v.hsnCode || "",
        weightKg: v.weightKg === null ? null : Number(v.weightKg),
        channelAttributes: Object.fromEntries(
          Object.entries(object(v.listings[0]?.revisions[0]?.payload?.rawAttributes))
            .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        ),
      })),
      hsn: v?.hsnCode || "",
      origin: v?.countryOfOrigin || "",
      weight: Number(v?.weightKg || 0),
      approved: p.variants.length > 0 && p.variants.every((variant) =>
        variant.listings.length > 0 && variant.listings.every((channel) => !!channel.revisions[0]?.approvals.length)),
    };
  });
  const brand = workspace.brandContext;
  const isWorkspaceOwner = access.user.id === workspace.team.createdById;
  const onboardingComplete = !!brand && (!workspace.onboarding || workspace.onboarding.status === "COMPLETED");
  return {
    products,
    brand: {
      name: brand?.name || "",
      tone: brand?.tone || "Professional & clear",
      glossary: String(object(brand?.glossary).text || ""),
      bannedTerms: brand?.bannedTerms.join(", ") || "",
      painPoints: brand?.painPoints || "",
      revenueRange: brand?.revenueRange || "",
      competitors: brand?.competitors.join(", ") || "",
      targetAgeMin: brand?.targetAgeMin ? String(brand.targetAgeMin) : "",
      targetAgeMax: brand?.targetAgeMax ? String(brand.targetAgeMax) : "",
      targetCountries: brand?.targetCountries.join(", ") || "",
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
      role: access.role,
      isAdmin: ["OWNER", "ADMIN"].includes(access.role),
    },
    onboarding: {
      required: !onboardingComplete && isWorkspaceOwner,
      completed: onboardingComplete,
      step: workspace.onboarding?.currentStep || (brand ? 3 : 1),
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
  if (!workspace.brandContext)
    throw new HttpError(409, "Complete brand onboarding before adding products.");
  const id = create ? randomUUID() : input.id;
  const existing = create
    ? null
    : await tx.product.findFirst({
        where: { id, workspaceId: workspace.id, deletedAt: null },
        include: { variants: true, marketplaceConfigs: true },
      });
  if (!create && !existing) throw new HttpError(404, "Product not found.");
  if (existing && existing.updatedAt.toISOString() !== input.updatedAt)
    throw new HttpError(
      409,
      "This product changed in another tab. Refresh before saving.",
    );
  // Normalize legacy shared defaults once. Revisions must capture the actual per-SKU facts.
  input = { ...input, variants: input.variants.map((variant) => {
    const prior = existing?.variants.find((item) => item.id === variant.id);
    return { ...variant,
      countryOfOrigin: variant.countryOfOrigin ?? prior?.countryOfOrigin ?? input.origin,
      hsnCode: variant.hsnCode ?? prior?.hsnCode ?? input.hsn,
      weightKg: variant.weightKg !== undefined ? variant.weightKg : prior ? (prior.weightKg === null ? null : Number(prior.weightKg)) : input.weight || null,
    };
  }) };
  const template = input.templateId
    ? await tx.marketplaceTemplate.findUnique({ where: { id: input.templateId } })
    : null;
  const platform = input.marketplace === "Amazon" ? "AMAZON" : "FLIPKART";
  if (existing?.marketplaceConfigs.some((config) => config.platform !== platform))
    throw new HttpError(409, "Use the saved marketplace for this product.");
  let categoryConfig = existing?.marketplaceConfigs.find((config) => config.platform === platform && config.marketplaceRegion === "IN");
  if (categoryConfig && (categoryConfig.templateId !== input.templateId || categoryConfig.browseNodeId !== input.browseNodeId))
    throw new HttpError(409, "This product's category and template are locked. Create a new product for a different category.");
  if (create && platform === "AMAZON" && !template)
    throw new HttpError(400, "Choose an imported Amazon category before creating a product.");
  const selectedNode = template && Array.isArray(template.browseNodes)
    ? template.browseNodes.find((node) => object(node).id === input.browseNodeId)
    : null;
  if (input.marketplace === "Amazon" && input.templateId) {
    if (
      !template ||
      template.platform !== "AMAZON" ||
      template.marketplaceId !== "A21TJRUUN4KGV" ||
      template.language !== "en_IN" ||
      template.productType !== input.productType ||
      !selectedNode
    )
      throw new HttpError(400, "Select a valid Amazon product type and browse node.");
    if (!categoryConfig && !template.isActive)
      throw new HttpError(400, "This Amazon template was superseded. Select the current version.");
  } else if (input.templateId || input.productType || input.browseNodeId)
    throw new HttpError(400, "Category metadata requires an Amazon template.");
  const templateFields = (template?.fields || []) as unknown as MarketplaceTemplateField[];
  const allowedFields = new Map(templateFields.map((field) => [field.key, field]));
  for (const variant of input.variants) {
    for (const [key, value] of Object.entries(variant.channelAttributes || {})) {
      const field = allowedFields.get(key);
      if (!field || isManagedTemplateField(field))
        throw new HttpError(400, `Unknown or managed marketplace field: ${key}`);
      if (value.trim() && template && hasStrictChoices(template as unknown as MarketplaceTemplate, field) && !field.allowedValues!.includes(value))
        throw new HttpError(400, `${field.label}: choose a value from the imported Amazon template.`);
    }
    const invalidAnswer = template && templateAnswerIssues(template as unknown as MarketplaceTemplate, variant.channelAttributes || {}).find((issue) => issue.kind === "invalid");
    if (invalidAnswer) throw new HttpError(400, `${variant.sku} — ${invalidAnswer.label}: ${invalidAnswer.message}`);
  }
  const updatedAt = new Date(
    Math.max(Date.now(), (existing?.updatedAt.getTime() || 0) + 1),
  );
  const data = {
    name: input.name,
    brandName: input.brand,
    categoryPath: selectedNode ? String(object(selectedNode).path) : input.category,
    rawInputText: input.rawText,
    canonicalData: json({
      ...Object.fromEntries(Object.entries(object(existing?.canonicalData)).filter(([key]) => !["brand", "fixture", "fixtureStatus", "fixtureScore"].includes(key))),
      image: input.image || "",
      images: input.images || (input.image ? [input.image] : []),
    }),
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
  if (template && !categoryConfig) {
    categoryConfig = await tx.productMarketplaceConfig.create({ data: {
      productId: id, workspaceId: workspace.id, platform, marketplaceRegion: "IN",
      templateId: template.id, browseNodeId: input.browseNodeId!,
    } });
  }
  const keep: string[] = [];
  const checks = auditListing(input, workspace.brandContext.bannedTerms.join(","));
  const gaps = template
    ? templateGaps(input, {
        ...template,
        fields: templateFields,
        browseNodes: template.browseNodes,
      } as unknown as MarketplaceTemplate)
    : null;
  const passed = !checks.some((c) => !c.passed && c.severity === "error") &&
    !gaps?.missing.length && !gaps?.invalid.length;
  const createdRevisions: { listingId: string; revisionId: string }[] = [];
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
      hsnCode: v.hsnCode ?? prior?.hsnCode ?? input.hsn,
      countryOfOrigin: v.countryOfOrigin ?? prior?.countryOfOrigin ?? input.origin,
      weightKg: v.weightKg !== undefined ? v.weightKg : prior ? prior.weightKg : input.weight || null,
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
        configId: categoryConfig?.id,
        productType: template?.productType,
        browseNodeId: template ? input.browseNodeId : null,
        status: "REVIEW_PENDING",
      },
      update: {
        configId: categoryConfig?.id,
        productType: template?.productType,
        browseNodeId: template ? input.browseNodeId : null,
        status: "REVIEW_PENDING",
      },
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
          name: workspace.brandContext.name,
          bannedTerms: workspace.brandContext.bannedTerms,
        }),
      },
    });
    createdRevisions.push({ listingId: listing.id, revisionId: revision.id });
    if (template)
      await tx.marketplacePayload.create({
        data: {
          revisionId: revision.id,
          workspaceId: workspace.id,
          templateId: template.id,
          templateVersion: template.schemaSha256,
          categoryCode: template.productType,
          rawAttributes: json(
            Object.fromEntries(
              Object.entries(v.channelAttributes || {}).filter(([, value]) => value.trim()),
            ),
          ),
        },
      });
    await tx.validationRun.create({
      data: {
        revisionId: revision.id,
        workspaceId: workspace.id,
        status: passed ? "PASSED" : "FAILED",
        rulesetVersion: "local-review-v1-not-marketplace-compliance",
        score: auditScore(checks),
        errors: json([
          ...checks.filter((c) => !c.passed && c.severity === "error"),
          ...(gaps?.missing || []).map((gap) => ({ ...gap, reason: "template_required_missing" })),
          ...(gaps?.invalid || []).map((gap) => ({ ...gap, reason: "template_value_invalid" })),
        ]),
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
  if (create && input.intake) {
    await tx.productIntake.create({
      data: {
        productId: id,
        workspaceId: workspace.id,
        marketplace: platform,
        productIdType: input.intake.productIdType,
        materials: input.intake.materials,
        dimensions: input.intake.dimensions,
        featureFacts: json(input.intake.features),
        rawProductInfo: input.rawText,
        sourceFiles: json(input.intake.sourceFiles),
        imageManifest: json((input.images || (input.image ? [input.image] : [])).map((image, position) => ({ position, supplied: !!image }))),
        status: "QUEUED",
        statusMessage: "Waiting for the listing agents to process this product.",
      },
    });
    for (const revision of createdRevisions) {
      await tx.generationJob.create({
        data: {
          listingId: revision.listingId,
          workspaceId: workspace.id,
          requestedById: user.id,
          idempotencyKey: `${id}:${revision.listingId}:${updatedAt.getTime()}`,
          baseRevisionId: revision.revisionId,
          templateId: template?.id,
          status: "QUEUED",
          inputSnapshot: json({ productId: id, intake: input.intake, marketplace: input.marketplace }),
        },
      });
    }
  }
  return id;
}
