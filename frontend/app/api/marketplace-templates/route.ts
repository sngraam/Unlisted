// Authenticated category metadata for the dynamic product editor; never returns XLSM macros.
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { workspaceAccess, HttpError } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { templateDefinitions } from "@/lib/marketplace-template";
import type { MarketplaceTemplate } from "@/types/marketplace-template";

export async function GET(request: Request) {
  try {
    await workspaceAccess();
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    const productType = params.get("productType");
    if (id && productType)
      throw new HttpError(400, "Choose either template ID or product type.");
    const scope = {
      platform: "AMAZON" as const,
      marketplaceId: "A21TJRUUN4KGV",
      language: "en_IN",
    };
    if (id || productType) {
      const template = id
        ? await db().marketplaceTemplate.findUnique({ where: { id: z.uuid().parse(id) } })
        : await db().marketplaceTemplate.findFirst({
            where: {
              ...scope,
              productType: z.string().regex(/^[A-Z][A-Z0-9_]{1,119}$/).parse(productType),
              isActive: true,
            },
          });
      if (!template || template.platform !== "AMAZON" || template.marketplaceId !== scope.marketplaceId)
        throw new HttpError(404, "Amazon category template not found.");
      return NextResponse.json(
        {
          template: {
            id: template.id,
            productType: template.productType,
            marketplaceId: template.marketplaceId,
            language: template.language,
            fieldCount: template.fieldCount,
            definitionCount: templateDefinitions(template as unknown as MarketplaceTemplate).length,
            schemaSha256: template.schemaSha256,
            isActive: template.isActive,
            fields: template.fields,
            browseNodes: template.browseNodes,
            sourceMetadata: template.sourceMetadata,
          },
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const templates = await db().marketplaceTemplate.findMany({
      where: { ...scope, isActive: true },
      orderBy: { productType: "asc" },
      select: {
        id: true,
        productType: true,
        marketplaceId: true,
        language: true,
        fieldCount: true,
        schemaSha256: true,
      },
    });
    return NextResponse.json({ templates }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
