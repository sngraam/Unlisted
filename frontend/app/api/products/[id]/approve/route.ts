// Human review records approval of the current immutable revision after server-side checks.
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { workspaceAccess, requireOrigin, HttpError } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { readWorkspace, json } from "@/lib/server/catalog";
import { auditListing, auditScore } from "@/lib/validation";
import { templateGaps } from "@/lib/marketplace-template";
import type { MarketplaceTemplate } from "@/types/marketplace-template";
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    requireOrigin(request);
    const access = await workspaceAccess();
    if (!["OWNER", "ADMIN", "REVIEWER", "PUBLISHER"].includes(access.role))
      throw new HttpError(403, "A reviewer must approve this listing.");
    const id = z.uuid().parse(params.id);
    const input = z
      .object({ updatedAt: z.iso.datetime() })
      .parse(await readJson(request));
    const product = (await readWorkspace(access, [id])).products.find(
      (p) => p.id === id,
    );
    if (!product) throw new HttpError(404, "Product not found.");
    if (product.updatedAt !== input.updatedAt)
      throw new HttpError(
        409,
        "The listing changed. Refresh and review again.",
      );
    const checks = auditListing(
      product,
      access.workspace.brandContext!.bannedTerms.join(","),
    );
    if (checks.some((c) => !c.passed && c.severity === "error"))
      throw new HttpError(400, "Resolve the review errors before approval.");
    if (product.marketplace === "Amazon" && !product.templateId)
      throw new HttpError(400, "Select and save an Amazon category before approval.");
    if (product.marketplace === "Amazon" && product.templateId) {
      const definition = await db().marketplaceTemplate.findUnique({ where: { id: product.templateId } });
      if (!definition) throw new HttpError(409, "The saved Amazon template is unavailable.");
      const gaps = templateGaps(product, definition as unknown as MarketplaceTemplate);
      if (gaps.missing.length || gaps.invalid.length)
        throw new HttpError(400, [...gaps.missing, ...gaps.invalid].slice(0, 3).map((gap) => `${gap.sku} — ${gap.label}: ${gap.message || "Complete this field with a valid template value."}`).join(" "));
    }
    await db().$transaction(
      async (tx) => {
        const lock = await tx.product.updateMany({
          where: {
            id,
            workspaceId: access.workspace.id,
            updatedAt: new Date(input.updatedAt),
          },
          data: { updatedAt: new Date(Math.max(Date.now(), new Date(input.updatedAt).getTime() + 1)) },
        });
        if (!lock.count)
          throw new HttpError(409, "The listing changed. Review again.");
        // Serialize brand changes with approval so a concurrent context edit cannot leave stale approval.
        const brandLock = await tx.brandContext.updateMany({
          where: {
            id: access.workspace.brandContext!.id,
            updatedAt: access.workspace.brandContext!.updatedAt,
          },
          data: { updatedAt: new Date() },
        });
        if (!brandLock.count)
          throw new HttpError(409, "Brand context changed. Review again.");
        const listings = await tx.marketplaceListing.findMany({
          where: {
            workspaceId: access.workspace.id,
            variant: { productId: id, deletedAt: null },
          },
          include: { revisions: { orderBy: { number: "desc" }, take: 1 } },
        });
        if (!listings.length) throw new HttpError(400, "No listing is available for review.");
        for (const listing of listings) {
          const revision = listing.revisions[0];
          if (!revision) throw new HttpError(400, "Save listing content before approval.");
          const validation = await tx.validationRun.create({
            data: {
              revisionId: revision.id,
              workspaceId: access.workspace.id,
              status: "PASSED",
              rulesetVersion: "local-review-v1-not-marketplace-compliance",
              score: auditScore(checks),
              warnings: json(checks.filter((c) => !c.passed)),
              completedAt: new Date(),
            },
          });
          const previous = await tx.listingApproval.findFirst({
            where: { revisionId: revision.id, revokedAt: null },
          });
          if (!previous)
            await tx.listingApproval.create({
              data: {
                revisionId: revision.id,
                workspaceId: access.workspace.id,
                validationRunId: validation.id,
                approvedById: access.user.id,
              },
            });
          await tx.marketplaceListing.update({ where: { id: listing.id }, data: { status: "READY" } });
        }
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json(await readWorkspace(await workspaceAccess(), [id]));
  } catch (e) {
    return apiError(e);
  }
}
