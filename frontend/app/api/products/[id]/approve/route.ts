// Human review records approval of the current immutable revision after server-side checks.
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { workspaceAccess, requireOrigin, HttpError } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { readWorkspace, json } from "@/lib/server/catalog";
import { auditListing, auditScore } from "@/lib/validation";
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
    const product = (await readWorkspace(access)).products.find(
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
    await db().$transaction(
      async (tx) => {
        const lock = await tx.product.updateMany({
          where: {
            id,
            workspaceId: access.workspace.id,
            updatedAt: new Date(input.updatedAt),
          },
          data: { updatedAt: new Date() },
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
        for (const listing of listings) {
          const revision = listing.revisions[0];
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
        }
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json(await readWorkspace(await workspaceAccess()));
  } catch (e) {
    return apiError(e);
  }
}
