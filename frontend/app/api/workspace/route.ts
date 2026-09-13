// Authenticated workspace read/settings edits; workspace IDs come from membership, not request data.
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { workspaceAccess, requireOrigin, HttpError } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { readWorkspace } from "@/lib/server/catalog";
import { brandInput, profileInput } from "@/lib/server/contracts";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await readWorkspace(await workspaceAccess()), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    requireOrigin(request);
    const access = await workspaceAccess(true);
    if (!["OWNER", "ADMIN"].includes(access.role))
      throw new HttpError(
        403,
        "Only workspace administrators can change settings.",
      );
    const input = await readJson(request);
    await db().$transaction(async (tx) => {
      if (input.brand) {
        const b = brandInput.parse(input.brand);
        await tx.brandContext.update({
          where: { workspaceId: access.workspace.id },
          data: {
            name: b.name,
            tone: b.tone,
            glossary: { text: b.glossary },
            bannedTerms: b.bannedTerms
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            painPoints: b.painPoints,
          },
        });
        await tx.listingApproval.updateMany({
          where: { workspaceId: access.workspace.id, revokedAt: null },
          data: {
            revokedAt: new Date(),
            revocationReason: "Brand context changed",
          },
        });
      } else if (input.profile) {
        const p = profileInput.parse(input.profile);
        if (p.email !== access.user.email)
          throw new HttpError(
            400,
            "Email changes require verification and are not available yet.",
          );
        await tx.user.update({
          where: { id: access.user.id },
          data: {
            displayName: p.name,
            accountType:
              p.type === "Agency"
                ? "AGENCY"
                : p.type === "Freelance"
                  ? "FREELANCE"
                  : "INDIVIDUAL",
          },
        });
        await tx.workspace.update({
          where: { id: access.workspace.id },
          data: { name: p.workspace },
        });
        await tx.team.update({
          where: { id: access.workspace.teamId },
          data: { name: p.team },
        });
      } else throw new HttpError(400, "Provide brand or profile settings.");
    });
    return NextResponse.json(await readWorkspace(await workspaceAccess()));
  } catch (e) {
    return apiError(e);
  }
}
