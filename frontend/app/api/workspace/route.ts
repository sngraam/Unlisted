// Authenticated workspace read/settings edits; workspace IDs come from membership, not request data.
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { workspaceAccess, requireOrigin, HttpError } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { readWorkspace } from "@/lib/server/catalog";
import { brandInput, onboardingInput, profileInput } from "@/lib/server/contracts";
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
        await tx.brandContext.upsert({
          where: { workspaceId: access.workspace.id },
          create: {
            workspaceId: access.workspace.id,
            name: b.name,
            tone: b.tone,
            glossary: { text: b.glossary },
            bannedTerms: b.bannedTerms
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            painPoints: b.painPoints,
            revenueRange: b.revenueRange || null,
            competitors: b.competitors.split(",").map((s) => s.trim()).filter(Boolean),
            targetAgeMin: b.targetAgeMin ? Number(b.targetAgeMin) : null,
            targetAgeMax: b.targetAgeMax ? Number(b.targetAgeMax) : null,
            targetCountries: b.targetCountries.split(",").map((s) => s.trim()).filter(Boolean),
          },
          update: {
            name: b.name,
            tone: b.tone,
            glossary: { text: b.glossary },
            bannedTerms: b.bannedTerms.split(",").map((s) => s.trim()).filter(Boolean),
            painPoints: b.painPoints,
            revenueRange: b.revenueRange || null,
            competitors: b.competitors.split(",").map((s) => s.trim()).filter(Boolean),
            targetAgeMin: b.targetAgeMin ? Number(b.targetAgeMin) : null,
            targetAgeMax: b.targetAgeMax ? Number(b.targetAgeMax) : null,
            targetCountries: b.targetCountries.split(",").map((s) => s.trim()).filter(Boolean),
          },
        });
        await tx.workspace.update({ where: { id: access.workspace.id }, data: { name: b.name } });
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
        if (p.workspace) await tx.workspace.update({ where: { id: access.workspace.id }, data: { name: p.workspace } });
        if (p.team) await tx.team.update({ where: { id: access.workspace.teamId }, data: { name: p.team } });
      } else if (input.onboarding) {
        const onboarding = onboardingInput.parse(input.onboarding);
        const source = onboarding.source === "cold-call" ? "COLD_CALL" : onboarding.source === "cold-email" ? "COLD_EMAIL" : onboarding.source.toUpperCase();
        await tx.workspaceOnboarding.upsert({
          where: { workspaceId: access.workspace.id },
          create: {
            workspaceId: access.workspace.id,
            userId: access.user.id,
            status: "COMPLETED",
            currentStep: 4,
            isOwner: access.user.id === access.workspace.team.createdById,
            acquisitionSource: source as "GOOGLE" | "COLD_CALL" | "FACEBOOK" | "COLD_EMAIL" | "INSTAGRAM" | "OTHER",
            acquisitionOther: onboarding.other || null,
            requestedMarketplaces: onboarding.marketplaces.map((marketplace) => marketplace === "Amazon" ? "AMAZON" : "FLIPKART"),
            completedAt: new Date(),
          },
          update: {
            status: "COMPLETED",
            currentStep: 4,
            acquisitionSource: source as "GOOGLE" | "COLD_CALL" | "FACEBOOK" | "COLD_EMAIL" | "INSTAGRAM" | "OTHER",
            acquisitionOther: onboarding.other || null,
            requestedMarketplaces: onboarding.marketplaces.map((marketplace) => marketplace === "Amazon" ? "AMAZON" : "FLIPKART"),
            completedAt: new Date(),
          },
        });
      } else throw new HttpError(400, "Provide brand or profile settings.");
    });
    return NextResponse.json(await readWorkspace(await workspaceAccess()));
  } catch (e) {
    return apiError(e);
  }
}
